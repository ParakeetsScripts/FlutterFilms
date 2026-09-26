import { cacheKey, CACHE_TTL } from "./cache";
import { tmdbFetch } from "./client";
import { normalizePagedMovies, type TmdbPagedRaw } from "./normalize";

export async function getRecommendations(id: number, page = 1) {
  const raw = await tmdbFetch<TmdbPagedRaw>(
    `/movie/${id}/recommendations`,
    { page },
    { ttlMs: CACHE_TTL.list, cacheKey: cacheKey(["recs", id, page]) },
  );
  return normalizePagedMovies(raw);
}
