"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAgentIcon } from "@/lib/agent-icons";
import type { AgentId, AgentStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
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
  draftWarning?: string;
  draftingSubstatus?: string;
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
        iconClass: "animate-spin text-[#38BDF8]",
        nodeClass: "border-[#38BDF8] bg-[rgba(56,189,248,0.16)] agent-pulse",
        cardClass: "border-l-2 border-l-[#38BDF8] border-white/12",
        badgeVariant: "running" as const,
      };
    case "completed":
      return {
        label: "Completed",
        icon: CheckCircle2,
        iconClass: "text-[#86EFAC]",
        nodeClass: "border-[#22C55E] bg-[rgba(34,197,94,0.16)]",
        cardClass: "border-white/12",
        badgeVariant: "completed" as const,
      };
    case "failed":
      return {
        label: "Failed",
        icon: AlertCircle,
        iconClass: "text-destructive",
        nodeClass: "border-destructive/50 bg-destructive/10",
        cardClass: "border-destructive/40",
        badgeVariant: "error" as const,
      };
    default:
      return {
        label: "Pending",
        icon: Circle,
        iconClass: "text-[#94A3B8]",
        nodeClass: "border-white/12 bg-[#172033]",
        cardClass: "border-white/12",
        badgeVariant: "outline" as const,
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
  draftWarning,
  draftingSubstatus,
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
          "mb-4 flex-1 rounded-xl surface-card premium-border p-4 transition-all",
          config.cardClass
        )}
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <AgentRoleIcon
                  agentId={agent.id}
                  className="size-4 text-[#F5C542] shrink-0"
                />
                <h3 className="font-semibold text-sm text-[#F8FAFC]">
                  {agent.name}
                </h3>
                <Badge
                  variant={config.badgeVariant}
                  className="text-[10px] uppercase tracking-wide"
                >
                  {config.label}
                </Badge>
                {agent.approved && (
                  <Badge variant="completed" className="text-[10px]">
                    Approved
                  </Badge>
                )}
                {agent.autoRecovered && (
                  <Badge variant="completed" className="text-[10px]">
                    Auto-recovered
                  </Badge>
                )}
                {agent.fallbackUsed && (
                  <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-200">
                    Fallback used
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {agent.role}
              </p>
              {agent.status === "running" &&
                agent.retryCount != null &&
                agent.maxRetries != null && (
                  <p className="text-xs text-[#38BDF8] mt-1">
                    Retrying attempt {agent.retryCount} of {agent.maxRetries}…
                  </p>
                )}
              {agent.status === "failed" &&
                agent.maxRetries != null &&
                (agent.retryCount ?? 0) >= agent.maxRetries && (
                  <p className="text-xs text-amber-400/90 mt-1">
                    Failed after retries
                  </p>
                )}
              {draftingSubstatus && agent.status === "running" && !agent.retryCount && (
                <p className="text-xs text-[#38BDF8] mt-2">{draftingSubstatus}</p>
              )}
              {draftWarning && (
                <p className="flex items-start gap-1.5 text-xs text-amber-400/90 mt-2">
                  <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                  <span>{draftWarning}</span>
                </p>
              )}
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
                {agent.status === "failed" ? "Retry and Continue" : "Regenerate"}
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
                    className="flex items-center gap-1 text-xs text-[#38BDF8] hover:text-[#F5C542] transition-colors mb-2"
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
                      <code className="block max-h-48 overflow-auto rounded-lg bg-[#172033] border border-white/12 p-3 text-xs font-mono whitespace-pre-wrap text-[#E2E8F0]">
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
