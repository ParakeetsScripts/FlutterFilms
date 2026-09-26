"use client";

import type { IntelligenceFeature } from "@/lib/ai/features/registry";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PlatformCapabilities } from "./PlatformCapabilities";

type Stats = {
  live: number;
  degraded: number;
  beta: number;
  planned: number;
  error: number;
};

const CATEGORIES = [
  "all",
  "discovery",
  "movie",
  "people",
  "franchise",
  "personal",
  "social",
  "watching",
  "search",
  "creative",
  "agent",
] as const;

export function IntelligenceHub() {
  const [features, setFeatures] = useState<IntelligenceFeature[]>([]);
  const [stats, setStats] = useState<Stats>({ live: 0, degraded: 0, beta: 0, planned: 0, error: 0 });
  const [category, setCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [showPlatform, setShowPlatform] = useState(false);

  useEffect(() => {
    fetch("/api/ai/features")
      .then((r) => r.json())
      .then((data) => {
        setFeatures(data.features ?? []);
        setStats({
          live: data.live ?? 0,
          degraded: data.degraded ?? 0,
          beta: data.beta ?? 0,
          planned: data.planned ?? 0,
          error: data.error ?? 0,
        });
      });
  }, []);

  const filtered = useMemo(() => {
    return features.filter((f) => {
      if (category !== "all" && f.category !== category) return false;
      if (statusFilter !== "all" && f.status !== statusFilter) return false;
      if (query && !`${f.title} ${f.description}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [features, category, statusFilter, query]);

  if (showPlatform) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between gap-3">
          <button type="button" className="btn btn-ghost text-sm" onClick={() => setShowPlatform(false)}>
            ← Back to Intelligence
          </button>
          <Link href="/settings" className="btn btn-ghost text-sm" aria-label="Settings">
            ⚙ Settings
          </Link>
        </div>
        <PlatformCapabilities stats={stats} featureCount={features.length} />
      </div>
    );
  }

  return (
    <div>
      <header className="page-header">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Cinema Intelligence Layer</p>
            <h1 className="page-header__title">100 AI Capabilities</h1>
            <p className="page-header__subtitle">
              {stats.live} live · {stats.beta} beta · {stats.planned} planned
              {stats.degraded ? ` · ${stats.degraded} degraded` : ""}
              — status is computed from real implementation checks, not marketing labels.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            aria-label="Platform capabilities"
            onClick={() => setShowPlatform(true)}
          >
            ⚙ Platform
          </button>
        </div>
      </header>

      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search features…"
          className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 md:max-w-xs"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
        >
          <option value="all">All statuses</option>
          <option value="live">Live</option>
          <option value="beta">Beta</option>
          <option value="planned">Planned</option>
          <option value="degraded">Degraded</option>
        </select>
      </div>

      <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((f) => (
          <article key={f.id} className={`ai-feature-card ai-feature-card--${f.status}`}>
            <div className="flex justify-between gap-2">
              <span className="text-xs text-[var(--text-muted)]">#{f.id}</span>
              <span className="text-xs uppercase tracking-wider text-[var(--accent-soft)]">{f.status}</span>
            </div>
            <h3 className="mt-2 font-medium">{f.title}</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{f.description}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
              <span>{f.hasService ? "Service" : "No service"}</span>
              <span>{f.hasTests ? "Tested" : "Untested"}</span>
            </div>
            {f.hasService ? (
              <Link href={`/intelligence/${f.slug}`} className="btn btn-ghost mt-4 text-sm">
                Open
              </Link>
            ) : (
              <span className="mt-4 inline-block text-sm text-[var(--text-muted)]">Planned</span>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
