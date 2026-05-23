"use client";

import { PanelPlaceholder } from "@/components/PanelPlaceholder";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { StoryProject } from "@/lib/types";
import { BookOpen } from "lucide-react";

interface StoryBiblePreviewProps {
  project: StoryProject | null;
  isRunning?: boolean;
}

function hasBibleContent(project: StoryProject): boolean {
  const b = project.storyBible;
  return Boolean(
    b.concept ||
      b.characters.length ||
      b.worldbuilding ||
      b.plot ||
      b.chapters.length
  );
}

export function StoryBiblePreview({
  project,
  isRunning,
}: StoryBiblePreviewProps) {
  if (!project) {
    return (
      <div className="surface-card premium-border rounded-2xl p-5">
        <h3 className="text-base font-semibold">Story Bible</h3>
        <PanelPlaceholder
          message="Story Bible is forming…"
          icon={BookOpen}
          className="mt-4"
        />
      </div>
    );
  }

  if (!hasBibleContent(project)) {
    return (
      <div className="surface-card premium-border rounded-2xl p-5">
        <h3 className="text-base font-semibold">Story Dossier</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Concept, cast, world, plot, and style
        </p>
        <PanelPlaceholder
          message={
            isRunning
              ? "Story Bible is forming as agents complete…"
              : "Story Bible will appear as agents complete."
          }
          icon={BookOpen}
          className="mt-4"
        />
      </div>
    );
  }

  const b = project.storyBible;

  return (
    <div className="surface-card premium-border rounded-2xl p-5">
      <h3 className="text-base font-semibold">Story Dossier</h3>
      <p className="text-xs text-muted-foreground mt-1 mb-3">
        Structured bible from your writing room
      </p>
      <Tabs defaultValue="concept" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto flex-wrap gap-1 bg-[#172033] border border-white/12 p-1">
            <TabsTrigger value="concept" className="text-xs data-[state=active]:bg-[rgba(245,197,66,0.16)] data-[state=active]:text-[#F8FAFC]">
              Concept
            </TabsTrigger>
            <TabsTrigger value="characters" className="text-xs">
              Cast
            </TabsTrigger>
            <TabsTrigger value="world" className="text-xs">
              World
            </TabsTrigger>
            <TabsTrigger value="plot" className="text-xs">
              Plot
            </TabsTrigger>
            <TabsTrigger value="chapters" className="text-xs">
              Chapters
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[280px] mt-3 pr-3">
            <TabsContent value="concept" className="mt-0 space-y-2 text-sm text-[#E2E8F0]">
              {b.concept ? (
                <>
                  <p>
                    <span className="text-muted-foreground">Logline:</span>{" "}
                    {b.concept.logline}
                  </p>
                  <Separator />
                  <p>
                    <span className="text-muted-foreground">Theme:</span>{" "}
                    {b.concept.coreTheme}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Conflict:</span>{" "}
                    {b.concept.centralConflict}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Promise:</span>{" "}
                    {b.concept.emotionalPromise}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Hook:</span>{" "}
                    {b.concept.uniqueHook}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">Awaiting Concept Agent…</p>
              )}
            </TabsContent>

            <TabsContent value="characters" className="mt-0 space-y-3 text-sm">
              {b.characters.length ? (
                b.characters.map((c) => (
                  <div
                    key={c.name}
                    className="rounded-lg border border-border/50 p-3"
                  >
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      {c.role}
                    </p>
                    <p className="text-xs">
                      <span className="text-muted-foreground">Desire:</span>{" "}
                      {c.desire}
                    </p>
                    <p className="text-xs">
                      <span className="text-muted-foreground">Fear:</span>{" "}
                      {c.fear}
                    </p>
                    <p className="text-xs">
                      <span className="text-muted-foreground">Arc:</span>{" "}
                      {c.arc}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">
                  Awaiting Character Agent…
                </p>
              )}
            </TabsContent>

            <TabsContent value="world" className="mt-0 space-y-2 text-sm">
              {b.worldbuilding ? (
                <>
                  <p>{b.worldbuilding.setting}</p>
                  <p className="text-muted-foreground text-xs">
                    {b.worldbuilding.atmosphere}
                  </p>
                  <Separator />
                  <p>
                    <span className="font-medium">Rules:</span>{" "}
                    {b.worldbuilding.rules}
                  </p>
                  <ul className="list-disc pl-4 text-xs">
                    {b.worldbuilding.locations.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-muted-foreground">
                  Awaiting Worldbuilding Agent…
                </p>
              )}
            </TabsContent>

            <TabsContent value="plot" className="mt-0 space-y-2 text-sm">
              {b.plot ? (
                <>
                  <p>
                    <span className="text-muted-foreground">Beginning:</span>{" "}
                    {b.plot.beginning}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Middle:</span>{" "}
                    {b.plot.middle}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Climax:</span>{" "}
                    {b.plot.climax}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Ending:</span>{" "}
                    {b.plot.ending}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">Awaiting Plot Agent…</p>
              )}
            </TabsContent>

            <TabsContent value="chapters" className="mt-0 space-y-3 text-sm">
              {b.chapters.length ? (
                b.chapters.map((ch) => (
                  <div key={ch.number} className="border-b border-border/40 pb-2">
                    <p className="font-medium">
                      Ch. {ch.number}: {ch.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{ch.purpose}</p>
                    <p className="text-xs mt-1">
                      Turn: {ch.emotionalTurn}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">
                  Awaiting Chapter Outline Agent…
                </p>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
    </div>
  );
}
