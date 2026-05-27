"use client";

import { CompletedNovelReader } from "@/components/CompletedNovelReader";
import { WorkflowProgressBar } from "@/components/WorkflowProgressBar";
import { Button } from "@/components/ui/button";
import { getMissingChapterNumbers } from "@/lib/workflow-utils";
import type { StoryProject, WorkflowStage } from "@/lib/types";
import { downloadFile, exportProjectJson } from "@/lib/export";
import { buildMarkdownManuscript } from "@/lib/format-manuscript";
import { Loader2 } from "lucide-react";

interface FinalManuscriptWorkspaceProps {
  project: StoryProject;
  isRunning: boolean;
  onBackToDrafting: () => void;
  onGenerateMissing: () => void;
  onExpandShort: () => void;
  onFinalize: () => void;
  onDownloadPdf: () => void;
  onNewStory: () => void;
  onNavigateStage: (stage: WorkflowStage) => void;
  isGeneratingPdf?: boolean;
}

export function FinalManuscriptWorkspace({
  project,
  isRunning,
  onBackToDrafting,
  onGenerateMissing,
  onExpandShort,
  onFinalize,
  onDownloadPdf,
  onNewStory,
  onNavigateStage,
  isGeneratingPdf,
}: FinalManuscriptWorkspaceProps) {
  const missing = getMissingChapterNumbers(project);
  const tooShort = (project.chapterDrafts ?? [])
    .filter((draft) => draft.lengthStatus === "too-short" || draft.needsExpansion)
    .map((draft) => draft.chapterNumber);
  const publisherDone =
    project.agents.find((a) => a.id === "publisher")?.status === "completed";

  const handleExportMarkdown = () => {
    const slug =
      project.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "story";
    downloadFile(
      `${slug}-manuscript.md`,
      buildMarkdownManuscript(project),
      "text/markdown"
    );
  };

  const handleExportJson = () => {
    const slug =
      project.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "story";
    downloadFile(
      `${slug}-project.json`,
      exportProjectJson(project),
      "application/json"
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="border-b border-white/10 bg-[#111827] px-4 py-3">
        <div className="mx-auto max-w-[860px] space-y-3">
          <WorkflowProgressBar
            currentStage="final"
            onNavigate={onNavigateStage}
            disabled={isRunning}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold">Final Manuscript</h2>
              <p className="text-xs text-muted-foreground">
                Assemble every chapter into one complete work.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!publisherDone && (
                <Button size="sm" onClick={onFinalize} disabled={isRunning}>
                  {isRunning ? (
                    <Loader2 className="size-3.5 animate-spin mr-1" />
                  ) : null}
                  Final polish
                </Button>
              )}
              <Button
                size="sm"
                variant="glass"
                onClick={onDownloadPdf}
                disabled={isGeneratingPdf || missing.length > 0 || tooShort.length > 0}
                title={
                  missing.length > 0 || tooShort.length > 0
                    ? "Resolve missing/too-short chapters before PDF export"
                    : undefined
                }
              >
                Download PDF
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportMarkdown}>
                Markdown
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportJson}>
                JSON
              </Button>
              <Button size="sm" variant="ghost" onClick={onBackToDrafting}>
                Back to Drafting
              </Button>
            </div>
          </div>
          {missing.length > 0 && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
              Missing chapters: {missing.join(", ")}.{" "}
              <button
                type="button"
                className="underline text-[#F5C542]"
                onClick={onGenerateMissing}
              >
                Generate missing chapters
              </button>
            </div>
          )}
          {tooShort.length > 0 && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
              Too-short chapters: {tooShort.join(", ")}.{" "}
              <button
                type="button"
                className="underline text-[#F5C542]"
                onClick={onExpandShort}
              >
                Expand short chapters
              </button>
            </div>
          )}
        </div>
      </div>
      <CompletedNovelReader
        project={project}
        onBackToWorkspace={onBackToDrafting}
        onNewStory={onNewStory}
        onDownloadPdf={onDownloadPdf}
        onExportMarkdown={handleExportMarkdown}
        isGeneratingPdf={isGeneratingPdf}
        embedded
      />
    </div>
  );
}
