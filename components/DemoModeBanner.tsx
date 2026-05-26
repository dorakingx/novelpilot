"use client";

import { Badge } from "@/components/ui/badge";
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
          ? "border-b border-white/12 bg-[#111827]"
          : "border-b border-white/12 bg-[#111827]"
      }
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
                GEMMA_API_KEY
              </code>{" "}
              for live OpenRouter generation.
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
                {provider}
                {model ? ` / ${model}` : ""}
              </span>
              {provider === "openrouter" && (
                <span className="text-[#94A3B8]">
                  {" "}
                  — Live mode uses OpenRouter credits. Longer chapters require
                  more credits.
                </span>
              )}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
