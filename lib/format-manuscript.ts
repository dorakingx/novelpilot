import { getMissingChapterNumbers } from "./workflow-utils";
import { getAllChapters } from "./structure-utils";
import type { Chapter, PartPlan, StoryProject } from "./types";

export { getMissingChapterNumbers };

export function splitManuscriptParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function getOrderedParts(project: StoryProject): PartPlan[] {
  const parts = project.storyBible.parts ?? [];
  if (parts.length > 0) {
    return [...parts].sort((a, b) => a.number - b.number);
  }
  const chapters = getOrderedChapters(project);
  if (chapters.length === 0) return [];
  return [
    {
      id: "part-1",
      number: 1,
      title: "Main",
      purpose: "Main narrative arc",
      chapters,
    },
  ];
}

export function getOrderedChapters(project: StoryProject): Chapter[] {
  return getAllChapters(project);
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

function chapterPlaceholder(chapterNumber: number, title?: string): string {
  const label = title ? `Chapter ${chapterNumber}: ${title}` : `Chapter ${chapterNumber}`;
  return `# ${label}\n\n[Chapter ${chapterNumber} has not been generated yet]`;
}

function renderChapterBlock(
  chapter: Chapter,
  options?: { includePlaceholders?: boolean }
): string {
  const title = chapter.title || `Chapter ${chapter.number}`;
  if (chapter.draft?.trim()) {
    return `# Chapter ${chapter.number}: ${title}\n\n${chapter.draft.trim()}`;
  }
  if (options?.includePlaceholders) {
    return chapterPlaceholder(chapter.number, chapter.title);
  }
  return "";
}

export function buildCompleteManuscriptFromDrafts(
  chapters: { number: number; title: string; draft: string; partNumber?: number }[],
  parts?: PartPlan[],
  options?: { includePlaceholders?: boolean }
): string {
  const drafted = chapters
    .filter((ch) => ch.draft.trim())
    .sort((a, b) => a.number - b.number);

  if (parts && parts.length > 0) {
    const sections: string[] = [];
    for (const part of [...parts].sort((a, b) => a.number - b.number)) {
      const partChapters = [...part.chapters].sort(
        (a, b) => a.number - b.number
      );
      const blocks = partChapters
        .map((chapter) =>
          renderChapterBlock(chapter as Chapter, options)
        )
        .filter(Boolean);

      if (blocks.length === 0) continue;

      const partTitle = part.title
        ? `# Part ${part.number}: ${part.title}`
        : `# Part ${part.number}`;

      sections.push(`${partTitle}\n\n${blocks.join("\n\n")}`);
    }
    if (sections.length > 0) return sections.join("\n\n");
  }

  if (options?.includePlaceholders) {
    return chapters
      .sort((a, b) => a.number - b.number)
      .map((ch) =>
        ch.draft.trim()
          ? renderChapterBlock(ch as Chapter)
          : chapterPlaceholder(ch.number, ch.title)
      )
      .join("\n\n");
  }

  return drafted
    .map((ch) => renderChapterBlock(ch as Chapter))
    .join("\n\n");
}

export interface BuildManuscriptOptions {
  includePlaceholders?: boolean;
}

export function buildCompleteManuscript(
  project: StoryProject,
  options?: BuildManuscriptOptions
): string {
  const parts = getOrderedParts(project);

  if (parts.length > 0) {
    const renderedParts = parts
      .map((part) => {
        const partChapters = [...part.chapters].sort(
          (a, b) => a.number - b.number
        );

        const blocks = partChapters
          .map((chapter) => renderChapterBlock(chapter, options))
          .filter((block) => block.length > 0);

        if (blocks.length === 0 && !options?.includePlaceholders) return "";

        const chapterText = blocks.join("\n\n");
        const partTitle = part.title
          ? `# Part ${part.number}: ${part.title}`
          : `# Part ${part.number}`;

        return `${partTitle}\n\n${chapterText}`;
      })
      .filter(Boolean)
      .join("\n\n");

    if (renderedParts.trim()) return renderedParts;
  }

  const allChapters = getOrderedChapters(project);
  if (options?.includePlaceholders && allChapters.length > 0) {
    return allChapters
      .map((chapter) => renderChapterBlock(chapter, options))
      .filter(Boolean)
      .join("\n\n");
  }

  const draftedChapters = getDraftedChapters(project);
  if (draftedChapters.length > 0) {
    return draftedChapters
      .map((chapter) => renderChapterBlock(chapter))
      .join("\n\n");
  }

  return project.manuscript?.trim() ?? "";
}

export function buildMarkdownManuscript(project: StoryProject): string {
  const header = `# ${project.title}\n\n`;
  return header + buildCompleteManuscript(project, { includePlaceholders: true });
}

export interface PdfSection {
  type: "part" | "chapter";
  title: string;
  body: string;
}

export function buildPdfSections(project: StoryProject): PdfSection[] {
  const sections: PdfSection[] = [];
  for (const part of getOrderedParts(project)) {
    if (part.title) {
      sections.push({
        type: "part",
        title: `Part ${part.number}: ${part.title}`,
        body: part.purpose,
      });
    }
    for (const chapter of [...part.chapters].sort(
      (a, b) => a.number - b.number
    )) {
      sections.push({
        type: "chapter",
        title: `Chapter ${chapter.number}: ${chapter.title}`,
        body:
          chapter.draft?.trim() ??
          `[Chapter ${chapter.number} has not been generated yet]`,
      });
    }
  }
  return sections;
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
