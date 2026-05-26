import { buildReviseChapterPrompt } from "@/lib/revise-prompts";
import {
  callGemmaWithTimeout,
  parseJsonWithTimeout,
  shouldUseMockForRequest,
} from "@/lib/gemma";
import { getAllChapters } from "@/lib/structure-utils";
import { normalizeAiModel } from "@/lib/ai-model-utils";
import type { ReviseChapterRequest, ReviseChapterResponse } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReviseChapterRequest;
    const { instruction, chapterNumber, project: rawProject } = body;

    if (!rawProject || !chapterNumber || !instruction?.trim()) {
      return Response.json(
        { error: "project, chapterNumber, and instruction are required" },
        { status: 400 }
      );
    }

    const project = {
      ...rawProject,
      aiModel: normalizeAiModel(rawProject.aiModel),
    };

    const ch = getAllChapters(project).find((c) => c.number === chapterNumber);
    const existingDraft = ch?.draft ?? "";

    if (shouldUseMockForRequest(project.aiModel)) {
      const response: ReviseChapterResponse = {
        chapterNumber,
        revisedDraft: `${existingDraft}\n\n[Mock revision: ${instruction}]`,
        revisionSummary: `[Mock] ${instruction}`,
      };
      return Response.json(response);
    }

    const prompt = buildReviseChapterPrompt(project, chapterNumber, instruction);
    const { text } = await callGemmaWithTimeout(prompt, {
      projectAiModel: project.aiModel,
      agentId: "drafting",
      draftChapterNumber: chapterNumber,
      signal: request.signal,
    });

    const parsed = (await parseJsonWithTimeout(text, 8000)) as Record<
      string,
      unknown
    >;

    const response: ReviseChapterResponse = {
      chapterNumber,
      revisedDraft: String(parsed.revisedDraft ?? existingDraft),
      revisionSummary: String(parsed.revisionSummary ?? "Chapter revised."),
    };

    return Response.json(response);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Chapter revision failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
