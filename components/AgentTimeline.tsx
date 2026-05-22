"use client";

import { AgentOutputEditor } from "@/components/AgentOutputEditor";
import { AgentCard } from "@/components/AgentCard";
import { LandingHero } from "@/components/LandingHero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentId, StoryProject } from "@/lib/types";
import { useState } from "react";

interface AgentTimelineProps {
  project: StoryProject | null;
  isRunning: boolean;
  onRegenerate: (agentId: AgentId) => void;
  onApprove: (agentId: AgentId) => void;
  onEditOutput: (agentId: AgentId, output: unknown) => void;
  onRunJudgeDemo: () => void;
}

export function AgentTimeline({
  project,
  isRunning,
  onRegenerate,
  onApprove,
  onEditOutput,
  onRunJudgeDemo,
}: AgentTimelineProps) {
  const [editingAgentId, setEditingAgentId] = useState<AgentId | null>(null);

  if (!project) {
    return (
      <LandingHero onRunJudgeDemo={onRunJudgeDemo} isRunning={isRunning} />
    );
  }

  const completed = project.agents.filter(
    (a) => a.status === "completed"
  ).length;
  const total = project.agents.length;
  const progress = Math.round((completed / total) * 100);
  const editingAgent =
    editingAgentId != null
      ? project.agents.find((a) => a.id === editingAgentId) ?? null
      : null;

  return (
    <>
      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Agent Timeline</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
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
