import { buildAgentContext } from "./agents";
import { logAgentTiming } from "./agent-timing";
import {
  enforcePromptBudget,
  logPromptSize,
} from "./prompt-budget";
import {
  buildChapterArchitectPrompt,
  buildChapterArchitectRetryPrompt,
} from "./chapter-architect-context";
import { buildFallbackChapterOutline } from "./chapter-outline-fallback";
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
};

function toProviderId(provider: LlmProvider): LlmProviderId {
  return provider;
}

export const AGENT_TIMEOUT_MS = 45_000;
export const CHAPTER_OUTLINE_LLM_TIMEOUT_MS = 40_000;
const JSON_PARSE_TIMEOUT_MS = 5_000;
export const MAX_RAW_RESPONSE_CHARS = 80_000;
export const MAX_CHAPTER_OUTLINE_CHARS = 30_000;
const MAX_RETRY_RAW_CHARS = 30_000;

const JSON_RETRY_INSTRUCTION = `Your previous response was not valid JSON.
Return ONLY valid JSON.
Do not include markdown.
Do not include explanations.
Do not include comments.
Use the exact schema from the prompt.`;

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

function previewRaw(raw: string, max = 200): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, max);
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

function throwParseError(
  agentId: AgentId,
  raw: string,
  cause?: unknown,
  context?: { provider?: LlmProvider; model?: string }
): never {
  logParseError(agentId, raw, cause, context);
  const provider = context?.provider ?? "unknown";
  const model = context?.model ?? "unknown";
  const preview = previewRaw(raw);
  const hint =
    cause instanceof Error ? cause.message : "Invalid JSON structure";
  throw new Error(
    `Agent "${agentId}" failed to parse JSON (provider: ${provider}, model: ${model}). ${hint}. Response preview: "${preview}${raw.length > 200 ? "…" : ""}"`
  );
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

async function callAndParseAgentJson(
  agentId: AgentId,
  prompt: string,
  project: StoryProject,
  requestAiModel: StoryProject["aiModel"],
  signal?: AbortSignal,
  draftChapterNumber?: number
): Promise<RunAgentResult> {
  const startedAt = Date.now();
  let llmResult = await callLiveGemma(
    prompt,
    agentId,
    project.language,
    requestAiModel,
    signal,
    draftChapterNumber
  );
  let raw = llmResult.text;
  logAgentTiming(agentId, "llm_response_received", startedAt, {
    rawLength: raw.length,
    providerUsed: llmResult.providerUsed,
    usedProviderFallback: llmResult.usedProviderFallback,
  });

  try {
    const output = await parseAgentJsonAsync(agentId, raw, project, startedAt);
    return {
      output,
      providerUsed: toProviderId(llmResult.providerUsed),
      providerFallbackUsed: llmResult.usedProviderFallback
        ? toProviderId(llmResult.providerUsed)
        : undefined,
    };
  } catch (firstErr) {
    if (raw.length > MAX_RETRY_RAW_CHARS) {
      logParseError(agentId, raw, firstErr, {
        provider: llmResult.providerUsed,
        model: llmResult.modelUsed,
      });
      throw new Error(largeMalformedMessage(agentId));
    }

    try {
      llmResult = await callLiveGemma(
        `${prompt}\n\n${JSON_RETRY_INSTRUCTION}`,
        agentId,
        project.language,
        requestAiModel,
        signal,
        draftChapterNumber
      );
      raw = llmResult.text;
      logAgentTiming(agentId, "llm_response_received_retry", startedAt, {
        rawLength: raw.length,
        providerUsed: llmResult.providerUsed,
      });
      const output = await parseAgentJsonAsync(agentId, raw, project, startedAt);
      return {
        output,
        providerUsed: toProviderId(llmResult.providerUsed),
        providerFallbackUsed: llmResult.usedProviderFallback
          ? toProviderId(llmResult.providerUsed)
          : undefined,
      };
    } catch (retryErr) {
      throwParseError(agentId, raw, retryErr, {
        provider: llmResult.providerUsed,
        model: llmResult.modelUsed,
      });
    }
  }
}

function logChapterOutlineFallback(reason: string, project: StoryProject): void {
  console.warn("[CHAPTER_OUTLINE_FALLBACK]", {
    reason,
    partCount: project.structure.partCount,
    totalChapters: project.structure.totalChapterCount,
  });
}

async function runChapterOutlineAgent(
  project: StoryProject,
  requestAiModel: StoryProject["aiModel"],
  signal?: AbortSignal
): Promise<RunAgentResult> {
  const agentId = "chapter-outline" as const;
  const startedAt = Date.now();
  const prompt = buildChapterArchitectPrompt(project);

  const attemptParse = async (raw: string): Promise<unknown> => {
    logAgentTiming(agentId, "openrouter_response_received", startedAt, {
      rawLength: raw.length,
    });
    return parseAgentJsonAsync(agentId, raw, project, startedAt);
  };

  try {
    let llmResult = await callLiveGemma(
      prompt,
      agentId,
      project.language,
      requestAiModel,
      signal,
      undefined,
      CHAPTER_OUTLINE_LLM_TIMEOUT_MS
    );
    let raw = llmResult.text;
    try {
      const output = await attemptParse(raw);
      return {
        output,
        providerUsed: toProviderId(llmResult.providerUsed),
        providerFallbackUsed: llmResult.usedProviderFallback
          ? toProviderId(llmResult.providerUsed)
          : undefined,
      };
    } catch {
      if (raw.length > MAX_CHAPTER_OUTLINE_CHARS) {
        logChapterOutlineFallback("oversize_first_response", project);
        return { output: buildFallbackChapterOutline(project) };
      }

      try {
        llmResult = await callLiveGemma(
          buildChapterArchitectRetryPrompt(project),
          agentId,
          project.language,
          requestAiModel,
          signal,
          undefined,
          CHAPTER_OUTLINE_LLM_TIMEOUT_MS
        );
        raw = llmResult.text;
        const output = await attemptParse(raw);
        return {
          output,
          providerUsed: toProviderId(llmResult.providerUsed),
          providerFallbackUsed: llmResult.usedProviderFallback
            ? toProviderId(llmResult.providerUsed)
            : undefined,
        };
      } catch (retryErr) {
        logParseError(agentId, raw, retryErr, {
          provider: llmResult.providerUsed,
          model: llmResult.modelUsed,
        });
        logChapterOutlineFallback(
          retryErr instanceof Error ? retryErr.message : "parse_retry_failed",
          project
        );
        return { output: buildFallbackChapterOutline(project) };
      }
    }
  } catch (err) {
    if (isHardProviderError(err)) {
      throw err;
    }
    logChapterOutlineFallback(
      err instanceof Error ? err.message : "llm_or_timeout",
      project
    );
    return { output: buildFallbackChapterOutline(project) };
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
      return runChapterOutlineAgent(project, requestAiModel, signal);
    }

    const context = buildAgentContext(project, agentId);
    const prompt =
      agentId === "drafting" && draftChapterNumber != null
        ? buildChapterDraftPrompt(project, draftChapterNumber)
        : buildAgentPrompt(agentId, context);

    return callAndParseAgentJson(
      agentId,
      prompt,
      project,
      requestAiModel,
      signal,
      draftChapterNumber
    );
  });
}

export function shouldRunSequentialDraft(project: StoryProject): boolean {
  return shouldUseSequentialDrafting(project.structure);
}

export function getDraftChapterNumbers(project: StoryProject): number[] {
  return getAllChapters(project).map((c) => c.number);
}
