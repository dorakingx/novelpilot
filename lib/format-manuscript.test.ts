import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeChapterDraftOutput } from "./agents";
import {
  buildCompleteManuscript,
  getDraftedChapters,
} from "./format-manuscript";
import {
  EMPTY_REPORTS,
  EMPTY_STORY_BIBLE,
  type Chapter,
  type PartPlan,
  type StoryProject,
} from "./types";

function mkChapter(
  number: number,
  partNumber: number,
  draft?: string
): Chapter {
  return {
    number,
    partNumber,
    title: `Chapter ${number}`,
    purpose: "beat",
    emotionalTurn: "turn",
    keyEvents: [],
    foreshadowing: [],
    draft,
  };
}

function mkPart(number: number, chapters: Chapter[]): PartPlan {
  return {
    id: `part-${number}`,
    number,
    title: `Part ${number}`,
    purpose: "arc",
    chapters,
  };
}

function projectWithParts(parts: PartPlan[]): StoryProject {
  const chapters = parts.flatMap((part) =>
    part.chapters.map((ch) => ({
      ...ch,
      partNumber: ch.partNumber ?? part.number,
    }))
  );
  return {
    id: "test-project",
    title: "Test Novel",
    userPrompt: "test",
    language: "en",
    genre: "literary",
    tone: "hopeful",
    targetLength: "short-story",
    structure: {
      mode: "manual",
      presetId: "custom",
      lengthUnit: "words",
      partCount: parts.length,
      chaptersPerPart: parts[0]?.chapters.length ?? 0,
      totalChapterCount: chapters.length,
      chapterLengthPreset: "standard",
      parts,
    },
    createdAt: "2020-01-01T00:00:00.000Z",
    updatedAt: "2020-01-01T00:00:00.000Z",
    agents: [],
    storyBible: {
      ...EMPTY_STORY_BIBLE,
      parts,
      chapters,
    },
    manuscript: "",
    reports: EMPTY_REPORTS,
    aiModel: { providerChoice: "mock" },
  };
}

describe("format-manuscript", () => {
  it("getDraftedChapters returns all drafted chapters from parts", () => {
    const parts = [
      mkPart(1, [
        mkChapter(1, 1, "one"),
        mkChapter(2, 1),
        mkChapter(3, 1, "three"),
        mkChapter(4, 1, "four"),
      ]),
    ];
    const project = projectWithParts(parts);
    const drafted = getDraftedChapters(project);
    assert.equal(drafted.length, 3);
    assert.deepEqual(
      drafted.map((ch) => ch.number),
      [1, 3, 4]
    );
  });

  it("buildCompleteManuscript includes four chapters for a single-part project", () => {
    const parts = [
      mkPart(1, [
        mkChapter(1, 1, "Body one."),
        mkChapter(2, 1, "Body two."),
        mkChapter(3, 1, "Body three."),
        mkChapter(4, 1, "Body four."),
      ]),
    ];
    const manuscript = buildCompleteManuscript(projectWithParts(parts));
    assert.match(manuscript, /# Chapter 1:/);
    assert.match(manuscript, /# Chapter 2:/);
    assert.match(manuscript, /# Chapter 3:/);
    assert.match(manuscript, /# Chapter 4:/);
    assert.match(manuscript, /Body one\./);
    assert.match(manuscript, /Body four\./);
  });

  it("buildCompleteManuscript includes two parts with six chapters", () => {
    const parts = [
      mkPart(1, [
        mkChapter(1, 1, "P1C1"),
        mkChapter(2, 1, "P1C2"),
        mkChapter(3, 1, "P1C3"),
      ]),
      mkPart(2, [
        mkChapter(4, 2, "P2C1"),
        mkChapter(5, 2, "P2C2"),
        mkChapter(6, 2, "P2C3"),
      ]),
    ];
    const manuscript = buildCompleteManuscript(projectWithParts(parts));
    assert.match(manuscript, /# Part 1:/);
    assert.match(manuscript, /# Part 2:/);
    for (let n = 1; n <= 6; n++) {
      assert.match(manuscript, new RegExp(`# Chapter ${n}:`));
    }
    assert.match(manuscript, /P1C1/);
    assert.match(manuscript, /P2C3/);
  });

  it("mergeChapterDraftOutput preserves chapter 1 when merging chapter 2", () => {
    const parts = [
      mkPart(1, [
        mkChapter(1, 1, "First chapter body."),
        mkChapter(2, 1),
        mkChapter(3, 1),
        mkChapter(4, 1),
      ]),
    ];
    let project = projectWithParts(parts);
    project = mergeChapterDraftOutput(project, {
      number: 2,
      title: "Chapter 2",
      draft: "Second chapter body.",
    });

    const drafted = getDraftedChapters(project);
    assert.equal(drafted.length, 2);
    assert.equal(drafted[0].draft, "First chapter body.");
    assert.equal(drafted[1].draft, "Second chapter body.");

    const manuscript = buildCompleteManuscript(project);
    assert.match(manuscript, /First chapter body\./);
    assert.match(manuscript, /Second chapter body\./);
    assert.match(manuscript, /# Chapter 1:/);
    assert.match(manuscript, /# Chapter 2:/);
  });
});
