import { getLlmStatus, getProviderConfig } from "@/lib/llm-config";
import { callGemma, isMockMode } from "@/lib/gemma";
import type { LlmProvider } from "@/lib/llm-config";

const TEST_PROMPT =
  'Return only this JSON: {"ok":true}\n\nRespond with ONLY valid JSON.';

async function testProvider(provider: LlmProvider): Promise<{
  ok: boolean;
  error?: string;
}> {
  const config = getProviderConfig(provider);
  if (!config.configured) {
    return { ok: false, error: "Not configured" };
  }
  try {
    const result = await callGemma(TEST_PROMPT, {
      maxTokens: 128,
      provider,
    });
    const parsed = JSON.parse(result.text) as { ok?: boolean };
    return { ok: parsed.ok === true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message.slice(0, 280) };
  }
}

export async function GET() {
  if (isMockMode()) {
    return Response.json({
      ok: false,
      mockMode: true,
      error: "No API keys configured",
    });
  }

  const status = getLlmStatus();
  const primaryResult = await testProvider(status.primaryProvider);
  const fallbackResult = status.fallbackProvider
    ? await testProvider(status.fallbackProvider)
    : null;

  return Response.json({
    ok: primaryResult.ok || Boolean(fallbackResult?.ok),
    mockMode: false,
    primaryProvider: status.primaryProvider,
    primaryResult,
    fallbackProvider: status.fallbackProvider,
    fallbackResult,
  });
}
