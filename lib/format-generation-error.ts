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

export function formatLiveGenerationError(
  raw: string,
  provider: string,
  model: string
): string {
  const base = `Live generation failed for provider=${provider}, model=${model}. Check your API key, credits, or model name. Judge Demo still works without an API key.`;
  const detail = sanitizeErrorMessage(raw);
  if (!detail || detail === "[redacted]") return base;
  if (detail.startsWith("Live generation failed")) return detail;
  return `${base} (${detail})`;
}
