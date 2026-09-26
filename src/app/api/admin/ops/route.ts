import { getUsageSummary, getProviders, getModelsWithHealth } from "@/lib/ai/repository";
import { cacheStats } from "@/lib/cache/store";
import { isPostgres } from "@/lib/db/client";
import { countMovies, getRecentSyncJobs, getSourceHealth } from "@/lib/sync/repository";
import { listGenerationJobs } from "@/lib/ai/generation-jobs";
import { verifyAiAdmin } from "@/lib/ai/admin-auth";
import { getDatabase } from "@/lib/db/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const denied = verifyAiAdmin(request);
  if (denied) return denied;

  const started = Date.now();
  const movieCount = await countMovies();
  const latency = Date.now() - started;

  const [health, jobs, usage, providers, models, cache, generationJobs] = await Promise.all([
    getSourceHealth(),
    getRecentSyncJobs(10),
    getUsageSummary(),
    getProviders(),
    getModelsWithHealth(),
    cacheStats(),
    listGenerationJobs(undefined, 10),
  ]);

  const localModels = models.filter((m) => m.local && m.healthStatus === "connected");
  const db = await getDatabase();
  const [totalUsers, authUsers, anonUsers, recEvents, authFailures] = await Promise.all([
    db.get<{ count: number }>("SELECT COUNT(*) as count FROM users"),
    db.get<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE email IS NOT NULL"),
    db.get<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE device_id IS NOT NULL AND email IS NULL"),
    db.get<{ count: number }>("SELECT COUNT(*) as count FROM recommendation_events"),
    db.get<{ count: number }>("SELECT COUNT(*) as count FROM auth_sessions WHERE expires_at < ?", [new Date().toISOString()]),
  ]);

  return NextResponse.json({
    database: { driver: isPostgres() ? "postgres" : "sqlite", movieCount, queryLatencyMs: latency },
    users: {
      total: Number(totalUsers?.count ?? 0),
      authenticated: Number(authUsers?.count ?? 0),
      anonymous: Number(anonUsers?.count ?? 0),
      expiredSessions: Number(authFailures?.count ?? 0),
    },
    sync: { health, recentJobs: jobs },
    ai: { usage, providers, connectedLocalModels: localModels.length, modelsOnline: models.filter((m) => m.healthStatus === "connected").length, recommendationEvents: Number(recEvents?.count ?? 0) },
    cache,
    generationJobs,
  });
}
