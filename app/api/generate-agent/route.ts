import {
  markAgentProviderFallback,
  mergeAgentOutput,
} from "@/lib/agents";
import { logAgentTiming } from "@/lib/agent-timing";
import { formatLiveGenerationError } from "@/lib/format-generation-error";
import { getLlmConfig, isMockMode } from "@/lib/gemma";
import { runAgent } from "@/lib/run-agent";
import type {
  AgentId,
  GenerateAgentRequest,
  GenerateAgentResponse,
} from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  let agentId: AgentId | undefined;
  const requestStartedAt = Date.now();
  try {
    const body = (await request.json()) as GenerateAgentRequest;
    agentId = body.agentId as AgentId;
    const { project, draftChapterNumber } = body;

    if (!agentId || !project) {
      return Response.json(
        { error: "agentId and project are required" },
        { status: 400 }
      );
    }

    logAgentTiming(agentId, "request_start", requestStartedAt);

    logAgentTiming(agentId, "before_runAgent", requestStartedAt);
    const result = await runAgent(
      project,
      agentId as AgentId,
      request.signal,
      draftChapterNumber
    );
    logAgentTiming(agentId, "after_runAgent", requestStartedAt);

    const output = result.output;
    const outlineFallbackUsed =
      agentId === "chapter-outline" &&
      typeof output === "object" &&
      output !== null &&
      Boolean((output as Record<string, unknown>).fallbackGenerated);

    logAgentTiming(agentId, "before_mergeAgentOutput", requestStartedAt);
    let updated = mergeAgentOutput(project, agentId as AgentId, output);
    if (result.providerUsed) {
      updated = markAgentProviderFallback(updated, agentId as AgentId, {
        providerUsed: result.providerUsed,
        fallbackProviderUsed: result.providerFallbackUsed,
      });
    }
    logAgentTiming(agentId, "after_mergeAgentOutput", requestStartedAt);

    const response: GenerateAgentResponse = {
      agentId: agentId as AgentId,
      output,
      storyBible: updated.storyBible,
      manuscript: updated.manuscript,
      reports: updated.reports,
      mockMode: isMockMode(),
      fallbackUsed: outlineFallbackUsed || undefined,
      providerUsed: result.providerUsed,
      providerFallbackUsed: result.providerFallbackUsed,
    };

    return Response.json(response);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return Response.json({ error: "Request aborted" }, { status: 499 });
    }
    const raw =
      err instanceof Error ? err.message : "Agent generation failed";
    if (isMockMode()) {
      return Response.json({ error: raw }, { status: 500 });
    }
    const status = getLlmConfig();
    return Response.json(
      {
        error: formatLiveGenerationError(
          raw,
          status.primaryProvider,
          status.model,
          agentId
        ),
      },
      { status: 500 }
    );
  }
}
