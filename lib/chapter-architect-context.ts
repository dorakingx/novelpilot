import { buildChapterOutlineContext } from "./agent-context";
import { buildSkeletonParts } from "./structure-chapter-defaults";
import type { PartPlan, StoryProject } from "./types";

const CHAPTER_OUTLINE_FILL_SCHEMA = `{
  "parts": [
    {
      "number": 1,
      "title": "string",
      "purpose": "string",
      "chapters": [
        {
          "number": 1,
          "partNumber": 1,
          "title": "string",
          "purpose": "string",
          "role": "Opening | Development | Climax | Resolution",
          "emotionalTurn": "string",
          "keyEvents": ["string"],
          "foreshadowing": ["string"],
          "lengthPlan": { "targetLength": 4000, "unit": "characters" }
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

function languageDirective(language: string): string {
  const label = language === "ja" ? "Japanese" : "English";
  return `Write all creative text in ${label}. JSON keys stay in English.`;
}

export function buildChapterArchitectSkeleton(
  project: StoryProject
): PartPlan[] {
  const { structure, language } = project;
  return buildSkeletonParts({
    language,
    presetId: structure.presetId,
    partCount: structure.partCount,
    chaptersPerPart: structure.chaptersPerPart,
    chapterLengthPreset: structure.chapterLengthPreset,
    existingParts: structure.parts?.length ? structure.parts : undefined,
  });
}

function buildFillInstructions(project: StoryProject, skeleton: PartPlan[]): string {
  const totalChapters = project.structure.totalChapterCount;
  const lang = languageDirective(project.language);

  return `You are the Chapter Architect. Fill in the provided structure skeleton ONLY.
Do NOT add or remove parts or chapters. The skeleton has exactly ${project.structure.partCount} part(s) and ${totalChapters} chapter(s) total.

For each part: fill title and purpose (short phrases).
For each chapter: fill title, purpose, role, emotionalTurn, keyEvents, foreshadowing.
Preserve each chapter's lengthPlan.targetLength and unit from the skeleton exactly.
Generate chapter titles from the user prompt, genre, and tone. If the prompt mentions desired chapter titles, use those exact titles.

Also return styleGuide and foreshadowingTracker (max 4 items).

Keep the response compact. Do not write prose. Do not include scene text. Do not include markdown. Every string must be concise.
Rules: max 3 keyEvents per chapter; max 2 foreshadowing per chapter; max 4 foreshadowingTracker items; each string under 140 characters; no paragraphs; no explanations; valid JSON only.
Chapter titles should be short. Chapter purposes should be one sentence.
Return ONLY the "parts" array nested structure plus styleGuide and foreshadowingTracker. Do NOT include a separate top-level "chapters" array.
${lang}

Structure skeleton to fill (preserve array sizes and lengthPlan values):
${JSON.stringify(skeleton.map((p) => ({
  number: p.number,
  title: "",
  purpose: "",
  chapters: p.chapters.map((ch) => ({
    number: ch.number,
    partNumber: ch.partNumber ?? p.number,
    title: "",
    purpose: "",
    role: "",
    emotionalTurn: "",
    keyEvents: [],
    foreshadowing: [],
    lengthPlan: ch.lengthPlan,
  })),
})))}`;
}

export function buildChapterArchitectPrompt(project: StoryProject): string {
  const skeleton = buildChapterArchitectSkeleton(project);
  const context = buildChapterOutlineContext(project, skeleton);

  return `${buildFillInstructions(project, skeleton)}

Respond with ONLY valid JSON matching this schema (no markdown fences):
${CHAPTER_OUTLINE_FILL_SCHEMA}

Project context:
${JSON.stringify(context)}`;
}

const RETRY_LINE = `Your previous response was not valid JSON. Return ONLY valid JSON. No markdown. No explanations. Fill the same skeleton exactly.`;

export function buildChapterArchitectRetryPrompt(project: StoryProject): string {
  const skeleton = buildChapterArchitectSkeleton(project);
  const context = buildChapterOutlineContext(project, skeleton);

  return `${RETRY_LINE}

${buildFillInstructions(project, skeleton)}

Project context:
${JSON.stringify(context)}`;
}
