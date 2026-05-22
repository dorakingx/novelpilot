"use client";

import { AgentTimeline } from "@/components/AgentTimeline";
import { ContinuityReport } from "@/components/ContinuityReport";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import { ExportPanel } from "@/components/ExportPanel";
import { ForeshadowingTracker } from "@/components/ForeshadowingTracker";
import { ManuscriptPreview } from "@/components/ManuscriptPreview";
import { StoryBiblePreview } from "@/components/StoryBiblePreview";
import { StoryPromptPanel } from "@/components/StoryPromptPanel";
import { WhyGemma4Panel } from "@/components/WhyGemma4Panel";
import { Badge } from "@/components/ui/badge";
import { useStoryProject } from "@/lib/useStoryProject";
import { BookOpen } from "lucide-react";

export default function Home() {
  const {
    settings,
    updateSettings,
    project,
    isRunning,
    mockMode,
    llmProvider,
    llmModel,
    generateStory,
    runJudgeDemo,
    stopGeneration,
    regenerateAgent,
    approveAgent,
    updateAgentOutput,
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
              <h1 className="text-xl font-bold tracking-tight">NovelPilot</h1>
              <p className="text-xs text-muted-foreground">
                Gemma 4 autonomous writing room
              </p>
            </div>
          </div>
          {project && (
            <Badge variant="secondary">{project.title}</Badge>
          )}
        </div>
      </header>

      <DemoModeBanner
        mockMode={mockMode}
        provider={llmProvider}
        model={llmModel}
      />

      <main className="flex-1 mx-auto w-full max-w-[1600px] px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3 space-y-4">
            <StoryPromptPanel
              settings={settings}
              onSettingsChange={updateSettings}
              onGenerate={generateStory}
              onRunJudgeDemo={runJudgeDemo}
              onStop={stopGeneration}
              isRunning={isRunning}
            />
            <WhyGemma4Panel />
          </aside>

          <section className="lg:col-span-5">
            <AgentTimeline
              project={project}
              isRunning={isRunning}
              onRegenerate={regenerateAgent}
              onApprove={approveAgent}
              onEditOutput={updateAgentOutput}
              onRunJudgeDemo={runJudgeDemo}
            />
          </section>

          <aside className="lg:col-span-4 space-y-4">
            <StoryBiblePreview project={project} />
            <ForeshadowingTracker project={project} />
            <ManuscriptPreview project={project} />
            <ContinuityReport project={project} />
            <ExportPanel project={project} />
          </aside>
        </div>
      </main>

      <footer className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground px-4">
        Premise Architect → Character Director → World Builder → Plot Strategist
        → Chapter Architect → Prose Writer → Style Editor → Continuity Detective
        → Publisher Agent
      </footer>
    </div>
  );
}
