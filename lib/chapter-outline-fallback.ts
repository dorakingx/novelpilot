import {
  buildChapterArchitectSkeleton,
  defaultChapterRole,
} from "./chapter-architect-context";
import type { Chapter, StoryProject } from "./types";

const MAX_STRING_LEN = 140;

function shortPhrase(text: string | undefined, fallback: string): string {
  const s = (text ?? "").trim();
  if (!s) return fallback;
  return s.length > MAX_STRING_LEN ? s.slice(0, MAX_STRING_LEN) : s;
}

function beatForIndex(project: StoryProject, chapterIndex: number, totalChapters: number): string {
  const plot = project.storyBible.plot;
  if (!plot) return "";
  const ratio = totalChapters <= 1 ? 1 : chapterIndex / (totalChapters - 1);
  if (ratio < 0.25) return plot.beginning;
  if (ratio < 0.75) return plot.middle;
  if (ratio < 0.95) return plot.climax;
  return plot.ending;
}

function mainCharacterLabel(project: StoryProject): string {
  const protagonist = project.storyBible.characters.find((c) =>
    c.role.toLowerCase().includes("protagonist")
  );
  if (protagonist?.name) return protagonist.name;
  const first = project.storyBible.characters[0];
  return first?.name || (project.language === "ja" ? "主人公" : "Protagonist");
}

function conflictLabel(project: StoryProject): string {
  return (
    project.storyBible.concept?.centralConflict ||
    project.storyBible.concept?.logline ||
    project.userPrompt
  );
}

function buildTrackerFromPlot(project: StoryProject) {
  const seeds =
    project.storyBible.plot?.foreshadowingPlan ??
    project.storyBible.foreshadowingTracker?.map((f) => f.item) ??
    [];
  return seeds.slice(0, 3).map((item, i) => ({
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
  const protagonist = mainCharacterLabel(project);
  const conflict = conflictLabel(project);

  const skeleton = buildChapterArchitectSkeleton(project);

  let chapterIndex = 0;
  const parts = skeleton.map((part) => ({
    id: part.id,
    number: part.number,
    title: part.title,
    purpose: shortPhrase(part.purpose, `Part ${part.number} arc`),
    chapters: part.chapters.map((ch) => {
      const idx = chapterIndex++;
      const role = defaultChapterRole(idx, totalChapters);
      const beat = shortPhrase(
        beatForIndex(project, idx, totalChapters),
        shortPhrase(conflict, shortPhrase(logline, "the story"))
      );
      const titleSeed =
        role === "Opening"
          ? `${protagonist} notices a fracture`
          : role === "Climax"
            ? `${protagonist} faces the core choice`
            : role === "Resolution"
              ? `${protagonist} accepts the cost`
              : `${protagonist} follows the next clue`;
      return {
        id: ch.id,
        number: ch.number,
        partNumber: ch.partNumber ?? part.number,
        title: shortPhrase(
          ch.title,
          `${titleSeed} (${language === "ja" ? `第${ch.number}章` : `Ch.${ch.number}`})`
        ),
        role,
        purpose: shortPhrase(
          ch.purpose,
          `${role}: advance "${beat}"`
        ),
        emotionalTurn: shortPhrase(ch.emotionalTurn, `${themeHint} tone`),
        keyEvents: [
          shortPhrase(undefined, `${protagonist} acts on a new clue`),
          shortPhrase(undefined, `Pressure rises around ${shortPhrase(conflict, "the conflict")}`),
        ].slice(0, 2),
        foreshadowing: [shortPhrase(undefined, `Hint tied to ${shortPhrase(conflict, "the central conflict")}`)],
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
