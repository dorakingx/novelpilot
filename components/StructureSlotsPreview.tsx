"use client";

import { formatApproximateLength } from "@/lib/chapter-length-presets";
import type { Language, PartPlan } from "@/lib/types";

interface StructureSlotsPreviewProps {
  parts: PartPlan[];
  language: Language;
}

export function StructureSlotsPreview({
  parts,
  language,
}: StructureSlotsPreviewProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#172033]/40 p-3 space-y-2">
      <p className="text-xs font-medium text-[#94A3B8]">Chapter slots</p>
      <ul className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
        {parts.map((part) =>
          part.chapters.map((ch) => {
            const len = ch.lengthPlan?.targetLength ?? 0;
            const lengthLabel =
              len > 0 ? formatApproximateLength(len, language) : "—";
            const titleLabel =
              ch.title?.trim() && !/^Chapter \d+$/i.test(ch.title.trim())
                ? ch.title
                : "title will be generated";
            return (
              <li
                key={ch.id ?? `ch-${ch.number}`}
                className="text-xs text-[#CBD5E1] flex flex-wrap gap-x-2"
              >
                <span className="text-[#F5C542] font-medium">
                  Chapter {ch.number}
                </span>
                <span className="text-[#94A3B8]">— {titleLabel}</span>
                <span className="text-[#64748B]">({lengthLabel})</span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
