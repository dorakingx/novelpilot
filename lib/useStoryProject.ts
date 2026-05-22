"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AGENT_DEFINITIONS,
  createInitialProject,
  mergeAgentOutput,
  resetFromAgent,
  setAgentStatus,
} from "./agents";
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
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d: { mockMode?: boolean }) => {
        if (typeof d.mockMode === "boolean") setMockMode(d.mockMode);
      })
      .catch(() => {});
  }, []);

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
            throw new Error(
              (err as { error?: string }).error ?? `Agent ${agentId} failed`
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
          const message =
            err instanceof Error ? err.message : "Generation failed";
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
    []
  );

  const generateStory = useCallback(async () => {
    const initial = createInitialProject(settings);
    setProject(initial);
    await runPipeline(initial);
  }, [settings, runPipeline]);

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
    generateStory,
    stopGeneration,
    regenerateAgent,
  };
}
