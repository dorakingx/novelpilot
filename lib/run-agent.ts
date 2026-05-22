import { buildAgentContext } from "./agents";
import { callGemma, isMockMode, parseJsonFromLlm } from "./gemma";
import { getMockOutput } from "./mock-outputs";
import { buildAgentPrompt } from "./prompts";
import type { AgentId, StoryProject } from "./types";

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
  } catch {
    raw = await callGemma(
      `${prompt}\n\nYour previous response was not valid JSON. Return ONLY valid JSON.`,
      { signal }
    );
    return parseJsonFromLlm(raw);
  }
}
