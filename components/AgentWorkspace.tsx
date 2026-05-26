"use client";

import { AgentPipelineBar } from "@/components/AgentPipelineBar";
import { AgentTimeline } from "@/components/AgentTimeline";
import { ContinuityReport } from "@/components/ContinuityReport";
import { ExportPanel } from "@/components/ExportPanel";
import { ForeshadowingTracker } from "@/components/ForeshadowingTracker";
import { ManuscriptPreview } from "@/components/ManuscriptPreview";
import { PipelineCompleteCard } from "@/components/PipelineCompleteCard";
import { ProjectControlPanel } from "@/components/ProjectControlPanel";
import { ReadNovelButton } from "@/components/ReadNovelButton";
import { ChapterOutlineFailurePanel } from "@/components/ChapterOutlineFailurePanel";
import { StructureDesigner } from "@/components/StructureDesigner";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, Play } from "lucide-react";
import { StoryBiblePreview } from "@/components/StoryBiblePreview";
import { StoryStructurePanel } from "@/components/StoryStructurePanel";
import type { PartPlan } from "@/lib/types";
import type { ProjectStatus } from "@/lib/project-status";
import type { LlmStatus } from "@/lib/llm-config";
import type { AgentId, ProjectSettings, StoryProject } from "@/lib/types";

interface AgentWorkspaceProps {
  project: StoryProject;
  settings: ProjectSettings;
  isRunning: boolean;
  projectStatus: ProjectStatus;
  projectComplete: boolean;
  canReadNovel: boolean;
  isGeneratingPdf: boolean;
  mockMode: boolean;
  llmStatus?: LlmStatus | null;
  onStop: () => void;
  onNewStory: () => void;
  onRunJudgeDemo: () => void;
  onRegenerate: (agentId: AgentId) => void;
  onApprove: (agentId: AgentId) => void;
  onEditOutput: (agentId: AgentId, output: unknown) => void;
  onOpenReader?: () => void;
  onDownloadPdf?: () => void;
  onApproveStructureAndContinue?: () => void;
  onUpdateStructure?: (parts: PartPlan[]) => void;
  onRegenerateStructure?: () => void;
  onApplyFallbackChapterOutline?: () => void;
  onReturnToStructureSettings?: () => void;
  onContinuePipeline?: () => void;
  onContinueDrafting?: () => void;
  onResumeDraftingFromChapter?: (chapterNumber: number) => void;
  showContinuePipeline?: boolean;
  showContinueDrafting?: boolean;
}

export function AgentWorkspace({
  project,
  settings,
  isRunning,
  projectStatus,
  projectComplete,
  canReadNovel,
  isGeneratingPdf,
  mockMode,
  llmStatus = null,
  onStop,
  onNewStory,
  onRunJudgeDemo,
  onRegenerate,
  onApprove,
  onEditOutput,
  onOpenReader,
  onDownloadPdf,
  onApproveStructureAndContinue,
  onUpdateStructure,
  onRegenerateStructure,
  onApplyFallbackChapterOutline,
  onReturnToStructureSettings,
  onContinuePipeline,
  onContinueDrafting,
  onResumeDraftingFromChapter,
  showContinuePipeline = false,
  showContinueDrafting = false,
}: AgentWorkspaceProps) {
  const readLabel = projectComplete ? "Read Finished Novel" : "Read Manuscript";
  const chapterOutlineAgent = project.agents.find(
    (a) => a.id === "chapter-outline"
  );
  const showChapterOutlineFailure =
    chapterOutlineAgent?.status === "failed" &&
    !project.awaitingStructureApproval;

  const handleReviewContinuity = () => {
    document
      .getElementById("continuity-report")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <main className="flex-1 mx-auto w-full max-w-[1600px] px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AgentPipelineBar agents={project.agents} />
          {projectComplete && onOpenReader && (
            <ReadNovelButton
              onClick={onOpenReader}
              disabled={!canReadNovel}
              label={readLabel}
              className="shrink-0"
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3 space-y-4 order-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground hidden lg:block">
              Command deck
            </p>
            <ProjectControlPanel
              project={project}
              settings={settings}
              mockMode={mockMode}
              llmStatus={llmStatus}
              isRunning={isRunning}
              projectComplete={projectComplete}
              canReadNovel={canReadNovel}
              isGeneratingPdf={isGeneratingPdf}
              onStop={onStop}
              onNewStory={onNewStory}
              onRunJudgeDemo={onRunJudgeDemo}
              onOpenReader={onOpenReader}
              onDownloadPdf={onDownloadPdf}
              readLabel={readLabel}
            />
          </aside>

          <section className="lg:col-span-5 space-y-4 order-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground hidden lg:block">
              Writing room
            </p>
            {project.awaitingStructureApproval && !isRunning && (
              <>
                {project.structureFallbackUsed && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-start gap-3">
                    <AlertTriangle className="size-5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-[#CBD5E1]">
                      Fallback structure used. You can edit it before drafting.
                      Chapter Architect returned invalid structure, so NovelPilot
                      used a safe editable structure.
                    </p>
                  </div>
                )}
                <div className="rounded-2xl border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-4 py-3 flex items-start gap-3">
                  <Info className="size-5 text-[#38BDF8] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#CBD5E1]">
                    Structure is ready. Review and approve to continue — this pause
                    is intentional, not an error.
                  </p>
                </div>
              </>
            )}
            {showContinuePipeline && onContinuePipeline && (
              <div className="flex justify-end gap-2">
                {showContinueDrafting && onContinueDrafting && (
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={onContinueDrafting}
                    disabled={isRunning}
                  >
                    <Play className="size-3.5 mr-1.5" />
                    Continue Drafting
                  </Button>
                )}
                <Button
                  variant="premium"
                  size="sm"
                  onClick={onContinuePipeline}
                  disabled={isRunning}
                >
                  <Play className="size-3.5 mr-1.5" />
                  Continue Pipeline
                </Button>
              </div>
            )}
            {showChapterOutlineFailure &&
              onApplyFallbackChapterOutline &&
              onReturnToStructureSettings && (
                <ChapterOutlineFailurePanel
                  errorMessage={chapterOutlineAgent?.error}
                  disabled={isRunning}
                  onRetryAndContinue={() => onRegenerate("chapter-outline")}
                  onUseFallback={onApplyFallbackChapterOutline}
                  onReturnToStructureSettings={onReturnToStructureSettings}
                />
              )}
            {project.awaitingStructureApproval && onApproveStructureAndContinue && (
              <StructureDesigner
                project={project}
                isRunning={isRunning}
                onApproveAndContinue={onApproveStructureAndContinue}
                onRegenerateStructure={onRegenerateStructure ?? (() => {})}
                onUpdateStructure={onUpdateStructure ?? (() => {})}
              />
            )}
            {projectComplete && (
              <PipelineCompleteCard
                project={project}
                onOpenReader={onOpenReader}
                onDownloadPdf={onDownloadPdf}
                isGeneratingPdf={isGeneratingPdf}
                canReadNovel={canReadNovel}
                readLabel={readLabel}
                onReviewContinuity={handleReviewContinuity}
              />
            )}
            <AgentTimeline
              project={project}
              isRunning={isRunning}
              projectStatus={projectStatus}
              onRegenerate={onRegenerate}
              onResumeDraftingFromChapter={onResumeDraftingFromChapter}
              onApprove={onApprove}
              onEditOutput={onEditOutput}
            />
          </section>

          <aside className="lg:col-span-4 space-y-4 order-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground hidden lg:block">
              Artifacts
            </p>
            <StoryStructurePanel project={project} isRunning={isRunning} />
            <StoryBiblePreview project={project} isRunning={isRunning} />
            <ForeshadowingTracker project={project} isRunning={isRunning} />
            <ManuscriptPreview
              project={project}
              isRunning={isRunning}
              projectComplete={projectComplete}
              canReadNovel={canReadNovel}
              isGeneratingPdf={isGeneratingPdf}
              readLabel={readLabel}
              onOpenReader={onOpenReader}
              onDownloadPdf={onDownloadPdf}
            />
            <div id="continuity-report">
              <ContinuityReport project={project} isRunning={isRunning} />
            </div>
            <ExportPanel
              project={project}
              projectComplete={projectComplete}
              canReadNovel={canReadNovel}
              isGeneratingPdf={isGeneratingPdf}
              readLabel={readLabel}
              onOpenReader={onOpenReader}
              onDownloadPdf={onDownloadPdf}
            />
          </aside>
        </div>
      </main>

      <footer className="border-t border-white/12 py-4 text-center text-xs text-[#94A3B8] px-4 bg-[#111827]">
        Premise Architect → Character Director → World Builder → Plot Strategist
        → Chapter Architect → Prose Writer → Style Editor → Continuity Detective
        → Publisher Agent
      </footer>
    </>
  );
}
