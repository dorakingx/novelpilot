import { getMockOutputAsJson } from "./mock-outputs";
import type { AgentId, Language } from "./types";

export type GemmaProvider = "openrouter" | "google" | "custom";

const DEFAULT_OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_GOOGLE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "google/gemma-3-27b-it";

const SYSTEM_MESSAGE =
  "You are NovelPilot's Gemma-powered structured creative writing engine. Return only valid JSON when requested.";

export function isMockMode(): boolean {
  return !process.env.GEMMA_API_KEY?.trim();
}

export function getProvider(): GemmaProvider {
  const raw = process.env.GEMMA_PROVIDER?.trim().toLowerCase();
  if (raw === "google") return "google";
  if (raw === "custom") return "custom";
  return "openrouter";
}

export function getModel(): string {
  return process.env.GEMMA_MODEL?.trim() || DEFAULT_MODEL;
}

function getApiKey(): string {
  return process.env.GEMMA_API_KEY?.trim() ?? "";
}

function getOpenRouterUrl(): string {
  return process.env.GEMMA_API_URL?.trim() || DEFAULT_OPENROUTER_URL;
}

function getGoogleApiUrl(): string {
  const base = process.env.GEMMA_API_URL?.trim() || DEFAULT_GOOGLE_URL;
  return base.replace(/\/$/, "");
}

function getCustomUrl(): string {
  const url = process.env.GEMMA_API_URL?.trim();
  if (!url) {
    throw new Error(
      "GEMMA_API_URL is required when GEMMA_PROVIDER=custom"
    );
  }
  return url;
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

  if (!text) {
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
    if (parsed.error?.message) return `${label} (${response.status}): ${parsed.error.message}`;
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

async function callOpenRouter(
  prompt: string,
  options?: { signal?: AbortSignal }
): Promise<string> {
  const apiKey = getApiKey();
  const response = await fetch(getOpenRouterUrl(), {
    method: "POST",
    headers: buildOpenRouterHeaders(apiKey),
    signal: options?.signal,
    body: JSON.stringify({
      model: getModel(),
      messages: [
        { role: "system", content: SYSTEM_MESSAGE },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      top_p: 0.95,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response, "OpenRouter API error"));
  }

  return extractOpenRouterText(await response.json());
}

async function callGoogleGenerateContent(
  prompt: string,
  options?: { signal?: AbortSignal }
): Promise<string> {
  const apiKey = getApiKey();
  const model = getModel();
  const url = `${getGoogleApiUrl()}/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: options?.signal,
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 8192,
        topP: 0.95,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorResponse(response, "Google Gemma API error")
    );
  }

  return extractGoogleText(await response.json());
}

async function callCustomProvider(
  prompt: string,
  options?: { signal?: AbortSignal }
): Promise<string> {
  const apiKey = getApiKey();
  const response = await fetch(getCustomUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal: options?.signal,
    body: JSON.stringify({
      model: getModel(),
      messages: [
        { role: "system", content: SYSTEM_MESSAGE },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      top_p: 0.95,
      max_tokens: 8192,
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

export async function callGemma(
  prompt: string,
  options?: {
    signal?: AbortSignal;
    mockAgentId?: AgentId;
    mockLanguage?: Language;
  }
): Promise<string> {
  if (isMockMode()) {
    if (options?.mockAgentId && options?.mockLanguage) {
      return getMockOutputAsJson(
        options.mockAgentId,
        options.mockLanguage
      );
    }
    await new Promise((r) => setTimeout(r, 400));
    return '{"message":"Mock mode — configure GEMMA_API_KEY for live generation"}';
  }

  const provider = getProvider();
  switch (provider) {
    case "google":
      return callGoogleGenerateContent(prompt, options);
    case "custom":
      return callCustomProvider(prompt, options);
    case "openrouter":
    default:
      return callOpenRouter(prompt, options);
  }
}

export function getLlmConfig() {
  return {
    mockMode: isMockMode(),
    provider: getProvider(),
    model: getModel(),
  };
}
