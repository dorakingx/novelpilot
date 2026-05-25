"use client";

import { Badge } from "@/components/ui/badge";
import {
  estimateTextLength,
  formatLengthLabel,
  getChapterLengthStatus,
  getLengthStatusLabel,
} from "@/lib/length-planning";
import { getAllChapters } from "@/lib/structure-utils";
import type { StoryProject } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Layers } from "lucide-react";

interface StoryStructurePanelProps {
  project: StoryProject;
  isRunning?: boolean;
}

const STATUS_VARIANT: Record<
  ReturnType<typeof getChapterLengthStatus>,
  "outline" | "completed" | "warning" | "running"
> = {
  none: "outline",
  under: "warning",
  near: "completed",
  over: "warning",
};

export function StoryStructurePanel({
  project,
  isRunning = false,
}: StoryStructurePanelProps) {
  const parts = project.storyBible.parts ?? [];
  const chapters = getAllChapters(project);
  const progress = project.draftingProgress;
  const unit = project.structure.lengthUnit;

  return (
    <div className="surface-card premium-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="size-4 text-[#F5C542]" />
        <h3 className="text-base font-semibold text-[#F8FAFC]">
          Story Structure
        </h3>
      </div>
      <p className="text-xs text-[#94A3B8] mb-3">
        {project.structure.partCount} part
        {project.structure.partCount !== 1 ? "s" : ""} · {chapters.length}{" "}
        chapters
        {project.structure.totalTargetLength != null && (
          <>
            {" "}
            ·{" "}
            {formatLengthLabel(
              project.structure.totalTargetLength,
              unit,
              project.language
            )}
          </>
        )}
      </p>

      {progress && isRunning && (
        <p className="text-xs text-[#38BDF8] mb-3">
          Drafting chapter {progress.currentChapter} of{" "}
          {progress.totalChapters}…
        </p>
      )}

      <div className="space-y-3 max-h-[280px] overflow-y-auto">
        {parts.length > 0
          ? parts.map((part) => (
              <div key={part.id}>
                <p className="text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Part {part.number}: {part.title}
                </p>
                <ul className="space-y-2 pl-2 border-l border-white/10">
                  {part.chapters.map((ch) => {
                    const status = getChapterLengthStatus(
                      ch.draft,
                      ch.lengthPlan
                    );
                    const actual = ch.draft
                      ? estimateTextLength(ch.draft, ch.lengthPlan?.unit ?? unit)
                      : 0;
                    const target = ch.lengthPlan?.targetLength;
                    const pct =
                      target && actual
                        ? Math.round((actual / target) * 100)
                        : null;

                    return (
                      <li
                        key={ch.id ?? ch.number}
                        className="text-xs text-[#94A3B8] space-y-1"
                      >
                        <span className="text-[#F8FAFC]">
                          Ch. {ch.number}: {ch.title}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {target != null && (
                            <span>
                              Target: {target.toLocaleString()} {unit}
                            </span>
                          )}
                          {ch.draft && (
                            <span>
                              Actual: {actual.toLocaleString()} {unit}
                              {pct != null ? ` (${pct}%)` : ""}
                            </span>
                          )}
                          <Badge
                            variant={STATUS_VARIANT[status]}
                            className={cn("text-[10px] py-0")}
                          >
                            {getLengthStatusLabel(status)}
                          </Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          : chapters.map((ch) => {
              const status = getChapterLengthStatus(ch.draft, ch.lengthPlan);
              return (
                <div key={ch.number} className="text-xs text-[#94A3B8]">
                  <span className="text-[#F8FAFC]">
                    Ch. {ch.number}: {ch.title}
                  </span>
                  <Badge
                    variant={STATUS_VARIANT[status]}
                    className="ml-2 text-[10px]"
                  >
                    {getLengthStatusLabel(status)}
                  </Badge>
                </div>
              );
            })}
      </div>
    </div>
  );
}
