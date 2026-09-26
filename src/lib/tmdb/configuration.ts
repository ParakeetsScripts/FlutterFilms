import { cacheKey, CACHE_TTL } from "./cache";
import { tmdbFetch } from "./client";

export type TmdbConfiguration = {
  images: {
    secure_base_url: string;
    poster_sizes: string[];
    backdrop_sizes: string[];
    profile_sizes: string[];
    logo_sizes: string[];
  };
};

export async function getTmdbConfiguration(): Promise<TmdbConfiguration> {
  return tmdbFetch<TmdbConfiguration>(
    "/configuration",
    {},
    { ttlMs: CACHE_TTL.configuration, cacheKey: cacheKey(["configuration"]) },
  );
}

export async function getGenreList() {
  return tmdbFetch<{ genres: Array<{ id: number; name: string }> }>(
    "/genre/movie/list",
    {},
    { ttlMs: CACHE_TTL.genres, cacheKey: cacheKey(["genres"]) },
  );
}
