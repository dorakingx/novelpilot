import {
  AGENT_FALLBACK_RECOVERY_MESSAGE,
  buildFallbackConcept,
} from "./agent-fallbacks";
import { buildCompactRetryPrompt } from "./agent-retry-prompts";
import type { StoryProject } from "./types";

export const CONCEPT_FALLBACK_RECOVERY_MESSAGE = AGENT_FALLBACK_RECOVERY_MESSAGE;

export { buildFallbackConcept };

export function buildConceptRetryPrompt(project: StoryProject): string {
  return buildCompactRetryPrompt("concept", project);
}
