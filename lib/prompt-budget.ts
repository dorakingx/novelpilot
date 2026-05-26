import type { AgentId } from "./types";

const CONTEXT_TRIM_MARKER = "[Context trimmed for context budget]";
const ESTIMATED_TOKEN_HARD_LIMIT = 5000;

export const AGENT_MAX_PROMPT_CHARS: Record<AgentId, number> = {
  concept: 8000,
  character: 8000,
  worldbuilding: 10000,
  plot: 12000,
  "chapter-outline": 12000,
  drafting: 16000,
  editor: 16000,
  continuity: 16000,
  publisher: 12000,
};

export function compactUserPrompt(prompt: string, maxChars = 2000): string {
  if (prompt.length <= maxChars) return prompt;
  const head = prompt.slice(0, 1200);
  const tail = prompt.slice(-600);
  return `${head}\n\n[Prompt shortened for context budget]\n\n${tail}`;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function logPromptSize(agentId: AgentId, prompt: string): void {
  console.info("[PROMPT_SIZE]", {
    agentId,
    chars: prompt.length,
    estimatedTokens: estimateTokens(prompt),
  });
}

function trimPromptToCap(prompt: string, cap: number): string {
  const ctxMarker = "Project context:\n";
  const idx = prompt.indexOf(ctxMarker);
  if (idx >= 0) {
    const head = prompt.slice(0, idx + ctxMarker.length);
    const ctx = prompt.slice(idx + ctxMarker.length);
    const maxCtx =
      cap - head.length - CONTEXT_TRIM_MARKER.length - 4;
    if (maxCtx > 200) {
      return `${head}${ctx.slice(0, maxCtx)}\n${CONTEXT_TRIM_MARKER}`;
    }
  }
  return `${prompt.slice(0, cap - CONTEXT_TRIM_MARKER.length - 2)}\n${CONTEXT_TRIM_MARKER}`;
}

export function enforcePromptBudget(prompt: string, agentId: AgentId): string {
  const cap = AGENT_MAX_PROMPT_CHARS[agentId] ?? 12000;
  let result = prompt.length > cap ? trimPromptToCap(prompt, cap) : prompt;

  if (estimateTokens(result) > ESTIMATED_TOKEN_HARD_LIMIT) {
    if (result.length > cap * 0.75) {
      result = trimPromptToCap(result, Math.floor(cap * 0.75));
    }
    if (estimateTokens(result) > ESTIMATED_TOKEN_HARD_LIMIT) {
      throw new Error(
        "Input prompt too large for OpenRouter; compact context applied but still over budget. Shorten user prompt or reduce chapters."
      );
    }
  }

  return result;
}
