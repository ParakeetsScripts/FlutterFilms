"use client";

import { track } from "@/lib/analytics/track";
import { SITE_NAME } from "@/lib/brand";
import { MovieCard } from "@/components/movie/MovieCard";
import type { MovieSummary } from "@/lib/tmdb/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const EXAMPLES = [
  "something like Interstellar but funnier",
  "give me one movie for tonight",
  "a thriller under 2 hours",
  "something completely different from what I normally watch",
];

type ParsedFilters = {
  interpretation: string;
  filters: string[];
};

export function HeroSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MovieSummary[]>([]);
  const [parsed, setParsed] = useState<ParsedFilters | null>(null);
  const router = useRouter();

  async function search(text?: string) {
    const q = (text ?? query).trim();
    if (!q) return;
    setLoading(true);
    track("movie_searched", { query: q.slice(0, 120) });
    track("ai_prompt_submitted", { surface: "homepage_hero" });

    const response = await fetch("/api/ai/vibe-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q }),
    });
    const data = await response.json();
    setResults(data.results ?? []);
    setParsed({
      interpretation: data.interpretation ?? "Catalog search",
      filters: inferFilters(q),
    });
    setLoading(false);
  }

  function goTonight() {
    router.push("/tonight");
  }

  function goCopilot() {
    router.push(query.trim() ? `/copilot?q=${encodeURIComponent(query)}` : "/copilot");
  }

  return (
    <section className="hero-search">
      <div className="hero-search__inner">
        <p className="eyebrow">Your movies. Your taste. Your AI.</p>
        <h1 className="hero-search__title">What do you feel like watching?</h1>
        <p className="hero-search__subtitle">
          {SITE_NAME} answers: what should I watch, why, and what to explore next — not just what movie is this.
        </p>
        <form
          className="hero-search__form"
          onSubmit={(e) => {
            e.preventDefault();
            void search();
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Tell ${SITE_NAME} what you're in the mood for…`}
            className="hero-search__input"
            aria-label="Describe what you want to watch"
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Searching…" : "Find movies"}
          </button>
        </form>
        <div className="hero-search__examples">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className="filter-chip" onClick={() => { setQuery(ex); void search(ex); }}>
              {ex}
            </button>
          ))}
        </div>
        <div className="hero-search__launch-ctas">
          <button type="button" className="btn btn-primary btn-lg" onClick={() => { track("cta_clicked", { action: "start_discovering" }); void search(query || EXAMPLES[0]); }}>
            Start discovering
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => { track("cta_clicked", { action: "ask_cinema_agent" }); goCopilot(); }}>
            Ask Cinema Agent
          </button>
        </div>
        <div className="hero-search__actions">
          <button type="button" className="btn btn-ghost" onClick={goTonight}>Tonight&apos;s pick</button>
          <Link href="/discover" className="btn btn-ghost">Browse catalog</Link>
        </div>
      </div>

      {parsed && (
        <div className="hero-search__results">
          <p className="text-sm text-[var(--text-secondary)]">
            <strong>Interpretation:</strong> {parsed.interpretation}
            {parsed.filters.length ? ` · ${parsed.filters.join(" · ")}` : ""}
          </p>
          {results.length ? (
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              {results.slice(0, 6).map((m) => <MovieCard key={m.id} movie={m} />)}
            </div>
          ) : (
            <p className="mt-4 text-sm text-amber-300/90">Not enough verified catalog matches. Try more detail or browse Discover.</p>
          )}
          <Link href={`/search?q=${encodeURIComponent(query)}`} className="btn btn-ghost mt-4 text-sm">View all results</Link>
        </div>
      )}
    </section>
  );
}

function inferFilters(query: string): string[] {
  const filters: string[] = [];
  const q = query.toLowerCase();
  if (/thriller|suspense/.test(q)) filters.push("Genre: Thriller");
  if (/comedy|funny/.test(q)) filters.push("Tone: Comedy");
  if (/under \d+|less than \d+/.test(q)) filters.push("Runtime filter");
  if (/201\d|202\d|90s|80s/.test(q)) filters.push("Decade signal");
  if (/dark|psychological/.test(q)) filters.push("Mood: Dark");
  if (/different|outside|unusual/.test(q)) filters.push("Exploration mode");
  return filters;
}
