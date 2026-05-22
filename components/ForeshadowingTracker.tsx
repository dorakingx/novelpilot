"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ForeshadowingItem, ForeshadowingStatus, StoryProject } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ForeshadowingTrackerProps {
  project: StoryProject | null;
}

function statusBadgeVariant(
  status: ForeshadowingStatus
): "default" | "secondary" | "outline" {
  switch (status) {
    case "paid-off":
      return "default";
    case "unresolved":
      return "secondary";
    default:
      return "outline";
  }
}

function statusClass(status: ForeshadowingStatus): string {
  switch (status) {
    case "paid-off":
      return "border-emerald-500/40 text-emerald-400";
    case "unresolved":
      return "border-amber-500/40 text-amber-400";
    default:
      return "text-muted-foreground";
  }
}

export function ForeshadowingTracker({ project }: ForeshadowingTrackerProps) {
  const items = project?.storyBible.foreshadowingTracker ?? [];

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Foreshadowing Tracker</CardTitle>
        <p className="text-xs text-muted-foreground">
          Structured threads with planned payoffs — proof of story-structure
          reasoning.
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[260px] pr-3">
          {items.length ? (
            <div className="space-y-3">
              {items.map((f: ForeshadowingItem, i) => (
                <div
                  key={`${f.item}-${i}`}
                  className="rounded-lg border border-border/50 p-3 space-y-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-sm">{f.item}</p>
                    <Badge
                      variant={statusBadgeVariant(f.status)}
                      className={cn("text-xs capitalize", statusClass(f.status))}
                    >
                      {f.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Introduced: {f.introducedIn} → Payoff: {f.payoffChapter}
                  </p>
                  <p className="text-xs">{f.suggestedPayoff}</p>
                  <p className="text-xs italic text-muted-foreground">
                    {f.emotionalPurpose}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Foreshadowing threads appear after Chapter Architect completes.
            </p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
