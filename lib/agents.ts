import type {
  AgentId,
  AgentStep,
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
    name: "Concept Agent",
    role: "Distills the user prompt into a compelling story concept with theme, conflict, and hook.",
  },
  {
    id: "character",
    name: "Character Agent",
    role: "Creates protagonist, antagonist, and supporting cast with desires, fears, and arcs.",
  },
  {
    id: "worldbuilding",
    name: "Worldbuilding Agent",
    role: "Builds setting, rules, atmosphere, locations, and symbolic objects.",
  },
  {
    id: "plot",
    name: "Plot Agent",
    role: "Structures beginning, middle, climax, ending, twists, and foreshadowing plan.",
  },
  {
    id: "chapter-outline",
    name: "Chapter Outline Agent",
    role: "Breaks the plot into chapters with purpose, emotional turns, and key events.",
  },
  {
    id: "drafting",
    name: "Drafting Agent",
    role: "Writes chapter 1 fiction draft in the selected language and tone.",
  },
  {
    id: "editor",
    name: "Editor Agent",
    role: "Reviews the draft for strengths, weaknesses, pacing, and revision suggestions.",
  },
  {
    id: "continuity",
    name: "Continuity Agent",
    role: "Checks inconsistencies, foreshadowing, character behavior, and timeline.",
  },
  {
    id: "publisher",
    name: "Publisher Agent",
    role: "Packages title ideas, summaries, logline, tagline, and marketing copy.",
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

export function mergeAgentOutput(
  project: StoryProject,
  agentId: AgentId,
  output: unknown
): StoryProject {
  const now = new Date().toISOString();
  const bible = { ...project.storyBible };
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
      break;
    }
    case "drafting": {
      const draft = String(o.draft ?? "");
      manuscript = draft;
      if (bible.chapters.length > 0) {
        bible.chapters = bible.chapters.map((ch, i) =>
          i === 0 ? { ...ch, draft } : ch
        );
      }
      const title = String(o.title ?? "");
      if (title && project.title === "Untitled Project") {
        project = { ...project, title };
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
      reports.continuity = {
        inconsistencies: Array.isArray(o.inconsistencies)
          ? o.inconsistencies.map(String)
          : [],
        unresolvedForeshadowing: Array.isArray(o.unresolvedForeshadowing)
          ? o.unresolvedForeshadowing.map(String)
          : [],
        characterIssues: Array.isArray(o.characterIssues)
          ? o.characterIssues.map(String)
          : [],
        timelineIssues: Array.isArray(o.timelineIssues)
          ? o.timelineIssues.map(String)
          : [],
        suggestions: Array.isArray(o.suggestions)
          ? o.suggestions.map(String)
          : [],
        repeatedMotifs: Array.isArray(o.repeatedMotifs)
          ? o.repeatedMotifs.map(String)
          : [],
      };
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
  if (idx <= getAgentIndex("chapter-outline")) {
    bible.chapters = [];
    bible.styleGuide = null;
  }
  if (idx <= getAgentIndex("drafting")) manuscript = "";
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
