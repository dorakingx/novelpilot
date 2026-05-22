"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { copyToClipboard } from "@/lib/clipboard";
import {
  buildDevDemoSummary,
  downloadFile,
  exportContinuityMarkdown,
  exportFullDemoMarkdown,
  exportManuscriptMarkdown,
  exportProjectJson,
  exportStoryBibleMarkdown,
} from "@/lib/export";
import type { StoryProject } from "@/lib/types";
import { Copy, Download, FileJson, FileText } from "lucide-react";
import { useState } from "react";

interface ExportPanelProps {
  project: StoryProject | null;
}

export function ExportPanel({ project }: ExportPanelProps) {
  const [copied, setCopied] = useState(false);
  const disabled = !project;

  const slug =
    project?.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() ?? "story";

  const handleCopyDevSummary = async () => {
    if (!project) return;
    const ok = await copyToClipboard(buildDevDemoSummary(project));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Export</CardTitle>
        <p className="text-xs text-muted-foreground">
          Full demo markdown and DEV submission helpers.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          className="w-full"
          disabled={disabled}
          onClick={() => {
            if (!project) return;
            downloadFile(
              `${slug}-full-demo.md`,
              exportFullDemoMarkdown(project),
              "text/markdown"
            );
          }}
        >
          <FileText className="size-3.5 mr-2" />
          Export Full Demo Markdown
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          disabled={disabled}
          onClick={handleCopyDevSummary}
        >
          <Copy className="size-3.5 mr-2" />
          {copied ? "Copied!" : "Copy DEV Demo Summary"}
        </Button>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => {
              if (!project) return;
              downloadFile(
                `${slug}-story-bible.md`,
                exportStoryBibleMarkdown(project),
                "text/markdown"
              );
            }}
          >
            <FileText className="size-3.5 mr-1" />
            Bible
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => {
              if (!project) return;
              downloadFile(
                `${slug}-manuscript.md`,
                exportManuscriptMarkdown(project),
                "text/markdown"
              );
            }}
          >
            <FileText className="size-3.5 mr-1" />
            Manuscript
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => {
              if (!project) return;
              downloadFile(
                `${slug}-continuity.md`,
                exportContinuityMarkdown(project),
                "text/markdown"
              );
            }}
          >
            <Download className="size-3.5 mr-1" />
            Continuity
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => {
              if (!project) return;
              downloadFile(
                `${slug}-project.json`,
                exportProjectJson(project),
                "application/json"
              );
            }}
          >
            <FileJson className="size-3.5 mr-1" />
            JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
