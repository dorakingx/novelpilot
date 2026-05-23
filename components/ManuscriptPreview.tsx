"use client";

import { DownloadPdfButton } from "@/components/DownloadPdfButton";
import { PanelPlaceholder } from "@/components/PanelPlaceholder";
import { ReadNovelButton } from "@/components/ReadNovelButton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getChapterDraftCoverage,
  getDraftedChapters,
  hasManuscript,
  splitManuscriptParagraphs,
} from "@/lib/format-manuscript";
import type { StoryProject } from "@/lib/types";
import { AlertTriangle, PenLine } from "lucide-react";

interface ManuscriptPreviewProps {
  project: StoryProject | null;
  isRunning?: boolean;
  projectComplete?: boolean;
  canReadNovel?: boolean;
  isGeneratingPdf?: boolean;
  readLabel?: string;
  onOpenReader?: () => void;
  onDownloadPdf?: () => void;
}

function ChapterBlock({
  number,
  title,
  draft,
}: {
  number: number;
  title: string;
  draft: string;
}) {
  return (
    <section className="mb-8 last:mb-0">
      <h3
        className="text-lg font-medium mb-4"
        style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
      >
        Chapter {number}: {title}
      </h3>
      <div
        className="space-y-5 text-[16px] leading-[1.9] break-words"
        style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
      >
        {splitManuscriptParagraphs(draft).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </section>
  );
}

export function ManuscriptPreview({
  project,
  isRunning,
  projectComplete = false,
  canReadNovel = false,
  isGeneratingPdf = false,
  readLabel = "Read Finished Novel",
  onOpenReader,
  onDownloadPdf,
}: ManuscriptPreviewProps) {
  const draftedChapters = project ? getDraftedChapters(project) : [];
  const hasContent = project ? hasManuscript(project) : false;
  const coverage = project ? getChapterDraftCoverage(project) : null;
  const showReadActions = projectComplete || canReadNovel;

  return (
    <div className="surface-card premium-border rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-[#F8FAFC]">Manuscript</h3>
          <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
            Preview the complete generated story, or open the finished novel
            reader.
          </p>
        </div>
        {showReadActions && (onOpenReader || onDownloadPdf) && (
          <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
            {onOpenReader && (
              <ReadNovelButton
                onClick={onOpenReader}
                disabled={!canReadNovel}
                label={readLabel}
                className="w-full sm:w-auto"
              />
            )}
            {onDownloadPdf && (
              <DownloadPdfButton
                onClick={onDownloadPdf}
                disabled={!canReadNovel}
                loading={isGeneratingPdf}
                className="w-full sm:w-auto"
              />
            )}
          </div>
        )}
      </div>
      {project && (
        <p className="text-xs text-[#94A3B8] mb-3 truncate">{project.title}</p>
      )}
      {coverage?.warning && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>{coverage.warning}</span>
        </div>
      )}
      <ScrollArea className="h-[320px]">
        {hasContent ? (
          <article className="manuscript-paper rounded-xl p-6 sm:p-8">
            <header className="mb-6 border-b border-black/10 pb-4 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-black/50">
                Complete short novel draft
              </p>
              {draftedChapters.length > 0 && (
                <p className="mt-2 text-sm text-black/60">
                  {draftedChapters.length} chapter
                  {draftedChapters.length !== 1 ? "s" : ""}
                </p>
              )}
            </header>
            {draftedChapters.length > 0 ? (
              draftedChapters.map((ch) => (
                <ChapterBlock
                  key={ch.number}
                  number={ch.number}
                  title={ch.title}
                  draft={ch.draft!}
                />
              ))
            ) : (
              <div
                className="space-y-5 text-[16px] leading-[1.9] break-words"
                style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
              >
                {splitManuscriptParagraphs(project?.manuscript ?? "").map(
                  (para, i) => (
                    <p key={i}>{para}</p>
                  )
                )}
              </div>
            )}
          </article>
        ) : (
          <PanelPlaceholder
            message={
              isRunning
                ? "The complete manuscript will appear after the Prose Writer completes."
                : "The complete manuscript will appear after the Prose Writer completes."
            }
            icon={PenLine}
          />
        )}
      </ScrollArea>
    </div>
  );
}
