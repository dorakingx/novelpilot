"use client";

import { Button } from "@/components/ui/button";
import { CHAPTER_LENGTH_BUTTON_PRESETS } from "@/lib/structure-chapter-defaults";
import {
  computeTotalPlannedLength,
  distributeLength,
  formatLengthLabel,
  validateChapterLength,
} from "@/lib/length-planning";
import { flattenPartsToChapters } from "@/lib/structure-utils";
import type { Chapter, Language, PartPlan } from "@/lib/types";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface ChapterLengthPlanListProps {
  parts: PartPlan[];
  language: Language;
  disabled?: boolean;
  showAdvancedDistribute?: boolean;
  onPartsChange: (parts: PartPlan[]) => void;
}

export function ChapterLengthPlanList({
  parts,
  language,
  disabled = false,
  showAdvancedDistribute = false,
  onPartsChange,
}: ChapterLengthPlanListProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [distributeTotal, setDistributeTotal] = useState("");
  const unit = language === "ja" ? "characters" : "words";
  const unitLabel = language === "ja" ? "characters" : "words";
  const buttons = CHAPTER_LENGTH_BUTTON_PRESETS[language];
  const chapters = flattenPartsToChapters(parts);
  const totalPlanned = computeTotalPlannedLength(parts);

  const updateChapter = (
    partIndex: number,
    chapterIndex: number,
    patch: Partial<Chapter>
  ) => {
    const next = parts.map((p, pi) => {
      if (pi !== partIndex) return p;
      return {
        ...p,
        chapters: p.chapters.map((ch, ci) =>
          ci === chapterIndex ? { ...ch, ...patch } : ch
        ),
      };
    });
    onPartsChange(next);
  };

  const updateChapterLength = (
    partIndex: number,
    chapterIndex: number,
    targetLength: number
  ) => {
    const ch = parts[partIndex]?.chapters[chapterIndex];
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

  const handleDistribute = () => {
    const total = Number(distributeTotal);
    if (!total || chapters.length === 0) return;
    const distributed = distributeLength(total, chapters, unit);
    const byNumber = new Map(distributed.map((c) => [c.number, c]));
    const next = parts.map((p) => ({
      ...p,
      chapters: p.chapters.map((ch) => {
        const d = byNumber.get(ch.number);
        return d ?? ch;
      }),
    }));
    onPartsChange(next);
  };

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold text-[#F8FAFC]">Chapter Lengths</h4>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Set length per chapter. Roles help the model understand pacing.
        </p>
      </div>

      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {parts.map((part, pi) => (
          <div key={part.id} className="space-y-2">
            {parts.length > 1 && (
              <p className="text-xs font-medium text-[#CBD5E1]">
                Part {part.number}: {part.title}
              </p>
            )}
            {part.chapters.map((ch, ci) => {
              const validation = validateChapterLength(
                ch.lengthPlan?.targetLength ?? 0,
                language
              );
              return (
                <div
                  key={ch.id ?? ch.number}
                  className="rounded-lg border border-white/10 bg-[#172033]/60 p-3 space-y-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-[#F5C542]">
                      Chapter {ch.number}
                    </span>
                    <input
                      type="text"
                      value={ch.role ?? ""}
                      onChange={(e) =>
                        updateChapter(pi, ci, { role: e.target.value })
                      }
                      placeholder="Role (e.g. Opening)"
                      disabled={disabled}
                      className="flex-1 min-w-[120px] h-8 rounded-md border border-white/12 bg-[#0B1020] px-2 text-xs text-[#F8FAFC]"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs text-[#94A3B8] shrink-0">
                      Target length:
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
                      disabled={disabled}
                      className="w-24 h-8 rounded-md border border-white/12 bg-[#0B1020] px-2 text-sm text-[#F8FAFC]"
                    />
                    <span className="text-xs text-[#94A3B8]">{unitLabel}</span>
                    <div className="flex gap-1">
                      {(
                        [
                          ["Short", buttons.short],
                          ["Standard", buttons.standard],
                          ["Long", buttons.long],
                        ] as const
                      ).map(([label, value]) => (
                        <Button
                          key={label}
                          type="button"
                          variant="glass"
                          size="sm"
                          className="h-7 text-[10px] px-2"
                          disabled={disabled}
                          onClick={() => updateChapterLength(pi, ci, value)}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {validation.warning && (
                    <p className="flex items-start gap-1.5 text-xs text-amber-200">
                      <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                      {validation.warning}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <p className="text-sm text-[#CBD5E1]">
        <span className="text-[#94A3B8]">Total planned length: </span>
        <span className="font-medium text-[#F8FAFC]">
          {formatLengthLabel(totalPlanned, unit, language)}
        </span>
      </p>

      {showAdvancedDistribute && (
        <div className="border-t border-white/10 pt-3">
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#CBD5E1]"
            onClick={() => setAdvancedOpen(!advancedOpen)}
          >
            {advancedOpen ?
              <ChevronUp className="size-3.5" />
            : <ChevronDown className="size-3.5" />}
            Advanced: Auto distribute total length
          </button>
          {advancedOpen && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={500}
                placeholder={`Total ${unitLabel}`}
                value={distributeTotal}
                onChange={(e) => setDistributeTotal(e.target.value)}
                disabled={disabled}
                className="w-32 h-8 rounded-md border border-white/12 bg-[#172033] px-2 text-sm"
              />
              <Button
                type="button"
                variant="glass"
                size="sm"
                disabled={disabled || !distributeTotal}
                onClick={handleDistribute}
              >
                Auto distribute total length
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
