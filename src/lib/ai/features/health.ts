import { getDatabase } from "@/lib/db/client";
import { getValidatedFeatures, validateFeatureStatus } from "./validate";
import { getFeatureDefinition } from "./definitions";
import type { FeatureHealth, FeatureHealthStatus } from "./types";

type RunStats = {
  execution_count: number;
  failure_count: number;
  last_run_at: string | null;
  last_error: string | null;
};

async function loadRunStats(slug: string): Promise<RunStats> {
  try {
    const db = await getDatabase();
    const total = await db.get<{ execution_count: number }>(
      `SELECT COUNT(*) AS execution_count FROM feature_runs WHERE feature_slug = ?`,
      [slug],
    );
    const failures = await db.get<{ failure_count: number }>(
      `SELECT COUNT(*) AS failure_count FROM feature_runs WHERE feature_slug = ? AND success IS NOT TRUE`,
      [slug],
    );
    const last = await db.get<{ last_run_at: string }>(
      `SELECT created_at AS last_run_at FROM feature_runs WHERE feature_slug = ? ORDER BY created_at DESC LIMIT 1`,
      [slug],
    );
    const lastErr = await db.get<{ last_error: string }>(
      `SELECT error AS last_error FROM feature_runs WHERE feature_slug = ? AND success IS NOT TRUE ORDER BY created_at DESC LIMIT 1`,
      [slug],
    );
    return {
      execution_count: Number(total?.execution_count ?? 0),
      failure_count: Number(failures?.failure_count ?? 0),
      last_run_at: last?.last_run_at ?? null,
      last_error: lastErr?.last_error ?? null,
    };
  } catch {
    return { execution_count: 0, failure_count: 0, last_run_at: null, last_error: null };
  }
}

export async function getFeatureHealth(slug: string): Promise<FeatureHealth | null> {
  const def = getFeatureDefinition(slug);
  if (!def) return null;

  const validated = validateFeatureStatus(def);
  const stats = await loadRunStats(slug);
  const failureRate =
    stats.execution_count > 0 ? stats.failure_count / stats.execution_count : 0;

  let status: FeatureHealthStatus = validated.status;
  if (validated.status === "live" && failureRate > 0.25 && stats.execution_count >= 5) {
    status = "degraded";
  }
  if (stats.last_error && validated.status === "live" && stats.execution_count >= 3 && failureRate > 0.5) {
    status = "error";
  }

  return {
    id: def.id,
    slug: def.slug,
    title: def.title,
    status,
    computedStatus: validated.status,
    hasService: def.hasService,
    hasApi: def.hasApi,
    hasUi: def.hasUi,
    hasTests: def.hasTests,
    lastRunAt: stats.last_run_at,
    lastError: stats.last_error,
    executionCount: stats.execution_count,
    failureRate,
    requirements: {
      data: def.requiredData,
      models: def.requiredModelCapabilities,
      auth: def.requiresAuth,
    },
    blockers: validated.blockers,
  };
}

export async function getAllFeatureHealth(): Promise<FeatureHealth[]> {
  const features = getValidatedFeatures();
  return Promise.all(features.map((f) => getFeatureHealth(f.slug))).then((rows) =>
    rows.filter((r): r is FeatureHealth => r !== null),
  );
}
