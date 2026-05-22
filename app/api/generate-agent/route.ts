import { mergeAgentOutput } from "@/lib/agents";
import { isMockMode } from "@/lib/gemma";
import { runAgent } from "@/lib/run-agent";
import type {
  AgentId,
  GenerateAgentRequest,
  GenerateAgentResponse,
} from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateAgentRequest;
    const { agentId, project } = body;

    if (!agentId || !project) {
      return Response.json(
        { error: "agentId and project are required" },
        { status: 400 }
      );
    }

    const output = await runAgent(project, agentId as AgentId, request.signal);
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
    const message =
      err instanceof Error ? err.message : "Agent generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
