"use client";

import { DownloadPdfButton } from "@/components/DownloadPdfButton";
import { PanelPlaceholder } from "@/components/PanelPlaceholder";
import { ReadNovelButton } from "@/components/ReadNovelButton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getChapterTitle,
  splitManuscriptParagraphs,
} from "@/lib/format-manuscript";
import type { StoryProject } from "@/lib/types";
import { PenLine } from "lucide-react";

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
  const chapterTitle = project ? getChapterTitle(project) : "Chapter 1";
  const draft = project?.manuscript;
  const showReadActions = projectComplete || canReadNovel;

  return (
    <div className="surface-card premium-border rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-[#F8FAFC]">Manuscript</h3>
          <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
            Preview the generated chapter, or open the finished novel reader.
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
      <ScrollArea className="h-[320px]">
        {draft ? (
          <article className="manuscript-paper rounded-xl p-6 sm:p-8">
            <header className="mb-6 border-b border-black/10 pb-4 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-black/50">
                Draft
              </p>
              <h2
                className="mt-2 text-xl font-medium"
                style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
              >
                {chapterTitle}
              </h2>
            </header>
            <div
              className="space-y-5 text-[16px] leading-[1.9] break-words"
              style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
            >
              {splitManuscriptParagraphs(draft).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </article>
        ) : (
          <PanelPlaceholder
            message={
              isRunning
                ? "Chapter 1 draft will appear after the Prose Writer completes."
                : "Chapter 1 will appear after the Prose Writer completes."
            }
            icon={PenLine}
          />
        )}
      </ScrollArea>
    </div>
  );
}
