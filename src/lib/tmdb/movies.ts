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
  try {
    const catalog = await getCatalogMovie(id, options);
    if (catalog) return catalogMovieToLegacy(catalog);
  } catch {
    // Catalog/DB path failed — try live TMDB below
  }
  try {
    return await fetchTmdbMovieRaw(id, options);
  } catch {
    return null;
  }
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

export type MovieListOptions = { language?: string; region?: string };

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

export function getPopularMovies(page = 1, options: MovieListOptions = {}) {
  return getMovieList("/movie/popular", page, { language: options.language, region: options.region });
}

export function getTopRatedMovies(page = 1, options: MovieListOptions = {}) {
  return getMovieList("/movie/top_rated", page, { language: options.language, region: options.region });
}

export function getNowPlayingMovies(page = 1, region?: string, language?: string) {
  return getMovieList("/movie/now_playing", page, { region, language });
}

export function getUpcomingMovies(page = 1, region?: string, language?: string) {
  return getMovieList("/movie/upcoming", page, { region, language });
}

export function getTrendingMovies(window: "day" | "week" = "day", page = 1, options: MovieListOptions = {}) {
  return getMovieList(`/trending/movie/${window}`, page, { language: options.language, region: options.region });
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
