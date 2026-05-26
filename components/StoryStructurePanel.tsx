"use client";

import { Badge } from "@/components/ui/badge";
import {
  computeTotalPlannedLength,
  estimateTextLength,
  formatLengthDifference,
  formatLengthLabel,
  getChapterLengthStatus,
  getLengthDifference,
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
  const totalPlanned = computeTotalPlannedLength(
    parts.length ? parts : chapters
  );

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
        {totalPlanned > 0 && (
          <>
            {" "}
            · Total planned: about{" "}
            {formatLengthLabel(totalPlanned, unit, project.language)}
          </>
        )}
      </p>

      {progress && (
        <p
          className={cn(
            "text-xs mb-3",
            progress.status === "failed" ? "text-destructive" : "text-[#38BDF8]"
          )}
        >
          {progress.status === "retrying"
            ? `Retrying chapter ${progress.currentChapter} (${progress.retryCount ?? 0}/${progress.maxRetries ?? 0})`
            : progress.status === "failed"
              ? `Drafting failed at chapter ${progress.failedChapter ?? progress.currentChapter}. Completed: ${progress.completedChapters.length}/${progress.totalChapters}`
              : `Drafting chapter ${progress.currentChapter} of ${progress.totalChapters}... Completed: ${progress.completedChapters.length}/${progress.totalChapters}`}
          {progress.warning ? ` ${progress.warning}` : ""}
          {!isRunning && progress.cancelled
            ? " Generation stopped. You can resume drafting."
            : ""}
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
                    const chUnit = ch.lengthPlan?.unit ?? unit;
                    const actual = ch.draft
                      ? estimateTextLength(ch.draft, chUnit)
                      : 0;
                    const target = ch.lengthPlan?.targetLength;
                    const diff =
                      target && actual ?
                        getLengthDifference(actual, target)
                      : null;

                    return (
                      <li
                        key={ch.id ?? ch.number}
                        className="text-xs text-[#94A3B8] space-y-1"
                      >
                        <span className="text-[#F8FAFC]">
                          Ch. {ch.number}
                          {ch.role?.trim() ? ` (${ch.role})` : ""}: {ch.title}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {target != null && (
                            <span>
                              Planned: about {target.toLocaleString()} {chUnit}
                            </span>
                          )}
                          {ch.draft && (
                            <>
                              <span>
                                Actual: {actual.toLocaleString()} {chUnit}
                              </span>
                              {diff != null && (
                                <span>
                                  Difference:{" "}
                                  {formatLengthDifference(
                                    diff,
                                    chUnit,
                                    project.language
                                  )}
                                </span>
                              )}
                            </>
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
              const chUnit = ch.lengthPlan?.unit ?? unit;
              const actual = ch.draft
                ? estimateTextLength(ch.draft, chUnit)
                : 0;
              const target = ch.lengthPlan?.targetLength;
              const diff =
                target && actual ?
                  getLengthDifference(actual, target)
                : null;

              return (
                <div key={ch.number} className="text-xs text-[#94A3B8]">
                  <span className="text-[#F8FAFC]">
                    Ch. {ch.number}: {ch.title}
                  </span>
                  {target != null && ch.draft && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span>Planned: about {target}</span>
                      <span>Actual: {actual}</span>
                      {diff != null && (
                        <span>
                          {formatLengthDifference(
                            diff,
                            chUnit,
                            project.language
                          )}
                        </span>
                      )}
                      <Badge variant={STATUS_VARIANT[status]} className="text-[10px] py-0">
                        {getLengthStatusLabel(status)}
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
      </div>
    </div>
  );
}
