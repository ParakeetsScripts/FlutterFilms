"use client";

import { usePointerTarget } from "@/components/cinematic/CinematicScene";
import { useMotion } from "@/components/cinematic/MotionProvider";
import { MovieCard } from "@/components/movie/MovieCard";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { track } from "@/lib/analytics/track";
import { parseVibeQuery, wantsSinglePick } from "@/lib/ai/intelligence/vibe-query";
import { SITE_NAME } from "@/lib/brand";
import { signalsFromParsedQuery } from "@/lib/home/console-signals";
import { cssVars } from "@/lib/motion/css-vars";
import { moviePath } from "@/lib/slug";
import type { MovieSummary } from "@/lib/tmdb/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";

const EXAMPLES = [
  "something like Interstellar but funnier",
  "give me one movie for tonight",
  "a thriller under 2 hours",
  "something completely different from what I normally watch",
];

export type HeroSearchStatus = "idle" | "searching" | "fallback" | "done" | "empty" | "error";

type FallbackResults = { results: MovieSummary[]; source: "search" | "trending" | "none" };

const STATUS_COPY: Partial<Record<HeroSearchStatus, string>> = {
  searching: "Searching the catalog…",
  fallback: "Checking title matches…",
  empty: "Nothing in the catalog matched that. Try another phrasing.",
  error: "The projection missed a frame. Try again in a moment.",
};

async function loadFallbackResults(text: string): Promise<FallbackResults> {
  const titleMatch = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/);
  const searchTerm = titleMatch?.[0] ?? text.split(/\s+/).slice(-3).join(" ");

  try {
    const searchResponse = await fetch(`/api/movies/search?query=${encodeURIComponent(searchTerm)}`);
    const searchData = await searchResponse.json();
    if (Array.isArray(searchData.results) && searchData.results.length) {
      return { results: searchData.results, source: "search" };
    }
  } catch {
    // Fall through to trending.
  }

  try {
    const trendingResponse = await fetch("/api/movies/trending");
    const trendingData = await trendingResponse.json();
    if (Array.isArray(trendingData.results)) return { results: trendingData.results, source: "trending" };
  } catch {
    // No fallback available.
  }

  return { results: [], source: "none" };
}

function fallbackLabel(fallback: FallbackResults, query: string): string | null {
  if (fallback.source === "search") return `Title matches for “${query}”`;
  if (fallback.source === "trending") return "No direct matches — showing what's trending on TMDB today";
  return null;
}

export function HeroSearch({
  onStatusChange,
  onResultsChange,
}: {
  onStatusChange?: (status: HeroSearchStatus) => void;
  onResultsChange?: (hasResults: boolean) => void;
}) {
  const { favorites, watchlist, history, settings } = useUserLibrary();
  const { state } = useMotion();
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const consoleRef = useRef<HTMLFormElement>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [status, setStatusValue] = useState<HeroSearchStatus>("idle");
  const [results, setResults] = useState<MovieSummary[]>([]);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [singlePick, setSinglePick] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const [injecting, setInjecting] = useState<string | null>(null);
  const busy = status === "searching" || status === "fallback";

  usePointerTarget(consoleRef, state.pointerEffects);

  const signals = useMemo(
    () => (deferredQuery.trim().length >= 3 ? signalsFromParsedQuery(parseVibeQuery(deferredQuery)) : []),
    [deferredQuery],
  );

  useEffect(() => {
    if (!injecting) return;
    const timer = window.setTimeout(() => setInjecting(null), 700);
    return () => window.clearTimeout(timer);
  }, [injecting]);

  function setStatus(next: HeroSearchStatus) {
    setStatusValue(next);
    onStatusChange?.(next);
  }

  function publish(list: MovieSummary[], label: string | null, single: boolean) {
    setSinglePick(single);
    setResults(list);
    setInterpretation(list.length ? label : null);
    onResultsChange?.(list.length > 0);
  }

  async function search(text?: string) {
    const q = (text ?? query).trim();
    if (!q || busy) return;
    setQuery(q);
    setLastQuery(q);
    setStatus("searching");
    const oneResult = wantsSinglePick(q);
    track("movie_searched", { query: q.slice(0, 120) });
    track("ai_prompt_submitted", { surface: "homepage_hero" });

    try {
      const response = await fetch("/api/ai/vibe-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, favorites, watchlist, history, favoriteGenres: settings.favoriteGenres }),
      });
      const data = await response.json();
      let nextResults: MovieSummary[] = Array.isArray(data.results) ? data.results : [];
      let label = typeof data.interpretation === "string" && data.interpretation ? data.interpretation : `Results for “${q}”`;

      if (!nextResults.length) {
        setStatus("fallback");
        const fallback = await loadFallbackResults(q);
        nextResults = fallback.results;
        label = fallbackLabel(fallback, q) ?? label;
      }

      const limit = typeof data.limit === "number" ? data.limit : oneResult ? 1 : 6;
      const display = nextResults.slice(0, limit);
      publish(display, label, limit === 1);
      setStatus(display.length ? "done" : "empty");
    } catch {
      setStatus("fallback");
      const fallback = await loadFallbackResults(q);
      const display = fallback.results.slice(0, oneResult ? 1 : 6);
      publish(display, fallbackLabel(fallback, q), oneResult);
      setStatus(display.length ? "done" : "error");
    }
  }

  function runPrompt(example: string) {
    setInjecting(example);
    setQuery(example);
    inputRef.current?.focus({ preventScroll: true });
    void search(example);
  }

  const statusCopy = status === "done" ? null : STATUS_COPY[status] ?? null;

  return (
    <div className="cinema-console-wrap" data-status={status}>
      <h1 id="home-hero-question" className="hero-question">
        What do you feel like watching?
      </h1>
      <p className="hero-question__sub">
        {SITE_NAME} answers what to watch, why, and what to explore next — not just what movie this is.
      </p>

      <form
        ref={consoleRef}
        className={`cinema-console ${injecting ? "is-injecting" : ""}`}
        data-signals={signals.length ? "on" : "off"}
        role="search"
        aria-label="Ask for a movie"
        onSubmit={(event) => {
          event.preventDefault();
          void search();
        }}
      >
        <span className="cinema-console__halo" aria-hidden="true" />
        <span className="cinema-console__glass" aria-hidden="true" />
        <div className="cinema-console__row">
          <label htmlFor={inputId} className="sr-only">
            Describe what you want to watch
          </label>
          <input
            id={inputId}
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Tell ${SITE_NAME} what you're in the mood for…`}
            className="cinema-console__input"
            autoComplete="off"
            enterKeyHint="search"
          />
          <button type="submit" className="btn btn-primary cinema-console__submit" disabled={busy} data-magnetic>
            {busy ? "Searching…" : "Find movies"}
          </button>
        </div>
        <div className="cinema-console__readout">
          <p className="micro-label">{signals.length ? `How ${SITE_NAME} will read this` : "Try a mood, a reference, or a runtime"}</p>
          {signals.length ? (
            <ul className="cinema-console__signals" aria-label="Parsed from your words">
              {signals.map((signal, index) => (
                <li key={signal.label} className="console-glyph" data-kind={signal.kind} style={cssVars({ "--i": index })}>
                  {signal.label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <p className="cinema-console__status" role="status" aria-live="polite">
          {statusCopy}
        </p>
      </form>

      <ul className="prompt-deck" aria-label="Example requests">
        {EXAMPLES.map((example, index) => (
          <li key={example} className="prompt-deck__slot" style={cssVars({ "--slot": index })}>
            <button
              type="button"
              className={`prompt-card ${injecting === example ? "is-sent" : ""}`}
              onClick={() => runPrompt(example)}
              disabled={busy}
            >
              <span className="prompt-card__mark" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              {example}
            </button>
          </li>
        ))}
      </ul>

      <div className="hero-ctas">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={() => {
            track("cta_clicked", { action: "start_discovering" });
            void search(query || EXAMPLES[0]);
          }}
          disabled={busy}
          data-magnetic
        >
          Start discovering
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          data-cursor="ai"
          onClick={() => {
            track("cta_clicked", { action: "ask_cinema_agent" });
            router.push(`/flutter-ai?q=${encodeURIComponent(query.trim() || EXAMPLES[0])}`);
          }}
        >
          Ask Cinema Agent
        </button>
        <Link href="/tonight" className="btn btn-ghost">
          Tonight&apos;s pick
        </Link>
        <Link href="/movies" className="btn btn-ghost">
          Browse catalog
        </Link>
      </div>

      {results.length > 0 ? (
        <div className="hero-results" data-single={singlePick ? "true" : undefined}>
          {interpretation ? (
            <p className="hero-results__label">
              <span className="micro-label">{singlePick ? "Tonight's pick" : "Results"}</span>
              {interpretation}
            </p>
          ) : null}
          <div className="hero-results__grid">
            {results.map((movie, index) => (
              <div key={movie.id} className="hero-results__item" style={cssVars({ "--i": index })}>
                <MovieCard movie={movie} variant={singlePick ? "spotlight" : "standard"} />
              </div>
            ))}
          </div>
          {singlePick && results[0] ? (
            <Link href={moviePath(results[0].id, results[0].title)} className="btn btn-primary">
              Open tonight&apos;s pick
            </Link>
          ) : (
            <Link href={`/search?q=${encodeURIComponent(lastQuery)}`} className="btn btn-ghost text-sm">
              View all results
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}
