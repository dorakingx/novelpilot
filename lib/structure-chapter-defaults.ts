import { generateStructureId } from "./structure-utils";
import type {
  Chapter,
  ChapterLengthPlan,
  Language,
  LengthUnit,
  PartPlan,
  StructurePresetId,
} from "./types";
import { getLengthUnit } from "./structure-presets";

export const CHAPTER_LENGTH_BUTTON_PRESETS = {
  ja: { short: 1500, standard: 3000, long: 5000 },
  en: { short: 700, standard: 1200, long: 2000 },
} as const;

const CHAPTER_ROLE_CYCLE = [
  "Opening",
  "Inciting Incident",
  "Investigation",
  "Midpoint",
  "Reversal",
  "Climax",
  "Resolution",
] as const;

const SHORT_3_LENGTHS: Record<Language, number[]> = {
  ja: [2500, 3500, 3000],
  en: [900, 1300, 1100],
};

function spreadLengths(count: number, min: number, max: number): number[] {
  if (count <= 1) return [Math.round((min + max) / 2)];
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) =>
    Math.round(min + step * i)
  );
}

export function getPresetChapterLengths(
  presetId: StructurePresetId,
  language: Language,
  totalChapters: number
): number[] {
  if (presetId === "short-3" && totalChapters === 3) {
    return SHORT_3_LENGTHS[language];
  }
  if (presetId === "novella-6" || (presetId === "custom" && totalChapters === 6)) {
    return spreadLengths(
      totalChapters,
      language === "ja" ? 3000 : 1200,
      language === "ja" ? 5000 : 2000
    );
  }
  if (presetId === "serial-12" || totalChapters >= 10) {
    return spreadLengths(
      totalChapters,
      language === "ja" ? 3000 : 1200,
      language === "ja" ? 6000 : 2500
    );
  }
  const std =
    language === "ja"
      ? CHAPTER_LENGTH_BUTTON_PRESETS.ja.standard
      : CHAPTER_LENGTH_BUTTON_PRESETS.en.standard;
  return Array.from({ length: totalChapters }, () => std);
}

export function getDefaultChapterRole(chapterIndex: number): string {
  return CHAPTER_ROLE_CYCLE[chapterIndex % CHAPTER_ROLE_CYCLE.length];
}

function makeLengthPlan(
  targetLength: number,
  unit: LengthUnit
): ChapterLengthPlan {
  return {
    targetLength,
    unit,
    minLength: Math.floor(targetLength * 0.85),
    maxLength: Math.ceil(targetLength * 1.15),
  };
}

export interface BuildSkeletonPartsOptions {
  language: Language;
  presetId: StructurePresetId;
  partCount: number;
  chaptersPerPart: number;
  existingParts?: PartPlan[];
}

export function buildSkeletonParts(
  options: BuildSkeletonPartsOptions
): PartPlan[] {
  const { language, presetId, partCount, chaptersPerPart, existingParts } =
    options;
  const unit = getLengthUnit(language);
  const totalChapters = partCount * chaptersPerPart;
  const lengths = getPresetChapterLengths(presetId, language, totalChapters);

  const existingByNumber = new Map<number, Chapter>();
  if (existingParts?.length) {
    for (const part of existingParts) {
      for (const ch of part.chapters) {
        existingByNumber.set(ch.number, ch);
      }
    }
  }

  const parts: PartPlan[] = [];
  let chapterNum = 0;

  for (let p = 0; p < partCount; p++) {
    const partNumber = p + 1;
    const existingPart = existingParts?.[p];
    const chapters: Chapter[] = [];

    for (let c = 0; c < chaptersPerPart; c++) {
      chapterNum += 1;
      const idx = chapterNum - 1;
      const existing = existingByNumber.get(chapterNum);
      const defaultLength = lengths[idx] ?? lengths[lengths.length - 1] ?? 3000;
      const targetLength =
        existing?.lengthPlan?.targetLength && existing.lengthPlan.targetLength > 0
          ? existing.lengthPlan.targetLength
          : defaultLength;

      chapters.push({
        id: existing?.id ?? generateStructureId("ch"),
        number: chapterNum,
        partNumber,
        title: existing?.title?.trim() ? existing.title : `Chapter ${chapterNum}`,
        role: existing?.role?.trim() ? existing.role : getDefaultChapterRole(idx),
        purpose: existing?.purpose ?? "",
        emotionalTurn: existing?.emotionalTurn ?? "",
        keyEvents: existing?.keyEvents ?? [],
        foreshadowing: existing?.foreshadowing ?? [],
        lengthPlan: makeLengthPlan(targetLength, unit),
      });
    }

    parts.push({
      id: existingPart?.id ?? generateStructureId("part"),
      number: partNumber,
      title:
        existingPart?.title?.trim() ?
          existingPart.title
        : partCount === 1 ?
          "Main"
        : `Part ${partNumber}`,
      purpose: existingPart?.purpose ?? `Part ${partNumber} narrative arc`,
      chapters,
    });
  }

  return parts;
}

export function presetToTargetLength(
  presetId: StructurePresetId
): "flash-fiction" | "short-story" | "novella-outline" {
  switch (presetId) {
    case "novella-6":
      return "novella-outline";
    case "serial-12":
      return "novella-outline";
    default:
      return "short-story";
  }
}
