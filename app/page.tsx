"use client";

import { AgentTimeline } from "@/components/AgentTimeline";
import { ContinuityReport } from "@/components/ContinuityReport";
import { ExportPanel } from "@/components/ExportPanel";
import { ManuscriptPreview } from "@/components/ManuscriptPreview";
import { StoryBiblePreview } from "@/components/StoryBiblePreview";
import { StoryPromptPanel } from "@/components/StoryPromptPanel";
import { Badge } from "@/components/ui/badge";
import { useStoryProject } from "@/lib/useStoryProject";
import { BookOpen, Cpu } from "lucide-react";

export default function Home() {
  const {
    settings,
    updateSettings,
    project,
    isRunning,
    mockMode,
    generateStory,
    stopGeneration,
    regenerateAgent,
  } = useStoryProject();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto max-w-[1600px] px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <BookOpen className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                NovelPilot
              </h1>
              <p className="text-xs text-muted-foreground">
                Gemma 4-powered novel creation workflow
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Cpu className="size-3" />
              {mockMode ? "Mock Mode" : "Gemma 4 Live"}
            </Badge>
            {project && (
              <Badge variant="secondary">{project.title}</Badge>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-[1600px] px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3 space-y-4">
            <StoryPromptPanel
              settings={settings}
              onSettingsChange={updateSettings}
              onGenerate={generateStory}
              onStop={stopGeneration}
              isRunning={isRunning}
            />
          </aside>

          <section className="lg:col-span-5">
            <AgentTimeline
              project={project}
              isRunning={isRunning}
              onRegenerate={regenerateAgent}
            />
          </section>

          <aside className="lg:col-span-4 space-y-4">
            <StoryBiblePreview project={project} />
            <ManuscriptPreview project={project} />
            <ContinuityReport project={project} />
            <ExportPanel project={project} />
          </aside>
        </div>
      </main>

      <footer className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        Nine specialized agents — Concept → Character → World → Plot → Outline →
        Draft → Edit → Continuity → Publish
      </footer>
    </div>
  );
}
