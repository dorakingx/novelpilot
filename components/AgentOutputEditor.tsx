"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { AgentStep } from "@/lib/types";
import { useState } from "react";

function formatOutput(output: unknown): string {
  if (output == null) return "{}";
  return typeof output === "string"
    ? output
    : JSON.stringify(output, null, 2);
}

interface AgentOutputEditorProps {
  agent: AgentStep;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (output: unknown) => void;
}

export function AgentOutputEditor({
  agent,
  open,
  onOpenChange,
  onSave,
}: AgentOutputEditorProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <AgentOutputEditorForm
          key={`${agent.id}-${agent.completedAt ?? "edit"}`}
          agent={agent}
          onCancel={() => onOpenChange(false)}
          onSave={(output) => {
            onSave(output);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function AgentOutputEditorForm({
  agent,
  onSave,
  onCancel,
}: {
  agent: AgentStep;
  onSave: (output: unknown) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(() => formatOutput(agent.output));
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(text);
      onSave(parsed);
    } catch {
      setError("Invalid JSON. Fix the syntax before saving.");
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Output — {agent.name}</DialogTitle>
      </DialogHeader>
      <Textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
        }}
        className="min-h-[320px] font-mono text-xs flex-1"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save</Button>
      </DialogFooter>
    </>
  );
}
