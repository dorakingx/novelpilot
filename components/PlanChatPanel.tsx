"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetchRevisePlan } from "@/lib/workflow-api";
import type { RevisePlanResponse, StoryBible, StoryProject } from "@/lib/types";
import { Loader2, MessageSquare } from "lucide-react";
import { useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface PlanChatPanelProps {
  project: StoryProject;
  onApplyPatch: (patch: Partial<StoryBible>, structureChanged?: boolean) => void;
  disabled?: boolean;
}

export function PlanChatPanel({
  project,
  onApplyPatch,
  disabled,
}: PlanChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<RevisePlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || loading || disabled) return;
    setInput("");
    setError(null);
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetchRevisePlan(project, text);
      setPending(res);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: res.explanation },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Revision failed";
      setError(msg);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Error: ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="surface-card premium-border rounded-2xl flex flex-col h-full min-h-[320px] max-h-[calc(100vh-8rem)]">
      <div className="p-4 border-b border-white/10 flex items-center gap-2">
        <MessageSquare className="size-4 text-[#F5C542]" />
        <h3 className="text-sm font-semibold">Plan chat</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
        {messages.length === 0 && (
          <p className="text-muted-foreground text-xs">
            Ask to change characters, plot, ending, or chapter plans.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={
              msg.role === "user"
                ? "ml-4 rounded-lg bg-white/5 p-2"
                : "mr-4 rounded-lg bg-[#172033] p-2"
            }
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Loader2 className="size-3 animate-spin" />
            Thinking…
          </div>
        )}
      </div>
      {error && (
        <p className="px-3 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
      <div className="p-3 border-t border-white/10 space-y-2">
        {pending && (
          <Button
            size="sm"
            className="w-full"
            onClick={() => {
              onApplyPatch(pending.patch, pending.structureChanged);
              setPending(null);
            }}
            disabled={disabled}
          >
            Apply to plan
          </Button>
        )}
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Make the antagonist more sympathetic…"
          rows={3}
          disabled={disabled || loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="glass"
            className="flex-1"
            onClick={() => void send()}
            disabled={disabled || loading || !input.trim()}
          >
            Send
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setMessages([]);
              setPending(null);
              setError(null);
            }}
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
