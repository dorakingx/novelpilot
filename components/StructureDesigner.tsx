"use client";

import { ChapterLengthPlanList } from "@/components/ChapterLengthPlanList";
import { Button } from "@/components/ui/button";
import {
  computeTotalPlannedLength,
  formatLengthLabel,
} from "@/lib/length-planning";
import type { PartPlan, StoryProject } from "@/lib/types";
import { Check, RefreshCw } from "lucide-react";

interface StructureDesignerProps {
  project: StoryProject;
  isRunning?: boolean;
  onApproveAndContinue: () => void;
  onRegenerateStructure: () => void;
  onUpdateStructure: (parts: PartPlan[]) => void;
  onBackToWorkspace?: () => void;
}

export function StructureDesigner({
  project,
  isRunning = false,
  onApproveAndContinue,
  onRegenerateStructure,
  onUpdateStructure,
  onBackToWorkspace,
}: StructureDesignerProps) {
  const localParts = project.storyBible.parts?.length
    ? project.storyBible.parts
    : project.structure.parts ?? [];

  const unit = project.structure.lengthUnit;
  const totalPlanned = computeTotalPlannedLength(localParts);
  const chapterCount = localParts.flatMap((p) => p.chapters).length;

  const handlePartsChange = (parts: PartPlan[]) => {
    onUpdateStructure(parts);
  };

  return (
    <div className="surface-card premium-border rounded-2xl p-6 space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-[#F8FAFC]">
          Structure Designer
        </h2>
        <p className="text-sm text-[#94A3B8] mt-1">
          Review and edit parts and chapter lengths before the Prose Writer starts.
          Long works draft one chapter at a time.
        </p>
      </div>

      <div className="text-xs text-[#94A3B8] flex flex-wrap gap-4">
        <span>
          Total planned length:{" "}
          <span className="text-[#F8FAFC] font-medium">
            {formatLengthLabel(totalPlanned, unit, project.language)}
          </span>
        </span>
        <span>
          {chapterCount} chapters · {localParts.length} parts
        </span>
      </div>

      {localParts.length > 0 && (
        <ChapterLengthPlanList
          parts={localParts}
          language={project.language}
          disabled={isRunning}
          showAdvancedDistribute
          onPartsChange={handlePartsChange}
        />
      )}

      <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
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
                  onChange={(e) => {
                    const next = localParts.map((p, i) =>
                      i === pi ? { ...p, title: e.target.value } : p
                    );
                    handlePartsChange(next);
                  }}
                  disabled={isRunning}
                  className="mt-1 flex h-9 w-full rounded-md border border-white/12 bg-[#0B1020] px-3 text-sm text-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8]">Part purpose</label>
                <input
                  value={part.purpose}
                  onChange={(e) => {
                    const next = localParts.map((p, i) =>
                      i === pi ? { ...p, purpose: e.target.value } : p
                    );
                    handlePartsChange(next);
                  }}
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
                  Chapter {ch.number}
                  {ch.role?.trim() ? ` — ${ch.role}` : ""}: {ch.title}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-[#94A3B8]">Title</label>
                    <input
                      value={ch.title}
                      onChange={(e) => {
                        const next = localParts.map((p, i) =>
                          i === pi ?
                            {
                              ...p,
                              chapters: p.chapters.map((c, j) =>
                                j === ci ? { ...c, title: e.target.value } : c
                              ),
                            }
                          : p
                        );
                        handlePartsChange(next);
                      }}
                      disabled={isRunning}
                      className="mt-1 flex h-8 w-full rounded-md border border-white/12 bg-[#172033] px-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#94A3B8]">Purpose</label>
                    <input
                      value={ch.purpose}
                      onChange={(e) => {
                        const next = localParts.map((p, i) =>
                          i === pi ?
                            {
                              ...p,
                              chapters: p.chapters.map((c, j) =>
                                j === ci ? { ...c, purpose: e.target.value } : c
                              ),
                            }
                          : p
                        );
                        handlePartsChange(next);
                      }}
                      disabled={isRunning}
                      className="mt-1 flex h-8 w-full rounded-md border border-white/12 bg-[#172033] px-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#94A3B8]">Emotional turn</label>
                  <input
                    value={ch.emotionalTurn}
                    onChange={(e) => {
                      const next = localParts.map((p, i) =>
                        i === pi ?
                          {
                            ...p,
                            chapters: p.chapters.map((c, j) =>
                              j === ci ?
                                { ...c, emotionalTurn: e.target.value }
                              : c
                            ),
                          }
                        : p
                      );
                      handlePartsChange(next);
                    }}
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
          disabled={isRunning || chapterCount === 0}
        >
          <Check className="mr-2 size-4" />
          Approve Structure and Start Drafting
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
