import type { AgentId, GenerateAgentResponse, StoryProject } from "./types";

export interface RetryPolicy {
  maxRetries: number;
  retryDelayMs: number;
}

export const DEFAULT_AGENT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 2,
  retryDelayMs: 1200,
};

export const CHAPTER_OUTLINE_RETRY_POLICY: RetryPolicy = {
  maxRetries: 2,
  retryDelayMs: 1200,
};

export function getRetryPolicyForAgent(agentId: AgentId): RetryPolicy {
  return agentId === "chapter-outline"
    ? CHAPTER_OUTLINE_RETRY_POLICY
    : DEFAULT_AGENT_RETRY_POLICY;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const NON_RETRYABLE_PATTERNS = [
  "401",
  "402",
  "403",
  "unauthorized",
  "invalid api key",
  "invalid_api_key",
  "insufficient credits",
  "insufficient_credit",
  "requires more credits",
  "fewer max_tokens",
  "billing",
  "payment required",
  "model not found",
  "model_not_found",
  "no such model",
];

const RETRYABLE_PATTERNS = [
  "timeout",
  "timed out",
  "invalid json",
  "parse json",
  "failed to parse",
  "malformed",
  "502",
  "503",
  "504",
  "5xx",
  "rate limit",
  "rate_limit",
  "network",
  "fetch failed",
  "econnreset",
  "connection reset",
  "too much text",
  "large response",
  "aborted request",
];

export function isRetryableError(errorMessage: string): boolean {
  const lower = errorMessage.toLowerCase();
  if (NON_RETRYABLE_PATTERNS.some((p) => lower.includes(p))) {
    return false;
  }
  if (RETRYABLE_PATTERNS.some((p) => lower.includes(p))) {
    return true;
  }
  return true;
}

export async function fetchAgent(
  agentId: AgentId,
  project: StoryProject,
  signal: AbortSignal,
  draftChapterNumber?: number
): Promise<GenerateAgentResponse> {
  const res = await fetch("/api/generate-agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId, project, draftChapterNumber }),
    signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ?? `Agent ${agentId} failed`
    );
  }
  return res.json() as Promise<GenerateAgentResponse>;
}

export async function fetchAgentWithRetry(
  agentId: AgentId,
  project: StoryProject,
  signal: AbortSignal,
  options?: {
    draftChapterNumber?: number;
    maxRetries?: number;
    retryDelayMs?: number;
    onRetry?: (attempt: number, error: Error) => void;
  }
): Promise<GenerateAgentResponse> {
  const policy = getRetryPolicyForAgent(agentId);
  const maxRetries = options?.maxRetries ?? policy.maxRetries;
  const retryDelayMs = options?.retryDelayMs ?? policy.retryDelayMs;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchAgent(
        agentId,
        project,
        signal,
        options?.draftChapterNumber
      );
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw err;
      }
      lastError = err instanceof Error ? err : new Error(String(err));

      if (!isRetryableError(lastError.message)) {
        throw lastError;
      }

      if (attempt >= maxRetries) {
        break;
      }

      options?.onRetry?.(attempt + 1, lastError);
      await sleep(retryDelayMs);
    }
  }

  throw lastError ?? new Error(`Agent ${agentId} failed`);
}
