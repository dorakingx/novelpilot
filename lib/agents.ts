import { buildCompleteManuscript } from "./format-manuscript";
import { parseContinuityReport, parseForeshadowingItems } from "./parse-agent-output";
import type {
  AgentId,
  AgentStep,
  Chapter,
  Character,
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

export function createInitialProject(settings: ProjectSettings): StoryProject {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: "Untitled Project",
    userPrompt: settings.userPrompt,
    language: settings.language,
    genre: settings.genre,
    tone: settings.tone,
    targetLength: settings.targetLength,
    createdAt: now,
    updatedAt: now,
    agents: createInitialAgents(),
    storyBible: {
      ...EMPTY_STORY_BIBLE,
      genre: settings.genre,
      tone: settings.tone,
      targetAudience: audienceForLength(settings.targetLength),
    },
    manuscript: "",
    reports: { ...EMPTY_REPORTS },
  };
}

function audienceForLength(targetLength: ProjectSettings["targetLength"]): string {
  switch (targetLength) {
    case "flash-fiction":
      return "Readers seeking a complete emotional arc under 1,000 words";
    case "short-story":
      return "Magazine and anthology readers of literary genre fiction";
    case "novella-outline":
      return "Editors and beta readers evaluating a novella-length project";
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
  const priorAgents = project.agents.filter(
    (a) =>
      getAgentIndex(a.id) < getAgentIndex(agentId) && a.status === "completed"
  );

  return {
    userPrompt: project.userPrompt,
    language: project.language,
    genre: project.genre,
    tone: project.tone,
    targetLength: project.targetLength,
    storyBible: project.storyBible,
    manuscript: project.manuscript,
    reports: project.reports,
    priorOutputs: Object.fromEntries(
      priorAgents.map((a) => [a.id, a.output])
    ),
  };
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

function parseDraftingOutput(
  o: Record<string, unknown>,
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

    const chapters: Chapter[] =
      bible.chapters.length > 0
        ? bible.chapters.map((ch) => {
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

    const completeFromOutput = String(o.completeManuscript ?? "").trim();
    const draftedForManuscript = chapters
      .filter((c) => c.draft?.trim())
      .map((c) => ({
        number: c.number,
        title: c.title,
        draft: c.draft!,
      }));
    const manuscript =
      completeFromOutput || buildCompleteManuscript(draftedForManuscript);

    const title = drafts[0]?.title;
    return { manuscript, bible: { ...bible, chapters }, title };
  }

  const draft = String(o.draft ?? "");
  let chapters = bible.chapters;
  if (chapters.length > 0) {
    chapters = chapters.map((ch, i) =>
      i === 0 ? { ...ch, draft } : ch
    );
  }
  const title = String(o.title ?? "");
  return { manuscript: draft, bible: { ...bible, chapters }, title };
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
  const o = output as Record<string, unknown>;

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
      if (Array.isArray(o.chapters)) {
        bible.chapters = (
          o.chapters as Array<Record<string, unknown>>
        ).map((ch) => ({
          number: Number(ch.number ?? 0),
          title: String(ch.title ?? ""),
          purpose: String(ch.purpose ?? ""),
          emotionalTurn: String(ch.emotionalTurn ?? ""),
          keyEvents: Array.isArray(ch.keyEvents)
            ? ch.keyEvents.map(String)
            : [],
          foreshadowing: Array.isArray(ch.foreshadowing)
            ? ch.foreshadowing.map(String)
            : [],
        }));
      }
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
      break;
    }
    case "drafting": {
      const parsed = parseDraftingOutput(o, bible);
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
    bible.styleGuide = null;
  }
  if (idx <= getAgentIndex("drafting")) {
    manuscript = "";
    bible.chapters = bible.chapters.map((ch) => {
      const { draft, ...rest } = ch;
      void draft;
      return rest;
    });
  }
  if (idx <= getAgentIndex("editor")) reports.editor = null;
  if (idx <= getAgentIndex("continuity")) reports.continuity = null;
  if (idx <= getAgentIndex("publisher")) reports.publisher = null;

  return {
    ...project,
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
