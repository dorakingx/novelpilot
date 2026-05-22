"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StoryProject } from "@/lib/types";

interface ManuscriptPreviewProps {
  project: StoryProject | null;
}

export function ManuscriptPreview({ project }: ManuscriptPreviewProps) {
  const chapterTitle =
    project?.storyBible.chapters[0]?.title ?? "Chapter 1";
  const draft = project?.manuscript;

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Manuscript Preview</CardTitle>
        {project && (
          <p className="text-xs text-muted-foreground">{project.title}</p>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px]">
          <article
            className="rounded-lg border border-border/50 bg-[oklch(0.24_0.02_260)] p-6 shadow-inner"
            style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
          >
            <header className="mb-6 border-b border-border/40 pb-4 text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Draft
              </p>
              <h2 className="mt-2 text-xl font-medium">{chapterTitle}</h2>
            </header>
            {draft ? (
              <div className="space-y-4 text-[15px] leading-[1.85] text-foreground/95 whitespace-pre-wrap">
                {draft.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-sm italic py-12">
                Chapter 1 will appear after the Drafting Agent completes.
              </p>
            )}
          </article>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
