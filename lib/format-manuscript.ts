import type { Chapter, StoryProject } from "./types";

export function splitManuscriptParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function getDraftedChapters(project: StoryProject): Chapter[] {
  return project.storyBible.chapters
    .filter((ch) => Boolean(ch.draft?.trim()))
    .sort((a, b) => a.number - b.number);
}

export function buildCompleteManuscript(
  chapters: { number: number; title: string; draft: string }[]
): string {
  return chapters
    .filter((ch) => ch.draft.trim())
    .sort((a, b) => a.number - b.number)
    .map(
      (ch) =>
        `Chapter ${ch.number}: ${ch.title}\n\n${ch.draft.trim()}`
    )
    .join("\n\n");
}

export function getChapterTitle(project: StoryProject): string {
  const drafted = getDraftedChapters(project);
  if (drafted.length > 1) {
    return `${drafted.length} chapters`;
  }
  if (drafted.length === 1) {
    return drafted[0].title;
  }
  return project.storyBible.chapters[0]?.title ?? "Chapter 1";
}

export function getChapterDraftCoverage(project: StoryProject): {
  drafted: number;
  expected: number;
  warning?: string;
} {
  const expected = project.storyBible.chapters.length;
  const drafted = getDraftedChapters(project).length;
  if (expected > 0 && drafted > 0 && drafted < expected) {
    return {
      drafted,
      expected,
      warning: `Only ${drafted} of ${expected} chapters was returned. Try regenerating the Prose Writer.`,
    };
  }
  return { drafted, expected };
}

export function hasManuscript(project: StoryProject | null): boolean {
  if (!project) return false;
  if (project.manuscript?.trim()) return true;
  return getDraftedChapters(project).length > 0;
}
