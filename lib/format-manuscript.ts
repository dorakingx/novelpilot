import { getAllChapters } from "./structure-utils";
import type { Chapter, PartPlan, StoryProject } from "./types";

export function splitManuscriptParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function getDraftedChapters(project: StoryProject): Chapter[] {
  const chaptersFromParts =
    project.storyBible.parts?.flatMap((part) =>
      part.chapters.map((chapter) => ({
        ...chapter,
        partNumber: chapter.partNumber ?? part.number,
      }))
    ) ?? [];

  const source =
    chaptersFromParts.length > 0
      ? chaptersFromParts
      : project.storyBible.chapters ?? [];

  return source
    .filter((chapter) => chapter.draft?.trim())
    .sort((a, b) => a.number - b.number);
}

function renderChapterBlock(chapter: Chapter): string {
  const title = chapter.title || `Chapter ${chapter.number}`;
  return `# Chapter ${chapter.number}: ${title}\n\n${chapter.draft?.trim() ?? ""}`;
}

export function buildCompleteManuscriptFromDrafts(
  chapters: { number: number; title: string; draft: string; partNumber?: number }[],
  parts?: PartPlan[]
): string {
  const drafted = chapters
    .filter((ch) => ch.draft.trim())
    .sort((a, b) => a.number - b.number);

  if (parts && parts.length > 0) {
    const sections: string[] = [];
    for (const part of [...parts].sort((a, b) => a.number - b.number)) {
      const partChapters = [...part.chapters]
        .filter((ch) => ch.draft?.trim())
        .sort((a, b) => a.number - b.number);

      if (partChapters.length === 0) continue;

      const chapterText = partChapters
        .map((chapter) => renderChapterBlock(chapter))
        .join("\n\n");

      const partTitle = part.title
        ? `# Part ${part.number}: ${part.title}`
        : `# Part ${part.number}`;

      sections.push(`${partTitle}\n\n${chapterText}`);
    }
    if (sections.length > 0) return sections.join("\n\n");
  }

  return drafted
    .map((ch) => renderChapterBlock(ch as Chapter))
    .join("\n\n");
}

export function buildCompleteManuscript(project: StoryProject): string {
  const parts = project.storyBible.parts ?? [];

  if (parts.length > 0) {
    const renderedParts = [...parts]
      .sort((a, b) => a.number - b.number)
      .map((part) => {
        const draftedChapters = [...part.chapters]
          .filter((chapter) => chapter.draft?.trim())
          .sort((a, b) => a.number - b.number);

        if (draftedChapters.length === 0) return "";

        const chapterText = draftedChapters
          .map((chapter) => renderChapterBlock(chapter))
          .join("\n\n");

        const partTitle = part.title
          ? `# Part ${part.number}: ${part.title}`
          : `# Part ${part.number}`;

        return `${partTitle}\n\n${chapterText}`;
      })
      .filter(Boolean)
      .join("\n\n");

    if (renderedParts.trim()) return renderedParts;
  }

  const draftedChapters = getDraftedChapters(project);

  if (draftedChapters.length > 0) {
    return draftedChapters.map((chapter) => renderChapterBlock(chapter)).join("\n\n");
  }

  return project.manuscript?.trim() ?? "";
}

export function buildManuscriptFromProject(project: StoryProject): string {
  return buildCompleteManuscript(project);
}

export function rebuildProjectManuscript(project: StoryProject): StoryProject {
  return {
    ...project,
    manuscript: buildCompleteManuscript(project),
    updatedAt: new Date().toISOString(),
  };
}

export function getChapterTitle(project: StoryProject): string {
  const drafted = getDraftedChapters(project);
  const parts = project.storyBible.parts?.length ?? 0;
  if (parts > 1) {
    return `${parts} parts · ${drafted.length || getAllChapters(project).length} chapters`;
  }
  if (drafted.length > 1) {
    return `${drafted.length} chapters`;
  }
  if (drafted.length === 1) {
    return drafted[0].title;
  }
  const all = getAllChapters(project);
  return all[0]?.title ?? "Chapter 1";
}

export function getChapterDraftCoverage(project: StoryProject): {
  drafted: number;
  expected: number;
  warning?: string;
} {
  const expected = getAllChapters(project).length;
  const drafted = getDraftedChapters(project).length;
  if (expected > 0 && drafted > 0 && drafted < expected) {
    return {
      drafted,
      expected,
      warning: `Only ${drafted} of ${expected} chapters were drafted.`,
    };
  }
  return { drafted, expected };
}

export function hasManuscript(project: StoryProject | null): boolean {
  if (!project) return false;
  if (project.manuscript?.trim()) return true;
  return getDraftedChapters(project).length > 0;
}

export function countRenderedChapters(project: StoryProject): number {
  const parts = project.storyBible.parts ?? [];
  if (parts.length > 0) {
    return parts.reduce(
      (sum, part) =>
        sum + part.chapters.filter((ch) => ch.draft?.trim()).length,
      0
    );
  }
  return getDraftedChapters(project).length;
}
