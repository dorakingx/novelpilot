import { buildChapterArchitectSkeleton } from "./chapter-architect-context";
import {
  flattenPartsToChapters,
  parsePartFromRaw,
} from "./structure-utils";
import type { Chapter, PartPlan, StoryProject } from "./types";

export const MAX_STRING_LEN = 120;
const MAX_KEY_EVENTS = 2;
const MAX_FORESHADOWING = 1;
const MAX_TRACKER_ITEMS = 3;

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

function findParsedChapter(parsed: Record<string, unknown>, partNumber: number, chapterNumber: number): Record<string, unknown> | undefined {
  const parts = Array.isArray(parsed.parts) ? parsed.parts : [];
  for (const part of parts) {
    const p = part as Record<string, unknown>;
    if (Number(p.number) !== partNumber) continue;
    const chapters = Array.isArray(p.chapters) ? p.chapters : [];
    for (const ch of chapters) {
      const row = ch as Record<string, unknown>;
      if (Number(row.number) === chapterNumber) return row;
    }
  }
  return undefined;
}

export function mergeOutlineFillIntoSkeleton(
  skeleton: PartPlan[],
  parsed: Record<string, unknown>
): PartPlan[] {
  return skeleton.map((part) => {
    const parsedPart = (Array.isArray(parsed.parts) ? parsed.parts : []).find(
      (p) => Number((p as Record<string, unknown>).number) === part.number
    ) as Record<string, unknown> | undefined;

    return {
      ...part,
      title: trimStr(parsedPart?.title) || part.title,
      purpose: trimStr(parsedPart?.purpose) || part.purpose,
      chapters: part.chapters.map((ch) => {
        const fill =
          findParsedChapter(parsed, part.number, ch.number) ??
          (parsedPart
            ? (Array.isArray(parsedPart.chapters) ? parsedPart.chapters : [])
                .map((c) => c as Record<string, unknown>)
                .find((c) => Number(c.number) === ch.number)
            : undefined);

        return {
          ...ch,
          title: trimStr(fill?.title) || ch.title || `Chapter ${ch.number}`,
          role: ch.role,
          purpose: trimStr(fill?.purpose) || ch.purpose || `Chapter ${ch.number} progresses the main conflict.`,
          emotionalTurn: trimStr(fill?.emotionalTurn) || ch.emotionalTurn,
          keyEvents: trimStringArray(fill?.keyEvents, MAX_KEY_EVENTS),
          foreshadowing: trimStringArray(fill?.foreshadowing, MAX_FORESHADOWING),
          lengthPlan: ch.lengthPlan,
        };
      }),
    };
  });
}

export function validateChapterOutline(
  parts: PartPlan[],
  project: StoryProject
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (parts.length !== project.structure.partCount) {
    errors.push("Part count mismatch");
  }
  const chapters = flattenPartsToChapters(parts);
  if (chapters.length !== project.structure.totalChapterCount) {
    errors.push("Chapter count mismatch");
  }

  const numbers = new Set<number>();
  for (const ch of chapters) {
    if (!Number.isFinite(ch.number) || ch.number <= 0) {
      errors.push("Invalid chapter number");
    }
    if (numbers.has(ch.number)) {
      errors.push(`Duplicate chapter number: ${ch.number}`);
    }
    numbers.add(ch.number);
    if (!ch.title?.trim()) errors.push(`Missing chapter title: ${ch.number}`);
    if (!ch.purpose?.trim()) errors.push(`Missing chapter purpose: ${ch.number}`);
    if (!ch.lengthPlan?.targetLength || ch.lengthPlan.targetLength <= 0) {
      errors.push(`Missing chapter lengthPlan: ${ch.number}`);
    }
  }
  return { valid: errors.length === 0, errors };
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

  const skeleton = buildChapterArchitectSkeleton(project);
  const mergedParts = mergeOutlineFillIntoSkeleton(skeleton, o);
  let parsedParts = mergedParts.map((p) =>
    parsePartFromRaw(partToJson(p) as Record<string, unknown>, language)
  );

  let validation = validateChapterOutline(parsedParts, project);
  if (!validation.valid) {
    parsedParts = parsedParts.map((part) => ({
      ...part,
      title: part.title || `Part ${part.number}`,
      purpose: part.purpose || `Part ${part.number} arc`,
      chapters: part.chapters.map((ch) => ({
        ...ch,
        title: ch.title || `Chapter ${ch.number}`,
        purpose: ch.purpose || `Chapter ${ch.number} progresses the narrative.`,
      })),
    }));
    validation = validateChapterOutline(parsedParts, project);
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
    ...(validation.valid ? {} : { validationErrors: validation.errors }),
  };
}
