"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  downloadFile,
  exportFullDemoMarkdown,
} from "@/lib/export";
import type { ProjectSettings, StoryProject } from "@/lib/types";
import { FileText, Gavel, Plus, Square } from "lucide-react";

interface ProjectControlPanelProps {
  project: StoryProject;
  settings: ProjectSettings;
  mockMode: boolean;
  llmProvider: string;
  llmModel: string;
  isRunning: boolean;
  onStop: () => void;
  onNewStory: () => void;
  onRunJudgeDemo: () => void;
}

export function ProjectControlPanel({
  project,
  settings,
  mockMode,
  llmProvider,
  llmModel,
  isRunning,
  onStop,
  onNewStory,
  onRunJudgeDemo,
}: ProjectControlPanelProps) {
  const slug =
    project.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "story";

  const handleExportFullDemo = () => {
    downloadFile(
      `${slug}-full-demo.md`,
      exportFullDemoMarkdown(project),
      "text/markdown"
    );
  };

  return (
    <div className="glass-card premium-border glow-card rounded-2xl p-5 space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Project
        </p>
        <p className="text-lg font-semibold leading-snug mt-1">{project.title}</p>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">
          Original prompt
        </p>
        <ScrollArea className="max-h-24 rounded-lg bg-black/20 border border-white/5 p-2.5">
          <p className="text-sm text-foreground/85 leading-relaxed">
            {project.userPrompt}
          </p>
        </ScrollArea>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline" className="border-white/10 bg-white/5">
          {settings.language}
        </Badge>
        <Badge variant="outline" className="border-white/10 bg-white/5">
          {settings.genre}
        </Badge>
        <Badge variant="outline" className="border-white/10 bg-white/5">
          {settings.tone}
        </Badge>
        <Badge variant="outline" className="border-white/10 bg-white/5">
          {settings.targetLength}
        </Badge>
      </div>

      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs space-y-1">
        <p>
          Mode:{" "}
          <span
            className={
              mockMode
                ? "text-[oklch(0.78_0.14_75)] font-medium"
                : "text-[oklch(0.72_0.14_220)] font-medium"
            }
          >
            {mockMode ? "Demo" : "Live"}
          </span>
        </p>
        {!mockMode && (
          <p className="font-mono text-[10px] break-all text-muted-foreground">
            {llmProvider} / {llmModel}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {isRunning && (
          <Button variant="stop" onClick={onStop} className="w-full">
            <Square className="mr-2 size-4" />
            Stop generation
          </Button>
        )}
        <Button
          variant="glass"
          onClick={onNewStory}
          disabled={isRunning}
          className="w-full"
        >
          <Plus className="mr-2 size-4" />
          New Story
        </Button>
        <Button
          variant="glass"
          onClick={onRunJudgeDemo}
          disabled={isRunning}
          className="w-full"
        >
          <Gavel className="mr-2 size-4" />
          Run Judge Demo
        </Button>
        <Button
          variant="premium"
          onClick={handleExportFullDemo}
          disabled={isRunning}
          className="w-full"
        >
          <FileText className="mr-2 size-4" />
          Export Full Demo Markdown
        </Button>
      </div>
    </div>
  );
}
