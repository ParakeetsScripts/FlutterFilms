import "server-only";

import { chatOllama } from "./adapters/ollama";
import { chatOpenAiCloud, chatOpenAiCompatible } from "./adapters/openai-compatible";
import { buildCopilotSystemPrompt } from "./copilot-context";
import { getModelsWithHealth, recordModelUsage } from "./repository";
import { routeAutoModel } from "./router";
import type { ChatMessage } from "./types";

export async function runCopilotChat(input: {
  messages: ChatMessage[];
  modelId?: string | "auto";
  privateMode?: boolean;
  spoilerLevel?: "none" | "light" | "moderate" | "full";
  agentMemory?: Record<string, string[]>;
  interviewProfile?: import("./intelligence/agent").InterviewProfile;
  toolResults?: string;
  sources?: string[];
  favorites?: number[];
  history?: number[];
  watchlist?: number[];
  movieIds?: number[];
}) {
  const userMessages = input.messages.filter((m) => m.role === "user");
  const lastUser = userMessages[userMessages.length - 1]?.content ?? "";
  const systemContent = await buildCopilotSystemPrompt(lastUser, {
    spoilerLevel: input.spoilerLevel,
    agentMemory: input.agentMemory,
    interviewProfile: input.interviewProfile,
    toolResults: input.toolResults,
    sources: input.sources,
    favorites: input.favorites,
    history: input.history,
    watchlist: input.watchlist,
    movieIds: input.movieIds,
  });
  const messages: ChatMessage[] = [{ role: "system", content: systemContent }, ...input.messages];

  let model;
  let routeReason = "Manual selection";
  if (!input.modelId || input.modelId === "auto") {
    const decision = await routeAutoModel(messages, { privateMode: input.privateMode });
    model = decision.model;
    routeReason = decision.reason;
  } else {
    const models = await getModelsWithHealth();
    model = models.find((m) => m.id === input.modelId);
    if (!model) throw new Error("Model not found.");
    if (model.healthStatus !== "connected") throw new Error("Selected model is offline.");
    if (input.privateMode && !model.local) throw new Error("Private Mode requires a self-hosted model.");
  }

  const started = Date.now();
  let upstream: Response;
  if (model.providerId === "ollama") {
    upstream = await chatOllama(model.apiModelId, messages, { stream: true });
  } else if (model.providerId === "local_openai") {
    upstream = await chatOpenAiCompatible(model.apiModelId, messages, { stream: true });
  } else if (model.providerId === "openai") {
    upstream = await chatOpenAiCloud(model.apiModelId, messages, { stream: true });
  } else {
    throw new Error("Selected provider is not configured in this environment.");
  }

  recordModelUsage({
    modelId: model.id,
    providerId: model.providerId,
    local: model.local,
    tokensIn: 0,
    tokensOut: 0,
    latencyMs: Date.now() - started,
    success: true,
    costType: model.costType,
  });

  return { upstream, model, routeReason };
}
