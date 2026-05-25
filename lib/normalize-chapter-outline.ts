import {
  flattenPartsToChapters,
  generateStructureId,
  parseChapterFromRaw,
  parsePartFromRaw,
  wrapChaptersInSinglePart,
} from "./structure-utils";
import type { Chapter, PartPlan, StoryProject } from "./types";

const MAX_STRING_LEN = 180;
const MAX_KEY_EVENTS = 3;
const MAX_FORESHADOWING = 2;
const MAX_TRACKER_ITEMS = 4;

function trimStr(value: unknown, max = MAX_STRING_LEN): string {
  const s = String(value ?? "").trim();
  return s.length > max ? s.slice(0, max) : s;
}

function trimStringArray(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => trimStr(v))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeChapterRaw(
  ch: Record<string, unknown>,
  partNumber: number
): Record<string, unknown> {
  return {
    id: ch.id != null ? String(ch.id) : generateStructureId("ch"),
    number: Number(ch.number ?? 0),
    partNumber: ch.partNumber != null ? Number(ch.partNumber) : partNumber,
    title: trimStr(ch.title) || `Chapter ${ch.number ?? ""}`,
    role: ch.role != null ? trimStr(ch.role) : undefined,
    purpose: trimStr(ch.purpose),
    emotionalTurn: trimStr(ch.emotionalTurn),
    keyEvents: trimStringArray(ch.keyEvents, MAX_KEY_EVENTS),
    foreshadowing: trimStringArray(ch.foreshadowing, MAX_FORESHADOWING),
    lengthPlan: ch.lengthPlan,
  };
}

function normalizePartRaw(part: Record<string, unknown>): Record<string, unknown> {
  const partNumber = Number(part.number ?? 0);
  const chaptersRaw = Array.isArray(part.chapters) ? part.chapters : [];
  return {
    id: part.id != null ? String(part.id) : generateStructureId("part"),
    number: partNumber,
    title: trimStr(part.title) || `Part ${partNumber}`,
    purpose: trimStr(part.purpose),
    targetLength:
      part.targetLength != null ? Number(part.targetLength) : undefined,
    chapters: chaptersRaw.map((ch) =>
      normalizeChapterRaw(ch as Record<string, unknown>, partNumber)
    ),
  };
}

function chapterToJson(ch: Chapter): Record<string, unknown> {
  return {
    id: ch.id,
    number: ch.number,
    partNumber: ch.partNumber,
    title: ch.title,
    role: ch.role,
    purpose: ch.purpose,
    emotionalTurn: ch.emotionalTurn,
    keyEvents: ch.keyEvents,
    foreshadowing: ch.foreshadowing,
    lengthPlan: ch.lengthPlan,
  };
}

function partToJson(part: PartPlan): Record<string, unknown> {
  return {
    id: part.id,
    number: part.number,
    title: part.title,
    purpose: part.purpose,
    targetLength: part.targetLength,
    chapters: part.chapters.map(chapterToJson),
  };
}

export function normalizeChapterOutlineOutput(
  raw: unknown,
  project: StoryProject
): Record<string, unknown> {
  const language = project.language;
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;

  const partsRaw = Array.isArray(o.parts)
    ? (o.parts as Record<string, unknown>[]).map(normalizePartRaw)
    : [];

  const flatRaw = Array.isArray(o.chapters)
    ? (o.chapters as Record<string, unknown>[]).map((ch) => {
        const partNum = ch.partNumber != null ? Number(ch.partNumber) : 1;
        return normalizeChapterRaw(ch, partNum);
      })
    : [];

  let parsedParts: PartPlan[] =
    partsRaw.length > 0
      ? partsRaw.map((p) => parsePartFromRaw(p, language))
      : [];

  if (parsedParts.length === 0 && flatRaw.length > 0) {
    const chapters = flatRaw.map((ch) =>
      parseChapterFromRaw(ch, language)
    );
    parsedParts = wrapChaptersInSinglePart(chapters);
  }

  const flatChapters = flattenPartsToChapters(parsedParts);

  const foreshadowingTracker = Array.isArray(o.foreshadowingTracker)
    ? o.foreshadowingTracker.slice(0, MAX_TRACKER_ITEMS).map((item) => {
        const row = (item && typeof item === "object" ? item : {}) as Record<
          string,
          unknown
        >;
        return {
          item: trimStr(row.item),
          introducedIn: trimStr(row.introducedIn),
          status: trimStr(row.status) || "planned",
          suggestedPayoff: trimStr(row.suggestedPayoff),
          payoffChapter: trimStr(row.payoffChapter),
          emotionalPurpose: trimStr(row.emotionalPurpose),
        };
      })
    : [];

  const styleGuide =
    o.styleGuide && typeof o.styleGuide === "object"
      ? {
          pov: trimStr((o.styleGuide as Record<string, unknown>).pov),
          tense: trimStr((o.styleGuide as Record<string, unknown>).tense),
          proseStyle: trimStr(
            (o.styleGuide as Record<string, unknown>).proseStyle
          ),
          dialogueNotes: trimStr(
            (o.styleGuide as Record<string, unknown>).dialogueNotes
          ),
          taboos: trimStringArray(
            (o.styleGuide as Record<string, unknown>).taboos,
            8
          ),
        }
      : undefined;

  return {
    parts: parsedParts.map(partToJson),
    chapters: flatChapters.map(chapterToJson),
    ...(styleGuide ? { styleGuide } : {}),
    foreshadowingTracker,
    ...(o.fallbackGenerated ? { fallbackGenerated: true } : {}),
  };
}
