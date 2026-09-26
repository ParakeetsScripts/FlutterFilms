/**
 * Deterministic field priority when merging TMDB and IMDb into display values.
 * Source-specific ratings are always stored separately and never averaged.
 */
export const FIELD_PRIORITY: Record<string, { primary: "tmdb" | "imdb"; fallback: "tmdb" | "imdb" }> = {
  title: { primary: "tmdb", fallback: "imdb" },
  originalTitle: { primary: "tmdb", fallback: "imdb" },
  releaseDate: { primary: "tmdb", fallback: "imdb" },
  runtime: { primary: "imdb", fallback: "tmdb" },
  genres: { primary: "tmdb", fallback: "imdb" },
  overview: { primary: "tmdb", fallback: "imdb" },
  posterPath: { primary: "tmdb", fallback: "imdb" },
  backdropPath: { primary: "tmdb", fallback: "imdb" },
  watchProviders: { primary: "tmdb", fallback: "tmdb" },
};

export type SourceName = "tmdb" | "imdb";

export type SourceFieldStatus = "CURRENT" | "STALE" | "FAILED" | "MISSING" | "CONFLICT";
