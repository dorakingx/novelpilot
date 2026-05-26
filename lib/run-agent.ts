import { buildAgentContext } from "./agents";
import {
  callGemmaWithTimeout,
  getModel,
  getProvider,
  isMockMode,
  parseJsonFromLlm,
} from "./gemma";
import { normalizeChapterOutlineOutput } from "./normalize-chapter-outline";
import { getMockOutput } from "./mock-outputs";
import { getAllChapters } from "./structure-utils";
import { shouldUseSequentialDrafting } from "./structure-utils";
import { buildAgentPrompt, buildChapterDraftPrompt } from "./prompts";
import type { AgentId, StoryProject } from "./types";

export const AGENT_TIMEOUT_MS = 60_000;
const MAX_RAW_RESPONSE_CHARS = 200_000;
const MAX_RETRY_RAW_CHARS = 50_000;

const JSON_RETRY_INSTRUCTION = `Your previous response was not valid JSON.
Return ONLY valid JSON.
Do not include markdown.
Do not include explanations.
Do not include comments.
Use the exact schema from the prompt.`;

function previewRaw(raw: string, max = 200): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, max);
}

function logParseError(
  agentId: AgentId,
  raw: string,
  cause: unknown
): void {
  console.error("[LLM_PARSE_ERROR]", {
    agentId,
    provider: getProvider(),
    model: getModel(),
    rawLength: raw.length,
    rawPreview: raw.slice(0, 500),
    error: cause instanceof Error ? cause.message : String(cause),
  });
}

function guardRawSize(agentId: AgentId, raw: string): void {
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

function throwParseError(agentId: AgentId, raw: string, cause?: unknown): never {
  logParseError(agentId, raw, cause);
  const provider = getProvider();
  const model = getModel();
  const preview = previewRaw(raw);
  const hint =
    cause instanceof Error ? cause.message : "Invalid JSON structure";
  throw new Error(
    `Agent "${agentId}" failed to parse JSON (provider: ${provider}, model: ${model}). ${hint}. Response preview: "${preview}${raw.length > 200 ? "…" : ""}"`
  );
}

function throwTimeoutError(agentId: AgentId): never {
  throw new Error(
    `Agent "${agentId}" timed out after ${AGENT_TIMEOUT_MS / 1000} seconds. Try reducing chapter count or chapter length.`
  );
}

async function callLiveGemma(
  prompt: string,
  agentId: AgentId,
  signal: AbortSignal | undefined,
  language: StoryProject["language"],
  draftChapterNumber?: number
): Promise<string> {
  try {
    return await callGemmaWithTimeout(prompt, {
      signal,
      timeoutMs: AGENT_TIMEOUT_MS,
      mockAgentId: agentId,
      mockLanguage: language,
      agentId,
      draftChapterNumber,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("timed out") || msg.includes("LLM request timed out")) {
      throwTimeoutError(agentId);
    }
    throw err;
  }
}

function parseAgentJson(
  agentId: AgentId,
  raw: string,
  project: StoryProject
): unknown {
  guardRawSize(agentId, raw);
  try {
    const parsed = parseJsonFromLlm(raw);
    if (agentId === "chapter-outline") {
      return normalizeChapterOutlineOutput(parsed, project);
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
  signal?: AbortSignal,
  draftChapterNumber?: number
): Promise<unknown> {
  let raw = await callLiveGemma(
    prompt,
    agentId,
    signal,
    project.language,
    draftChapterNumber
  );

  try {
    return parseAgentJson(agentId, raw, project);
  } catch (firstErr) {
    if (raw.length > MAX_RETRY_RAW_CHARS) {
      logParseError(agentId, raw, firstErr);
      throw new Error(largeMalformedMessage(agentId));
    }

    try {
      raw = await callLiveGemma(
        `${prompt}\n\n${JSON_RETRY_INSTRUCTION}`,
        agentId,
        signal,
        project.language,
        draftChapterNumber
      );
      return parseAgentJson(agentId, raw, project);
    } catch (retryErr) {
      throwParseError(agentId, raw, retryErr);
    }
  }
}

export async function runAgent(
  project: StoryProject,
  agentId: AgentId,
  signal?: AbortSignal,
  draftChapterNumber?: number
): Promise<unknown> {
  const context = buildAgentContext(project, agentId);
  const prompt =
    agentId === "drafting" && draftChapterNumber != null
      ? buildChapterDraftPrompt(project, draftChapterNumber)
      : buildAgentPrompt(agentId, context);

  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 600));
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    return getMockOutput(agentId, project.language, {
      project,
      draftChapterNumber,
    });
  }

  return callAndParseAgentJson(agentId, prompt, project, signal, draftChapterNumber);
}

export function shouldRunSequentialDraft(project: StoryProject): boolean {
  return shouldUseSequentialDrafting(project.structure);
}

export function getDraftChapterNumbers(project: StoryProject): number[] {
  return getAllChapters(project).map((c) => c.number);
}
