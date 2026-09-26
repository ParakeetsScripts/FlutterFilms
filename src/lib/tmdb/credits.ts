import { cacheKey, CACHE_TTL } from "./cache";
import { tmdbFetch } from "./client";
import { normalizeMovie, type TmdbMovieRaw } from "./normalize";

export async function getMovieCredits(id: number) {
  const raw = await tmdbFetch<TmdbMovieRaw>(
    `/movie/${id}/credits`,
    {},
    { ttlMs: CACHE_TTL.detail, cacheKey: cacheKey(["credits", id]) },
  );
  return normalizeMovie({ ...raw, id, title: raw.title ?? "Credits" })?.credits ?? { cast: [], crew: [] };
}

export { FEATURED_CREW_JOBS } from "./crew-jobs";
