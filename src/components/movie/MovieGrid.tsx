import type { MovieSummary } from "@/lib/tmdb/types";
import { MovieCard } from "./MovieCard";

export function MovieGrid({
  movies,
  emptyMessage = "No movies to show right now.",
}: {
  movies: MovieSummary[];
  emptyMessage?: string;
}) {
  if (!movies.length) {
    return <p className="text-sm text-[var(--text-muted)]">{emptyMessage}</p>;
  }

  return (
    <div className="movie-grid">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}
