"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export function WhyGemma4Panel() {
  return (
    <Card className="border-primary/20 bg-card/80 border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          Why Gemma 4?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          NovelPilot uses Gemma 4 as the reasoning engine behind a multi-agent
          story pipeline. The model is used for structured creative planning,
          long-context story memory, chapter drafting, editorial critique, and
          continuity analysis.
        </p>
        <ul className="list-disc pl-4 space-y-1 text-xs">
          <li>Structured generation across agents</li>
          <li>Long-context story memory</li>
          <li>Continuity and foreshadowing reasoning</li>
        </ul>
      </CardContent>
    </Card>
  );
}
