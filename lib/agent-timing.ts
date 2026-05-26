import type { AgentId } from "./types";

export function logAgentTiming(
  agentId: AgentId | string,
  step: string,
  startedAt: number,
  extra?: Record<string, unknown>
): void {
  console.info("[AGENT_TIMING]", {
    agentId,
    step,
    elapsedMs: Date.now() - startedAt,
    ...extra,
  });
}
