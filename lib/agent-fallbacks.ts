import { buildFallbackChapterOutline } from "./chapter-outline-fallback";
import type { AgentId, StoryConcept, StoryProject } from "./types";

export const AGENT_FALLBACK_RECOVERY_MESSAGE =
  "This agent returned incomplete JSON, so NovelPilot used a compact fallback and continued.";

/** @deprecated Use AGENT_FALLBACK_RECOVERY_MESSAGE */
export const CONCEPT_FALLBACK_RECOVERY_MESSAGE = AGENT_FALLBACK_RECOVERY_MESSAGE;

export function buildFallbackConcept(project: StoryProject): StoryConcept {
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

function characterBlock(
  name: string,
  role: string,
  desire: string,
  fear: string,
  flaw: string,
  secret: string,
  arc: string,
  speechStyle: string
) {
  return { name, role, desire, fear, flaw, secret, arc, speechStyle };
}

function buildFallbackCharacter(project: StoryProject): Record<string, unknown> {
  if (project.language === "ja") {
    return {
      protagonist: characterBlock(
        "主人公",
        "主人公",
        "真実を知り、自分の選択を取り戻したい",
        "失った記憶と向き合うこと",
        "過去を避けがち",
        "世界の仕組みに関わる秘密を知っている",
        "恐れを超えて行動する",
        "短く、内省的な口調"
      ),
      antagonist: characterBlock(
        "対立者",
        "対立者",
        "秩序を守り、主人公の行動を止めたい",
        "真実が明らかになること",
        "正義感が強すぎる",
        "組織の裏側を知っている",
        "信念のために主人公と対立する",
        "冷静で論理的な口調"
      ),
      supporting: [
        characterBlock(
          "協力者",
          "協力者",
          "主人公を支え、手がかりを渡したい",
          "主人公を失うこと",
          "秘密を抱え込みがち",
          "過去の出来事を知っている",
          "信頼を深めて物語を動かす",
          "温かく率直な口調"
        ),
      ],
    };
  }

  return {
    protagonist: characterBlock(
      "Protagonist",
      "Protagonist",
      "Uncover the truth and reclaim agency",
      "Facing what was buried in memory",
      "Avoids the past",
      "Knows a secret tied to the world's rules",
      "Acts despite fear",
      "Quiet, reflective voice"
    ),
    antagonist: characterBlock(
      "Antagonist",
      "Antagonist",
      "Preserve order and stop the protagonist",
      "The truth becoming public",
      "Rigid sense of justice",
      "Knows the institution's hidden side",
      "Opposes the protagonist on principle",
      "Calm, logical tone"
    ),
    supporting: [
      characterBlock(
        "Ally",
        "Supporting",
        "Help the protagonist and share clues",
        "Losing the protagonist",
        "Holds secrets too close",
        "Witnessed a pivotal past event",
        "Deepens trust and moves the plot",
        "Warm, direct speech"
      ),
    ],
  };
}

function buildFallbackWorldbuilding(
  project: StoryProject
): Record<string, unknown> {
  if (project.language === "ja") {
    return {
      setting: "現代と幻想が交差する都市",
      rules: "記憶と真実の境界が曖昧になる",
      socialContext: "秘密を抱えた共同体",
      atmosphere: `${project.tone}な緊張感`,
      locations: ["主人公の住まい", "中央図書館", "廃墟の駅"],
      symbols: ["古い鍵", "消えた写真", "雨"],
    };
  }

  return {
    setting: "A city where the ordinary and the uncanny overlap",
    rules: "Memory and truth blur at the edges",
    socialContext: "A community built on guarded secrets",
    atmosphere: `A ${project.tone} mood throughout`,
    locations: ["Protagonist's apartment", "Central archive", "Abandoned station"],
    symbols: ["An old key", "A vanished photograph", "Rain"],
  };
}

function buildFallbackPlot(project: StoryProject): Record<string, unknown> {
  if (project.language === "ja") {
    return {
      beginning: "主人公は日常の裂け目に気づく。",
      middle: "手がかりが増え、対立が深まる。",
      climax: "真実と向き合い、決断を迫られる。",
      ending: "代償を伴うが、物語は前へ進む。",
      twists: ["協力者の秘密", "世界のルールの反転", "過去の再訪"],
      foreshadowingPlan: ["古い鍵", "消えた記録", "雨の予感"],
    };
  }

  return {
    beginning: "The protagonist notices a crack in ordinary life.",
    middle: "Clues accumulate and opposition deepens.",
    climax: "Truth demands a costly decision.",
    ending: "The story moves forward with lasting change.",
    twists: ["The ally's secret", "A reversal of the world's rules", "The past returns"],
    foreshadowingPlan: ["The old key", "Missing records", "Omen of rain"],
  };
}

function placeholderDraft(language: StoryProject["language"], n: number): string {
  if (language === "ja") {
    return `第${n}章の草案。主人公は物語の核心に近づき、${n}章目の出来事が展開する。`;
  }
  return `Draft for chapter ${n}. The protagonist moves toward the story's core as chapter ${n} unfolds.`;
}

function buildFallbackDrafting(project: StoryProject): Record<string, unknown> {
  const chapters = project.storyBible.chapters;
  if (chapters.length === 0) {
    const draft = placeholderDraft(project.language, 1);
    return {
      chapters: [{ number: 1, title: "Chapter 1", draft }],
      completeManuscript: draft,
    };
  }

  const drafts = chapters.map((ch) => ({
    number: ch.number,
    title: ch.title || `Chapter ${ch.number}`,
    draft: placeholderDraft(project.language, ch.number),
  }));

  const completeManuscript = drafts
    .map((d) => `# ${d.title}\n\n${d.draft}`)
    .join("\n\n");

  return { chapters: drafts, completeManuscript };
}

function buildFallbackEditor(): Record<string, unknown> {
  return {
    strengths: ["Clear premise", "Consistent tone"],
    weakPoints: ["Some pacing gaps in the middle"],
    pacingIssues: ["Middle section could tighten transitions"],
    dialogueIssues: ["Occasional exposition in dialogue"],
    emotionalClarityIssues: ["Climax emotional beat could land harder"],
    revisionSuggestions: [
      "Sharpen scene goals in act two",
      "Vary sentence rhythm in tense moments",
    ],
  };
}

function buildFallbackContinuity(
  project: StoryProject
): Record<string, unknown> {
  const diagnosis =
    project.language === "ja"
      ? "フォールバック監査：大きな矛盾は検出されませんでした。"
      : "Fallback audit: no major contradictions flagged.";
  return {
    issues: [],
    unresolvedForeshadowing: [],
    repeatedMotifs: [],
    missingPayoffs: [],
    overallDiagnosis: diagnosis,
  };
}

function buildFallbackPublisher(
  project: StoryProject
): Record<string, unknown> {
  const logline =
    project.storyBible.concept?.logline ??
    (project.userPrompt.slice(0, 120) || "A story of choice and revelation.");

  if (project.language === "ja") {
    return {
      titleIdeas: ["記憶の境界", "雨のあと", "消えた真実"],
      shortSummary: "主人公が隠された真実を追う物語。",
      longSummary:
        "日常の裂け目から始まり、対立と手がかりを経て、代償を伴う決断へ至る。",
      logline,
      tagline: "選べないまま、選ばなければならない。",
      socialPost: "新しい物語が始まります。#小説",
      submissionDescription: "文学フィクション向けの完結短編草案。",
    };
  }

  return {
    titleIdeas: ["The Memory Line", "After the Rain", "Vanished Truth"],
    shortSummary: "A protagonist pursues a hidden truth at personal cost.",
    longSummary:
      "From a crack in ordinary life through rising opposition to a decisive, costly ending.",
    logline,
    tagline: "You cannot choose—and you must.",
    socialPost: "A new story begins. #fiction",
    submissionDescription: "Complete short-fiction draft for literary submission.",
  };
}

export function buildFallbackAgentOutput(
  agentId: AgentId,
  project: StoryProject
): unknown {
  switch (agentId) {
    case "concept":
      return buildFallbackConcept(project);
    case "character":
      return buildFallbackCharacter(project);
    case "worldbuilding":
      return buildFallbackWorldbuilding(project);
    case "plot":
      return buildFallbackPlot(project);
    case "chapter-outline":
      return buildFallbackChapterOutline(project);
    case "drafting":
      return buildFallbackDrafting(project);
    case "editor":
      return buildFallbackEditor();
    case "continuity":
      return buildFallbackContinuity(project);
    case "publisher":
      return buildFallbackPublisher(project);
    default:
      return {};
  }
}
