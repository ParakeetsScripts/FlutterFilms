"use client";

import { MovieCard } from "@/components/movie/MovieCard";
import type { Movie } from "@/lib/tmdb/types";
import { useEffect, useState } from "react";

export function SavedMovies({ title, ids }: { title: string; ids: number[] }) {
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      ids.slice(0, 40).map(async (id) => {
        const response = await fetch(`/api/movies/${id}`);
        if (!response.ok) return null;
        return (await response.json()) as Movie;
      }),
    ).then((items) => {
      if (!cancelled) setMovies(items.filter((item): item is Movie => Boolean(item)));
    });
    return () => {
      cancelled = true;
    };
  }, [ids]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="font-serif text-5xl">{title}</h1>
      <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-5">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} variant="watchlist" />
        ))}
      </div>
    </div>
  );
}
