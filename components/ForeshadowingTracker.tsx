"use client";

import { PanelPlaceholder } from "@/components/PanelPlaceholder";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  ForeshadowingItem,
  ForeshadowingStatus,
  StoryProject,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface ForeshadowingTrackerProps {
  project: StoryProject | null;
  isRunning?: boolean;
}

function statusClass(status: ForeshadowingStatus): string {
  switch (status) {
    case "paid-off":
      return "border-[oklch(0.78_0.14_75/40%)] text-[oklch(0.78_0.14_75)] bg-[oklch(0.78_0.14_75/10%)]";
    case "unresolved":
      return "border-[oklch(0.72_0.14_220/40%)] text-[oklch(0.72_0.14_220)] bg-[oklch(0.72_0.14_220/10%)]";
    default:
      return "border-white/10 text-muted-foreground";
  }
}

export function ForeshadowingTracker({
  project,
  isRunning,
}: ForeshadowingTrackerProps) {
  const items = project?.storyBible.foreshadowingTracker ?? [];

  return (
    <div className="glass-card premium-border rounded-2xl p-5">
      <h3 className="text-base font-semibold">Foreshadowing Tracker</h3>
      <p className="text-xs text-muted-foreground mt-1 mb-3">
        Story threads with planned payoffs
      </p>
      <ScrollArea className="h-[260px] pr-3">
        {items.length ? (
          <div className="space-y-3">
            {items.map((f: ForeshadowingItem, i) => (
              <div
                key={`${f.item}-${i}`}
                className="relative rounded-lg border border-white/8 bg-black/20 p-3 pl-4 space-y-2"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[oklch(0.78_0.14_75)] to-[oklch(0.72_0.14_220)]"
                  aria-hidden
                />
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-sm">{f.item}</p>
                  <Badge
                    variant="outline"
                    className={cn("text-xs capitalize", statusClass(f.status))}
                  >
                    {f.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Introduced: {f.introducedIn} → Payoff: {f.payoffChapter}
                </p>
                <p className="text-xs leading-relaxed">{f.suggestedPayoff}</p>
                <p className="text-xs italic text-[oklch(0.78_0.14_75/80%)]">
                  {f.emotionalPurpose}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <PanelPlaceholder
            message={
              isRunning
                ? "Foreshadowing threads will appear after Chapter Architect."
                : "Foreshadowing threads appear after Chapter Architect completes."
            }
            icon={Search}
          />
        )}
      </ScrollArea>
    </div>
  );
}
