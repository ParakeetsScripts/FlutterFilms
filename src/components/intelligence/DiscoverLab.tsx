"use client";

import { MovieCard } from "@/components/movie/MovieCard";
import { TrustBadge } from "@/components/ai/TrustBadge";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import type { MovieSummary } from "@/lib/tmdb/types";
import { moviePath } from "@/lib/slug";
import Link from "next/link";
import { useState } from "react";

export function DiscoverLab() {
  const { watchlist, favorites, history } = useUserLibrary();
  const [vibe, setVibe] = useState("");
  const [energy, setEnergy] = useState<"low" | "balanced" | "high">("balanced");
  const [brain, setBrain] = useState<"casual" | "thoughtful" | "complex" | "extreme">("thoughtful");
  const [results, setResults] = useState<MovieSummary[]>([]);
  const [pick, setPick] = useState<MovieSummary | null>(null);
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);

  async function recommend(mode: string) {
    setLoading(true);
    const response = await fetch("/api/ai/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, watchlist, favorites, history, energy, brain }),
    });
    const data = await response.json();
    setPick(data.primary ?? null);
    setHint(data.reason ?? "");
    setLoading(false);
  }

  async function vibeSearch() {
    if (!vibe.trim()) return;
    setLoading(true);
    const response = await fetch("/api/ai/vibe-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: vibe }),
    });
    const data = await response.json();
    setResults(data.results ?? []);
    setHint(data.interpretation ?? "");
    setLoading(false);
  }

  return (
    <div className="discover-lab">
      <header className="page-header">
        <p className="eyebrow">AI Discovery</p>
        <h1 className="page-header__title">Discovery Lab</h1>
        <p className="page-header__subtitle">Vibe search, energy, brain level, instant picks, and controlled roulette.</p>
      </header>

      <section className="mt-10 ai-usage-card">
        <h2 className="section-title">Vibe Search</h2>
        <div className="mt-4 flex gap-3">
          <input
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            placeholder="rainy night, lonely main character, beautiful cinematography…"
            className="copilot__input flex-1"
          />
          <button type="button" className="btn btn-primary" onClick={vibeSearch} disabled={loading}>Search</button>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="ai-usage-card">
          <h3 className="font-medium">Energy</h3>
          <div className="mt-3 flex gap-2">
            {(["low", "balanced", "high"] as const).map((e) => (
              <button key={e} type="button" className={`filter-chip ${energy === e ? "is-active" : ""}`} onClick={() => setEnergy(e)}>{e}</button>
            ))}
          </div>
        </div>
        <div className="ai-usage-card">
          <h3 className="font-medium">Brain level</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["casual", "thoughtful", "complex", "extreme"] as const).map((b) => (
              <button key={b} type="button" className={`filter-chip ${brain === b ? "is-active" : ""}`} onClick={() => setBrain(b)}>{b}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={() => recommend("instant")} disabled={loading}>Instant pick</button>
        <button type="button" className="btn btn-secondary" onClick={() => recommend("roulette")} disabled={loading}>Movie roulette</button>
        <button type="button" className="btn btn-secondary" onClick={() => recommend("anti_algorithm")} disabled={loading}>Anti-algorithm</button>
        <button type="button" className="btn btn-secondary" onClick={() => recommend("taste_expansion")} disabled={loading}>Taste expansion</button>
        <button type="button" className="btn btn-secondary" onClick={() => recommend("background")} disabled={loading}>Background mode</button>
      </section>

      {hint && <p className="mt-4 text-sm text-[var(--accent-soft)]">{hint} <TrustBadge kind="ai_interpretation" /></p>}

      {pick && (
        <section className="mt-10">
          <h2 className="section-title">Tonight&apos;s pick</h2>
          <div className="mt-4 max-w-[200px]">
            <MovieCard movie={pick} variant="spotlight" />
          </div>
          <Link href={moviePath(pick.id, pick.title)} className="btn btn-primary mt-4">Open movie</Link>
        </section>
      )}

      {results.length > 0 && (
        <section className="mt-10">
          <h2 className="section-title">Vibe results</h2>
          <div className="row-scroller-wrap mt-4">
            <div className="row-scroller">
              {results.map((m) => <MovieCard key={m.id} movie={m} />)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
