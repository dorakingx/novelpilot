"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  downloadFile,
  exportFullDemoMarkdown,
} from "@/lib/export";
import type { ProjectSettings, StoryProject } from "@/lib/types";
import {
  FileText,
  Gavel,
  Plus,
  Square,
} from "lucide-react";

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
    <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold tracking-tight">
          Project
        </CardTitle>
        <p className="text-lg font-medium leading-snug">{project.title}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Original prompt
          </p>
          <p
            className="text-sm line-clamp-3 text-foreground/90"
            title={project.userPrompt}
          >
            {project.userPrompt}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{settings.language}</Badge>
          <Badge variant="outline">{settings.genre}</Badge>
          <Badge variant="outline">{settings.tone}</Badge>
          <Badge variant="outline">{settings.targetLength}</Badge>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            Mode:{" "}
            <span className="text-foreground font-medium">
              {mockMode ? "Demo" : "Live"}
            </span>
          </p>
          {!mockMode && (
            <p className="font-mono text-[11px] break-all">
              {llmProvider} / {llmModel}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-1">
          {isRunning && (
            <Button variant="outline" onClick={onStop} className="w-full">
              <Square className="mr-2 size-4" />
              Stop generation
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={onNewStory}
            disabled={isRunning}
            className="w-full"
          >
            <Plus className="mr-2 size-4" />
            New Story
          </Button>
          <Button
            variant="secondary"
            onClick={onRunJudgeDemo}
            disabled={isRunning}
            className="w-full"
          >
            <Gavel className="mr-2 size-4" />
            Run Judge Demo
          </Button>
          <Button
            onClick={handleExportFullDemo}
            disabled={isRunning}
            className="w-full"
          >
            <FileText className="mr-2 size-4" />
            Export Full Demo Markdown
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
