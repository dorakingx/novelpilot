"use client";

import { Badge } from "@/components/ui/badge";
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
    <div className="surface-elevated rounded-2xl p-6 mb-6">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="size-8 text-[#86EFAC] shrink-0" />
        <div className="space-y-3 flex-1">
          <div>
            <h3 className="text-lg font-semibold text-[#F8FAFC]">
              Pipeline complete
            </h3>
            <p className="text-sm text-[#94A3B8] mt-1">
              Your Gemma-powered writing room finished all nine agents.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Badge variant="completed">9 agents</Badge>
            <Badge variant="running">{foreshadowCount} foreshadowing threads</Badge>
            <Badge variant="warning">{issueCount} continuity issues</Badge>
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
          className="size-5 text-[#F5C542]/60 hidden sm:block"
          aria-hidden
        />
      </div>
    </div>
  );
}
