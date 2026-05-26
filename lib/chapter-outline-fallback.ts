import { buildSkeletonParts } from "./structure-chapter-defaults";
import type { Chapter, StoryProject } from "./types";

const MAX_STRING_LEN = 140;

const ROLE_CYCLE_3 = ["Opening", "Development", "Resolution"] as const;

function shortPhrase(text: string | undefined, fallback: string): string {
  const s = (text ?? "").trim();
  if (!s) return fallback;
  return s.length > MAX_STRING_LEN ? s.slice(0, MAX_STRING_LEN) : s;
}

function defaultChapterRole(
  chapterIndex: number,
  totalChapters: number
): string {
  if (totalChapters === 3) {
    return ROLE_CYCLE_3[chapterIndex] ?? "Development";
  }
  if (chapterIndex === 0) return "Opening";
  if (chapterIndex >= totalChapters - 1) return "Resolution";
  if (chapterIndex === Math.floor(totalChapters / 2)) return "Climax";
  return "Development";
}

function buildTrackerFromPlot(project: StoryProject) {
  const seeds =
    project.storyBible.plot?.foreshadowingPlan ??
    project.storyBible.foreshadowingTracker?.map((f) => f.item) ??
    [];
  return seeds.slice(0, 4).map((item, i) => ({
    item: shortPhrase(item, `Thread ${i + 1}`),
    introducedIn: "Act 1",
    status: "planned" as const,
    suggestedPayoff: "Mid-story",
    payoffChapter: `Chapter ${Math.min(project.structure.totalChapterCount, 3)}`,
    emotionalPurpose: "Tension",
  }));
}

export function buildFallbackChapterOutline(
  project: StoryProject
): Record<string, unknown> {
  const { structure, language, storyBible } = project;
  const logline = storyBible.concept?.logline ?? project.userPrompt;
  const themeHint = storyBible.concept?.coreTheme ?? project.tone;
  const totalChapters = structure.totalChapterCount;

  const skeleton = buildSkeletonParts({
    language,
    presetId: structure.presetId,
    partCount: structure.partCount,
    chaptersPerPart: structure.chaptersPerPart,
    chapterLengthPreset: structure.chapterLengthPreset,
    existingParts: structure.parts?.length ? structure.parts : undefined,
  });

  let chapterIndex = 0;
  const parts = skeleton.map((part) => ({
    id: part.id,
    number: part.number,
    title: part.title,
    purpose: shortPhrase(part.purpose, `Part ${part.number} arc`),
    chapters: part.chapters.map((ch) => {
      const idx = chapterIndex++;
      const role = defaultChapterRole(idx, totalChapters);
      return {
        id: ch.id,
        number: ch.number,
        partNumber: ch.partNumber ?? part.number,
        title: `Chapter ${ch.number}: ${role}`,
        role,
        purpose: shortPhrase(
          ch.purpose,
          `${role}: advance "${shortPhrase(logline, "the story")}"`
        ),
        emotionalTurn: shortPhrase(ch.emotionalTurn, `${themeHint} tone`),
        keyEvents: [
          shortPhrase(undefined, `${role} beat`),
          shortPhrase(undefined, "Conflict escalates"),
        ].slice(0, 2),
        foreshadowing: [shortPhrase(undefined, "Plant mystery")],
        lengthPlan: ch.lengthPlan,
      };
    }),
  }));

  const chapters: Chapter[] = parts.flatMap((p) =>
    p.chapters.map((ch) => ({
      ...ch,
      keyEvents: ch.keyEvents as string[],
      foreshadowing: ch.foreshadowing as string[],
    }))
  );

  return {
    fallbackGenerated: true,
    parts,
    chapters: chapters.map((ch) => ({
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
    })),
    styleGuide: storyBible.styleGuide ?? {
      pov: "Third person limited",
      tense: "Past",
      proseStyle: shortPhrase(project.tone, "Literary"),
      dialogueNotes: "Naturalistic",
      taboos: [],
    },
    foreshadowingTracker: buildTrackerFromPlot(project),
  };
}
