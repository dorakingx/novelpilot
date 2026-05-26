import type { AiModelSettings } from "./types";

export const DEFAULT_AI_MODEL: AiModelSettings = { providerChoice: "auto" };

export function normalizeAiModel(ai?: AiModelSettings): AiModelSettings {
  return ai?.providerChoice ? ai : DEFAULT_AI_MODEL;
}

/** User-selected Demo, or Auto with no server API keys. */
export function isEffectiveDemoMode(
  ai: AiModelSettings | undefined,
  serverMockMode: boolean
): boolean {
  const normalized = normalizeAiModel(ai);
  if (normalized.providerChoice === "mock") return true;
  if (normalized.providerChoice === "auto" && serverMockMode) return true;
  return false;
}
