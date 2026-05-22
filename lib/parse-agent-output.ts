import type {
  ContinuityCategory,
  ContinuityIssue,
  ContinuityReport,
  ContinuitySeverity,
  ForeshadowingItem,
  ForeshadowingStatus,
  StoryBible,
} from "./types";

const FORESHADOWING_STATUSES: ForeshadowingStatus[] = [
  "planned",
  "unresolved",
  "paid-off",
];

const CATEGORIES: ContinuityCategory[] = [
  "character",
  "timeline",
  "foreshadowing",
  "worldbuilding",
  "motif",
];

const SEVERITIES: ContinuitySeverity[] = ["low", "medium", "high"];

export function parseForeshadowingItems(raw: unknown): ForeshadowingItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const o = item as Record<string, unknown>;
    const status = FORESHADOWING_STATUSES.includes(
      o.status as ForeshadowingStatus
    )
      ? (o.status as ForeshadowingStatus)
      : "planned";
    return {
      item: String(o.item ?? ""),
      introducedIn: String(o.introducedIn ?? ""),
      status,
      suggestedPayoff: String(o.suggestedPayoff ?? ""),
      payoffChapter: String(o.payoffChapter ?? ""),
      emotionalPurpose: String(o.emotionalPurpose ?? ""),
    };
  });
}

function parseContinuityIssue(
  raw: unknown,
  defaultCategory: ContinuityCategory = "motif"
): ContinuityIssue | null {
  if (typeof raw === "string") {
    return {
      category: defaultCategory,
      severity: "medium",
      issue: raw,
      evidence: "",
      suggestedFix: "",
    };
  }
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const category = CATEGORIES.includes(o.category as ContinuityCategory)
    ? (o.category as ContinuityCategory)
    : defaultCategory;
  const severity = SEVERITIES.includes(o.severity as ContinuitySeverity)
    ? (o.severity as ContinuitySeverity)
    : "medium";
  return {
    category,
    severity,
    issue: String(o.issue ?? ""),
    evidence: String(o.evidence ?? ""),
    suggestedFix: String(o.suggestedFix ?? o.suggestion ?? ""),
  };
}

function legacyStringsToIssues(
  items: string[],
  category: ContinuityCategory
): ContinuityIssue[] {
  return items.map((issue) => ({
    category,
    severity: "medium" as const,
    issue,
    evidence: "",
    suggestedFix: "",
  }));
}

export function parseContinuityReport(
  o: Record<string, unknown>,
  storyBible: StoryBible
): ContinuityReport {
  const issues: ContinuityIssue[] = [];

  if (Array.isArray(o.issues)) {
    for (const item of o.issues) {
      const parsed = parseContinuityIssue(item);
      if (parsed?.issue) issues.push(parsed);
    }
  }

  if (issues.length === 0) {
    if (Array.isArray(o.inconsistencies)) {
      issues.push(
        ...legacyStringsToIssues(o.inconsistencies.map(String), "worldbuilding")
      );
    }
    if (Array.isArray(o.characterIssues)) {
      issues.push(
        ...legacyStringsToIssues(o.characterIssues.map(String), "character")
      );
    }
    if (Array.isArray(o.timelineIssues)) {
      issues.push(
        ...legacyStringsToIssues(o.timelineIssues.map(String), "timeline")
      );
    }
    if (Array.isArray(o.suggestions)) {
      issues.push(
        ...o.suggestions.map((s) => ({
          category: "motif" as const,
          severity: "low" as const,
          issue: String(s),
          evidence: "",
          suggestedFix: String(s),
        }))
      );
    }
  }

  let unresolvedForeshadowing = parseForeshadowingItems(
    o.unresolvedForeshadowing
  );

  if (
    unresolvedForeshadowing.length === 0 &&
    Array.isArray(o.unresolvedForeshadowing)
  ) {
    const legacy = o.unresolvedForeshadowing as unknown[];
    if (legacy.length > 0 && typeof legacy[0] === "string") {
      unresolvedForeshadowing = legacy.map((s) => ({
        item: String(s),
        introducedIn: "Unknown",
        status: "unresolved" as const,
        suggestedPayoff: "",
        payoffChapter: "",
        emotionalPurpose: "",
      }));
    }
  }

  if (unresolvedForeshadowing.length === 0) {
    unresolvedForeshadowing = storyBible.foreshadowingTracker.filter(
      (f) => f.status === "unresolved"
    );
  }

  return {
    issues,
    unresolvedForeshadowing,
    repeatedMotifs: Array.isArray(o.repeatedMotifs)
      ? o.repeatedMotifs.map(String)
      : [],
    missingPayoffs: Array.isArray(o.missingPayoffs)
      ? o.missingPayoffs.map(String)
      : [],
    overallDiagnosis: String(
      o.overallDiagnosis ??
        o.diagnosis ??
        "Continuity audit complete. Review issues and foreshadowing threads below."
    ),
  };
}
