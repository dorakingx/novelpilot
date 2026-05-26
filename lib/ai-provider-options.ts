import type { AiModelSettings, AiProviderChoice } from "./types";

export const DEFAULT_GOOGLE_MODEL = "gemini-2.5-flash";
export const DEFAULT_OPENROUTER_GEMMA_MODEL = "google/gemma-4-31b-it";

export const AI_PROVIDER_OPTIONS = [
  {
    id: "auto" as const,
    label: "Auto",
    badge: "Recommended",
    description:
      "Use the server default provider and fallback configuration.",
  },
  {
    id: "google-gemini" as const,
    label: "Gemini",
    badge: "Stable",
    description:
      "Use Google AI Studio / Gemini. Recommended for longer stories.",
  },
  {
    id: "openrouter-gemma" as const,
    label: "Gemma",
    badge: "OpenRouter",
    description:
      "Use Gemma through OpenRouter. Good for Gemma-specific experiments.",
  },
  {
    id: "mock" as const,
    label: "Demo Mode",
    badge: "No API key",
    description: "Use curated sample outputs without live API calls.",
  },
] as const;

export function aiModelForChoice(choice: AiProviderChoice): AiModelSettings {
  switch (choice) {
    case "google-gemini":
      return {
        providerChoice: "google-gemini",
        provider: "google",
        model: DEFAULT_GOOGLE_MODEL,
      };
    case "openrouter-gemma":
      return {
        providerChoice: "openrouter-gemma",
        provider: "openrouter",
        model: DEFAULT_OPENROUTER_GEMMA_MODEL,
      };
    case "mock":
      return { providerChoice: "mock" };
    case "auto":
    default:
      return { providerChoice: "auto" };
  }
}

export function getSelectedModelDisplay(ai: AiModelSettings): string {
  switch (ai.providerChoice) {
    case "mock":
      return "Demo Mode";
    case "google-gemini":
      return `Gemini / ${ai.model ?? DEFAULT_GOOGLE_MODEL}`;
    case "openrouter-gemma":
      return `Gemma / ${ai.model ?? DEFAULT_OPENROUTER_GEMMA_MODEL}`;
    case "auto":
    default:
      return "Auto (server default)";
  }
}

export function isGemmaChoice(choice: AiProviderChoice): boolean {
  return choice === "openrouter-gemma";
}

export function isGeminiChoice(choice: AiProviderChoice): boolean {
  return choice === "google-gemini";
}
