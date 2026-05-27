import { buildExpandChapterPrompt } from "@/lib/expand-chapter-prompt";
import {
  callGemmaWithTimeout,
  parseJsonWithTimeout,
  shouldUseMockForRequest,
} from "@/lib/gemma";
import { getOrderedChapters } from "@/lib/chapter-generation-utils";
import { normalizeAiModel } from "@/lib/ai-model-utils";
import type { ExpandChapterRequest, ExpandChapterResponse } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExpandChapterRequest;
    const { chapterNumber, project: rawProject } = body;

    if (!rawProject || !chapterNumber) {
      return Response.json(
        { error: "project and chapterNumber are required" },
        { status: 400 }
      );
    }

    const project = {
      ...rawProject,
      aiModel: normalizeAiModel(rawProject.aiModel),
    };

    const chapter = getOrderedChapters(project).find(
      (item) => item.number === chapterNumber
    );
    const existingDraft = chapter?.draft?.trim() ?? "";
    if (!existingDraft) {
      return Response.json(
        { error: `Chapter ${chapterNumber} has no draft to expand` },
        { status: 400 }
      );
    }

    if (shouldUseMockForRequest(project.aiModel)) {
      const response: ExpandChapterResponse = {
        chapterNumber,
        draft: `${existingDraft}\n\n[Mock expansion pass for chapter ${chapterNumber}]`,
        expansionSummary: "[Mock] Expanded chapter length.",
        mockMode: true,
      };
      return Response.json(response);
    }

    const prompt = buildExpandChapterPrompt(project, chapterNumber);
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

    const response: ExpandChapterResponse = {
      chapterNumber,
      draft: String(parsed.draft ?? existingDraft),
      expansionSummary: String(parsed.expansionSummary ?? "Expanded chapter."),
    };
    return Response.json(response);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Chapter expansion failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
