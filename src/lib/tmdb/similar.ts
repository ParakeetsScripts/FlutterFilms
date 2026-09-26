import { cacheKey, CACHE_TTL } from "./cache";
import { tmdbFetch } from "./client";
import { normalizePagedMovies, type TmdbPagedRaw } from "./normalize";

export async function getSimilarMovies(id: number, page = 1) {
  const raw = await tmdbFetch<TmdbPagedRaw>(
    `/movie/${id}/similar`,
    { page },
    { ttlMs: CACHE_TTL.list, cacheKey: cacheKey(["similar", id, page]) },
  );
  return normalizePagedMovies(raw);
}
