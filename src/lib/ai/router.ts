import "server-only";

import type { AiModel, AutoRouteTarget, ChatMessage } from "./types";
import { listOllamaModels } from "./adapters/ollama";
import { getModelsWithHealth } from "./repository";

export type RouteDecision = {
  model: AiModel;
  reason: string;
  route: AutoRouteTarget | "manual";
};

function pickInstalled(candidates: AiModel[], installed: Set<string>): AiModel | null {
  for (const model of candidates) {
    if (installed.has(model.apiModelId) || installed.has(model.id)) return model;
  }
  return candidates.find((m) => m.healthStatus === "connected") ?? null;
}

export async function routeAutoModel(
  messages: ChatMessage[],
  options: { privateMode?: boolean; preferVision?: boolean } = {},
): Promise<RouteDecision> {
  const models = await getModelsWithHealth();
  const local = models.filter((m) => m.local && m.enabled && m.healthStatus === "connected");
  const last = messages[messages.length - 1]?.content.toLowerCase() ?? "";

  let ollamaNames = new Set<string>();
  try {
    const tags = await listOllamaModels();
    ollamaNames = new Set(tags.map((t) => t.name));
  } catch {
    /* offline */
  }

  if (options.privateMode) {
    const chosen =
      pickInstalled(local.filter((m) => m.category === "reasoning"), ollamaNames) ??
      pickInstalled(local, ollamaNames) ??
      local[0];
    if (!chosen) throw new Error("Private Mode requires a connected self-hosted model.");
    return { model: chosen, reason: "Private Mode — self-hosted only", route: "fast_local" };
  }

  if (options.preferVision || /\b(poster|image|scene|screenshot|visual)\b/.test(last)) {
    const vision = local.filter((m) => m.capabilities.vision);
    const chosen = pickInstalled(vision, ollamaNames) ?? pickInstalled(vision, ollamaNames);
    if (chosen) return { model: chosen, reason: "Multimodal local model", route: "vision" };
  }

  if (/\b(code|debug|typescript|python|react|api|function|refactor)\b/.test(last)) {
    const coding = local.filter((m) => m.category === "coding" || m.capabilities.coding);
    const chosen = pickInstalled(coding, ollamaNames);
    if (chosen) return { model: chosen, reason: "Coding task", route: "local_coding" };
  }

  if (/\b(why|explain|reason|compare|analyze|think|logic)\b/.test(last) || last.length > 280) {
    const reasoning = local.filter((m) => m.category === "reasoning" || m.capabilities.reasoning);
    const chosen = pickInstalled(reasoning, ollamaNames);
    if (chosen) return { model: chosen, reason: "Reasoning task", route: "local_reasoning" };
  }

  const fast = local.filter((m) => m.speedTier === "fast" || m.category === "chat");
  const chosen = pickInstalled(fast, ollamaNames) ?? pickInstalled(local, ollamaNames);
  if (chosen) return { model: chosen, reason: "Fast local response", route: "fast_local" };

  throw new Error("No connected local model available. Configure OLLAMA_BASE_URL or AI_LOCAL_ENDPOINT.");
}
