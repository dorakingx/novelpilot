"use client";

import { AgentTimeline } from "@/components/AgentTimeline";
import { ContinuityReport } from "@/components/ContinuityReport";
import { ExportPanel } from "@/components/ExportPanel";
import { ForeshadowingTracker } from "@/components/ForeshadowingTracker";
import { ManuscriptPreview } from "@/components/ManuscriptPreview";
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
}: AgentWorkspaceProps) {
  return (
    <>
      <main className="flex-1 mx-auto w-full max-w-[1600px] px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3 space-y-4">
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
            />
          </aside>

          <section className="lg:col-span-5">
            <AgentTimeline
              project={project}
              isRunning={isRunning}
              projectStatus={projectStatus}
              onRegenerate={onRegenerate}
              onApprove={onApprove}
              onEditOutput={onEditOutput}
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
    </>
  );
}
