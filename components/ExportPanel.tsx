"use client";

import { Button } from "@/components/ui/button";
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
    <div className="glass-card premium-border rounded-2xl p-5">
      <h3 className="text-base font-semibold">Export</h3>
      <p className="text-xs text-muted-foreground mt-1 mb-4">
        Full demo markdown and DEV submission helpers.
      </p>
      <div className="space-y-3">
        <Button
          variant="premium"
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
          variant="glass"
          className="w-full"
          disabled={disabled}
          onClick={handleCopyDevSummary}
        >
          <Copy className="size-3.5 mr-2" />
          {copied ? "Copied!" : "Copy DEV Demo Summary"}
        </Button>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            variant="glass"
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
            variant="glass"
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
            variant="glass"
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
            variant="glass"
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
      </div>
    </div>
  );
}
