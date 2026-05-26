import type {
  GenerateChapterRequest,
  GenerateChapterResponse,
  ReviseChapterRequest,
  ReviseChapterResponse,
  RevisePlanRequest,
  RevisePlanResponse,
} from "./types";

export async function fetchGenerateChapter(
  project: GenerateChapterRequest["project"],
  chapterNumber: number,
  signal?: AbortSignal
): Promise<
  GenerateChapterResponse & { mockMode?: boolean; project?: GenerateChapterRequest["project"] }
> {
  const res = await fetch("/api/generate-chapter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project, chapterNumber } satisfies GenerateChapterRequest),
    signal,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Chapter generation failed");
  }
  return data;
}

export async function fetchRevisePlan(
  project: RevisePlanRequest["project"],
  instruction: string,
  signal?: AbortSignal
): Promise<RevisePlanResponse> {
  const res = await fetch("/api/revise-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project, instruction } satisfies RevisePlanRequest),
    signal,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Plan revision failed");
  }
  return data;
}

export async function fetchReviseChapter(
  project: ReviseChapterRequest["project"],
  chapterNumber: number,
  instruction: string,
  signal?: AbortSignal
): Promise<ReviseChapterResponse> {
  const res = await fetch("/api/revise-chapter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project,
      chapterNumber,
      instruction,
    } satisfies ReviseChapterRequest),
    signal,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Chapter revision failed");
  }
  return data;
}
