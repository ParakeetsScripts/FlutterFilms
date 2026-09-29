import "server-only";

import { fetchTmdbMovieRaw } from "@/lib/tmdb/movies";
import { resolveMovieVideos } from "@/lib/tmdb/videos.server";
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

function liveToCatalogMovie(live: Movie): CatalogMovie {
  return {
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

async function enrichWithStoredRatings(movie: CatalogMovie): Promise<CatalogMovie> {
  try {
    const row = await getMovieRow(movie.id);
    if (!row) return movie;
    return {
      ...movie,
      imdbId: row.imdb_id ?? movie.imdbId,
      imdbRating: row.imdb_rating ?? movie.imdbRating,
      imdbVoteCount: row.imdb_vote_count ?? movie.imdbVoteCount,
      ratingsUpdatedAt: row.ratings_updated_at ?? movie.ratingsUpdatedAt,
    };
  } catch {
    return movie;
  }
}

async function fetchLiveCatalogMovie(
  tmdbId: number,
  options: { language?: string; region?: string } = {},
): Promise<CatalogMovie | null> {
  try {
    const live = await fetchTmdbMovieRaw(tmdbId, options);
    if (!live) return null;
    return enrichWithStoredRatings(liveToCatalogMovie(live));
  } catch {
    return null;
  }
}

export async function getCatalogMovie(
  tmdbId: number,
  options: { language?: string; region?: string; forceRefresh?: boolean } = {},
): Promise<CatalogMovie | null> {
  let row: Awaited<ReturnType<typeof getMovieRow>> = null;

  try {
    row = await getMovieRow(tmdbId);
    if (!row || options.forceRefresh || isStale(row.last_synced_at)) {
      await refreshMovieFromTmdb(tmdbId);
      row = await getMovieRow(tmdbId);
    }
  } catch {
    row = null;
  }

  if (row) {
    try {
      const catalog = rowToCatalogMovie(row);
      const needsLiveMedia =
        (options.region && catalog.watchProviders?.region !== options.region) || !catalog.videos?.length;
      if (needsLiveMedia) {
        const live = await fetchLiveCatalogMovie(tmdbId, options);
        if (live) {
          const videos = live.videos?.length
            ? live.videos
            : await resolveMovieVideos(tmdbId, catalog.videos, options.language);
          return {
            ...catalog,
            watchProviders: live.watchProviders ?? catalog.watchProviders,
            videos,
            images: live.images?.posters?.length ? live.images : catalog.images,
          };
        }
      }
      if (!catalog.videos?.length) {
        const videos = await resolveMovieVideos(tmdbId, catalog.videos, options.language);
        if (videos.length) return { ...catalog, videos };
      }
      return catalog;
    } catch {
      // Corrupt row — fall through to live TMDB
    }
  }

  const live = await fetchLiveCatalogMovie(tmdbId, options);
  if (live) {
    const videos = live.videos?.length
      ? live.videos
      : await resolveMovieVideos(tmdbId, live.videos, options.language);
    void refreshMovieFromTmdb(tmdbId).catch(() => {});
    return videos.length ? { ...live, videos } : live;
  }

  return null;
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
  try {
    const [updatedRows, addedRows] = await Promise.all([listRecentlyUpdated(18), listRecentlyAdded(18)]);
    const updated = updatedRows.map((row) => summaryFromCatalog(rowToCatalogMovie(row)));
    const added = addedRows.map((row) => summaryFromCatalog(rowToCatalogMovie(row)));
    if (updated.length || added.length) return { updated, added };
  } catch {
    // Local dev without Postgres — fall back to live TMDB lists.
  }

  const { getNowPlayingMovies, getPopularMovies } = await import("@/lib/tmdb/movies");
  const [popular, nowPlaying] = await Promise.all([
    getPopularMovies(1).catch(() => ({ results: [] as MovieSummary[] })),
    getNowPlayingMovies(1).catch(() => ({ results: [] as MovieSummary[] })),
  ]);
  return {
    updated: popular.results.slice(0, 18),
    added: nowPlaying.results.slice(0, 18),
  };
}

export function catalogMovieToLegacy(movie: CatalogMovie): Movie {
  return movie;
}
