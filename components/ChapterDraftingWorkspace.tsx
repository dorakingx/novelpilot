"use client";

import { ChapterCard } from "@/components/ChapterCard";
import { ChapterChatPanel } from "@/components/ChapterChatPanel";
import { WorkflowProgressBar } from "@/components/WorkflowProgressBar";
import { Button } from "@/components/ui/button";
import { getOrderedParts } from "@/lib/format-manuscript";
import { getFailedChapterNumbers, getMissingChapterNumbers } from "@/lib/workflow-utils";
import type { StoryProject, WorkflowStage } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface ChapterDraftingWorkspaceProps {
  project: StoryProject;
  isRunning: boolean;
  onGenerateChapter: (n: number) => void;
  onRegenerateChapter: (n: number) => void;
  onGenerateRemaining: () => void;
  onGenerateNextPending: () => void;
  onRetryFailed: () => void;
  onFinalize: () => void;
  onBackToPlanning: () => void;
  onSaveChapterEdit: (n: number, draft: string) => void;
  onApplyChapterRevision: (n: number, draft: string) => void;
  onNavigateStage: (stage: WorkflowStage) => void;
}

export function ChapterDraftingWorkspace({
  project,
  isRunning,
  onGenerateChapter,
  onRegenerateChapter,
  onGenerateRemaining,
  onGenerateNextPending,
  onRetryFailed,
  onFinalize,
  onBackToPlanning,
  onSaveChapterEdit,
  onApplyChapterRevision,
  onNavigateStage,
}: ChapterDraftingWorkspaceProps) {
  const parts = getOrderedParts(project);
  const missing = getMissingChapterNumbers(project);
  const failed = getFailedChapterNumbers(project);
  const nextPending = missing[0];

  const getDraftState = (n: number) =>
    project.chapterDrafts?.find((d) => d.chapterNumber === n);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 flex-1 w-full">
      <div className="mb-6 space-y-2">
        <WorkflowProgressBar
          currentStage="drafting"
          onNavigate={onNavigateStage}
          disabled={isRunning}
        />
        <h2 className="text-2xl font-bold">Chapter Drafting Room</h2>
        <p className="text-sm text-muted-foreground">
          Generate, preview, revise, and resume each chapter independently.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          size="sm"
          variant="glass"
          onClick={onGenerateRemaining}
          disabled={isRunning || (missing.length === 0 && failed.length === 0)}
        >
          Generate all missing
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onGenerateNextPending}
          disabled={isRunning || nextPending == null}
        >
          Generate next pending
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onRetryFailed}
          disabled={isRunning || failed.length === 0}
        >
          Retry failed
        </Button>
        <Button size="sm" onClick={onFinalize} disabled={isRunning}>
          {isRunning ? (
            <Loader2 className="size-3.5 animate-spin mr-1" />
          ) : null}
          Finalize Manuscript
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onBackToPlanning}
          disabled={isRunning}
        >
          Back to Planning
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-8">
          {parts.map((part) => (
            <section key={part.id} className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">
                  Part {part.number}: {part.title}
                </h3>
                <p className="text-sm text-muted-foreground">{part.purpose}</p>
              </div>
              <div className="space-y-3">
                {part.chapters.map((chapter) => (
                  <ChapterCard
                    key={chapter.number}
                    chapter={chapter}
                    language={project.language}
                    draftState={getDraftState(chapter.number)}
                    onGenerate={() => onGenerateChapter(chapter.number)}
                    onRegenerate={() => onRegenerateChapter(chapter.number)}
                    onSaveEdit={(draft) =>
                      onSaveChapterEdit(chapter.number, draft)
                    }
                    isRunning={isRunning}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
          <ChapterChatPanel
            project={project}
            defaultChapter={nextPending ?? 1}
            onApplyRevision={onApplyChapterRevision}
            disabled={isRunning}
          />
        </div>
      </div>
    </div>
  );
}
