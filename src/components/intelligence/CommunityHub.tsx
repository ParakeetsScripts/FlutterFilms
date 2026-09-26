"use client";

import { MovieCard } from "@/components/movie/MovieCard";
import { TrustBadge } from "@/components/ai/TrustBadge";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import type { MovieSummary } from "@/lib/tmdb/types";
import type { TrustKind } from "@/lib/ai/trust";
import { useState } from "react";

export function CommunityHub() {
  const { watchlist, favorites, history } = useUserLibrary();
  const [guestIds, setGuestIds] = useState("");
  const [matchPercent, setMatchPercent] = useState<number | null>(null);
  const [sharedGenres, setSharedGenres] = useState<string[]>([]);
  const [pick, setPick] = useState<MovieSummary | null>(null);
  const [alternates, setAlternates] = useState<MovieSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const myProfile = {
    label: "You",
    movieIds: [...new Set([...watchlist, ...favorites, ...history])],
  };

  async function runGroupPick() {
    setLoading(true);
    const guestMovieIds = guestIds
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isFinite(id));

    const profiles = [
      myProfile,
      { label: "Guest", movieIds: guestMovieIds },
    ];

    const [pickRes, matchRes, intersectionRes] = await Promise.all([
      fetch("/api/ai/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "group_pick", profiles, history }),
      }).then((r) => r.json()),
      fetch("/api/ai/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "match", profileA: profiles[0], profileB: profiles[1] }),
      }).then((r) => r.json()),
      fetch("/api/ai/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "intersection", profiles }),
      }).then((r) => r.json()),
    ]);

    setPick(pickRes.pick ?? null);
    setAlternates(pickRes.alternates ?? []);
    setMatchPercent(matchRes.percent ?? null);
    setSharedGenres(intersectionRes.sharedGenres ?? matchRes.sharedGenres ?? []);
    setLoading(false);
  }

  return (
    <div className="space-y-8">
      <section className="ai-usage-card">
        <h2 className="section-title">AI Group Picker</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Enter comma-separated TMDB movie IDs for a second taste profile (demo — full friend profiles coming with accounts).
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            value={guestIds}
            onChange={(e) => setGuestIds(e.target.value)}
            placeholder="e.g. 550, 13, 680"
            className="flex-1 min-w-[200px] rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
          />
          <button type="button" className="btn btn-primary" onClick={runGroupPick} disabled={loading}>
            {loading ? "Picking…" : "Pick for group"}
          </button>
        </div>

        {matchPercent != null && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <p className="text-lg font-semibold">{matchPercent}% taste overlap</p>
            <TrustBadge kind={"ai_prediction" as TrustKind} />
          </div>
        )}

        {sharedGenres.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {sharedGenres.map((genre) => (
              <span key={genre} className="filter-chip">{genre}</span>
            ))}
          </div>
        )}

        {pick && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MovieCard movie={pick} />
            {alternates.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
          </div>
        )}
      </section>

      <section className="ai-usage-card">
        <h2 className="section-title">Social features roadmap</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Movie rooms, spoiler-protected discussions, and shared watchlists are architected in the intelligence registry — wire to accounts next.
        </p>
      </section>
    </div>
  );
}
