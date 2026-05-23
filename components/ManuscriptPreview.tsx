"use client";

import { PanelPlaceholder } from "@/components/PanelPlaceholder";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StoryProject } from "@/lib/types";
import { PenLine } from "lucide-react";

interface ManuscriptPreviewProps {
  project: StoryProject | null;
  isRunning?: boolean;
}

export function ManuscriptPreview({
  project,
  isRunning,
}: ManuscriptPreviewProps) {
  const chapterTitle =
    project?.storyBible.chapters[0]?.title ?? "Chapter 1";
  const draft = project?.manuscript;

  return (
    <div className="glass-card premium-border rounded-2xl p-5">
      <h3 className="text-base font-semibold">Manuscript Preview</h3>
      {project && (
        <p className="text-xs text-muted-foreground mt-1 mb-3">{project.title}</p>
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
              className="space-y-5 text-[16px] leading-[1.9] whitespace-pre-wrap"
              style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
            >
              {draft.split("\n\n").map((para, i) => (
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
