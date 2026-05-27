import { countByUnit } from "./text-length";
import { buildDraftingContext } from "./agent-context";
import { getOrderedChapters } from "./chapter-generation-utils";
import type { StoryProject } from "./types";

export const EXPAND_CHAPTER_SCHEMA = `{
  "draft": "expanded full chapter prose",
  "expansionSummary": "short summary of what was expanded"
}`;

export function buildExpandChapterPrompt(
  project: StoryProject,
  chapterNumber: number
): string {
  const chapter = getOrderedChapters(project).find((item) => item.number === chapterNumber);
  if (!chapter) {
    throw new Error(`Chapter ${chapterNumber} not found`);
  }
  const draft = chapter.draft?.trim() ?? "";
  const unit = chapter.lengthPlan?.unit ?? (project.language === "ja" ? "characters" : "words");
  const target = chapter.lengthPlan?.targetLength ?? 3000;
  const current = countByUnit(draft, unit);
  const context = buildDraftingContext(project, chapterNumber);

  return `The following chapter is too short.

Target: ${target} ${unit}
Current: ${current} ${unit}

Expand the chapter to reach the target length.
Do not replace the premise.
Do not summarize.
Add scenes, dialogue, sensory detail, internal conflict, and transitions.
Preserve continuity.

Return only JSON:
${EXPAND_CHAPTER_SCHEMA}

Chapter context:
${JSON.stringify(context)}

Current draft:
${draft}`;
}
