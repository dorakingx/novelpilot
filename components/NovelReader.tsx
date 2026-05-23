"use client";

import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";
import {
  getChapterTitle,
  splitManuscriptParagraphs,
} from "@/lib/format-manuscript";
import type { StoryProject } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowLeft, Check, Copy, Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type ReaderTheme = "paper" | "dark";
type FontSize = "small" | "medium" | "large";

const FONT_SIZE_CLASS: Record<FontSize, string> = {
  small: "text-base",
  medium: "text-[17px] sm:text-[18px]",
  large: "text-lg sm:text-xl",
};

interface NovelReaderProps {
  project: StoryProject;
  onClose: () => void;
}

export function NovelReader({ project, onClose }: NovelReaderProps) {
  const [theme, setTheme] = useState<ReaderTheme>("paper");
  const [fontSize, setFontSize] = useState<FontSize>("medium");
  const [copied, setCopied] = useState(false);

  const chapterTitle = getChapterTitle(project);
  const paragraphs = splitManuscriptParagraphs(project.manuscript);
  const isJa = project.language === "ja";

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(project.manuscript);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [project.manuscript]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const pageClass =
    theme === "paper"
      ? "bg-[#FFF7E6] text-[#1F2937]"
      : "bg-[#111827] text-[#F8FAFC]";

  const mutedClass =
    theme === "paper" ? "text-[#6B7280]" : "text-[#CBD5E1]";

  const borderClass =
    theme === "paper" ? "border-black/10" : "border-white/12";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Reader Mode"
      className="fixed inset-0 z-50 flex flex-col bg-[#080B12]"
    >
      <header className="sticky top-0 z-10 border-b border-white/12 bg-[#111827]/95 backdrop-blur-sm px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="mx-auto max-w-[860px] flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            variant="glass"
            size="sm"
            onClick={onClose}
            className="shrink-0"
          >
            <ArrowLeft className="mr-1.5 size-4" />
            <span className="hidden sm:inline">Back to Workspace</span>
            <span className="sm:hidden">Back</span>
          </Button>

          <div className="min-w-0 flex-1 order-3 sm:order-2 basis-full sm:basis-auto">
            <p className="text-sm font-semibold text-[#F8FAFC] truncate">
              {project.title}
            </p>
            <p className="text-xs text-[#94A3B8] truncate">{chapterTitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 ml-auto order-2 sm:order-3">
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
              onClick={() =>
                setTheme((t) => (t === "paper" ? "dark" : "paper"))
              }
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
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto max-w-[820px] px-4 sm:px-8 py-8 pb-16">
          <article
            lang={isJa ? "ja" : "en"}
            className={cn(
              "rounded-2xl shadow-lg overflow-hidden",
              pageClass
            )}
          >
            <div className={cn("px-6 sm:px-10 pt-8 sm:pt-10 pb-6 border-b", borderClass)}>
              <p className={cn("text-xs uppercase tracking-[0.2em]", mutedClass)}>
                {isJa ? "読む" : "Reader Mode"}
              </p>
              <h1
                className="mt-3 text-2xl sm:text-3xl font-medium leading-snug"
                style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
              >
                {project.title}
              </h1>
              <h2
                className={cn(
                  "mt-2 text-lg sm:text-xl font-medium",
                  mutedClass
                )}
                style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
              >
                {chapterTitle}
              </h2>
              <p className={cn("mt-4 text-sm", mutedClass)}>
                {[project.genre, project.tone, project.language]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>

            <div
              className={cn(
                "px-6 sm:px-10 py-8 sm:py-10 space-y-6 sm:space-y-8 break-words",
                FONT_SIZE_CLASS[fontSize],
                isJa && "tracking-[0.02em]"
              )}
              style={{ fontFamily: "var(--font-lora), Georgia, serif", lineHeight: 2 }}
            >
              {paragraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
