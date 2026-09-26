"use client";

import { MovieCard } from "@/components/movie/MovieCard";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { track } from "@/lib/analytics/track";
import { FEATURED_GENRES } from "@/lib/regions";
import type { MovieSummary } from "@/lib/tmdb/types";
import Link from "next/link";
import { useState } from "react";

const STEPS = ["Favorites", "Genres", "Decades", "Filmmakers", "Profile"];

export default function OnboardingPage() {
  const { updateSettings, favorites, toggleFavorite } = useUserLibrary();
  const [step, setStep] = useState(0);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<MovieSummary[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [decades, setDecades] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  async function searchMovies() {
    if (!search.trim()) return;
    const response = await fetch(`/api/movies/search?q=${encodeURIComponent(search)}`);
    const data = await response.json();
    setResults(data.results ?? []);
  }

  function finish() {
    updateSettings({ favoriteGenres: selectedGenres });
    track("onboarding_completed", { genres: selectedGenres.length, favorites: favorites.length });
    setDone(true);
  }

  if (done) {
    return (
      <div className="page-container page-section max-w-2xl">
        <header className="page-header">
          <h1 className="page-header__title">Your Cinema Profile</h1>
          <p className="page-header__subtitle">Based on real selections — not invented preferences.</p>
        </header>
        <div className="ai-usage-card space-y-4">
          <p><strong>Favorites:</strong> {favorites.length} movies</p>
          <p><strong>Genres:</strong> {selectedGenres.length} selected</p>
          <p><strong>Decades:</strong> {decades.join(", ") || "Any"}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/my-cinema" className="btn btn-primary">View Taste DNA</Link>
            <Link href="/tonight" className="btn btn-secondary">Tonight&apos;s pick</Link>
            <Link href="/copilot" className="btn btn-ghost">Ask Cinema Agent</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container page-section max-w-3xl">
      <header className="page-header">
        <p className="eyebrow">Step {step + 1} of {STEPS.length}</p>
        <h1 className="page-header__title">{STEPS[step]}</h1>
      </header>

      {step === 0 && (
        <div className="ai-usage-card space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">Search and tap movies you love. We use real catalog IDs — never invented taste.</p>
          <div className="flex gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2" placeholder="Search movies…" />
            <button type="button" className="btn btn-secondary" onClick={searchMovies}>Search</button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {results.map((m) => (
              <button key={m.id} type="button" onClick={() => toggleFavorite(m.id)} className="text-left">
                <MovieCard movie={m} />
                <span className="text-xs">{favorites.includes(m.id) ? "★ Favorited" : "Tap to favorite"}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="ai-usage-card flex flex-wrap gap-2">
          {FEATURED_GENRES.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`filter-chip ${selectedGenres.includes(g.id) ? "is-active" : ""}`}
              onClick={() => setSelectedGenres((prev) => prev.includes(g.id) ? prev.filter((x) => x !== g.id) : [...prev, g.id])}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="ai-usage-card flex flex-wrap gap-2">
          {["1980s", "1990s", "2000s", "2010s", "2020s"].map((d) => (
            <button
              key={d}
              type="button"
              className={`filter-chip ${decades.includes(d) ? "is-active" : ""}`}
              onClick={() => setDecades((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d])}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="ai-usage-card">
          <input className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2" placeholder="Favorite directors or actors (optional)" />
          <p className="mt-2 text-xs text-[var(--text-muted)]">Saved to your profile when you sign in.</p>
        </div>
      )}

      {step === 4 && (
        <div className="ai-usage-card">
          <p className="text-sm text-[var(--text-secondary)]">Ready to generate your Cinema Profile from {favorites.length} favorites and {selectedGenres.length} genres.</p>
          <button type="button" className="btn btn-primary mt-4" onClick={finish}>Generate profile</button>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        {step > 0 && <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)}>Back</button>}
        {step < STEPS.length - 1 && <button type="button" className="btn btn-secondary" onClick={() => setStep(step + 1)}>Next</button>}
      </div>
    </div>
  );
}
