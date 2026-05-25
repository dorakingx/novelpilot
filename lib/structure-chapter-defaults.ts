import { getChapterLengthPresetValue } from "./chapter-length-presets";
import { generateStructureId } from "./structure-utils";
import type {
  Chapter,
  ChapterLengthPreset,
  Language,
  PartPlan,
  StructurePresetId,
} from "./types";
import { getLengthUnit } from "./structure-presets";

function makeLengthPlan(
  targetLength: number,
  unit: ReturnType<typeof getLengthUnit>
) {
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
  chapterLengthPreset?: ChapterLengthPreset;
  customLengthPerChapter?: number;
  existingParts?: PartPlan[];
}

export function buildSkeletonParts(
  options: BuildSkeletonPartsOptions
): PartPlan[] {
  const {
    language,
    partCount,
    chaptersPerPart,
    chapterLengthPreset = "standard",
    customLengthPerChapter,
    existingParts,
  } = options;
  const unit = getLengthUnit(language);
  const preset = chapterLengthPreset;
  const uniformLength =
    preset === "custom" && customLengthPerChapter != null && customLengthPerChapter > 0
      ? customLengthPerChapter
      : getChapterLengthPresetValue(language, preset);

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
      const existing = existingByNumber.get(chapterNum);
      const targetLength =
        existing?.lengthPlan?.targetLength && existing.lengthPlan.targetLength > 0
          ? existing.lengthPlan.targetLength
          : uniformLength;

      chapters.push({
        id: existing?.id ?? generateStructureId("ch"),
        number: chapterNum,
        partNumber,
        title: `Chapter ${chapterNum}`,
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
        partCount === 1 ? "Main" : `Part ${partNumber}`,
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

export function isPlaceholderChapterTitle(title: string): boolean {
  return /^Chapter \d+$/i.test(title.trim());
}
