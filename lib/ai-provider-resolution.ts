import {
  DEFAULT_GOOGLE_MODEL,
  DEFAULT_OPENROUTER_GEMMA_MODEL,
} from "./ai-provider-options";
import { normalizeAiModel } from "./ai-model-utils";
import {
  getFallbackProvider,
  getPrimaryProvider,
  getProviderConfig,
  hasAnyLiveProviderKey,
  isProviderConfigured,
  type LlmProvider,
} from "./llm-config";
import type { AiModelSettings } from "./types";

export type ResolvedRequestProviders = {
  primary: LlmProvider;
  fallback: LlmProvider | null;
  model: string;
};

export function shouldUseMockForRequest(ai?: AiModelSettings): boolean {
  const normalized = normalizeAiModel(ai);
  if (normalized.providerChoice === "mock") return true;
  if (normalized.providerChoice === "auto" && !hasAnyLiveProviderKey()) {
    return true;
  }
  return false;
}

export function assertProviderConfigured(ai?: AiModelSettings): void {
  const normalized = normalizeAiModel(ai);
  if (shouldUseMockForRequest(normalized)) return;

  switch (normalized.providerChoice) {
    case "google-gemini":
      if (!isProviderConfigured("google")) {
        throw new Error(
          "Gemini is selected, but GOOGLE_AI_API_KEY is not configured on the server. Choose Demo Mode or configure Google AI Studio API key."
        );
      }
      return;
    case "openrouter-gemma":
      if (!isProviderConfigured("openrouter")) {
        throw new Error(
          "Gemma is selected, but OPENROUTER_API_KEY is not configured on the server. Choose Demo Mode or configure OpenRouter."
        );
      }
      return;
    case "auto":
      if (!hasAnyLiveProviderKey()) {
        throw new Error(
          "No API keys are configured on the server. Choose Demo Mode or add GOOGLE_AI_API_KEY / OPENROUTER_API_KEY."
        );
      }
      return;
    default:
      return;
  }
}

function resolveModelForProvider(
  provider: LlmProvider,
  ai: AiModelSettings
): string {
  if (ai.model) return ai.model;
  return getProviderConfig(provider).model;
}

export function resolveRequestProviders(
  ai?: AiModelSettings
): ResolvedRequestProviders {
  const normalized = normalizeAiModel(ai);

  switch (normalized.providerChoice) {
    case "google-gemini": {
      const primary: LlmProvider = "google";
      return {
        primary,
        fallback: null,
        model:
          normalized.model ??
          getProviderConfig(primary).model ??
          DEFAULT_GOOGLE_MODEL,
      };
    }
    case "openrouter-gemma": {
      const primary: LlmProvider = "openrouter";
      return {
        primary,
        fallback: null,
        model:
          normalized.model ??
          getProviderConfig(primary).model ??
          DEFAULT_OPENROUTER_GEMMA_MODEL,
      };
    }
    case "auto":
    default: {
      const primary = getPrimaryProvider();
      const fallback = getFallbackProvider(primary);
      return {
        primary,
        fallback,
        model: resolveModelForProvider(primary, normalized),
      };
    }
  }
}
