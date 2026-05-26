import {
  assertProviderConfigured,
  resolveRequestProviders,
  shouldUseMockForRequest,
} from "./ai-provider-resolution";
import { normalizeAiModel } from "./ai-model-utils";
import {
  resolveMaxTokens,
  type CallGemmaOptions,
} from "./agent-token-limits";
import {
  getLlmStatus,
  getPrimaryProvider,
  getProviderConfig,
  hasAnyLiveProviderKey,
  type LlmProvider,
} from "./llm-config";

export { shouldUseMockForRequest } from "./ai-provider-resolution";
import { getMockOutputAsJson } from "./mock-outputs";

export type { CallGemmaOptions } from "./agent-token-limits";
export type { LlmProvider } from "./llm-config";
export type GemmaProvider = LlmProvider;

const SYSTEM_MESSAGE =
  "You are NovelPilot's structured creative writing engine. Return only valid JSON when requested.";

export type CallGemmaResult = {
  text: string;
  providerUsed: LlmProvider;
  modelUsed: string;
  usedProviderFallback: boolean;
  primaryError?: string;
};

export function isMockMode(): boolean {
  return !hasAnyLiveProviderKey();
}

export function getProvider(): LlmProvider {
  return getPrimaryProvider();
}

export function getModel(): string {
  return getProviderConfig(getPrimaryProvider()).model;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findJsonEnd(text: string, start: number, open: string, close: string): number {
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === open) depth++;
    if (ch === close) {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

export function extractFirstJson(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Empty LLM response — no JSON to parse");
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    // continue to bracket extraction
  }

  const objStart = trimmed.indexOf("{");
  const arrStart = trimmed.indexOf("[");
  let start = -1;
  let open = "{";
  let close = "}";

  if (objStart >= 0 && (arrStart < 0 || objStart < arrStart)) {
    start = objStart;
  } else if (arrStart >= 0) {
    start = arrStart;
    open = "[";
    close = "]";
  }

  if (start < 0) {
    throw new Error("No JSON object or array found in LLM response");
  }

  const end = findJsonEnd(trimmed, start, open, close);
  if (end < 0) {
    throw new Error("Unbalanced JSON in LLM response");
  }

  return trimmed.slice(start, end);
}

export function parseJsonFromLlm(text: string): unknown {
  const jsonStr = extractFirstJson(text);
  return JSON.parse(jsonStr);
}

export async function parseJsonWithTimeout(
  raw: string,
  timeoutMs = 5000
): Promise<unknown> {
  return await Promise.race([
    Promise.resolve().then(() => parseJsonFromLlm(raw)),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("JSON parsing timed out")),
        timeoutMs
      )
    ),
  ]);
}

function extractGoogleText(data: unknown): string {
  const d = data as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    }>;
    error?: { message?: string };
  };

  if (d.error?.message) {
    throw new Error(d.error.message);
  }

  const parts = d.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .filter((p) => !p.thought)
    .map((p) => p.text ?? "")
    .join("");

  if (!text.trim()) {
    throw new Error("Empty response from Google generateContent API");
  }
  return text;
}

function extractOpenRouterText(data: unknown): string {
  const d = data as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };

  if (d.error?.message) {
    throw new Error(d.error.message);
  }

  const content = d.choices?.[0]?.message?.content;
  if (!content?.trim()) {
    throw new Error(
      "Empty response from OpenRouter — missing choices[0].message.content"
    );
  }
  return content;
}

async function parseErrorResponse(response: Response, label: string): Promise<string> {
  const errText = await response.text();
  try {
    const parsed = JSON.parse(errText) as { error?: { message?: string } };
    if (parsed.error?.message) {
      return `${label} (${response.status}): ${parsed.error.message}`;
    }
  } catch {
    // use raw text
  }
  return `${label} (${response.status}): ${errText.slice(0, 500)}`;
}

function buildOpenRouterHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  const siteUrl = process.env.OPENROUTER_SITE_URL?.trim();
  const appName =
    process.env.OPENROUTER_APP_NAME?.trim() || "NovelPilot";
  if (siteUrl) headers["HTTP-Referer"] = siteUrl;
  headers["X-Title"] = appName;
  return headers;
}

export function shouldFallbackToProvider(error: unknown): boolean {
  if (error instanceof Error && error.name === "AbortError") {
    return false;
  }
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  if (msg.includes("abort")) return false;
  if (
    msg.includes("402") ||
    msg.includes("prompt tokens limit exceeded") ||
    msg.includes("fewer max_tokens") ||
    msg.includes("requires more credits") ||
    msg.includes("insufficient credits") ||
    msg.includes("insufficient_credit") ||
    msg.includes("billing") ||
    msg.includes("payment required")
  ) {
    return true;
  }
  if (msg.includes("429") || msg.includes("rate limit") || msg.includes("rate_limit")) {
    return true;
  }
  if (
    msg.includes("502") ||
    msg.includes("503") ||
    msg.includes("504") ||
    msg.includes("5xx") ||
    msg.includes("gateway timeout") ||
    msg.includes("timed out")
  ) {
    return true;
  }
  return false;
}

async function callOpenRouter(
  prompt: string,
  options: CallGemmaOptions | undefined,
  provider: LlmProvider
): Promise<string> {
  const config = getProviderConfig(provider);
  if (!config.configured) {
    throw new Error("OpenRouter API key is not configured");
  }
  const maxTokens = resolveMaxTokens(options, provider);
  const model = options?.model ?? config.model;
  const response = await fetch(config.apiUrl, {
    method: "POST",
    headers: buildOpenRouterHeaders(config.apiKey),
    signal: options?.signal,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_MESSAGE },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      top_p: 0.95,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response, "OpenRouter API error"));
  }

  return extractOpenRouterText(await response.json());
}

async function callGoogleOnce(
  combinedPrompt: string,
  options: CallGemmaOptions | undefined,
  provider: LlmProvider,
  useJsonMime: boolean
): Promise<string> {
  const config = getProviderConfig(provider);
  if (!config.configured) {
    throw new Error("Google AI API key is not configured");
  }
  const maxTokens = resolveMaxTokens(options, provider);
  const model = options?.model ?? config.model;
  const url = `${config.apiUrl}/${model}:generateContent?key=${config.apiKey}`;

  const generationConfig: Record<string, unknown> = {
    temperature: 0.8,
    maxOutputTokens: maxTokens,
    topP: 0.95,
  };
  if (useJsonMime) {
    generationConfig.responseMimeType = "application/json";
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: options?.signal,
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: combinedPrompt }],
        },
      ],
      generationConfig,
    }),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorResponse(response, "Google AI API error")
    );
  }

  return extractGoogleText(await response.json());
}

async function callGoogleGenerateContent(
  prompt: string,
  options: CallGemmaOptions | undefined,
  provider: LlmProvider
): Promise<string> {
  const combinedPrompt = `${SYSTEM_MESSAGE}\n\n${prompt}`;

  try {
    return await callGoogleOnce(combinedPrompt, options, provider, true);
  } catch (firstErr) {
    const msg =
      firstErr instanceof Error ? firstErr.message : String(firstErr);
    if (
      msg.toLowerCase().includes("responsemimetype") ||
      msg.toLowerCase().includes("mime") ||
      msg.includes("400")
    ) {
      return await callGoogleOnce(combinedPrompt, options, provider, false);
    }
    throw firstErr;
  }
}

async function callGoogleWithRateLimitRetry(
  prompt: string,
  options: CallGemmaOptions | undefined,
  provider: LlmProvider
): Promise<string> {
  try {
    return await callGoogleGenerateContent(prompt, options, provider);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const is429 =
      msg.includes("429") ||
      msg.toLowerCase().includes("rate limit") ||
      msg.toLowerCase().includes("resource exhausted");
    if (!is429) throw err;
    await sleep(2000);
    try {
      return await callGoogleGenerateContent(prompt, options, provider);
    } catch (retryErr) {
      const retryMsg =
        retryErr instanceof Error ? retryErr.message : String(retryErr);
      throw new Error(
        `Google AI Studio / Gemini API rate limit exceeded. Wait and try again, reduce chapter length, or use OpenRouter fallback. (${retryMsg})`
      );
    }
  }
}

async function callCustomProvider(
  prompt: string,
  options: CallGemmaOptions | undefined,
  provider: LlmProvider
): Promise<string> {
  const config = getProviderConfig(provider);
  if (!config.configured) {
    throw new Error("Custom provider is not configured (GEMMA_API_URL and API key required)");
  }
  const maxTokens = resolveMaxTokens(options, provider);
  const model = options?.model ?? config.model;
  const response = await fetch(config.apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    signal: options?.signal,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_MESSAGE },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      top_p: 0.95,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorResponse(response, "Custom provider API error")
    );
  }

  const data = await response.json();
  try {
    return extractOpenRouterText(data);
  } catch {
    return extractGoogleText(data);
  }
}

async function callProvider(
  provider: LlmProvider,
  prompt: string,
  options?: CallGemmaOptions
): Promise<string> {
  switch (provider) {
    case "google":
      return callGoogleWithRateLimitRetry(prompt, options, provider);
    case "custom":
      return callCustomProvider(prompt, options, provider);
    case "openrouter":
    default:
      return callOpenRouter(prompt, options, provider);
  }
}

function linkAbortSignals(
  ...signals: (AbortSignal | undefined)[]
): AbortController {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  for (const signal of signals) {
    if (!signal) continue;
    if (signal.aborted) {
      controller.abort();
      return controller;
    }
    signal.addEventListener("abort", onAbort, { once: true });
  }
  return controller;
}

export async function callGemma(
  prompt: string,
  options?: CallGemmaOptions
): Promise<CallGemmaResult> {
  const normalizedAi = normalizeAiModel(options?.projectAiModel);
  if (shouldUseMockForRequest(options?.projectAiModel)) {
    if (options?.mockAgentId && options?.mockLanguage) {
      return {
        text: await getMockOutputAsJson(
          options.mockAgentId,
          options.mockLanguage
        ),
        providerUsed: "openrouter",
        modelUsed: options?.model ?? "mock",
        usedProviderFallback: false,
      };
    }
    await new Promise((r) => setTimeout(r, 400));
    return {
      text: '{"message":"Mock mode — configure GOOGLE_AI_API_KEY or OPENROUTER_API_KEY for live generation"}',
      providerUsed: "openrouter",
      modelUsed: options?.model ?? "mock",
      usedProviderFallback: false,
    };
  }

  assertProviderConfigured(options?.projectAiModel);

  const forced = options?.provider;
  const resolved = forced
    ? {
        primary: forced,
        fallback: null as LlmProvider | null,
        model: options?.model ?? getProviderConfig(forced).model,
      }
    : resolveRequestProviders(options?.projectAiModel);

  const primary = resolved.primary;
  const fallback = resolved.fallback;
  const callOptions: CallGemmaOptions = {
    ...options,
    model: resolved.model,
    provider: primary,
  };
  console.info("[LLM_PROVIDER_SELECTED]", {
    agentId: options?.agentId,
    providerChoice: normalizedAi.providerChoice,
    resolvedProvider: primary,
    resolvedModel: callOptions.model,
  });

  try {
    const text = await callProvider(primary, prompt, callOptions);
    console.info("[LLM_PROVIDER]", {
      primary,
      fallback,
      providerUsed: primary,
      usedProviderFallback: false,
    });
    return {
      text,
      providerUsed: primary,
      modelUsed: callOptions.model ?? getProviderConfig(primary).model,
      usedProviderFallback: false,
    };
  } catch (primaryError) {
    const primaryMsg =
      primaryError instanceof Error
        ? primaryError.message
        : String(primaryError);

    if (!fallback || !shouldFallbackToProvider(primaryError)) {
      throw primaryError;
    }

    console.info("[LLM_PROVIDER]", {
      primary,
      fallback,
      primaryError: primaryMsg.slice(0, 200),
      attemptingFallback: true,
    });

    try {
      const fallbackOptions: CallGemmaOptions = {
        ...callOptions,
        provider: fallback,
        model: getProviderConfig(fallback).model,
      };
      console.info("[LLM_PROVIDER_SELECTED]", {
        agentId: options?.agentId,
        providerChoice: normalizedAi.providerChoice,
        resolvedProvider: fallback,
        resolvedModel: fallbackOptions.model,
      });
      const text = await callProvider(fallback, prompt, fallbackOptions);
      console.info("[LLM_PROVIDER]", {
        primary,
        fallback,
        providerUsed: fallback,
        usedProviderFallback: true,
      });
      return {
        text,
        providerUsed: fallback,
        modelUsed: fallbackOptions.model ?? getProviderConfig(fallback).model,
        usedProviderFallback: true,
        primaryError: primaryMsg,
      };
    } catch (fallbackError) {
      const fallbackMsg =
        fallbackError instanceof Error
          ? fallbackError.message
          : String(fallbackError);
      throw new Error(
        `Primary provider ${primary} failed: ${primaryMsg}. Fallback provider ${fallback} also failed: ${fallbackMsg}`
      );
    }
  }
}

/** Enforces a wall-clock timeout in addition to any caller abort signal. */
export async function callGemmaWithTimeout(
  prompt: string,
  options?: CallGemmaOptions & { timeoutMs?: number }
): Promise<CallGemmaResult> {
  const timeoutMs = options?.timeoutMs ?? 60_000;
  const timeoutController = new AbortController();
  const linked = linkAbortSignals(options?.signal, timeoutController.signal);

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      timeoutController.abort();
      reject(new Error(`LLM request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    linked.signal.addEventListener(
      "abort",
      () => {
        if (timeoutId) clearTimeout(timeoutId);
      },
      { once: true }
    );
  });

  try {
    return await Promise.race([
      callGemma(prompt, { ...options, signal: linked.signal }),
      timeoutPromise,
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function getLlmConfig() {
  return getLlmStatus();
}
