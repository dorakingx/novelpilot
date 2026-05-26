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
  switch (agentId) {
    case "concept":
      return 1500;
    case "character":
      return 2500;
    case "worldbuilding":
      return 2500;
    case "plot":
      return 3000;
    case "chapter-outline":
      return 4000;
    case "drafting":
      return 5500;
    case "editor":
      return 2500;
    case "continuity":
      return 3000;
    case "publisher":
      return 2000;
    default:
      return 3000;
  }
}

export function resolveMaxTokens(options?: CallGemmaOptions): number {
  const base =
    options?.maxTokens ??
    getMaxTokensForAgent(options?.agentId, options?.draftChapterNumber);
  const cap = Number(process.env.GEMMA_MAX_TOKENS_CAP);
  return cap > 0 ? Math.min(base, cap) : base;
}
