"use client";

import { PanelPlaceholder } from "@/components/PanelPlaceholder";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  ContinuityIssue,
  ContinuitySeverity,
  StoryProject,
} from "@/lib/types";
import { FileSearch } from "lucide-react";

interface ContinuityReportProps {
  project: StoryProject | null;
  isRunning?: boolean;
}

function severityClass(severity: ContinuitySeverity): string {
  switch (severity) {
    case "high":
      return "border-destructive/50 bg-destructive/15 text-destructive";
    case "medium":
      return "border-[oklch(0.78_0.14_75/40%)] bg-[oklch(0.78_0.14_75/10%)] text-[oklch(0.78_0.14_75)]";
    default:
      return "border-white/10 text-muted-foreground";
  }
}

function IssueCard({ issue }: { issue: ContinuityIssue }) {
  return (
    <div className="rounded-lg border border-white/8 bg-black/20 p-3 space-y-2 text-sm">
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className={severityClass(issue.severity)}>
          {issue.severity}
        </Badge>
        <Badge variant="outline" className="text-xs capitalize border-white/10">
          {issue.category}
        </Badge>
      </div>
      <p className="font-medium">{issue.issue}</p>
      {issue.evidence && (
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground/80">Evidence: </span>
          {issue.evidence}
        </p>
      )}
      {issue.suggestedFix && (
        <p className="text-xs">
          <span className="font-semibold text-[oklch(0.72_0.14_220)]">Fix: </span>
          {issue.suggestedFix}
        </p>
      )}
    </div>
  );
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
        {title}
      </h4>
      <ul className="list-disc pl-4 space-y-1 text-sm">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function ContinuityReport({
  project,
  isRunning,
}: ContinuityReportProps) {
  const report = project?.reports.continuity;
  const editor = project?.reports.editor;
  const publisher = project?.reports.publisher;

  const issueCount = report?.issues.length ?? 0;
  const foreshadowCount = report?.unresolvedForeshadowing.length ?? 0;

  return (
    <div className="glass-card premium-border rounded-2xl p-5">
      <h3 className="text-base font-semibold">Continuity Detective</h3>
      {report ? (
        <p className="text-xs text-muted-foreground mt-1 mb-3">
          {issueCount} issue{issueCount !== 1 ? "s" : ""}, {foreshadowCount}{" "}
          unresolved thread{foreshadowCount !== 1 ? "s" : ""}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground mt-1 mb-3">
          Audit board for structure and consistency
        </p>
      )}
      <ScrollArea className="h-[280px] pr-3">
        {report ? (
          <div className="space-y-3">
            {report.overallDiagnosis && (
              <div className="rounded-lg border border-[oklch(0.72_0.14_220/30%)] bg-[oklch(0.72_0.14_220/8%)] p-3 text-sm leading-relaxed">
                <p className="text-xs font-semibold uppercase tracking-wide text-[oklch(0.72_0.14_220)] mb-1">
                  Overall diagnosis
                </p>
                {report.overallDiagnosis}
              </div>
            )}
            {report.issues.map((issue, i) => (
              <IssueCard key={i} issue={issue} />
            ))}
            <ReportList title="Missing payoffs" items={report.missingPayoffs} />
            <ReportList title="Repeated motifs" items={report.repeatedMotifs} />
          </div>
        ) : (
          <PanelPlaceholder
            message={
              isRunning
                ? "Continuity Detective is waiting for the draft and prior agents."
                : "Continuity audit pending…"
            }
            icon={FileSearch}
          />
        )}

        {editor && (
          <div className="space-y-3 pt-4 mt-4 border-t border-white/5">
            <p className="text-xs font-medium text-[oklch(0.78_0.14_75)]">
              Style Editor
            </p>
            <ReportList title="Strengths" items={editor.strengths} />
            <ReportList
              title="Revision ideas"
              items={editor.revisionSuggestions}
            />
          </div>
        )}

        {publisher && (
          <div className="space-y-2 pt-4 mt-4 border-t border-white/5">
            <p className="text-xs font-medium text-[oklch(0.78_0.14_75)]">
              Publisher Agent
            </p>
            <p className="text-sm font-medium">{publisher.logline}</p>
            <p className="text-xs text-muted-foreground italic">
              {publisher.tagline}
            </p>
            {publisher.titleIdeas.length > 0 && (
              <p className="text-xs">
                Titles: {publisher.titleIdeas.join(" · ")}
              </p>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
