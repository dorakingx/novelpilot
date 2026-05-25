import type {
  Chapter,
  ChapterLengthPlan,
  Language,
  LengthUnit,
  PartPlan,
  StoryStructureSettings,
} from "./types";
import { getLengthUnit } from "./structure-presets";

const LENGTH_LIMITS = {
  ja: { min: 500, warnMax: 10000 },
  en: { min: 200, warnMax: 4000 },
} as const;

export type ChapterLengthStatus = "under" | "near" | "over" | "none";

const NEAR_TOLERANCE = 0.15;

export function estimateTextLength(text: string, unit: LengthUnit): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  if (unit === "words") {
    return trimmed.split(/\s+/).filter(Boolean).length;
  }
  return trimmed.replace(/\s/g, "").length;
}

export function getChapterLengthStatus(
  draft: string | undefined,
  lengthPlan: ChapterLengthPlan | undefined
): ChapterLengthStatus {
  if (!lengthPlan?.targetLength) return "none";
  const actual = estimateTextLength(draft ?? "", lengthPlan.unit);
  if (actual === 0) return "none";
  const target = lengthPlan.targetLength;
  const ratio = actual / target;
  if (ratio < 1 - NEAR_TOLERANCE) return "under";
  if (ratio > 1 + NEAR_TOLERANCE) return "over";
  return "near";
}

export function sumChapterTargets(chapters: Chapter[]): number {
  return chapters.reduce((sum, ch) => sum + (ch.lengthPlan?.targetLength ?? 0), 0);
}

export function computeTotalPlannedLength(
  partsOrChapters: PartPlan[] | Chapter[]
): number {
  if (partsOrChapters.length === 0) return 0;
  const first = partsOrChapters[0];
  if ("chapters" in first) {
    let sum = 0;
    for (const part of partsOrChapters as PartPlan[]) {
      for (const ch of part.chapters) {
        sum += ch.lengthPlan?.targetLength ?? 0;
      }
    }
    return sum;
  }
  return sumChapterTargets(partsOrChapters as Chapter[]);
}

export function syncStructureTotal(
  structure: StoryStructureSettings
): StoryStructureSettings {
  const total = computeTotalPlannedLength(structure.parts);
  return {
    ...structure,
    totalTargetLength: total > 0 ? total : structure.totalTargetLength,
    totalChapterCount: structure.partCount * structure.chaptersPerPart,
  };
}

export function validateChapterLength(
  value: number,
  language: Language
): { warning?: string } {
  const limits = LENGTH_LIMITS[language];
  const unitLabel = language === "ja" ? "characters" : "words";
  if (value > 0 && value < limits.min) {
    return {
      warning: `Minimum recommended length is ${limits.min} ${unitLabel}.`,
    };
  }
  if (value > limits.warnMax) {
    return {
      warning:
        "This chapter is very long and may take more time or fail depending on model limits.",
    };
  }
  return {};
}

export function getLengthDifference(actual: number, target: number): number {
  return actual - target;
}

export function formatLengthDifference(
  diff: number,
  unit: LengthUnit,
  language: Language
): string {
  const sign = diff >= 0 ? "+" : "";
  const label = unit === "words" ? "words" : language === "ja" ? "文字" : "characters";
  return `${sign}${diff.toLocaleString()} ${label}`;
}

export function distributeLength(
  totalTargetLength: number,
  chapters: Chapter[],
  unit: LengthUnit
): Chapter[] {
  if (chapters.length === 0) return chapters;
  const perChapter = Math.max(
    1,
    Math.floor(totalTargetLength / chapters.length)
  );
  const remainder = totalTargetLength - perChapter * chapters.length;

  return chapters.map((ch, i) => {
    const extra = i < remainder ? 1 : 0;
    const targetLength = perChapter + extra;
    return {
      ...ch,
      lengthPlan: {
        targetLength,
        unit,
        minLength: Math.floor(targetLength * 0.85),
        maxLength: Math.ceil(targetLength * 1.15),
      },
    };
  });
}

export function formatLengthLabel(
  value: number,
  unit: LengthUnit,
  language: Language
): string {
  if (unit === "words") {
    return `${value.toLocaleString()} words`;
  }
  return language === "ja"
    ? `${value.toLocaleString()} 文字`
    : `${value.toLocaleString()} characters`;
}

export function getLengthStatusLabel(status: ChapterLengthStatus): string {
  switch (status) {
    case "under":
      return "Under target";
    case "near":
      return "Near target";
    case "over":
      return "Over target";
    default:
      return "Not generated";
  }
}

export { getLengthUnit };
