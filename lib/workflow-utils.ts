import { getAllChapters } from "./structure-utils";
import type {
  AgentId,
  ChapterDraftState,
  ChapterDraftStatus,
  PlanningElementId,
  PlanningElementState,
  StoryProject,
  WorkflowStage,
} from "./types";

const PLANNING_AGENT_IDS: AgentId[] = [
  "concept",
  "character",
  "worldbuilding",
  "plot",
  "chapter-outline",
];

const PLANNING_ELEMENT_META: {
  id: PlanningElementId;
  label: string;
  agentId: AgentId;
}[] = [
  { id: "concept", label: "Story Overview", agentId: "concept" },
  { id: "characters", label: "Characters", agentId: "character" },
  { id: "worldbuilding", label: "Worldbuilding", agentId: "worldbuilding" },
  { id: "plot", label: "Plot", agentId: "plot" },
  { id: "structure", label: "Structure", agentId: "chapter-outline" },
  { id: "styleGuide", label: "Style Guide", agentId: "chapter-outline" },
  { id: "foreshadowing", label: "Foreshadowing", agentId: "chapter-outline" },
];

function agentStatusToElementStatus(
  agentStatus: string
): PlanningElementState["status"] {
  if (agentStatus === "running") return "generating";
  if (agentStatus === "completed") return "completed";
  if (agentStatus === "failed") return "failed";
  return "pending";
}

function getPlanningElementData(
  project: StoryProject,
  id: PlanningElementId
): unknown {
  const bible = project.storyBible;
  switch (id) {
    case "concept":
      return bible.concept;
    case "characters":
      return bible.characters;
    case "worldbuilding":
      return bible.worldbuilding;
    case "plot":
      return bible.plot;
    case "structure":
      return { parts: bible.parts, chapters: bible.chapters };
    case "styleGuide":
      return bible.styleGuide;
    case "foreshadowing":
      return bible.foreshadowingTracker;
    default:
      return null;
  }
}

export function buildPlanningElements(
  project: StoryProject
): PlanningElementState[] {
  return PLANNING_ELEMENT_META.map(({ id, label, agentId }) => {
    const agent = project.agents.find((a) => a.id === agentId);
    const existing = project.planningElements?.find((e) => e.id === id);
    const agentStatus = agent?.status ?? "pending";
    let status = agentStatusToElementStatus(agentStatus);
    if (existing?.status === "edited") status = "edited";

    return {
      id,
      label,
      status,
      data: getPlanningElementData(project, id),
      error: id === "structure" ? agent?.error : existing?.error,
      lastGeneratedAt: agent?.completedAt ?? existing?.lastGeneratedAt,
      fallbackUsed: agent?.fallbackUsed ?? existing?.fallbackUsed,
    };
  });
}

export function buildChapterDraftStates(
  project: StoryProject
): ChapterDraftState[] {
  const chapters = getAllChapters(project);
  return chapters.map((ch) => {
    const existing = project.chapterDrafts?.find(
      (d) => d.chapterNumber === ch.number
    );
    const hasDraft = Boolean(ch.draft?.trim());
    let status: ChapterDraftStatus = existing?.status ?? "pending";
    if (existing?.status === "generating") {
      status = hasDraft ? "completed" : existing.status;
    } else if (hasDraft && status === "pending") {
      status = "completed";
    } else if (hasDraft && status === "failed") {
      status = "completed";
    }

    const draft = ch.draft ?? existing?.draft;
    const preview = draft
      ? draft.slice(0, 800) + (draft.length > 800 ? "…" : "")
      : undefined;

    return {
      chapterNumber: ch.number,
      partNumber: ch.partNumber,
      status,
      draft,
      preview,
      error: existing?.error,
      lastGeneratedAt: existing?.lastGeneratedAt,
      retryCount: existing?.retryCount,
      actualLength: draft?.length,
      needsRevision: ch.needsRevision ?? existing?.needsRevision,
    };
  });
}

export function deriveWorkflowStage(project: StoryProject): WorkflowStage {
  if (project.workflowStage) return project.workflowStage;

  const publisherDone =
    project.agents.find((a) => a.id === "publisher")?.status === "completed";
  if (publisherDone && project.manuscript?.trim()) return "final";

  const draftingAgent = project.agents.find((a) => a.id === "drafting");
  const hasAnyDraft = getAllChapters(project).some((ch) => ch.draft?.trim());
  const outlineDone =
    project.agents.find((a) => a.id === "chapter-outline")?.status ===
    "completed";

  if (
    draftingAgent?.status === "running" ||
    draftingAgent?.status === "completed" ||
    hasAnyDraft
  ) {
    return "drafting";
  }

  const planningDone = PLANNING_AGENT_IDS.every(
    (id) => project.agents.find((a) => a.id === id)?.status === "completed"
  );
  if (outlineDone || planningDone) return "planning";

  const anyPlanningStarted = PLANNING_AGENT_IDS.some(
    (id) =>
      project.agents.find((a) => a.id === id)?.status === "running" ||
      project.agents.find((a) => a.id === id)?.status === "completed"
  );
  if (anyPlanningStarted) return "planning";

  if (project.agents.some((a) => a.status !== "pending")) {
    return "planning";
  }

  return "launcher";
}

export function hydrateWorkflowFields(project: StoryProject): StoryProject {
  const workflowStage = project.workflowStage ?? deriveWorkflowStage(project);
  const planningElements = buildPlanningElements(project);
  const chapterDrafts = buildChapterDraftStates(project);
  return {
    ...project,
    workflowStage,
    planningElements,
    chapterDrafts,
  };
}

export function getChapterDraftState(
  project: StoryProject,
  chapterNumber: number
): ChapterDraftState | undefined {
  return project.chapterDrafts?.find((d) => d.chapterNumber === chapterNumber);
}

export function getMissingChapterNumbers(project: StoryProject): number[] {
  const chapters = getAllChapters(project);
  return chapters
    .filter((ch) => {
      const state = getChapterDraftState(project, ch.number);
      if (state?.status === "completed" || state?.status === "edited")
        return !ch.draft?.trim();
      return !ch.draft?.trim();
    })
    .map((ch) => ch.number);
}

export function getFailedChapterNumbers(project: StoryProject): number[] {
  return (
    project.chapterDrafts
      ?.filter((d) => d.status === "failed")
      .map((d) => d.chapterNumber) ?? []
  );
}

export function getCompletedChapterNumbers(project: StoryProject): number[] {
  return getAllChapters(project)
    .filter((ch) => {
      const state = getChapterDraftState(project, ch.number);
      if (state?.status === "completed" || state?.status === "edited")
        return Boolean(ch.draft?.trim());
      return Boolean(ch.draft?.trim());
    })
    .map((ch) => ch.number);
}

export function shouldSkipChapter(
  project: StoryProject,
  chapterNumber: number,
  forceRegenerate = false
): boolean {
  if (forceRegenerate) return false;
  const state = getChapterDraftState(project, chapterNumber);
  const ch = getAllChapters(project).find((c) => c.number === chapterNumber);
  const hasDraft = Boolean(ch?.draft?.trim());
  if (!hasDraft) return false;
  if (state?.status === "failed") return false;
  if (state?.status === "pending" || state?.status === "generating")
    return false;
  return (
    state?.status === "completed" ||
    state?.status === "edited" ||
    (hasDraft && !state)
  );
}

export function planningElementToAgentId(
  elementId: PlanningElementId
): AgentId {
  const meta = PLANNING_ELEMENT_META.find((m) => m.id === elementId);
  return meta?.agentId ?? "concept";
}

export function isPlanningComplete(project: StoryProject): boolean {
  return PLANNING_AGENT_IDS.every(
    (id) => project.agents.find((a) => a.id === id)?.status === "completed"
  );
}

export function mergeStoryBiblePatch(
  project: StoryProject,
  patch: Partial<import("./types").StoryBible>
): StoryProject {
  const bible = project.storyBible;
  const next = {
    ...bible,
    ...patch,
    concept: patch.concept !== undefined ? patch.concept : bible.concept,
    characters: patch.characters ?? bible.characters,
    worldbuilding:
      patch.worldbuilding !== undefined ? patch.worldbuilding : bible.worldbuilding,
    plot: patch.plot !== undefined ? patch.plot : bible.plot,
    styleGuide:
      patch.styleGuide !== undefined ? patch.styleGuide : bible.styleGuide,
    foreshadowingTracker:
      patch.foreshadowingTracker ?? bible.foreshadowingTracker,
    parts: patch.parts ?? bible.parts,
    chapters: patch.chapters ?? bible.chapters,
  };
  return hydrateWorkflowFields({
    ...project,
    storyBible: next,
    updatedAt: new Date().toISOString(),
  });
}
