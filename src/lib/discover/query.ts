import type { CatalogPreferences } from "@/lib/catalog/preferences";
import {
  parseGenreId,
  parseLanguage,
  parsePage,
  parseRating,
  parseRegion,
  parseSort,
  parseYear,
} from "@/lib/validation";

export type MoviesPageParams = Record<string, string | string[] | undefined>;

export type MoviesDiscoverQuery = {
  page: number;
  genre?: number;
  year?: number;
  yearGte?: number;
  yearLte?: number;
  ratingGte?: number;
  uiLanguage: string;
  originalLanguage?: string;
  originCountry?: string;
  sort: ReturnType<typeof parseSort>;
};

function paramValue(params: MoviesPageParams, key: string): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

export function hasLanguageParam(params: MoviesPageParams): boolean {
  return Object.prototype.hasOwnProperty.call(params, "language");
}

export function resolveOriginalLanguage(params: MoviesPageParams): string | undefined {
  if (!hasLanguageParam(params)) return undefined;
  const raw = paramValue(params, "language");
  if (!raw || raw === "all") return undefined;
  return parseLanguage(raw);
}

export function buildMoviesDiscoverQuery(
  params: MoviesPageParams,
  catalog: CatalogPreferences,
): MoviesDiscoverQuery {
  return {
    page: parsePage(paramValue(params, "page")),
    genre: parseGenreId(paramValue(params, "genre")),
    year: parseYear(paramValue(params, "year")),
    yearGte: parseYear(paramValue(params, "yearGte")),
    yearLte: parseYear(paramValue(params, "yearLte")),
    ratingGte: parseRating(paramValue(params, "ratingGte")),
    uiLanguage: catalog.uiLanguage,
    originalLanguage: resolveOriginalLanguage(params),
    originCountry: parseRegion(paramValue(params, "country")),
    sort: parseSort(paramValue(params, "sort")),
  };
}

export function buildMoviesPageHref(
  params: MoviesPageParams,
  updates: Record<string, string | number | null | undefined> = {},
): string {
  const next = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (key === "page" || Object.prototype.hasOwnProperty.call(updates, key)) continue;
    if (typeof value === "string" && value !== "") next.set(key, value);
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value === "") next.delete(key);
    else next.set(key, String(value));
  }

  const query = next.toString();
  return query ? `/movies?${query}` : "/movies";
}
