import { buildFallbackChapterOutline } from "./chapter-outline-fallback";
import { mergeAgentOutput, markAgentFallbackUsed } from "./agents";
import type { StoryProject } from "./types";

export interface PipelineRunOptions {
  skipStructurePause?: boolean;
}

export function shouldPauseForStructureApproval(
  project: StoryProject,
  options?: PipelineRunOptions
): boolean {
  if (options?.skipStructurePause) return false;
  if (project.requiresStructureApproval === false) return false;
  if (project.structureApproved) return false;
  return true;
}

export function pauseForStructureApproval(
  project: StoryProject
): StoryProject {
  return {
    ...project,
    awaitingStructureApproval: true,
    updatedAt: new Date().toISOString(),
  };
}

export function applyFallbackChapterOutlineToProject(
  project: StoryProject
): StoryProject {
  const output = buildFallbackChapterOutline(project);
  let updated = mergeAgentOutput(project, "chapter-outline", output);
  updated = markAgentFallbackUsed(updated, "chapter-outline");
  return {
    ...updated,
    structureFallbackUsed: true,
  };
}

export function canContinuePipeline(project: StoryProject): boolean {
  if (project.awaitingStructureApproval) return false;
  const hasCompleted = project.agents.some((a) => a.status === "completed");
  const hasIncomplete = project.agents.some((a) => a.status !== "completed");
  return hasCompleted && hasIncomplete;
}
