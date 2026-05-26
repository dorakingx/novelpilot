"use client";

import { Badge } from "@/components/ui/badge";
import type { LlmStatus } from "@/lib/llm-config";
import { Cpu, FlaskConical } from "lucide-react";

interface DemoModeBannerProps {
  mockMode: boolean;
  provider?: string;
  model?: string;
  llmStatus?: LlmStatus | null;
}

export function DemoModeBanner({
  mockMode,
  provider = "OpenRouter",
  model,
  llmStatus,
}: DemoModeBannerProps) {
  const liveLabel =
    llmStatus?.primaryDisplayName ??
    (model ? `${provider} / ${model}` : provider);
  const fallbackLabel = llmStatus?.fallbackDisplayName;

  return (
    <div
      role="status"
      className="border-b border-white/12 bg-[#111827]"
    >
      <div className="mx-auto max-w-[1600px] px-4 py-2 flex flex-wrap items-center gap-2 text-xs">
        {mockMode ? (
          <>
            <Badge variant="demo" className="gap-1">
              <FlaskConical className="size-3" aria-hidden />
              Demo
            </Badge>
            <span className="text-[#CBD5E1]">
              Curated outputs — add{" "}
              <code className="text-[#FCD34D] font-mono text-[11px]">
                GOOGLE_AI_API_KEY
              </code>{" "}
              (recommended) or{" "}
              <code className="text-[#FCD34D] font-mono text-[11px]">
                OPENROUTER_API_KEY
              </code>{" "}
              for live generation.
            </span>
          </>
        ) : (
          <>
            <Badge variant="live" className="gap-1">
              <Cpu className="size-3" aria-hidden />
              Live
            </Badge>
            <span className="text-[#CBD5E1]">
              <span className="text-[#7DD3FC] font-medium">{liveLabel}</span>
              {fallbackLabel && (
                <span className="text-[#94A3B8]">
                  {" "}
                  — Fallback available: {fallbackLabel}
                </span>
              )}
              {llmStatus?.primaryProvider === "openrouter" && (
                <span className="text-[#94A3B8]">
                  {" "}
                  — OpenRouter uses account credits. Longer chapters need more
                  credits; Google fallback may recover on errors.
                </span>
              )}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
