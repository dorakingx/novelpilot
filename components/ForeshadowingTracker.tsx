"use client";

import { PanelPlaceholder } from "@/components/PanelPlaceholder";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  ForeshadowingItem,
  ForeshadowingStatus,
  StoryProject,
} from "@/lib/types";
import { Search } from "lucide-react";

interface ForeshadowingTrackerProps {
  project: StoryProject | null;
  isRunning?: boolean;
}

function statusVariant(
  status: ForeshadowingStatus
): "completed" | "running" | "outline" {
  switch (status) {
    case "paid-off":
      return "completed";
    case "unresolved":
      return "running";
    default:
      return "outline";
  }
}

export function ForeshadowingTracker({
  project,
  isRunning,
}: ForeshadowingTrackerProps) {
  const items = project?.storyBible.foreshadowingTracker ?? [];

  return (
    <div className="surface-card premium-border rounded-2xl p-5">
      <h3 className="text-base font-semibold text-[#F8FAFC]">
        Foreshadowing Tracker
      </h3>
      <p className="text-xs text-[#94A3B8] mt-1 mb-3">
        Story threads with planned payoffs
      </p>
      <ScrollArea className="h-[260px] pr-3">
        {items.length ? (
          <div className="space-y-3">
            {items.map((f: ForeshadowingItem, i) => (
              <div
                key={`${f.item}-${i}`}
                className="relative rounded-lg border border-white/12 bg-[#172033] p-3 pl-4 space-y-2"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 bg-[#F5C542]"
                  aria-hidden
                />
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-sm text-[#F8FAFC]">{f.item}</p>
                  <Badge
                    variant={statusVariant(f.status)}
                    className="text-xs capitalize"
                  >
                    {f.status}
                  </Badge>
                </div>
                <p className="text-xs text-[#94A3B8]">
                  Introduced: {f.introducedIn} → Payoff: {f.payoffChapter}
                </p>
                <p className="text-xs leading-relaxed text-[#CBD5E1]">
                  {f.suggestedPayoff}
                </p>
                <p className="text-xs italic text-[#F5C542]">
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
