"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, RefreshCw, Wand2 } from "lucide-react";

interface ChapterOutlineFailurePanelProps {
  errorMessage?: string;
  disabled?: boolean;
  onRetry: () => void;
  onUseFallback: () => void;
  onReturnToStructureSettings: () => void;
}

export function ChapterOutlineFailurePanel({
  errorMessage,
  disabled = false,
  onRetry,
  onUseFallback,
  onReturnToStructureSettings,
}: ChapterOutlineFailurePanelProps) {
  return (
    <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="size-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#F8FAFC]">
            Chapter Architect failed
          </h3>
          <p className="text-sm text-[#CBD5E1] leading-relaxed">
            Chapter Architect failed to return valid structure JSON. This often
            happens when the requested structure is too large or the model
            returned prose instead of JSON. Try reducing chapter count or use
            the fallback structure.
          </p>
          {errorMessage && (
            <p className="text-xs text-amber-200/90 font-mono break-words">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="premium"
          size="sm"
          disabled={disabled}
          onClick={onRetry}
        >
          <RefreshCw className="size-3.5 mr-1.5" />
          Retry Chapter Architect
        </Button>
        <Button
          variant="glass"
          size="sm"
          disabled={disabled}
          onClick={onUseFallback}
        >
          <Wand2 className="size-3.5 mr-1.5" />
          Use Fallback Structure
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onReturnToStructureSettings}
        >
          <ArrowLeft className="size-3.5 mr-1.5" />
          Return to Structure Settings
        </Button>
      </div>
    </div>
  );
}
