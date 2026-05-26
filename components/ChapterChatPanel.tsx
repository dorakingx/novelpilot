"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getAllChapters } from "@/lib/structure-utils";
import { fetchReviseChapter } from "@/lib/workflow-api";
import type { StoryProject } from "@/lib/types";
import { Loader2, MessageSquare } from "lucide-react";
import { useState } from "react";

interface ChapterChatPanelProps {
  project: StoryProject;
  defaultChapter?: number;
  onApplyRevision: (chapterNumber: number, revisedDraft: string) => void;
  disabled?: boolean;
}

export function ChapterChatPanel({
  project,
  defaultChapter = 1,
  onApplyRevision,
  disabled,
}: ChapterChatPanelProps) {
  const chapters = getAllChapters(project);
  const [targetChapter, setTargetChapter] = useState(String(defaultChapter));
  const [input, setInput] = useState("");
  const [explanation, setExplanation] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chapterNum = Number(targetChapter) || 1;

  async function send() {
    const text = input.trim();
    if (!text || loading || disabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchReviseChapter(project, chapterNum, text);
      setPendingDraft(res.revisedDraft);
      setExplanation(res.revisionSummary);
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revision failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="surface-card premium-border rounded-2xl flex flex-col h-full min-h-[320px] max-h-[calc(100vh-8rem)]">
      <div className="p-4 border-b border-white/10 space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-[#F5C542]" />
          <h3 className="text-sm font-semibold">Chapter chat</h3>
        </div>
        <Select
          value={targetChapter}
          onValueChange={(v) => v != null && setTargetChapter(v)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Chapter" />
          </SelectTrigger>
          <SelectContent>
            {chapters.map((ch) => (
              <SelectItem key={ch.number} value={String(ch.number)}>
                Ch. {ch.number}: {ch.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 overflow-y-auto p-3 text-sm">
        {explanation && (
          <p className="text-muted-foreground text-xs mb-2">{explanation}</p>
        )}
        {pendingDraft && (
          <pre className="text-xs whitespace-pre-wrap max-h-40 overflow-y-auto bg-[#172033] rounded-lg p-2">
            {pendingDraft.slice(0, 600)}
            {pendingDraft.length > 600 ? "…" : ""}
          </pre>
        )}
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs mt-2">
            <Loader2 className="size-3 animate-spin" />
            Revising…
          </div>
        )}
      </div>
      {error && (
        <p className="px-3 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
      <div className="p-3 border-t border-white/10 space-y-2">
        {pendingDraft && (
          <Button
            size="sm"
            className="w-full"
            onClick={() => {
              onApplyRevision(chapterNum, pendingDraft);
              setPendingDraft(null);
              setExplanation(null);
            }}
            disabled={disabled}
          >
            Apply revision
          </Button>
        )}
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Make this chapter more suspenseful…"
          rows={3}
          disabled={disabled || loading}
        />
        <Button
          size="sm"
          className="w-full"
          onClick={() => void send()}
          disabled={disabled || loading || !input.trim()}
        >
          Send
        </Button>
      </div>
    </div>
  );
}
