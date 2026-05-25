import { syncStructureTotal } from "./length-planning";
import { getLengthUnit } from "./structure-presets";
import type {
  ChapterLengthPlan,
  ChapterLengthPreset,
  Language,
  LengthUnit,
  StoryStructureSettings,
} from "./types";

const PRESET_VALUES: Record<Language, Record<ChapterLengthPreset, number>> = {
  ja: {
    "very-short": 1500,
    short: 2500,
    standard: 4000,
    long: 6000,
    "very-long": 8000,
    custom: 4000,
  },
  en: {
    "very-short": 500,
    short: 900,
    standard: 1500,
    long: 2500,
    "very-long": 3500,
    custom: 1500,
  },
};

const PRESET_LABELS: Record<
  Language,
  Record<ChapterLengthPreset, { label: string; about: string }>
> = {
  ja: {
    "very-short": { label: "Very short", about: "about 1,500 characters / chapter" },
    short: { label: "Short", about: "about 2,500 characters / chapter" },
    standard: { label: "Standard", about: "about 4,000 characters / chapter" },
    long: { label: "Long", about: "about 6,000 characters / chapter" },
    "very-long": { label: "Very long", about: "about 8,000 characters / chapter" },
    custom: { label: "Custom", about: "custom length per chapter" },
  },
  en: {
    "very-short": { label: "Very short", about: "about 500 words / chapter" },
    short: { label: "Short", about: "about 900 words / chapter" },
    standard: { label: "Standard", about: "about 1,500 words / chapter" },
    long: { label: "Long", about: "about 2,500 words / chapter" },
    "very-long": { label: "Very long", about: "about 3,500 words / chapter" },
    custom: { label: "Custom", about: "custom length per chapter" },
  },
};

export function getLengthUnitForLanguage(language: Language): LengthUnit {
  return getLengthUnit(language);
}

export function getChapterLengthPresetValue(
  language: Language,
  preset: ChapterLengthPreset
): number {
  return PRESET_VALUES[language][preset] ?? PRESET_VALUES[language].standard;
}

export function getChapterLengthPresetOptions(language: Language): Array<{
  value: ChapterLengthPreset;
  label: string;
}> {
  const presets: ChapterLengthPreset[] = [
    "very-short",
    "short",
    "standard",
    "long",
    "very-long",
    "custom",
  ];
  return presets.map((value) => {
    const meta = PRESET_LABELS[language][value];
    return {
      value,
      label: `${meta.label} — ${meta.about}`,
    };
  });
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

export function applyUniformLengthToParts(
  structure: StoryStructureSettings,
  language: Language,
  lengthPerChapter: number
): StoryStructureSettings {
  const unit = getLengthUnitForLanguage(language);
  const parts = structure.parts.map((part) => ({
    ...part,
    chapters: part.chapters.map((ch) => ({
      ...ch,
      lengthPlan: makeLengthPlan(lengthPerChapter, unit),
    })),
  }));
  return syncStructureTotal({
    ...structure,
    parts,
    lengthUnit: unit,
  });
}

export function applyChapterLengthPreset(
  structure: StoryStructureSettings,
  language: Language,
  preset: ChapterLengthPreset,
  customLengthPerChapter?: number
): StoryStructureSettings {
  const lengthPerChapter =
    preset === "custom" && customLengthPerChapter != null && customLengthPerChapter > 0
      ? customLengthPerChapter
      : getChapterLengthPresetValue(language, preset);

  let next: StoryStructureSettings = {
    ...structure,
    chapterLengthPreset: preset,
    lengthUnit: getLengthUnitForLanguage(language),
  };

  next = applyUniformLengthToParts(next, language, lengthPerChapter);
  return next;
}

export function formatApproximateLength(
  value: number,
  language: Language
): string {
  const formatted = value.toLocaleString();
  return language === "ja"
    ? `about ${formatted} 文字`
    : `about ${formatted} words`;
}

export function formatTotalPlannedSummary(
  language: Language,
  chapterCount: number,
  preset: ChapterLengthPreset,
  customLengthPerChapter?: number
): string {
  if (chapterCount <= 0) return "";
  const perChapter =
    preset === "custom" && customLengthPerChapter != null && customLengthPerChapter > 0
      ? customLengthPerChapter
      : getChapterLengthPresetValue(language, preset);
  const total = perChapter * chapterCount;
  const unitLabel =
    language === "ja" ? "characters" : "words";
  return `${chapterCount} chapter${chapterCount !== 1 ? "s" : ""} × ${formatApproximateLength(perChapter, language)} = about ${total.toLocaleString()} ${unitLabel} total`;
}

export function resolveChapterLengthPreset(
  structure: Partial<StoryStructureSettings>
): ChapterLengthPreset {
  return structure.chapterLengthPreset ?? "standard";
}
