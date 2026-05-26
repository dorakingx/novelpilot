import { buildDraftingContext } from "./agent-context";
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
          "title": "short phrase",
          "purpose": "short phrase",
          "emotionalTurn": "short phrase",
          "keyEvents": ["phrase", "phrase"],
          "foreshadowing": ["phrase"]
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

export const COMPACT_JSON_RULES = `Return valid JSON only. No markdown, no explanations, no comments.
Use short sentences for string values. Close all quotes and braces. JSON keys stay in English; creative values use the project language.`;

export function getAgentSchema(agentId: AgentId): string {
  return SCHEMAS[agentId];
}

const SCHEMAS: Record<AgentId, string> = {
  concept: `{
  "logline": "short string",
  "coreTheme": "short string",
  "centralConflict": "short string",
  "emotionalPromise": "short string",
  "uniqueHook": "short string"
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

export function buildChapterDraftPrompt(
  project: StoryProject,
  chapterNumber: number
): string {
  const language = project.language;
  const lang = langDirective(language);
  const ctx = buildDraftingContext(project, chapterNumber);
  const target = ctx.currentChapter as {
    number: number;
    title: string;
    lengthPlan?: { targetLength?: number; unit?: string };
    role?: string;
  };

  const unit =
    target.lengthPlan?.unit ?? (language === "ja" ? "characters" : "words");
  const lengthHint = target.lengthPlan?.targetLength
    ? `Approximate length target: about ${target.lengthPlan.targetLength} ${unit} (${language === "ja" ? "count non-whitespace characters" : "count words"}). ±20% is acceptable. Length is pacing guidance only — do not truncate mid-scene for an exact count; prioritize narrative completeness. Do not use project-level total length as the primary guide.`
    : "";
  const roleHint = target.role?.trim()
    ? `Chapter role: ${target.role}.`
    : "";

  const ctxJson = JSON.stringify(ctx);

  return `You are the Prose Writer. Write ONLY chapter ${chapterNumber} ("${target.title}") as literary fiction prose.
Do not summarize. Write a full scene-based chapter with dialogue, atmosphere, and momentum.
Use the compact story context, chapter outline, prior chapter summaries, and the previous chapter ending excerpt for continuity.
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
Each value must be one short sentence. Entire JSON under 700 characters.
${COMPACT_JSON_RULES}
${lang}`,
    character: `You are the Character Director. Using the concept output, create rich characters.
supporting array: maximum 2 characters. Entire JSON response under 1500 characters.
${COMPACT_JSON_RULES}
${lang}`,
    worldbuilding: `You are the World Builder. Using concept and characters, build the story world.
locations and symbols: maximum 3 strings each. Keep every field to one short sentence.
${COMPACT_JSON_RULES}
${lang}`,
    plot: `You are the Plot Strategist. Structure a complete plot from concept, characters, and world.
twists and foreshadowingPlan: maximum 3 strings each. Optionally include foreshadowingTracker seeds (status: planned).
${COMPACT_JSON_RULES}
${lang}`,
    // Chapter Architect uses deterministic skeleton + compact prompts in chapter-architect-context.ts.
    "chapter-outline": `Chapter Architect prompt is generated by chapter-architect-context.ts.
Use that prompt path for live generation; this schema is for generic retry helpers only.
${COMPACT_JSON_RULES}
${lang}`,
    drafting: `You are the Prose Writer. Write full prose fiction for EVERY chapter in the chapter outline. Do not summarize. Each chapter must be an actual scene-based chapter with dialogue, atmosphere, emotional progression, and narrative momentum. Maintain continuity across chapters. Return all chapter drafts and a combined completeManuscript.
Use the existing chapter outline exactly. Write one draft per chapter. The number of chapter drafts must match the number of outlined chapters.
For each chapter, treat lengthPlan as approximate pacing guidance (±20% acceptable). Japanese targets use non-whitespace character count; English targets use word count. Do not truncate mid-scene for an exact count. Respect role, purpose, and emotionalTurn. Do not use project-level total length as the primary guide.
${lang}`,
    editor: `You are the Style Editor. Critique the complete manuscript against the story bible. Consider pacing across chapters, dialogue, emotional arc, prose style, and ending payoff. Be specific and constructive.
Each array field: maximum 4 short strings.
${COMPACT_JSON_RULES}
${lang}`,
    continuity: `You are the Continuity Detective. Audit the complete manuscript against characters, plot, chapter outline, and foreshadowingTracker.
Check continuity across all chapters, unresolved foreshadowing, missing payoffs, inconsistent character behavior, timeline issues, and whether the ending resolves the central conflict.
Return structured issues with category, severity, evidence, and suggestedFix. issues array: maximum 6 items. Include overallDiagnosis and missingPayoffs.
${COMPACT_JSON_RULES}
${lang}`,
    publisher: `You are the Publisher Agent. Create marketing and submission package from the completed manuscript and story bible.
titleIdeas: maximum 3. Keep summaries to 2 sentences each.
${COMPACT_JSON_RULES}
${lang}`,
  };

  return `${agentInstructions[agentId]}

Respond with ONLY valid JSON matching this schema (no markdown fences):
${schema}

Project context:
${ctxJson}`;
}
