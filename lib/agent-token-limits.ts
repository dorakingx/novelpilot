import type { AgentId, Language } from "./types";

export type CallGemmaOptions = {
  signal?: AbortSignal;
  mockAgentId?: AgentId;
  mockLanguage?: Language;
  agentId?: AgentId;
  draftChapterNumber?: number;
  maxTokens?: number;
};

export function getMaxTokensForAgent(
  agentId?: AgentId,
  draftChapterNumber?: number
): number {
  void draftChapterNumber;
  // Intentionally conservative defaults to avoid OpenRouter 402 errors
  // on low-credit accounts.
  switch (agentId) {
    case "concept":
      return 900;
    case "character":
      return 1200;
    case "worldbuilding":
      return 1200;
    case "plot":
      return 1400;
    case "chapter-outline":
      return 1800;
    case "drafting":
      return 2200;
    case "editor":
      return 1200;
    case "continuity":
      return 1400;
    case "publisher":
      return 1000;
    default:
      return 1200;
  }
}

export function resolveMaxTokens(options?: CallGemmaOptions): number {
  const base =
    options?.maxTokens ??
    getMaxTokensForAgent(options?.agentId, options?.draftChapterNumber);
  const capRaw = process.env.GEMMA_MAX_TOKENS_CAP;
  const cap = Number(capRaw);
  if (!Number.isFinite(cap) || cap <= 0) {
    return base;
  }
  return Math.min(base, cap);
}
