import { compactUserPrompt } from "./prompt-budget";
import { getAgentSchema } from "./prompts";
import type { AgentId, StoryProject } from "./types";

const SHARED_RETRY_RULES = `Rules:
- Return ONLY valid JSON (no markdown, no explanations)
- One short sentence per string value unless schema says otherwise
- Close all quotes and braces
- JSON keys must stay in English
- Creative values use the project language
- Keep the response compact`;

const AGENT_RETRY_HINTS: Partial<Record<AgentId, string>> = {
  concept: "Entire JSON under 700 characters.",
  character:
    "supporting array: max 2 entries. Entire JSON under 1500 characters.",
  worldbuilding:
    "locations and symbols: max 3 each. Keep all strings short.",
  plot: "twists and foreshadowingPlan: max 3 strings each.",
  "chapter-outline":
    "Use short phrases only. foreshadowingTracker max 4 items.",
  drafting: "Write full prose only in draft fields.",
  editor: "Each array: max 4 short strings.",
  continuity: "issues array: max 6 items with short fields.",
  publisher: "titleIdeas: max 3. Keep summaries to 2 sentences each.",
};

export function buildCompactRetryPrompt(
  agentId: AgentId,
  project: StoryProject
): string {
  const shortenedPrompt = compactUserPrompt(project.userPrompt, 500);
  const schema = getAgentSchema(agentId);
  const extra = AGENT_RETRY_HINTS[agentId];
  const extraBlock = extra ? `\n${extra}` : "";

  return `Return ONLY valid JSON matching this schema:

${schema}

${SHARED_RETRY_RULES}${extraBlock}

Project settings:
- language: ${project.language}
- genre: ${project.genre}
- tone: ${project.tone}

User prompt (shortened):
${shortenedPrompt}
`;
}
