import { cacheKey, CACHE_TTL } from "./cache";
import { tmdbFetch } from "./client";
import { normalizePagedMovies, type TmdbPagedRaw } from "./normalize";
import type { MovieSummary, PagedResult } from "./types";

export async function searchMovies(
  query: string,
  page = 1,
  year?: number,
): Promise<PagedResult<MovieSummary>> {
  const raw = await tmdbFetch<TmdbPagedRaw>(
    "/search/movie",
    { query, page, year, include_adult: false },
    { ttlMs: CACHE_TTL.search, cacheKey: cacheKey(["search", query.toLowerCase(), page, year]) },
  );
  return normalizePagedMovies(raw);
}

export async function searchPeople(query: string, page = 1) {
  return tmdbFetch<{
    results: Array<{ id: number; name: string; profile_path: string | null; known_for_department?: string }>;
  }>(
    "/search/person",
    { query, page, include_adult: false },
    { ttlMs: CACHE_TTL.search, cacheKey: cacheKey(["search-people", query.toLowerCase(), page]) },
  );
}
