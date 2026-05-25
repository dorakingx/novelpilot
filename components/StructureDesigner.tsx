"use client";

import { Button } from "@/components/ui/button";
import { formatLengthLabel, sumChapterTargets } from "@/lib/length-planning";
import type { Chapter, PartPlan, StoryProject } from "@/lib/types";
import { AlertTriangle, Check, RefreshCw } from "lucide-react";
import { useMemo } from "react";

interface StructureDesignerProps {
  project: StoryProject;
  isRunning?: boolean;
  onApproveAndContinue: () => void;
  onRegenerateStructure: () => void;
  onRedistributeLength: () => void;
  onUpdateStructure: (parts: PartPlan[]) => void;
  onBackToWorkspace?: () => void;
}

export function StructureDesigner({
  project,
  isRunning = false,
  onApproveAndContinue,
  onRegenerateStructure,
  onRedistributeLength,
  onUpdateStructure,
  onBackToWorkspace,
}: StructureDesignerProps) {
  const localParts = project.storyBible.parts?.length
    ? project.storyBible.parts
    : [];

  const chapters = useMemo(
    () =>
      localParts
        .flatMap((p) => p.chapters)
        .sort((a, b) => a.number - b.number),
    [localParts]
  );

  const totalTarget = project.structure.totalTargetLength ?? 0;
  const sumTargets = sumChapterTargets(chapters);
  const unit = project.structure.lengthUnit;
  const mismatch =
    totalTarget > 0 && Math.abs(sumTargets - totalTarget) > totalTarget * 0.05;

  const updatePart = (partIndex: number, field: "title" | "purpose", value: string) => {
    const next = localParts.map((p, i) =>
      i === partIndex ? { ...p, [field]: value } : p
    );
    onUpdateStructure(next);
  };

  const updateChapter = (
    partIndex: number,
    chapterIndex: number,
    patch: Partial<Chapter>
  ) => {
    const next = localParts.map((p, pi) => {
      if (pi !== partIndex) return p;
      return {
        ...p,
        chapters: p.chapters.map((ch, ci) =>
          ci === chapterIndex ? { ...ch, ...patch } : ch
        ),
      };
    });
    onUpdateStructure(next);
  };

  const updateChapterLength = (
    partIndex: number,
    chapterIndex: number,
    targetLength: number
  ) => {
    const ch = localParts[partIndex]?.chapters[chapterIndex];
    if (!ch) return;
    updateChapter(partIndex, chapterIndex, {
      lengthPlan: {
        targetLength,
        unit,
        minLength: Math.floor(targetLength * 0.85),
        maxLength: Math.ceil(targetLength * 1.15),
      },
    });
  };

  return (
    <div className="surface-card premium-border rounded-2xl p-6 space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-[#F8FAFC]">
          Structure Designer
        </h2>
        <p className="text-sm text-[#94A3B8] mt-1">
          Review and edit parts and chapters before the Prose Writer starts.
          Long works draft one chapter at a time.
        </p>
      </div>

      {mismatch && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>
            Chapter targets ({sumTargets.toLocaleString()} {unit}) do not add
            up to the total target ({totalTarget.toLocaleString()} {unit}).
            Use Redistribute evenly to fix.
          </span>
        </div>
      )}

      <div className="text-xs text-[#94A3B8] flex flex-wrap gap-4">
        <span>
          Total target:{" "}
          {formatLengthLabel(totalTarget, unit, project.language)}
        </span>
        <span>
          Sum of chapter targets:{" "}
          {formatLengthLabel(sumTargets, unit, project.language)}
        </span>
        <span>{chapters.length} chapters · {localParts.length} parts</span>
      </div>

      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
        {localParts.map((part, pi) => (
          <div
            key={part.id}
            className="rounded-xl border border-white/10 bg-[#172033]/60 p-4 space-y-3"
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="text-xs text-[#94A3B8]">Part title</label>
                <input
                  value={part.title}
                  onChange={(e) => updatePart(pi, "title", e.target.value)}
                  disabled={isRunning}
                  className="mt-1 flex h-9 w-full rounded-md border border-white/12 bg-[#0B1020] px-3 text-sm text-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8]">Part purpose</label>
                <input
                  value={part.purpose}
                  onChange={(e) => updatePart(pi, "purpose", e.target.value)}
                  disabled={isRunning}
                  className="mt-1 flex h-9 w-full rounded-md border border-white/12 bg-[#0B1020] px-3 text-sm text-[#F8FAFC]"
                />
              </div>
            </div>

            {part.chapters.map((ch, ci) => (
              <div
                key={ch.id ?? ch.number}
                className="rounded-lg border border-white/8 bg-[#0B1020]/80 p-3 space-y-2"
              >
                <p className="text-xs font-medium text-[#F5C542]">
                  Chapter {ch.number}: {ch.title}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-[#94A3B8]">Title</label>
                    <input
                      value={ch.title}
                      onChange={(e) =>
                        updateChapter(pi, ci, { title: e.target.value })
                      }
                      disabled={isRunning}
                      className="mt-1 flex h-8 w-full rounded-md border border-white/12 bg-[#172033] px-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#94A3B8]">
                      Target ({unit})
                    </label>
                    <input
                      type="number"
                      min={100}
                      value={ch.lengthPlan?.targetLength ?? ""}
                      onChange={(e) =>
                        updateChapterLength(
                          pi,
                          ci,
                          Number(e.target.value) || 0
                        )
                      }
                      disabled={isRunning}
                      className="mt-1 flex h-8 w-full rounded-md border border-white/12 bg-[#172033] px-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#94A3B8]">Purpose</label>
                  <input
                    value={ch.purpose}
                    onChange={(e) =>
                      updateChapter(pi, ci, { purpose: e.target.value })
                    }
                    disabled={isRunning}
                    className="mt-1 flex h-8 w-full rounded-md border border-white/12 bg-[#172033] px-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#94A3B8]">
                    Emotional turn
                  </label>
                  <input
                    value={ch.emotionalTurn}
                    onChange={(e) =>
                      updateChapter(pi, ci, { emotionalTurn: e.target.value })
                    }
                    disabled={isRunning}
                    className="mt-1 flex h-8 w-full rounded-md border border-white/12 bg-[#172033] px-2 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
        <Button
          variant="premium"
          onClick={onApproveAndContinue}
          disabled={isRunning || chapters.length === 0}
        >
          <Check className="mr-2 size-4" />
          Approve Structure and Start Drafting
        </Button>
        <Button
          variant="glass"
          onClick={onRedistributeLength}
          disabled={isRunning || !totalTarget}
        >
          Redistribute evenly
        </Button>
        <Button
          variant="glass"
          onClick={onRegenerateStructure}
          disabled={isRunning}
        >
          <RefreshCw className="mr-2 size-4" />
          Regenerate Structure
        </Button>
        {onBackToWorkspace && (
          <Button variant="ghost" onClick={onBackToWorkspace} disabled={isRunning}>
            Back to Workspace
          </Button>
        )}
      </div>
    </div>
  );
}
