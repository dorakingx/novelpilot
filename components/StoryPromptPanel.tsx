"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectSettings } from "@/lib/types";
import { Loader2, Sparkles, Square } from "lucide-react";

interface StoryPromptPanelProps {
  settings: ProjectSettings;
  onSettingsChange: (partial: Partial<ProjectSettings>) => void;
  onGenerate: () => void;
  onStop: () => void;
  isRunning: boolean;
}

export function StoryPromptPanel({
  settings,
  onSettingsChange,
  onGenerate,
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

        <div className="space-y-2">
          <label className="text-sm font-medium">Language</label>
          <Select
            value={settings.language}
            onValueChange={(v) =>
              onSettingsChange({ language: v as ProjectSettings["language"] })
            }
            disabled={isRunning}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ja">Japanese</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Genre</label>
          <Select
            value={settings.genre}
            onValueChange={(v) =>
              onSettingsChange({ genre: v as ProjectSettings["genre"] })
            }
            disabled={isRunning}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sci-fi">Sci-Fi</SelectItem>
              <SelectItem value="mystery">Mystery</SelectItem>
              <SelectItem value="fantasy">Fantasy</SelectItem>
              <SelectItem value="literary">Literary</SelectItem>
              <SelectItem value="romance">Romance</SelectItem>
              <SelectItem value="horror">Horror</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tone</label>
          <Select
            value={settings.tone}
            onValueChange={(v) =>
              onSettingsChange({ tone: v as ProjectSettings["tone"] })
            }
            disabled={isRunning}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="melancholic">Melancholic</SelectItem>
              <SelectItem value="hopeful">Hopeful</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="whimsical">Whimsical</SelectItem>
              <SelectItem value="tense">Tense</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Target Length</label>
          <Select
            value={settings.targetLength}
            onValueChange={(v) =>
              onSettingsChange({
                targetLength: v as ProjectSettings["targetLength"],
              })
            }
            disabled={isRunning}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flash-fiction">Flash Fiction</SelectItem>
              <SelectItem value="short-story">Short Story</SelectItem>
              <SelectItem value="novella-outline">Novella Outline</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
