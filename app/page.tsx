"use client";

import { useState } from "react";
import { AgentWorkspace } from "@/components/AgentWorkspace";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import { NovelReader } from "@/components/NovelReader";
import { StartScreen } from "@/components/StartScreen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hasManuscript } from "@/lib/format-manuscript";
import { getProjectStatus } from "@/lib/project-status";
import { useStoryProject } from "@/lib/useStoryProject";
import { BookOpen, Plus } from "lucide-react";

export default function Home() {
  const [readerOpen, setReaderOpen] = useState(false);

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
  const canRead = hasManuscript(project);

  const handleOpenReader = () => {
    if (canRead) setReaderOpen(true);
  };

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
          <header className="sticky top-0 z-20 border-b border-white/12 bg-[#111827]">
            <div className="mx-auto max-w-[1600px] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(245,197,66,0.16)] text-[#F5C542]">
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
                      ? "error"
                      : projectStatus === "Completed"
                        ? "completed"
                        : projectStatus === "Running"
                          ? "running"
                          : "outline"
                  }
                >
                  {projectStatus}
                </Badge>
                <Badge variant={mockMode ? "demo" : "live"}>
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
              onOpenReader={handleOpenReader}
            />
          )}
        </div>
      )}

      {readerOpen && project && canRead && (
        <NovelReader
          project={project}
          onClose={() => setReaderOpen(false)}
        />
      )}
    </div>
  );
}
