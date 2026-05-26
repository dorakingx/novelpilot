"use client";

import { Badge } from "@/components/ui/badge";
import { getSelectedModelDisplay } from "@/lib/ai-provider-options";
import { isEffectiveDemoMode, normalizeAiModel } from "@/lib/ai-model-utils";
import type { LlmStatus } from "@/lib/llm-config";
import type { AiModelSettings } from "@/lib/types";
import { Cpu, FlaskConical } from "lucide-react";

interface DemoModeBannerProps {
  mockMode: boolean;
  provider?: string;
  model?: string;
  llmStatus?: LlmStatus | null;
  projectAiModel?: AiModelSettings;
}

export function DemoModeBanner({
  mockMode,
  provider = "OpenRouter",
  model,
  llmStatus,
  projectAiModel,
}: DemoModeBannerProps) {
  const ai = normalizeAiModel(projectAiModel);
  const effectiveDemo = isEffectiveDemoMode(projectAiModel, mockMode);
  const selectedLabel = getSelectedModelDisplay(ai);

  const liveLabel =
    ai.providerChoice === "auto"
      ? (llmStatus?.primaryDisplayName ??
        (model ? `${provider} / ${model}` : provider))
      : selectedLabel;
  const fallbackLabel =
    ai.providerChoice === "auto" ? llmStatus?.fallbackDisplayName : null;

  return (
    <div role="status" className="border-b border-white/12 bg-[#111827]">
      <div className="mx-auto max-w-[1600px] px-4 py-2 flex flex-wrap items-center gap-2 text-xs">
        {effectiveDemo ? (
          <>
            <Badge variant="demo" className="gap-1">
              <FlaskConical className="size-3" aria-hidden />
              Demo
            </Badge>
            <span className="text-[#CBD5E1]">
              {ai.providerChoice === "mock" ? (
                <>
                  Selected mode: <span className="text-[#FCD34D]">Demo Mode</span>
                  {" — curated outputs, no live API calls."}
                </>
              ) : (
                <>
                  Curated outputs — add{" "}
                  <code className="text-[#FCD34D] font-mono text-[11px]">
                    GOOGLE_AI_API_KEY
                  </code>{" "}
                  (recommended) or{" "}
                  <code className="text-[#FCD34D] font-mono text-[11px]">
                    OPENROUTER_API_KEY
                  </code>{" "}
                  for live generation, or choose Gemini/Gemma in AI model settings.
                </>
              )}
            </span>
          </>
        ) : (
          <>
            <Badge variant="live" className="gap-1">
              <Cpu className="size-3" aria-hidden />
              Live
            </Badge>
            <span className="text-[#CBD5E1]">
              <span className="text-[#7DD3FC] font-medium">
                Selected: {selectedLabel}
              </span>
              {ai.providerChoice === "auto" && (
                <>
                  {" "}
                  — Server: {liveLabel}
                  {fallbackLabel && (
                    <span className="text-[#94A3B8]">
                      {" "}
                      (fallback: {fallbackLabel})
                    </span>
                  )}
                </>
              )}
              {ai.providerChoice === "openrouter-gemma" && (
                <span className="text-[#94A3B8]">
                  {" "}
                  — OpenRouter may require credits for longer chapters.
                </span>
              )}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
