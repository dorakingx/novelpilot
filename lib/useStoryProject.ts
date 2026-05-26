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
  mergeChapterDraftOutput,
  resetFromAgent,
  setAgentRetryState,
  setAgentStatus,
} from "./agents";
import { DEFAULT_GEMMA_MODEL } from "./gemma-model";
import { DEFAULT_AI_MODEL, normalizeAiModel } from "./ai-model-utils";
import type { LlmStatus } from "./llm-config";
import {
  JUDGE_DEMO_REQUIRES_STRUCTURE_APPROVAL,
  JUDGE_DEMO_SETTINGS,
} from "./demo";
import { formatLiveGenerationError } from "./format-generation-error";
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
import {
  getAllChapters,
  shouldUseSequentialDrafting,
  syncPartsAndChapters,
} from "./structure-utils";
import type {
  AgentId,
  PartPlan,
  ProjectSettings,
  StoryProject,
  StoryStructureSettings,
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

const DRAFTING_AGENT_INDEX = getAgentIndex("drafting");
const DRAFT_CHAPTER_TIMEOUT_MS = 45_000;

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
          current = { ...current, structureFallbackUsed: true };
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

  const runDraftingPhase = useCallback(
    async (
      startProject: StoryProject,
      controller: AbortController,
      startChapterNumber?: number
    ): Promise<StoryProject> => {
      const policy = getRetryPolicyForAgent("drafting");
      let current = setAgentStatus(startProject, "drafting", "running", {
        maxRetries: policy.maxRetries,
        error: undefined,
      });
      setProject({ ...current });

      const chapters = getAllChapters(current);
      const sequential = shouldUseSequentialDrafting(current.structure);
      const total = chapters.length;
      const completedChapters = chapters
        .filter(
          (ch) =>
            Boolean(ch.draft?.trim()) &&
            (!startChapterNumber || ch.number < startChapterNumber)
        )
        .map((ch) => ch.number);
      const longChapterWarning = chapters.some((ch) => {
        const target = ch.lengthPlan?.targetLength ?? 0;
        if (!target) return false;
        return current.language === "ja" ? target > 8000 : target > 3000;
      })
        ? "This chapter is long and may fail depending on model limits."
        : undefined;

      const runDraftingCall = async (
        projectState: StoryProject,
        chapterNumber?: number
      ) => {
        const hadRetriesRef = { value: false };
        const data = await withTimeout(
          fetchAgentWithRetry("drafting", projectState, controller.signal, {
            draftChapterNumber: chapterNumber,
            maxRetries: policy.maxRetries,
            retryDelayMs: policy.retryDelayMs,
            onRetry: (attempt, error) => {
              hadRetriesRef.value = true;
              current = setAgentRetryState(
                current,
                "drafting",
                attempt,
                policy.maxRetries,
                error.message
              );
              if (chapterNumber != null) {
                current = {
                  ...current,
                  draftingProgress: {
                    currentChapter: chapterNumber,
                    totalChapters: total,
                    completedChapters: [...completedChapters],
                    retryCount: attempt,
                    maxRetries: policy.maxRetries,
                    status: "retrying",
                    warning: longChapterWarning,
                  },
                };
              }
              setProject({ ...current });
            },
          }),
          DRAFT_CHAPTER_TIMEOUT_MS,
          () =>
            new Error(
              `Drafting timed out at chapter ${chapterNumber ?? "unknown"}. Try reducing approximate chapter length or switching to a cheaper/smaller model.`
            )
        );
        setMockMode(data.mockMode);
        return { data, hadRetries: hadRetriesRef.value };
      };

      if (!sequential) {
        try {
          const { data } = await runDraftingCall(current);
          current = mergeAgentOutput(current, "drafting", data.output);
          current = clearAgentRetryState(current, "drafting");
          setProject({ ...current });
          return current;
        } catch (err) {
          throw new Error(
            err instanceof Error
              ? err.message
              : "Drafting failed after automatic retries."
          );
        }
      }

      const draftOutputs: unknown[] = [];
      for (const ch of chapters) {
        if (controller.signal.aborted) break;
        if (startChapterNumber && ch.number < startChapterNumber) continue;

        console.info("[DRAFTING_PROGRESS]", {
          chapterNumber: ch.number,
          totalChapters: total,
          targetLength: ch.lengthPlan?.targetLength,
          provider: llmProvider,
          model: llmModel,
        });

        current = {
          ...current,
          draftingProgress: {
            currentChapter: ch.number,
            totalChapters: total,
            completedChapters: [...completedChapters],
            retryCount: 0,
            maxRetries: policy.maxRetries,
            status: "running",
            warning: longChapterWarning,
          },
        };
        setProject({ ...current });

        try {
          const { data } = await runDraftingCall(current, ch.number);
          current = mergeChapterDraftOutput(current, data.output);
          draftOutputs.push(data.output);
          completedChapters.push(ch.number);
          current = {
            ...current,
            draftingProgress: {
              currentChapter: ch.number,
              totalChapters: total,
              completedChapters: [...completedChapters],
              maxRetries: policy.maxRetries,
              status: completedChapters.length >= total ? "completed" : "running",
              warning: longChapterWarning,
            },
          };
          setProject({ ...current });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Drafting failed";
          const isOpenRouter402 =
            /\b402\b|prompt tokens|max_tokens|requires more credits|insufficient credits/i.test(
              msg
            );
          current = {
            ...current,
            draftingProgress: {
              currentChapter: ch.number,
              totalChapters: total,
              completedChapters: [...completedChapters],
              failedChapter: ch.number,
              retryCount: current.agents.find((a) => a.id === "drafting")?.retryCount,
              maxRetries: policy.maxRetries,
              status: "failed",
              warning: longChapterWarning,
            },
          };
          setProject({ ...current });
          console.error("[DRAFTING_FAILED]", {
            chapterNumber: ch.number,
            error: msg,
          });
          if (isOpenRouter402) {
            throw new Error(
              `Prose Writer failed at chapter ${ch.number} because OpenRouter rejected the request. Reduce chapter length, add credits, or use a cheaper model.`
            );
          }
          throw new Error(
            `Drafting failed at chapter ${ch.number} after automatic retries. ${msg}`
          );
        }
      }

      const now = new Date().toISOString();
      const agents = current.agents.map((agent) =>
        agent.id === "drafting"
          ? {
              ...agent,
              status: "completed" as const,
              output: { chapters: draftOutputs },
              completedAt: now,
              error: undefined,
              retryCount: undefined,
              lastRetryError: undefined,
            }
          : agent
      );
      current = {
        ...current,
        agents,
        draftingProgress: {
          currentChapter: total,
          totalChapters: total,
          completedChapters: [...completedChapters],
          status: "completed",
          maxRetries: policy.maxRetries,
          warning: longChapterWarning,
        },
        updatedAt: now,
      };
      setProject({ ...current });
      return current;
    },
    [llmModel, llmProvider]
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

  const startGeneration = useCallback(
    async (
      nextSettings: ProjectSettings,
      options?: {
        requiresStructureApproval?: boolean;
        skipStructurePause?: boolean;
      }
    ) => {
      setSettings(nextSettings);
      const initial = createInitialProject(normalizeSettings(nextSettings), {
        requiresStructureApproval: options?.requiresStructureApproval,
      });
      setProject(initial);
      await runPipeline(initial, undefined, {
        skipStructurePause: options?.skipStructurePause,
      });
    },
    [runPipeline]
  );

  const generateStory = useCallback(async () => {
    await startGeneration(settings);
  }, [settings, startGeneration]);

  const runJudgeDemo = useCallback(async () => {
    await startGeneration(JUDGE_DEMO_SETTINGS, {
      requiresStructureApproval: JUDGE_DEMO_REQUIRES_STRUCTURE_APPROVAL,
      skipStructurePause: true,
    });
  }, [startGeneration]);

  const approveStructureAndContinue = useCallback(async () => {
    if (!project) return;
    const updated: StoryProject = {
      ...project,
      structureApproved: true,
      awaitingStructureApproval: false,
      updatedAt: new Date().toISOString(),
    };
    setProject(updated);
    await runPipelineFromIndex(updated, DRAFTING_AGENT_INDEX, {
      skipStructurePause: true,
    });
  }, [project, runPipelineFromIndex]);

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

  const resumeDraftingFromChapter = useCallback(
    async (chapterNumber: number) => {
      if (!project || isRunning) return;
      const controller = new AbortController();
      abortRef.current = controller;
      setIsRunning(true);
      try {
        const drafted = await runDraftingPhase(project, controller, chapterNumber);
        setProject({ ...drafted });
        await runPipelineFromIndex(drafted, getAgentIndex("editor"), {
          skipStructurePause: true,
        });
      } finally {
        setIsRunning(false);
        abortRef.current = null;
      }
    },
    [project, isRunning, runDraftingPhase, runPipelineFromIndex]
  );

  const continueDrafting = useCallback(async () => {
    if (!project || isRunning) return;
    const chapters = getAllChapters(project);
    const firstUnfinished =
      chapters.find((ch) => !ch.draft?.trim())?.number ?? chapters[0]?.number;
    if (!firstUnfinished) return;
    await resumeDraftingFromChapter(firstUnfinished);
  }, [project, isRunning, resumeDraftingFromChapter]);

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

    await runPipelineFromIndex(updated, DRAFTING_AGENT_INDEX, {
      skipStructurePause:
        updated.requiresStructureApproval === false ||
        updated.structureApproved === true,
    });
  }, [project, isRunning, runPipelineFromIndex]);

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
        const failedChapter = project.draftingProgress?.failedChapter;
        await resumeDraftingFromChapter(failedChapter ?? 1);
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
    [project, isRunning, runPipelineFromIndex, resumeDraftingFromChapter]
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
    mockMode,
    llmProvider,
    llmModel,
    llmStatus,
    generateStory,
    runJudgeDemo,
    stopGeneration,
    resetProject,
    regenerateAgent,
    approveAgent,
    updateAgentOutput,
    approveStructureAndContinue,
    continuePipeline,
    continueDrafting,
    resumeDraftingFromChapter,
    showContinuePipeline,
    showContinueDrafting,
    updateStructure,
    redistributeStructureLength,
    regenerateStructure,
    applyFallbackChapterOutline,
  };
}
