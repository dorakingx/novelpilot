import {
  buildAgentContextForId,
  buildDraftingContext,
} from "./agent-context";
import { getAllChapters } from "./structure-utils";
import type { StoryProject } from "./types";

export function buildRevisePlanPrompt(
  project: StoryProject,
  instruction: string
): string {
  const context = buildAgentContextForId(project, "plot");
  return `You are revising a novel plan based on user feedback. Return ONLY valid JSON.

User instruction: ${instruction}

Current story context (compact):
${JSON.stringify(context, null, 0)}

Return JSON:
{
  "patch": {
    "concept": { "logline", "coreTheme", "centralConflict", "emotionalPromise", "uniqueHook" } or omit,
    "characters": [ ... ] or omit,
    "worldbuilding": { ... } or omit,
    "plot": { "beginning", "middle", "climax", "ending", "twists", "foreshadowingPlan" } or omit,
    "foreshadowingTracker": [ ... ] or omit,
    "styleGuide": { ... } or omit
  },
  "explanation": "brief summary of changes",
  "structureChanged": false
}

Only include keys in patch that should change. Do not include chapters/parts unless structure must change.`;
}

export function buildReviseChapterPrompt(
  project: StoryProject,
  chapterNumber: number,
  instruction: string
): string {
  const ch = getAllChapters(project).find((c) => c.number === chapterNumber);
  const context = buildDraftingContext(project, chapterNumber);
  const draft = ch?.draft ?? "";

  return `Revise this chapter draft based on user feedback. Return ONLY valid JSON.

User instruction: ${instruction}

Chapter ${chapterNumber} outline and context:
${JSON.stringify(context, null, 0)}

Current draft:
${draft.slice(0, 12000)}

Return JSON:
{
  "chapterNumber": ${chapterNumber},
  "revisedDraft": "full revised chapter prose",
  "revisionSummary": "what changed"
}`;
}
