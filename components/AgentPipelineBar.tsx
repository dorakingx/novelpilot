"use client";

import { AGENT_DEFINITIONS } from "@/lib/agents";
import { getAgentIcon } from "@/lib/agent-icons";
import type { AgentStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, Loader2, X } from "lucide-react";

interface AgentPipelineBarProps {
  agents: AgentStep[];
}

function nodeClass(status: AgentStep["status"]): string {
  switch (status) {
    case "running":
      return "border-[oklch(0.72_0.14_220)] bg-[oklch(0.72_0.14_220/15%)] agent-pulse text-[oklch(0.72_0.14_220)]";
    case "completed":
      return "border-[oklch(0.78_0.14_75)] bg-[oklch(0.78_0.14_75/15%)] text-[oklch(0.78_0.14_75)]";
    case "failed":
      return "border-destructive bg-destructive/15 text-destructive";
    default:
      return "border-white/10 bg-white/5 text-muted-foreground";
  }
}

export function AgentPipelineBar({ agents }: AgentPipelineBarProps) {
  return (
    <div className="glass-card premium-border rounded-2xl p-4 overflow-x-auto">
      <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
        Agent pipeline
      </p>
      <div className="flex items-start gap-2 min-w-max pb-1">
        {AGENT_DEFINITIONS.map((def, i) => {
          const step = agents.find((a) => a.id === def.id);
          const status = step?.status ?? "pending";
          const Icon = getAgentIcon(def.id);
          const shortName = def.name.split(" ")[0];

          return (
            <div key={def.id} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1.5 w-[72px] sm:w-[88px]">
                <div
                  className={cn(
                    "flex size-9 sm:size-10 items-center justify-center rounded-full border-2 transition-all",
                    nodeClass(status)
                  )}
                  title={def.name}
                >
                  {status === "running" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : status === "completed" ? (
                    <Check className="size-4" />
                  ) : status === "failed" ? (
                    <X className="size-4" />
                  ) : (
                    <Icon className="size-4 opacity-70" />
                  )}
                </div>
                <span className="text-[10px] sm:text-xs text-center leading-tight text-muted-foreground hidden sm:block">
                  {def.name}
                </span>
                <span className="text-[10px] text-center leading-tight text-muted-foreground sm:hidden">
                  {shortName}
                </span>
              </div>
              {i < AGENT_DEFINITIONS.length - 1 && (
                <div
                  className={cn(
                    "h-px w-4 sm:w-6 mt-5 shrink-0",
                    status === "completed"
                      ? "bg-[oklch(0.78_0.14_75/40%)]"
                      : "bg-white/10"
                  )}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
