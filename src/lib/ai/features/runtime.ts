import "server-only";

import { boolParam, getDatabase } from "@/lib/db/client";
import { getFeatureDefinition, getFeatureDefinitionById } from "./definitions";
import { executeFeatureService, type FeatureContext } from "./services";
import type { FeatureRunInput, FeatureRunResult } from "./types";

export type FeatureRuntimeOptions = {
  userId?: string | null;
  watchlist?: number[];
  favorites?: number[];
  history?: number[];
  skipTelemetry?: boolean;
};

async function recordRun(
  slug: string,
  userId: string | null | undefined,
  result: FeatureRunResult,
  latencyMs: number,
) {
  try {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO feature_runs (id, feature_slug, user_id, success, status, error, latency_ms, model_used, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(),
        slug,
        userId ?? null,
        boolParam(result.status === "success"),
        result.status,
        result.error ?? null,
        latencyMs,
        result.modelUsed ?? null,
        now,
      ],
    );
    if (result.status === "error" && result.error) {
      await db.run(
        `INSERT INTO feature_errors (id, feature_slug, user_id, message, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), slug, userId ?? null, result.error, now],
      );
    }
  } catch {
    /* telemetry must not break features */
  }
}

export async function runFeature(
  featureIdOrSlug: number | string,
  input: FeatureRunInput = {},
  options: FeatureRuntimeOptions = {},
): Promise<FeatureRunResult> {
  const def =
    typeof featureIdOrSlug === "number"
      ? getFeatureDefinitionById(featureIdOrSlug)
      : getFeatureDefinition(featureIdOrSlug);

  if (!def) {
    return {
      featureId: 0,
      slug: String(featureIdOrSlug),
      status: "error",
      labels: [],
      error: "Unknown feature.",
      ranAt: new Date().toISOString(),
    };
  }

  const ctx: FeatureContext = {
    userId: options.userId,
    watchlist: options.watchlist,
    favorites: options.favorites,
    history: options.history,
  };

  const started = Date.now();
  const result = await executeFeatureService(def, input, ctx);

  if (!options.skipTelemetry) {
    await recordRun(def.slug, options.userId, result, Date.now() - started);
  }

  return result;
}

export { getFeatureDefinitions, getFeatureDefinition } from "./definitions";
export { getValidatedFeatures, countByStatus, validateFeatureStatus } from "./validate";
export { getFeatureHealth, getAllFeatureHealth } from "./health";
