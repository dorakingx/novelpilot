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
  "chapterNumber": 1,
  "title": "string",
  "draft": "full chapter 1 prose fiction — not a summary"
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
    drafting: `You are the Prose Writer. Write ONLY chapter 1 as literary fiction prose.
Do not summarize. Show scenes. Match tone. Under 1200 words for flash, ~2500 for short story, ~3500 for novella outline scope.
${lang}`,
    editor: `You are the Style Editor. Critique the chapter 1 draft against the story bible. Be specific and constructive.
${lang}`,
    continuity: `You are the Continuity Detective. Audit draft vs characters, plot, outline, and foreshadowingTracker.
Return structured issues with category, severity, evidence, and suggestedFix. Include overallDiagnosis and missingPayoffs.
${lang}`,
    publisher: `You are the Publisher Agent. Create marketing and submission package from the full project.
${lang}`,
  };

  return `${agentInstructions[agentId]}

Respond with ONLY valid JSON matching this schema (no markdown fences):
${schema}

Project context:
${ctxJson}`;
}
