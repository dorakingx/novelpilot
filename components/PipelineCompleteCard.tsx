"use client";

import { Button } from "@/components/ui/button";
import { downloadFile, exportFullDemoMarkdown } from "@/lib/export";
import type { StoryProject } from "@/lib/types";
import { CheckCircle2, FileText, Sparkles } from "lucide-react";

interface PipelineCompleteCardProps {
  project: StoryProject;
}

export function PipelineCompleteCard({ project }: PipelineCompleteCardProps) {
  const foreshadowCount = project.storyBible.foreshadowingTracker.length;
  const issueCount = project.reports.continuity?.issues.length ?? 0;
  const slug =
    project.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "story";

  return (
    <div className="glass-card premium-border glow-card rounded-2xl p-6 mb-6 border-[oklch(0.78_0.14_75/25%)] shadow-[0_0_32px_oklch(0.78_0.14_75/12%)]">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="size-8 text-[oklch(0.78_0.14_75)] shrink-0" />
        <div className="space-y-3 flex-1">
          <div>
            <h3 className="text-lg font-semibold gold-gradient-text">
              Pipeline complete
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your Gemma-powered writing room finished all nine agents.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <strong className="text-[oklch(0.78_0.14_75)]">9</strong> agents
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <strong className="text-[oklch(0.72_0.14_220)]">
                {foreshadowCount}
              </strong>{" "}
              foreshadowing threads
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <strong className="text-foreground">{issueCount}</strong>{" "}
              continuity issues
            </span>
          </div>
          <Button
            variant="premium"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() =>
              downloadFile(
                `${slug}-full-demo.md`,
                exportFullDemoMarkdown(project),
                "text/markdown"
              )
            }
          >
            <FileText className="mr-2 size-4" />
            Export Full Demo Markdown
          </Button>
        </div>
        <Sparkles
          className="size-5 text-[oklch(0.78_0.14_75/60%)] hidden sm:block"
          aria-hidden
        />
      </div>
    </div>
  );
}
