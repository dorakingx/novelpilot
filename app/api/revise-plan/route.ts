import { buildRevisePlanPrompt } from "@/lib/revise-prompts";
import {
  callGemmaWithTimeout,
  parseJsonWithTimeout,
  shouldUseMockForRequest,
} from "@/lib/gemma";
import { normalizeAiModel } from "@/lib/ai-model-utils";
import type { RevisePlanRequest, RevisePlanResponse, StoryBible } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RevisePlanRequest;
    const { instruction, project: rawProject } = body;

    if (!rawProject || !instruction?.trim()) {
      return Response.json(
        { error: "project and instruction are required" },
        { status: 400 }
      );
    }

    const project = {
      ...rawProject,
      aiModel: normalizeAiModel(rawProject.aiModel),
    };

    if (shouldUseMockForRequest(project.aiModel)) {
      const response: RevisePlanResponse = {
        patch: {
          plot: project.storyBible.plot
            ? {
                ...project.storyBible.plot,
                ending: `${project.storyBible.plot.ending} (revised per: ${instruction.slice(0, 80)})`,
              }
            : null,
        },
        explanation: `[Mock] Applied planning note: ${instruction}`,
        structureChanged: false,
      };
      return Response.json(response);
    }

    const prompt = buildRevisePlanPrompt(project, instruction);
    const { text } = await callGemmaWithTimeout(prompt, {
      projectAiModel: project.aiModel,
      agentId: "plot",
      signal: request.signal,
    });

    const parsed = (await parseJsonWithTimeout(text, 8000)) as Record<
      string,
      unknown
    >;

    const response: RevisePlanResponse = {
      patch: (parsed.patch ?? {}) as Partial<StoryBible>,
      explanation: String(parsed.explanation ?? "Plan updated."),
      structureChanged: Boolean(parsed.structureChanged),
    };

    return Response.json(response);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Plan revision failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
