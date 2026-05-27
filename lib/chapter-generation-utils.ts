import { countByUnit, getLengthStatus } from "./text-length";
import type { Chapter, StoryProject } from "./types";

export interface ChaptersToGenerateOptions {
  includeFailed?: boolean;
  includeTooShort?: boolean;
  forceAll?: boolean;
}

export function getOrderedChapters(project: StoryProject): Chapter[] {
  const fromParts =
    project.storyBible.parts?.flatMap((part) =>
      part.chapters.map((chapter) => ({
        ...chapter,
        partNumber: chapter.partNumber ?? part.number,
      }))
    ) ?? [];

  const source = fromParts.length > 0 ? fromParts : project.storyBible.chapters ?? [];
  const byNumber = new Map<number, Chapter>();

  for (const chapter of source) {
    if (!Number.isFinite(chapter.number)) continue;
    const existing = byNumber.get(chapter.number);
    if (!existing || (!existing.draft && chapter.draft)) {
      byNumber.set(chapter.number, chapter);
    }
  }

  return [...byNumber.values()].sort((a, b) => a.number - b.number);
}

export function getNextUnfinishedChapter(project: StoryProject): Chapter | null {
  return getOrderedChapters(project).find((chapter) => !chapter.draft?.trim()) ?? null;
}

function isTooShort(project: StoryProject, chapter: Chapter): boolean {
  const draft = chapter.draft?.trim();
  if (!draft) return false;

  const state = project.chapterDrafts?.find(
    (s) => s.chapterNumber === chapter.number
  );
  if (state?.lengthStatus === "too-short" || state?.needsExpansion) return true;

  const target = chapter.lengthPlan?.targetLength;
  const unit = chapter.lengthPlan?.unit;
  if (!target || !unit) return false;
  const actual = countByUnit(draft, unit);
  return getLengthStatus(actual, target) === "too-short";
}

export function getChaptersToGenerate(
  project: StoryProject,
  options?: ChaptersToGenerateOptions
): Chapter[] {
  const chapters = getOrderedChapters(project);
  if (options?.forceAll) return chapters;

  return chapters.filter((chapter) => {
    const draft = chapter.draft?.trim();
    if (!draft) return true;

    const draftState = project.chapterDrafts?.find(
      (s) => s.chapterNumber === chapter.number
    );

    if (options?.includeFailed && draftState?.status === "failed") {
      return true;
    }

    if (options?.includeTooShort && isTooShort(project, chapter)) {
      return true;
    }

    return false;
  });
}
