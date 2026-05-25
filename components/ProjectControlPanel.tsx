"use client";

import { DownloadPdfButton } from "@/components/DownloadPdfButton";
import { ReadNovelButton } from "@/components/ReadNovelButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  downloadFile,
  exportFullDemoMarkdown,
} from "@/lib/export";
import { computeTotalPlannedLength, formatLengthLabel } from "@/lib/length-planning";
import { getPresetById } from "@/lib/structure-presets";
import type { ProjectSettings, StoryProject } from "@/lib/types";
import { FileText, Gavel, Plus, Square } from "lucide-react";

interface ProjectControlPanelProps {
  project: StoryProject;
  settings: ProjectSettings;
  mockMode: boolean;
  llmProvider: string;
  llmModel: string;
  isRunning: boolean;
  projectComplete: boolean;
  canReadNovel: boolean;
  isGeneratingPdf: boolean;
  onStop: () => void;
  onNewStory: () => void;
  onRunJudgeDemo: () => void;
  onOpenReader?: () => void;
  onDownloadPdf?: () => void;
  readLabel?: string;
}

export function ProjectControlPanel({
  project,
  settings,
  mockMode,
  llmProvider,
  llmModel,
  isRunning,
  projectComplete,
  canReadNovel,
  isGeneratingPdf,
  onStop,
  onNewStory,
  onRunJudgeDemo,
  onOpenReader,
  onDownloadPdf,
  readLabel = "Read Finished Novel",
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

  const showReadActions = projectComplete || canReadNovel;

  return (
    <div className="surface-card premium-border rounded-2xl p-5 space-y-4">
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
        <div className="max-h-24 overflow-y-auto rounded-lg bg-[#172033] border border-white/12 p-2.5">
          <p className="text-sm text-[#CBD5E1] leading-relaxed">
            {project.userPrompt}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline" className="border-white/12 bg-[#172033] text-[#CBD5E1]">
          {settings.language}
        </Badge>
        <Badge variant="outline" className="border-white/12 bg-[#172033] text-[#CBD5E1]">
          {settings.genre}
        </Badge>
        <Badge variant="outline" className="border-white/12 bg-[#172033] text-[#CBD5E1]">
          {settings.tone}
        </Badge>
        <Badge variant="outline" className="border-white/12 bg-[#172033] text-[#CBD5E1]">
          {getPresetById(settings.structure.presetId).label}
        </Badge>
        {computeTotalPlannedLength(settings.structure.parts) > 0 && (
          <Badge variant="outline" className="border-white/12 bg-[#172033] text-[#CBD5E1]">
            {formatLengthLabel(
              computeTotalPlannedLength(settings.structure.parts),
              settings.structure.lengthUnit,
              settings.language
            )}
          </Badge>
        )}
      </div>

      <div className="rounded-lg border border-white/12 bg-[#172033] p-3 text-xs space-y-1 text-[#CBD5E1]">
        <p>
          Mode:{" "}
          <span
            className={
              mockMode ? "text-[#FCD34D] font-medium" : "text-[#7DD3FC] font-medium"
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
        {showReadActions && onOpenReader && (
          <ReadNovelButton
            onClick={onOpenReader}
            disabled={!canReadNovel}
            label={readLabel}
            className="w-full"
          />
        )}
        {showReadActions && onDownloadPdf && (
          <DownloadPdfButton
            onClick={onDownloadPdf}
            disabled={!canReadNovel}
            loading={isGeneratingPdf}
            className="w-full"
          />
        )}
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
