"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";
import {
  estimateTextLength,
  formatLengthLabel,
} from "@/lib/length-planning";
import {
  buildCompleteManuscript,
  countRenderedChapters,
  getChapterTitle,
  getDraftedChapters,
  splitManuscriptParagraphs,
} from "@/lib/format-manuscript";
import { getAllChapters } from "@/lib/structure-utils";
import type { StoryProject } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  FileDown,
  FileText,
  Loader2,
  Moon,
  Plus,
  Sun,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type ReaderTheme = "paper" | "dark";
type FontSize = "small" | "medium" | "large";

const FONT_SIZE_CLASS: Record<FontSize, string> = {
  small: "text-base",
  medium: "text-[17px] sm:text-[19px]",
  large: "text-lg sm:text-xl",
};

interface CompletedNovelReaderProps {
  project: StoryProject;
  onBackToWorkspace: () => void;
  onNewStory: () => void;
  onDownloadPdf: () => void;
  onExportMarkdown?: () => void;
  isGeneratingPdf?: boolean;
}

export function CompletedNovelReader({
  project,
  onBackToWorkspace,
  onNewStory,
  onDownloadPdf,
  onExportMarkdown,
  isGeneratingPdf = false,
}: CompletedNovelReaderProps) {
  const [theme, setTheme] = useState<ReaderTheme>("paper");
  const [fontSize, setFontSize] = useState<FontSize>("medium");
  const [copied, setCopied] = useState(false);

  const isJa = project.language === "ja";
  const draftedChapters = getDraftedChapters(project);
  const partsWithDrafts = [...(project.storyBible.parts ?? [])]
    .filter((p) => p.chapters.some((c) => c.draft?.trim()))
    .sort((a, b) => a.number - b.number);
  const useParts = partsWithDrafts.length > 0;
  const sortedDraftedChapters = [...draftedChapters];
  const subtitle = getChapterTitle(project);
  const unit = project.structure?.lengthUnit ?? (isJa ? "characters" : "words");

  const romanPart = (n: number) => {
    const r = ["I", "II", "III", "IV", "V", "VI"];
    return r[n - 1] ?? String(n);
  };
  const foreshadowCount = project.storyBible.foreshadowingTracker.length;
  const issueCount = project.reports.continuity?.issues.length ?? 0;

  const scrollToChapter = (number: number) => {
    document
      .getElementById(`reader-chapter-${number}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(buildCompleteManuscript(project));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [project]);

  useEffect(() => {
    const draftedChapterCount = getDraftedChapters(project).length;
    const renderedChapterCount = countRenderedChapters(project);
    if (
      draftedChapterCount > 0 &&
      renderedChapterCount < draftedChapterCount
    ) {
      console.warn("[READER_CHAPTER_MISMATCH]", {
        draftedChapterCount,
        renderedChapterCount,
      });
    }
  }, [project]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBackToWorkspace();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onBackToWorkspace]);

  const pageClass =
    theme === "paper"
      ? "bg-[#FFF7E6] text-[#1F2937]"
      : "bg-[#111827] text-[#F8FAFC]";

  const mutedClass =
    theme === "paper" ? "text-[#6B7280]" : "text-[#CBD5E1]";

  const borderClass =
    theme === "paper" ? "border-black/10" : "border-white/12";

  const proseClass = cn(
    "reader-prose px-6 sm:px-10 py-8 sm:py-10 break-words",
    FONT_SIZE_CLASS[fontSize],
    isJa && "tracking-[0.02em]"
  );

  const proseStyle = {
    fontFamily: "var(--font-lora), Georgia, serif",
    lineHeight: 2,
  } as const;

  return (
    <div className="min-h-screen flex flex-col bg-[#080B12]">
      <header className="no-print sticky top-0 z-10 border-b border-white/12 bg-[#111827]/95 backdrop-blur-sm px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="mx-auto max-w-[860px] flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <BookOpen className="size-5 text-[#F5C542]" />
            <span className="font-semibold text-[#F8FAFC] hidden sm:inline">
              NovelPilot
            </span>
          </div>

          <div className="min-w-0 flex-1 order-3 sm:order-2 basis-full sm:basis-auto">
            <p className="text-sm font-semibold text-[#F8FAFC] truncate">
              {project.title}
            </p>
            <p className="text-xs text-[#94A3B8] truncate">{subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 ml-auto order-2 sm:order-3">
            <Button
              variant="glass"
              size="sm"
              onClick={onBackToWorkspace}
              className="shrink-0"
            >
              <ArrowLeft className="mr-1.5 size-4" />
              <span className="hidden sm:inline">Back to Agent Workspace</span>
              <span className="sm:hidden">Workspace</span>
            </Button>
            <Button variant="glass" size="sm" onClick={onNewStory}>
              <Plus className="mr-1.5 size-4" />
              New Story
            </Button>
            <Button
              variant="premium"
              size="sm"
              onClick={onDownloadPdf}
              disabled={isGeneratingPdf}
              title="Use your browser's Save as PDF option."
            >
              {isGeneratingPdf ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <FileDown className="mr-1.5 size-4" />
              )}
              {isGeneratingPdf ? "Generating PDF..." : "Download PDF"}
            </Button>
            {onExportMarkdown && (
              <Button variant="glass" size="sm" onClick={onExportMarkdown}>
                <FileText className="mr-1.5 size-4" />
                <span className="hidden sm:inline">Export Markdown</span>
                <span className="sm:hidden">Export</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="no-print mx-auto max-w-[820px] w-full px-4 sm:px-8 py-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="completed">9 agents completed</Badge>
          <Badge variant="running">{foreshadowCount} foreshadowing threads</Badge>
          <Badge variant="warning">{issueCount} continuity issues</Badge>
          <Badge variant="live">Publisher package ready</Badge>
        </div>
      </div>

      {(useParts ? getAllChapters(project).length : draftedChapters.length) >
        1 && (
        <nav
          className="no-print mx-auto max-w-[820px] w-full px-4 sm:px-8 pb-2"
          aria-label="Table of contents"
        >
          <p className="text-xs text-[#94A3B8] mb-2">
            {isJa ? "目次" : "Table of contents"}
          </p>
          <div className="flex flex-col gap-2">
            {useParts
              ? partsWithDrafts.map((part) => (
                  <div key={part.id}>
                    <p className="text-xs font-medium text-[#CBD5E1] mb-1">
                      {isJa
                        ? `第${part.number}部`
                        : `Part ${romanPart(part.number)}`}
                      : {part.title}
                    </p>
                    <div className="flex flex-wrap gap-2 pl-2">
                      {part.chapters
                        .filter((c) => c.draft?.trim())
                        .map((ch) => (
                          <button
                            key={ch.number}
                            type="button"
                            onClick={() => scrollToChapter(ch.number)}
                            className="rounded-full border border-white/12 bg-[#172033] px-3 py-1 text-xs text-[#CBD5E1] hover:border-[#F5C542]/50 hover:text-[#F8FAFC] transition-colors"
                          >
                            {isJa
                              ? `第${ch.number}章`
                              : `Ch. ${ch.number}`}{" "}
                            {ch.title}
                          </button>
                        ))}
                    </div>
                  </div>
                ))
              : draftedChapters.map((ch) => (
                  <button
                    key={ch.number}
                    type="button"
                    onClick={() => scrollToChapter(ch.number)}
                    className="rounded-full border border-white/12 bg-[#172033] px-3 py-1 text-xs text-[#CBD5E1] hover:border-[#F5C542]/50 hover:text-[#F8FAFC] transition-colors w-fit"
                  >
                    {isJa ? `第${ch.number}章` : `Chapter ${ch.number}`}
                  </button>
                ))}
          </div>
        </nav>
      )}

      <div className="no-print mx-auto max-w-[820px] w-full px-4 sm:px-8 pb-2 flex flex-wrap items-center gap-2 justify-end">
        <div
          className="flex rounded-lg border border-white/12 overflow-hidden"
          role="group"
          aria-label="Font size"
        >
          {(["small", "medium", "large"] as const).map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setFontSize(size)}
              className={cn(
                "px-2 py-1 text-xs font-medium capitalize transition-colors min-w-[2.25rem]",
                fontSize === size
                  ? "bg-[#F5C542] text-[#0B1020]"
                  : "bg-[#172033] text-[#CBD5E1] hover:bg-[#1a2740]"
              )}
            >
              {size[0].toUpperCase()}
            </button>
          ))}
        </div>
        <Button
          variant="glass"
          size="sm"
          onClick={() => setTheme((t) => (t === "paper" ? "dark" : "paper"))}
          aria-label={
            theme === "paper" ? "Switch to dark theme" : "Switch to paper theme"
          }
        >
          {theme === "paper" ? (
            <Moon className="size-4" />
          ) : (
            <Sun className="size-4" />
          )}
        </Button>
        <Button variant="glass" size="sm" onClick={handleCopy}>
          {copied ? (
            <Check className="size-4 text-[#86EFAC]" />
          ) : (
            <Copy className="size-4" />
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-16">
        <div className="reader-print-root mx-auto max-w-[820px] px-4 sm:px-8 py-4 sm:py-8">
          <article
            lang={isJa ? "ja" : "en"}
            className={cn(
              "reader-page rounded-2xl shadow-lg overflow-hidden max-w-[820px] mx-auto",
              pageClass
            )}
          >
            <header
              className={cn(
                "px-6 sm:px-10 pt-8 sm:pt-10 pb-6 border-b",
                borderClass
              )}
            >
              <p className={cn("text-xs uppercase tracking-[0.2em]", mutedClass)}>
                {isJa ? "完成した小説" : "Completed Novel"}
              </p>
              <h1
                className="mt-3 text-2xl sm:text-3xl font-medium leading-snug"
                style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
              >
                {project.title}
              </h1>
              <p className={cn("mt-4 text-sm", mutedClass)}>
                {[project.genre, project.tone, project.language, subtitle]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </header>

            <nav
              className={cn(
                "px-6 sm:px-10 py-4 border-b print-toc",
                borderClass
              )}
              aria-label="Print table of contents"
            >
              <p className={cn("text-xs uppercase tracking-wider", mutedClass)}>
                {isJa ? "目次" : "Contents"}
              </p>
              <ul className="mt-2 text-sm space-y-1">
                {(useParts ? partsWithDrafts : []).flatMap((part) =>
                  [...part.chapters]
                    .filter((c) => c.draft?.trim())
                    .sort((a, b) => a.number - b.number)
                    .map((ch) => (
                      <li key={ch.number}>
                        {isJa
                          ? `第${ch.number}章 ${ch.title}`
                          : `Chapter ${ch.number}: ${ch.title}`}
                      </li>
                    ))
                )}
                {!useParts &&
                  sortedDraftedChapters.map((ch) => (
                    <li key={ch.number}>
                      {isJa
                        ? `第${ch.number}章 ${ch.title}`
                        : `Chapter ${ch.number}: ${ch.title}`}
                    </li>
                  ))}
              </ul>
            </nav>

            {useParts ? (
              partsWithDrafts.map((part, partIndex) => (
                <div key={part.id}>
                  <section
                    className={cn(
                      proseClass,
                      "pb-4",
                      partIndex > 0 && "part-print-break border-t",
                      partIndex > 0 && borderClass
                    )}
                    style={proseStyle}
                  >
                    <h2
                      className={cn(
                        "text-2xl font-medium pt-6",
                        mutedClass
                      )}
                      style={{
                        fontFamily: "var(--font-lora), Georgia, serif",
                      }}
                    >
                      {isJa
                        ? `第${part.number}部：${part.title}`
                        : `Part ${romanPart(part.number)}: ${part.title}`}
                    </h2>
                  </section>
                  {[...part.chapters]
                    .filter((c) => c.draft?.trim())
                    .sort((a, b) => a.number - b.number)
                    .map((ch, chIndex) => (
                      <section
                        key={ch.number}
                        id={`reader-chapter-${ch.number}`}
                        className={cn(
                          proseClass,
                          "space-y-6 sm:space-y-8",
                          (partIndex > 0 || chIndex > 0) &&
                            "chapter-print-break border-t",
                          (partIndex > 0 || chIndex > 0) && borderClass
                        )}
                        style={proseStyle}
                      >
                        <h3
                          className={cn(
                            "text-xl sm:text-2xl font-medium pt-2",
                            mutedClass
                          )}
                          style={{
                            fontFamily: "var(--font-lora), Georgia, serif",
                          }}
                        >
                          {isJa
                            ? `第${ch.number}章${ch.role?.trim() ? `（${ch.role}）` : ""}：${ch.title}`
                            : `Chapter ${ch.number}${ch.role?.trim() ? ` — ${ch.role}` : ""}: ${ch.title}`}
                        </h3>
                        {ch.lengthPlan && (
                          <p
                            className={cn(
                              "text-sm no-print",
                              mutedClass
                            )}
                          >
                            Planned: about{" "}
                            {formatLengthLabel(
                              ch.lengthPlan.targetLength,
                              unit,
                              project.language
                            )}
                            {ch.draft && (
                              <>
                                {" "}
                                · Actual:{" "}
                                {formatLengthLabel(
                                  estimateTextLength(ch.draft, unit),
                                  unit,
                                  project.language
                                )}
                              </>
                            )}
                          </p>
                        )}
                        {splitManuscriptParagraphs(ch.draft!).map(
                          (para, i) => (
                            <p key={i}>{para}</p>
                          )
                        )}
                      </section>
                    ))}
                </div>
              ))
            ) : sortedDraftedChapters.length > 0 ? (
              sortedDraftedChapters.map((ch, index) => (
                <section
                  key={ch.number}
                  id={`reader-chapter-${ch.number}`}
                  className={cn(
                    proseClass,
                    "space-y-6 sm:space-y-8",
                    index > 0 && "chapter-print-break border-t",
                    index > 0 && borderClass
                  )}
                  style={proseStyle}
                >
                  <h2
                    className={cn(
                      "text-xl sm:text-2xl font-medium pt-2",
                      mutedClass
                    )}
                    style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
                  >
                    {isJa
                      ? `第${ch.number}章：${ch.title}`
                      : `Chapter ${ch.number}: ${ch.title}`}
                  </h2>
                  {splitManuscriptParagraphs(ch.draft!).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </section>
              ))
            ) : (
              <div
                className={cn(proseClass, "space-y-6 sm:space-y-8")}
                style={proseStyle}
              >
                {splitManuscriptParagraphs(buildCompleteManuscript(project)).map(
                  (para, i) => (
                    <p key={i}>{para}</p>
                  )
                )}
              </div>
            )}
          </article>
          <footer className="reader-prose no-screen-only text-center text-sm mt-8 text-[#6B7280]">
            Generated with NovelPilot
          </footer>
        </div>
      </div>
    </div>
  );
}
