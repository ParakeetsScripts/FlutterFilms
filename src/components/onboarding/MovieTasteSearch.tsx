"use client";

import { getPosterUrl } from "@/lib/tmdb/images";
import { track } from "@/lib/analytics/track";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import type { MovieTasteItem } from "@/lib/onboarding/types";
import { MAX_FAVORITE_MOVIES } from "@/lib/onboarding/types";
import { useCallback, useState } from "react";

type SearchResponse = { movies: MovieTasteItem[] };

export function MovieTasteSearch({
  selected,
  onSelect,
  onRemove,
  maxReached,
}: {
  selected: MovieTasteItem[];
  onSelect: (movie: MovieTasteItem) => boolean;
  onRemove: (tmdbId: number) => void;
  maxReached: boolean;
}) {
  const [query, setQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const fetcher = useCallback(async (q: string) => {
    track("onboarding_movie_search");
    const r = await fetch(`/api/onboarding/search?q=${encodeURIComponent(q)}&type=movie`);
    if (!r.ok) throw new Error("search failed");
    return (await r.json()) as SearchResponse;
  }, []);

  const { results, loading, error } = useDebouncedSearch(query, fetcher);
  const movies = results?.movies ?? [];
  const selectedIds = new Set(selected.map((m) => m.tmdbId));

  return (
    <div className="onboarding-movies">
      <div className="onboarding-movies__search-wrap">
        <label className="sr-only" htmlFor="onboarding-movie-search">Search for a movie</label>
        <input
          id="onboarding-movie-search"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setFocusedIndex(-1);
          }}
          placeholder="Search for a movie you love…"
          className="onboarding-search-input"
          autoComplete="off"
          role="combobox"
          aria-expanded={query.length >= 2}
          aria-controls="onboarding-movie-results"
        />
        {query.length > 0 && query.length < 2 && (
          <p className="onboarding-hint">Keep typing…</p>
        )}
        {loading && <p className="onboarding-hint" role="status">Searching…</p>}
        {error && <p className="onboarding-error">{error}</p>}
        {query.length >= 2 && !loading && !error && movies.length === 0 && (
          <p className="onboarding-hint">No matching movies found. Try another spelling.</p>
        )}
        {movies.length > 0 && (
          <ul id="onboarding-movie-results" className="onboarding-search-results" role="listbox">
            {movies.map((movie, index) => {
              const isSelected = selectedIds.has(movie.tmdbId);
              return (
                <li key={movie.tmdbId} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    className={`onboarding-search-result ${isSelected ? "is-selected" : ""} ${focusedIndex === index ? "is-focused" : ""}`}
                    onClick={() => !isSelected && !maxReached && onSelect(movie)}
                    disabled={isSelected || (maxReached && !isSelected)}
                    onFocus={() => setFocusedIndex(index)}
                  >
                    {getPosterUrl(movie.posterPath, "w154") ? (
                      <img
                        src={getPosterUrl(movie.posterPath, "w154")!}
                        alt=""
                        className="onboarding-search-result__poster"
                        loading="lazy"
                      />
                    ) : (
                      <div className="onboarding-search-result__poster onboarding-search-result__poster--empty" aria-hidden="true" />
                    )}
                    <div className="onboarding-search-result__meta">
                      <span className="onboarding-search-result__title">{movie.title}</span>
                      {movie.year ? <span className="onboarding-search-result__year">{movie.year}</span> : null}
                      {movie.originalTitle && movie.originalTitle !== movie.title ? (
                        <span className="onboarding-search-result__sub">{movie.originalTitle}</span>
                      ) : null}
                    </div>
                    {isSelected ? <span className="onboarding-search-result__check" aria-hidden="true">✓</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <aside className="onboarding-selected-panel" aria-live="polite">
        <h3 className="onboarding-selected-panel__title">Your favorites ({selected.length})</h3>
        {maxReached && (
          <p className="onboarding-hint">You&apos;ve reached the maximum of {MAX_FAVORITE_MOVIES} favorites.</p>
        )}
        {selected.length === 0 ? (
          <p className="onboarding-hint">Search and select at least 3 movies you love.</p>
        ) : (
          <ul className="onboarding-selected-list">
            {selected.map((movie) => (
              <li key={movie.tmdbId} className="onboarding-selected-chip">
                {getPosterUrl(movie.posterPath, "w92") ? (
                  <img src={getPosterUrl(movie.posterPath, "w92")!} alt="" className="onboarding-selected-chip__poster" />
                ) : (
                  <div className="onboarding-selected-chip__poster onboarding-search-result__poster--empty" aria-hidden="true" />
                )}
                <span className="onboarding-selected-chip__title">{movie.title}</span>
                <button
                  type="button"
                  className="onboarding-selected-chip__remove"
                  aria-label={`Remove ${movie.title}`}
                  onClick={() => onRemove(movie.tmdbId)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
