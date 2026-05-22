"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { StoryProject } from "@/lib/types";

interface StoryBiblePreviewProps {
  project: StoryProject | null;
}

export function StoryBiblePreview({ project }: StoryBiblePreviewProps) {
  if (!project) {
    return (
      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base">Story Bible</CardTitle>
          <p className="text-sm text-muted-foreground">
            Concept, characters, world, and plot will appear here as agents
            complete.
          </p>
        </CardHeader>
      </Card>
    );
  }

  const b = project.storyBible;

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Story Bible</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="concept" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto flex-wrap gap-1">
            <TabsTrigger value="concept" className="text-xs">
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
            <TabsContent value="concept" className="mt-0 space-y-2 text-sm">
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
      </CardContent>
    </Card>
  );
}
