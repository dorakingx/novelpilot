import { DEFAULT_GEMMA_MODEL } from "./gemma-model";

export type LlmProvider = "openrouter" | "google" | "custom";

export type ProviderConfig = {
  provider: LlmProvider;
  apiKey: string;
  apiUrl: string;
  model: string;
  configured: boolean;
};

const DEFAULT_OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_GOOGLE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_GOOGLE_MODEL = "gemini-2.5-flash";

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function legacyGemmaKey(): string {
  return env("GEMMA_API_KEY");
}

export function getOpenRouterApiKey(): string {
  return env("OPENROUTER_API_KEY") || legacyGemmaKey();
}

export function getGoogleApiKey(): string {
  return env("GOOGLE_AI_API_KEY") || legacyGemmaKey();
}

export function getCustomApiKey(): string {
  return legacyGemmaKey();
}

function parseProvider(raw: string): LlmProvider | null {
  const v = raw.toLowerCase();
  if (v === "google") return "google";
  if (v === "openrouter") return "openrouter";
  if (v === "custom") return "custom";
  return null;
}

export function isProviderConfigured(provider: LlmProvider): boolean {
  const config = getProviderConfig(provider);
  return config.configured;
}

export function hasAnyLiveProviderKey(): boolean {
  return (
    Boolean(getGoogleApiKey()) ||
    Boolean(getOpenRouterApiKey()) ||
    Boolean(getCustomApiKey())
  );
}

export function getPrimaryProvider(): LlmProvider {
  const explicit =
    parseProvider(env("AI_PROVIDER")) ?? parseProvider(env("GEMMA_PROVIDER"));

  if (explicit) {
    if (explicit === "custom" && getCustomApiKey() && env("GEMMA_API_URL")) {
      return "custom";
    }
    if (explicit === "google" && getGoogleApiKey()) return "google";
    if (explicit === "openrouter" && getOpenRouterApiKey()) return "openrouter";
    if (isProviderConfigured(explicit)) return explicit;
  }

  if (getGoogleApiKey()) return "google";
  if (getOpenRouterApiKey()) return "openrouter";
  return "openrouter";
}

export function getFallbackProvider(
  primary?: LlmProvider
): LlmProvider | null {
  const p = primary ?? getPrimaryProvider();
  const explicit = parseProvider(env("AI_FALLBACK_PROVIDER"));
  if (explicit && explicit !== p && isProviderConfigured(explicit)) {
    return explicit;
  }

  if (p === "custom") return null;

  const other: LlmProvider = p === "google" ? "openrouter" : "google";
  if (isProviderConfigured(other)) return other;
  return null;
}

export function getProviderConfig(provider: LlmProvider): ProviderConfig {
  switch (provider) {
    case "google": {
      const apiKey = getGoogleApiKey();
      const model = env("GOOGLE_AI_MODEL") || env("GEMMA_MODEL") || DEFAULT_GOOGLE_MODEL;
      const base = (
        env("GOOGLE_AI_API_URL") ||
        (env("GEMMA_PROVIDER") === "google" ? env("GEMMA_API_URL") : "") ||
        DEFAULT_GOOGLE_URL
      ).replace(/\/$/, "");
      return {
        provider,
        apiKey,
        apiUrl: base,
        model,
        configured: Boolean(apiKey),
      };
    }
    case "custom": {
      const apiKey = getCustomApiKey();
      const url = env("GEMMA_API_URL");
      const model = env("GEMMA_MODEL") || DEFAULT_GEMMA_MODEL;
      return {
        provider,
        apiKey,
        apiUrl: url,
        model,
        configured: Boolean(apiKey && url),
      };
    }
    case "openrouter":
    default: {
      const apiKey = getOpenRouterApiKey();
      const model =
        env("OPENROUTER_MODEL") || env("GEMMA_MODEL") || DEFAULT_GEMMA_MODEL;
      const url =
        env("OPENROUTER_API_URL") ||
        (env("GEMMA_PROVIDER") === "openrouter" ? env("GEMMA_API_URL") : "") ||
        DEFAULT_OPENROUTER_URL;
      return {
        provider: "openrouter",
        apiKey,
        apiUrl: url,
        model,
        configured: Boolean(apiKey),
      };
    }
  }
}

export function getProviderDisplayName(
  provider: LlmProvider,
  model?: string
): string {
  switch (provider) {
    case "google":
      return model
        ? `Google AI Studio / ${model}`
        : "Google AI Studio / Gemini";
    case "custom":
      return model ? `Custom / ${model}` : "Custom provider";
    case "openrouter":
    default:
      return model ? `OpenRouter / ${model}` : "OpenRouter";
  }
}

export function getMaxTokensCap(): number | undefined {
  const raw = env("AI_MAX_TOKENS_CAP") || env("GEMMA_MAX_TOKENS_CAP");
  const cap = Number(raw);
  if (!Number.isFinite(cap) || cap <= 0) return undefined;
  return cap;
}

export function isLowCreditMode(): boolean {
  return env("OPENROUTER_LOW_CREDIT_MODE").toLowerCase() === "true";
}

export type LlmStatus = {
  mockMode: boolean;
  primaryProvider: LlmProvider;
  fallbackProvider: LlmProvider | null;
  activeProvider: LlmProvider;
  model: string;
  fallbackModel: string | null;
  primaryDisplayName: string;
  fallbackDisplayName: string | null;
  googleConfigured: boolean;
  openRouterConfigured: boolean;
  customConfigured: boolean;
  maxTokensCap?: number;
  lowCreditMode: boolean;
  /** @deprecated use primaryProvider */
  provider: LlmProvider;
};

export function getLlmStatus(): LlmStatus {
  const primaryProvider = getPrimaryProvider();
  const fallbackProvider = getFallbackProvider(primaryProvider);
  const primaryConfig = getProviderConfig(primaryProvider);
  const fallbackConfig = fallbackProvider
    ? getProviderConfig(fallbackProvider)
    : null;

  return {
    mockMode: !hasAnyLiveProviderKey(),
    primaryProvider,
    fallbackProvider,
    activeProvider: primaryProvider,
    model: primaryConfig.model,
    fallbackModel: fallbackConfig?.model ?? null,
    primaryDisplayName: getProviderDisplayName(
      primaryProvider,
      primaryConfig.model
    ),
    fallbackDisplayName: fallbackProvider
      ? getProviderDisplayName(
          fallbackProvider,
          fallbackConfig?.model
        )
      : null,
    googleConfigured: isProviderConfigured("google"),
    openRouterConfigured: isProviderConfigured("openrouter"),
    customConfigured: isProviderConfigured("custom"),
    maxTokensCap: getMaxTokensCap(),
    lowCreditMode: isLowCreditMode(),
    provider: primaryProvider,
  };
}
