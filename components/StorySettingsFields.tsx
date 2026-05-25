"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { applyChapterLengthPreset } from "@/lib/chapter-length-presets";
import { presetToTargetLength } from "@/lib/structure-chapter-defaults";
import { applyPresetToStructure } from "@/lib/structure-presets";
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
    ? "text-xs font-medium text-[#94A3B8]"
    : "text-sm font-medium text-[#94A3B8]";
  const triggerClass = pill
    ? "w-full rounded-full h-9 text-xs"
    : "w-full";

  return (
    <div
      className={
        compact
          ? "grid grid-cols-2 sm:grid-cols-3 gap-3"
          : "space-y-4"
      }
    >
      <div className={compact ? "space-y-1.5" : "space-y-2"}>
        <label className={labelClass}>Language</label>
        <Select
          value={settings.language}
          onValueChange={(v) => {
            const language = v as ProjectSettings["language"];
            let nextStructure = applyPresetToStructure(
              settings.structure,
              settings.structure.presetId,
              language
            );
            nextStructure = applyChapterLengthPreset(
              nextStructure,
              language,
              nextStructure.chapterLengthPreset
            );
            onSettingsChange({
              language,
              structure: nextStructure,
              targetLength: presetToTargetLength(nextStructure.presetId),
            });
          }}
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
    </div>
  );
}
