import type { FilterDraft } from "./filter-draft";
import { filterDraftFromParams } from "./filter-draft";
import type { MoviesPageParams } from "./query";

export function countActiveFilters(draft: FilterDraft): number {
  let count = 0;
  if (draft.genre) count += 1;
  if (draft.language) count += 1;
  if (draft.country) count += 1;
  if (draft.year) count += 1;
  else if (draft.yearGte && draft.yearLte) count += 1;
  if (draft.ratingGte) count += 1;
  if (draft.sort && draft.sort !== "popularity") count += 1;
  return count;
}

export function paramsToSearchParams(params: MoviesPageParams): URLSearchParams {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value !== "") search.set(key, value);
  }
  return search;
}

export function hasActiveMovieFilters(params: MoviesPageParams): boolean {
  return countActiveFilters(filterDraftFromParams(paramsToSearchParams(params))) > 0;
}

export const SORT_LABELS: Record<string, string> = {
  popularity: "Popularity",
  rating: "Rating",
  release_date: "Release date",
  title: "Title",
};
