"use client";

import { AgentPipelineBar } from "@/components/AgentPipelineBar";
import { AgentTimeline } from "@/components/AgentTimeline";
import { ContinuityReport } from "@/components/ContinuityReport";
import { ExportPanel } from "@/components/ExportPanel";
import { ForeshadowingTracker } from "@/components/ForeshadowingTracker";
import { ManuscriptPreview } from "@/components/ManuscriptPreview";
import { PipelineCompleteCard } from "@/components/PipelineCompleteCard";
import { ProjectControlPanel } from "@/components/ProjectControlPanel";
import { StoryBiblePreview } from "@/components/StoryBiblePreview";
import type { ProjectStatus } from "@/lib/project-status";
import type { AgentId, ProjectSettings, StoryProject } from "@/lib/types";

interface AgentWorkspaceProps {
  project: StoryProject;
  settings: ProjectSettings;
  isRunning: boolean;
  projectStatus: ProjectStatus;
  mockMode: boolean;
  llmProvider: string;
  llmModel: string;
  onStop: () => void;
  onNewStory: () => void;
  onRunJudgeDemo: () => void;
  onRegenerate: (agentId: AgentId) => void;
  onApprove: (agentId: AgentId) => void;
  onEditOutput: (agentId: AgentId, output: unknown) => void;
  onOpenReader?: () => void;
}

export function AgentWorkspace({
  project,
  settings,
  isRunning,
  projectStatus,
  mockMode,
  llmProvider,
  llmModel,
  onStop,
  onNewStory,
  onRunJudgeDemo,
  onRegenerate,
  onApprove,
  onEditOutput,
  onOpenReader,
}: AgentWorkspaceProps) {
  const handleReviewContinuity = () => {
    document
      .getElementById("continuity-report")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <main className="flex-1 mx-auto w-full max-w-[1600px] px-4 py-6 space-y-6">
        <AgentPipelineBar agents={project.agents} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3 space-y-4 order-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground hidden lg:block">
              Command deck
            </p>
            <ProjectControlPanel
              project={project}
              settings={settings}
              mockMode={mockMode}
              llmProvider={llmProvider}
              llmModel={llmModel}
              isRunning={isRunning}
              onStop={onStop}
              onNewStory={onNewStory}
              onRunJudgeDemo={onRunJudgeDemo}
              onOpenReader={onOpenReader}
            />
          </aside>

          <section className="lg:col-span-5 space-y-4 order-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground hidden lg:block">
              Writing room
            </p>
            {projectStatus === "Completed" && (
              <PipelineCompleteCard
                project={project}
                onOpenReader={onOpenReader}
                onReviewContinuity={handleReviewContinuity}
              />
            )}
            <AgentTimeline
              project={project}
              isRunning={isRunning}
              projectStatus={projectStatus}
              onRegenerate={onRegenerate}
              onApprove={onApprove}
              onEditOutput={onEditOutput}
            />
          </section>

          <aside className="lg:col-span-4 space-y-4 order-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground hidden lg:block">
              Artifacts
            </p>
            <StoryBiblePreview project={project} isRunning={isRunning} />
            <ForeshadowingTracker project={project} isRunning={isRunning} />
            <ManuscriptPreview
              project={project}
              isRunning={isRunning}
              onOpenReader={onOpenReader}
            />
            <div id="continuity-report">
              <ContinuityReport project={project} isRunning={isRunning} />
            </div>
            <ExportPanel project={project} onOpenReader={onOpenReader} />
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
