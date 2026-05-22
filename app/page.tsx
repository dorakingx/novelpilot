"use client";

import { AgentWorkspace } from "@/components/AgentWorkspace";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import { StartScreen } from "@/components/StartScreen";
import { Badge } from "@/components/ui/badge";
import { getProjectStatus } from "@/lib/project-status";
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
        <>
          <header className="border-b border-border/60 bg-card/40 backdrop-blur-md sticky top-0 z-10">
            <div className="mx-auto max-w-[1600px] px-4 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">NovelPilot</h1>
                  <p className="text-xs text-muted-foreground">
                    Agent workspace
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {project && (
                  <Badge variant="secondary">{project.title}</Badge>
                )}
                <Badge
                  variant={
                    projectStatus === "Failed"
                      ? "destructive"
                      : projectStatus === "Completed"
                        ? "default"
                        : "outline"
                  }
                >
                  {projectStatus}
                </Badge>
                <Badge variant="outline">
                  {mockMode ? "Demo Mode" : "Live Mode"}
                </Badge>
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
        </>
      )}
    </div>
  );
}
