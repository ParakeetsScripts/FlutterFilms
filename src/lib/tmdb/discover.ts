import { cacheKey, CACHE_TTL } from "./cache";
import { tmdbFetch } from "./client";
import { normalizePagedMovies, type TmdbPagedRaw } from "./normalize";
import type { DiscoverQuery, MovieSummary, PagedResult } from "./types";

const SORT_MAP = {
  popularity: "popularity",
  rating: "vote_average",
  release_date: "primary_release_date",
  title: "original_title",
} as const;

export async function discoverMovies(query: DiscoverQuery = {}): Promise<PagedResult<MovieSummary>> {
  const direction = query.sortDirection ?? "desc";
  const sortBy = `${SORT_MAP[query.sort ?? "popularity"]}.${direction}`;
  const raw = await tmdbFetch<TmdbPagedRaw>(
    "/discover/movie",
    {
      page: query.page ?? 1,
      with_genres: query.genre,
      primary_release_year: query.year,
      "primary_release_date.gte": query.releaseDateGte ?? (query.yearGte ? `${query.yearGte}-01-01` : undefined),
      "primary_release_date.lte": query.releaseDateLte ?? (query.yearLte ? `${query.yearLte}-12-31` : undefined),
      "with_runtime.gte": query.runtimeGte,
      "with_runtime.lte": query.runtimeLte,
      "vote_average.gte": query.ratingGte,
      "vote_average.lte": query.ratingLte,
      with_original_language: query.language,
      region: query.region,
      sort_by: sortBy,
      include_adult: false,
      "vote_count.gte": query.sort === "rating" ? 100 : undefined,
    },
    {
      ttlMs: CACHE_TTL.list,
      cacheKey: cacheKey(["discover", JSON.stringify(query)]),
    },
  );
  return normalizePagedMovies(raw);
}

export function getHiddenGems(page = 1, language?: string) {
  return discoverMovies({
    page,
    language,
    ratingGte: 7,
    sort: "rating",
    yearGte: 1970,
  });
}

export function getGenreMovies(genreId: number, sort: DiscoverQuery["sort"] = "popularity", page = 1) {
  return discoverMovies({ genre: genreId, sort, page });
}
