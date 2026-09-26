import "server-only";

import type { AiCapabilities, AiModel } from "./types";
import { caps } from "./registry-utils";

export function slugifyOllamaModelId(name: string): string {
  return `ollama-${name.replace(/:/g, "-").replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}`;
}

export function inferModelMeta(name: string): {
  category: AiModel["category"];
  speedTier: AiModel["speedTier"];
  capabilities: AiCapabilities;
  description: string;
} {
  const lower = name.toLowerCase();
  if (lower.includes("coder") || lower.includes("devstral") || lower.includes("code")) {
    return {
      category: "coding",
      speedTier: lower.includes("30b") || lower.includes("32b") ? "quality" : "balanced",
      capabilities: caps({ coding: true, tools: true, reasoning: true }),
      description: `Coding model (${name}) on Ollama`,
    };
  }
  if (lower.includes("vision") || lower.includes("llava") || lower.includes("gemma")) {
    return {
      category: "vision",
      speedTier: "balanced",
      capabilities: caps({ vision: true }),
      description: `Multimodal model (${name}) on Ollama`,
    };
  }
  if (lower.includes("r1") || lower.includes("reason")) {
    return {
      category: "reasoning",
      speedTier: "quality",
      capabilities: caps({ reasoning: true }),
      description: `Reasoning model (${name}) on Ollama`,
    };
  }
  if (lower.includes("1.5b") || lower.includes("1b") || lower.includes(":3b")) {
    return {
      category: "chat",
      speedTier: "fast",
      capabilities: caps({}),
      description: `Lightweight chat model (${name}) on Ollama`,
    };
  }
  return {
    category: "chat",
    speedTier: "balanced",
    capabilities: caps({ tools: true }),
    description: `Chat model (${name}) on Ollama`,
  };
}

export function buildOllamaDynamicModels(
  installed: Map<string, { size: number }>,
  existingApiIds: Set<string>,
  now: string,
): AiModel[] {
  const dynamic: AiModel[] = [];
  for (const [name, meta] of installed) {
    if (existingApiIds.has(name)) continue;
    const inferred = inferModelMeta(name);
    dynamic.push({
      id: slugifyOllamaModelId(name),
      providerId: "ollama",
      name,
      apiModelId: name,
      description: inferred.description,
      local: true,
      openWeight: true,
      license: "Open-weight (verify per model)",
      weightClass: "open",
      capabilities: inferred.capabilities,
      contextWindow: 128_000,
      costType: "no_api_credits",
      enabled: true,
      healthStatus: "connected",
      sizeBytes: meta.size,
      loaded: true,
      speedTier: inferred.speedTier,
      category: inferred.category,
      lastChecked: now,
      requestCount: 0,
      errorCount: 0,
    });
  }
  return dynamic.sort((a, b) => a.name.localeCompare(b.name));
}

export function buildOpenAiCompatibleDynamicModels(
  modelIds: string[],
  existingApiIds: Set<string>,
  now: string,
): AiModel[] {
  const dynamic: AiModel[] = [];
  for (const name of modelIds) {
    if (existingApiIds.has(name)) continue;
    const inferred = inferModelMeta(name);
    dynamic.push({
      id: `local-openai-${slugifyOllamaModelId(name)}`,
      providerId: "local_openai",
      name,
      apiModelId: name,
      description: `Self-hosted OpenAI-compatible (${name})`,
      local: true,
      openWeight: true,
      license: null,
      weightClass: "open",
      capabilities: inferred.capabilities,
      contextWindow: 128_000,
      costType: "no_api_credits",
      enabled: true,
      healthStatus: "connected",
      sizeBytes: null,
      loaded: true,
      speedTier: inferred.speedTier,
      category: inferred.category,
      lastChecked: now,
      requestCount: 0,
      errorCount: 0,
    });
  }
  return dynamic.sort((a, b) => a.name.localeCompare(b.name));
}
