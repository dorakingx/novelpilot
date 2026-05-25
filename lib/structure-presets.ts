import { syncStructureTotal } from "./length-planning";
import { buildSkeletonParts } from "./structure-chapter-defaults";
import type { Language, LengthUnit, StoryStructureSettings, StructurePresetId } from "./types";

export interface StructurePresetDefinition {
  id: StructurePresetId;
  label: string;
  description: string;
  partCount: number;
  chaptersPerPart: number;
  totalChapterCount: number;
  defaultEnglishWords: number;
  defaultJapaneseCharacters: number;
}

export const STRUCTURE_PRESETS: StructurePresetDefinition[] = [
  {
    id: "short-3",
    label: "Short Story",
    description: "3 chapters, compact complete story",
    partCount: 1,
    chaptersPerPart: 3,
    totalChapterCount: 3,
    defaultEnglishWords: 3000,
    defaultJapaneseCharacters: 9000,
  },
  {
    id: "novella-6",
    label: "Novella",
    description: "2 parts × 3 chapters",
    partCount: 2,
    chaptersPerPart: 3,
    totalChapterCount: 6,
    defaultEnglishWords: 9000,
    defaultJapaneseCharacters: 27000,
  },
  {
    id: "serial-12",
    label: "Serialized Novel Plan",
    description: "3 parts × 4 chapters",
    partCount: 3,
    chaptersPerPart: 4,
    totalChapterCount: 12,
    defaultEnglishWords: 24000,
    defaultJapaneseCharacters: 72000,
  },
  {
    id: "custom",
    label: "Custom",
    description: "Choose parts, chapters, and length manually",
    partCount: 1,
    chaptersPerPart: 3,
    totalChapterCount: 3,
    defaultEnglishWords: 3000,
    defaultJapaneseCharacters: 9000,
  },
];

export const RECOMMENDED_MAX_LENGTH = {
  en: 24000,
  ja: 72000,
} as const;

export function getPresetById(id: StructurePresetId): StructurePresetDefinition {
  return STRUCTURE_PRESETS.find((p) => p.id === id) ?? STRUCTURE_PRESETS[0];
}

export function getDefaultTotalLength(
  language: Language,
  preset: StructurePresetDefinition
): number {
  return language === "ja"
    ? preset.defaultJapaneseCharacters
    : preset.defaultEnglishWords;
}

export function getLengthUnit(language: Language): LengthUnit {
  return language === "ja" ? "characters" : "words";
}

export function applyPresetToStructure(
  structure: StoryStructureSettings,
  presetId: StructurePresetId,
  language: Language
): StoryStructureSettings {
  const preset = getPresetById(presetId);
  const partCount = presetId === "custom" ? structure.partCount : preset.partCount;
  const chaptersPerPart =
    presetId === "custom" ? structure.chaptersPerPart : preset.chaptersPerPart;
  return buildDefaultStructure(language, presetId, {
    mode: structure.mode,
    partCount,
    chaptersPerPart,
    existingParts: presetId === "custom" ? structure.parts : undefined,
  });
}

export function buildDefaultStructure(
  language: Language,
  presetId: StructurePresetId = "short-3",
  overrides?: Partial<StoryStructureSettings> & {
    existingParts?: StoryStructureSettings["parts"];
  }
): StoryStructureSettings {
  const preset = getPresetById(presetId);
  const partCount = overrides?.partCount ?? preset.partCount;
  const chaptersPerPart =
    overrides?.chaptersPerPart ?? preset.chaptersPerPart;
  const totalChapterCount = partCount * chaptersPerPart;
  const resolvedPresetId = presetId === "custom" ? "custom" : presetId;

  const parts =
    overrides?.parts?.length ?
      overrides.parts
    : buildSkeletonParts({
        language,
        presetId: resolvedPresetId,
        partCount,
        chaptersPerPart,
        existingParts: overrides?.existingParts,
      });

  const base: StoryStructureSettings = {
    mode: overrides?.mode ?? "auto",
    presetId: resolvedPresetId,
    lengthUnit: getLengthUnit(language),
    partCount,
    chaptersPerPart,
    totalChapterCount,
    parts,
  };

  return syncStructureTotal(base);
}

export function targetLengthToPreset(
  targetLength: "flash-fiction" | "short-story" | "novella-outline"
): StructurePresetId {
  switch (targetLength) {
    case "flash-fiction":
      return "short-3";
    case "novella-outline":
      return "novella-6";
    default:
      return "short-3";
  }
}
