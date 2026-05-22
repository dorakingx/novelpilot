"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { AgentId, AgentStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

interface AgentCardProps {
  agent: AgentStep;
  isLast: boolean;
  isRunning: boolean;
  onRegenerate: (agentId: AgentId) => void;
}

function statusConfig(status: AgentStep["status"]) {
  switch (status) {
    case "running":
      return {
        label: "Running",
        variant: "default" as const,
        icon: Loader2,
        className: "animate-spin text-primary",
        cardClass: "border-primary/50 shadow-[0_0_20px_-5px] shadow-primary/30",
      };
    case "completed":
      return {
        label: "Completed",
        variant: "secondary" as const,
        icon: CheckCircle2,
        className: "text-emerald-400",
        cardClass: "border-emerald-500/30",
      };
    case "failed":
      return {
        label: "Failed",
        variant: "destructive" as const,
        icon: AlertCircle,
        className: "text-destructive",
        cardClass: "border-destructive/40",
      };
    default:
      return {
        label: "Pending",
        variant: "outline" as const,
        icon: Circle,
        className: "text-muted-foreground",
        cardClass: "border-border/40 opacity-80",
      };
  }
}

export function AgentCard({
  agent,
  isLast,
  isRunning,
  onRegenerate,
}: AgentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = statusConfig(agent.status);
  const Icon = config.icon;
  const outputStr =
    agent.output != null
      ? typeof agent.output === "string"
        ? agent.output
        : JSON.stringify(agent.output, null, 2)
      : null;

  const canRegenerate =
    !isRunning &&
    (agent.status === "completed" || agent.status === "failed");

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full border bg-card",
            agent.status === "running" && "animate-pulse border-primary"
          )}
        >
          <Icon className={cn("size-4", config.className)} />
        </div>
        {!isLast && (
          <div className="mt-1 w-px flex-1 min-h-[24px] bg-border" />
        )}
      </div>

      <Card
        className={cn(
          "mb-4 flex-1 transition-all",
          config.cardClass,
          agent.status === "running" && "animate-pulse"
        )}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">{agent.name}</h3>
              <Badge variant={config.variant} className="text-xs">
                {config.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {agent.role}
            </p>
          </div>
          {canRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRegenerate(agent.id)}
              className="shrink-0"
            >
              <RefreshCw className="size-3.5 mr-1" />
              Regenerate
            </Button>
          )}
        </CardHeader>

        {(agent.error || outputStr) && (
          <CardContent className="pt-0">
            {agent.error && (
              <p className="text-sm text-destructive mb-2">{agent.error}</p>
            )}
            {outputStr && (
              <div>
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs text-primary hover:underline mb-2"
                >
                  {expanded ? "Hide output" : "Show output"}
                </button>
                {expanded && (
                  <pre className="max-h-48 overflow-auto rounded-md bg-muted/50 p-3 text-xs font-mono whitespace-pre-wrap">
                    {outputStr}
                  </pre>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
