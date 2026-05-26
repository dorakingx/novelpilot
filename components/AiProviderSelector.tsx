"use client";

import { Badge } from "@/components/ui/badge";
import {
  AI_PROVIDER_OPTIONS,
  aiModelForChoice,
} from "@/lib/ai-provider-options";
import { normalizeAiModel } from "@/lib/ai-model-utils";
import type { LlmStatus } from "@/lib/llm-config";
import type { AiProviderChoice, ProjectSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AiProviderSelectorProps {
  settings: ProjectSettings;
  onSettingsChange: (partial: Partial<ProjectSettings>) => void;
  disabled?: boolean;
  llmStatus?: LlmStatus | null;
}

function isConfigured(
  id: AiProviderChoice,
  llmStatus?: LlmStatus | null
): boolean {
  if (!llmStatus) return true;
  switch (id) {
    case "google-gemini":
      return llmStatus.providerChoicesAvailable?.googleGemini ?? llmStatus.googleConfigured;
    case "openrouter-gemma":
      return (
        llmStatus.providerChoicesAvailable?.openRouterGemma ??
        llmStatus.openRouterConfigured
      );
    case "mock":
    case "auto":
    default:
      return true;
  }
}

export function AiProviderSelector({
  settings,
  onSettingsChange,
  disabled,
  llmStatus,
}: AiProviderSelectorProps) {
  const selected = normalizeAiModel(settings.aiModel).providerChoice;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-[#CBD5E1]">AI model</p>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Choose which provider runs the full agent pipeline for this story.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {AI_PROVIDER_OPTIONS.map((option) => {
          const isSelected = selected === option.id;
          const configured = isConfigured(option.id, llmStatus);

          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() =>
                onSettingsChange({ aiModel: aiModelForChoice(option.id) })
              }
              className={cn(
                "rounded-xl border p-3 text-left transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isSelected
                  ? "border-[#F5C542]/60 bg-[rgba(245,197,66,0.1)] ring-1 ring-[#F5C542]/30"
                  : "border-white/12 bg-[#172033] hover:border-white/20"
              )}
            >
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="text-sm font-semibold text-[#F8FAFC]">
                  {option.label}
                </span>
                <Badge
                  variant={isSelected ? "live" : "outline"}
                  className="text-[10px]"
                >
                  {option.badge}
                </Badge>
                {!configured && (
                  <Badge
                    variant="outline"
                    className="text-[10px] border-amber-500/40 text-amber-200"
                  >
                    Not configured
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>

      {selected === "google-gemini" && (
        <p className="text-xs text-[#94A3B8]">
          Requires{" "}
          <code className="text-[#FCD34D] font-mono text-[11px]">
            GOOGLE_AI_API_KEY
          </code>{" "}
          on the server.
        </p>
      )}
      {selected === "openrouter-gemma" && (
        <p className="text-xs text-amber-300/90">
          OpenRouter may require credits for live generation.
        </p>
      )}
    </div>
  );
}
