"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSelectedModelDisplay } from "@/lib/ai-provider-options";
import { isEffectiveDemoMode, normalizeAiModel } from "@/lib/ai-model-utils";
import type { LlmStatus } from "@/lib/llm-config";
import type { AiModelSettings } from "@/lib/types";
import { Loader2, Radio } from "lucide-react";
import { useCallback, useState } from "react";

type TestProviderResponse = {
  ok: boolean;
  mockMode?: boolean;
  error?: string;
  primaryProvider?: string;
  primaryResult?: { ok: boolean; error?: string };
  fallbackProvider?: string | null;
  fallbackResult?: { ok: boolean; error?: string } | null;
};

interface ProviderStatusPanelProps {
  llmStatus: LlmStatus | null;
  mockMode: boolean;
  projectAiModel?: AiModelSettings;
}

export function ProviderStatusPanel({
  llmStatus,
  mockMode,
  projectAiModel,
}: ProviderStatusPanelProps) {
  const ai = normalizeAiModel(projectAiModel);
  const effectiveDemo = isEffectiveDemoMode(projectAiModel, mockMode);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestProviderResponse | null>(
    null
  );

  const runTest = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/test-provider");
      const data = (await res.json()) as TestProviderResponse;
      setTestResult(data);
    } catch {
      setTestResult({ ok: false, error: "Request failed" });
    } finally {
      setTesting(false);
    }
  }, []);

  if (effectiveDemo || !llmStatus) {
    return (
      <div className="rounded-xl border border-white/12 bg-[#172033] p-3 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          LLM provider
        </p>
        <p className="text-xs text-[#94A3B8]">
          Demo mode — set{" "}
          <code className="text-[#FCD34D] font-mono text-[11px]">
            GOOGLE_AI_API_KEY
          </code>{" "}
          or{" "}
          <code className="text-[#FCD34D] font-mono text-[11px]">
            OPENROUTER_API_KEY
          </code>{" "}
          for live generation.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/12 bg-[#172033] p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Radio className="size-3" aria-hidden />
          LLM provider
        </p>
        <Badge variant="live" className="text-[10px]">
          Live
        </Badge>
      </div>

      <dl className="space-y-1.5 text-xs">
        <div>
          <dt className="text-[#94A3B8]">Selected for this story</dt>
          <dd className="text-[#E2E8F0] font-mono text-[11px] mt-0.5">
            {getSelectedModelDisplay(ai)}
          </dd>
        </div>
        <div>
          <dt className="text-[#94A3B8]">Server primary</dt>
          <dd className="text-[#E2E8F0] font-mono text-[11px] mt-0.5">
            {llmStatus.primaryDisplayName}
          </dd>
        </div>
        {llmStatus.fallbackDisplayName && (
          <div>
            <dt className="text-[#94A3B8]">Fallback</dt>
            <dd className="text-[#E2E8F0] font-mono text-[11px] mt-0.5">
              {llmStatus.fallbackDisplayName}
            </dd>
          </div>
        )}
        {llmStatus.lowCreditMode && (
          <p className="text-[#FCD34D] text-[11px]">
            OpenRouter low-credit mode active
          </p>
        )}
      </dl>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full text-xs"
        disabled={testing}
        onClick={runTest}
      >
        {testing ? (
          <>
            <Loader2 className="size-3 animate-spin mr-1.5" aria-hidden />
            Testing…
          </>
        ) : (
          "Test live provider"
        )}
      </Button>

      {testResult && (
        <div className="text-[11px] space-y-1 border-t border-white/10 pt-2">
          {testResult.mockMode && (
            <p className="text-amber-300">{testResult.error}</p>
          )}
          {testResult.primaryResult && (
            <p
              className={
                testResult.primaryResult.ok ? "text-[#86EFAC]" : "text-destructive"
              }
            >
              Primary ({testResult.primaryProvider}):{" "}
              {testResult.primaryResult.ok
                ? "OK"
                : testResult.primaryResult.error ?? "Failed"}
            </p>
          )}
          {testResult.fallbackProvider && testResult.fallbackResult && (
            <p
              className={
                testResult.fallbackResult.ok ? "text-[#86EFAC]" : "text-destructive"
              }
            >
              Fallback ({testResult.fallbackProvider}):{" "}
              {testResult.fallbackResult.ok
                ? "OK"
                : testResult.fallbackResult.error ?? "Failed"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
