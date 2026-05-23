import type { AgentId } from "./types";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Feather,
  FileSearch,
  Globe,
  Lightbulb,
  ListOrdered,
  Megaphone,
  PenLine,
  Users,
} from "lucide-react";

export const AGENT_ICONS: Record<AgentId, LucideIcon> = {
  concept: Lightbulb,
  character: Users,
  worldbuilding: Globe,
  plot: ListOrdered,
  "chapter-outline": BookOpen,
  drafting: PenLine,
  editor: Feather,
  continuity: FileSearch,
  publisher: Megaphone,
};

export function getAgentIcon(agentId: AgentId): LucideIcon {
  return AGENT_ICONS[agentId] ?? Lightbulb;
}
