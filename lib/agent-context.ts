import {
  buildCompleteManuscript,
  getDraftedChapters,
} from "./format-manuscript";
import { isLowCreditMode } from "./llm-config";
import { compactUserPrompt } from "./prompt-budget";
import { getAllChapters } from "./structure-utils";
import type {
  AgentId,
  Chapter,
  PartPlan,
  StoryConcept,
  StoryProject,
  StoryStructureSettings,
} from "./types";

const MANUSCRIPT_FULL_THRESHOLD = 12_000;
const EXCERPT_CHARS = 2000;
const PLOT_SUMMARY_MAX = 200;
const STRING_FIELD_MAX = 280;

function isOpenRouterLowCreditMode(provider: "openrouter" | "google" | "custom"): boolean {
  return isLowCreditMode() && provider === "openrouter";
}

function capLengthPlanForLowCredit(
  targetLength: number | undefined,
  language: StoryProject["language"]
): number | undefined {
  if (!targetLength || !isOpenRouterLowCreditMode("openrouter")) return targetLength;
  if (language === "ja") return Math.min(Math.max(targetLength, 3000), 4000);
  return Math.min(Math.max(targetLength, 1000), 1500);
}

function truncate(text: string, max: number): string {
  const s = String(text ?? "").trim();
  if (s.length <= max) return s;
  return s.slice(0, max);
}

function getCompletedAgentOutput(
  project: StoryProject,
  agentId: AgentId
): Record<string, unknown> | null {
  const agent = project.agents.find(
    (a) => a.id === agentId && a.status === "completed"
  );
  const raw = agent?.output;
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
}

export function structureSummary(
  structure: StoryStructureSettings
): Record<string, unknown> {
  return {
    presetId: structure.presetId,
    partCount: structure.partCount,
    totalChapterCount: structure.totalChapterCount,
    lengthUnit: structure.lengthUnit,
    chapterLengthPreset: structure.chapterLengthPreset,
  };
}

function conceptFromSources(project: StoryProject): StoryConcept | null {
  const out = getCompletedAgentOutput(project, "concept");
  if (out) {
    return {
      logline: String(out.logline ?? ""),
      coreTheme: String(out.coreTheme ?? ""),
      centralConflict: String(out.centralConflict ?? ""),
      emotionalPromise: String(out.emotionalPromise ?? ""),
      uniqueHook: String(out.uniqueHook ?? ""),
    };
  }
  return project.storyBible.concept;
}

function conceptSummaryFields(
  concept: StoryConcept | null
): Record<string, string> {
  if (!concept) {
    return { logline: "", coreTheme: "" };
  }
  return {
    logline: truncate(concept.logline, STRING_FIELD_MAX),
    coreTheme: truncate(concept.coreTheme, STRING_FIELD_MAX),
    centralConflict: truncate(concept.centralConflict, STRING_FIELD_MAX),
    uniqueHook: truncate(concept.uniqueHook, STRING_FIELD_MAX),
  };
}

function compactConceptFields(
  concept: StoryConcept | null
): Record<string, string> {
  if (!concept) {
    return {
      logline: "",
      coreTheme: "",
      centralConflict: "",
      uniqueHook: "",
    };
  }
  return {
    logline: truncate(concept.logline, STRING_FIELD_MAX),
    coreTheme: truncate(concept.coreTheme, STRING_FIELD_MAX),
    centralConflict: truncate(concept.centralConflict, STRING_FIELD_MAX),
    uniqueHook: truncate(concept.uniqueHook, STRING_FIELD_MAX),
  };
}

export function compactCharactersFromOutput(
  project: StoryProject,
  characterOut: Record<string, unknown> | null
): Array<{
  name: string;
  role: string;
  desire: string;
  fear: string;
  secret: string;
}> {
  const rows: Array<{
    name: string;
    role: string;
    desire: string;
    fear: string;
    secret: string;
  }> = [];

  const add = (raw: unknown, defaultRole: string) => {
    if (!raw || typeof raw !== "object") return;
    const c = raw as Record<string, unknown>;
    if (!c.name) return;
    rows.push({
      name: truncate(String(c.name), 80),
      role: truncate(String(c.role || defaultRole), 60),
      desire: truncate(String(c.desire ?? ""), STRING_FIELD_MAX),
      fear: truncate(String(c.fear ?? ""), STRING_FIELD_MAX),
      secret: truncate(String(c.secret ?? ""), STRING_FIELD_MAX),
    });
  };

  if (characterOut) {
    add(characterOut.protagonist, "protagonist");
    add(characterOut.antagonist, "antagonist");
    if (Array.isArray(characterOut.supporting)) {
      for (const s of characterOut.supporting) add(s, "supporting");
    }
  }

  if (rows.length === 0) {
    for (const c of project.storyBible.characters.slice(0, 8)) {
      rows.push({
        name: truncate(c.name, 80),
        role: truncate(c.role, 60),
        desire: truncate(c.desire, STRING_FIELD_MAX),
        fear: truncate(c.fear, STRING_FIELD_MAX),
        secret: truncate(c.secret, STRING_FIELD_MAX),
      });
    }
  }

  return rows;
}

function characterBriefsFromProject(project: StoryProject): Array<{
  name: string;
  role: string;
  desire: string;
  fear: string;
}> {
  const out = getCompletedAgentOutput(project, "character");
  const full = compactCharactersFromOutput(project, out);
  return full.map(({ name, role, desire, fear }) => ({
    name,
    role,
    desire,
    fear,
  }));
}

function characterNamesAndRoles(
  project: StoryProject
): Array<{ name: string; role: string }> {
  return compactCharactersFromOutput(
    project,
    getCompletedAgentOutput(project, "character")
  ).map(({ name, role }) => ({ name, role }));
}

function plotSummaryFromSources(project: StoryProject): Record<string, unknown> {
  const out = getCompletedAgentOutput(project, "plot");
  const plot = project.storyBible.plot;
  const source = out ?? plot;
  if (!source || typeof source !== "object") {
    return {};
  }
  const p = source as Record<string, unknown>;
  return {
    beginning: truncate(String(p.beginning ?? ""), PLOT_SUMMARY_MAX),
    middle: truncate(String(p.middle ?? ""), PLOT_SUMMARY_MAX),
    climax: truncate(String(p.climax ?? ""), PLOT_SUMMARY_MAX),
    ending: truncate(String(p.ending ?? ""), PLOT_SUMMARY_MAX),
    twists: Array.isArray(p.twists)
      ? (p.twists as string[]).slice(0, 3).map((t) => truncate(String(t), 120))
      : [],
  };
}

function worldbuildingCompact(project: StoryProject): Record<string, unknown> {
  const out = getCompletedAgentOutput(project, "worldbuilding");
  const wb = project.storyBible.worldbuilding;
  const source = out ?? wb;
  if (!source || typeof source !== "object") {
    return {
      setting: "",
      rules: "",
      atmosphere: "",
      locations: [],
      symbols: [],
    };
  }
  const w = source as Record<string, unknown>;
  return {
    setting: truncate(String(w.setting ?? ""), STRING_FIELD_MAX),
    rules: truncate(String(w.rules ?? ""), STRING_FIELD_MAX),
    atmosphere: truncate(String(w.atmosphere ?? ""), STRING_FIELD_MAX),
    locations: Array.isArray(w.locations)
      ? (w.locations as string[]).slice(0, 6).map((l) => truncate(String(l), 80))
      : [],
    symbols: Array.isArray(w.symbols)
      ? (w.symbols as string[]).slice(0, 6).map((s) => truncate(String(s), 80))
      : [],
  };
}

function worldBrief(project: StoryProject): Record<string, string> {
  const w = worldbuildingCompact(project);
  return {
    setting: String(w.setting ?? ""),
    atmosphere: String(w.atmosphere ?? ""),
    rules: truncate(String(w.rules ?? ""), 160),
  };
}

function plotBrief(project: StoryProject): Record<string, string> {
  const p = plotSummaryFromSources(project);
  return {
    beginning: String(p.beginning ?? ""),
    climax: String(p.climax ?? ""),
    ending: String(p.ending ?? ""),
  };
}

function baseSettings(project: StoryProject): Record<string, unknown> {
  return {
    language: project.language,
    genre: project.genre,
    tone: project.tone,
  };
}

export function buildConceptContext(
  project: StoryProject
): Record<string, unknown> {
  return {
    ...baseSettings(project),
    userPrompt: compactUserPrompt(project.userPrompt),
    structureSummary: structureSummary(project.structure),
  };
}

export function buildCharacterContext(
  project: StoryProject
): Record<string, unknown> {
  return {
    ...baseSettings(project),
    userPrompt: compactUserPrompt(project.userPrompt),
    concept: compactConceptFields(conceptFromSources(project)),
  };
}

export function buildWorldbuildingContext(
  project: StoryProject
): Record<string, unknown> {
  return {
    ...baseSettings(project),
    userPrompt: compactUserPrompt(project.userPrompt),
    concept: compactConceptFields(conceptFromSources(project)),
    characters: compactCharactersFromOutput(
      project,
      getCompletedAgentOutput(project, "character")
    ),
  };
}

export function buildPlotContext(
  project: StoryProject
): Record<string, unknown> {
  return {
    ...baseSettings(project),
    userPrompt: compactUserPrompt(project.userPrompt),
    concept: compactConceptFields(conceptFromSources(project)),
    characters: compactCharactersFromOutput(
      project,
      getCompletedAgentOutput(project, "character")
    ),
    worldbuilding: worldbuildingCompact(project),
    structureSummary: structureSummary(project.structure),
  };
}

export function buildChapterOutlineContext(
  project: StoryProject,
  skeleton: PartPlan[]
): Record<string, unknown> {
  return {
    ...baseSettings(project),
    userPrompt: compactUserPrompt(project.userPrompt, 2000),
    structureSkeleton: skeleton.map((part) => ({
      number: part.number,
      chapters: part.chapters.map((ch) => ({
        number: ch.number,
        partNumber: ch.partNumber ?? part.number,
        role: ch.role ?? "",
        lengthPlan: ch.lengthPlan,
      })),
    })),
    conceptSummary: conceptSummaryFields(conceptFromSources(project)),
    characterNamesAndRoles: characterNamesAndRoles(project),
    plotSummary: plotSummaryFromSources(project),
  };
}

function compactChapterOutlineRow(ch: Chapter): Record<string, unknown> {
  return {
    number: ch.number,
    title: truncate(ch.title, 120),
    purpose: truncate(ch.purpose, 160),
    role: ch.role ?? "",
    emotionalTurn: truncate(ch.emotionalTurn, 120),
  };
}

function priorChapterEndingExcerpt(
  draft: string,
  language: StoryProject["language"]
): string {
  const text = draft.trim();
  if (!text) return "";
  if (language === "en") {
    const words = text.split(/\s+/).filter(Boolean);
    const tail = words.slice(-100).join(" ");
    return tail.length > 600 ? tail.slice(-600) : tail;
  }
  return text.length > 300 ? text.slice(-300) : text;
}

export function buildDraftingContext(
  project: StoryProject,
  chapterNumber: number
): Record<string, unknown> {
  const chapters = getAllChapters(project);
  const target = chapters.find((c) => c.number === chapterNumber);
  if (!target) {
    throw new Error(`Chapter ${chapterNumber} not found in outline`);
  }

  const prior = chapters.filter((c) => c.number < chapterNumber);
  const immediatePrior = prior.find((c) => c.number === chapterNumber - 1);

  const cappedTarget = capLengthPlanForLowCredit(
    target.lengthPlan?.targetLength,
    project.language
  );
  const cappedLengthPlan = target.lengthPlan
    ? {
        ...target.lengthPlan,
        targetLength: cappedTarget ?? target.lengthPlan.targetLength,
      }
    : target.lengthPlan;

  return {
    userPromptSummary: compactUserPrompt(project.userPrompt),
    ...baseSettings(project),
    storyConceptSummary: conceptSummaryFields(conceptFromSources(project)),
    characterBriefs: characterBriefsFromProject(project),
    worldBrief: worldBrief(project),
    plotBrief: plotBrief(project),
    allChapterOutlineCompact: chapters.map(compactChapterOutlineRow),
    currentChapter: {
      number: target.number,
      title: target.title,
      purpose: target.purpose,
      role: target.role ?? "",
      emotionalTurn: target.emotionalTurn,
      keyEvents: (target.keyEvents ?? []).slice(0, 5),
      foreshadowing: (target.foreshadowing ?? []).slice(0, 3),
      lengthPlan: cappedLengthPlan,
    },
    previousChapterSummaries: prior.map((ch) => ({
      number: ch.number,
      title: truncate(ch.title, 120),
      summary: truncate(ch.chapterSummary ?? "", 400),
    })),
    previousChapterEndingExcerpt: immediatePrior?.draft
      ? priorChapterEndingExcerpt(immediatePrior.draft, project.language)
      : "",
  };
}

function chapterSummariesList(
  project: StoryProject
): Array<{ number: number; title: string; summary: string }> {
  return getAllChapters(project).map((ch) => ({
    number: ch.number,
    title: truncate(ch.title, 120),
    summary: truncate(
      ch.chapterSummary ?? ch.purpose ?? "",
      400
    ),
  }));
}

function manuscriptText(project: StoryProject): string {
  if (getDraftedChapters(project).length > 0) {
    return buildCompleteManuscript(project);
  }
  return project.manuscript?.trim() ?? "";
}

export function sliceExcerpt(text: string, maxChars: number): string {
  const s = text.trim();
  if (s.length <= maxChars) return s;
  return s.slice(0, maxChars);
}

export function endingExcerpt(text: string, maxChars = EXCERPT_CHARS): string {
  const s = text.trim();
  if (s.length <= maxChars) return s;
  return s.slice(-maxChars);
}

function manuscriptExcerpts(text: string): {
  beginning: string;
  midpoint: string;
  ending: string;
} {
  const s = text.trim();
  if (!s) {
    return { beginning: "", midpoint: "", ending: "" };
  }
  const midStart = Math.max(0, Math.floor(s.length / 2) - EXCERPT_CHARS / 2);
  return {
    beginning: sliceExcerpt(s, EXCERPT_CHARS),
    midpoint: s.slice(midStart, midStart + EXCERPT_CHARS),
    ending: endingExcerpt(s, EXCERPT_CHARS),
  };
}

function lengthStats(manuscript: string, language: StoryProject["language"]) {
  const chars = manuscript.replace(/\s/g, "").length;
  const words = manuscript.split(/\s+/).filter(Boolean).length;
  return {
    characterCount: chars,
    wordCount: words,
    unit: language === "ja" ? "characters" : "words",
  };
}

export function buildEditorContext(
  project: StoryProject
): Record<string, unknown> {
  const manuscript = manuscriptText(project);
  const summaries = chapterSummariesList(project);
  const base: Record<string, unknown> = {
    ...baseSettings(project),
    storyConceptSummary: conceptSummaryFields(conceptFromSources(project)),
    chapterSummaries: summaries,
    lengthStats: lengthStats(manuscript, project.language),
  };

  if (manuscript.length <= MANUSCRIPT_FULL_THRESHOLD) {
    return { ...base, manuscriptExcerptOrFullIfSmall: manuscript };
  }

  const editorReport = project.reports.editor;
  return {
    ...base,
    manuscriptExcerptOrFullIfSmall: undefined,
    beginningExcerpt: sliceExcerpt(manuscript, EXCERPT_CHARS),
    endingExcerpt: endingExcerpt(manuscript, EXCERPT_CHARS),
    flaggedIssues: editorReport
      ? {
          weakPoints: (editorReport.weakPoints ?? []).slice(0, 5),
          pacingIssues: (editorReport.pacingIssues ?? []).slice(0, 5),
        }
      : undefined,
  };
}

export function buildContinuityContext(
  project: StoryProject
): Record<string, unknown> {
  const manuscript = manuscriptText(project);
  const tracker =
    project.storyBible.foreshadowingTracker?.slice(0, 8) ??
    [];

  const base: Record<string, unknown> = {
    conceptSummary: conceptSummaryFields(conceptFromSources(project)),
    charactersCompact: compactCharactersFromOutput(
      project,
      getCompletedAgentOutput(project, "character")
    ),
    plotSummary: plotSummaryFromSources(project),
    foreshadowingTracker: tracker,
    chapterSummaries: chapterSummariesList(project),
  };

  if (manuscript.length <= MANUSCRIPT_FULL_THRESHOLD) {
    return {
      ...base,
      manuscriptExcerpts: manuscriptExcerpts(manuscript),
    };
  }

  return {
    ...base,
    manuscriptExcerpts: manuscriptExcerpts(manuscript),
  };
}

export function buildPublisherContext(
  project: StoryProject
): Record<string, unknown> {
  const manuscript = manuscriptText(project);
  const concept = conceptFromSources(project);
  const plot = plotSummaryFromSources(project);

  const finalSynopsis = [
    concept?.logline,
    plot.ending ? `Ending: ${plot.ending}` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    title: project.title,
    ...baseSettings(project),
    conceptSummary: conceptSummaryFields(concept),
    charactersCompact: compactCharactersFromOutput(
      project,
      getCompletedAgentOutput(project, "character")
    ),
    plotSummary: plot,
    finalSynopsis: truncate(finalSynopsis, 600),
    manuscriptEndingExcerpt: endingExcerpt(manuscript, EXCERPT_CHARS),
  };
}

export function buildAgentContextForId(
  project: StoryProject,
  agentId: AgentId,
  skeleton?: PartPlan[]
): Record<string, unknown> {
  switch (agentId) {
    case "concept":
      return buildConceptContext(project);
    case "character":
      return buildCharacterContext(project);
    case "worldbuilding":
      return buildWorldbuildingContext(project);
    case "plot":
      return buildPlotContext(project);
    case "chapter-outline":
      if (!skeleton) {
        throw new Error("chapter-outline context requires skeleton");
      }
      return buildChapterOutlineContext(project, skeleton);
    case "drafting":
      return {
        userPromptSummary: compactUserPrompt(project.userPrompt),
        ...baseSettings(project),
        storyConceptSummary: conceptSummaryFields(conceptFromSources(project)),
        characterBriefs: characterBriefsFromProject(project),
        worldBrief: worldBrief(project),
        plotBrief: plotBrief(project),
        allChapterOutlineCompact: getAllChapters(project).map(
          compactChapterOutlineRow
        ),
      };
    case "editor":
      return buildEditorContext(project);
    case "continuity":
      return buildContinuityContext(project);
    case "publisher":
      return buildPublisherContext(project);
    default:
      return buildConceptContext(project);
  }
}
