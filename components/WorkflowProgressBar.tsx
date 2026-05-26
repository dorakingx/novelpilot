"use client";

import type { WorkflowStage } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS: { id: WorkflowStage; label: string }[] = [
  { id: "launcher", label: "Prompt" },
  { id: "planning", label: "Plan" },
  { id: "drafting", label: "Draft Chapters" },
  { id: "final", label: "Final Manuscript" },
];

interface WorkflowProgressBarProps {
  currentStage: WorkflowStage;
  onNavigate?: (stage: WorkflowStage) => void;
  disabled?: boolean;
}

export function WorkflowProgressBar({
  currentStage,
  onNavigate,
  disabled,
}: WorkflowProgressBarProps) {
  const currentIdx = STEPS.findIndex((s) => s.id === currentStage);

  return (
    <nav
      className="flex flex-wrap items-center gap-2 text-xs"
      aria-label="Workflow progress"
    >
      {STEPS.map((step, idx) => {
        const isActive = step.id === currentStage;
        const isPast = idx < currentIdx;
        const clickable = onNavigate && !disabled && idx <= currentIdx;

        return (
          <div key={step.id} className="flex items-center gap-2">
            {idx > 0 && (
              <span className="text-muted-foreground/50" aria-hidden>
                →
              </span>
            )}
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onNavigate(step.id)}
              className={cn(
                "rounded-full px-3 py-1 font-medium transition-colors",
                isActive &&
                  "bg-[rgba(245,197,66,0.2)] text-[#F5C542] ring-1 ring-[#F5C542]/40",
                isPast && !isActive && "text-[#94A3B8]",
                !isActive && !isPast && "text-muted-foreground",
                clickable && "hover:bg-white/5 cursor-pointer",
                !clickable && "cursor-default"
              )}
            >
              {idx + 1}. {step.label}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
