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

function severityVariant(
  severity: ContinuitySeverity
): "error" | "warning" | "outline" {
  switch (severity) {
    case "high":
      return "error";
    case "medium":
      return "warning";
    default:
      return "outline";
  }
}

function IssueCard({ issue }: { issue: ContinuityIssue }) {
  return (
    <div className="rounded-lg border border-white/12 bg-[#172033] p-3 space-y-2 text-sm text-[#E2E8F0]">
      <div className="flex flex-wrap gap-2">
        <Badge variant={severityVariant(issue.severity)} className="text-xs capitalize">
          {issue.severity}
        </Badge>
        <Badge variant="outline" className="text-xs capitalize">
          {issue.category}
        </Badge>
      </div>
      <p className="font-medium text-[#F8FAFC]">{issue.issue}</p>
      {issue.evidence && (
        <p className="text-xs text-[#94A3B8]">
          <span className="font-semibold text-[#CBD5E1]">Evidence: </span>
          {issue.evidence}
        </p>
      )}
      {issue.suggestedFix && (
        <p className="text-xs text-[#CBD5E1]">
          <span className="font-semibold text-[#38BDF8]">Fix: </span>
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
      <h4 className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8] mb-1">
        {title}
      </h4>
      <ul className="list-disc pl-4 space-y-1 text-sm text-[#E2E8F0]">
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
    <div className="surface-card premium-border rounded-2xl p-5">
      <h3 className="text-base font-semibold text-[#F8FAFC]">
        Continuity Detective
      </h3>
      {report ? (
        <p className="text-xs text-[#94A3B8] mt-1 mb-3">
          {issueCount} issue{issueCount !== 1 ? "s" : ""}, {foreshadowCount}{" "}
          unresolved thread{foreshadowCount !== 1 ? "s" : ""}
        </p>
      ) : (
        <p className="text-xs text-[#94A3B8] mt-1 mb-3">
          Audit board for structure and consistency
        </p>
      )}
      <ScrollArea className="h-[280px] pr-3">
        {report ? (
          <div className="space-y-3">
            {report.overallDiagnosis && (
              <div className="rounded-lg border border-[#38BDF8]/35 bg-[rgba(56,189,248,0.1)] p-3 text-sm leading-relaxed text-[#E2E8F0]">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#7DD3FC] mb-1">
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
          <div className="space-y-3 pt-4 mt-4 border-t border-white/12">
            <p className="text-xs font-medium text-[#F5C542]">Style Editor</p>
            <ReportList title="Strengths" items={editor.strengths} />
            <ReportList
              title="Revision ideas"
              items={editor.revisionSuggestions}
            />
          </div>
        )}

        {publisher && (
          <div className="space-y-2 pt-4 mt-4 border-t border-white/12">
            <p className="text-xs font-medium text-[#F5C542]">Publisher Agent</p>
            <p className="text-sm font-medium text-[#F8FAFC]">
              {publisher.logline}
            </p>
            <p className="text-xs text-[#94A3B8] italic">{publisher.tagline}</p>
            {publisher.titleIdeas.length > 0 && (
              <p className="text-xs text-[#CBD5E1]">
                Titles: {publisher.titleIdeas.join(" · ")}
              </p>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
