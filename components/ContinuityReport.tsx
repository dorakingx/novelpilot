"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  ContinuityIssue,
  ContinuitySeverity,
  StoryProject,
} from "@/lib/types";

interface ContinuityReportProps {
  project: StoryProject | null;
}

function severityVariant(
  severity: ContinuitySeverity
): "destructive" | "default" | "outline" {
  switch (severity) {
    case "high":
      return "destructive";
    case "medium":
      return "default";
    default:
      return "outline";
  }
}

function IssueCard({ issue }: { issue: ContinuityIssue }) {
  return (
    <div className="rounded-lg border border-border/50 p-3 space-y-2 text-sm">
      <div className="flex flex-wrap gap-2">
        <Badge variant={severityVariant(issue.severity)} className="text-xs">
          {issue.severity}
        </Badge>
        <Badge variant="outline" className="text-xs capitalize">
          {issue.category}
        </Badge>
      </div>
      <p className="font-medium">{issue.issue}</p>
      {issue.evidence && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">Evidence: </span>
          {issue.evidence}
        </p>
      )}
      {issue.suggestedFix && (
        <p className="text-xs">
          <span className="font-medium text-primary">Fix: </span>
          {issue.suggestedFix}
        </p>
      )}
    </div>
  );
}

function ReportList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
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

export function ContinuityReport({ project }: ContinuityReportProps) {
  const report = project?.reports.continuity;
  const editor = project?.reports.editor;
  const publisher = project?.reports.publisher;

  const issueCount = report?.issues.length ?? 0;
  const foreshadowCount = report?.unresolvedForeshadowing.length ?? 0;

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Continuity Detective</CardTitle>
        {report && (
          <p className="text-xs text-muted-foreground">
            Continuity Detective found {issueCount} issue
            {issueCount !== 1 ? "s" : ""} and {foreshadowCount} unresolved
            foreshadowing thread{foreshadowCount !== 1 ? "s" : ""}.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-3 space-y-4">
          {report ? (
            <div className="space-y-3">
              {report.overallDiagnosis && (
                <p className="text-sm leading-relaxed border-l-2 border-primary/50 pl-3">
                  {report.overallDiagnosis}
                </p>
              )}
              {report.issues.map((issue, i) => (
                <IssueCard key={i} issue={issue} />
              ))}
              <ReportList title="Missing payoffs" items={report.missingPayoffs} />
              <ReportList title="Repeated motifs" items={report.repeatedMotifs} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Continuity audit pending…
            </p>
          )}

          {editor && (
            <div className="space-y-3 pt-4 border-t border-border/40">
              <p className="text-xs font-medium text-primary">Style Editor</p>
              <ReportList title="Strengths" items={editor.strengths} />
              <ReportList
                title="Revision ideas"
                items={editor.revisionSuggestions}
              />
            </div>
          )}

          {publisher && (
            <div className="space-y-2 pt-4 border-t border-border/40">
              <p className="text-xs font-medium text-primary">
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
      </CardContent>
    </Card>
  );
}
