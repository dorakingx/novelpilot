"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AGENT_DEFINITIONS,
  createInitialProject,
  getAgentIndex,
  mergeAgentOutput,
  mergeChapterDraftOutput,
  resetFromAgent,
  setAgentStatus,
} from "./agents";
import { DEFAULT_GEMMA_MODEL } from "./gemma-model";
import {
  JUDGE_DEMO_REQUIRES_STRUCTURE_APPROVAL,
  JUDGE_DEMO_SETTINGS,
} from "./demo";
import { presetToTargetLength } from "./structure-chapter-defaults";
import { distributeLength, syncStructureTotal } from "./length-planning";
import { buildDefaultStructure } from "./structure-presets";
import {
  getAllChapters,
  shouldUseSequentialDrafting,
  syncPartsAndChapters,
} from "./structure-utils";
import { formatLiveGenerationError } from "./format-generation-error";
import type {
  AgentId,
  GenerateAgentResponse,
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
};

function normalizeSettings(settings: ProjectSettings): ProjectSettings {
  const structure = syncStructureTotal(settings.structure);
  return {
    ...settings,
    structure,
    targetLength:
      settings.targetLength ?? presetToTargetLength(structure.presetId),
  };
}

const DRAFTING_AGENT_INDEX = getAgentIndex("drafting");

async function fetchAgent(
  agentId: AgentId,
  project: StoryProject,
  signal: AbortSignal,
  draftChapterNumber?: number
): Promise<GenerateAgentResponse> {
  const res = await fetch("/api/generate-agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId, project, draftChapterNumber }),
    signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ?? `Agent ${agentId} failed`
    );
  }
  return res.json() as Promise<GenerateAgentResponse>;
}

export function useStoryProject() {
  const [settings, setSettings] = useState<ProjectSettings>(DEFAULT_SETTINGS);
  const [project, setProject] = useState<StoryProject | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [mockMode, setMockMode] = useState(true);
  const [llmProvider, setLlmProvider] = useState("openrouter");
  const [llmModel, setLlmModel] = useState(DEFAULT_GEMMA_MODEL);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d: { mockMode?: boolean; provider?: string; model?: string }) => {
        if (typeof d.mockMode === "boolean") setMockMode(d.mockMode);
        if (d.provider) setLlmProvider(d.provider);
        if (d.model) setLlmModel(d.model);
      })
      .catch(() => {});
  }, []);

  const resolveGenerationError = useCallback(
    (raw: string, liveMode: boolean, provider: string, model: string) => {
      if (!liveMode) return raw;
      if (raw.startsWith("Live generation failed")) return raw;
      return formatLiveGenerationError(raw, provider, model);
    },
    []
  );

  const runDraftingPhase = useCallback(
    async (
      startProject: StoryProject,
      controller: AbortController
    ): Promise<StoryProject> => {
      let current = setAgentStatus(startProject, "drafting", "running");
      setProject({ ...current });

      const chapters = getAllChapters(current);
      const sequential = shouldUseSequentialDrafting(current.structure);

      if (!sequential) {
        const data = await fetchAgent("drafting", current, controller.signal);
        setMockMode(data.mockMode);
        current = mergeAgentOutput(current, "drafting", data.output);
        setProject({ ...current });
        return current;
      }

      const total = chapters.length;
      const draftOutputs: unknown[] = [];

      for (let i = 0; i < total; i++) {
        if (controller.signal.aborted) break;
        const ch = chapters[i];
        current = {
          ...current,
          draftingProgress: {
            currentChapter: ch.number,
            totalChapters: total,
          },
        };
        setProject({ ...current });

        const data = await fetchAgent(
          "drafting",
          current,
          controller.signal,
          ch.number
        );
        setMockMode(data.mockMode);
        current = mergeChapterDraftOutput(current, data.output);
        draftOutputs.push(data.output);
        setProject({ ...current });
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
            }
          : agent
      );

      current = {
        ...current,
        agents,
        draftingProgress: undefined,
        updatedAt: now,
      };
      setProject({ ...current });
      return current;
    },
    []
  );

  const runPipelineFromIndex = useCallback(
    async (
      startProject: StoryProject,
      startIdx: number,
      options?: { skipStructurePause?: boolean }
    ) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsRunning(true);

      let current = startProject;

      try {
        for (let i = startIdx; i < AGENT_DEFINITIONS.length; i++) {
          if (controller.signal.aborted) break;

          const agentId = AGENT_DEFINITIONS[i].id;

          if (agentId === "drafting") {
            current = await runDraftingPhase(current, controller);
            if (controller.signal.aborted) break;
            continue;
          }

          current = setAgentStatus(current, agentId, "running");
          setProject({ ...current });

          const data = await fetchAgent(agentId, current, controller.signal);
          setMockMode(data.mockMode);
          current = mergeAgentOutput(current, agentId, data.output);
          setProject({ ...current });

          if (
            agentId === "chapter-outline" &&
            !options?.skipStructurePause &&
            current.requiresStructureApproval !== false &&
            !current.structureApproved
          ) {
            current = {
              ...current,
              awaitingStructureApproval: true,
            };
            setProject({ ...current });
            setIsRunning(false);
            abortRef.current = null;
            return;
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setProject((p) => {
            if (!p) return p;
            const running = p.agents.find((a) => a.status === "running");
            if (!running) return p;
            return setAgentStatus(p, running.id, "pending", {
              startedAt: undefined,
            });
          });
        } else {
          const raw =
            err instanceof Error ? err.message : "Generation failed";
          const message = resolveGenerationError(
            raw,
            !mockMode,
            llmProvider,
            llmModel
          );
          setProject((p) => {
            if (!p) return p;
            const running = p.agents.find((a) => a.status === "running");
            if (!running) return p;
            return setAgentStatus(p, running.id, "failed", {
              error: message,
            });
          });
        }
      } finally {
        if (!current.awaitingStructureApproval) {
          setIsRunning(false);
          abortRef.current = null;
        }
      }
    },
    [llmModel, llmProvider, mockMode, resolveGenerationError, runDraftingPhase]
  );

  const runPipeline = useCallback(
    async (
      startProject: StoryProject,
      fromAgentId?: AgentId,
      options?: { skipStructurePause?: boolean }
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
      options?: { requiresStructureApproval?: boolean; skipStructurePause?: boolean }
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
      const reset = resetFromAgent(project, agentId);
      const cleared: StoryProject = {
        ...reset,
        ...(agentId === "chapter-outline" || getAgentIndex(agentId) < getAgentIndex("chapter-outline")
          ? {
              awaitingStructureApproval: false,
              structureApproved: false,
            }
          : {}),
      };
      setProject(cleared);
      if (agentId === "drafting") {
        await runPipelineFromIndex(cleared, DRAFTING_AGENT_INDEX, {
          skipStructurePause: true,
        });
      } else {
        await runPipeline(cleared, agentId, {
          skipStructurePause:
            cleared.requiresStructureApproval === false ||
            cleared.structureApproved === true,
        });
      }
    },
    [project, isRunning, runPipeline, runPipelineFromIndex]
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

  return {
    settings,
    updateSettings,
    project,
    isRunning,
    mockMode,
    llmProvider,
    llmModel,
    generateStory,
    runJudgeDemo,
    stopGeneration,
    resetProject,
    regenerateAgent,
    approveAgent,
    updateAgentOutput,
    approveStructureAndContinue,
    updateStructure,
    redistributeStructureLength,
    regenerateStructure,
  };
}
