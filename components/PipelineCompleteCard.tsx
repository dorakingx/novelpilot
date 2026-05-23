"use client";

import { DownloadPdfButton } from "@/components/DownloadPdfButton";
import { ReadNovelButton } from "@/components/ReadNovelButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { downloadFile, exportFullDemoMarkdown } from "@/lib/export";
import { hasManuscript } from "@/lib/format-manuscript";
import type { StoryProject } from "@/lib/types";
import { CheckCircle2, FileSearch, FileText, Sparkles } from "lucide-react";

interface PipelineCompleteCardProps {
  project: StoryProject;
  onOpenReader?: () => void;
  onDownloadPdf?: () => void;
  onReviewContinuity?: () => void;
}

export function PipelineCompleteCard({
  project,
  onOpenReader,
  onDownloadPdf,
  onReviewContinuity,
}: PipelineCompleteCardProps) {
  const foreshadowCount = project.storyBible.foreshadowingTracker.length;
  const issueCount = project.reports.continuity?.issues.length ?? 0;
  const slug =
    project.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "story";
  const canRead = hasManuscript(project);

  return (
    <div className="surface-elevated rounded-2xl p-6 mb-6">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="size-8 text-[#86EFAC] shrink-0" />
        <div className="space-y-4 flex-1 min-w-0">
          <div>
            <h3 className="text-lg font-semibold text-[#F8FAFC]">
              Your story is ready.
            </h3>
            <p className="text-sm text-[#94A3B8] mt-1">
              Read the finished chapter in Reader Mode, export your demo bundle,
              or review the continuity audit.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Badge variant="completed">9 agents</Badge>
            <Badge variant="running">{foreshadowCount} foreshadowing threads</Badge>
            <Badge variant="warning">{issueCount} continuity issues</Badge>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            {onOpenReader && (
              <ReadNovelButton
                onClick={onOpenReader}
                disabled={!canRead}
                className="w-full sm:w-auto"
              />
            )}
            {onDownloadPdf && (
              <DownloadPdfButton
                onClick={onDownloadPdf}
                disabled={!canRead}
                variant="premium"
                size="lg"
                className="w-full sm:w-auto"
              />
            )}
            <Button
              variant="glass"
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
              Export Markdown
            </Button>
            {onReviewContinuity && (
              <Button
                variant="glass"
                size="lg"
                className="w-full sm:w-auto"
                onClick={onReviewContinuity}
              >
                <FileSearch className="mr-2 size-4" />
                Review Continuity Report
              </Button>
            )}
          </div>
        </div>
        <Sparkles
          className="size-5 text-[#F5C542]/60 hidden sm:block shrink-0"
          aria-hidden
        />
      </div>
    </div>
  );
}
