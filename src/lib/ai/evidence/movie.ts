import "server-only";

import { getCatalogMovie, searchCatalog } from "@/lib/sync/catalog";

import type { MovieEvidence } from "./types";
import { movieEvidenceFromCatalog } from "./types";

export async function getMovieEvidence(movieId: number): Promise<MovieEvidence | null> {
  const movie = await getCatalogMovie(movieId);
  if (!movie) return null;
  return movieEvidenceFromCatalog(movie);
}

export async function getMoviesEvidence(movieIds: number[]): Promise<MovieEvidence[]> {
  const unique = [...new Set(movieIds)].slice(0, 8);
  const results: MovieEvidence[] = [];
  for (const id of unique) {
    const evidence = await getMovieEvidence(id);
    if (evidence) results.push(evidence);
  }
  return results;
}

export async function resolveMovieEvidenceFromQuery(query: string): Promise<MovieEvidence[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];
  const idMatch = trimmed.match(/\btmdb[:\s#-]*(\d{3,})\b/i) ?? trimmed.match(/\bmovie[:\s#-]*(\d{3,})\b/i);
  if (idMatch) {
    const evidence = await getMovieEvidence(Number(idMatch[1]));
    return evidence ? [evidence] : [];
  }
  const search = await searchCatalog(trimmed, 1);
  const contexts: MovieEvidence[] = [];
  for (const summary of search.results.slice(0, 3)) {
    const evidence = await getMovieEvidence(summary.id);
    if (evidence) contexts.push(evidence);
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
        m.conflicts?.length
          ? `Source notes: ${m.conflicts.map((c) => `${c.field} TMDB=${c.tmdb ?? "n/a"} IMDb=${c.imdb ?? "n/a"}`).join("; ")}`
          : null,
      ].filter(Boolean);
      return lines.join("\n");
    })
    .join("\n\n");
}
