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
      role="status"
      className={
        mockMode
          ? "border-b border-[oklch(0.78_0.14_75/20%)] bg-[oklch(0.78_0.14_75/6%)] backdrop-blur-sm"
          : "border-b border-[oklch(0.72_0.14_220/25%)] bg-[oklch(0.72_0.14_220/6%)] backdrop-blur-sm"
      }
    >
      <div className="mx-auto max-w-[1600px] px-4 py-2 flex items-center gap-2 text-xs">
        {mockMode ? (
          <>
            <FlaskConical
              className="size-3.5 text-[oklch(0.78_0.14_75)] shrink-0"
              aria-hidden
            />
            <span className="text-foreground/85">
              Demo mode uses curated outputs. Add{" "}
              <code className="text-[oklch(0.78_0.14_75)] font-mono text-[11px]">
                GEMMA_API_KEY
              </code>{" "}
              for live OpenRouter generation.
            </span>
          </>
        ) : (
          <>
            <Cpu
              className="size-3.5 text-[oklch(0.72_0.14_220)] shrink-0"
              aria-hidden
            />
            <span className="text-muted-foreground">
              Live mode:{" "}
              <span className="text-[oklch(0.72_0.14_220)] font-medium">
                {provider}
                {model ? ` / ${model}` : ""}
              </span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
