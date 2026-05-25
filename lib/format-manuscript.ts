import { getAllChapters } from "./structure-utils";
import type { Chapter, PartPlan, StoryProject } from "./types";

export function splitManuscriptParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function getDraftedChapters(project: StoryProject): Chapter[] {
  return getAllChapters(project)
    .filter((ch) => Boolean(ch.draft?.trim()))
    .sort((a, b) => a.number - b.number);
}

function romanPartLabel(n: number): string {
  const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  return romans[n - 1] ?? String(n);
}

export function buildCompleteManuscript(
  chapters: { number: number; title: string; draft: string; partNumber?: number }[],
  parts?: PartPlan[]
): string {
  const drafted = chapters
    .filter((ch) => ch.draft.trim())
    .sort((a, b) => a.number - b.number);

  if (parts && parts.length > 0) {
    const sections: string[] = [];
    for (const part of parts.sort((a, b) => a.number - b.number)) {
      const partChapters = drafted.filter(
        (ch) => ch.partNumber === part.number
      );
      if (partChapters.length === 0) continue;
      sections.push(
        `Part ${romanPartLabel(part.number)}: ${part.title}`,
        "",
        ...partChapters.flatMap((ch) => [
          `Chapter ${ch.number}: ${ch.title}`,
          "",
          ch.draft.trim(),
          "",
        ])
      );
    }
    if (sections.length > 0) return sections.join("\n").trim();
  }

  return drafted
    .map((ch) => `Chapter ${ch.number}: ${ch.title}\n\n${ch.draft.trim()}`)
    .join("\n\n");
}

export function buildManuscriptFromProject(project: StoryProject): string {
  const chapters = getAllChapters(project);
  const drafted = chapters
    .filter((c) => c.draft?.trim())
    .map((c) => ({
      number: c.number,
      title: c.title,
      draft: c.draft!,
      partNumber: c.partNumber,
    }));
  return buildCompleteManuscript(drafted, project.storyBible.parts);
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
