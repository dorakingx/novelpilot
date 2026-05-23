"use client";

import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

const CHAIN = [
  "Premise",
  "Cast",
  "World",
  "Plot",
  "Draft",
  "Edit",
  "Audit",
  "Publish",
] as const;

export function AgentChainPreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm",
        className
      )}
      aria-hidden
    >
      {CHAIN.map((label, i) => (
        <span key={label} className="flex items-center gap-1 sm:gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-muted-foreground transition-colors hover:border-[oklch(0.78_0.14_75/30%)] hover:text-[oklch(0.78_0.14_75)]">
            {label}
          </span>
          {i < CHAIN.length - 1 && (
            <ChevronRight className="size-3.5 text-muted-foreground/50 shrink-0" />
          )}
        </span>
      ))}
    </div>
  );
}
