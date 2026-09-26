"use client";

import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import type { MovieSummary } from "@/lib/tmdb/types";
import { FEATURED_GENRES } from "@/lib/regions";
import { genrePath, moviePath } from "@/lib/slug";
import { getPosterUrl } from "@/lib/tmdb/images";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { MovieCard } from "@/components/movie/MovieCard";

type SearchPayload = {
  movies: MovieSummary[];
  people: Array<{ id: number; name: string; profilePath: string | null; href: string }>;
  genres: Array<{ id: number; name: string; href: string }>;
};

type ResultItem =
  | { kind: "movie"; movie: MovieSummary }
  | { kind: "person"; id: number; name: string; profilePath: string | null; href: string }
  | { kind: "genre"; id: number; name: string; href: string };

export function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { searches, addSearch } = useUserLibrary();
  const [query, setQuery] = useState("");
  const [payload, setPayload] = useState<SearchPayload>({ movies: [], people: [], genres: [] });
  const [active, setActive] = useState(0);

  const results = useMemo<ResultItem[]>(() => {
    const items: ResultItem[] = payload.movies.map((movie) => ({ kind: "movie", movie }));
    for (const person of payload.people) items.push({ kind: "person", ...person });
    for (const genre of payload.genres) items.push({ kind: "genre", ...genre });
    return items;
  }, [payload]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 20);
    else {
      setQuery("");
      setPayload({ movies: [], people: [], genres: [] });
      setActive(0);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setPayload({ movies: [], people: [], genres: [] });
      return;
    }
    const handle = setTimeout(async () => {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query.trim())}`);
      if (!response.ok) return;
      const data = (await response.json()) as SearchPayload;
      setPayload(data);
      setActive(0);
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  function go(item?: ResultItem) {
    const target = item ?? results[active];
    if (!target) {
      if (query.trim()) {
        addSearch(query.trim());
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        onClose();
      }
      return;
    }
    addSearch(query.trim() || (target.kind === "movie" ? target.movie.title : target.name));
    if (target.kind === "movie") router.push(moviePath(target.movie.id, target.movie.title));
    else router.push(target.href);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="search-overlay" role="dialog" aria-label="Search" onClick={onClose}>
      <div className="search-overlay__panel search-overlay__panel--wide" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "Enter") go();
            if (e.key === "ArrowDown") setActive((v) => Math.min(results.length - 1, v + 1));
            if (e.key === "ArrowUp") setActive((v) => Math.max(0, v - 1));
          }}
          placeholder="Search movies, people, genres…"
          className="search-overlay__input"
        />
        {!query && (
          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <div>
              <p className="eyebrow">Recent</p>
              <ul className="mt-3 space-y-2">
                {searches.length === 0 && <li className="text-sm text-[var(--text-muted)]">No recent searches</li>}
                {searches.map((item) => (
                  <li key={item}>
                    <button type="button" onClick={() => setQuery(item)} className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]">
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow">Genres</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {FEATURED_GENRES.map((genre) => (
                  <li key={genre.id}>
                    <a href={genrePath(genre.id, genre.name)} onClick={onClose} className="filter-chip">
                      {genre.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="sm:col-span-2">
              <p className="eyebrow">AI Copilot</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                <li><a href="/copilot" onClick={onClose} className="filter-chip">Open AI Copilot</a></li>
                <li><a href="/open-models" onClick={onClose} className="filter-chip">Open Models hub</a></li>
                <li><a href="/my-cinema" onClick={onClose} className="filter-chip">My Cinema</a></li>
              </ul>
            </div>
          </div>
        )}
        {query && (
          <div className="mt-6 space-y-1">
            <p className="eyebrow mb-3">Results</p>
            {results.map((item, index) => (
              <button
                key={item.kind === "movie" ? `movie-${item.movie.id}` : `${item.kind}-${item.id}`}
                type="button"
                onClick={() => go(item)}
                className={`search-result ${index === active ? "is-active" : ""}`}
              >
                {item.kind === "movie" ? (
                  <MovieCard movie={item.movie} variant="search" />
                ) : item.kind === "person" ? (
                  <article className="flex w-full items-center gap-4">
                    <div className="h-14 w-14 overflow-hidden rounded-full bg-[var(--surface-2)]">
                      {item.profilePath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={getPosterUrl(item.profilePath, "w185") ?? ""} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">Person</p>
                    </div>
                  </article>
                ) : (
                  <article className="flex w-full items-center justify-between gap-4 text-left">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">Genre</p>
                  </article>
                )}
              </button>
            ))}
            {results.length === 0 && <p className="py-4 text-sm text-[var(--text-muted)]">No matches yet</p>}
          </div>
        )}
      </div>
    </div>
  );
}
