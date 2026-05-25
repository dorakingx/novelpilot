import { buildDefaultStructure, targetLengthToPreset } from "./structure-presets";
import type {
  Chapter,
  ChapterLengthPlan,
  Language,
  PartPlan,
  ProjectSettings,
  StoryProject,
  StoryStructureSettings,
} from "./types";

export function generateStructureId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function resolveTotalChapterCount(structure: StoryStructureSettings): number {
  return structure.partCount * structure.chaptersPerPart;
}

export function flattenPartsToChapters(parts: PartPlan[]): Chapter[] {
  const chapters: Chapter[] = [];
  for (const part of parts) {
    for (const ch of part.chapters) {
      chapters.push({
        ...ch,
        partNumber: part.number,
      });
    }
  }
  return chapters.sort((a, b) => a.number - b.number);
}

export function wrapChaptersInSinglePart(
  chapters: Chapter[],
  title = "Main"
): PartPlan[] {
  if (chapters.length === 0) return [];
  return [
    {
      id: generateStructureId("part"),
      number: 1,
      title,
      purpose: "Main narrative arc",
      chapters: chapters.map((ch) => ({
        ...ch,
        partNumber: 1,
        id: ch.id ?? generateStructureId("ch"),
      })),
    },
  ];
}

export function syncPartsAndChapters(
  parts: PartPlan[],
  flatChapters?: Chapter[]
): { parts: PartPlan[]; chapters: Chapter[] } {
  const syncedParts = parts.map((part) => ({
    ...part,
    id: part.id || generateStructureId("part"),
    chapters: part.chapters.map((ch) => ({
      ...ch,
      id: ch.id ?? generateStructureId("ch"),
      partNumber: part.number,
    })),
  }));

  const chapters =
    flatChapters && flatChapters.length > 0
      ? flatChapters.map((ch) => {
          const part = syncedParts.find((p) => p.number === ch.partNumber);
          return {
            ...ch,
            id: ch.id ?? generateStructureId("ch"),
            partNumber: ch.partNumber ?? part?.number ?? 1,
          };
        })
      : flattenPartsToChapters(syncedParts);

  const chaptersByNumber = new Map(chapters.map((c) => [c.number, c]));
  const mergedParts = syncedParts.map((part) => ({
    ...part,
    chapters: part.chapters.map((ch) => {
      const flat = chaptersByNumber.get(ch.number);
      return flat ? { ...flat, ...ch, id: flat.id ?? ch.id } : ch;
    }),
  }));

  return {
    parts: mergedParts,
    chapters: flattenPartsToChapters(mergedParts),
  };
}

export function getStructureFromProject(
  project: StoryProject,
  settings?: ProjectSettings
): StoryStructureSettings {
  if (settings?.structure) return settings.structure;
  const stored = (project as StoryProject & { structure?: StoryStructureSettings })
    .structure;
  if (stored) return stored;
  return buildDefaultStructure(
    project.language,
    targetLengthToPreset(project.targetLength)
  );
}

export function getAllChapters(project: StoryProject): Chapter[] {
  const { parts, chapters } = project.storyBible;
  if (parts?.length) return flattenPartsToChapters(parts);
  return chapters ?? [];
}

export function parseLengthPlan(raw: unknown, language: Language): ChapterLengthPlan | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const targetLength = Number(o.targetLength ?? 0);
  if (!targetLength) return undefined;
  const unit =
    o.unit === "characters" || o.unit === "words"
      ? o.unit
      : language === "ja"
        ? "characters"
        : "words";
  return {
    targetLength,
    unit,
    minLength: o.minLength != null ? Number(o.minLength) : undefined,
    maxLength: o.maxLength != null ? Number(o.maxLength) : undefined,
  };
}

export function parseChapterFromRaw(
  ch: Record<string, unknown>,
  language: Language
): Chapter {
  return {
    id: String(ch.id ?? generateStructureId("ch")),
    number: Number(ch.number ?? 0),
    partNumber: ch.partNumber != null ? Number(ch.partNumber) : undefined,
    title: String(ch.title ?? ""),
    role: ch.role != null ? String(ch.role) : undefined,
    purpose: String(ch.purpose ?? ""),
    emotionalTurn: String(ch.emotionalTurn ?? ""),
    keyEvents: Array.isArray(ch.keyEvents) ? ch.keyEvents.map(String) : [],
    foreshadowing: Array.isArray(ch.foreshadowing)
      ? ch.foreshadowing.map(String)
      : [],
    lengthPlan: parseLengthPlan(ch.lengthPlan, language),
    draft: ch.draft != null ? String(ch.draft) : undefined,
    chapterSummary:
      ch.chapterSummary != null ? String(ch.chapterSummary) : undefined,
    continuityNotes: Array.isArray(ch.continuityNotes)
      ? ch.continuityNotes.map(String)
      : [],
  };
}

export function parsePartFromRaw(
  part: Record<string, unknown>,
  language: Language
): PartPlan {
  const chaptersRaw = Array.isArray(part.chapters) ? part.chapters : [];
  const partNumber = Number(part.number ?? 0);
  return {
    id: String(part.id ?? generateStructureId("part")),
    number: partNumber,
    title: String(part.title ?? ""),
    purpose: String(part.purpose ?? ""),
    targetLength:
      part.targetLength != null ? Number(part.targetLength) : undefined,
    chapters: chaptersRaw.map((ch) =>
      parseChapterFromRaw(ch as Record<string, unknown>, language)
    ),
  };
}

export function shouldUseSequentialDrafting(
  structure: StoryStructureSettings
): boolean {
  return resolveTotalChapterCount(structure) > 3;
}

/** Preserve user-defined per-chapter length and role from launcher skeleton */
export function mergePreservedChapterPlans(
  userParts: PartPlan[],
  aiParts: PartPlan[]
): PartPlan[] {
  const userByNumber = new Map<number, Chapter>();
  for (const part of userParts) {
    for (const ch of part.chapters) {
      userByNumber.set(ch.number, ch);
    }
  }

  return aiParts.map((part) => ({
    ...part,
    chapters: part.chapters.map((ch) => {
      const user = userByNumber.get(ch.number);
      if (!user) return ch;

      const preservedLength =
        user.lengthPlan?.targetLength && user.lengthPlan.targetLength > 0 ?
          user.lengthPlan
        : ch.lengthPlan;

      const preservedRole =
        user.role?.trim() ? user.role : ch.role;

      return {
        ...ch,
        role: preservedRole,
        lengthPlan: preservedLength ?? ch.lengthPlan,
        ...(user.title?.trim() && user.title.startsWith("Chapter ") === false ?
          {}
        : {}),
      };
    }),
  }));
}

