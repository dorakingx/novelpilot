import { parseContinuityReport, parseForeshadowingItems } from "./parse-agent-output";
import { normalizeChapterOutlineOutput } from "./normalize-chapter-outline";
import type { AgentId, StoryProject } from "./types";

const MAX_SHORT = 500;
const MAX_MEDIUM = 140;

function trimString(value: unknown, max = MAX_SHORT): string {
  const s = String(value ?? "").trim();
  return s.length > max ? s.slice(0, max) : s;
}

function trimStringArray(raw: unknown, maxItems: number, maxLen = MAX_MEDIUM): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => trimString(v, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeCharacterFields(raw: unknown): Record<string, string> {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    name: trimString(o.name, 80),
    role: trimString(o.role, 80),
    desire: trimString(o.desire),
    fear: trimString(o.fear),
    flaw: trimString(o.flaw),
    secret: trimString(o.secret),
    arc: trimString(o.arc),
    speechStyle: trimString(o.speechStyle, 120),
  };
}

export function normalizeAgentOutput(
  agentId: AgentId,
  parsed: unknown,
  project: StoryProject
): unknown {
  if (!parsed || typeof parsed !== "object") {
    return parsed;
  }

  const o = parsed as Record<string, unknown>;

  switch (agentId) {
    case "concept":
      return {
        logline: trimString(o.logline),
        coreTheme: trimString(o.coreTheme),
        centralConflict: trimString(o.centralConflict),
        emotionalPromise: trimString(o.emotionalPromise),
        uniqueHook: trimString(o.uniqueHook),
      };
    case "character":
      return {
        protagonist: normalizeCharacterFields(o.protagonist),
        antagonist: normalizeCharacterFields(o.antagonist),
        supporting: Array.isArray(o.supporting)
          ? o.supporting.slice(0, 2).map(normalizeCharacterFields)
          : [],
      };
    case "worldbuilding":
      return {
        setting: trimString(o.setting),
        rules: trimString(o.rules),
        socialContext: trimString(o.socialContext),
        atmosphere: trimString(o.atmosphere),
        locations: trimStringArray(o.locations, 6),
        symbols: trimStringArray(o.symbols, 6),
      };
    case "plot":
      return {
        beginning: trimString(o.beginning),
        middle: trimString(o.middle),
        climax: trimString(o.climax),
        ending: trimString(o.ending),
        twists: trimStringArray(o.twists, 8),
        foreshadowingPlan: trimStringArray(o.foreshadowingPlan, 8),
        ...(Array.isArray(o.foreshadowingTracker)
          ? {
              foreshadowingTracker: parseForeshadowingItems(o.foreshadowingTracker).slice(
                0,
                8
              ),
            }
          : {}),
      };
    case "chapter-outline":
      return normalizeChapterOutlineOutput(o, project);
    case "drafting":
      if (Array.isArray(o.chapters)) {
        return {
          ...o,
          chapters: o.chapters.slice(0, 64).map((ch) => {
            const c = ch as Record<string, unknown>;
            return {
              number: Number(c.number ?? 0),
              title: trimString(c.title, 120),
              draft: String(c.draft ?? ""),
            };
          }),
          completeManuscript: String(o.completeManuscript ?? ""),
        };
      }
      return {
        draft: String(o.draft ?? ""),
        title: trimString(o.title, 120),
      };
    case "editor":
      return {
        strengths: trimStringArray(o.strengths, 12),
        weakPoints: trimStringArray(o.weakPoints, 12),
        pacingIssues: trimStringArray(o.pacingIssues, 12),
        dialogueIssues: trimStringArray(o.dialogueIssues, 12),
        emotionalClarityIssues: trimStringArray(o.emotionalClarityIssues, 12),
        revisionSuggestions: trimStringArray(o.revisionSuggestions, 12),
      };
    case "continuity":
      return parseContinuityReport(o, project.storyBible);
    case "publisher":
      return {
        titleIdeas: trimStringArray(o.titleIdeas, 8, 80),
        shortSummary: trimString(o.shortSummary, 600),
        longSummary: trimString(o.longSummary, 1200),
        logline: trimString(o.logline),
        tagline: trimString(o.tagline, 120),
        socialPost: trimString(o.socialPost, 280),
        submissionDescription: trimString(o.submissionDescription, 800),
      };
    default:
      return parsed;
  }
}
