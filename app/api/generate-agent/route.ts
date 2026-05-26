import { mergeAgentOutput } from "@/lib/agents";
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

    const output = await runAgent(
      project,
      agentId as AgentId,
      request.signal,
      draftChapterNumber
    );
    const updated = mergeAgentOutput(project, agentId as AgentId, output);

    const response: GenerateAgentResponse = {
      agentId: agentId as AgentId,
      output,
      storyBible: updated.storyBible,
      manuscript: updated.manuscript,
      reports: updated.reports,
      mockMode: isMockMode(),
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
    const { provider, model } = getLlmConfig();
    return Response.json(
      {
        error: formatLiveGenerationError(
          raw,
          provider,
          model,
          agentId
        ),
      },
      { status: 500 }
    );
  }
}
