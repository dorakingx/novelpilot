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
          <span className="rounded-full border border-white/12 bg-[#172033] px-2.5 py-1 text-[#CBD5E1]">
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
