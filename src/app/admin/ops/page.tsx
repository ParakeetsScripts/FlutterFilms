import { getUsageSummary, getProviders, getModelsWithHealth } from "@/lib/ai/repository";
import { listGenerationJobs } from "@/lib/ai/generation-jobs";
import { cacheStats } from "@/lib/cache/store";
import { isPostgres } from "@/lib/db/client";
import { countMovies, getRecentSyncJobs, getSourceHealth } from "@/lib/sync/repository";
import { SITE_NAME } from "@/lib/brand";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Operations",
  description: `Database and AI operations for ${SITE_NAME}.`,
};

export default async function AdminOpsPage() {
  const started = Date.now();
  const movieCount = await countMovies();
  const queryLatencyMs = Date.now() - started;

  const [health, jobs, usage, providers, models, cache, generationJobs] = await Promise.all([
    getSourceHealth(),
    getRecentSyncJobs(10),
    getUsageSummary(),
    getProviders(),
    getModelsWithHealth(),
    cacheStats(),
    listGenerationJobs(undefined, 10),
  ]);

  const localOnline = models.filter((m) => m.local && m.healthStatus === "connected").length;

  return (
    <div className="page-container page-section max-w-5xl">
      <header className="page-header">
        <p className="eyebrow">Operations</p>
        <h1 className="page-header__title">Database & AI Ops</h1>
        <p className="page-header__subtitle">Health, sync status, model connectivity, cache, and generation jobs.</p>
        <p className="mt-3 text-sm">
          <a href="/admin/media" className="text-[var(--accent-soft)] underline-offset-2 hover:underline">
            Open VOD media pipeline →
          </a>
        </p>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="ai-usage-card">
          <h2 className="section-title">Database</h2>
          <p className="mt-2 text-sm">Driver: {isPostgres() ? "Neon Postgres" : "SQLite (local)"}</p>
          <p className="text-sm">Movies: {movieCount}</p>
          <p className="text-sm">Query latency: {queryLatencyMs}ms</p>
        </article>
        <article className="ai-usage-card">
          <h2 className="section-title">AI</h2>
          <p className="mt-2 text-sm">Local models online: {localOnline}</p>
          <p className="text-sm">Cloud requests: {usage.cloud.requests}</p>
          <p className="text-sm">Self-hosted requests: {usage.selfHosted.requests}</p>
        </article>
        <article className="ai-usage-card">
          <h2 className="section-title">Cache</h2>
          <p className="mt-2 text-sm">Active entries: {cache.active}</p>
          <p className="text-sm">Memory layer: {cache.memoryEntries}</p>
        </article>
        <article className="ai-usage-card">
          <h2 className="section-title">Sync</h2>
          <p className="mt-2 text-sm">{health.length} sources tracked</p>
          <p className="text-sm">{jobs.length} recent jobs</p>
        </article>
        <article className="ai-usage-card md:col-span-2">
          <h2 className="section-title">Generation jobs</h2>
          <p className="mt-2 text-sm">{generationJobs.length} recent jobs in queue</p>
          <p className="text-sm text-[var(--text-muted)]">{providers.length} AI providers configured</p>
        </article>
      </div>
    </div>
  );
}
