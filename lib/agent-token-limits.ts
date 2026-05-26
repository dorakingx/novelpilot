import type { LlmProvider } from "./llm-config";
import { isLowCreditMode } from "./llm-config";
import type { AgentId, AiModelSettings, Language } from "./types";

export type CallGemmaOptions = {
  signal?: AbortSignal;
  mockAgentId?: AgentId;
  mockLanguage?: Language;
  agentId?: AgentId;
  draftChapterNumber?: number;
  maxTokens?: number;
  provider?: LlmProvider;
  model?: string;
  projectAiModel?: AiModelSettings;
};

const OPENROUTER_LOW_CREDIT_LIMITS: Partial<Record<AgentId, number>> = {
  concept: 900,
  character: 1200,
  worldbuilding: 1200,
  plot: 1400,
  "chapter-outline": 1800,
  drafting: 2200,
  editor: 1200,
  continuity: 1400,
  publisher: 1000,
};

const OPENROUTER_DEFAULT_LIMITS: Partial<Record<AgentId, number>> = {
  concept: 900,
  character: 1200,
  worldbuilding: 1200,
  plot: 1400,
  "chapter-outline": 1800,
  drafting: 2200,
  editor: 1200,
  continuity: 1400,
  publisher: 1000,
};

const GOOGLE_LIMITS: Partial<Record<AgentId, number>> = {
  concept: 1000,
  character: 1600,
  worldbuilding: 1600,
  plot: 2200,
  "chapter-outline": 2400,
  drafting: 3500,
  editor: 1600,
  continuity: 2200,
  publisher: 1200,
};

export function getMaxTokensForAgent(
  agentId?: AgentId,
  provider: LlmProvider = "openrouter"
): number {
  if (provider === "google") {
    return GOOGLE_LIMITS[agentId ?? "concept"] ?? 1600;
  }
  if (provider === "custom") {
    return OPENROUTER_DEFAULT_LIMITS[agentId ?? "concept"] ?? 1200;
  }
  if (isLowCreditMode()) {
    return OPENROUTER_LOW_CREDIT_LIMITS[agentId ?? "concept"] ?? 1200;
  }
  return OPENROUTER_DEFAULT_LIMITS[agentId ?? "concept"] ?? 1200;
}

export function resolveMaxTokens(
  options?: CallGemmaOptions,
  provider?: LlmProvider
): number {
  const resolvedProvider = provider ?? options?.provider ?? "openrouter";
  const base =
    options?.maxTokens ??
    getMaxTokensForAgent(options?.agentId, resolvedProvider);
  const capRaw =
    process.env.AI_MAX_TOKENS_CAP?.trim() ||
    process.env.GEMMA_MAX_TOKENS_CAP?.trim();
  const cap = Number(capRaw);
  if (!Number.isFinite(cap) || cap <= 0) {
    return base;
  }
  return Math.min(base, cap);
}
