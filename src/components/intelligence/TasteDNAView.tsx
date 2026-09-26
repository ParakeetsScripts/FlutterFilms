"use client";

import { TrustBadge } from "@/components/ai/TrustBadge";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { track } from "@/lib/analytics/track";
import { SITE_NAME } from "@/lib/brand";
import type { TasteDna } from "@/lib/ai/intelligence/taste";
import Link from "next/link";
import { useEffect, useState } from "react";

type PersonalityCard = {
  archetype: string;
  headline: string;
  topGenre: string;
  topDecade: number;
  unexplored: string[];
};

export function TasteDNAView({ movieIds, favorites = [] }: { movieIds: number[]; favorites?: number[] }) {
  const { settings, updateSettings, clearPersonalization } = useUserLibrary();
  const [dna, setDna] = useState<TasteDna | null>(null);
  const [explanations, setExplanations] = useState<string[]>([]);
  const [contradictions, setContradictions] = useState<string[]>([]);
  const [personality, setPersonality] = useState<PersonalityCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!movieIds.length) {
      setLoading(false);
      return;
    }
    fetch("/api/ai/taste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movieIds, favorites }),
    })
      .then((r) => r.json())
      .then((data) => {
        setDna(data.dna ?? null);
        setExplanations(data.explanations ?? []);
        setContradictions(data.contradictions ?? []);
        setPersonality(data.personality ?? null);
        track("taste_dna_viewed");
      })
      .finally(() => setLoading(false));
  }, [movieIds, favorites]);

  if (loading) return <p className="text-sm text-[var(--text-muted)]">Analyzing taste DNA…</p>;
  if (!dna?.movieCount) return <p className="text-sm text-[var(--text-muted)]">Save movies to your watchlist or history to build Taste DNA.</p>;

  return (
    <div className="taste-dna">
      {personality && (
        <article className="ai-usage-card mb-6 personality-card">
          <p className="eyebrow">Movie personality card</p>
          <h3 className="text-2xl font-serif mt-2">{personality.archetype}</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-2">{personality.headline}</p>
          <p className="text-xs text-[var(--muted)] mt-2">Peak decade: {personality.topDecade}s · Explore: {personality.unexplored.join(", ")}</p>
        </article>
      )}
      <div className="flex flex-wrap gap-2 mb-4">
        {dna.labels.map((l) => <TrustBadge key={l.kind} kind={l.kind} />)}
      </div>
      <p className="text-sm text-[var(--text-secondary)] mb-6">Based on {dna.movieCount} titles in your library signals.</p>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="section-title text-base">Genre map</h3>
          <ul className="mt-3 space-y-2">
            {dna.genres.slice(0, 8).map((g) => (
              <li key={g.name} className="taste-bar">
                <span>{g.name}</span>
                <div className="taste-bar__track"><div className="taste-bar__fill" style={{ width: `${g.percent}%` }} /></div>
                <span className="text-xs text-[var(--text-muted)]">{g.percent}%</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-6">
          <div>
            <h3 className="section-title text-base">Decade map</h3>
            <p className="mt-2 text-sm">{dna.decades.map((d) => `${d.decade}s (${d.count})`).join(" · ") || "—"}</p>
          </div>
          <div>
            <h3 className="section-title text-base">Global cinema</h3>
            <p className="mt-2 text-sm">{dna.countries.slice(0, 5).map((c) => c.name).join(" · ") || "—"}</p>
          </div>
          <div>
            <h3 className="section-title text-base">Averages</h3>
            <p className="mt-2 text-sm">
              Runtime {dna.avgRuntime ?? "—"}m · TMDB {dna.avgTmdb ?? "—"} · IMDb {dna.avgImdb ?? "—"}
            </p>
          </div>
          {dna.unexploredGenres.length > 0 && (
            <div>
              <h3 className="section-title text-base">Unexplored</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {dna.unexploredGenres.map((g) => <span key={g} className="filter-chip">{g}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>
      {explanations.length > 0 && (
        <div className="mt-8 ai-usage-card">
          <h3 className="section-title text-base">Why {SITE_NAME} thinks this</h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
            {explanations.map((line) => (
              <li key={line}>{line} <TrustBadge kind="user" /></li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.disablePersonalizedRows}
            onChange={(e) => {
              updateSettings({ disablePersonalizedRows: e.target.checked });
              track("taste_dna_updated", { action: "pause_learning" });
            }}
          />
          Pause learning
        </label>
        <button type="button" className="btn btn-ghost text-sm" onClick={() => { clearPersonalization(); track("taste_dna_updated", { action: "reset" }); }}>
          Reset Taste DNA
        </button>
        <Link href="/account/privacy" className="btn btn-ghost text-sm">Privacy controls</Link>
      </div>

      {contradictions.length > 0 && (
        <div className="mt-8">
          <h3 className="section-title text-base">Taste contradictions</h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
            {contradictions.map((c) => (
              <li key={c}>{c} <TrustBadge kind="ai_prediction" /></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
