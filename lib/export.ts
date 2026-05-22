import type { StoryProject } from "./types";

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
      "**Foreshadowing:**",
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
  const ch1 = project.storyBible.chapters[0];
  const title = ch1?.title ?? "Chapter 1";
  return [
    `# ${project.title}`,
    "",
    `## ${title}`,
    "",
    project.manuscript || "_No draft yet._",
  ].join("\n");
}

export function exportContinuityMarkdown(project: StoryProject): string {
  const r = project.reports.continuity;
  if (!r) return "# Continuity Report\n\n_No report yet._";

  const section = (heading: string, items: string[]) => {
    if (!items.length) return [];
    return [heading, "", ...items.map((i) => `- ${i}`), ""];
  };

  return [
    `# Continuity Report: ${project.title}`,
    "",
    ...section("## Inconsistencies", r.inconsistencies),
    ...section("## Unresolved Foreshadowing", r.unresolvedForeshadowing),
    ...section("## Character Issues", r.characterIssues),
    ...section("## Timeline Issues", r.timelineIssues),
    ...section("## Suggestions", r.suggestions),
    ...(r.repeatedMotifs?.length
      ? section("## Repeated Motifs", r.repeatedMotifs)
      : []),
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
