"use client";

import { PlanningElementCard } from "@/components/PlanningElementCard";
import { PlanChatPanel } from "@/components/PlanChatPanel";
import { WorkflowProgressBar } from "@/components/WorkflowProgressBar";
import { Button } from "@/components/ui/button";
import { getOrderedParts } from "@/lib/format-manuscript";
import type {
  PlanningElementId,
  StoryBible,
  StoryProject,
  WorkflowStage,
} from "@/lib/types";
import { ArrowRight, Loader2 } from "lucide-react";

interface StoryPlanningWorkspaceProps {
  project: StoryProject;
  isRunning: boolean;
  onRegenerateElement: (id: PlanningElementId) => void;
  onEditElement: (id: PlanningElementId, data: unknown) => void;
  onApprovePlan: () => void;
  onGoBack: () => void;
  onApplyPlanPatch: (patch: Partial<StoryBible>, structureChanged?: boolean) => void;
  onNavigateStage: (stage: WorkflowStage) => void;
}

function ConceptPreview({ project }: { project: StoryProject }) {
  const c = project.storyBible.concept;
  if (!c) return <p>Not generated yet.</p>;
  return (
    <ul className="space-y-1 list-none">
      <li><strong>Logline:</strong> {c.logline}</li>
      <li><strong>Theme:</strong> {c.coreTheme}</li>
      <li><strong>Conflict:</strong> {c.centralConflict}</li>
      <li><strong>Promise:</strong> {c.emotionalPromise}</li>
      <li><strong>Hook:</strong> {c.uniqueHook}</li>
    </ul>
  );
}

function CharactersPreview({ project }: { project: StoryProject }) {
  const chars = project.storyBible.characters;
  if (!chars.length) return <p>Not generated yet.</p>;
  return (
    <ul className="space-y-2">
      {chars.map((c) => (
        <li key={c.name}>
          <strong>{c.name}</strong> ({c.role}) — {c.desire}
        </li>
      ))}
    </ul>
  );
}

function WorldPreview({ project }: { project: StoryProject }) {
  const w = project.storyBible.worldbuilding;
  if (!w) return <p>Not generated yet.</p>;
  return (
    <ul className="space-y-1">
      <li>{w.setting}</li>
      <li>{w.atmosphere}</li>
      <li>Rules: {w.rules}</li>
    </ul>
  );
}

function PlotPreview({ project }: { project: StoryProject }) {
  const p = project.storyBible.plot;
  if (!p) return <p>Not generated yet.</p>;
  return (
    <ul className="space-y-1">
      <li><strong>Beginning:</strong> {p.beginning}</li>
      <li><strong>Middle:</strong> {p.middle}</li>
      <li><strong>Climax:</strong> {p.climax}</li>
      <li><strong>Ending:</strong> {p.ending}</li>
    </ul>
  );
}

function StructurePreview({ project }: { project: StoryProject }) {
  const parts = getOrderedParts(project);
  if (!parts.length) return <p>Not generated yet.</p>;
  return (
    <ul className="space-y-2">
      {parts.map((part) => (
        <li key={part.id}>
          <strong>Part {part.number}:</strong> {part.title}
          <ul className="ml-3 mt-1">
            {part.chapters.map((ch) => (
              <li key={ch.number}>
                Ch.{ch.number} {ch.title} — {ch.purpose}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function StylePreview({ project }: { project: StoryProject }) {
  const sg = project.storyBible.styleGuide;
  if (!sg) return <p>Not available yet.</p>;
  return (
    <p>
      {sg.pov} / {sg.tense} — {sg.proseStyle}
    </p>
  );
}

const PREVIEW_MAP: Record<
  PlanningElementId,
  (p: StoryProject) => React.ReactNode
> = {
  concept: (p) => <ConceptPreview project={p} />,
  characters: (p) => <CharactersPreview project={p} />,
  worldbuilding: (p) => <WorldPreview project={p} />,
  plot: (p) => <PlotPreview project={p} />,
  structure: (p) => <StructurePreview project={p} />,
  styleGuide: (p) => <StylePreview project={p} />,
  foreshadowing: (p) => {
    const items = p.storyBible.foreshadowingTracker;
    if (!items.length) return <p>None tracked yet.</p>;
    return (
      <ul className="space-y-1">
        {items.map((f, i) => (
          <li key={i}>
            {f.item} → payoff {f.payoffChapter} ({f.status})
          </li>
        ))}
      </ul>
    );
  },
};

export function StoryPlanningWorkspace({
  project,
  isRunning,
  onRegenerateElement,
  onEditElement,
  onApprovePlan,
  onGoBack,
  onApplyPlanPatch,
  onNavigateStage,
}: StoryPlanningWorkspaceProps) {
  const elements = project.planningElements ?? [];

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 flex-1 w-full">
      <div className="mb-6 space-y-2">
        <WorkflowProgressBar
          currentStage="planning"
          onNavigate={onNavigateStage}
          disabled={isRunning}
        />
        <h2 className="text-2xl font-bold">Story Blueprint</h2>
        <p className="text-sm text-muted-foreground">
          Review the foundation before drafting chapters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          {elements.map((el) => (
            <PlanningElementCard
              key={el.id}
              element={el}
              onRegenerate={() => onRegenerateElement(el.id)}
              onSave={(data) => onEditElement(el.id, data)}
              isRunning={isRunning}
            >
              {PREVIEW_MAP[el.id]?.(project) ?? null}
            </PlanningElementCard>
          ))}
          <div className="flex flex-wrap gap-3 pt-4">
            <Button variant="outline" onClick={onGoBack} disabled={isRunning}>
              Back to prompt
            </Button>
            <Button onClick={onApprovePlan} disabled={isRunning}>
              {isRunning ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="size-4 mr-2" />
              )}
              Approve Plan and Start Drafting
            </Button>
          </div>
        </div>
        <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
          <PlanChatPanel
            project={project}
            onApplyPatch={onApplyPlanPatch}
            disabled={isRunning}
          />
        </div>
      </div>
    </div>
  );
}
