"use client";

import { TrustBadge } from "@/components/ai/TrustBadge";
import type { IntelligenceFeature } from "@/lib/ai/features/registry";
import { MovieCard } from "@/components/movie/MovieCard";
import { defaultInputForSlug, inputFieldsForSlug } from "@/lib/ai/features/feature-inputs";
import type { FeatureHealth, FeatureRunResult } from "@/lib/ai/features/types";
import type { MovieSummary } from "@/lib/tmdb/types";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Props = {
  slug: string;
};

function isMovieSummary(value: unknown): value is MovieSummary {
  return Boolean(value && typeof value === "object" && "id" in value && "title" in value);
}

function collectMovieResults(data: unknown): MovieSummary[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const items: MovieSummary[] = [];
  const seen = new Set<number>();

  for (const value of [record.primary, record.secondary, ...(Array.isArray(record.movies) ? record.movies : []), ...(Array.isArray(record.results) ? record.results : []), ...(Array.isArray(record.picks) ? record.picks : [])]) {
    if (!isMovieSummary(value) || seen.has(value.id)) continue;
    seen.add(value.id);
    items.push(value);
  }

  return items;
}

function renderFeatureData(data: unknown) {
  const movies = collectMovieResults(data);
  const anchor =
    data && typeof data === "object" && "anchor" in data && data.anchor && typeof data.anchor === "object"
      ? (data.anchor as { title?: string; attentionLabel?: string; genres?: string[]; runtime?: number | null })
      : null;

  if (movies.length) {
    return (
      <div className="mt-4 space-y-4">
        {anchor?.title ? (
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 text-sm text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text)]">{anchor.title}</p>
            <p className="mt-1">
              {anchor.attentionLabel ?? "Attention profile"}
              {anchor.runtime ? ` · ${anchor.runtime} min` : ""}
              {anchor.genres?.length ? ` · ${anchor.genres.join(", ")}` : ""}
            </p>
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} variant="compact" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <pre className="mt-4 max-h-96 overflow-auto rounded-lg bg-[var(--surface)] p-3 text-xs">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export function FeatureDetail({ slug }: Props) {
  const { watchlist, favorites, history } = useUserLibrary();
  const [feature, setFeature] = useState<IntelligenceFeature | null>(null);
  const [health, setHealth] = useState<FeatureHealth | null>(null);
  const [result, setResult] = useState<FeatureRunResult | null>(null);
  const [query, setQuery] = useState("");
  const [movieId, setMovieId] = useState("");
  const [compareMovieId, setCompareMovieId] = useState("");
  const [personId, setPersonId] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [attention, setAttention] = useState<"background" | "full" | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaults = useMemo(() => defaultInputForSlug(slug), [slug]);
  const fields = useMemo(() => inputFieldsForSlug(slug), [slug]);

  useEffect(() => {
    fetch(`/api/ai/features/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setFeature(data.feature ?? null);
        setHealth(data.health ?? null);
      });
  }, [slug]);

  useEffect(() => {
    if (!query && typeof defaults.query === "string") setQuery(defaults.query);
    if (!movieId) {
      const seed = favorites[0] ?? history[0] ?? defaults.movieId;
      if (seed) setMovieId(String(seed));
    }
    if (!compareMovieId && defaults.compareMovieId) setCompareMovieId(String(defaults.compareMovieId));
    if (!personId && defaults.personId) setPersonId(String(defaults.personId));
    if (!collectionId && defaults.collectionId) setCollectionId(String(defaults.collectionId));
    if (!attention && typeof defaults.attention === "string") setAttention(defaults.attention as "background" | "full");
  }, [defaults, favorites, history, query, movieId, compareMovieId, personId, collectionId, attention]);

  async function runFeature() {
    if (!feature?.hasService) return;
    setLoading(true);
    setError(null);
    try {
      const input: Record<string, unknown> = { ...defaults };
      if (query.trim()) input.query = query.trim();
      if (movieId.trim()) input.movieId = Number(movieId);
      if (compareMovieId.trim()) input.compareMovieId = Number(compareMovieId);
      if (personId.trim()) input.personId = Number(personId);
      if (collectionId.trim()) input.collectionId = Number(collectionId);
      if (attention) input.attention = attention;
      const response = await fetch(`/api/ai/features/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          watchlist,
          favorites,
          history,
        }),
      });
      const data = (await response.json()) as FeatureRunResult & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Run failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Run failed");
    } finally {
      setLoading(false);
    }
  }

  if (!feature) {
    return <p className="text-[var(--text-secondary)]">Loading feature…</p>;
  }

  const canRun = feature.hasService && feature.status !== "planned";
  const needsQuery = fields.needsQuery;
  const needsMovie = fields.needsMovie;
  const needsPerson = fields.needsPerson;
  const needsCollection = fields.needsCollection;
  const needsCompare = fields.needsCompare;
  const needsAttention = fields.needsAttention;
  const routeHint =
    result?.data && typeof result.data === "object" && result.data !== null && "route" in result.data
      ? String((result.data as { route: string }).route)
      : null;

  return (
    <div className="space-y-8">
      <header className="page-header">
        <p className="eyebrow">#{feature.id} · {feature.category}</p>
        <h1 className="page-header__title">{feature.title}</h1>
        <p className="page-header__subtitle">{feature.description}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-wider">
          <span className={`ai-feature-card ai-feature-card--${feature.status} px-3 py-1`}>{feature.status}</span>
          {health?.executionCount ? (
            <span className="rounded-full border border-[var(--line)] px-3 py-1 text-[var(--text-muted)]">
              {health.executionCount} runs
            </span>
          ) : null}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--line)] p-4">
          <h2 className="text-sm font-medium">Requirements</h2>
          <ul className="mt-3 space-y-1 text-sm text-[var(--text-secondary)]">
            <li>Service: {feature.hasService ? "Yes" : "No"}</li>
            <li>API: {feature.hasApi ? "Yes" : "No"}</li>
            <li>Tests: {feature.hasTests ? "Yes" : "No"}</li>
            {health?.requirements.auth ? <li>Sign-in required</li> : null}
            {health?.requirements.models.length ? (
              <li>Models: {health.requirements.models.join(", ")}</li>
            ) : null}
          </ul>
          {feature.blockers.length ? (
            <p className="mt-3 text-sm text-amber-300/90">
              Blockers: {feature.blockers.join(" · ")}
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border border-[var(--line)] p-4">
          <h2 className="text-sm font-medium">Health</h2>
          <ul className="mt-3 space-y-1 text-sm text-[var(--text-secondary)]">
            <li>Computed: {health?.computedStatus ?? feature.status}</li>
            <li>Last run: {health?.lastRunAt ?? "Never"}</li>
            {health?.lastError ? <li className="text-red-300">Last error: {health.lastError}</li> : null}
          </ul>
          {feature.href ? (
            <Link href={feature.href} className="btn btn-ghost mt-4 text-sm">
              Open dedicated UI
            </Link>
          ) : null}
        </div>
      </section>

      {canRun ? (
        <section className="rounded-xl border border-[var(--line)] p-4">
          <h2 className="text-sm font-medium">Run feature</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Uses your library when fields are empty. TMDB IDs are pre-filled from your favorites when available.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {needsQuery ? (
              <label className="block text-sm">
                <span className="text-[var(--text-muted)]">Query / description</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
                  placeholder="Search text"
                />
              </label>
            ) : null}
            {needsMovie ? (
              <label className="block text-sm">
                <span className="text-[var(--text-muted)]">Movie ID (TMDB)</span>
                <input
                  value={movieId}
                  onChange={(e) => setMovieId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
                  placeholder="e.g. 550"
                />
              </label>
            ) : null}
            {needsAttention ? (
              <label className="block text-sm">
                <span className="text-[var(--text-muted)]">Attention level</span>
                <select
                  value={attention}
                  onChange={(e) => setAttention(e.target.value as "background" | "full")}
                  className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
                >
                  <option value="background">Background / multitask-friendly</option>
                  <option value="full">Full attention</option>
                </select>
              </label>
            ) : null}
            {needsCompare ? (
              <label className="block text-sm">
                <span className="text-[var(--text-muted)]">Compare movie ID</span>
                <input
                  value={compareMovieId}
                  onChange={(e) => setCompareMovieId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
                  placeholder="e.g. 680"
                />
              </label>
            ) : null}
            {needsPerson ? (
              <label className="block text-sm">
                <span className="text-[var(--text-muted)]">Person ID (TMDB)</span>
                <input
                  value={personId}
                  onChange={(e) => setPersonId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
                  placeholder="e.g. 525"
                />
              </label>
            ) : null}
            {needsCollection ? (
              <label className="block text-sm">
                <span className="text-[var(--text-muted)]">Collection / franchise ID</span>
                <input
                  value={collectionId}
                  onChange={(e) => setCollectionId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
                  placeholder="e.g. 9485"
                />
              </label>
            ) : null}
          </div>
          <button
            type="button"
            className="btn btn-primary mt-4"
            disabled={loading}
            onClick={runFeature}
          >
            {loading ? "Running…" : "Run"}
          </button>
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        </section>
      ) : (
        <p className="rounded-xl border border-[var(--line)] p-4 text-sm text-[var(--text-secondary)]">
          Not enough verified data or implementation to run this feature yet.
        </p>
      )}

      {result ? (
        <section className="rounded-xl border border-[var(--line)] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-medium">Result</h2>
            <span className="text-xs uppercase text-[var(--text-muted)]">{result.status}</span>
            {result.labels.map((label) => (
              <TrustBadge key={label.kind} kind={label.kind} />
            ))}
          </div>
          {routeHint ? (
            <Link href={routeHint} className="btn btn-ghost mt-3 text-sm">
              Continue in dedicated UI →
            </Link>
          ) : null}
          {result.explanation?.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
              {result.explanation.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
          {renderFeatureData(result.data ?? { message: result.error })}
        </section>
      ) : null}
    </div>
  );
}
