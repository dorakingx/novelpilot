"use client";

import { useCallback, useState } from "react";
import { ChapterDraftingWorkspace } from "@/components/ChapterDraftingWorkspace";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import { FinalManuscriptWorkspace } from "@/components/FinalManuscriptWorkspace";
import { StartScreen } from "@/components/StartScreen";
import { StoryPlanningWorkspace } from "@/components/StoryPlanningWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { rebuildProjectManuscript } from "@/lib/format-manuscript";
import { downloadNovelPdf } from "@/lib/print-novel-pdf";
import {
  canReadNovel,
  getProjectStatus,
} from "@/lib/project-status";
import { deriveWorkflowStage } from "@/lib/workflow-utils";
import { useStoryProject } from "@/lib/useStoryProject";
import type { WorkflowStage } from "@/lib/types";
import { getMissingChapterNumbers } from "@/lib/workflow-utils";
import { BookOpen, Plus } from "lucide-react";

export default function Home() {
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
    approvePlanningAndGoToDrafting,
    generateChapter,
    regenerateChapter,
    generateRemainingChapters,
    finalizeManuscript,
    goToStage,
    regeneratePlanningElement,
    applyPlanningEdit,
    applyPlanPatch,
    applyChapterRevision,
    applyChapterEdit,
  } = useStoryProject();

  const workflowStage: WorkflowStage = project
    ? (project.workflowStage ?? deriveWorkflowStage(project))
    : "launcher";

  const projectStatus = getProjectStatus(project, isRunning);

  const handleNewStory = useCallback(() => {
    resetProject();
  }, [resetProject]);

  const handleDownloadPdf = useCallback(() => {
    if (!canReadNovel(project) || !project) return;
    const missing = getMissingChapterNumbers(project);
    if (missing.length > 0) {
      const ok = window.confirm(
        `Chapters ${missing.join(", ")} are missing. Export anyway?`
      );
      if (!ok) return;
    }
    setIsGeneratingPdf(true);
    downloadNovelPdf(rebuildProjectManuscript(project));
    setTimeout(() => setIsGeneratingPdf(false), 600);
  }, [project]);

  const handleNavigateStage = useCallback(
    (stage: WorkflowStage) => {
      if (!project) return;
      if (
        stage === "planning" &&
        workflowStage === "drafting" &&
        !window.confirm(
          "Going back to planning keeps existing drafts. Continue?"
        )
      ) {
        return;
      }
      if (
        stage === "drafting" &&
        workflowStage === "final" &&
        !window.confirm("Return to chapter drafting?")
      ) {
        return;
      }
      goToStage(stage);
    },
    [project, workflowStage, goToStage]
  );

  const handleGenerateNextPending = useCallback(() => {
    if (!project) return;
    const missing = getMissingChapterNumbers(project);
    if (missing[0] != null) void generateChapter(missing[0]);
  }, [project, generateChapter]);

  const handleRetryFailed = useCallback(() => {
    void generateRemainingChapters();
  }, [generateRemainingChapters]);

  const showWorkspaceChrome =
    project && workflowStage !== "launcher" && workflowStage !== "final";

  return (
    <div className="min-h-screen flex flex-col">
      <DemoModeBanner
        mockMode={mockMode}
        provider={llmProvider}
        model={llmModel}
        llmStatus={llmStatus}
        projectAiModel={
          workflowStage === "launcher" ? settings.aiModel : project?.aiModel
        }
      />

      {workflowStage === "launcher" || !project ? (
        <StartScreen
          settings={settings}
          onSettingsChange={updateSettings}
          onGenerate={generateStory}
          onRunJudgeDemo={runJudgeDemo}
          isRunning={isRunning}
          llmStatus={llmStatus}
        />
      ) : workflowStage === "final" ? (
        <FinalManuscriptWorkspace
          project={project}
          isRunning={isRunning}
          onBackToDrafting={() => goToStage("drafting")}
          onGenerateMissing={() => {
            goToStage("drafting");
            void generateRemainingChapters();
          }}
          onFinalize={() => void finalizeManuscript()}
          onDownloadPdf={handleDownloadPdf}
          onNewStory={handleNewStory}
          onNavigateStage={handleNavigateStage}
          isGeneratingPdf={isGeneratingPdf}
        />
      ) : (
        <div className="animate-fade-in flex flex-col flex-1">
          {showWorkspaceChrome && (
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
                      {project.title}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      projectStatus === "Failed"
                        ? "error"
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
                  {isRunning && (
                    <Button variant="destructive" size="sm" onClick={stopGeneration}>
                      Stop
                    </Button>
                  )}
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
          )}

          {workflowStage === "planning" && (
            <StoryPlanningWorkspace
              project={project}
              isRunning={isRunning}
              onRegenerateElement={(id) => void regeneratePlanningElement(id)}
              onEditElement={applyPlanningEdit}
              onApprovePlan={() => void approvePlanningAndGoToDrafting()}
              onGoBack={handleNewStory}
              onApplyPlanPatch={applyPlanPatch}
              onNavigateStage={handleNavigateStage}
            />
          )}

          {workflowStage === "drafting" && (
            <ChapterDraftingWorkspace
              project={project}
              isRunning={isRunning}
              onGenerateChapter={(n) => void generateChapter(n)}
              onRegenerateChapter={(n) => void regenerateChapter(n)}
              onGenerateRemaining={() => void generateRemainingChapters()}
              onGenerateNextPending={handleGenerateNextPending}
              onRetryFailed={handleRetryFailed}
              onFinalize={() => {
                void finalizeManuscript();
              }}
              onBackToPlanning={() => handleNavigateStage("planning")}
              onSaveChapterEdit={applyChapterEdit}
              onApplyChapterRevision={applyChapterRevision}
              onNavigateStage={handleNavigateStage}
            />
          )}
        </div>
      )}
    </div>
  );
}
