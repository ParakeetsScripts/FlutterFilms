import { cacheKey, CACHE_TTL } from "./cache";
import { tmdbFetch } from "./client";
import { normalizeMovie, type TmdbMovieRaw } from "./normalize";
import type { WatchProviderGroup } from "./types";

export async function getWatchProviders(id: number, region = "US"): Promise<WatchProviderGroup | null> {
  const raw = await tmdbFetch<TmdbMovieRaw>(
    `/movie/${id}/watch/providers`,
    {},
    { ttlMs: CACHE_TTL.providers, cacheKey: cacheKey(["providers", id, region]) },
  );
  return normalizeMovie({ ...raw, id, title: raw.title ?? "Providers" }, { region })?.watchProviders ?? null;
}

export { JUSTWATCH_ATTRIBUTION } from "./constants";
