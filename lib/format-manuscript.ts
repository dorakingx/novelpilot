import type { StoryProject } from "./types";

export function splitManuscriptParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function getChapterTitle(project: StoryProject): string {
  return project.storyBible.chapters[0]?.title ?? "Chapter 1";
}

export function hasManuscript(project: StoryProject | null): boolean {
  return Boolean(project?.manuscript?.trim());
}
