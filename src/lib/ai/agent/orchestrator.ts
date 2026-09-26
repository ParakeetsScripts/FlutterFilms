import "server-only";

import { buildEvidencePacket } from "../evidence";
import { buildAgentSystemPrompt } from "../intelligence/agent";
import { addAgentMemory, listAgentMemories, memoriesToAgentShape } from "@/lib/user/agent-memory-service";
import { isDatabaseUserId } from "@/lib/user/ids";
import { resolveEntities } from "./entities";
import { planAgentTools } from "./planner";
import { runAgentTools, type ToolRunResult } from "./run";
import type { AgentToolContext, AgentToolName } from "./tools";
import {
  inferSessionUpdatesFromTools,
  mergeSessionContext,
  type AgentSessionContext,
} from "./session-context";

export type AgentAction =
  | { type: "ADD_TO_WATCHLIST"; movieId: number; success: boolean; message: string }
  | { type: "REMOVE_FROM_WATCHLIST"; movieId: number; success: boolean; message: string }
  | { type: "SUBMIT_FEEDBACK"; movieId: number; feedback: string; success: boolean }
  | { type: "SIGN_IN_REQUIRED"; action: string };

export type CinemaAgentResult = {
  tools: ToolRunResult[];
  evidence: Awaited<ReturnType<typeof buildEvidencePacket>>;
  sources: string[];
  promptBlock: string;
  memoryBlock: string;
  actions: AgentAction[];
  sessionContext: AgentSessionContext;
  agentMemory: ReturnType<typeof memoriesToAgentShape>;
};

function extractActions(results: ToolRunResult[]): AgentAction[] {
  const actions: AgentAction[] = [];
  for (const r of results) {
    const data = r.result as Record<string, unknown> | null;
    if (!data) continue;
    if (r.name === "createWatchlistEntry") {
      const movieId = Number(r.args.movieId);
      if (data.status === "unavailable") {
        actions.push({ type: "SIGN_IN_REQUIRED", action: "add_to_watchlist" });
      } else {
        actions.push({
          type: "ADD_TO_WATCHLIST",
          movieId,
          success: data.status === "success",
          message: data.status === "success" ? "Added to watchlist." : "Already on watchlist.",
        });
      }
    }
    if (r.name === "removeWatchlistEntry") {
      const movieId = Number(r.args.movieId);
      if (data.status === "unavailable") {
        actions.push({ type: "SIGN_IN_REQUIRED", action: "remove_from_watchlist" });
      } else {
        actions.push({
          type: "REMOVE_FROM_WATCHLIST",
          movieId,
          success: data.status === "success",
          message: data.status === "success" ? "Removed from watchlist." : "Movie was not on watchlist.",
        });
      }
    }
    if (r.name === "createRecommendationFeedback" && data.status === "success") {
      actions.push({
        type: "SUBMIT_FEEDBACK",
        movieId: Number(data.movieId),
        feedback: String(data.feedback),
        success: true,
      });
    }
  }
  return actions;
}

async function maybePersistMemory(message: string, userId?: string | null) {
  if (!isDatabaseUserId(userId)) return null;
  const accountId = userId!;
  const match =
    message.match(/\bremember(?:\s+that)?\s+(.+?)[.!?]?\s*$/i) ??
    message.match(/\bi love\s+(.+?)[.!?]?\s*$/i) ??
    message.match(/\bi (?:really )?like\s+(.+?)[.!?]?\s*$/i);
  if (!match?.[1]) return null;
  const content = match[1].trim();
  if (content.length < 4) return null;
  const id = await addAgentMemory(accountId, "preferences", content, "user");
  return { id, content };
}

export async function runCinemaAgent(input: {
  message: string;
  userId?: string | null;
  watchlist?: number[];
  favorites?: number[];
  history?: number[];
  sessionContext?: AgentSessionContext;
  onToolProgress?: (event: { type: "tool_start" | "tool_end"; name: AgentToolName; label: string }) => void;
}): Promise<CinemaAgentResult> {
  const session = input.sessionContext ?? {};
  const entities = await resolveEntities(input.message, session);

  const ctx: AgentToolContext = {
    userId: input.userId,
    watchlist: input.watchlist,
    favorites: input.favorites,
    history: input.history,
    resolvedEntities: entities,
  };

  const planned = planAgentTools(input.message, entities);
  const toolRun = await runAgentTools(input.message, ctx, input.onToolProgress, planned);

  const memories = isDatabaseUserId(input.userId) ? await listAgentMemories(input.userId!) : [];
  const agentMemory = memoriesToAgentShape(memories);
  const memoryBlock = buildAgentSystemPrompt(agentMemory);

  const persisted = await maybePersistMemory(input.message, input.userId);
  if (persisted && input.userId) {
    toolRun.results.push({
      name: "storeMemory",
      label: "Saved preference",
      args: { content: persisted.content },
      result: { status: "success", id: persisted.id, content: persisted.content },
      sources: ["Flutter Films user memory"],
    });
  }

  const evidence = await buildEvidencePacket({
    query: input.message,
    userId: input.userId,
    favorites: input.favorites,
    history: input.history,
    watchlist: input.watchlist,
    movieIds: entities.movieId ? [entities.movieId] : undefined,
  });

  const sessionContext = mergeSessionContext(session, {
    ...inferSessionUpdatesFromTools(toolRun.results),
    lastQuery: input.message,
  });

  const actions = extractActions(toolRun.results);
  if (persisted) {
    actions.push({
      type: "SUBMIT_FEEDBACK",
      movieId: 0,
      feedback: `memory:${persisted.content}`,
      success: true,
    });
  }

  const sources = [...new Set([...toolRun.sources, ...evidence.sourcesUsed])];

  return {
    tools: toolRun.results,
    evidence,
    sources,
    promptBlock: toolRun.promptBlock,
    memoryBlock,
    actions,
    sessionContext,
    agentMemory,
  };
}
