import { buildAgentContext } from "./agents";
import { logAgentTiming } from "./agent-timing";
import {
  buildFallbackAgentOutput,
} from "./agent-fallbacks";
import { buildCompactRetryPrompt } from "./agent-retry-prompts";
import {
  enforcePromptBudget,
  logPromptSize,
} from "./prompt-budget";
import {
  buildChapterArchitectPrompt,
  buildChapterArchitectRetryPrompt,
} from "./chapter-architect-context";
import {
  callGemmaWithTimeout,
  parseJsonWithTimeout,
  shouldUseMockForRequest,
  type CallGemmaResult,
} from "./gemma";
import { normalizeAiModel } from "./ai-model-utils";
import type { LlmProvider } from "./llm-config";
import { normalizeChapterOutlineOutput } from "./normalize-chapter-outline";
import { getMockOutput } from "./mock-outputs";
import { getAllChapters } from "./structure-utils";
import { shouldUseSequentialDrafting } from "./structure-utils";
import { buildAgentPrompt, buildChapterDraftPrompt } from "./prompts";
import type { AgentId, LlmProviderId, StoryProject } from "./types";

export type RunAgentResult = {
  output: unknown;
  providerUsed?: LlmProviderId;
  providerFallbackUsed?: LlmProviderId;
  fallbackUsed?: boolean;
  autoRecovered?: boolean;
};

function toProviderId(provider: LlmProvider): LlmProviderId {
  return provider;
}

function withRecoveryFlags(
  result: Omit<RunAgentResult, "autoRecovered"> & { fallbackUsed?: boolean }
): RunAgentResult {
  return {
    ...result,
    autoRecovered: Boolean(result.fallbackUsed),
  };
}

export const AGENT_TIMEOUT_MS = 45_000;
export const CHAPTER_OUTLINE_LLM_TIMEOUT_MS = 40_000;
const JSON_PARSE_TIMEOUT_MS = 5_000;
export const MAX_RAW_RESPONSE_CHARS = 80_000;
export const MAX_CHAPTER_OUTLINE_CHARS = 30_000;
const MAX_RETRY_RAW_CHARS = 30_000;

const HARD_PROVIDER_ERROR_PATTERNS = [
  "402",
  "401",
  "403",
  "prompt tokens limit exceeded",
  "fewer max_tokens",
  "requires more credits",
  "insufficient credits",
  "billing",
  "payment required",
  "invalid api key",
  "model not found",
  "no such model",
];

function isHardProviderError(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return HARD_PROVIDER_ERROR_PATTERNS.some((p) => message.includes(p));
}

function logParseError(
  agentId: AgentId,
  raw: string,
  cause: unknown,
  context?: { provider?: LlmProvider; model?: string }
): void {
  console.error("[LLM_PARSE_ERROR]", {
    agentId,
    provider: context?.provider,
    model: context?.model,
    rawLength: raw.length,
    rawPreview: raw.slice(0, 500),
    error: cause instanceof Error ? cause.message : String(cause),
  });
}

function logAgentFallback(agentId: AgentId, reason: string, project: StoryProject): void {
  console.warn("[AGENT_FALLBACK]", {
    agentId,
    reason,
    language: project.language,
    promptLength: project.userPrompt.length,
  });
}

function guardRawSize(agentId: AgentId, raw: string): void {
  if (agentId === "chapter-outline") {
    if (raw.length > MAX_CHAPTER_OUTLINE_CHARS) {
      throw new Error(
        `Agent "chapter-outline" returned too much text (${raw.length} chars). Reduce chapter count or structure complexity.`
      );
    }
    return;
  }
  if (raw.length > MAX_RAW_RESPONSE_CHARS) {
    throw new Error(
      `Agent "${agentId}" returned too much text (${raw.length} chars). Please reduce chapter count or chapter lengths.`
    );
  }
}

function largeMalformedMessage(agentId: AgentId): string {
  if (agentId === "chapter-outline") {
    return "Chapter Architect returned a malformed large response. Try reducing the structure size.";
  }
  return `Agent "${agentId}" returned a malformed large response. Try reducing the request size.`;
}

function throwTimeoutError(agentId: AgentId): never {
  throw new Error(
    `Agent "${agentId}" timed out after ${AGENT_TIMEOUT_MS / 1000} seconds before Vercel timeout. Try reducing structure complexity.`
  );
}

async function runAgentWithTimeout<T>(
  agentId: AgentId,
  fn: () => Promise<T>
): Promise<T> {
  const startedAt = Date.now();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Agent "${agentId}" timed out after ${AGENT_TIMEOUT_MS / 1000} seconds`));
        }, AGENT_TIMEOUT_MS);
      }),
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("timed out")) {
      logAgentTiming(agentId, "agent_timeout", startedAt);
      throwTimeoutError(agentId);
    }
    throw err;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function preparePromptForAgent(prompt: string, agentId: AgentId): string {
  logPromptSize(agentId, prompt);
  return enforcePromptBudget(prompt, agentId);
}

async function callLiveGemma(
  prompt: string,
  agentId: AgentId,
  language: StoryProject["language"],
  requestAiModel: StoryProject["aiModel"],
  signal: AbortSignal | undefined,
  draftChapterNumber?: number,
  llmTimeoutMs = AGENT_TIMEOUT_MS
): Promise<CallGemmaResult> {
  const budgetedPrompt = preparePromptForAgent(prompt, agentId);
  try {
    return await callGemmaWithTimeout(budgetedPrompt, {
      signal,
      timeoutMs: llmTimeoutMs,
      mockAgentId: agentId,
      mockLanguage: language,
      agentId,
      draftChapterNumber,
      projectAiModel: requestAiModel,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("timed out") || msg.includes("LLM request timed out")) {
      throwTimeoutError(agentId);
    }
    throw err;
  }
}

async function parseAgentJsonAsync(
  agentId: AgentId,
  raw: string,
  project: StoryProject,
  startedAt: number
): Promise<unknown> {
  guardRawSize(agentId, raw);
  logAgentTiming(agentId, "before_parse_json", startedAt, {
    rawLength: raw.length,
  });
  try {
    const parsed = await parseJsonWithTimeout(raw, JSON_PARSE_TIMEOUT_MS);
    logAgentTiming(agentId, "after_parse_json", startedAt);
    if (agentId === "chapter-outline") {
      logAgentTiming(agentId, "before_normalize", startedAt);
      const normalized = normalizeChapterOutlineOutput(parsed, project);
      logAgentTiming(agentId, "after_normalize", startedAt);
      return normalized;
    }
    return parsed;
  } catch (firstErr) {
    if (raw.length > MAX_RETRY_RAW_CHARS) {
      throw new Error(largeMalformedMessage(agentId));
    }
    throw firstErr;
  }
}

type ExecuteAgentRecoveryOptions = {
  agentId: AgentId;
  project: StoryProject;
  requestAiModel: StoryProject["aiModel"];
  signal?: AbortSignal;
  draftChapterNumber?: number;
  buildPrompt: () => string;
  buildRetryPrompt: () => string;
  llmTimeoutMs?: number;
  oversizeFirstResponseLimit?: number;
  allowLocalFallbackOnLlmError?: boolean;
};

async function executeAgentWithRecovery(
  options: ExecuteAgentRecoveryOptions
): Promise<RunAgentResult> {
  const {
    agentId,
    project,
    requestAiModel,
    signal,
    draftChapterNumber,
    buildPrompt,
    buildRetryPrompt,
    llmTimeoutMs = AGENT_TIMEOUT_MS,
    oversizeFirstResponseLimit = MAX_RETRY_RAW_CHARS,
    allowLocalFallbackOnLlmError = true,
  } = options;

  const startedAt = Date.now();
  const providerMeta = (llmResult: CallGemmaResult) => ({
    providerUsed: toProviderId(llmResult.providerUsed),
    providerFallbackUsed: llmResult.usedProviderFallback
      ? toProviderId(llmResult.providerUsed)
      : undefined,
  });

  const localFallback = (llmResult?: CallGemmaResult, reason?: string): RunAgentResult => {
    if (reason) logAgentFallback(agentId, reason, project);
    return withRecoveryFlags({
      output: buildFallbackAgentOutput(agentId, project),
      fallbackUsed: true,
      ...(llmResult ? providerMeta(llmResult) : {}),
    });
  };

  try {
    let llmResult = await callLiveGemma(
      buildPrompt(),
      agentId,
      project.language,
      requestAiModel,
      signal,
      draftChapterNumber,
      llmTimeoutMs
    );
    let raw = llmResult.text;
    logAgentTiming(agentId, "llm_response_received", startedAt, {
      rawLength: raw.length,
      providerUsed: llmResult.providerUsed,
      usedProviderFallback: llmResult.usedProviderFallback,
    });

    try {
      const output = await parseAgentJsonAsync(agentId, raw, project, startedAt);
      return withRecoveryFlags({
        output,
        ...providerMeta(llmResult),
      });
    } catch (firstErr) {
      if (raw.length > oversizeFirstResponseLimit) {
        logParseError(agentId, raw, firstErr, {
          provider: llmResult.providerUsed,
          model: llmResult.modelUsed,
        });
        return localFallback(llmResult, "oversize_first_response");
      }

      try {
        llmResult = await callLiveGemma(
          buildRetryPrompt(),
          agentId,
          project.language,
          requestAiModel,
          signal,
          draftChapterNumber,
          llmTimeoutMs
        );
        raw = llmResult.text;
        logAgentTiming(agentId, "llm_response_received_retry", startedAt, {
          rawLength: raw.length,
          providerUsed: llmResult.providerUsed,
        });
        const output = await parseAgentJsonAsync(agentId, raw, project, startedAt);
        return withRecoveryFlags({
          output,
          ...providerMeta(llmResult),
        });
      } catch (retryErr) {
        logParseError(agentId, raw, retryErr, {
          provider: llmResult.providerUsed,
          model: llmResult.modelUsed,
        });
        return localFallback(
          llmResult,
          retryErr instanceof Error ? retryErr.message : "parse_retry_failed"
        );
      }
    }
  } catch (err) {
    if (isHardProviderError(err)) {
      throw err;
    }
    if (!allowLocalFallbackOnLlmError) {
      throw err;
    }
    return localFallback(
      undefined,
      err instanceof Error ? err.message : "llm_or_timeout"
    );
  }
}

export async function runAgent(
  project: StoryProject,
  agentId: AgentId,
  signal?: AbortSignal,
  draftChapterNumber?: number
): Promise<RunAgentResult> {
  const requestAiModel = normalizeAiModel(project.aiModel);

  if (shouldUseMockForRequest(requestAiModel)) {
    await new Promise((r) => setTimeout(r, 600));
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    return {
      output: await getMockOutput(agentId, project.language, {
        project,
        draftChapterNumber,
      }),
    };
  }

  return runAgentWithTimeout<RunAgentResult>(agentId, async () => {
    if (agentId === "chapter-outline") {
      return executeAgentWithRecovery({
        agentId,
        project,
        requestAiModel,
        signal,
        llmTimeoutMs: CHAPTER_OUTLINE_LLM_TIMEOUT_MS,
        oversizeFirstResponseLimit: MAX_CHAPTER_OUTLINE_CHARS,
        buildPrompt: () => buildChapterArchitectPrompt(project),
        buildRetryPrompt: () => buildChapterArchitectRetryPrompt(project),
      });
    }

    const context = buildAgentContext(project, agentId);
    const prompt =
      agentId === "drafting" && draftChapterNumber != null
        ? buildChapterDraftPrompt(project, draftChapterNumber)
        : buildAgentPrompt(agentId, context);

    return executeAgentWithRecovery({
      agentId,
      project,
      requestAiModel,
      signal,
      draftChapterNumber,
      buildPrompt: () => prompt,
      buildRetryPrompt: () => buildCompactRetryPrompt(agentId, project),
    });
  });
}

export function shouldRunSequentialDraft(project: StoryProject): boolean {
  return shouldUseSequentialDrafting(project.structure);
}

export function getDraftChapterNumbers(project: StoryProject): number[] {
  return getAllChapters(project).map((c) => c.number);
}
