"use client";

import { MovieCard } from "@/components/movie/MovieCard";
import { TrustBadge } from "@/components/ai/TrustBadge";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import type { MovieSummary } from "@/lib/tmdb/types";
import type { TrustKind } from "@/lib/ai/trust";
import { useCallback, useState } from "react";

type SearchHit = { id: number; title: string; year?: number | null; posterPath?: string | null };

export function CommunityHub() {
  const { watchlist, favorites, history } = useUserLibrary();
  const [guestSearch, setGuestSearch] = useState("");
  const [guestHits, setGuestHits] = useState<SearchHit[]>([]);
  const [guestSelected, setGuestSelected] = useState<SearchHit[]>([]);
  const [matchPercent, setMatchPercent] = useState<number | null>(null);
  const [sharedGenres, setSharedGenres] = useState<string[]>([]);
  const [pick, setPick] = useState<MovieSummary | null>(null);
  const [alternates, setAlternates] = useState<MovieSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const myProfile = {
    label: "You",
    movieIds: [...new Set([...watchlist, ...favorites, ...history])],
  };

  const searchGuestMovies = useCallback(async () => {
    const q = guestSearch.trim();
    if (q.length < 2) return;
    setSearching(true);
    try {
      const r = await fetch(`/api/onboarding/search?q=${encodeURIComponent(q)}&type=movie`);
      const data = (await r.json()) as { results?: SearchHit[] };
      setGuestHits(data.results ?? []);
    } finally {
      setSearching(false);
    }
  }, [guestSearch]);

  function addGuestMovie(hit: SearchHit) {
    if (guestSelected.some((m) => m.id === hit.id)) return;
    setGuestSelected((prev) => [...prev, hit].slice(0, 20));
  }

  function removeGuestMovie(id: number) {
    setGuestSelected((prev) => prev.filter((m) => m.id !== id));
  }

  async function runGroupPick() {
    if (!guestSelected.length) return;
    setLoading(true);
    const profiles = [
      myProfile,
      { label: "Guest", movieIds: guestSelected.map((m) => m.id) },
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
          Build a second taste profile by searching and selecting movies — no TMDB IDs required.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <input
            value={guestSearch}
            onChange={(e) => setGuestSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchGuestMovies()}
            placeholder="Search movies for guest profile…"
            className="flex-1 min-w-[200px] rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
          />
          <button type="button" className="btn btn-secondary" onClick={searchGuestMovies} disabled={searching}>
            {searching ? "Searching…" : "Search"}
          </button>
          <button type="button" className="btn btn-primary" onClick={runGroupPick} disabled={loading || !guestSelected.length}>
            {loading ? "Picking…" : "Pick for group"}
          </button>
        </div>

        {guestHits.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {guestHits.slice(0, 8).map((hit) => (
              <button
                key={hit.id}
                type="button"
                className="filter-chip"
                onClick={() => addGuestMovie(hit)}
              >
                + {hit.title}{hit.year ? ` (${hit.year})` : ""}
              </button>
            ))}
          </div>
        )}

        {guestSelected.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-[var(--text-secondary)] mb-2">Guest profile ({guestSelected.length} movies)</p>
            <div className="flex flex-wrap gap-2">
              {guestSelected.map((m) => (
                <button key={m.id} type="button" className="filter-chip" onClick={() => removeGuestMovie(m.id)}>
                  {m.title} ×
                </button>
              ))}
            </div>
          </div>
        )}

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
        <h2 className="section-title">Movie rooms & shared lists</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Create a room from <a href="/rooms" className="underline">Rooms</a> or collaborate on{" "}
          <a href="/watchlists" className="underline">shared watchlists</a>. Cinema Agent can inspect room state by code.
        </p>
      </section>
    </div>
  );
}
