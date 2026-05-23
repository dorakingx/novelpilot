"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAgentIcon } from "@/lib/agent-icons";
import type { AgentId, AgentStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Circle,
  Loader2,
  Pencil,
  RefreshCw,
  ThumbsUp,
} from "lucide-react";
import { useState, createElement } from "react";

interface AgentCardProps {
  agent: AgentStep;
  isLast: boolean;
  isRunning: boolean;
  onRegenerate: (agentId: AgentId) => void;
  onApprove: (agentId: AgentId) => void;
  onEditOutput: (agentId: AgentId) => void;
}

function statusConfig(status: AgentStep["status"]) {
  switch (status) {
    case "running":
      return {
        label: "Running",
        icon: Loader2,
        iconClass: "animate-spin text-[oklch(0.72_0.14_220)]",
        nodeClass:
          "border-[oklch(0.72_0.14_220)] bg-[oklch(0.72_0.14_220/15%)] agent-pulse",
        cardClass:
          "border-[oklch(0.72_0.14_220/40%)] shadow-[0_0_24px_oklch(0.72_0.14_220/12%)]",
      };
    case "completed":
      return {
        label: "Completed",
        icon: CheckCircle2,
        iconClass: "text-[oklch(0.78_0.14_75)]",
        nodeClass: "border-[oklch(0.78_0.14_75)] bg-[oklch(0.78_0.14_75/15%)]",
        cardClass: "border-[oklch(0.78_0.14_75/25%)]",
      };
    case "failed":
      return {
        label: "Failed",
        icon: AlertCircle,
        iconClass: "text-destructive",
        nodeClass: "border-destructive/50 bg-destructive/10",
        cardClass: "border-destructive/40",
      };
    default:
      return {
        label: "Pending",
        icon: Circle,
        iconClass: "text-muted-foreground",
        nodeClass: "border-white/10 bg-white/5",
        cardClass: "border-white/5 opacity-75",
      };
  }
}

function AgentRoleIcon({
  agentId,
  className,
}: {
  agentId: AgentId;
  className?: string;
}) {
  return createElement(getAgentIcon(agentId), { className });
}

export function AgentCard({
  agent,
  isLast,
  isRunning,
  onRegenerate,
  onApprove,
  onEditOutput,
}: AgentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = statusConfig(agent.status);
  const StatusIcon = config.icon;
  const outputStr =
    agent.output != null
      ? typeof agent.output === "string"
        ? agent.output
        : JSON.stringify(agent.output, null, 2)
      : null;

  const canAct =
    !isRunning &&
    (agent.status === "completed" || agent.status === "failed");

  return (
    <div className="relative flex gap-4 pb-1">
      <div className="flex flex-col items-center z-10">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-all",
            config.nodeClass
          )}
        >
          {agent.status === "running" ? (
            <StatusIcon className={cn("size-4", config.iconClass)} />
          ) : agent.status === "completed" ? (
            <StatusIcon className={cn("size-4", config.iconClass)} />
          ) : agent.status === "failed" ? (
            <StatusIcon className={cn("size-4", config.iconClass)} />
          ) : (
            <AgentRoleIcon
              agentId={agent.id}
              className={cn("size-4", config.iconClass)}
            />
          )}
        </div>
        {!isLast && (
          <div className="mt-1 w-px flex-1 min-h-[20px] bg-white/10" />
        )}
      </div>

      <div
        className={cn(
          "mb-4 flex-1 rounded-xl glass-card premium-border p-4 transition-all",
          config.cardClass
        )}
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <AgentRoleIcon
                  agentId={agent.id}
                  className="size-4 text-[oklch(0.78_0.14_75/80%)] shrink-0"
                />
                <h3 className="font-semibold text-sm">{agent.name}</h3>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] uppercase tracking-wide",
                    agent.status === "running" &&
                      "border-[oklch(0.72_0.14_220/40%)] text-[oklch(0.72_0.14_220)]",
                    agent.status === "completed" &&
                      "border-[oklch(0.78_0.14_75/40%)] text-[oklch(0.78_0.14_75)]"
                  )}
                >
                  {config.label}
                </Badge>
                {agent.approved && (
                  <Badge className="text-[10px] border-[oklch(0.78_0.14_75/40%)] bg-[oklch(0.78_0.14_75/10%)] text-[oklch(0.78_0.14_75)]">
                    Approved
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {agent.role}
              </p>
            </div>
          </div>

          {canAct && (
            <div className="flex flex-wrap gap-1.5">
              <Button
                variant={agent.approved ? "secondary" : "glass"}
                size="sm"
                onClick={() => onApprove(agent.id)}
              >
                <ThumbsUp className="size-3.5 mr-1" />
                Approve
              </Button>
              <Button
                variant="glass"
                size="sm"
                onClick={() => onRegenerate(agent.id)}
              >
                <RefreshCw className="size-3.5 mr-1" />
                Regenerate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditOutput(agent.id)}
                disabled={agent.output == null}
                aria-label="Edit agent output"
              >
                <Pencil className="size-3.5 mr-1" />
                Edit Output
              </Button>
            </div>
          )}

          {(agent.error || outputStr) && (
            <div className="pt-1 border-t border-white/5">
              {agent.error && (
                <p className="text-sm text-destructive mb-2">{agent.error}</p>
              )}
              {outputStr && (
                <div>
                  <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1 text-xs text-[oklch(0.72_0.14_220)] hover:text-[oklch(0.78_0.14_75)] transition-colors mb-2"
                  >
                    <ChevronDown
                      className={cn(
                        "size-3.5 transition-transform",
                        expanded && "rotate-180"
                      )}
                    />
                    {expanded ? "Hide output" : "Show output"}
                  </button>
                  <div
                    className={cn(
                      "grid transition-all duration-300 ease-out",
                      expanded
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <pre className="overflow-hidden">
                      <code className="block max-h-48 overflow-auto rounded-lg bg-black/30 border border-white/5 p-3 text-xs font-mono whitespace-pre-wrap text-foreground/90">
                        {outputStr}
                      </code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
