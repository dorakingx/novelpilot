const API_KEY_PATTERN = /\b(sk-[a-zA-Z0-9_-]{8,}|Bearer\s+\S+)/gi;
const LONG_HEX_PATTERN = /\b[a-f0-9]{32,}\b/gi;

export function sanitizeErrorMessage(raw: string): string {
  return raw
    .replace(API_KEY_PATTERN, "[redacted]")
    .replace(LONG_HEX_PATTERN, "[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

const CHAPTER_OUTLINE_ERROR_PATTERNS = [
  /failed to parse JSON/i,
  /malformed large response/i,
  /too much text/i,
  /timed out after/i,
  /json parsing timed out/i,
  /could not be applied/i,
  /before vercel timeout/i,
];

const CHAPTER_OUTLINE_TIMEOUT_MESSAGE =
  "Chapter Architect timed out while building the story structure. NovelPilot can use a safe fallback structure so you can continue.";

export function isChapterOutlineTimeoutError(raw: string): boolean {
  const lower = raw.toLowerCase();
  return (
    lower.includes("timed out") &&
    (lower.includes("chapter-outline") ||
      lower.includes("chapter architect") ||
      lower.includes("before vercel timeout"))
  );
}

export function isChapterOutlineGenerationError(raw: string): boolean {
  return CHAPTER_OUTLINE_ERROR_PATTERNS.some((re) => re.test(raw));
}

const OPENROUTER_402_PROMPT_TOKENS_MESSAGE =
  "OpenRouter rejected the request because the input prompt/context is too large for your current credit/model limit. NovelPilot will compact agent context. Try shortening your prompt, reducing chapter count, or adding credits.";

const OPENROUTER_402_MAX_TOKENS_MESSAGE =
  "OpenRouter rejected the request because max_tokens is too high for your current credits. Try reducing chapter length, setting AI_MAX_TOKENS_CAP or GEMMA_MAX_TOKENS_CAP to 1200 or 800, using a smaller model, adding credits, or configuring Google AI Studio as fallback.";

const GOOGLE_429_MESSAGE =
  "Google AI Studio / Gemini API rate limit exceeded. Wait and try again, reduce chapter length, or use OpenRouter fallback if configured.";

export function isOpenRouter402PromptTokensError(raw: string): boolean {
  const lower = raw.toLowerCase();
  return (
    lower.includes("prompt tokens limit exceeded") ||
    (lower.includes("402") &&
      lower.includes("prompt tokens") &&
      !lower.includes("max_tokens"))
  );
}

export function isOpenRouter402MaxTokensError(raw: string): boolean {
  if (isOpenRouter402PromptTokensError(raw)) return false;
  const lower = raw.toLowerCase();
  return (
    lower.includes("402") &&
    (lower.includes("fewer max_tokens") ||
      lower.includes("requires more credits") ||
      lower.includes("max_tokens"))
  );
}

export function formatChapterOutlineError(
  raw: string,
  provider: string,
  model: string
): string {
  const headline =
    "Chapter Architect failed to return valid structure JSON. This often happens when the requested structure is too large or the model returned prose instead of JSON. Try reducing chapter count or use the fallback structure.";
  const detail = sanitizeErrorMessage(raw);
  const tech = `provider=${provider}, model=${model}`;
  if (!detail || detail === "[redacted]") {
    return `${headline} (${tech})`;
  }
  return `${headline} (${tech}: ${detail})`;
}

export function isGoogle429Error(raw: string): boolean {
  const lower = raw.toLowerCase();
  return (
    lower.includes("429") ||
    lower.includes("rate limit exceeded") ||
    lower.includes("resource exhausted")
  );
}

export function formatGoogleRateLimitError(): string {
  return GOOGLE_429_MESSAGE;
}

export function formatLiveGenerationError(
  raw: string,
  provider: string,
  model: string,
  agentId?: string
): string {
  if (isGoogle429Error(raw) && provider === "google") {
    return GOOGLE_429_MESSAGE;
  }
  if (isOpenRouter402PromptTokensError(raw)) {
    return OPENROUTER_402_PROMPT_TOKENS_MESSAGE;
  }
  if (isOpenRouter402MaxTokensError(raw)) {
    return OPENROUTER_402_MAX_TOKENS_MESSAGE;
  }
  if (
    agentId === "chapter-outline" &&
    isChapterOutlineTimeoutError(raw)
  ) {
    return CHAPTER_OUTLINE_TIMEOUT_MESSAGE;
  }
  if (agentId === "chapter-outline" && isChapterOutlineGenerationError(raw)) {
    return formatChapterOutlineError(raw, provider, model);
  }
  const base = `Live generation failed for provider=${provider}, model=${model}. Check your API key, credits, or model name. Judge Demo still works without an API key.`;
  const detail = sanitizeErrorMessage(raw);
  if (!detail || detail === "[redacted]") return base;
  if (detail.startsWith("Live generation failed")) return detail;
  if (detail.startsWith("Chapter Architect failed")) return detail;
  return `${base} (${detail})`;
}
