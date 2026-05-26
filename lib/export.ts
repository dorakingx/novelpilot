import { buildCompleteManuscript } from "./format-manuscript";
import { getAllChapters } from "./structure-utils";
import type { ContinuityIssue, StoryProject } from "./types";

function formatContinuityIssue(issue: ContinuityIssue): string[] {
  return [
    `### [${issue.severity.toUpperCase()}] ${issue.category}: ${issue.issue}`,
    "",
    `**Evidence:** ${issue.evidence || "—"}`,
    "",
    `**Suggested fix:** ${issue.suggestedFix || "—"}`,
    "",
  ];
}

function formatForeshadowingSection(
  title: string,
  items: StoryProject["storyBible"]["foreshadowingTracker"]
): string[] {
  if (!items.length) return [];
  const lines = [title, ""];
  for (const f of items) {
    lines.push(`### ${f.item} (${f.status})`);
    lines.push(`- Introduced: ${f.introducedIn}`);
    lines.push(`- Payoff chapter: ${f.payoffChapter}`);
    lines.push(`- Suggested payoff: ${f.suggestedPayoff}`);
    lines.push(`- Emotional purpose: ${f.emotionalPurpose}`, "");
  }
  return lines;
}

export function exportStoryBibleMarkdown(project: StoryProject): string {
  const b = project.storyBible;
  const lines: string[] = [
    `# Story Bible: ${project.title}`,
    "",
    `**Prompt:** ${project.userPrompt}`,
    `**Language:** ${project.language} | **Genre:** ${project.genre} | **Tone:** ${project.tone}`,
    "",
  ];

  if (b.concept) {
    lines.push("## Concept", "");
    lines.push(`**Logline:** ${b.concept.logline}`, "");
    lines.push(`**Theme:** ${b.concept.coreTheme}`, "");
    lines.push(`**Central Conflict:** ${b.concept.centralConflict}`, "");
    lines.push(`**Emotional Promise:** ${b.concept.emotionalPromise}`, "");
    lines.push(`**Hook:** ${b.concept.uniqueHook}`, "");
  }

  if (b.characters.length) {
    lines.push("## Characters", "");
    for (const c of b.characters) {
      lines.push(`### ${c.name} (${c.role})`, "");
      lines.push(`- **Desire:** ${c.desire}`);
      lines.push(`- **Fear:** ${c.fear}`);
      lines.push(`- **Flaw:** ${c.flaw}`);
      lines.push(`- **Secret:** ${c.secret}`);
      lines.push(`- **Arc:** ${c.arc}`);
      lines.push(`- **Speech:** ${c.speechStyle}`, "");
    }
  }

  if (b.worldbuilding) {
    const w = b.worldbuilding;
    lines.push("## Worldbuilding", "");
    lines.push(`**Setting:** ${w.setting}`, "");
    lines.push(`**Rules:** ${w.rules}`, "");
    lines.push(`**Social Context:** ${w.socialContext}`, "");
    lines.push(`**Atmosphere:** ${w.atmosphere}`, "");
    lines.push("**Locations:**", ...w.locations.map((l) => `- ${l}`), "");
    lines.push("**Symbols:**", ...w.symbols.map((s) => `- ${s}`), "");
  }

  if (b.plot) {
    const p = b.plot;
    lines.push("## Plot", "");
    lines.push(`**Beginning:** ${p.beginning}`, "");
    lines.push(`**Middle:** ${p.middle}`, "");
    lines.push(`**Climax:** ${p.climax}`, "");
    lines.push(`**Ending:** ${p.ending}`, "");
    lines.push("**Twists:**", ...p.twists.map((t) => `- ${t}`), "");
    lines.push(
      "**Foreshadowing plan:**",
      ...p.foreshadowingPlan.map((f) => `- ${f}`),
      ""
    );
  }

  if (b.chapters.length) {
    lines.push("## Chapter Outline", "");
    for (const ch of b.chapters) {
      lines.push(`### Chapter ${ch.number}: ${ch.title}`, "");
      lines.push(`**Purpose:** ${ch.purpose}`, "");
      lines.push(`**Emotional Turn:** ${ch.emotionalTurn}`, "");
      lines.push("**Key Events:**", ...ch.keyEvents.map((e) => `- ${e}`), "");
      lines.push(
        "**Foreshadowing:**",
        ...ch.foreshadowing.map((f) => `- ${f}`),
        ""
      );
    }
  }

  lines.push(
    ...formatForeshadowingSection("## Foreshadowing Tracker", b.foreshadowingTracker)
  );

  if (b.styleGuide) {
    const sg = b.styleGuide;
    lines.push("## Style Guide", "");
    lines.push(`- POV: ${sg.pov}`);
    lines.push(`- Tense: ${sg.tense}`);
    lines.push(`- Prose: ${sg.proseStyle}`);
    lines.push(`- Dialogue: ${sg.dialogueNotes}`);
    lines.push("**Taboos:**", ...sg.taboos.map((t) => `- ${t}`), "");
  }

  return lines.join("\n");
}

export function exportManuscriptMarkdown(project: StoryProject): string {
  const body = buildCompleteManuscript(project);
  if (!body.trim()) {
    return `# ${project.title}\n\n_No draft yet._`;
  }
  return `# ${project.title}\n\n${body}`;
}

export function exportContinuityMarkdown(project: StoryProject): string {
  const r = project.reports.continuity;
  if (!r) return "# Continuity Detective Report\n\n_No report yet._";

  const lines: string[] = [
    `# Continuity Detective: ${project.title}`,
    "",
    r.overallDiagnosis,
    "",
  ];

  if (r.issues.length) {
    lines.push("## Issues", "");
    for (const issue of r.issues) {
      lines.push(...formatContinuityIssue(issue));
    }
  }

  lines.push(
    ...formatForeshadowingSection(
      "## Unresolved Foreshadowing",
      r.unresolvedForeshadowing
    )
  );

  if (r.missingPayoffs.length) {
    lines.push("## Missing Payoffs", "", ...r.missingPayoffs.map((m) => `- ${m}`), "");
  }

  if (r.repeatedMotifs.length) {
    lines.push(
      "## Repeated Motifs",
      "",
      ...r.repeatedMotifs.map((m) => `- ${m}`),
      ""
    );
  }

  return lines.join("\n");
}

function exportStructureMarkdown(project: StoryProject): string {
  const s = project.structure;
  const lines = [
    "## Story Structure Settings",
    "",
    `- Preset: ${s.presetId}`,
    `- Parts: ${s.partCount} · Chapters per part: ${s.chaptersPerPart} · Total: ${s.totalChapterCount}`,
    `- Total planned length: ${s.totalTargetLength ?? "—"} ${s.lengthUnit}`,
    `- Mode: ${s.mode}`,
    "",
  ];
  for (const ch of getAllChapters(project)) {
    const lp = ch.lengthPlan;
    const rolePart = ch.role?.trim() ? ` [${ch.role}]` : "";
    lines.push(
      `- Chapter ${ch.number} (${ch.title})${rolePart}: target ${lp?.targetLength ?? "—"} ${lp?.unit ?? s.lengthUnit}`
    );
  }
  lines.push("");
  return lines.join("\n");
}

export function exportFullDemoMarkdown(project: StoryProject): string {
  const sections = [
    `# NovelPilot Full Demo: ${project.title}`,
    "",
    "## User Prompt",
    "",
    project.userPrompt,
    "",
    "---",
    "",
    exportStructureMarkdown(project),
    "---",
    "",
    exportStoryBibleMarkdown(project),
    "",
    "---",
    "",
    "## Complete Manuscript",
    "",
    exportManuscriptMarkdown(project),
    "",
    "---",
    "",
  ];

  const editor = project.reports.editor;
  if (editor) {
    sections.push("## Style Editor Report", "");
    sections.push("**Strengths:**", ...editor.strengths.map((s) => `- ${s}`), "");
    sections.push(
      "**Revision suggestions:**",
      ...editor.revisionSuggestions.map((s) => `- ${s}`),
      ""
    );
  }

  sections.push("---", "", exportContinuityMarkdown(project), "", "---", "");

  const pub = project.reports.publisher;
  if (pub) {
    sections.push("## Publisher Package", "");
    sections.push(`**Logline:** ${pub.logline}`, "");
    sections.push(`**Tagline:** ${pub.tagline}`, "");
    sections.push(`**Short summary:** ${pub.shortSummary}`, "");
    sections.push(`**Long summary:** ${pub.longSummary}`, "");
    sections.push(
      "**Title ideas:**",
      ...pub.titleIdeas.map((t) => `- ${t}`),
      ""
    );
    sections.push(`**Social post:** ${pub.socialPost}`, "");
    sections.push(`**Submission:** ${pub.submissionDescription}`, "");
  }

  return sections.join("\n");
}

export function buildDevDemoSummary(project: StoryProject): string {
  const continuity = project.reports.continuity;
  const issueCount = continuity?.issues.length ?? 0;
  const foreshadowCount =
    project.storyBible.foreshadowingTracker.length ||
    (continuity?.unresolvedForeshadowing.length ?? 0);
  const logline =
    project.reports.publisher?.logline ||
    project.storyBible.concept?.logline ||
    "—";
  const completedAgents = project.agents.filter(
    (a) => a.status === "completed"
  ).length;

  return [
    `NovelPilot — AI Multi-Agent Writing Room`,
    ``,
    `Project: ${project.title}`,
    `Logline: ${logline}`,
    ``,
    `Pipeline: ${completedAgents}/9 agents completed`,
    `Foreshadowing threads tracked: ${foreshadowCount}`,
    `Continuity Detective issues: ${issueCount}`,
    ``,
    `One prompt → story bible, custom part/chapter structure, complete multi-chapter short novel draft (chapter-by-chapter for long works), style edit, continuity audit, publisher package.`,
    ``,
    `AI agents provide structured creative reasoning across the pipeline—not just paragraph completion.`,
    `Demo: https://github.com/dorakingx/novelpilot`,
  ].join("\n");
}

export function exportProjectJson(project: StoryProject): string {
  return JSON.stringify(project, null, 2);
}

export function downloadFile(
  filename: string,
  content: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
