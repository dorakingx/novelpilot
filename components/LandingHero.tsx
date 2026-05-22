"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gavel, PenLine, Search, Sparkles } from "lucide-react";

interface LandingHeroProps {
  onRunJudgeDemo: () => void;
  isRunning: boolean;
}

const CARDS = [
  {
    title: "Plan",
    icon: Sparkles,
    description: "Premise, characters, world, and plot from one prompt.",
  },
  {
    title: "Write",
    icon: PenLine,
    description: "Chapter draft with consistent tone and style guide.",
  },
  {
    title: "Audit",
    icon: Search,
    description: "Continuity, motifs, and foreshadowing payoff tracking.",
  },
];

export function LandingHero({ onRunJudgeDemo, isRunning }: LandingHeroProps) {
  return (
    <Card className="border-border/60 bg-card/80 min-h-[480px]">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold tracking-tight">
          From one prompt to a complete story pipeline
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto leading-relaxed">
          NovelPilot turns a raw idea into a story bible, cast, world, plot,
          chapter outline, draft, editorial report, continuity audit, and
          publishing package — through nine specialized Gemma 4 agents.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CARDS.map(({ title, icon: Icon, description }) => (
            <div
              key={title}
              className="rounded-lg border border-border/50 bg-muted/20 p-4 text-center"
            >
              <Icon className="size-6 mx-auto mb-2 text-primary" />
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center gap-2">
          <Button size="lg" onClick={onRunJudgeDemo} disabled={isRunning}>
            <Gavel className="mr-2 size-4" />
            Try the Judge Demo
          </Button>
          <p className="text-xs text-muted-foreground">
            Runs the full pipeline with a curated sci-fi mystery — no API key
            required.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
