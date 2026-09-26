import "server-only";

import { getCatalogMovie, catalogMovieToLegacy } from "@/lib/sync/catalog";
import { cacheKey, CACHE_TTL } from "./cache";
import { tmdbFetch } from "./client";
import { normalizeMovie, normalizePagedMovies, type TmdbMovieRaw, type TmdbPagedRaw } from "./normalize";
import type { Movie, MovieSummary, PagedResult } from "./types";

const DETAIL_APPEND = "credits,videos,images,recommendations,similar,watch/providers,keywords,release_dates";

export async function getMovie(
  id: number,
  options: { language?: string; region?: string; forceRefresh?: boolean } = {},
): Promise<Movie | null> {
  const catalog = await getCatalogMovie(id, options);
  return catalog ? catalogMovieToLegacy(catalog) : null;
}

export async function fetchTmdbMovieRaw(
  id: number,
  options: { language?: string; region?: string } = {},
): Promise<Movie | null> {
  const raw = await tmdbFetch<TmdbMovieRaw>(
    `/movie/${id}`,
    {
      language: options.language,
      append_to_response: DETAIL_APPEND,
      include_image_language: "en,null",
    },
    { ttlMs: CACHE_TTL.detail, cacheKey: cacheKey(["movie", id, options.language, options.region]) },
  );
  return normalizeMovie(raw, { region: options.region });
}

async function getMovieList(
  path: string,
  page = 1,
  extra: Record<string, string | number | undefined> = {},
): Promise<PagedResult<MovieSummary>> {
  const raw = await tmdbFetch<TmdbPagedRaw>(
    path,
    { page, ...extra },
    { ttlMs: CACHE_TTL.list, cacheKey: cacheKey([path, page, ...Object.values(extra)]) },
  );
  return normalizePagedMovies(raw);
}

export function getPopularMovies(page = 1) {
  return getMovieList("/movie/popular", page);
}

export function getTopRatedMovies(page = 1) {
  return getMovieList("/movie/top_rated", page);
}

export function getNowPlayingMovies(page = 1, region?: string) {
  return getMovieList("/movie/now_playing", page, { region });
}

export function getUpcomingMovies(page = 1, region?: string) {
  return getMovieList("/movie/upcoming", page, { region });
}

export function getTrendingMovies(window: "day" | "week" = "day", page = 1) {
  return getMovieList(`/trending/movie/${window}`, page);
}

export async function getMovieCollection(id: number) {
  return tmdbFetch<{
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    parts: TmdbMovieRaw[];
  }>(
    `/collection/${id}`,
    {},
    { ttlMs: CACHE_TTL.detail, cacheKey: cacheKey(["collection", id]) },
  );
}
