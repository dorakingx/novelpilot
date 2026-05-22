"use client";

import { AgentOutputEditor } from "@/components/AgentOutputEditor";
import { AgentCard } from "@/components/AgentCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectStatus } from "@/lib/project-status";
import type { AgentId, StoryProject } from "@/lib/types";
import { useState } from "react";

interface AgentTimelineProps {
  project: StoryProject;
  isRunning: boolean;
  projectStatus: ProjectStatus;
  onRegenerate: (agentId: AgentId) => void;
  onApprove: (agentId: AgentId) => void;
  onEditOutput: (agentId: AgentId, output: unknown) => void;
}

function timelineHeadline(
  isRunning: boolean,
  projectStatus: ProjectStatus
): { title: string; subtitle: string } {
  if (isRunning) {
    return {
      title: "AI agents are writing your story",
      subtitle: "Nine Gemma-powered agents are running in sequence…",
    };
  }
  if (projectStatus === "Completed") {
    return {
      title: "Pipeline complete",
      subtitle: "All agents finished. Review outputs and export your demo.",
    };
  }
  if (projectStatus === "Failed") {
    return {
      title: "Pipeline interrupted",
      subtitle: "An agent failed. Check the error below and regenerate or start a new story.",
    };
  }
  return {
    title: "Agent Timeline",
    subtitle: "Resume or regenerate agents from the timeline.",
  };
}

export function AgentTimeline({
  project,
  isRunning,
  projectStatus,
  onRegenerate,
  onApprove,
  onEditOutput,
}: AgentTimelineProps) {
  const [editingAgentId, setEditingAgentId] = useState<AgentId | null>(null);

  const completed = project.agents.filter(
    (a) => a.status === "completed"
  ).length;
  const total = project.agents.length;
  const progress = Math.round((completed / total) * 100);
  const { title, subtitle } = timelineHeadline(isRunning, projectStatus);
  const editingAgent =
    editingAgentId != null
      ? project.agents.find((a) => a.id === editingAgentId) ?? null
      : null;

  return (
    <>
      <Card
        className={`border-border/60 bg-card/80 ${
          isRunning ? "ring-1 ring-primary/30 shadow-lg shadow-primary/5" : ""
        }`}
      >
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>{title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {completed} of {total} agents complete
              </p>
            </div>
            <span className="text-2xl font-semibold tabular-nums text-primary">
              {progress}%
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardHeader>
        <CardContent>
          {project.agents.map((agent, i) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isLast={i === project.agents.length - 1}
              isRunning={isRunning}
              onRegenerate={onRegenerate}
              onApprove={onApprove}
              onEditOutput={(id) => setEditingAgentId(id)}
            />
          ))}
        </CardContent>
      </Card>

      {editingAgent && (
        <AgentOutputEditor
          agent={editingAgent}
          open={editingAgentId != null}
          onOpenChange={(open) => {
            if (!open) setEditingAgentId(null);
          }}
          onSave={(output) => {
            if (editingAgentId) {
              onEditOutput(editingAgentId, output);
              setEditingAgentId(null);
            }
          }}
        />
      )}
    </>
  );
}
