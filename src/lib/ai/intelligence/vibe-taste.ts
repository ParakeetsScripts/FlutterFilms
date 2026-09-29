import type { MovieSummary } from "@/lib/tmdb/types";

export type VibeTasteContext = {
  favoriteMovieIds?: number[];
  watchlistIds?: number[];
  historyIds?: number[];
  favoriteGenreIds?: number[];
};

export function tasteExcludeIds(taste?: VibeTasteContext): Set<number> {
  return new Set([
    ...(taste?.favoriteMovieIds ?? []),
    ...(taste?.watchlistIds ?? []),
    ...(taste?.historyIds ?? []),
  ]);
}

function genreOverlap(movie: MovieSummary, favoriteGenreIds: number[]): number {
  if (!favoriteGenreIds.length) return 0;
  const ids = movie.genres?.map((genre) => genre.id) ?? [];
  return ids.filter((id) => favoriteGenreIds.includes(id)).length;
}

export function applyTasteFilters(movies: MovieSummary[], taste?: VibeTasteContext): MovieSummary[] {
  const exclude = tasteExcludeIds(taste);
  const favoriteGenres = taste?.favoriteGenreIds ?? [];
  return movies
    .filter((movie) => !exclude.has(movie.id))
    .sort((a, b) => genreOverlap(a, favoriteGenres) - genreOverlap(b, favoriteGenres));
}
