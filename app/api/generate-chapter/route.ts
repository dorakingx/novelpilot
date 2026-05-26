import { mergeChapterDraftOutput } from "@/lib/agents";
import { formatLiveGenerationError } from "@/lib/format-generation-error";
import { getLlmConfig, shouldUseMockForRequest } from "@/lib/gemma";
import { normalizeAiModel } from "@/lib/ai-model-utils";
import { runAgent } from "@/lib/run-agent";
import type { GenerateChapterRequest, GenerateChapterResponse } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateChapterRequest;
    const { chapterNumber } = body;
    let { project } = body;

    if (!project || !chapterNumber) {
      return Response.json(
        { error: "project and chapterNumber are required" },
        { status: 400 }
      );
    }

    project = {
      ...project,
      aiModel: normalizeAiModel(project.aiModel),
    };

    const result = await runAgent(
      project,
      "drafting",
      request.signal,
      chapterNumber
    );

    const o = result.output as Record<string, unknown>;
    const response: GenerateChapterResponse = {
      chapterNumber,
      title: String(o.title ?? ""),
      draft: String(o.draft ?? ""),
      chapterSummary: String(o.chapterSummary ?? ""),
      continuityNotes: Array.isArray(o.continuityNotes)
        ? o.continuityNotes.map(String)
        : [],
    };

    const merged = mergeChapterDraftOutput(project, result.output);

    return Response.json({
      ...response,
      project: merged,
      mockMode: shouldUseMockForRequest(project.aiModel),
    });
  } catch (err) {
    const config = getLlmConfig();
    const message =
      err instanceof Error
        ? formatLiveGenerationError(
            err.message,
            config.primaryDisplayName ?? config.primaryProvider,
            config.model,
            "drafting"
          )
        : "Chapter generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
