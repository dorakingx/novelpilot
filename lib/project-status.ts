import type { StoryProject } from "./types";

export type ProjectStatus = "Ready" | "Running" | "Completed" | "Failed";

export function getProjectStatus(
  project: StoryProject | null,
  isRunning: boolean
): ProjectStatus {
  if (!project) return "Ready";
  if (isRunning) return "Running";
  if (project.agents.some((a) => a.status === "failed")) return "Failed";
  if (project.agents.every((a) => a.status === "completed")) return "Completed";
  return "Ready";
}
