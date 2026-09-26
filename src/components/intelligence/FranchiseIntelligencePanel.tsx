"use client";

import { TrustBadge } from "@/components/ai/TrustBadge";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import type { TrustKind } from "@/lib/ai/trust";
import { moviePath } from "@/lib/slug";
import Link from "next/link";
import { useEffect, useState } from "react";

type FranchiseAnalysis = {
  name: string;
  movieCount: number;
  avgTmdbRating: number | null;
  watchedCount: number;
  completionPercent: number;
  watchOrderNote: string;
  entryRecommendation: { id: number; title: string } | null;
  health: {
    gaps: string[];
    lowestRated: { title: string; voteAverage?: number | null } | null;
    highestRated: { title: string; voteAverage?: number | null } | null;
    ratingTrend: Array<{ id: number; title: string; year?: number | null; rating?: number | null }>;
  };
  labels: Array<{ kind: string }>;
};

export function FranchiseIntelligencePanel({ collectionId }: { collectionId: number }) {
  const { history } = useUserLibrary();
  const [data, setData] = useState<FranchiseAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/ai/franchise/${collectionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ watchedIds: history }),
    })
      .then((r) => r.json())
      .then((payload) => setData(payload))
      .finally(() => setLoading(false));
  }, [collectionId, history]);

  if (loading) return <p className="text-sm text-[var(--text-muted)]">Loading franchise intelligence…</p>;
  if (!data?.name) return null;

  return (
    <section className="intelligence-panel ai-usage-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">Franchise Intelligence</h2>
        <div className="flex gap-2">
          {data.labels.map((label) => (
            <TrustBadge key={label.kind} kind={label.kind as TrustKind} />
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Completion</p>
          <p className="text-2xl font-semibold">{data.completionPercent}%</p>
          <p className="text-sm text-[var(--text-secondary)]">{data.watchedCount} of {data.movieCount} watched</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Avg TMDB</p>
          <p className="text-2xl font-semibold">{data.avgTmdbRating ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Start here</p>
          {data.entryRecommendation ? (
            <Link href={moviePath(data.entryRecommendation.id, data.entryRecommendation.title)} className="text-sm text-[var(--accent)]">
              {data.entryRecommendation.title}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
      </div>

      <p className="mt-4 text-sm text-[var(--text-secondary)]">{data.watchOrderNote}</p>

      {data.health.gaps.length > 0 && (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Release gaps</p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
            {data.health.gaps.map((gap) => <li key={gap}>{gap}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Rating trend</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.health.ratingTrend.map((m) => (
            <span key={m.id} className="filter-chip text-xs">
              {m.title} {m.rating != null ? `· ${m.rating.toFixed(1)}` : ""}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
