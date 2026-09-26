import type { Movie } from "@/lib/tmdb/types";

export function calculateCompleteness(movie: Partial<Movie> & { imdbId?: string | null }): number {
  const checks = [
    Boolean(movie.title),
    Boolean(movie.releaseDate),
    Boolean(movie.overview),
    Boolean(movie.posterPath),
    movie.runtime != null,
    (movie.genres?.length ?? 0) > 0,
    (movie.credits?.cast?.length ?? 0) > 0,
    Boolean(movie.imdbId),
  ];
  const score = checks.filter(Boolean).length / checks.length;
  return Math.round(score * 100);
}
