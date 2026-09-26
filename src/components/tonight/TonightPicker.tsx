"use client";

import { MovieCard } from "@/components/movie/MovieCard";
import { TrustBadge } from "@/components/ai/TrustBadge";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { track } from "@/lib/analytics/track";
import type { MovieSummary } from "@/lib/tmdb/types";
import Link from "next/link";
import { useState } from "react";

type TonightResult = {
  primary: MovieSummary;
  alternates: MovieSummary[];
  explanation: string[];
  runtime?: number | null;
  genres: string[];
  ratings: { tmdb?: number | null; imdb?: string | null };
  watchProviders: string[];
  eventId?: string | null;
};

export function TonightPicker() {
  const { watchlist, favorites, history, settings } = useUserLibrary();
  const [minutes, setMinutes] = useState(120);
  const [mood, setMood] = useState("balanced");
  const [attention, setAttention] = useState("full");
  const [familiarity, setFamiliarity] = useState("familiar");
  const [language, setLanguage] = useState(settings.preferredLanguages[0] ?? "en");
  const [genre, setGenre] = useState("");
  const [result, setResult] = useState<TonightResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/tonight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        minutes,
        mood,
        attention,
        familiarity,
        language,
        region: settings.region,
        watchlist,
        favorites,
        history,
      }),
    });
    const data = await response.json();
    if (!response.ok || data.error) {
      setError(data.error ?? "Not enough verified data for a pick.");
      setResult(null);
    } else {
      setResult(data);
      track("tonight_picker_completed", { movieId: data.primary?.id ?? null, mood });
    }
    setLoading(false);
  }

  async function feedback(kind: string) {
    if (!result?.primary) return;
    await fetch("/api/ai/recommend/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movieId: result.primary.id, eventId: result.eventId, feedback: kind }),
    });
  }

  return (
    <div className="space-y-8">
      <section className="ai-usage-card grid gap-4 md:grid-cols-2">
        <label>
          <span className="text-xs uppercase text-[var(--muted)]">Time available (minutes)</span>
          <input type="number" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2" />
        </label>
        <label>
          <span className="text-xs uppercase text-[var(--muted)]">Mood</span>
          <select value={mood} onChange={(e) => setMood(e.target.value)} className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2">
            <option value="low">Low energy</option>
            <option value="balanced">Balanced</option>
            <option value="high">High energy</option>
          </select>
        </label>
        <label>
          <span className="text-xs uppercase text-[var(--muted)]">Attention</span>
          <select value={attention} onChange={(e) => setAttention(e.target.value)} className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2">
            <option value="background">Background</option>
            <option value="full">Full attention</option>
          </select>
        </label>
        <label>
          <span className="text-xs uppercase text-[var(--muted)]">Familiar or different?</span>
          <select value={familiarity} onChange={(e) => setFamiliarity(e.target.value)} className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2">
            <option value="familiar">Familiar</option>
            <option value="different">Something different</option>
          </select>
        </label>
        <label>
          <span className="text-xs uppercase text-[var(--muted)]">Language preference</span>
          <input value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2" />
        </label>
        <label>
          <span className="text-xs uppercase text-[var(--muted)]">Genre hint (optional)</span>
          <input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="e.g. thriller" className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2" />
        </label>
        <button type="button" className="btn btn-primary md:col-span-2" onClick={generate} disabled={loading}>
          {loading ? "Picking…" : "Pick my movie"}
        </button>
      </section>

      {error && <p className="text-sm text-amber-300">{error}</p>}

      {result && (
        <section className="ai-usage-card space-y-6">
          <div className="flex flex-wrap gap-2">
            <TrustBadge kind="metadata" />
            <TrustBadge kind="user" />
            <TrustBadge kind="ai_prediction" />
          </div>
          <h2 className="section-title">Tonight&apos;s pick</h2>
          <div className="max-w-xs">
            <MovieCard movie={result.primary} />
          </div>
          <div className="grid gap-4 md:grid-cols-2 text-sm text-[var(--text-secondary)]">
            <div>
              <h3 className="font-medium text-[var(--text-primary)]">Why this movie</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {result.explanation.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-[var(--text-primary)]">Details</h3>
              <p className="mt-2">Runtime: {result.runtime ?? "Verify on title page"} min</p>
              <p>Genres: {result.genres.join(", ") || "—"}</p>
              <p>TMDB: {result.ratings.tmdb ?? "n/a"} · IMDb: {result.ratings.imdb ?? "n/a"}</p>
              <p className="mt-2">Where to watch: {result.watchProviders.join(", ")}</p>
              <Link href={`/movie/${result.primary.id}`} className="btn btn-ghost mt-3 text-sm">Open movie</Link>
            </div>
          </div>
          {result.alternates.length > 0 && (
            <div>
              <h3 className="font-medium">Alternatives</h3>
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                {result.alternates.map((m) => <MovieCard key={m.id} movie={m} />)}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="filter-chip" onClick={generate}>Pick another</button>
            <button type="button" className="filter-chip" onClick={() => feedback("more_like_this")}>More like this</button>
            <button type="button" className="filter-chip" onClick={() => feedback("less_like_this")}>Less like this</button>
          </div>
        </section>
      )}
    </div>
  );
}
