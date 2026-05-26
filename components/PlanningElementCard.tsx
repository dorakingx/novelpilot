"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { PlanningElementState } from "@/lib/types";
import { Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";

function formatData(data: unknown): string {
  if (data == null) return "{}";
  return typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

interface PlanningElementCardProps {
  element: PlanningElementState;
  onRegenerate: () => void;
  onSave: (data: unknown) => void;
  isRunning?: boolean;
  children: React.ReactNode;
}

export function PlanningElementCard({
  element,
  onRegenerate,
  onSave,
  isRunning,
  children,
}: PlanningElementCardProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(() => formatData(element.data));
  const [parseError, setParseError] = useState<string | null>(null);

  const statusVariant =
    element.status === "completed" || element.status === "edited"
      ? "completed"
      : element.status === "failed"
        ? "error"
        : element.status === "generating"
          ? "running"
          : "outline";

  return (
    <div className="surface-card premium-border rounded-2xl p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold">{element.label}</h3>
        <div className="flex items-center gap-2">
          {element.fallbackUsed && (
            <Badge variant="warning">Fallback</Badge>
          )}
          <Badge variant={statusVariant}>{element.status}</Badge>
        </div>
      </div>
      {element.error && (
        <p className="text-xs text-red-400">{element.error}</p>
      )}
      {!editing ? (
        <div className="text-sm text-muted-foreground max-h-48 overflow-y-auto">
          {children}
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea
            value={editText}
            onChange={(e) => {
              setEditText(e.target.value);
              setParseError(null);
            }}
            rows={10}
            className="font-mono text-xs"
          />
          {parseError && (
            <p className="text-xs text-red-400">{parseError}</p>
          )}
          <Button
            size="sm"
            onClick={() => {
              try {
                onSave(JSON.parse(editText));
                setEditing(false);
              } catch {
                setParseError("Invalid JSON.");
              }
            }}
          >
            Save changes
          </Button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="glass"
          onClick={onRegenerate}
          disabled={isRunning}
        >
          {isRunning ? (
            <Loader2 className="size-3.5 animate-spin mr-1" />
          ) : (
            <RefreshCw className="size-3.5 mr-1" />
          )}
          Regenerate
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (editing) {
              setEditing(false);
            } else {
              setEditText(formatData(element.data));
              setEditing(true);
            }
          }}
          disabled={isRunning}
        >
          {editing ? "Cancel edit" : "Edit"}
        </Button>
      </div>
    </div>
  );
}
