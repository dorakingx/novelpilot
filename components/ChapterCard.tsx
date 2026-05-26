"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatLengthLabel } from "@/lib/length-planning";
import type { Chapter, ChapterDraftState } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";

interface ChapterCardProps {
  chapter: Chapter;
  draftState?: ChapterDraftState;
  language: "en" | "ja";
  onGenerate: () => void;
  onRegenerate: () => void;
  onSaveEdit: (draft: string) => void;
  isRunning?: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  generating: "Generating",
  completed: "Completed",
  failed: "Failed",
  edited: "Edited",
  skipped: "Skipped",
};

export function ChapterCard({
  chapter,
  draftState,
  language,
  onGenerate,
  onRegenerate,
  onSaveEdit,
  isRunning,
}: ChapterCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(chapter.draft ?? "");

  const status = draftState?.status ?? (chapter.draft?.trim() ? "completed" : "pending");
  const preview =
    draftState?.preview ??
    (chapter.draft
      ? chapter.draft.slice(0, 800) + (chapter.draft.length > 800 ? "…" : "")
      : null);

  const target = chapter.lengthPlan?.targetLength;
  const unit = chapter.lengthPlan?.unit ?? "words";
  const actual = chapter.draft?.length ?? draftState?.actualLength;

  const statusVariant =
    status === "completed" || status === "edited"
      ? "completed"
      : status === "failed"
        ? "error"
        : status === "generating"
          ? "running"
          : "outline";

  return (
    <div
      className={cn(
        "surface-card premium-border rounded-xl p-4 space-y-3",
        draftState?.needsRevision && "ring-1 ring-amber-500/40"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">
            Part {chapter.partNumber ?? 1} · Chapter {chapter.number}
          </p>
          <h4 className="font-semibold">{chapter.title}</h4>
          {chapter.role && (
            <p className="text-xs text-[#F5C542]/90">{chapter.role}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {draftState?.needsRevision && (
            <Badge variant="warning">Needs revision</Badge>
          )}
          <Badge variant={statusVariant}>{STATUS_LABEL[status] ?? status}</Badge>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{chapter.purpose}</p>
      <p className="text-xs text-muted-foreground">
        Target:{" "}
        {target
          ? formatLengthLabel(target, unit, language)
          : "—"}
        {actual != null &&
          ` · Actual: ${formatLengthLabel(actual, unit, language)}`}
      </p>
      {draftState?.error && (
        <p className="text-xs text-red-400">{draftState.error}</p>
      )}
      {!editing ? (
        <div className="text-sm bg-[#172033]/80 rounded-lg p-3 max-h-32 overflow-y-auto whitespace-pre-wrap">
          {preview ??
            (status === "pending"
              ? `Outline: ${chapter.keyEvents?.slice(0, 3).join("; ") || chapter.purpose}`
              : "No draft yet.")}
        </div>
      ) : (
        <Textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          rows={8}
          className="font-mono text-sm"
        />
      )}
      {expanded && chapter.draft && (
        <div className="text-sm whitespace-pre-wrap max-h-96 overflow-y-auto border border-white/10 rounded-lg p-3">
          {chapter.draft}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {status === "pending" || status === "failed" ? (
          <Button size="sm" onClick={onGenerate} disabled={isRunning}>
            {isRunning ? (
              <Loader2 className="size-3.5 animate-spin mr-1" />
            ) : status === "failed" ? (
              <RotateCcw className="size-3.5 mr-1" />
            ) : null}
            {status === "failed" ? "Retry" : "Generate"}
          </Button>
        ) : null}
        {(status === "completed" || status === "edited" || chapter.draft) && (
          <Button
            size="sm"
            variant="glass"
            onClick={onRegenerate}
            disabled={isRunning}
          >
            <RefreshCw className="size-3.5 mr-1" />
            Regenerate
          </Button>
        )}
        {!editing ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditText(chapter.draft ?? "");
              setEditing(true);
            }}
          >
            Edit
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => {
              onSaveEdit(editText);
              setEditing(false);
            }}
          >
            Save edit
          </Button>
        )}
        {chapter.draft && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? (
              <ChevronUp className="size-3.5 mr-1" />
            ) : (
              <ChevronDown className="size-3.5 mr-1" />
            )}
            {expanded ? "Collapse" : "Expand"}
          </Button>
        )}
      </div>
    </div>
  );
}
