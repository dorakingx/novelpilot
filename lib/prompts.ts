import { getAllChapters } from "./structure-utils";
import type { AgentId, StoryProject } from "./types";

const LANGUAGE_LABEL: Record<string, string> = {
  en: "English",
  ja: "Japanese",
};

function langDirective(language: string): string {
  const label = LANGUAGE_LABEL[language] ?? "English";
  return `Write all creative text in ${label}. JSON keys stay in English.`;
}

const CHAPTER_OUTLINE_SCHEMA = `{
  "parts": [
    {
      "number": 1,
      "title": "string",
      "purpose": "string",
      "targetLength": 3000,
      "chapters": [
        {
          "number": 1,
          "partNumber": 1,
          "title": "string",
          "purpose": "string",
          "emotionalTurn": "string",
          "keyEvents": ["string"],
          "foreshadowing": ["string"],
          "lengthPlan": {
            "targetLength": 1500,
            "unit": "words"
          }
        }
      ]
    }
  ],
  "chapters": [
    {
      "number": 1,
      "partNumber": 1,
      "title": "string",
      "purpose": "string",
      "emotionalTurn": "string",
      "keyEvents": ["string"],
      "foreshadowing": ["string"],
      "lengthPlan": {
        "targetLength": 1500,
        "unit": "words"
      }
    }
  ],
  "styleGuide": {
    "pov": "string",
    "tense": "string",
    "proseStyle": "string",
    "dialogueNotes": "string",
    "taboos": []
  },
  "foreshadowingTracker": [
    {
      "item": "string",
      "introducedIn": "string",
      "status": "planned|unresolved|paid-off",
      "suggestedPayoff": "string",
      "payoffChapter": "string",
      "emotionalPurpose": "string"
    }
  ]
}`;

const SCHEMAS: Record<AgentId, string> = {
  concept: `{
  "logline": "string",
  "coreTheme": "string",
  "centralConflict": "string",
  "emotionalPromise": "string",
  "uniqueHook": "string"
}`,
  character: `{
  "protagonist": { "name", "role", "desire", "fear", "flaw", "secret", "arc", "speechStyle" },
  "antagonist": { same fields },
  "supporting": [ { same fields }, ... ]
}`,
  worldbuilding: `{
  "setting", "rules", "socialContext", "atmosphere",
  "locations": ["string"],
  "symbols": ["string"]
}`,
  plot: `{
  "beginning", "middle", "climax", "ending",
  "twists": ["string"],
  "foreshadowingPlan": ["string"],
  "foreshadowingTracker": [{ "item", "introducedIn", "status": "planned|unresolved|paid-off", "suggestedPayoff", "payoffChapter", "emotionalPurpose" }]
}`,
  "chapter-outline": CHAPTER_OUTLINE_SCHEMA,
  drafting: `{
  "chapters": [
    {
      "number": 1,
      "title": "string",
      "draft": "full prose fiction for chapter 1 — not a summary"
    }
  ],
  "completeManuscript": "full combined manuscript with all chapters in order"
}`,
  editor: `{
  "strengths": [], "weakPoints": [], "pacingIssues": [],
  "dialogueIssues": [], "emotionalClarityIssues": [], "revisionSuggestions": []
}`,
  continuity: `{
  "issues": [{ "category": "character|timeline|foreshadowing|worldbuilding|motif", "severity": "low|medium|high", "issue", "evidence", "suggestedFix" }],
  "unresolvedForeshadowing": [{ "item", "introducedIn", "status", "suggestedPayoff", "payoffChapter", "emotionalPurpose" }],
  "repeatedMotifs": [],
  "missingPayoffs": [],
  "overallDiagnosis": "string"
}`,
  publisher: `{
  "titleIdeas": [], "shortSummary", "longSummary", "logline", "tagline",
  "socialPost", "submissionDescription"
}`,
};

const SINGLE_CHAPTER_DRAFT_SCHEMA = `{
  "number": 1,
  "title": "string",
  "draft": "full prose fiction for this chapter only — not a summary",
  "chapterSummary": "brief summary for continuity with later chapters",
  "continuityNotes": ["string"]
}`;

function chapterOutlineInstructions(context: Record<string, unknown>): string {
  const structure = context.structure as Record<string, unknown> | undefined;
  const language = String(context.language ?? "en");
  const lang = langDirective(language);
  const partCount = Number(structure?.partCount ?? 1);
  const chaptersPerPart = Number(structure?.chaptersPerPart ?? 3);
  const totalChapters =
    Number(structure?.totalChapterCount) || partCount * chaptersPerPart;
  const totalTarget = structure?.totalTargetLength ?? "unspecified";
  const unit = structure?.lengthUnit ?? (language === "ja" ? "characters" : "words");

  return `You are the Chapter Architect. Create a story structure based on the user's requested part count (${partCount}), chapters per part (${chaptersPerPart}), total chapters (${totalChapters}), and total target length (${totalTarget} ${unit}).
If parts are requested (partCount > 1), group chapters into parts. Each part must have a narrative purpose and optional targetLength.
Each chapter must have purpose, emotionalTurn, keyEvents, foreshadowing, and lengthPlan with targetLength in ${unit}. Chapter target lengths should sum to approximately the total target length.
You MUST include foreshadowingTracker with 4-6 items.
${lang}`;
}

export function buildChapterDraftPrompt(
  project: StoryProject,
  chapterNumber: number
): string {
  const language = project.language;
  const lang = langDirective(language);
  const chapters = getAllChapters(project);
  const target = chapters.find((c) => c.number === chapterNumber);
  if (!target) {
    throw new Error(`Chapter ${chapterNumber} not found in outline`);
  }

  const prior = chapters.filter((c) => c.number < chapterNumber);
  const priorContext = prior.map((ch) => ({
    number: ch.number,
    title: ch.title,
    summary: ch.chapterSummary ?? "",
    excerpt: ch.draft?.slice(0, 800) ?? "",
  }));

  const lengthHint = target.lengthPlan
    ? `Target length: ${target.lengthPlan.targetLength} ${target.lengthPlan.unit}.`
    : "";

  const ctxJson = JSON.stringify(
    {
      chapterToWrite: target,
      priorChapters: priorContext,
      structure: project.structure,
      storyBible: project.storyBible,
      manuscriptSoFar: project.manuscript,
    },
    null,
    2
  );

  return `You are the Prose Writer. Write ONLY chapter ${chapterNumber} ("${target.title}") as literary fiction prose.
Do not summarize. Write a full scene-based chapter with dialogue, atmosphere, and momentum.
Use the Story Bible, part plan, chapter outline, prior chapter summaries, and prior draft excerpts for continuity.
${lengthHint}
${lang}

Respond with ONLY valid JSON matching this schema (no markdown fences):
${SINGLE_CHAPTER_DRAFT_SCHEMA}

Project context:
${ctxJson}`;
}

export function buildAgentPrompt(
  agentId: AgentId,
  context: Record<string, unknown>
): string {
  const language = String(context.language ?? "en");
  const lang = langDirective(language);
  const ctxJson = JSON.stringify(context, null, 2);
  const schema = SCHEMAS[agentId];

  const agentInstructions: Record<AgentId, string> = {
    concept: `You are the Premise Architect in NovelPilot, a multi-agent writing room.
From the user prompt and project settings, create a compelling story concept.
${lang}`,
    character: `You are the Character Director. Using the concept output, create rich characters.
${lang}`,
    worldbuilding: `You are the World Builder. Using concept and characters, build the story world.
${lang}`,
    plot: `You are the Plot Strategist. Structure a complete plot from concept, characters, and world.
Optionally include foreshadowingTracker seeds (status: planned).
${lang}`,
    "chapter-outline": chapterOutlineInstructions(context),
    drafting: `You are the Prose Writer. Write full prose fiction for EVERY chapter in the chapter outline. Do not summarize. Each chapter must be an actual scene-based chapter with dialogue, atmosphere, emotional progression, and narrative momentum. Maintain continuity across chapters. Return all chapter drafts and a combined completeManuscript.
Use the existing chapter outline exactly. Write one draft per chapter. The number of chapter drafts must match the number of outlined chapters.
Respect each chapter's lengthPlan targetLength when provided.
${lang}`,
    editor: `You are the Style Editor. Critique the complete manuscript against the story bible. Consider pacing across chapters, dialogue, emotional arc, prose style, and ending payoff. Be specific and constructive.
${lang}`,
    continuity: `You are the Continuity Detective. Audit the complete manuscript against characters, plot, chapter outline, and foreshadowingTracker.
Check continuity across all chapters, unresolved foreshadowing, missing payoffs, inconsistent character behavior, timeline issues, and whether the ending resolves the central conflict.
Return structured issues with category, severity, evidence, and suggestedFix. Include overallDiagnosis and missingPayoffs.
${lang}`,
    publisher: `You are the Publisher Agent. Create marketing and submission package from the completed manuscript and story bible.
${lang}`,
  };

  return `${agentInstructions[agentId]}

Respond with ONLY valid JSON matching this schema (no markdown fences):
${schema}

Project context:
${ctxJson}`;
}
