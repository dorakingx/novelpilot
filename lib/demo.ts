import type { ProjectSettings } from "./types";

export const JUDGE_DEMO_PROMPT =
  "Write a melancholic sci-fi mystery set in modern Tokyo. A graduate student who lost his memory investigates a disappearance in a quantum computing lab. The story should involve identity, artificial memory, and a hidden experiment.";

export const JUDGE_DEMO_SETTINGS: ProjectSettings = {
  userPrompt: JUDGE_DEMO_PROMPT,
  language: "en",
  genre: "sci-fi",
  tone: "melancholic",
  targetLength: "short-story",
};
