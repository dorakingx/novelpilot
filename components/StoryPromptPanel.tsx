"use client";

import { StorySettingsFields } from "@/components/StorySettingsFields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectSettings } from "@/lib/types";
import { Gavel, Loader2, Sparkles, Square } from "lucide-react";

interface StoryPromptPanelProps {
  settings: ProjectSettings;
  onSettingsChange: (partial: Partial<ProjectSettings>) => void;
  onGenerate: () => void;
  onRunJudgeDemo: () => void;
  onStop: () => void;
  isRunning: boolean;
}

export function StoryPromptPanel({
  settings,
  onSettingsChange,
  onGenerate,
  onRunJudgeDemo,
  onStop,
  isRunning,
}: StoryPromptPanelProps) {
  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold tracking-tight">
          Project Settings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure your story and launch the multi-agent pipeline.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Story Prompt</label>
          <Textarea
            value={settings.userPrompt}
            onChange={(e) => onSettingsChange({ userPrompt: e.target.value })}
            placeholder="Describe your story idea..."
            className="min-h-[180px] resize-y font-mono text-sm leading-relaxed"
            disabled={isRunning}
          />
        </div>

        <StorySettingsFields
          settings={settings}
          onSettingsChange={onSettingsChange}
          disabled={isRunning}
        />

        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={onGenerate}
            disabled={isRunning || !settings.userPrompt.trim()}
            className="w-full"
            size="lg"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 size-4" />
                Generate Story
              </>
            )}
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
          <p className="text-xs text-center text-muted-foreground px-1">
            Best for hackathon judges: runs a complete demo pipeline.
          </p>
          <Button
            variant="outline"
            onClick={onStop}
            disabled={!isRunning}
            className="w-full"
          >
            <Square className="mr-2 size-4" />
            Stop
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
