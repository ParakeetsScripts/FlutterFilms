"use client";

import type { FeatureCategory } from "@/lib/ai/features/catalog";
import type { FeatureHealthStatus } from "@/lib/ai/features/types";
import Link from "next/link";
import { useMemo, useState } from "react";

export type AboutFeature = {
  id: number;
  slug: string;
  title: string;
  category: FeatureCategory;
  description: string;
  status: FeatureHealthStatus;
  route: string;
};

const CATEGORY_ORDER: FeatureCategory[] = [
  "discovery",
  "movie",
  "people",
  "franchise",
  "personal",
  "watching",
  "social",
  "search",
  "creative",
  "agent",
];

const CATEGORY_LABELS: Record<FeatureCategory, string> = {
  discovery: "Discovery",
  movie: "Movie intelligence",
  people: "People & crew",
  franchise: "Franchises",
  personal: "Personal taste",
  watching: "Watching & planning",
  social: "Social",
  search: "Search",
  creative: "Creative studio",
  agent: "Cinema Agent",
};

const STATUS_LABELS: Record<FeatureHealthStatus, string> = {
  live: "Live",
  beta: "Beta",
  planned: "Planned",
  degraded: "Degraded",
  error: "Error",
};


export function AboutFeatureCatalog({ features }: { features: AboutFeature[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const stats = useMemo(() => {
    return features.reduce(
      (acc, f) => {
        acc[f.status] = (acc[f.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [features]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return features.filter((f) => {
      if (categoryFilter !== "all" && f.category !== categoryFilter) return false;
      if (statusFilter !== "all" && f.status !== statusFilter) return false;
      if (!q) return true;
      return `${f.id} ${f.title} ${f.description} ${f.slug}`.toLowerCase().includes(q);
    });
  }, [features, query, statusFilter, categoryFilter]);

  const grouped = useMemo(() => {
    const map = new Map<FeatureCategory, AboutFeature[]>();
    for (const cat of CATEGORY_ORDER) map.set(cat, []);
    for (const feature of filtered) {
      map.get(feature.category)?.push(feature);
    }
    return CATEGORY_ORDER
      .map((cat) => ({ category: cat, items: map.get(cat) ?? [] }))
      .filter((section) => section.items.length > 0);
  }, [filtered]);

  return (
    <section className="about-feature-catalog" aria-labelledby="about-feature-catalog-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="about-feature-catalog-title" className="section-title">200 capabilities</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)]">
            Every capability in the FlutterFilms intelligence catalog (200 total). Status is computed from
            implementation tier, real data paths, and explicit acceptance contracts — not handler existence alone.
          </p>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          {features.length} total · {stats.live ?? 0} live · {stats.beta ?? 0} beta · {stats.planned ?? 0} planned
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search features…"
          className="min-w-[220px] flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
          aria-label="Search features"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {CATEGORY_ORDER.map((cat) => (
            <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="live">Live</option>
          <option value="beta">Beta</option>
          <option value="planned">Planned</option>
        </select>
      </div>

      <div className="mt-10 space-y-12">
        {grouped.map(({ category, items }) => (
          <div key={category}>
            <h3 className="text-lg font-medium tracking-tight">
              {CATEGORY_LABELS[category]}
              <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">({items.length})</span>
            </h3>
            <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" start={items[0]?.id}>
              {items.map((feature) => (
                <li key={feature.slug}>
                  <Link
                    href={feature.route}
                    className="about-feature-card block rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-[var(--text-muted)]">#{feature.id}</p>
                      <span className="text-[10px] uppercase tracking-wider text-[var(--accent-soft)]">
                        {STATUS_LABELS[feature.status]}
                      </span>
                    </div>
                    <h4 className="mt-1 font-medium leading-snug">{feature.title}</h4>
                    <p className="mt-1 text-sm text-[var(--text-secondary)] line-clamp-2">{feature.description}</p>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-sm text-[var(--text-muted)]">No features match your filters.</p>
      )}
    </section>
  );
}
