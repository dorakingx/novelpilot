"use client";

import { useCallback, useEffect, useState } from "react";
import { AgentWorkspace } from "@/components/AgentWorkspace";
import { CompletedNovelReader } from "@/components/CompletedNovelReader";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import { StartScreen } from "@/components/StartScreen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { downloadFile, exportFullDemoMarkdown } from "@/lib/export";
import { rebuildProjectManuscript } from "@/lib/format-manuscript";
import { downloadNovelPdf } from "@/lib/print-novel-pdf";
import {
  canReadNovel,
  getProjectStatus,
  isProjectComplete,
} from "@/lib/project-status";
import { useStoryProject } from "@/lib/useStoryProject";
import type { AgentId } from "@/lib/types";
import { BookOpen, Plus } from "lucide-react";

type AppPhase = "launcher" | "workspace" | "reader";

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>("launcher");
  const [hasAutoOpenedReader, setHasAutoOpenedReader] = useState(false);
  const [pendingPrint, setPendingPrint] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const {
    settings,
    updateSettings,
    project,
    isRunning,
    mockMode,
    llmProvider,
    llmModel,
    llmStatus,
    generateStory,
    runJudgeDemo,
    stopGeneration,
    resetProject,
    regenerateAgent,
    approveAgent,
    updateAgentOutput,
    approveStructureAndContinue,
    updateStructure,
    regenerateStructure,
    applyFallbackChapterOutline,
    continuePipeline,
    continueDrafting,
    resumeDraftingFromChapter,
    showContinuePipeline,
    showContinueDrafting,
  } = useStoryProject();

  const projectStatus = getProjectStatus(project, isRunning);
  const projectComplete = isProjectComplete(project);
  const canRead = canReadNovel(project);

  useEffect(() => {
    if (!project && !isRunning) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset phase when project clears
      setPhase("launcher");
      setHasAutoOpenedReader(false);
      setPendingPrint(false);
    }
  }, [project, isRunning]);

  useEffect(() => {
    if (project && phase === "launcher") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- enter workspace when project starts
      setPhase("workspace");
    }
  }, [project, phase]);

  useEffect(() => {
    if (
      isProjectComplete(project) &&
      !hasAutoOpenedReader &&
      !isRunning &&
      !project?.awaitingStructureApproval
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time auto-open on completion
      setPhase("reader");
      setHasAutoOpenedReader(true);
    }
  }, [project, hasAutoOpenedReader, isRunning]);

  useEffect(() => {
    if (project && !isProjectComplete(project) && phase === "reader") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- leave reader when pipeline becomes incomplete
      setPhase("workspace");
    }
  }, [project, phase]);

  useEffect(() => {
    if (phase === "reader" && pendingPrint && project) {
      const timer = setTimeout(() => {
        setIsGeneratingPdf(true);
        downloadNovelPdf(project);
        setPendingPrint(false);
        setTimeout(() => setIsGeneratingPdf(false), 600);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [phase, pendingPrint, project]);

  const openReader = useCallback(() => {
    if (canReadNovel(project)) setPhase("reader");
  }, [project]);

  const handleBackToWorkspace = useCallback(() => {
    setPhase("workspace");
  }, []);

  const handleNewStory = useCallback(() => {
    resetProject();
    setPhase("launcher");
    setHasAutoOpenedReader(false);
    setPendingPrint(false);
  }, [resetProject]);

  const handleDownloadPdf = useCallback(() => {
    if (!canReadNovel(project) || !project) return;
    if (phase !== "reader") {
      setPendingPrint(true);
      setPhase("reader");
      return;
    }
    setIsGeneratingPdf(true);
    downloadNovelPdf(rebuildProjectManuscript(project));
    setTimeout(() => setIsGeneratingPdf(false), 600);
  }, [phase, project]);

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
      setPhase("workspace");
      setHasAutoOpenedReader(false);
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
        onDownloadPdf={handleDownloadPdf}
        onExportMarkdown={handleExportMarkdown}
        isGeneratingPdf={isGeneratingPdf}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <DemoModeBanner
        mockMode={mockMode}
        provider={llmProvider}
        model={llmModel}
        llmStatus={llmStatus}
        projectAiModel={
          phase === "launcher" ? settings.aiModel : project?.aiModel
        }
      />

      {phase === "launcher" ? (
        <StartScreen
          settings={settings}
          onSettingsChange={updateSettings}
          onGenerate={generateStory}
          onRunJudgeDemo={runJudgeDemo}
          isRunning={isRunning}
          llmStatus={llmStatus}
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
                          : projectStatus === "Awaiting structure approval"
                            ? "warning"
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
              projectComplete={projectComplete}
              canReadNovel={canRead}
              isGeneratingPdf={isGeneratingPdf}
              mockMode={mockMode}
              llmStatus={llmStatus}
              onStop={stopGeneration}
              onNewStory={handleNewStory}
              onRunJudgeDemo={runJudgeDemo}
              onRegenerate={handleRegenerateAgent}
              onApprove={approveAgent}
              onEditOutput={updateAgentOutput}
              onOpenReader={openReader}
              onDownloadPdf={handleDownloadPdf}
              onApproveStructureAndContinue={approveStructureAndContinue}
              onUpdateStructure={updateStructure}
              onRegenerateStructure={regenerateStructure}
              onApplyFallbackChapterOutline={applyFallbackChapterOutline}
              onReturnToStructureSettings={() => setPhase("launcher")}
              onContinuePipeline={continuePipeline}
              onContinueDrafting={continueDrafting}
              onResumeDraftingFromChapter={resumeDraftingFromChapter}
              showContinuePipeline={showContinuePipeline}
              showContinueDrafting={showContinueDrafting}
            />
          )}
        </div>
      )}
    </div>
  );
}
