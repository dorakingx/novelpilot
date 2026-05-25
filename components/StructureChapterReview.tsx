"use client";

import { formatApproximateLength } from "@/lib/chapter-length-presets";
import { isPlaceholderChapterTitle } from "@/lib/structure-chapter-defaults";
import type { Language, PartPlan } from "@/lib/types";

interface StructureChapterReviewProps {
  parts: PartPlan[];
  language: Language;
}

export function StructureChapterReview({
  parts,
  language,
}: StructureChapterReviewProps) {
  return (
    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
      {parts.map((part) => (
        <div key={part.id} className="space-y-2">
          {parts.length > 1 && (
            <p className="text-xs font-medium text-[#CBD5E1]">
              Part {part.number}: {part.title}
            </p>
          )}
          {part.chapters.map((ch) => {
            const title =
              ch.title?.trim() && !isPlaceholderChapterTitle(ch.title)
                ? ch.title
                : "(title pending)";
            const len = ch.lengthPlan?.targetLength ?? 0;
            const lengthLabel =
              len > 0 ? formatApproximateLength(len, language) : "—";
            return (
              <div
                key={ch.id ?? ch.number}
                className="rounded-lg border border-white/10 bg-[#172033]/60 p-3 space-y-1"
              >
                <p className="text-sm font-medium text-[#F8FAFC]">
                  Chapter {ch.number}: {title}
                </p>
                {ch.purpose?.trim() && (
                  <p className="text-xs text-[#94A3B8]">{ch.purpose}</p>
                )}
                <p className="text-xs text-[#64748B]">{lengthLabel}</p>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
