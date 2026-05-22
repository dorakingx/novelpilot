"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StoryProject } from "@/lib/types";

interface ContinuityReportProps {
  project: StoryProject | null;
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

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[240px] pr-3 space-y-4">
          {report ? (
            <div className="space-y-3">
              <p className="text-xs font-medium text-primary">
                Continuity & Foreshadowing
              </p>
              <ReportList title="Inconsistencies" items={report.inconsistencies} />
              <ReportList
                title="Unresolved Foreshadowing"
                items={report.unresolvedForeshadowing}
              />
              <ReportList title="Character Issues" items={report.characterIssues} />
              <ReportList title="Timeline" items={report.timelineIssues} />
              <ReportList title="Suggestions" items={report.suggestions} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Continuity report pending…
            </p>
          )}

          {editor && (
            <div className="space-y-3 pt-4 border-t border-border/40">
              <p className="text-xs font-medium text-primary">Editor Notes</p>
              <ReportList title="Strengths" items={editor.strengths} />
              <ReportList title="Revision Ideas" items={editor.revisionSuggestions} />
            </div>
          )}

          {publisher && (
            <div className="space-y-2 pt-4 border-t border-border/40">
              <p className="text-xs font-medium text-primary">Publisher Package</p>
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
