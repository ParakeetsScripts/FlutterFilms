import "server-only";

import { getMovieRow } from "./repository";
import type { CatalogMovie } from "./types";
import { rowToCatalogMovie } from "./merge";

export type IdentityMatch = {
  tmdbId: number;
  imdbId: string | null;
  title: string;
  year: number | null;
  confidence: "high" | "medium" | "low";
  method: "tmdb_imdb_id" | "catalog_row" | "unmatched";
  conflict?: string;
};

/** Preferred identity path: TMDB movie → imdb_id → IMDb title record. */
export async function resolveMovieIdentity(tmdbId: number): Promise<IdentityMatch | null> {
  const row = await getMovieRow(tmdbId);
  if (!row) return null;

  const catalog = rowToCatalogMovie(row) as CatalogMovie;
  if (catalog.imdbId) {
    return {
      tmdbId: catalog.id,
      imdbId: catalog.imdbId,
      title: catalog.title,
      year: catalog.year,
      confidence: "high",
      method: "tmdb_imdb_id",
    };
  }

  return {
    tmdbId: catalog.id,
    imdbId: null,
    title: catalog.title,
    year: catalog.year,
    confidence: "medium",
    method: "catalog_row",
  };
}

export function formatSourceConflict(movie: {
  runtime?: number | null;
  imdbRating?: number | null;
  tmdbRating?: number | null;
  voteAverage?: number | null;
  runtimeConflict?: { tmdb: number | null; imdb: number | null; selected: number | null };
}) {
  const conflicts: Array<{ field: string; tmdb?: string; imdb?: string; note: string }> = [];
  if (movie.runtimeConflict?.tmdb != null && movie.runtimeConflict?.imdb != null) {
    if (movie.runtimeConflict.tmdb !== movie.runtimeConflict.imdb) {
      conflicts.push({
        field: "runtime",
        tmdb: `${movie.runtimeConflict.tmdb} min`,
        imdb: `${movie.runtimeConflict.imdb} min`,
        note: "Sources disagree — both values are shown separately.",
      });
    }
  }
  const tmdb = movie.tmdbRating ?? movie.voteAverage;
  if (tmdb != null && movie.imdbRating != null && Math.abs(tmdb - movie.imdbRating) > 1.5) {
    conflicts.push({
      field: "rating",
      tmdb: String(tmdb),
      imdb: String(movie.imdbRating),
      note: "Ratings are never merged.",
    });
  }
  return conflicts;
}
