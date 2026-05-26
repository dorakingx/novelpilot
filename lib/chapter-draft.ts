import { applyChapterDraftToBible } from "./agents";
import { rebuildProjectManuscript } from "./format-manuscript";
import { buildChapterDraftStates } from "./workflow-utils";
import type {
  Chapter,
  ChapterDraftState,
  ChapterDraftStatus,
  StoryProject,
} from "./types";

export interface ChapterDraftPatch {
  draft?: string;
  title?: string;
  chapterSummary?: string;
  continuityNotes?: string[];
  status?: ChapterDraftStatus;
  error?: string;
  needsRevision?: boolean;
  lastGeneratedAt?: string;
  retryCount?: number;
}

export function updateChapterDraft(
  project: StoryProject,
  chapterNumber: number,
  patch: ChapterDraftPatch
): StoryProject {
  let next = project;

  const hasBiblePatch =
    patch.draft !== undefined ||
    patch.title !== undefined ||
    patch.chapterSummary !== undefined ||
    patch.continuityNotes !== undefined;

  if (hasBiblePatch) {
    const existing = getChapterFromProject(project, chapterNumber);
    const bible = applyChapterDraftToBible(project.storyBible, chapterNumber, {
      draft: patch.draft ?? existing?.draft ?? "",
      title: patch.title,
      chapterSummary: patch.chapterSummary,
      continuityNotes: patch.continuityNotes,
    });

    if (patch.needsRevision !== undefined) {
      const markNeedsRevision = (ch: Chapter): Chapter =>
        ch.number === chapterNumber
          ? { ...ch, needsRevision: patch.needsRevision }
          : ch;
      next = {
        ...next,
        storyBible: {
          ...bible,
          chapters: bible.chapters.map(markNeedsRevision),
          parts: bible.parts.map((part) => ({
            ...part,
            chapters: part.chapters.map(markNeedsRevision),
          })),
        },
      };
    } else {
      next = { ...next, storyBible: bible };
    }

    const title =
      chapterNumber === 1 &&
      project.title === "Untitled Project" &&
      patch.title
        ? patch.title
        : undefined;

    next = rebuildProjectManuscript(next);
    if (title) next = { ...next, title };
  } else if (patch.needsRevision !== undefined) {
    const markNeedsRevision = (ch: Chapter): Chapter =>
      ch.number === chapterNumber
        ? { ...ch, needsRevision: patch.needsRevision }
        : ch;
    next = {
      ...next,
      storyBible: {
        ...next.storyBible,
        chapters: next.storyBible.chapters.map(markNeedsRevision),
        parts: next.storyBible.parts.map((part) => ({
          ...part,
          chapters: part.chapters.map(markNeedsRevision),
        })),
      },
    };
  }

  const draftText =
    patch.draft ??
    getChapterFromProject(next, chapterNumber)?.draft ??
    "";
  const preview = draftText
    ? draftText.slice(0, 800) + (draftText.length > 800 ? "…" : "")
    : undefined;

  const chapterDrafts: ChapterDraftState[] = buildChapterDraftStates(next).map(
    (state) => {
      if (state.chapterNumber !== chapterNumber) return state;
      return {
        ...state,
        status: patch.status ?? state.status,
        draft: patch.draft ?? state.draft,
        preview: patch.draft !== undefined ? preview : state.preview,
        error: patch.error !== undefined ? patch.error : state.error,
        lastGeneratedAt:
          patch.lastGeneratedAt ?? state.lastGeneratedAt,
        retryCount: patch.retryCount ?? state.retryCount,
        actualLength: draftText.length || state.actualLength,
        needsRevision:
          patch.needsRevision !== undefined
            ? patch.needsRevision
            : state.needsRevision,
      };
    }
  );

  return {
    ...next,
    chapterDrafts,
    updatedAt: new Date().toISOString(),
  };
}

function getChapterFromProject(
  project: StoryProject,
  chapterNumber: number
) {
  const fromParts = project.storyBible.parts
    ?.flatMap((p) => p.chapters)
    .find((c) => c.number === chapterNumber);
  if (fromParts) return fromParts;
  return project.storyBible.chapters.find((c) => c.number === chapterNumber);
}

export function setChapterDraftStatus(
  project: StoryProject,
  chapterNumber: number,
  status: ChapterDraftStatus,
  extra?: Omit<ChapterDraftPatch, "status">
): StoryProject {
  return updateChapterDraft(project, chapterNumber, { status, ...extra });
}

export function markAllChaptersNeedsRevision(
  project: StoryProject
): StoryProject {
  let next = project;
  for (const ch of project.storyBible.chapters) {
    next = updateChapterDraft(next, ch.number, { needsRevision: true });
  }
  return next;
}
