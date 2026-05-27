"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchAgentWithRetry,
  getRetryPolicyForAgent,
  isRetryableError,
} from "./agent-retry";
import {
  AGENT_DEFINITIONS,
  clearAgentRetryState,
  createInitialProject,
  getAgentIndex,
  markAgentAutoRecovered,
  markAgentFallbackUsed,
  markAgentProviderFallback,
  mergeAgentOutput,
  resetFromAgent,
  setAgentRetryState,
  setAgentStatus,
} from "./agents";
import { setChapterDraftStatus, updateChapterDraft } from "./chapter-draft";
import { DEFAULT_GEMMA_MODEL } from "./gemma-model";
import { DEFAULT_AI_MODEL, normalizeAiModel } from "./ai-model-utils";
import type { LlmStatus } from "./llm-config";
import {
  JUDGE_DEMO_REQUIRES_STRUCTURE_APPROVAL,
  JUDGE_DEMO_SETTINGS,
} from "./demo";
import { formatLiveGenerationError } from "./format-generation-error";
import {
  getChapterDraftCoverage,
  rebuildProjectManuscript,
} from "./format-manuscript";
import { distributeLength, syncStructureTotal } from "./length-planning";
import {
  applyFallbackChapterOutlineToProject,
  canContinuePipeline,
  pauseForStructureApproval,
  shouldPauseForStructureApproval,
  type PipelineRunOptions,
} from "./pipeline-recovery";
import {
  applyChapterLengthPreset,
  resolveChapterLengthPreset,
} from "./chapter-length-presets";
import { presetToTargetLength } from "./structure-chapter-defaults";
import { buildDefaultStructure } from "./structure-presets";
import { getAllChapters, syncPartsAndChapters } from "./structure-utils";
import { fetchExpandChapter, fetchGenerateChapter } from "./workflow-api";
import { countByUnit, getLengthStatus } from "./text-length";
import {
  getChaptersToGenerate,
  getNextUnfinishedChapter,
  getOrderedChapters,
} from "./chapter-generation-utils";
import {
  buildChapterDraftStates,
  buildPlanningElements,
  getFailedChapterNumbers,
  getMissingChapterNumbers,
  hydrateWorkflowFields,
  isPlanningComplete,
  mergeStoryBiblePatch,
  planningElementToAgentId,
} from "./workflow-utils";
import type {
  AgentId,
  PartPlan,
  PlanningElementId,
  ProjectSettings,
  StoryBible,
  StoryProject,
  StoryStructureSettings,
  WorkflowStage,
} from "./types";

const DEFAULT_SETTINGS: ProjectSettings = {
  userPrompt:
    "Write a melancholic sci-fi mystery set in modern Tokyo. The protagonist is a graduate student who lost his memory. The story involves a disappearance in a quantum computing lab.",
  language: "en",
  genre: "sci-fi",
  tone: "melancholic",
  targetLength: "short-story",
  structure: buildDefaultStructure("en", "short-3"),
  aiModel: DEFAULT_AI_MODEL,
};

function normalizeSettings(settings: ProjectSettings): ProjectSettings {
  const preset = resolveChapterLengthPreset(settings.structure);
  let structure = syncStructureTotal({
    ...settings.structure,
    chapterLengthPreset: preset,
    customPerChapterLengthEnabled:
      settings.structure.customPerChapterLengthEnabled ?? false,
  });
  if (!structure.customPerChapterLengthEnabled) {
    structure = applyChapterLengthPreset(
      structure,
      settings.language,
      preset
    );
  }
  return {
    ...settings,
    structure,
    targetLength:
      settings.targetLength ?? presetToTargetLength(structure.presetId),
    aiModel: normalizeAiModel(settings.aiModel),
  };
}

const FINAL_AGENT_START_INDEX = getAgentIndex("editor");
const PLANNING_AGENT_IDS: AgentId[] = [
  "concept",
  "character",
  "worldbuilding",
  "plot",
  "chapter-outline",
];
const DRAFT_CHAPTER_TIMEOUT_MS = 45_000;

function setWorkflowStage(
  project: StoryProject,
  stage: WorkflowStage
): StoryProject {
  return hydrateWorkflowFields({
    ...project,
    workflowStage: stage,
    updatedAt: new Date().toISOString(),
  });
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  onTimeout: () => Error
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(onTimeout()), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (err) => {
        clearTimeout(timeoutId);
        reject(err);
      }
    );
  });
}

export function useStoryProject() {
  const [settings, setSettings] = useState<ProjectSettings>(DEFAULT_SETTINGS);
  const [project, setProject] = useState<StoryProject | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [mockMode, setMockMode] = useState(true);
  const [llmStatus, setLlmStatus] = useState<LlmStatus | null>(null);
  const [llmProvider, setLlmProvider] = useState("openrouter");
  const [llmModel, setLlmModel] = useState(DEFAULT_GEMMA_MODEL);
  const [isGeneratingChapters, setIsGeneratingChapters] = useState(false);
  const [activeChapterNumber, setActiveChapterNumber] = useState<
    number | undefined
  >(undefined);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d: LlmStatus) => {
        setLlmStatus(d);
        if (typeof d.mockMode === "boolean") setMockMode(d.mockMode);
        if (d.primaryDisplayName) setLlmProvider(d.primaryDisplayName);
        else if (d.primaryProvider) setLlmProvider(d.primaryProvider);
        if (d.model) setLlmModel(d.model);
      })
      .catch(() => {});
  }, []);

  const resolveGenerationError = useCallback(
    (
      raw: string,
      liveMode: boolean,
      provider: string,
      model: string,
      agentId?: AgentId
    ) => {
      if (!liveMode) return raw;
      if (raw.startsWith("Live generation failed")) return raw;
      if (raw.startsWith("Chapter Architect failed")) return raw;
      return formatLiveGenerationError(raw, provider, model, agentId);
    },
    []
  );

  const executeAgentStep = useCallback(
    async (
      startProject: StoryProject,
      agentId: AgentId,
      controller: AbortController
    ): Promise<StoryProject> => {
      const policy = getRetryPolicyForAgent(agentId);
      let current = setAgentStatus(startProject, agentId, "running", {
        retryCount: undefined,
        maxRetries: policy.maxRetries,
        lastRetryError: undefined,
        error: undefined,
        autoRecovered: undefined,
        fallbackUsed: undefined,
      });
      setProject({ ...current });

      const hadRetriesRef = { value: false };

      try {
        const data = await fetchAgentWithRetry(
          agentId,
          current,
          controller.signal,
          {
            maxRetries: policy.maxRetries,
            retryDelayMs: policy.retryDelayMs,
            onRetry: (attempt, error) => {
              hadRetriesRef.value = true;
              current = setAgentRetryState(
                current,
                agentId,
                attempt,
                policy.maxRetries,
                error.message
              );
              setProject({ ...current });
            },
          }
        );
        setMockMode(data.mockMode);
        current = mergeAgentOutput(current, agentId, data.output);
        if (data.fallbackUsed) {
          current = markAgentFallbackUsed(current, agentId);
          if (agentId === "chapter-outline") {
            current = { ...current, structureFallbackUsed: true };
          }
        }
        if (data.providerUsed) {
          current = markAgentProviderFallback(current, agentId, {
            providerUsed: data.providerUsed,
            fallbackProviderUsed: data.providerFallbackUsed,
          });
        }
        current = clearAgentRetryState(current, agentId);
        if (hadRetriesRef.value) {
          current = markAgentAutoRecovered(current, agentId);
        }
        return current;
      } catch (err) {
        if (
          agentId === "chapter-outline" &&
          isRetryableError(err instanceof Error ? err.message : String(err))
        ) {
          return applyFallbackChapterOutlineToProject(current);
        }
        throw err;
      }
    },
    []
  );

  const generateChapterWithProject = useCallback(
    async (
      currentProject: StoryProject,
      chapterNumber: number,
      controller: AbortController
    ): Promise<StoryProject> => {
      const now = new Date().toISOString();
      let next = setChapterDraftStatus(currentProject, chapterNumber, "generating", {
        error: undefined,
        lastGeneratedAt: now,
      });
      setActiveChapterNumber(chapterNumber);
      setProject({ ...next });

      const data = await withTimeout(
        fetchGenerateChapter(next, chapterNumber, controller.signal),
        DRAFT_CHAPTER_TIMEOUT_MS,
        () =>
          new Error(
            `Drafting timed out at chapter ${chapterNumber}. Try reducing approximate chapter length or switching to a cheaper/smaller model.`
          )
      );
      if (typeof data.mockMode === "boolean") setMockMode(data.mockMode);

      next = data.project
        ? hydrateWorkflowFields(data.project)
        : updateChapterDraft(next, chapterNumber, {
            draft: data.draft,
            title: data.title,
            chapterSummary: data.chapterSummary,
            continuityNotes: data.continuityNotes,
            status: "completed",
            lastGeneratedAt: now,
          });

      if (
        chapterNumber === 1 &&
        next.title === "Untitled Project" &&
        data.title
      ) {
        next = { ...next, title: data.title };
      }

      const generatedChapter = getOrderedChapters(next).find(
        (item) => item.number === chapterNumber
      );
      const targetLength = generatedChapter?.lengthPlan?.targetLength ?? 0;
      const unit = generatedChapter?.lengthPlan?.unit ?? next.structure.lengthUnit;
      const actualLength = countByUnit(generatedChapter?.draft ?? "", unit);
      const lengthStatus =
        targetLength > 0 ? getLengthStatus(actualLength, targetLength) : undefined;
      const tooShortForAutoExpand =
        targetLength > 0 && actualLength < Math.floor(targetLength * 0.75);

      if (tooShortForAutoExpand) {
        const expanded = await withTimeout(
          fetchExpandChapter(next, chapterNumber, controller.signal),
          DRAFT_CHAPTER_TIMEOUT_MS,
          () =>
            new Error(
              `Expansion timed out at chapter ${chapterNumber}.`
            )
        );
        const expandedLength = countByUnit(expanded.draft, unit);
        const expandedStatus =
          targetLength > 0
            ? getLengthStatus(expandedLength, targetLength)
            : undefined;
        const reachedThreshold = expandedLength >= Math.floor(targetLength * 0.85);

        next = updateChapterDraft(next, chapterNumber, {
          draft: expanded.draft,
          status: "completed",
          lastGeneratedAt: now,
          lengthStatus: expandedStatus,
          needsExpansion: !reachedThreshold,
          lengthWarning: reachedThreshold
            ? undefined
            : "Still under target after expansion",
        });
      } else {
        next = updateChapterDraft(next, chapterNumber, {
          status: "completed",
          lastGeneratedAt: now,
          lengthStatus,
          needsExpansion: lengthStatus === "too-short",
          lengthWarning:
            lengthStatus === "too-short"
              ? `Chapter ${chapterNumber} is far below target length.`
              : undefined,
        });
      }
      return next;
    },
    []
  );

  const runDraftingPhase = useCallback(
    async (
      startProject: StoryProject,
      controller: AbortController,
      options?: {
        forceRegenerate?: boolean;
        stopOnFailure?: boolean;
        chapterNumbers?: number[];
        includeTooShort?: boolean;
      }
    ): Promise<StoryProject> => {
      const policy = getRetryPolicyForAgent("drafting");
      let currentProject = setAgentStatus(startProject, "drafting", "running", {
        maxRetries: policy.maxRetries,
        error: undefined,
      });
      currentProject = setWorkflowStage(currentProject, "drafting");
      setProject({ ...currentProject });

      const ordered = getOrderedChapters(currentProject);
      const total = ordered.length;
      const explicit = options?.chapterNumbers;
      const chapterSequence = explicit
        ? ordered.filter((chapter) => explicit.includes(chapter.number))
        : [];
      const initialToGenerate = explicit
        ? chapterSequence
        : getChaptersToGenerate(currentProject, {
            includeFailed: true,
            includeTooShort: options?.includeTooShort ?? true,
            forceAll: options?.forceRegenerate,
          });
      const completedChapters = ordered
        .filter(
          (chapter) =>
            !initialToGenerate.some((target) => target.number === chapter.number)
        )
        .filter((chapter) => Boolean(chapter.draft?.trim()))
        .map((chapter) => chapter.number);

      const longChapterWarning = ordered.some((chapter) => {
        const target = chapter.lengthPlan?.targetLength ?? 0;
        if (!target) return false;
        return currentProject.language === "ja" ? target > 8000 : target > 3000;
      })
        ? "This chapter is long and may fail depending on model limits."
        : undefined;

      setIsGeneratingChapters(true);
      const attemptedChapters = new Set<number>();
      try {
        for (let index = 0; ; index++) {
          const chapter = explicit
            ? chapterSequence[index]
            : getChaptersToGenerate(currentProject, {
                includeFailed: true,
                includeTooShort: options?.includeTooShort ?? true,
                forceAll: options?.forceRegenerate,
              }).find((item) => !attemptedChapters.has(item.number));
          if (!chapter) break;
          if (controller.signal.aborted) break;
          attemptedChapters.add(chapter.number);
          console.info("[CHAPTER_GENERATION_ORDER]", {
            chapterNumber: chapter.number,
            index,
            total: explicit ? chapterSequence.length : total,
          });

          currentProject = {
            ...currentProject,
            draftingProgress: {
              currentChapter: chapter.number,
              totalChapters: total,
              completedChapters: [...completedChapters],
              retryCount: 0,
              maxRetries: policy.maxRetries,
              status: "running",
              warning: longChapterWarning,
            },
          };
          setProject({ ...currentProject });

          try {
            currentProject = await generateChapterWithProject(
              currentProject,
              chapter.number,
              controller
            );
            completedChapters.push(chapter.number);
            currentProject = {
              ...currentProject,
              draftingProgress: {
                currentChapter: chapter.number,
                totalChapters: total,
                completedChapters: [...completedChapters],
                maxRetries: policy.maxRetries,
                status:
                  completedChapters.length >= (explicit ? chapterSequence.length : total)
                    ? "completed"
                    : "running",
                warning: longChapterWarning,
              },
            };
            setProject({ ...hydrateWorkflowFields(currentProject) });
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Drafting failed";
            const isOpenRouter402 =
              /\b402\b|prompt tokens|max_tokens|requires more credits|insufficient credits/i.test(
                msg
              );
            currentProject = setChapterDraftStatus(
              currentProject,
              chapter.number,
              "failed",
              {
                error: msg,
              }
            );
            currentProject = {
              ...currentProject,
              draftingProgress: {
                currentChapter: chapter.number,
                totalChapters: total,
                completedChapters: [...completedChapters],
                failedChapter: chapter.number,
                maxRetries: policy.maxRetries,
                status: "failed",
                warning: longChapterWarning,
              },
            };
            setProject({ ...currentProject });
            if (options?.stopOnFailure !== false) {
              if (isOpenRouter402) {
                throw new Error(
                  `Prose Writer failed at chapter ${chapter.number} because OpenRouter rejected the request. Reduce chapter length, add credits, or use a cheaper model.`
                );
              }
              throw new Error(
                `Drafting failed at chapter ${chapter.number}. ${msg}`
              );
            }
          }
        }
      } finally {
        setIsGeneratingChapters(false);
        setActiveChapterNumber(undefined);
      }

      const coverage = getChapterDraftCoverage(currentProject);
      currentProject = rebuildProjectManuscript(currentProject);
      const draftingComplete =
        coverage.expected > 0 && coverage.drafted >= coverage.expected;
      const now = new Date().toISOString();
      const agents = currentProject.agents.map((agent) =>
        agent.id === "drafting"
          ? {
              ...agent,
              status: draftingComplete
                ? ("completed" as const)
                : ("running" as const),
              completedAt: draftingComplete ? now : undefined,
              error: undefined,
            }
          : agent
      );
      currentProject = hydrateWorkflowFields({
        ...currentProject,
        agents,
        draftingProgress: {
          currentChapter: total,
          totalChapters: total,
          completedChapters: [...completedChapters],
          status: draftingComplete ? "completed" : "failed",
          maxRetries: policy.maxRetries,
          warning: coverage.warning ?? longChapterWarning,
          failedChapter: draftingComplete
            ? undefined
            : currentProject.draftingProgress?.failedChapter,
        },
        updatedAt: now,
      });
      setProject({ ...currentProject });
      return currentProject;
    },
    [generateChapterWithProject]
  );

  const runPlanningPipeline = useCallback(
    async (startProject: StoryProject, controller: AbortController) => {
      let current = setWorkflowStage(startProject, "planning");
      setProject({ ...current });

      for (const agentId of PLANNING_AGENT_IDS) {
        if (controller.signal.aborted) break;
        try {
          current = await executeAgentStep(current, agentId, controller);
          current = {
            ...current,
            planningElements: buildPlanningElements(current),
          };
          setProject({ ...current });
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") break;
          const raw =
            err instanceof Error ? err.message : "Generation failed";
          current = setAgentStatus(current, agentId, "failed", {
            error: resolveGenerationError(
              raw,
              !mockMode,
              llmProvider,
              llmModel,
              agentId
            ),
          });
          current = {
            ...current,
            planningElements: buildPlanningElements(current),
          };
          setProject({ ...current });
          break;
        }
      }

      current = setWorkflowStage(
        {
          ...current,
          structureApproved: true,
          awaitingStructureApproval: false,
        },
        "planning"
      );
      setProject({ ...current });
      return current;
    },
    [executeAgentStep, llmModel, llmProvider, mockMode, resolveGenerationError]
  );

  const runPipelineFromIndex = useCallback(
    async (
      startProject: StoryProject,
      startIdx: number,
      options?: PipelineRunOptions
    ) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsRunning(true);

      let current = startProject;
      let intentionalPause = false;

      try {
        for (let i = startIdx; i < AGENT_DEFINITIONS.length; i++) {
          if (controller.signal.aborted) break;

          const agentId = AGENT_DEFINITIONS[i].id;

          if (agentId === "drafting") {
            current = await runDraftingPhase(current, controller);
            setProject({ ...current });
            if (controller.signal.aborted) break;
            continue;
          }

          try {
            current = await executeAgentStep(current, agentId, controller);
            setProject({ ...current });

            if (
              agentId === "chapter-outline" &&
              shouldPauseForStructureApproval(current, options)
            ) {
              current = pauseForStructureApproval(current);
              setProject({ ...current });
              intentionalPause = true;
              setIsRunning(false);
              abortRef.current = null;
              return;
            }
          } catch (err) {
            if (err instanceof Error && err.name === "AbortError") {
              setProject((p) => {
                if (!p) return p;
                const running = p.agents.find((a) => a.status === "running");
                if (!running) return p;
                const next = setAgentStatus(p, running.id, "pending", {
                  startedAt: undefined,
                });
                if (running.id !== "drafting") return next;
                return {
                  ...next,
                  draftingProgress: p.draftingProgress
                    ? {
                        ...p.draftingProgress,
                        status: "failed",
                        failedChapter: p.draftingProgress.currentChapter,
                        cancelled: true,
                      }
                    : p.draftingProgress,
                };
              });
              break;
            }

            const raw =
              err instanceof Error ? err.message : "Generation failed";
            const failedAgentId = AGENT_DEFINITIONS[i].id;
            setProject((p) => {
              if (!p) return p;
              const policy = getRetryPolicyForAgent(failedAgentId);
              const message = resolveGenerationError(
                raw,
                !mockMode,
                llmProvider,
                llmModel,
                failedAgentId
              );
              return setAgentStatus(p, failedAgentId, "failed", {
                error: message,
                retryCount: policy.maxRetries,
                maxRetries: policy.maxRetries,
                lastRetryError: raw,
              });
            });
            break;
          }
        }
      } finally {
        if (!intentionalPause && !current.awaitingStructureApproval) {
          setIsRunning(false);
          abortRef.current = null;
        }
      }
    },
    [
      executeAgentStep,
      llmModel,
      llmProvider,
      mockMode,
      resolveGenerationError,
      runDraftingPhase,
    ]
  );

  const runPipeline = useCallback(
    async (
      startProject: StoryProject,
      fromAgentId?: AgentId,
      options?: PipelineRunOptions
    ) => {
      const startIdx = fromAgentId
        ? AGENT_DEFINITIONS.findIndex((a) => a.id === fromAgentId)
        : 0;
      await runPipelineFromIndex(startProject, startIdx, options);
    },
    [runPipelineFromIndex]
  );

  const startPlanning = useCallback(
    async (
      nextSettings: ProjectSettings,
      options?: {
        requiresStructureApproval?: boolean;
      }
    ) => {
      setSettings(nextSettings);
      const initial = hydrateWorkflowFields(
        createInitialProject(normalizeSettings(nextSettings), {
          requiresStructureApproval: options?.requiresStructureApproval,
        })
      );
      const controller = new AbortController();
      abortRef.current = controller;
      setProject(initial);
      setIsRunning(true);
      try {
        await runPlanningPipeline(initial, controller);
      } finally {
        setIsRunning(false);
        abortRef.current = null;
      }
    },
    [runPlanningPipeline]
  );

  const generateStory = useCallback(async () => {
    await startPlanning(settings);
  }, [settings, startPlanning]);

  const runJudgeDemo = useCallback(async () => {
    await startPlanning(JUDGE_DEMO_SETTINGS, {
      requiresStructureApproval: JUDGE_DEMO_REQUIRES_STRUCTURE_APPROVAL,
    });
  }, [startPlanning]);

  const approvePlanningAndGoToDrafting = useCallback(async () => {
    if (!project) return;
    const chapters = getOrderedChapters(project);
    if (chapters.length === 0) return;

    const chapterDrafts = buildChapterDraftStates(project).map((d) => ({
      ...d,
      status:
        d.status === "completed" || d.status === "edited"
          ? d.status
          : ("pending" as const),
    }));

    const updated = setWorkflowStage(
      {
        ...project,
        structureApproved: true,
        awaitingStructureApproval: false,
        chapterDrafts,
      },
      "drafting"
    );
    setProject(updated);
  }, [project]);

  const approveStructureAndContinue = approvePlanningAndGoToDrafting;

  const continuePipeline = useCallback(async () => {
    if (!project || isRunning) return;
    const idx = project.agents.findIndex((a) => a.status !== "completed");
    if (idx < 0) return;
    await runPipelineFromIndex(project, idx, {
      skipStructurePause:
        project.requiresStructureApproval === false ||
        project.structureApproved === true,
    });
  }, [project, isRunning, runPipelineFromIndex]);

  const generateChapter = useCallback(
    async (chapterNumber: number, opts?: { forceRegenerate?: boolean }) => {
      if (!project || isRunning || isGeneratingChapters) return;
      const controller = new AbortController();
      abortRef.current = controller;
      setIsRunning(true);
      try {
        const drafted = await runDraftingPhase(project, controller, {
          chapterNumbers: [chapterNumber],
          forceRegenerate: opts?.forceRegenerate,
          stopOnFailure: true,
        });
        setProject(drafted);
      } finally {
        setIsRunning(false);
        abortRef.current = null;
      }
    },
    [project, isRunning, isGeneratingChapters, runDraftingPhase]
  );

  const regenerateChapter = useCallback(
    async (chapterNumber: number) => {
      await generateChapter(chapterNumber, { forceRegenerate: true });
    },
    [generateChapter]
  );

  const expandChapter = useCallback(
    async (chapterNumber: number) => {
      if (!project || isRunning || isGeneratingChapters) return;
      const controller = new AbortController();
      abortRef.current = controller;
      setIsRunning(true);
      setIsGeneratingChapters(true);
      setActiveChapterNumber(chapterNumber);
      try {
        const expanded = await withTimeout(
          fetchExpandChapter(project, chapterNumber, controller.signal),
          DRAFT_CHAPTER_TIMEOUT_MS,
          () =>
            new Error(
              `Expansion timed out at chapter ${chapterNumber}.`
            )
        );
        const chapter = getOrderedChapters(project).find(
          (item) => item.number === chapterNumber
        );
        const target = chapter?.lengthPlan?.targetLength ?? 0;
        const unit = chapter?.lengthPlan?.unit ?? project.structure.lengthUnit;
        const actual = countByUnit(expanded.draft, unit);
        const lengthStatus = target > 0 ? getLengthStatus(actual, target) : undefined;
        const reachedThreshold = target > 0 ? actual >= Math.floor(target * 0.85) : true;
        const next = hydrateWorkflowFields(
          updateChapterDraft(project, chapterNumber, {
            draft: expanded.draft,
            status: "completed",
            lengthStatus,
            needsExpansion: !reachedThreshold,
            lengthWarning: reachedThreshold
              ? undefined
              : "Still under target after expansion",
          })
        );
        setProject(next);
      } finally {
        setIsRunning(false);
        setIsGeneratingChapters(false);
        setActiveChapterNumber(undefined);
        abortRef.current = null;
      }
    },
    [project, isRunning, isGeneratingChapters]
  );

  const generateRemainingChapters = useCallback(async () => {
    if (!project || isRunning || isGeneratingChapters) return;
    const pending = getChaptersToGenerate(project, {
      includeFailed: true,
      includeTooShort: true,
    });
    if (pending.length === 0) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setIsRunning(true);
    try {
      const drafted = await runDraftingPhase(project, controller, {
        stopOnFailure: false,
        includeTooShort: true,
      });
      setProject(drafted);
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, [project, isRunning, isGeneratingChapters, runDraftingPhase]);

  const resumeDrafting = generateRemainingChapters;

  const resumeDraftingFromChapter = useCallback(
    async (chapterNumber: number) => {
      await generateChapter(chapterNumber);
    },
    [generateChapter]
  );

  const continueDrafting = useCallback(async () => {
    if (!project) return;
    const next = getNextUnfinishedChapter(project);
    if (next) {
      await generateChapter(next.number);
      return;
    }
    await generateRemainingChapters();
  }, [project, generateChapter, generateRemainingChapters]);

  const finalizeManuscript = useCallback(async () => {
    if (!project || isRunning) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setIsRunning(true);
    try {
      const current = rebuildProjectManuscript(project);
      await runPipelineFromIndex(current, FINAL_AGENT_START_INDEX, {
        skipStructurePause: true,
      });
      setProject((p) => (p ? setWorkflowStage(p, "final") : p));
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, [project, isRunning, runPipelineFromIndex]);

  const goToStage = useCallback((stage: WorkflowStage) => {
    setProject((p) => (p ? setWorkflowStage(p, stage) : p));
  }, []);

  const regeneratePlanningElement = useCallback(
    async (elementId: PlanningElementId) => {
      if (!project || isRunning) return;
      const agentId = planningElementToAgentId(elementId);
      const reset = resetFromAgent(project, agentId);
      const controller = new AbortController();
      abortRef.current = controller;
      setIsRunning(true);
      try {
        let current = await executeAgentStep(reset, agentId, controller);
        current = {
          ...current,
          planningElements: buildPlanningElements(current),
        };
        setProject(setWorkflowStage(current, "planning"));
      } finally {
        setIsRunning(false);
        abortRef.current = null;
      }
    },
    [project, isRunning, executeAgentStep]
  );

  const applyPlanningEdit = useCallback(
    (elementId: PlanningElementId, data: unknown) => {
      setProject((p) => {
        if (!p) return p;
        let updated = p;
        const bible = { ...p.storyBible };
        switch (elementId) {
          case "concept":
            bible.concept = data as StoryBible["concept"];
            break;
          case "characters":
            bible.characters = data as StoryBible["characters"];
            break;
          case "worldbuilding":
            bible.worldbuilding = data as StoryBible["worldbuilding"];
            break;
          case "plot":
            bible.plot = data as StoryBible["plot"];
            break;
          case "structure": {
            const s = data as { parts?: PartPlan[]; chapters?: typeof bible.chapters };
            if (s.parts) {
              const synced = syncPartsAndChapters(s.parts);
              bible.parts = synced.parts;
              bible.chapters = synced.chapters;
              updated = {
                ...updated,
                structure: syncStructureTotal({
                  ...updated.structure,
                  parts: synced.parts,
                }),
              };
            }
            break;
          }
          case "styleGuide":
            bible.styleGuide = data as StoryBible["styleGuide"];
            break;
          case "foreshadowing":
            bible.foreshadowingTracker =
              data as StoryBible["foreshadowingTracker"];
            break;
        }
        const elements = buildPlanningElements({
          ...updated,
          storyBible: bible,
        }).map((el) =>
          el.id === elementId
            ? { ...el, status: "edited" as const, data }
            : el
        );
        return hydrateWorkflowFields({
          ...updated,
          storyBible: bible,
          planningElements: elements,
        });
      });
    },
    []
  );

  const applyPlanPatch = useCallback(
    (patch: Partial<StoryBible>, structureChanged?: boolean) => {
      setProject((p) => {
        if (!p) return p;
        let updated = mergeStoryBiblePatch(p, patch);
        if (structureChanged) {
          updated = {
            ...updated,
            chapterDrafts: buildChapterDraftStates(updated).map((d) => ({
              ...d,
              needsRevision: true,
            })),
          };
        }
        return hydrateWorkflowFields(updated);
      });
    },
    []
  );

  const applyChapterRevision = useCallback(
    (chapterNumber: number, revisedDraft: string) => {
      setProject((p) => {
        if (!p) return p;
        return hydrateWorkflowFields(
          updateChapterDraft(p, chapterNumber, {
            draft: revisedDraft,
            status: "edited",
          })
        );
      });
    },
    []
  );

  const applyChapterEdit = useCallback(
    (chapterNumber: number, draft: string) => {
      setProject((p) => {
        if (!p) return p;
        return hydrateWorkflowFields(
          updateChapterDraft(p, chapterNumber, { draft, status: "edited" })
        );
      });
    },
    []
  );

  const updateStructure = useCallback(
    (parts: PartPlan[], structurePatch?: Partial<StoryStructureSettings>) => {
      setProject((p) => {
        if (!p) return p;
        const synced = syncPartsAndChapters(parts);
        const structure = syncStructureTotal({
          ...p.structure,
          ...structurePatch,
          parts: synced.parts,
          totalChapterCount: synced.chapters.length,
        });
        return {
          ...p,
          structure,
          storyBible: {
            ...p.storyBible,
            parts: synced.parts,
            chapters: synced.chapters,
          },
          updatedAt: new Date().toISOString(),
        };
      });
    },
    []
  );

  const redistributeStructureLength = useCallback(() => {
    setProject((p) => {
      if (!p) return p;
      const total = p.structure.totalTargetLength ?? 0;
      if (!total) return p;
      const distributed = distributeLength(
        total,
        getAllChapters(p),
        p.structure.lengthUnit
      );
      const parts = p.storyBible.parts.map((part) => ({
        ...part,
        chapters: part.chapters.map((ch) => {
          const d = distributed.find((c) => c.number === ch.number);
          return d ?? ch;
        }),
      }));
      const synced = syncPartsAndChapters(parts);
      const structure = syncStructureTotal({
        ...p.structure,
        parts: synced.parts,
      });
      return {
        ...p,
        structure,
        storyBible: {
          ...p.storyBible,
          parts: synced.parts,
          chapters: synced.chapters,
        },
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const applyFallbackChapterOutline = useCallback(async () => {
    if (!project || isRunning) return;
    let updated = applyFallbackChapterOutlineToProject(project);
    setProject(updated);

    if (shouldPauseForStructureApproval(updated, { skipStructurePause: false })) {
      updated = pauseForStructureApproval(updated);
      setProject(updated);
      return;
    }

    const staged = setWorkflowStage(
      {
        ...updated,
        structureApproved: true,
        awaitingStructureApproval: false,
        planningElements: buildPlanningElements(updated),
      },
      "planning"
    );
    setProject(staged);
  }, [project, isRunning]);

  const regenerateStructure = useCallback(async () => {
    if (!project || isRunning) return;
    const reset = resetFromAgent(project, "chapter-outline");
    const cleared: StoryProject = {
      ...reset,
      awaitingStructureApproval: false,
      structureApproved: false,
    };
    setProject(cleared);
    await runPipeline(cleared, "chapter-outline", { skipStructurePause: false });
  }, [project, isRunning, runPipeline]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const resetProject = useCallback(() => {
    abortRef.current?.abort();
    setProject(null);
    setIsRunning(false);
    abortRef.current = null;
  }, []);

  const regenerateAgent = useCallback(
    async (agentId: AgentId) => {
      if (!project || isRunning) return;
      if (agentId === "drafting") {
        const failed = getFailedChapterNumbers(project);
        const missing = getMissingChapterNumbers(project);
        const nextToGenerate = getChaptersToGenerate(project, {
          includeFailed: true,
          includeTooShort: true,
        })[0];
        const target =
          failed[0] ??
          missing[0] ??
          nextToGenerate?.number ??
          project.draftingProgress?.failedChapter;
        if (target != null) {
          await generateChapter(target);
        } else {
          await generateRemainingChapters();
        }
        return;
      }
      const reset = resetFromAgent(project, agentId);
      const skipStructurePause =
        reset.requiresStructureApproval === false ||
        reset.structureApproved === true;

      const cleared: StoryProject = {
        ...reset,
        ...(agentId === "chapter-outline" ||
        getAgentIndex(agentId) < getAgentIndex("chapter-outline")
          ? {
              awaitingStructureApproval: false,
              structureApproved: false,
            }
          : {}),
      };
      setProject(cleared);

      await runPipelineFromIndex(cleared, getAgentIndex(agentId), {
        skipStructurePause:
          agentId === "chapter-outline" ? skipStructurePause : true,
      });
    },
    [project, isRunning, runPipelineFromIndex, generateChapter, generateRemainingChapters]
  );

  const approveAgent = useCallback((agentId: AgentId) => {
    setProject((p) => {
      if (!p) return p;
      const agents = p.agents.map((a) =>
        a.id === agentId ? { ...a, approved: true } : a
      );
      return { ...p, agents, updatedAt: new Date().toISOString() };
    });
  }, []);

  const updateAgentOutput = useCallback(
    (agentId: AgentId, output: unknown) => {
      setProject((p) => {
        if (!p) return p;
        let updated = mergeAgentOutput(p, agentId, output);
        updated = {
          ...updated,
          agents: updated.agents.map((a) =>
            a.id === agentId ? { ...a, approved: false } : a
          ),
        };
        return updated;
      });
    },
    []
  );

  const updateSettings = useCallback(
    (partial: Partial<ProjectSettings>) => {
      setSettings((s) => {
        const next = { ...s, ...partial };
        if (partial.language && next.structure) {
          next.structure = {
            ...next.structure,
            lengthUnit: partial.language === "ja" ? "characters" : "words",
          };
        }
        return next;
      });
    },
    []
  );

  const showContinuePipeline =
    Boolean(project) &&
    !isRunning &&
    !project?.awaitingStructureApproval &&
    project != null &&
    canContinuePipeline(project);
  const showContinueDrafting =
    Boolean(project) &&
    !isRunning &&
    Boolean(project?.draftingProgress?.failedChapter);

  return {
    settings,
    updateSettings,
    project,
    isRunning,
    isGeneratingChapters,
    activeChapterNumber,
    mockMode,
    llmProvider,
    llmModel,
    llmStatus,
    generateStory,
    startPlanning,
    runJudgeDemo,
    stopGeneration,
    resetProject,
    regenerateAgent,
    approveAgent,
    updateAgentOutput,
    approveStructureAndContinue,
    approvePlanningAndGoToDrafting,
    continuePipeline,
    continueDrafting,
    resumeDraftingFromChapter,
    resumeDrafting,
    generateChapter,
    regenerateChapter,
    expandChapter,
    generateRemainingChapters,
    finalizeManuscript,
    goToStage,
    regeneratePlanningElement,
    applyPlanningEdit,
    applyPlanPatch,
    applyChapterRevision,
    applyChapterEdit,
    isPlanningComplete: project ? isPlanningComplete(project) : false,
    showContinuePipeline,
    showContinueDrafting,
    updateStructure,
    redistributeStructureLength,
    regenerateStructure,
    applyFallbackChapterOutline,
  };
}
