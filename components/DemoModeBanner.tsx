"use client";

import { Cpu, FlaskConical } from "lucide-react";
interface DemoModeBannerProps {
  mockMode: boolean;
  provider?: string;
  model?: string;
}

export function DemoModeBanner({
  mockMode,
  provider = "openrouter",
  model,
}: DemoModeBannerProps) {
  return (
    <div
      className={
        mockMode
          ? "border-b border-amber-500/20 bg-amber-500/5"
          : "border-b border-primary/20 bg-primary/5"
      }
    >
      <div className="mx-auto max-w-[1600px] px-4 py-2 flex items-center gap-2 text-xs">
        {mockMode ? (
          <>
            <FlaskConical className="size-3.5 text-amber-400 shrink-0" />
            <span className="text-amber-200/90">
              Demo mode: using curated sample outputs. Add{" "}
              <code className="text-amber-300">GEMMA_API_KEY</code> for live
              OpenRouter generation.
            </span>
          </>
        ) : (
          <>
            <Cpu className="size-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground">
              Live mode: using {provider}
              {model ? ` / ${model}` : ""}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
