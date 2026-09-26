import "server-only";

import { getDatabase } from "@/lib/db/client";
import { DEFAULT_MODEL_REGISTRY, DEFAULT_PROVIDERS } from "./registry";
import { getLocalOpenAiConfig } from "./adapters/openai-compatible";
import { getOllamaBaseUrl, listOllamaModels, probeOllamaLatency } from "./adapters/ollama";
import { probeOpenAiCompatibleLatency } from "./adapters/openai-compatible";
import type { AiCapabilities, AiHealthStatus, AiModel, AiProvider } from "./types";

function parseCaps(json: string): AiCapabilities {
  try {
    return JSON.parse(json) as AiCapabilities;
  } catch {
    return { reasoning: false, vision: false, coding: false, tools: false, imageGen: false, videoGen: false };
  }
}

function boolParam(value: boolean) {
  return value ? 1 : 0;
}

export async function seedAiRegistry() {
  const db = await getDatabase();
  for (const provider of DEFAULT_PROVIDERS) {
    await db.run(
      `INSERT INTO ai_providers (id, name, kind, endpoint, enabled, local, health_status)
       VALUES (?, ?, ?, ?, 1, ?, 'unknown')
       ON CONFLICT(id) DO NOTHING`,
      [provider.id, provider.name, provider.kind, null, boolParam(provider.local)],
    );
  }
  for (const model of DEFAULT_MODEL_REGISTRY) {
    await db.run(
      `INSERT INTO ai_models (
        id, provider_id, name, api_model_id, description, local, open_weight, license, weight_class,
        capabilities_json, context_window, cost_type, enabled, health_status, speed_tier, category
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unknown', ?, ?)
      ON CONFLICT(id) DO NOTHING`,
      [
        model.id,
        model.providerId,
        model.name,
        model.apiModelId,
        model.description,
        boolParam(model.local),
        boolParam(model.openWeight),
        model.license,
        model.weightClass,
        JSON.stringify(model.capabilities),
        model.contextWindow,
        model.costType,
        boolParam(model.enabled),
        model.speedTier,
        model.category,
      ],
    );
  }
  const ollama = getOllamaBaseUrl();
  if (ollama) {
    await db.run("UPDATE ai_providers SET endpoint = ? WHERE id = 'ollama'", [ollama]);
  }
  const local = getLocalOpenAiConfig();
  if (local) {
    await db.run("UPDATE ai_providers SET endpoint = ? WHERE id = 'local_openai'", [local.base]);
  }
}

export async function recordModelUsage(input: {
  modelId: string;
  providerId: string;
  local: boolean;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  success: boolean;
  costType: string;
  requestId?: string;
}) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.run(
    `INSERT INTO model_usage (model_id, provider_id, local, tokens_in, tokens_out, latency_ms, success, cost_type, request_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.modelId,
      input.providerId,
      boolParam(input.local),
      input.tokensIn,
      input.tokensOut,
      input.latencyMs,
      boolParam(input.success),
      input.costType,
      input.requestId ?? null,
      now,
    ],
  );
  await db.run("UPDATE ai_models SET request_count = request_count + 1, error_count = error_count + ? WHERE id = ?", [
    input.success ? 0 : 1,
    input.modelId,
  ]);
}

export async function getModelsWithHealth(): Promise<AiModel[]> {
  await seedAiRegistry();
  const db = await getDatabase();
  const rows = await db.all<Record<string, unknown>>("SELECT * FROM ai_models ORDER BY name");

  let ollamaInstalled = new Map<string, { size: number }>();
  let ollamaOnline = false;
  let ollamaLatency: number | null = null;
  if (getOllamaBaseUrl()) {
    try {
      ollamaLatency = await probeOllamaLatency();
      const tags = await listOllamaModels();
      ollamaOnline = true;
      ollamaInstalled = new Map(tags.map((t) => [t.name, { size: t.size }]));
    } catch {
      ollamaOnline = false;
    }
    await db.run(
      "UPDATE ai_providers SET health_status = ?, last_checked = ?, latency_ms = ? WHERE id = 'ollama'",
      [ollamaOnline ? "connected" : "offline", new Date().toISOString(), ollamaLatency],
    );
  }

  let localOpenAiOnline = false;
  let localLatency: number | null = null;
  if (getLocalOpenAiConfig()) {
    try {
      localLatency = await probeOpenAiCompatibleLatency();
      localOpenAiOnline = true;
    } catch {
      localOpenAiOnline = false;
    }
    await db.run(
      "UPDATE ai_providers SET health_status = ?, last_checked = ?, latency_ms = ? WHERE id = 'local_openai'",
      [localOpenAiOnline ? "connected" : "offline", new Date().toISOString(), localLatency],
    );
  }

  const now = new Date().toISOString();
  return rows.map((row) => {
    const providerId = String(row.provider_id);
    const apiModelId = String(row.api_model_id);
    let health: AiHealthStatus = "unknown";
    let loaded: boolean | null = null;
    let sizeBytes: number | null = (row.size_bytes as number | null) ?? null;

    if (providerId === "ollama") {
      if (!getOllamaBaseUrl()) health = "offline";
      else if (!ollamaOnline) health = "offline";
      else if (ollamaInstalled.has(apiModelId)) {
        health = "connected";
        loaded = true;
        sizeBytes = ollamaInstalled.get(apiModelId)?.size ?? null;
      } else {
        health = "offline";
        loaded = false;
      }
    } else if (providerId === "local_openai") {
      health = localOpenAiOnline ? "connected" : getLocalOpenAiConfig() ? "offline" : "offline";
    } else if (providerId === "custom" && row.id === "gpt-6-astra") {
      health = "offline";
    } else {
      health = "offline";
    }

    const enabled = row.enabled === true || row.enabled === 1;
    if (!enabled) health = "offline";

    return {
      id: String(row.id),
      providerId,
      name: String(row.name),
      apiModelId,
      description: row.description ? String(row.description) : null,
      local: row.local === true || row.local === 1,
      openWeight: row.open_weight === true || row.open_weight === 1,
      license: row.license ? String(row.license) : null,
      weightClass: row.weight_class as AiModel["weightClass"],
      capabilities: parseCaps(String(row.capabilities_json)),
      contextWindow: row.context_window as number | null,
      costType: row.cost_type as AiModel["costType"],
      enabled,
      healthStatus: health,
      sizeBytes,
      loaded,
      speedTier: row.speed_tier as AiModel["speedTier"],
      category: row.category as AiModel["category"],
      lastChecked: now,
      requestCount: Number(row.request_count ?? 0),
      errorCount: Number(row.error_count ?? 0),
    };
  });
}

export async function getProviders(): Promise<AiProvider[]> {
  await seedAiRegistry();
  const db = await getDatabase();
  const rows = await db.all<Record<string, unknown>>("SELECT * FROM ai_providers ORDER BY name");
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    kind: row.kind as AiProvider["kind"],
    endpoint: row.endpoint ? String(row.endpoint) : null,
    enabled: row.enabled === true || row.enabled === 1,
    local: row.local === true || row.local === 1,
    healthStatus: row.health_status as AiProvider["healthStatus"],
    lastChecked: row.last_checked ? String(row.last_checked) : null,
    latencyMs: row.latency_ms as number | null,
    errorRate: Number(row.error_rate ?? 0),
    requestCount: Number(row.request_count ?? 0),
  }));
}

export async function getUsageSummary() {
  const db = await getDatabase();
  const cloud = await db.get<{ count: number; tin: number | null; tout: number | null }>(
    `SELECT COUNT(*) as count, SUM(tokens_in) as tin, SUM(tokens_out) as tout
     FROM model_usage WHERE local = 0 OR local = false`,
  );
  const local = await db.get<{ count: number; tin: number | null; tout: number | null }>(
    `SELECT COUNT(*) as count, SUM(tokens_in) as tin, SUM(tokens_out) as tout
     FROM model_usage WHERE local = 1 OR local = true`,
  );
  return {
    cloud: { requests: cloud?.count ?? 0, tokensIn: cloud?.tin ?? 0, tokensOut: cloud?.tout ?? 0, apiCostUsd: null },
    selfHosted: { requests: local?.count ?? 0, tokensIn: local?.tin ?? 0, tokensOut: local?.tout ?? 0, apiCostUsd: 0 },
  };
}
