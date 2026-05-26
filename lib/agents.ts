import { normalizeAiModel } from "./ai-model-utils";
import { buildAgentContextForId } from "./agent-context";
import {
  buildCompleteManuscript,
  rebuildProjectManuscript,
} from "./format-manuscript";
import { getAllChapters } from "./structure-utils";
import { normalizeAgentOutput } from "./normalize-agent-output";
import { parseContinuityReport, parseForeshadowingItems } from "./parse-agent-output";
import { syncStructureTotal } from "./length-planning";
import { presetToTargetLength } from "./structure-chapter-defaults";
import { buildDefaultStructure } from "./structure-presets";
import {
  flattenPartsToChapters,
  mergePreservedChapterPlans,
  parseChapterFromRaw,
  parsePartFromRaw,
  syncPartsAndChapters,
  wrapChaptersInSinglePart,
} from "./structure-utils";
import type {
  AgentId,
  AgentStep,
  Chapter,
  Character,
  LlmProviderId,
  ProjectSettings,
  StoryBible,
  StoryProject,
} from "./types";
import {
  EMPTY_REPORTS,
  EMPTY_STORY_BIBLE,
  type ProjectReports,
} from "./types";

export interface AgentDefinition {
  id: AgentId;
  name: string;
  role: string;
}

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    id: "concept",
    name: "Premise Architect",
    role: "Distills your prompt into logline, theme, central conflict, and a unique hook.",
  },
  {
    id: "character",
    name: "Character Director",
    role: "Casts protagonist, antagonist, and supporting characters with desire, fear, flaw, and arc.",
  },
  {
    id: "worldbuilding",
    name: "World Builder",
    role: "Builds setting, rules, social context, atmosphere, locations, and symbols.",
  },
  {
    id: "plot",
    name: "Plot Strategist",
    role: "Structures beginning, middle, climax, ending, twists, and foreshadowing seeds.",
  },
  {
    id: "chapter-outline",
    name: "Chapter Architect",
    role: "Breaks the plot into chapters and maps foreshadowing threads with payoff plans.",
  },
  {
    id: "drafting",
    name: "Prose Writer",
    role: "Writes full prose for all outlined chapters as a complete short novel in your chosen language and tone.",
  },
  {
    id: "editor",
    name: "Style Editor",
    role: "Reviews draft pacing, dialogue, emotion, and concrete revision suggestions.",
  },
  {
    id: "continuity",
    name: "Continuity Detective",
    role: "Audits inconsistencies, timeline, motifs, and unresolved foreshadowing.",
  },
  {
    id: "publisher",
    name: "Publisher Agent",
    role: "Packages title ideas, summaries, logline, tagline, and submission copy.",
  },
];

function generateId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createInitialAgents(): AgentStep[] {
  return AGENT_DEFINITIONS.map((def) => ({
    id: def.id,
    name: def.name,
    role: def.role,
    status: "pending" as const,
    input: {},
    output: null,
  }));
}

export function createInitialProject(
  settings: ProjectSettings,
  options?: { requiresStructureApproval?: boolean }
): StoryProject {
  const now = new Date().toISOString();
  const structure = syncStructureTotal(
    settings.structure ?? buildDefaultStructure(settings.language, "short-3")
  );
  const targetLength =
    settings.targetLength ?? presetToTargetLength(structure.presetId);
  const seedParts = structure.parts?.length ? structure.parts : [];
  const seedChapters = flattenPartsToChapters(seedParts);

  return {
    id: generateId(),
    title: "Untitled Project",
    userPrompt: settings.userPrompt,
    language: settings.language,
    genre: settings.genre,
    tone: settings.tone,
    targetLength,
    structure,
    createdAt: now,
    updatedAt: now,
    agents: createInitialAgents(),
    storyBible: {
      ...EMPTY_STORY_BIBLE,
      genre: settings.genre,
      tone: settings.tone,
      targetAudience: audienceForPreset(structure.presetId),
      parts: seedParts,
      chapters: seedChapters,
    },
    manuscript: "",
    reports: { ...EMPTY_REPORTS },
    requiresStructureApproval: options?.requiresStructureApproval ?? true,
    structureApproved: false,
    awaitingStructureApproval: false,
    aiModel: normalizeAiModel(settings.aiModel),
  };
}

function audienceForPreset(
  presetId: ProjectSettings["structure"]["presetId"]
): string {
  switch (presetId) {
    case "short-3":
      return "Magazine and anthology readers of literary genre fiction";
    case "novella-6":
      return "Editors and beta readers evaluating a novella-length project";
    case "serial-12":
      return "Readers following a serialized novel with episodic chapters";
    default:
      return "General fiction readers";
  }
}

export function getAgentIndex(agentId: AgentId): number {
  return AGENT_DEFINITIONS.findIndex((a) => a.id === agentId);
}

export function buildAgentContext(
  project: StoryProject,
  agentId: AgentId
): Record<string, unknown> {
  return buildAgentContextForId(project, agentId);
}

function parseCharacter(raw: Record<string, unknown>): Character {
  return {
    name: String(raw.name ?? ""),
    role: String(raw.role ?? ""),
    desire: String(raw.desire ?? ""),
    fear: String(raw.fear ?? ""),
    flaw: String(raw.flaw ?? ""),
    secret: String(raw.secret ?? ""),
    arc: String(raw.arc ?? ""),
    speechStyle: String(raw.speechStyle ?? ""),
  };
}

function applyChapterDraftToBible(
  bible: StoryBible,
  chapterNumber: number,
  patch: {
    draft: string;
    title?: string;
    chapterSummary?: string;
    continuityNotes?: string[];
  }
): StoryBible {
  const updateChapter = (ch: Chapter): Chapter =>
    ch.number === chapterNumber
      ? {
          ...ch,
          draft: patch.draft,
          title: patch.title ?? ch.title,
          chapterSummary: patch.chapterSummary ?? ch.chapterSummary,
          continuityNotes: patch.continuityNotes ?? ch.continuityNotes,
        }
      : ch;

  const flatChapters =
    bible.chapters.length > 0
      ? bible.chapters.map(updateChapter)
      : flattenPartsToChapters(bible.parts).map(updateChapter);

  const synced = syncPartsAndChapters(
    bible.parts?.length ? bible.parts : wrapChaptersInSinglePart(flatChapters),
    flatChapters
  );

  return { ...bible, parts: synced.parts, chapters: synced.chapters };
}

function manuscriptForBible(
  project: StoryProject,
  bible: StoryBible
): string {
  return buildCompleteManuscript({ ...project, storyBible: bible });
}

function parseDraftingOutput(
  o: Record<string, unknown>,
  project: StoryProject,
  bible: StoryBible
): { manuscript: string; bible: StoryBible; title?: string } {
  if (Array.isArray(o.chapters) && o.chapters.length > 0) {
    const drafts = o.chapters
      .map((ch) => {
        const c = ch as Record<string, unknown>;
        return {
          number: Number(c.number ?? 0),
          title: String(c.title ?? ""),
          draft: String(c.draft ?? ""),
        };
      })
      .filter((d) => d.number > 0 && d.draft.trim());

    const draftByNumber = new Map(drafts.map((d) => [d.number, d]));

    const outlineChapters = getAllChapters({ ...project, storyBible: bible });
    const chapters: Chapter[] =
      outlineChapters.length > 0
        ? outlineChapters.map((ch) => {
            const d = draftByNumber.get(ch.number);
            if (d) {
              return {
                ...ch,
                draft: d.draft,
                title: d.title || ch.title,
              };
            }
            return ch;
          })
        : drafts.map((d) => ({
            number: d.number,
            title: d.title,
            purpose: "",
            emotionalTurn: "",
            keyEvents: [],
            foreshadowing: [],
            draft: d.draft,
          }));

    const synced = syncPartsAndChapters(
      bible.parts?.length ? bible.parts : wrapChaptersInSinglePart(chapters),
      chapters
    );
    const nextBible = { ...bible, parts: synced.parts, chapters: synced.chapters };
    const manuscript = manuscriptForBible(project, nextBible);

    const title = drafts[0]?.title;
    return {
      manuscript,
      bible: nextBible,
      title,
    };
  }

  const number = Number(o.number ?? 1);
  const draft = String(o.draft ?? "");
  const nextBible = applyChapterDraftToBible(bible, number, {
    draft,
    title: String(o.title ?? ""),
    chapterSummary: String(o.chapterSummary ?? ""),
    continuityNotes: Array.isArray(o.continuityNotes)
      ? o.continuityNotes.map(String)
      : [],
  });
  const title = String(o.title ?? "");

  return {
    manuscript: manuscriptForBible(project, nextBible),
    bible: nextBible,
    title: title || undefined,
  };
}

export function mergeChapterDraftOutput(
  project: StoryProject,
  output: unknown
): StoryProject {
  const o = output as Record<string, unknown>;
  const number = Number(o.number ?? 0);
  if (!number) return project;

  const bible = applyChapterDraftToBible(project.storyBible, number, {
    draft: String(o.draft ?? ""),
    title: String(o.title ?? ""),
    chapterSummary: String(o.chapterSummary ?? ""),
    continuityNotes: Array.isArray(o.continuityNotes)
      ? o.continuityNotes.map(String)
      : [],
  });

  const title =
    number === 1 && project.title === "Untitled Project"
      ? String(o.title ?? "")
      : undefined;

  return {
    ...rebuildProjectManuscript({ ...project, storyBible: bible }),
    ...(title ? { title } : {}),
  };
}

export function mergeAgentOutput(
  project: StoryProject,
  agentId: AgentId,
  output: unknown
): StoryProject {
  const now = new Date().toISOString();
  let bible: StoryBible = { ...project.storyBible };
  let manuscript = project.manuscript;
  const reports: ProjectReports = { ...project.reports };
  const normalized = normalizeAgentOutput(agentId, output, project);
  const o = normalized as Record<string, unknown>;

  switch (agentId) {
    case "concept": {
      bible.concept = {
        logline: String(o.logline ?? ""),
        coreTheme: String(o.coreTheme ?? ""),
        centralConflict: String(o.centralConflict ?? ""),
        emotionalPromise: String(o.emotionalPromise ?? ""),
        uniqueHook: String(o.uniqueHook ?? ""),
      };
      bible.theme = String(o.coreTheme ?? bible.theme);
      break;
    }
    case "character": {
      const chars: Character[] = [];
      if (o.protagonist)
        chars.push(parseCharacter(o.protagonist as Record<string, unknown>));
      if (o.antagonist)
        chars.push(parseCharacter(o.antagonist as Record<string, unknown>));
      if (Array.isArray(o.supporting)) {
        for (const s of o.supporting) {
          chars.push(parseCharacter(s as Record<string, unknown>));
        }
      }
      bible.characters = chars;
      break;
    }
    case "worldbuilding": {
      bible.worldbuilding = {
        setting: String(o.setting ?? ""),
        rules: String(o.rules ?? ""),
        socialContext: String(o.socialContext ?? ""),
        atmosphere: String(o.atmosphere ?? ""),
        locations: Array.isArray(o.locations)
          ? o.locations.map(String)
          : [],
        symbols: Array.isArray(o.symbols) ? o.symbols.map(String) : [],
      };
      break;
    }
    case "plot": {
      bible.plot = {
        beginning: String(o.beginning ?? ""),
        middle: String(o.middle ?? ""),
        climax: String(o.climax ?? ""),
        ending: String(o.ending ?? ""),
        twists: Array.isArray(o.twists) ? o.twists.map(String) : [],
        foreshadowingPlan: Array.isArray(o.foreshadowingPlan)
          ? o.foreshadowingPlan.map(String)
          : [],
      };
      const plotTracker = parseForeshadowingItems(o.foreshadowingTracker);
      if (plotTracker.length > 0) {
        bible.foreshadowingTracker = plotTracker;
      }
      break;
    }
    case "chapter-outline": {
      try {
      const userParts = project.structure.parts?.length
        ? project.structure.parts
        : project.storyBible.parts ?? [];
      let parts = Array.isArray(o.parts)
        ? (o.parts as Array<Record<string, unknown>>).map((p) =>
            parsePartFromRaw(p, project.language)
          )
        : [];
      const flatChapters = Array.isArray(o.chapters)
        ? (o.chapters as Array<Record<string, unknown>>).map((ch) =>
            parseChapterFromRaw(ch, project.language)
          )
        : [];
      if (parts.length === 0 && flatChapters.length > 0) {
        parts = wrapChaptersInSinglePart(flatChapters);
      }
      if (userParts.length > 0) {
        parts = mergePreservedChapterPlans(userParts, parts);
      }
      const synced = syncPartsAndChapters(parts, flatChapters);
      bible.parts = synced.parts;
      bible.chapters = synced.chapters;
      const structureWithParts = syncStructureTotal({
        ...project.structure,
        parts: synced.parts,
        totalChapterCount: synced.chapters.length,
      });
      project = {
        ...project,
        structure: structureWithParts,
        structureFallbackUsed: Boolean(o.fallbackGenerated),
      };
      if (o.styleGuide) {
        const sg = o.styleGuide as Record<string, unknown>;
        bible.styleGuide = {
          pov: String(sg.pov ?? ""),
          tense: String(sg.tense ?? ""),
          proseStyle: String(sg.proseStyle ?? ""),
          dialogueNotes: String(sg.dialogueNotes ?? ""),
          taboos: Array.isArray(sg.taboos) ? sg.taboos.map(String) : [],
        };
      }
      const chapterTracker = parseForeshadowingItems(o.foreshadowingTracker);
      if (chapterTracker.length > 0) {
        bible.foreshadowingTracker = chapterTracker;
      }
      } catch (mergeErr) {
        const hint =
          mergeErr instanceof Error ? mergeErr.message : "Invalid structure";
        throw new Error(
          `Chapter Architect output could not be applied: ${hint}`
        );
      }
      break;
    }
    case "drafting": {
      const parsed = parseDraftingOutput(o, project, bible);
      manuscript = parsed.manuscript;
      bible = parsed.bible;
      if (parsed.title && project.title === "Untitled Project") {
        project = { ...project, title: parsed.title };
      }
      break;
    }
    case "editor": {
      reports.editor = {
        strengths: Array.isArray(o.strengths) ? o.strengths.map(String) : [],
        weakPoints: Array.isArray(o.weakPoints)
          ? o.weakPoints.map(String)
          : [],
        pacingIssues: Array.isArray(o.pacingIssues)
          ? o.pacingIssues.map(String)
          : [],
        dialogueIssues: Array.isArray(o.dialogueIssues)
          ? o.dialogueIssues.map(String)
          : [],
        emotionalClarityIssues: Array.isArray(o.emotionalClarityIssues)
          ? o.emotionalClarityIssues.map(String)
          : [],
        revisionSuggestions: Array.isArray(o.revisionSuggestions)
          ? o.revisionSuggestions.map(String)
          : [],
      };
      break;
    }
    case "continuity": {
      reports.continuity = parseContinuityReport(o, bible);
      break;
    }
    case "publisher": {
      reports.publisher = {
        titleIdeas: Array.isArray(o.titleIdeas)
          ? o.titleIdeas.map(String)
          : [],
        shortSummary: String(o.shortSummary ?? ""),
        longSummary: String(o.longSummary ?? ""),
        logline: String(o.logline ?? ""),
        tagline: String(o.tagline ?? ""),
        socialPost: String(o.socialPost ?? ""),
        submissionDescription: String(o.submissionDescription ?? ""),
      };
      const firstTitle = reports.publisher.titleIdeas[0];
      if (firstTitle) {
        project = { ...project, title: firstTitle };
      }
      break;
    }
  }

  const agents = project.agents.map((agent) => {
    if (agent.id !== agentId) return agent;
    return {
      ...agent,
      status: "completed" as const,
      output,
      completedAt: now,
      error: undefined,
    };
  });

  return {
    ...project,
    updatedAt: now,
    agents,
    storyBible: bible,
    manuscript,
    reports,
  };
}

export function resetFromAgent(
  project: StoryProject,
  agentId: AgentId
): StoryProject {
  const idx = getAgentIndex(agentId);
  const agents = project.agents.map((agent, i) => {
    if (i < idx) return agent;
    return {
      ...agent,
      status: "pending" as const,
      output: null,
      error: undefined,
      startedAt: undefined,
      completedAt: undefined,
      approved: undefined,
    };
  });

  let bible: StoryBible = { ...project.storyBible };
  let manuscript = project.manuscript;
  const reports: ProjectReports = { ...project.reports };

  if (idx <= getAgentIndex("concept")) {
    bible = {
      ...bible,
      concept: null,
      theme: project.genre ? bible.theme : "",
    };
  }
  if (idx <= getAgentIndex("character")) bible.characters = [];
  if (idx <= getAgentIndex("worldbuilding")) bible.worldbuilding = null;
  if (idx <= getAgentIndex("plot")) bible.plot = null;
  if (idx <= getAgentIndex("plot")) {
    bible.foreshadowingTracker = [];
  }
  if (idx <= getAgentIndex("chapter-outline")) {
    bible.chapters = [];
    bible.parts = [];
    bible.styleGuide = null;
  }
  if (idx <= getAgentIndex("drafting")) {
    manuscript = "";
    const stripDraft = (ch: Chapter): Chapter => {
      const {
        draft,
        chapterSummary,
        continuityNotes,
        ...rest
      } = ch;
      void draft;
      void chapterSummary;
      void continuityNotes;
      return rest;
    };
    bible.chapters = bible.chapters.map(stripDraft);
    bible.parts = bible.parts.map((part) => ({
      ...part,
      chapters: part.chapters.map(stripDraft),
    }));
  }
  if (idx <= getAgentIndex("editor")) reports.editor = null;
  if (idx <= getAgentIndex("continuity")) reports.continuity = null;
  if (idx <= getAgentIndex("publisher")) reports.publisher = null;

  const pipelineReset =
    idx <= getAgentIndex("chapter-outline")
      ? {
          structureApproved: false,
          awaitingStructureApproval: false,
          draftingProgress: undefined,
        }
      : idx <= getAgentIndex("drafting")
        ? { draftingProgress: undefined }
        : {};

  return {
    ...project,
    ...pipelineReset,
    updatedAt: new Date().toISOString(),
    agents,
    storyBible: bible,
    manuscript,
    reports,
  };
}

export function setAgentStatus(
  project: StoryProject,
  agentId: AgentId,
  status: AgentStep["status"],
  extra?: Partial<AgentStep>
): StoryProject {
  const now = new Date().toISOString();
  const agents = project.agents.map((agent) => {
    if (agent.id !== agentId) return agent;
    return {
      ...agent,
      status,
      ...extra,
      ...(status === "running" ? { startedAt: now } : {}),
      ...(status === "failed" ? { completedAt: now } : {}),
    };
  });
  return { ...project, updatedAt: now, agents };
}

export function setAgentRetryState(
  project: StoryProject,
  agentId: AgentId,
  retryCount: number,
  maxRetries: number,
  errorMessage?: string
): StoryProject {
  return setAgentStatus(project, agentId, "running", {
    retryCount,
    maxRetries,
    lastRetryError: errorMessage,
    error: undefined,
  });
}

export function clearAgentRetryState(
  project: StoryProject,
  agentId: AgentId
): StoryProject {
  const agents = project.agents.map((agent) => {
    if (agent.id !== agentId) return agent;
    return {
      ...agent,
      retryCount: undefined,
      maxRetries: undefined,
      lastRetryError: undefined,
    };
  });
  return { ...project, updatedAt: new Date().toISOString(), agents };
}

export function markAgentAutoRecovered(
  project: StoryProject,
  agentId: AgentId
): StoryProject {
  const agents = project.agents.map((agent) => {
    if (agent.id !== agentId) return agent;
    return {
      ...agent,
      autoRecovered: true,
      error: undefined,
      retryCount: undefined,
      lastRetryError: undefined,
    };
  });
  return { ...project, updatedAt: new Date().toISOString(), agents };
}

export function markAgentProviderFallback(
  project: StoryProject,
  agentId: AgentId,
  meta: {
    providerUsed: LlmProviderId;
    fallbackProviderUsed?: LlmProviderId;
  }
): StoryProject {
  const agents = project.agents.map((agent) => {
    if (agent.id !== agentId) return agent;
    return {
      ...agent,
      providerUsed: meta.providerUsed,
      fallbackProviderUsed: meta.fallbackProviderUsed,
      autoRecovered: Boolean(meta.fallbackProviderUsed),
    };
  });
  return { ...project, updatedAt: new Date().toISOString(), agents };
}

export function markAgentFallbackUsed(
  project: StoryProject,
  agentId: AgentId
): StoryProject {
  const agents = project.agents.map((agent) => {
    if (agent.id !== agentId) return agent;
    return {
      ...agent,
      status: "completed" as const,
      fallbackUsed: true,
      autoRecovered: true,
      error: undefined,
      retryCount: undefined,
      maxRetries: undefined,
      lastRetryError: undefined,
      completedAt: new Date().toISOString(),
    };
  });
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    agents,
    structureFallbackUsed: agentId === "chapter-outline" ? true : project.structureFallbackUsed,
  };
}
