import "server-only";

import { fetchTmdbMovieRaw } from "@/lib/tmdb/movies";
import type { Movie, MovieSummary, PagedResult } from "@/lib/tmdb/types";
import { rowToCatalogMovie, summaryFromCatalog } from "./merge";
import { getMovieRow, listRecentlyAdded, listRecentlyUpdated, searchIndex } from "./repository";
import { refreshMovieFromTmdb } from "./tmdb-sync";
import type { CatalogMovie } from "./types";

const STALE_MS = Number(process.env.SYNC_STALE_MS ?? 6 * 60 * 60 * 1000);

function isStale(lastSyncedAt: string | null): boolean {
  if (!lastSyncedAt) return true;
  return Date.now() - new Date(lastSyncedAt).getTime() > STALE_MS;
}

export async function getCatalogMovie(
  tmdbId: number,
  options: { language?: string; region?: string; forceRefresh?: boolean } = {},
): Promise<CatalogMovie | null> {
  let row = await getMovieRow(tmdbId);
  if (!row || options.forceRefresh || isStale(row.last_synced_at)) {
    await refreshMovieFromTmdb(tmdbId);
    row = await getMovieRow(tmdbId);
  }
  if (row) {
    const catalog = rowToCatalogMovie(row);
    if (options.region && catalog.watchProviders?.region !== options.region) {
      const live = await fetchTmdbMovieRaw(tmdbId, options);
      if (live) return { ...catalog, watchProviders: live.watchProviders, videos: live.videos, images: live.images };
    }
    return catalog;
  }
  const live = await fetchTmdbMovieRaw(tmdbId, options);
  if (!live) return null;
  await refreshMovieFromTmdb(tmdbId);
  row = await getMovieRow(tmdbId);
  return row
    ? rowToCatalogMovie(row)
    : {
        ...live,
        keywords: live.keywords ?? [],
        releases: live.releases ?? { certification: null, byRegion: [] },
        imdbRating: null,
        imdbVoteCount: null,
        tmdbRating: live.voteAverage,
        tmdbVoteCount: live.voteCount,
        lastSyncedAt: live.retrievedAt,
        metadataUpdatedAt: live.retrievedAt,
        ratingsUpdatedAt: live.retrievedAt,
        metadataCompleteness: null,
        sourceRecords: [],
      };
}

function rankSearchRow(
  row: { title: string; original_title: string | null; year: number | null },
  query: string,
): number {
  const q = query.toLowerCase().trim();
  const title = row.title.toLowerCase();
  const original = (row.original_title ?? "").toLowerCase();
  let score = 0;
  if (title === q) score += 1000;
  else if (title.startsWith(q)) score += 800;
  else if (original === q) score += 700;
  else if (original.startsWith(q)) score += 600;
  else if (title.includes(q)) score += 400;
  else score += 100;
  const yearMatch = q.match(/\b(19|20)\d{2}\b/);
  if (yearMatch && row.year === Number(yearMatch[0])) score += 50;
  return score;
}

export async function searchCatalog(query: string, page = 1, pageSize = 40): Promise<PagedResult<MovieSummary>> {
  const offset = (page - 1) * pageSize;
  const local = await searchIndex(query, pageSize, offset);
  if (local.length) {
    const ranked = [...local].sort((a, b) => rankSearchRow(b, query) - rankSearchRow(a, query));
    const results = ranked.map((row) => summaryFromCatalog(rowToCatalogMovie(row))) as MovieSummary[];
    return { page, totalPages: page, totalResults: results.length, results };
  }
  const { searchMovies } = await import("@/lib/tmdb/search");
  const remote = await searchMovies(query, page);
  for (const movie of remote.results.slice(0, 10)) {
    void refreshMovieFromTmdb(movie.id);
  }
  return remote;
}

export async function getLatestSections() {
  const [updatedRows, addedRows] = await Promise.all([listRecentlyUpdated(18), listRecentlyAdded(18)]);
  const updated = updatedRows.map((row) => summaryFromCatalog(rowToCatalogMovie(row)));
  const added = addedRows.map((row) => summaryFromCatalog(rowToCatalogMovie(row)));
  return { updated, added };
}

export function catalogMovieToLegacy(movie: CatalogMovie): Movie {
  return movie;
}
