export type Language = "en" | "ja";
export type Genre =
  | "sci-fi"
  | "mystery"
  | "fantasy"
  | "literary"
  | "romance"
  | "horror";
export type Tone =
  | "melancholic"
  | "hopeful"
  | "dark"
  | "whimsical"
  | "tense";
export type TargetLength =
  | "flash-fiction"
  | "short-story"
  | "novella-outline";
export type AgentStatus = "pending" | "running" | "completed" | "failed";

export type AgentId =
  | "concept"
  | "character"
  | "worldbuilding"
  | "plot"
  | "chapter-outline"
  | "drafting"
  | "editor"
  | "continuity"
  | "publisher";

export type ForeshadowingStatus = "planned" | "unresolved" | "paid-off";

export interface ForeshadowingItem {
  item: string;
  introducedIn: string;
  status: ForeshadowingStatus;
  suggestedPayoff: string;
  payoffChapter: string;
  emotionalPurpose: string;
}

export interface Character {
  name: string;
  role: string;
  desire: string;
  fear: string;
  flaw: string;
  secret: string;
  arc: string;
  speechStyle: string;
}

export interface Chapter {
  number: number;
  title: string;
  purpose: string;
  emotionalTurn: string;
  keyEvents: string[];
  foreshadowing: string[];
  draft?: string;
}

export interface StoryConcept {
  logline: string;
  coreTheme: string;
  centralConflict: string;
  emotionalPromise: string;
  uniqueHook: string;
}

export interface Worldbuilding {
  setting: string;
  rules: string;
  socialContext: string;
  atmosphere: string;
  locations: string[];
  symbols: string[];
}

export interface PlotStructure {
  beginning: string;
  middle: string;
  climax: string;
  ending: string;
  twists: string[];
  foreshadowingPlan: string[];
}

export interface StyleGuide {
  pov: string;
  tense: string;
  proseStyle: string;
  dialogueNotes: string;
  taboos: string[];
}

export interface StoryBible {
  concept: StoryConcept | null;
  theme: string;
  genre: string;
  tone: string;
  targetAudience: string;
  characters: Character[];
  worldbuilding: Worldbuilding | null;
  plot: PlotStructure | null;
  chapters: Chapter[];
  styleGuide: StyleGuide | null;
  foreshadowingTracker: ForeshadowingItem[];
}

export interface EditorReport {
  strengths: string[];
  weakPoints: string[];
  pacingIssues: string[];
  dialogueIssues: string[];
  emotionalClarityIssues: string[];
  revisionSuggestions: string[];
}

export type ContinuityCategory =
  | "character"
  | "timeline"
  | "foreshadowing"
  | "worldbuilding"
  | "motif";

export type ContinuitySeverity = "low" | "medium" | "high";

export interface ContinuityIssue {
  category: ContinuityCategory;
  severity: ContinuitySeverity;
  issue: string;
  evidence: string;
  suggestedFix: string;
}

export interface ContinuityReport {
  issues: ContinuityIssue[];
  unresolvedForeshadowing: ForeshadowingItem[];
  repeatedMotifs: string[];
  missingPayoffs: string[];
  overallDiagnosis: string;
}

export interface PublisherPackage {
  titleIdeas: string[];
  shortSummary: string;
  longSummary: string;
  logline: string;
  tagline: string;
  socialPost: string;
  submissionDescription: string;
}

export interface ProjectReports {
  editor: EditorReport | null;
  continuity: ContinuityReport | null;
  publisher: PublisherPackage | null;
}

export interface AgentStep {
  id: AgentId;
  name: string;
  role: string;
  status: AgentStatus;
  input: Record<string, unknown>;
  output: unknown;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  approved?: boolean;
}

export interface StoryProject {
  id: string;
  title: string;
  userPrompt: string;
  language: Language;
  genre: Genre;
  tone: Tone;
  targetLength: TargetLength;
  createdAt: string;
  updatedAt: string;
  agents: AgentStep[];
  storyBible: StoryBible;
  manuscript: string;
  reports: ProjectReports;
}

export interface ProjectSettings {
  userPrompt: string;
  language: Language;
  genre: Genre;
  tone: Tone;
  targetLength: TargetLength;
}

export interface GenerateAgentRequest {
  agentId: AgentId;
  project: StoryProject;
}

export interface GenerateAgentResponse {
  agentId: AgentId;
  output: unknown;
  storyBible: Partial<StoryBible>;
  manuscript?: string;
  reports?: Partial<ProjectReports>;
  mockMode: boolean;
}

export const EMPTY_STORY_BIBLE: StoryBible = {
  concept: null,
  theme: "",
  genre: "",
  tone: "",
  targetAudience: "",
  characters: [],
  worldbuilding: null,
  plot: null,
  chapters: [],
  styleGuide: null,
  foreshadowingTracker: [],
};

export const EMPTY_REPORTS: ProjectReports = {
  editor: null,
  continuity: null,
  publisher: null,
};
