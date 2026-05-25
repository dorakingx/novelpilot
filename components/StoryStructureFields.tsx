"use client";

import { ChapterLengthPlanList } from "@/components/ChapterLengthPlanList";
import { StructureSlotsPreview } from "@/components/StructureSlotsPreview";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  applyChapterLengthPreset,
  applyUniformLengthToParts,
  formatTotalPlannedSummary,
  getChapterLengthPresetOptions,
  getChapterLengthPresetValue,
} from "@/lib/chapter-length-presets";
import {
  RECOMMENDED_MAX_LENGTH,
  STRUCTURE_PRESETS,
  applyPresetToStructure,
  getLengthUnit,
} from "@/lib/structure-presets";
import { syncStructureTotal } from "@/lib/length-planning";
import { presetToTargetLength, buildSkeletonParts } from "@/lib/structure-chapter-defaults";
import { resolveTotalChapterCount } from "@/lib/structure-utils";
import type {
  ChapterLengthPreset,
  ProjectSettings,
  StructurePresetId,
} from "@/lib/types";
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
  const totalPlanned = structure.totalTargetLength ?? 0;
  const overRecommended = totalPlanned > recommendedMax;
  const customEnabled = structure.customPerChapterLengthEnabled ?? false;
  const lengthPreset = structure.chapterLengthPreset ?? "standard";
  const isCustomLengthPreset = lengthPreset === "custom" && !customEnabled;

  const customUniformLength =
    structure.parts[0]?.chapters[0]?.lengthPlan?.targetLength ??
    getChapterLengthPresetValue(settings.language, "standard");

  const pushStructure = (next: typeof structure) => {
    const synced = syncStructureTotal({
      ...next,
      totalChapterCount: resolveTotalChapterCount(next),
      lengthUnit: unit,
    });
    onSettingsChange({
      structure: synced,
      targetLength: presetToTargetLength(synced.presetId),
    });
  };

  const rebuildParts = (
    partial: Partial<typeof structure>,
    presetId: StructurePresetId = structure.presetId
  ) => {
    const merged = { ...structure, ...partial };
    const partCount = merged.partCount;
    const chaptersPerPart = merged.chaptersPerPart;
    const parts = buildSkeletonParts({
      language: settings.language,
      presetId,
      partCount,
      chaptersPerPart,
      chapterLengthPreset: merged.chapterLengthPreset,
      customLengthPerChapter:
        merged.chapterLengthPreset === "custom" ? customUniformLength : undefined,
      existingParts: customEnabled ? merged.parts : undefined,
    });
    let next = { ...merged, parts };
    next = applyChapterLengthPreset(
      next,
      settings.language,
      next.chapterLengthPreset,
      isCustomLengthPreset ? customUniformLength : undefined
    );
    pushStructure(next);
  };

  const handlePresetChange = (presetId: StructurePresetId) => {
    const next = applyPresetToStructure(
      structure,
      presetId,
      settings.language
    );
    onSettingsChange({
      structure: next,
      targetLength: presetToTargetLength(next.presetId),
    });
  };

  const handleChapterLengthPresetChange = (preset: ChapterLengthPreset) => {
    if (preset === "custom" && !customEnabled) {
      const next = applyChapterLengthPreset(
        { ...structure, chapterLengthPreset: "custom" },
        settings.language,
        "custom",
        customUniformLength
      );
      pushStructure(next);
      return;
    }
    const next = applyChapterLengthPreset(
      { ...structure, chapterLengthPreset: preset },
      settings.language,
      preset
    );
    pushStructure(next);
  };

  const handleCustomUniformLength = (value: number) => {
    if (value <= 0) return;
    const next = applyUniformLengthToParts(
      { ...structure, chapterLengthPreset: "custom" },
      settings.language,
      value
    );
    pushStructure(next);
  };

  return (
    <div className="space-y-4 pt-2 border-t border-white/10">
      <div>
        <h3 className="text-sm font-semibold text-[#F8FAFC]">Story Structure</h3>
        <p className="text-xs text-[#94A3B8] mt-1">
          Chapter titles will be generated from your prompt. If you want specific
          titles, include them in the prompt.
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
              pushStructure({ ...structure, mode: v as "auto" | "manual" })
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

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#94A3B8]">Parts</label>
          <input
            type="number"
            min={1}
            max={10}
            value={structure.partCount}
            onChange={(e) =>
              rebuildParts({
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
              rebuildParts({
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
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#94A3B8]">
          Approximate chapter length
        </label>
        <Select
          value={lengthPreset}
          onValueChange={(v) =>
            handleChapterLengthPresetChange(v as ChapterLengthPreset)
          }
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getChapterLengthPresetOptions(settings.language).map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isCustomLengthPreset && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#94A3B8]">
            Approximate length per chapter
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={100}
              value={customUniformLength}
              onChange={(e) =>
                handleCustomUniformLength(Number(e.target.value) || 0)
              }
              disabled={disabled}
              className="flex h-9 w-32 rounded-md border border-white/12 bg-[#172033] px-3 text-sm text-[#F8FAFC]"
            />
            <span className="text-xs text-[#94A3B8]">{unit}</span>
          </div>
        </div>
      )}

      <p className="text-sm text-[#CBD5E1]">
        <span className="text-[#94A3B8]">Total planned length: </span>
        <span className="font-medium text-[#F8FAFC]">
          {formatTotalPlannedSummary(
            settings.language,
            totalChapters,
            lengthPreset,
            isCustomLengthPreset ? customUniformLength : undefined
          )}
        </span>
      </p>

      {structure.parts.length > 0 && (
        <StructureSlotsPreview
          parts={structure.parts}
          language={settings.language}
        />
      )}

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={customEnabled}
          onChange={(e) => {
            const enabled = e.target.checked;
            const nextPreset: ChapterLengthPreset = enabled
              ? "custom"
              : lengthPreset === "custom"
                ? "standard"
                : lengthPreset;
            let next: typeof structure = {
              ...structure,
              customPerChapterLengthEnabled: enabled,
              chapterLengthPreset: nextPreset,
            };
            if (!enabled) {
              next = applyChapterLengthPreset(
                next,
                settings.language,
                nextPreset
              );
            }
            pushStructure(next);
          }}
          disabled={disabled}
          className="rounded border-white/20"
        />
        <span className="text-xs text-[#CBD5E1]">
          Customize each chapter length
        </span>
      </label>

      {customEnabled && structure.parts.length > 0 && (
        <ChapterLengthPlanList
          parts={structure.parts}
          language={settings.language}
          disabled={disabled}
          advancedMode
          showAdvancedDistribute
          onPartsChange={(parts) => pushStructure({ ...structure, parts })}
        />
      )}

      {totalChapters > 3 && (
        <p className="text-xs text-[#38BDF8]">
          Prose will be drafted one chapter at a time ({totalChapters} chapters).
        </p>
      )}

      <div className="flex items-start gap-2 rounded-lg border border-[#38BDF8]/25 bg-[#38BDF8]/10 px-3 py-2 text-xs text-[#CBD5E1]">
        <Info className="size-4 shrink-0 text-[#38BDF8] mt-0.5" />
        <span>
          Long works are generated chapter by chapter for reliability. You can
          review and edit the structure after the Chapter Architect completes.
          Changing language resets approximate chapter lengths to preset defaults.
        </span>
      </div>

      {overRecommended && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>
            Total planned length exceeds the recommended maximum (
            {recommendedMax.toLocaleString()} {unit}). Generation may be slow or
            fail depending on model limits.
          </span>
        </div>
      )}
    </div>
  );
}
