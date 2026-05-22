"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentId, StoryProject } from "@/lib/types";
import { AgentCard } from "./AgentCard";

interface AgentTimelineProps {
  project: StoryProject | null;
  isRunning: boolean;
  onRegenerate: (agentId: AgentId) => void;
}

export function AgentTimeline({
  project,
  isRunning,
  onRegenerate,
}: AgentTimelineProps) {
  if (!project) {
    return (
      <Card className="border-border/60 bg-card/80 h-full min-h-[400px]">
        <CardHeader>
          <CardTitle>Agent Timeline</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter a story prompt and click Generate Story to start the
            nine-agent production pipeline.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 opacity-50">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-lg border border-dashed border-border"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const completed = project.agents.filter(
    (a) => a.status === "completed"
  ).length;
  const total = project.agents.length;
  const progress = Math.round((completed / total) * 100);

  return (
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
          />
        ))}
      </CardContent>
    </Card>
  );
}
