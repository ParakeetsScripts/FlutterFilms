"use client";

import { LibraryNav } from "@/components/library/LibraryNav";
import { MovieCard } from "@/components/movie/MovieCard";
import { PosterSkeleton } from "@/components/ui/States";
import type { Movie } from "@/lib/tmdb/types";
import { useEffect, useMemo, useState } from "react";

type SortKey = "recent" | "release" | "title" | "rating";

export function SavedMoviesGrid({
  title,
  ids,
  sortKeys = ["recent", "release", "title", "rating"],
  defaultSort = "recent",
}: {
  title: string;
  ids: number[];
  sortKeys?: SortKey[];
  defaultSort?: SortKey;
}) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>(defaultSort);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all(
      ids.slice(0, 60).map(async (id) => {
        const response = await fetch(`/api/movies/${id}`);
        if (!response.ok) return null;
        return (await response.json()) as Movie;
      }),
    ).then((items) => {
      if (!cancelled) {
        setMovies(items.filter((item): item is Movie => Boolean(item)));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ids]);

  const sorted = useMemo(() => {
    const list = [...movies];
    switch (sort) {
      case "release":
        return list.sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""));
      case "title":
        return list.sort((a, b) => a.title.localeCompare(b.title));
      case "rating":
        return list.sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0));
      default:
        return list.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    }
  }, [ids, movies, sort]);

  return (
    <div className="page-container page-section">
      <LibraryNav />
      <header className="page-header mt-8">
        <p className="eyebrow">Your library</p>
        <h1 className="page-header__title">{title}</h1>
      </header>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {sortKeys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSort(key)}
            className={`filter-chip ${sort === key ? "is-active" : ""}`}
          >
            {key === "recent" ? "Recently added" : key === "release" ? "Release date" : key === "title" ? "Title" : "TMDB rating"}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="mt-10">
          <PosterSkeleton count={10} />
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {sorted.map((movie) => (
            <MovieCard key={movie.id} movie={movie} variant="watchlist" />
          ))}
        </div>
      )}
    </div>
  );
}
