"use client";

import { AgentChainPreview } from "@/components/AgentChainPreview";
import { StorySettingsFields } from "@/components/StorySettingsFields";
import { StoryStructureFields } from "@/components/StoryStructureFields";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  LAUNCHER_FEATURE_CARDS,
  LAUNCHER_TAGLINE,
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
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-20 animate-fade-in">
      <div className="w-full max-w-[980px] space-y-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl surface-card premium-border mb-2">
            <BookOpen className="size-8 text-[#F5C542]" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#F8FAFC]">
            NovelPilot
          </h1>
          <p className="text-lg sm:text-xl text-[#CBD5E1] font-medium">
            {LAUNCHER_TAGLINE}
          </p>
          <p className="text-sm sm:text-base text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
            Launch a Gemma-powered writing room that plans, writes, edits, audits,
            and packages your story.
          </p>
          <AgentChainPreview className="pt-2" />
        </div>

        <div className="surface-card premium-border rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#CBD5E1]">
              Your story prompt
            </label>
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
            pill
          />

          <StoryStructureFields
            settings={settings}
            onSettingsChange={onSettingsChange}
            disabled={isRunning}
          />

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="premium"
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
              variant="glass"
              size="lg"
              className="flex-1 h-12 text-base"
              onClick={onRunJudgeDemo}
              disabled={isRunning}
            >
              <Gavel className="mr-2 size-5" />
              Run Judge Demo
            </Button>
          </div>
          <p className="text-xs text-center text-[#94A3B8]">
            Judge Demo runs the full pipeline with a curated sci-fi mystery — no
            API key required.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {LAUNCHER_FEATURE_CARDS.map(({ title, icon: Icon, description }) => (
            <div
              key={title}
              className="surface-card premium-border rounded-xl p-5 text-center"
            >
              <Icon className="size-7 mx-auto mb-3 text-[#F5C542]" />
              <p className="font-semibold text-sm text-[#F8FAFC]">{title}</p>
              <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>

        <div className="surface-card premium-border rounded-xl p-5 text-center sm:text-left">
          <p className="text-sm font-medium text-[#CBD5E1] flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="size-4 text-[#F5C542]" />
            Why Gemma 4?
          </p>
          <ul className="mt-3 text-xs text-[#94A3B8] space-y-1.5 list-disc pl-5 inline-block text-left">
            <li>Structured JSON across nine specialized agents</li>
            <li>Long-context story memory for continuity and foreshadowing</li>
            <li>Reasoning-heavy audits, not a single completion call</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
