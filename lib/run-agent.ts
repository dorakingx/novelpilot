import { buildAgentContext } from "./agents";
import {
  callGemma,
  getModel,
  getProvider,
  isMockMode,
  parseJsonFromLlm,
} from "./gemma";
import { getMockOutput } from "./mock-outputs";
import { buildAgentPrompt } from "./prompts";
import type { AgentId, StoryProject } from "./types";

const JSON_RETRY_INSTRUCTION = `Your previous response was not valid JSON.
Return ONLY valid JSON.
Do not include markdown.
Do not include explanations.
Do not include comments.
Use the exact schema from the prompt.`;

function previewRaw(raw: string, max = 200): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, max);
}

function throwParseError(agentId: AgentId, raw: string, cause?: unknown): never {
  const provider = getProvider();
  const model = getModel();
  const preview = previewRaw(raw);
  const hint =
    cause instanceof Error ? cause.message : "Invalid JSON structure";
  throw new Error(
    `Agent "${agentId}" failed to parse JSON (provider: ${provider}, model: ${model}). ${hint}. Response preview: "${preview}${raw.length > 200 ? "…" : ""}"`
  );
}

export async function runAgent(
  project: StoryProject,
  agentId: AgentId,
  signal?: AbortSignal
): Promise<unknown> {
  const context = buildAgentContext(project, agentId);
  const prompt = buildAgentPrompt(agentId, context);

  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 600));
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    return getMockOutput(agentId, project.language);
  }

  let raw = await callGemma(prompt, {
    signal,
    mockAgentId: agentId,
    mockLanguage: project.language,
  });

  try {
    return parseJsonFromLlm(raw);
  } catch (firstErr) {
    try {
      raw = await callGemma(`${prompt}\n\n${JSON_RETRY_INSTRUCTION}`, {
        signal,
      });
      return parseJsonFromLlm(raw);
    } catch {
      throwParseError(agentId, raw, firstErr);
    }
  }
}
