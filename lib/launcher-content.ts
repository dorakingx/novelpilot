import { PenLine, Search, Sparkles } from "lucide-react";

export const LAUNCHER_FEATURE_CARDS = [
  {
    title: "Plan",
    icon: Sparkles,
    description: "Premise, characters, world, plot",
  },
  {
    title: "Write",
    icon: PenLine,
    description: "Chapter draft with consistent tone",
  },
  {
    title: "Audit",
    icon: Search,
    description: "Continuity, motifs, foreshadowing",
  },
] as const;

export const PROMPT_PLACEHOLDER =
  "Write a melancholic sci-fi mystery set in modern Tokyo. A graduate student who lost his memory investigates a disappearance in a quantum computing lab…";
