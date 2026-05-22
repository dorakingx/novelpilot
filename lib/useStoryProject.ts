"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AGENT_DEFINITIONS,
  createInitialProject,
  mergeAgentOutput,
  resetFromAgent,
  setAgentStatus,
} from "./agents";
import { JUDGE_DEMO_SETTINGS } from "./demo";
import { formatLiveGenerationError } from "./format-generation-error";
import type {
  AgentId,
  GenerateAgentResponse,
  ProjectSettings,
  StoryProject,
} from "./types";

const DEFAULT_SETTINGS: ProjectSettings = {
  userPrompt:
    "Write a melancholic sci-fi mystery set in modern Tokyo. The protagonist is a graduate student who lost his memory. The story involves a disappearance in a quantum computing lab.",
  language: "en",
  genre: "sci-fi",
  tone: "melancholic",
  targetLength: "short-story",
};

export function useStoryProject() {
  const [settings, setSettings] = useState<ProjectSettings>(DEFAULT_SETTINGS);
  const [project, setProject] = useState<StoryProject | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [mockMode, setMockMode] = useState(true);
  const [llmProvider, setLlmProvider] = useState("openrouter");
  const [llmModel, setLlmModel] = useState("google/gemma-3-27b-it");
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

  const runPipeline = useCallback(
    async (startProject: StoryProject, fromAgentId?: AgentId) => {
      const startIdx = fromAgentId
        ? AGENT_DEFINITIONS.findIndex((a) => a.id === fromAgentId)
        : 0;

      const controller = new AbortController();
      abortRef.current = controller;
      setIsRunning(true);

      let current = startProject;

      try {
        for (let i = startIdx; i < AGENT_DEFINITIONS.length; i++) {
          if (controller.signal.aborted) break;

          const agentId = AGENT_DEFINITIONS[i].id;
          current = setAgentStatus(current, agentId, "running");
          setProject({ ...current });

          const res = await fetch("/api/generate-agent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agentId, project: current }),
            signal: controller.signal,
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            const raw =
              (err as { error?: string }).error ?? `Agent ${agentId} failed`;
            throw new Error(
              resolveGenerationError(raw, !mockMode, llmProvider, llmModel)
            );
          }

          const data = (await res.json()) as GenerateAgentResponse;
          setMockMode(data.mockMode);
          current = mergeAgentOutput(current, agentId, data.output);
          setProject({ ...current });
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
        setIsRunning(false);
        abortRef.current = null;
      }
    },
    [llmModel, llmProvider, mockMode, resolveGenerationError]
  );

  const startGeneration = useCallback(
    async (nextSettings: ProjectSettings) => {
      setSettings(nextSettings);
      const initial = createInitialProject(nextSettings);
      setProject(initial);
      await runPipeline(initial);
    },
    [runPipeline]
  );

  const generateStory = useCallback(async () => {
    await startGeneration(settings);
  }, [settings, startGeneration]);

  const runJudgeDemo = useCallback(async () => {
    await startGeneration(JUDGE_DEMO_SETTINGS);
  }, [startGeneration]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const regenerateAgent = useCallback(
    async (agentId: AgentId) => {
      if (!project || isRunning) return;
      const reset = resetFromAgent(project, agentId);
      setProject(reset);
      await runPipeline(reset, agentId);
    },
    [project, isRunning, runPipeline]
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
      setSettings((s) => ({ ...s, ...partial }));
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
    regenerateAgent,
    approveAgent,
    updateAgentOutput,
  };
}
