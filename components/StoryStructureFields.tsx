"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RECOMMENDED_MAX_LENGTH,
  STRUCTURE_PRESETS,
  applyPresetToStructure,
  getLengthUnit,
} from "@/lib/structure-presets";
import { resolveTotalChapterCount } from "@/lib/structure-utils";
import { formatLengthLabel } from "@/lib/length-planning";
import type { ProjectSettings, StructurePresetId } from "@/lib/types";
import { AlertTriangle, Info } from "lucide-react";

interface StoryStructureFieldsProps {
  settings: ProjectSettings;
  onSettingsChange: (partial: Partial<ProjectSettings>) => void;
  disabled?: boolean;
}

export function StoryStructureFields({
  settings,
  onSettingsChange,
  disabled = false,
}: StoryStructureFieldsProps) {
  const structure = settings.structure;
  const unit = getLengthUnit(settings.language);
  const totalChapters = resolveTotalChapterCount(structure);
  const isCustom = structure.presetId === "custom";
  const recommendedMax = RECOMMENDED_MAX_LENGTH[settings.language];
  const overRecommended =
    (structure.totalTargetLength ?? 0) > recommendedMax;

  const updateStructure = (partial: Partial<typeof structure>) => {
    const next = { ...structure, ...partial };
    next.totalChapterCount = resolveTotalChapterCount(next);
    onSettingsChange({ structure: next });
  };

  const handlePresetChange = (presetId: StructurePresetId) => {
    const next = applyPresetToStructure(
      structure,
      presetId,
      settings.language
    );
    onSettingsChange({ structure: { ...next, presetId } });
  };

  return (
    <div className="space-y-4 pt-2 border-t border-white/10">
      <div>
        <h3 className="text-sm font-semibold text-[#F8FAFC]">Story Structure</h3>
        <p className="text-xs text-[#94A3B8] mt-1">
          Choose parts, chapters, and target length. Long works are generated
          chapter by chapter for reliability.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#94A3B8]">Preset</label>
          <Select
            value={structure.presetId}
            onValueChange={(v) => handlePresetChange(v as StructurePresetId)}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STRUCTURE_PRESETS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label} — {p.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#94A3B8]">
            Structure mode
          </label>
          <Select
            value={structure.mode}
            onValueChange={(v) =>
              updateStructure({ mode: v as "auto" | "manual" })
            }
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto-generate structure</SelectItem>
              <SelectItem value="manual">Manual structure</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#94A3B8]">Parts</label>
          <input
            type="number"
            min={1}
            max={10}
            value={structure.partCount}
            onChange={(e) =>
              updateStructure({
                partCount: Math.max(1, Number(e.target.value) || 1),
              })
            }
            disabled={disabled || !isCustom}
            className="flex h-9 w-full rounded-md border border-white/12 bg-[#172033] px-3 text-sm text-[#F8FAFC] disabled:opacity-50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#94A3B8]">
            Chapters / part
          </label>
          <input
            type="number"
            min={1}
            max={12}
            value={structure.chaptersPerPart}
            onChange={(e) =>
              updateStructure({
                chaptersPerPart: Math.max(1, Number(e.target.value) || 1),
              })
            }
            disabled={disabled || !isCustom}
            className="flex h-9 w-full rounded-md border border-white/12 bg-[#172033] px-3 text-sm text-[#F8FAFC] disabled:opacity-50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#94A3B8]">
            Total chapters
          </label>
          <input
            type="number"
            value={totalChapters}
            readOnly
            disabled
            className="flex h-9 w-full rounded-md border border-white/12 bg-[#172033]/80 px-3 text-sm text-[#94A3B8]"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#94A3B8]">
            Total target ({unit})
          </label>
          <input
            type="number"
            min={500}
            value={structure.totalTargetLength ?? ""}
            onChange={(e) =>
              updateStructure({
                totalTargetLength: Math.max(0, Number(e.target.value) || 0),
                lengthUnit: unit,
              })
            }
            disabled={disabled}
            className="flex h-9 w-full rounded-md border border-white/12 bg-[#172033] px-3 text-sm text-[#F8FAFC] disabled:opacity-50"
          />
        </div>
      </div>

      <p className="text-xs text-[#94A3B8]">
        Planned length:{" "}
        {formatLengthLabel(
          structure.totalTargetLength ?? 0,
          unit,
          settings.language
        )}
        {totalChapters > 3 && (
          <span className="text-[#38BDF8]">
            {" "}
            · Prose will be drafted one chapter at a time
          </span>
        )}
      </p>

      <div className="flex items-start gap-2 rounded-lg border border-[#38BDF8]/25 bg-[#38BDF8]/10 px-3 py-2 text-xs text-[#CBD5E1]">
        <Info className="size-4 shrink-0 text-[#38BDF8] mt-0.5" />
        <span>
          Long works are generated chapter by chapter for reliability. You can
          review and edit the structure after the Chapter Architect completes.
        </span>
      </div>

      {overRecommended && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>
            This target exceeds the recommended maximum (
            {recommendedMax.toLocaleString()} {unit}). Generation may be slow or
            fail depending on model limits.
          </span>
        </div>
      )}
    </div>
  );
}
