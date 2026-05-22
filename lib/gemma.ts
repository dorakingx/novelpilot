import { getMockOutputAsJson } from "./mock-outputs";
import type { AgentId, Language } from "./types";

export function isMockMode(): boolean {
  return !process.env.GEMMA_API_KEY?.trim();
}

function getApiUrl(): string {
  const base =
    process.env.GEMMA_API_URL?.trim() ||
    "https://generativelanguage.googleapis.com/v1beta/models";
  return base.replace(/\/$/, "");
}

function getModel(): string {
  return process.env.GEMMA_MODEL?.trim() || "gemma-4-31b-it";
}

function extractTextFromResponse(data: unknown): string {
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
    throw new Error("Empty response from Gemma API");
  }
  return text;
}

export function parseJsonFromLlm(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(jsonStr);
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

  const apiKey = process.env.GEMMA_API_KEY!.trim();
  const model = getModel();
  const url = `${getApiUrl()}/${model}:generateContent?key=${apiKey}`;

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
    const errText = await response.text();
    throw new Error(`Gemma API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return extractTextFromResponse(data);
}
