import { compactUserPrompt } from "./prompt-budget";
import type { StoryConcept, StoryProject } from "./types";

export const CONCEPT_FALLBACK_RECOVERY_MESSAGE =
  "Premise Architect returned incomplete JSON, so NovelPilot used a compact fallback concept and continued.";

export function buildFallbackConcept(
  project: StoryProject
): StoryConcept {
  if (project.language === "ja") {
    return {
      logline: "主人公は隠された真実を追い、自分自身の選択と向き合う。",
      coreTheme: "記憶、選択、自己同一性",
      centralConflict:
        "主人公は世界の仕組みと自分の過去に隠された矛盾に直面する。",
      emotionalPromise: "静かな緊張感と切なさを伴う物語。",
      uniqueHook: "ユーザーのプロンプトから生まれる謎と感情の交差。",
    };
  }

  return {
    logline:
      "A protagonist follows a hidden truth and confronts the cost of choice.",
    coreTheme: "Identity, memory, and choice",
    centralConflict:
      "The protagonist must face a contradiction hidden inside the story world.",
    emotionalPromise:
      "A tense and emotionally resonant journey toward revelation.",
    uniqueHook: "A mystery shaped by the user's premise and genre.",
  };
}

export function buildConceptRetryPrompt(project: StoryProject): string {
  const shortenedPrompt = compactUserPrompt(project.userPrompt, 500);
  return `Return ONLY this valid JSON object:

{
  "logline": "...",
  "coreTheme": "...",
  "centralConflict": "...",
  "emotionalPromise": "...",
  "uniqueHook": "..."
}

Rules:
- No markdown
- No explanations
- One short sentence per value
- Entire response under 700 characters
- Must be valid JSON
- Close all quotes and braces
- JSON keys must stay in English
- Creative values should use the project language

Project settings:
- language: ${project.language}
- genre: ${project.genre}
- tone: ${project.tone}

User prompt (shortened):
${shortenedPrompt}
`;
}
