import { compactUserPrompt } from "./prompt-budget";
import { buildSkeletonParts } from "./structure-chapter-defaults";
import type { PartPlan, StoryProject } from "./types";

export const CHAPTER_OUTLINE_FALLBACK_MESSAGE =
  "NovelPilot used a safe editable structure because the model returned an incomplete outline.";

const CHAPTER_OUTLINE_FILL_SCHEMA = `{
  "parts": [
    {
      "number": 1,
      "title": "string",
      "purpose": "string",
      "chapters": [
        {
          "number": 1,
          "title": "string",
          "purpose": "string",
          "emotionalTurn": "string",
          "keyEvents": ["string"],
          "foreshadowing": ["string"]
        }
      ]
    }
  ],
  "styleGuide": {
    "pov": "string",
    "tense": "string",
    "proseStyle": "string",
    "dialogueNotes": "string"
  },
  "foreshadowingTracker": [
    {
      "item": "string",
      "introducedIn": "string",
      "status": "planned",
      "suggestedPayoff": "string",
      "payoffChapter": "string",
      "emotionalPurpose": "string"
    }
  ]
}`;

const MAX_TEXT_LEN = 120;

const ROLE_CYCLE_3 = ["Opening", "Development", "Resolution"] as const;

export function defaultChapterRole(
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

function languageDirective(language: string): string {
  const label = language === "ja" ? "Japanese" : "English";
  return `Write all creative text in ${label}. JSON keys stay in English.`;
}

export function buildChapterOutlineFillSchema(): string {
  return CHAPTER_OUTLINE_FILL_SCHEMA;
}

export function buildChapterArchitectSkeleton(
  project: StoryProject
): PartPlan[] {
  const { structure, language } = project;
  const skeleton = buildSkeletonParts({
    language,
    presetId: structure.presetId,
    partCount: structure.partCount,
    chaptersPerPart: structure.chaptersPerPart,
    chapterLengthPreset: structure.chapterLengthPreset,
    existingParts: structure.parts?.length ? structure.parts : undefined,
  });
  const totalChapters = structure.totalChapterCount;
  let chapterIndex = 0;
  return skeleton.map((part) => ({
    ...part,
    chapters: part.chapters.map((ch) => {
      const role = defaultChapterRole(chapterIndex, totalChapters);
      chapterIndex += 1;
      return {
        ...ch,
        role,
      };
    }),
  }));
}

function compactCharacters(project: StoryProject): string {
  const rows = project.storyBible.characters
    .slice(0, 6)
    .map((ch) => `${ch.name || "Unknown"} (${ch.role || "Character"})`);
  return rows.join(", ");
}

function compactPlot(project: StoryProject): string {
  const plot = project.storyBible.plot;
  if (!plot) return "";
  return [
    `beginning: ${plot.beginning || ""}`,
    `middle: ${plot.middle || ""}`,
    `climax: ${plot.climax || ""}`,
    `ending: ${plot.ending || ""}`,
  ].join("\n");
}

function skeletonForFill(skeleton: PartPlan[]): Record<string, unknown>[] {
  return skeleton.map((part) => ({
    number: part.number,
    title: "",
    purpose: "",
    chapters: part.chapters.map((ch) => ({
      number: ch.number,
      title: "",
      purpose: "",
      emotionalTurn: "",
      keyEvents: [],
      foreshadowing: [],
      role: ch.role,
      lengthPlan: ch.lengthPlan,
    })),
  }));
}

function buildFillPrompt(
  project: StoryProject,
  skeleton: PartPlan[],
  retry: boolean
): string {
  const totalChapters = project.structure.totalChapterCount;
  const lang = languageDirective(project.language);
  const concept = project.storyBible.concept;
  const skeletonJson = JSON.stringify(skeletonForFill(skeleton));
  const baseRules = `Rules:
- Return valid JSON only.
- No markdown, no explanations, no prose scenes.
- Each string under ${MAX_TEXT_LEN} characters.
- keyEvents max 2 per chapter.
- foreshadowing max 1 per chapter.
- foreshadowingTracker max 3 items.
- Preserve all part/chapter numbers, role, and lengthPlan exactly.
- Do not add or remove chapters or parts.
- Return only: parts, styleGuide, foreshadowingTracker.
- Do not return top-level chapters.`;
  const header = retry
    ? "Previous output was invalid JSON. Retry with the same skeleton and stricter compact output."
    : "You are the Chapter Architect. Fill only short text fields in the provided skeleton.";
  const contextLines = [
    `language: ${project.language}`,
    `genre: ${project.genre}`,
    `tone: ${project.tone}`,
    `userPrompt: ${compactUserPrompt(project.userPrompt, 500)}`,
    `conceptLogline: ${concept?.logline ?? ""}`,
    `conceptConflict: ${concept?.centralConflict ?? ""}`,
    `characters: ${compactCharacters(project)}`,
    `plot:\n${compactPlot(project)}`,
  ];

  return `${header}
The skeleton already has exactly ${project.structure.partCount} part(s) and ${totalChapters} chapter(s).

${baseRules}
${lang}

Schema:
${buildChapterOutlineFillSchema()}

Context:
${contextLines.join("\n")}

Skeleton to fill:
${skeletonJson}`;
}

export function buildChapterArchitectPrompt(project: StoryProject): string {
  const skeleton = buildChapterArchitectSkeleton(project);
  return buildFillPrompt(project, skeleton, false);
}

export function buildChapterArchitectRetryPrompt(project: StoryProject): string {
  const skeleton = buildChapterArchitectSkeleton(project);
  return buildFillPrompt(project, skeleton, true);
}
