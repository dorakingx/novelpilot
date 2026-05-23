"use client";

import { AgentOutputEditor } from "@/components/AgentOutputEditor";
import { AgentCard } from "@/components/AgentCard";
import type { ProjectStatus } from "@/lib/project-status";
import type { AgentId, StoryProject } from "@/lib/types";
import { cn } from "@/lib/utils";
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
      title: "Agent Writing Room",
      subtitle:
        "Nine specialized agents are building your story step by step.",
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
      subtitle:
        "An agent failed. Check the error below and regenerate or start a new story.",
    };
  }
  return {
    title: "Agent Writing Room",
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
      <div
        className={cn(
          "glass-card premium-border rounded-2xl overflow-hidden",
          isRunning &&
            "ring-1 ring-[oklch(0.72_0.14_220/35%)] shadow-[0_0_40px_oklch(0.72_0.14_220/10%)]"
        )}
      >
        <div className="p-6 border-b border-white/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {completed} of {total} agents complete
              </p>
            </div>
            <span className="text-3xl font-bold tabular-nums gold-gradient-text">
              {progress}%
            </span>
          </div>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-black/30 border border-white/5">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                isRunning
                  ? "shimmer-bar"
                  : "bg-gradient-to-r from-[oklch(0.78_0.14_75)] to-[oklch(0.72_0.14_220)]"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="p-6 relative">
          <div
            className="absolute left-[2.65rem] top-8 bottom-8 w-px bg-gradient-to-b from-white/10 via-[oklch(0.72_0.14_220/30%)] to-white/10 hidden sm:block"
            aria-hidden
          />
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
        </div>
      </div>

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
