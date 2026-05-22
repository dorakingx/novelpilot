"use client";

import { StorySettingsFields } from "@/components/StorySettingsFields";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  LAUNCHER_FEATURE_CARDS,
  PROMPT_PLACEHOLDER,
} from "@/lib/launcher-content";
import type { ProjectSettings } from "@/lib/types";
import { BookOpen, Gavel, Loader2, Sparkles } from "lucide-react";

interface StartScreenProps {
  settings: ProjectSettings;
  onSettingsChange: (partial: Partial<ProjectSettings>) => void;
  onGenerate: () => void;
  onRunJudgeDemo: () => void;
  isRunning: boolean;
}

export function StartScreen({
  settings,
  onSettingsChange,
  onGenerate,
  onRunJudgeDemo,
  isRunning,
}: StartScreenProps) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="w-full max-w-[900px] space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary/15 text-primary mb-2">
            <BookOpen className="size-7" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            NovelPilot
          </h1>
          <p className="text-lg text-muted-foreground">
            Turn one prompt into a complete novel-writing pipeline.
          </p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Describe your story idea. NovelPilot will launch nine Gemma-powered
            agents to design the premise, characters, world, plot, chapter
            outline, prose draft, editing report, continuity audit, foreshadowing
            tracker, and publisher package.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/90 backdrop-blur-md shadow-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Your story prompt</label>
            <Textarea
              value={settings.userPrompt}
              onChange={(e) =>
                onSettingsChange({ userPrompt: e.target.value })
              }
              placeholder={PROMPT_PLACEHOLDER}
              className="min-h-[180px] resize-y text-base leading-relaxed"
              disabled={isRunning}
            />
          </div>

          <StorySettingsFields
            settings={settings}
            onSettingsChange={onSettingsChange}
            disabled={isRunning}
            compact
          />

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              size="lg"
              className="flex-1 h-12 text-base"
              onClick={onGenerate}
              disabled={isRunning || !settings.userPrompt.trim()}
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" />
                  Launching agents…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-5" />
                  Generate Story
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="flex-1 h-12 text-base"
              onClick={onRunJudgeDemo}
              disabled={isRunning}
            >
              <Gavel className="mr-2 size-5" />
              Run Judge Demo
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Judge Demo runs the full pipeline with a curated sci-fi mystery — no
            API key required.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {LAUNCHER_FEATURE_CARDS.map(({ title, icon: Icon, description }) => (
            <div
              key={title}
              className="rounded-xl border border-border/50 bg-card/60 p-4 text-center"
            >
              <Icon className="size-6 mx-auto mb-2 text-primary" />
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-primary/20 bg-card/50 p-5 text-center sm:text-left">
          <p className="text-sm font-medium flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="size-4 text-primary" />
            Why Gemma 4?
          </p>
          <ul className="mt-3 text-xs text-muted-foreground space-y-1.5 list-disc pl-5 inline-block text-left">
            <li>Structured JSON across nine specialized agents</li>
            <li>Long-context story memory for continuity and foreshadowing</li>
            <li>Reasoning-heavy audits, not a single completion call</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
