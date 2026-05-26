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
      "title": "short phrase",
      "purpose": "short phrase",
      "chapters": [
        {
          "number": 1,
          "partNumber": 1,
          "title": "short phrase",
          "role": "Opening",
          "purpose": "short phrase",
          "emotionalTurn": "short phrase",
          "keyEvents": ["phrase", "phrase"],
          "foreshadowing": ["phrase"],
          "lengthPlan": { "targetLength": 1200, "unit": "words" }
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
      "item": "short phrase",
      "introducedIn": "Ch.1",
      "status": "planned",
      "suggestedPayoff": "short",
      "payoffChapter": "Ch.3",
      "emotionalPurpose": "short"
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
  const unit = structure?.lengthUnit ?? (language === "ja" ? "characters" : "words");
  const userParts = structure?.parts as unknown[] | undefined;
  const hasUserPlans =
    Array.isArray(userParts) &&
    userParts.some(
      (p) =>
        p &&
        typeof p === "object" &&
        Array.isArray((p as { chapters?: unknown[] }).chapters) &&
        (p as { chapters: { lengthPlan?: { targetLength?: number } }[] }).chapters.some(
          (ch) => (ch.lengthPlan?.targetLength ?? 0) > 0
        )
    );

  const chapterLengthPreset = String(structure?.chapterLengthPreset ?? "standard");
  const userPrompt = String(context.userPrompt ?? "");

  return `You are the Chapter Architect. Create a story structure with exactly ${partCount} part(s), ${chaptersPerPart} chapter(s) per part, and exactly ${totalChapters} chapters total. Do NOT add or remove parts or chapters.
Return ONLY the "parts" array (nested chapters). Do NOT include a separate top-level "chapters" array.
If partCount > 1, group chapters into parts. Each part needs a short title and purpose.
Generate compelling chapter titles from the user prompt, genre, tone, and structure. The user does not supply titles in the UI. If the user prompt mentions desired chapter titles, use those exact titles.
Each chapter must include: title, role, purpose, emotionalTurn, keyEvents (max 3 short phrases), foreshadowing (max 2 short phrases), lengthPlan with targetLength in ${unit}.
Approximate chapter length preset: ${chapterLengthPreset}. Treat each chapter's lengthPlan.targetLength as an approximate pacing target, not an exact constraint.
${hasUserPlans ? `Preserve each chapter's lengthPlan.targetLength from structure.parts when provided; they are approximate targets.` : `Assign sensible per-chapter lengthPlan values in ${unit} consistent with preset ${chapterLengthPreset}.`}
User prompt for title and tone cues: ${userPrompt.slice(0, 500)}
Keep the outline compact. Do not write scene prose here. Use short phrases, not paragraphs. Each chapter purpose, emotionalTurn, and key event should be concise. Save long prose for the Prose Writer.
Keep every field concise. Do not write prose. Do not include scene text. Do not include long explanations. Do not include markdown. Limit foreshadowingTracker to max 4 items. Each string under 140 characters. No paragraphs. Valid JSON only. Chapter titles should be short. Chapter purposes should be one sentence.
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

  const unit = target.lengthPlan?.unit ?? (language === "ja" ? "characters" : "words");
  const lengthHint = target.lengthPlan?.targetLength
    ? `Approximate length target: about ${target.lengthPlan.targetLength} ${unit} (${language === "ja" ? "count non-whitespace characters" : "count words"}). ±20% is acceptable. Length is pacing guidance only — do not truncate mid-scene for an exact count; prioritize narrative completeness. Do not use project-level total length as the primary guide.`
    : "";
  const roleHint = target.role?.trim()
    ? `Chapter role: ${target.role}.`
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
Respect this chapter's purpose, emotionalTurn, role, and lengthPlan.
${roleHint}
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
For each chapter, treat lengthPlan as approximate pacing guidance (±20% acceptable). Japanese targets use non-whitespace character count; English targets use word count. Do not truncate mid-scene for an exact count. Respect role, purpose, and emotionalTurn. Do not use project-level total length as the primary guide.
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
