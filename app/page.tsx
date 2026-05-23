"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AgentWorkspace } from "@/components/AgentWorkspace";
import { CompletedNovelReader } from "@/components/CompletedNovelReader";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import { StartScreen } from "@/components/StartScreen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { downloadFile, exportFullDemoMarkdown } from "@/lib/export";
import { hasManuscript } from "@/lib/format-manuscript";
import { printNovelPdf } from "@/lib/print-novel-pdf";
import { getProjectStatus, isProjectComplete } from "@/lib/project-status";
import { useStoryProject } from "@/lib/useStoryProject";
import type { AgentId } from "@/lib/types";
import { BookOpen, Plus } from "lucide-react";

type AppPhase = "launcher" | "workspace" | "reader";

function deriveAutoPhase(
  project: ReturnType<typeof useStoryProject>["project"],
  isRunning: boolean
): AppPhase {
  if (!project && !isRunning) return "launcher";
  if (project) return "workspace";
  return "launcher";
}

export default function Home() {
  const [manualPhase, setManualPhase] = useState<AppPhase | null>(null);
  const [pendingPrint, setPendingPrint] = useState(false);
  const autoOpenDoneRef = useRef(false);

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
  const canRead = hasManuscript(project);
  const autoPhase = deriveAutoPhase(project, isRunning);
  const phase = manualPhase ?? autoPhase;

  useEffect(() => {
    if (
      !autoOpenDoneRef.current &&
      manualPhase === null &&
      isProjectComplete(project) &&
      !isRunning &&
      canRead
    ) {
      autoOpenDoneRef.current = true;
      setManualPhase("reader");
    }
  }, [project, isRunning, canRead, manualPhase]);

  useEffect(() => {
    if (project && !isProjectComplete(project) && manualPhase === "reader") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- leave reader when pipeline becomes incomplete
      setManualPhase("workspace");
    }
  }, [project, manualPhase]);

  useEffect(() => {
    if (phase === "reader" && pendingPrint && project) {
      const timer = setTimeout(() => {
        printNovelPdf(project);
        setPendingPrint(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [phase, pendingPrint, project]);

  const handleOpenReader = useCallback(() => {
    if (canRead) setManualPhase("reader");
  }, [canRead]);

  const handleBackToWorkspace = useCallback(() => {
    setManualPhase("workspace");
  }, []);

  const handleNewStory = useCallback(() => {
    resetProject();
    setManualPhase(null);
    autoOpenDoneRef.current = false;
    setPendingPrint(false);
  }, [resetProject]);

  const handleDownloadPdf = useCallback(() => {
    if (!canRead) return;
    if (phase === "reader" && project) {
      printNovelPdf(project);
    } else {
      setPendingPrint(true);
      setManualPhase("reader");
    }
  }, [canRead, phase, project]);

  const handleExportMarkdown = useCallback(() => {
    if (!project) return;
    const slug =
      project.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "story";
    downloadFile(
      `${slug}-full-demo.md`,
      exportFullDemoMarkdown(project),
      "text/markdown"
    );
  }, [project]);

  const handleRegenerateAgent = useCallback(
    (agentId: AgentId) => {
      setManualPhase(null);
      autoOpenDoneRef.current = false;
      regenerateAgent(agentId);
    },
    [regenerateAgent]
  );

  if (phase === "reader" && project && canRead) {
    return (
      <CompletedNovelReader
        project={project}
        onBackToWorkspace={handleBackToWorkspace}
        onNewStory={handleNewStory}
        onExportMarkdown={handleExportMarkdown}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <DemoModeBanner
        mockMode={mockMode}
        provider={llmProvider}
        model={llmModel}
      />

      {phase === "launcher" ? (
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
                  onClick={handleNewStory}
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
              onNewStory={handleNewStory}
              onRunJudgeDemo={runJudgeDemo}
              onRegenerate={handleRegenerateAgent}
              onApprove={approveAgent}
              onEditOutput={updateAgentOutput}
              onOpenReader={handleOpenReader}
              onDownloadPdf={handleDownloadPdf}
            />
          )}
        </div>
      )}
    </div>
  );
}
