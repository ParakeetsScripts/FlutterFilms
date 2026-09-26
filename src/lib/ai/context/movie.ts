import "server-only";

import { getCatalogMovie, searchCatalog } from "@/lib/sync/catalog";

import type { MovieEvidence } from "./types";
import { movieEvidenceFromCatalog } from "./types";

export async function getMovieContext(movieId: number): Promise<MovieEvidence | null> {
  const movie = await getCatalogMovie(movieId);
  if (!movie) return null;
  return movieEvidenceFromCatalog(movie);
}

export async function getMoviesContext(movieIds: number[]): Promise<MovieEvidence[]> {
  const unique = [...new Set(movieIds)].slice(0, 8);
  const results: MovieEvidence[] = [];
  for (const id of unique) {
    const ctx = await getMovieContext(id);
    if (ctx) results.push(ctx);
  }
  return results;
}

export async function resolveMovieContextFromQuery(query: string): Promise<MovieEvidence[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];
  const idMatch = trimmed.match(/\btmdb[:\s#-]*(\d{3,})\b/i) ?? trimmed.match(/\bmovie[:\s#-]*(\d{3,})\b/i);
  if (idMatch) {
    const ctx = await getMovieContext(Number(idMatch[1]));
    return ctx ? [ctx] : [];
  }
  const search = await searchCatalog(trimmed, 1);
  const top = search.results.slice(0, 3);
  const contexts: MovieEvidence[] = [];
  for (const summary of top) {
    const ctx = await getMovieContext(summary.id);
    if (ctx) contexts.push(ctx);
  }
  return contexts;
}

export function formatMovieEvidenceBlock(movies: MovieEvidence[]): string {
  if (!movies.length) return "";
  return movies
    .map((m) => {
      const lines = [
        `${m.title}${m.year ? ` (${m.year})` : ""} · TMDB ${m.movieId}`,
        m.tmdb?.runtime ? `Runtime: ${m.tmdb.runtime} min (TMDB)` : null,
        m.tmdb?.releaseDate ? `Release: ${m.tmdb.releaseDate} (TMDB)` : null,
        m.tmdb?.genres?.length ? `Genres: ${m.tmdb.genres.join(", ")} (TMDB)` : null,
        m.tmdb?.rating != null ? `TMDB rating: ${m.tmdb.rating}` : null,
        m.imdb?.rating != null ? `IMDb rating: ${m.imdb.rating} (separate source)` : null,
        m.cast?.length ? `Cast: ${m.cast.join(", ")} (TMDB)` : null,
        m.crew?.length ? `Crew: ${m.crew.join(", ")} (TMDB)` : null,
      ].filter(Boolean);
      return lines.join("\n");
    })
    .join("\n\n");
}
