import type { AgentId } from "./types";

const LANGUAGE_LABEL: Record<string, string> = {
  en: "English",
  ja: "Japanese",
};

function langDirective(language: string): string {
  const label = LANGUAGE_LABEL[language] ?? "English";
  return `Write all creative text in ${label}. JSON keys stay in English.`;
}

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
  "chapter-outline": `{
  "chapters": [{ "number", "title", "purpose", "emotionalTurn", "keyEvents": [], "foreshadowing": [] }],
  "styleGuide": { "pov", "tense", "proseStyle", "dialogueNotes", "taboos": [] },
  "foreshadowingTracker": [{ "item", "introducedIn", "status", "suggestedPayoff", "payoffChapter", "emotionalPurpose" }]
}`,
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
    "chapter-outline": `You are the Chapter Architect. Create 3 chapters for MVP scope.
You MUST include foreshadowingTracker with 4-6 items: each with item, introducedIn, status (planned/unresolved/paid-off), suggestedPayoff, payoffChapter, emotionalPurpose.
${lang}`,
    drafting: `You are the Prose Writer. Write full prose fiction for EVERY chapter in the chapter outline. Do not summarize. Each chapter must be an actual scene-based chapter with dialogue, atmosphere, emotional progression, and narrative momentum. Maintain continuity across chapters. Return all chapter drafts and a combined completeManuscript.
Use the existing chapter outline exactly. Write one draft per chapter. The number of chapter drafts must match the number of outlined chapters.
Length guidance: flash fiction — each chapter around 500–800 words; short story — each chapter around 900–1500 words; novella outline scope — each chapter around 1200–2000 words. Keep the MVP at 3 chapters unless the outline already contains a different number. Do not generate a full-length book.
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
