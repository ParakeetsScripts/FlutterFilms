import { cacheKey, CACHE_TTL } from "./cache";
import { tmdbFetch } from "./client";

export type TmdbChangePage = {
  results: Array<{ id: number; adult: boolean }>;
  page: number;
  total_pages: number;
  total_results: number;
};

export async function getMovieChanges(startDate: string, endDate: string, page = 1): Promise<TmdbChangePage> {
  return tmdbFetch<TmdbChangePage>(
    "/movie/changes",
    { start_date: startDate, end_date: endDate, page },
    { ttlMs: CACHE_TTL.list, cacheKey: cacheKey(["changes", startDate, endDate, page]) },
  );
}

export async function collectChangedMovieIds(daysBack = 1): Promise<number[]> {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - Math.min(daysBack, 14));
  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);
  const ids = new Set<number>();
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages && page <= 20) {
    const response = await getMovieChanges(startDate, endDate, page);
    response.results.forEach((item) => ids.add(item.id));
    totalPages = response.total_pages;
    page += 1;
  }
  return [...ids];
}
