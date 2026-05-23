"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProjectSettings } from "@/lib/types";

interface StorySettingsFieldsProps {
  settings: ProjectSettings;
  onSettingsChange: (partial: Partial<ProjectSettings>) => void;
  disabled?: boolean;
  compact?: boolean;
  pill?: boolean;
}

export function StorySettingsFields({
  settings,
  onSettingsChange,
  disabled = false,
  compact = false,
  pill = false,
}: StorySettingsFieldsProps) {
  const labelClass = compact
    ? "text-xs font-medium text-muted-foreground"
    : "text-sm font-medium";
  const triggerClass = pill
    ? "w-full rounded-full h-9 bg-white/5 border-white/10 text-xs"
    : "w-full";

  return (
    <div
      className={
        compact
          ? "grid grid-cols-2 sm:grid-cols-4 gap-3"
          : "space-y-4"
      }
    >
      <div className={compact ? "space-y-1.5" : "space-y-2"}>
        <label className={labelClass}>Language</label>
        <Select
          value={settings.language}
          onValueChange={(v) =>
            onSettingsChange({ language: v as ProjectSettings["language"] })
          }
          disabled={disabled}
        >
          <SelectTrigger className={triggerClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="ja">Japanese</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={compact ? "space-y-1.5" : "space-y-2"}>
        <label className={labelClass}>Genre</label>
        <Select
          value={settings.genre}
          onValueChange={(v) =>
            onSettingsChange({ genre: v as ProjectSettings["genre"] })
          }
          disabled={disabled}
        >
          <SelectTrigger className={triggerClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sci-fi">Sci-Fi</SelectItem>
            <SelectItem value="mystery">Mystery</SelectItem>
            <SelectItem value="fantasy">Fantasy</SelectItem>
            <SelectItem value="literary">Literary</SelectItem>
            <SelectItem value="romance">Romance</SelectItem>
            <SelectItem value="horror">Horror</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={compact ? "space-y-1.5" : "space-y-2"}>
        <label className={labelClass}>Tone</label>
        <Select
          value={settings.tone}
          onValueChange={(v) =>
            onSettingsChange({ tone: v as ProjectSettings["tone"] })
          }
          disabled={disabled}
        >
          <SelectTrigger className={triggerClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="melancholic">Melancholic</SelectItem>
            <SelectItem value="hopeful">Hopeful</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="whimsical">Whimsical</SelectItem>
            <SelectItem value="tense">Tense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={compact ? "space-y-1.5" : "space-y-2"}>
        <label className={labelClass}>Target Length</label>
        <Select
          value={settings.targetLength}
          onValueChange={(v) =>
            onSettingsChange({
              targetLength: v as ProjectSettings["targetLength"],
            })
          }
          disabled={disabled}
        >
          <SelectTrigger className={triggerClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="flash-fiction">Flash Fiction</SelectItem>
            <SelectItem value="short-story">Short Story</SelectItem>
            <SelectItem value="novella-outline">Novella Outline</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
