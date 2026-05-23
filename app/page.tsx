"use client";

import { AgentWorkspace } from "@/components/AgentWorkspace";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import { StartScreen } from "@/components/StartScreen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProjectStatus } from "@/lib/project-status";
import { useStoryProject } from "@/lib/useStoryProject";
import { BookOpen, Plus } from "lucide-react";

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
    resetProject,
    regenerateAgent,
    approveAgent,
    updateAgentOutput,
  } = useStoryProject();

  const projectStatus = getProjectStatus(project, isRunning);
  const showStartScreen = !project && !isRunning;

  return (
    <div className="min-h-screen flex flex-col">
      <DemoModeBanner
        mockMode={mockMode}
        provider={llmProvider}
        model={llmModel}
      />

      {showStartScreen ? (
        <StartScreen
          settings={settings}
          onSettingsChange={updateSettings}
          onGenerate={generateStory}
          onRunJudgeDemo={runJudgeDemo}
          isRunning={isRunning}
        />
      ) : (
        <div className="animate-fade-in flex flex-col flex-1">
          <header className="glass-card premium-border border-x-0 border-t-0 sticky top-0 z-20 backdrop-blur-xl">
            <div className="mx-auto max-w-[1600px] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[oklch(0.78_0.14_75/15%)] text-[oklch(0.78_0.14_75)]">
                  <BookOpen className="size-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-bold tracking-tight truncate">
                    NovelPilot
                  </h1>
                  <p className="text-xs text-muted-foreground truncate">
                    {project?.title ?? "Agent workspace"}
                    {!mockMode && (
                      <span className="font-mono text-[10px] ml-2 opacity-70">
                        {llmProvider}
                        {llmModel ? ` / ${llmModel}` : ""}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    projectStatus === "Failed"
                      ? "destructive"
                      : projectStatus === "Completed"
                        ? "default"
                        : projectStatus === "Running"
                          ? "secondary"
                          : "outline"
                  }
                  className={
                    projectStatus === "Running"
                      ? "border-[oklch(0.72_0.14_220/40%)] text-[oklch(0.72_0.14_220)]"
                      : projectStatus === "Completed"
                        ? "border-[oklch(0.78_0.14_75/40%)] bg-[oklch(0.78_0.14_75/15%)]"
                        : ""
                  }
                >
                  {projectStatus}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    mockMode
                      ? "border-[oklch(0.78_0.14_75/30%)] text-[oklch(0.78_0.14_75)]"
                      : "border-[oklch(0.72_0.14_220/30%)] text-[oklch(0.72_0.14_220)]"
                  }
                >
                  {mockMode ? "Demo Mode" : "Live Mode"}
                </Badge>
                <Button
                  variant="glass"
                  size="sm"
                  onClick={resetProject}
                  disabled={isRunning}
                >
                  <Plus className="mr-1.5 size-3.5" />
                  New Story
                </Button>
              </div>
            </div>
          </header>

          {project && (
            <AgentWorkspace
              project={project}
              settings={settings}
              isRunning={isRunning}
              projectStatus={projectStatus}
              mockMode={mockMode}
              llmProvider={llmProvider}
              llmModel={llmModel}
              onStop={stopGeneration}
              onNewStory={resetProject}
              onRunJudgeDemo={runJudgeDemo}
              onRegenerate={regenerateAgent}
              onApprove={approveAgent}
              onEditOutput={updateAgentOutput}
            />
          )}
        </div>
      )}
    </div>
  );
}
