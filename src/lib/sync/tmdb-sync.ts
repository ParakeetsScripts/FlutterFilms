import "server-only";

import { getDatabase } from "@/lib/db/client";
import { collectChangedMovieIds } from "@/lib/tmdb/changes";
import { fetchTmdbMovieRaw } from "@/lib/tmdb/movies";
import { getNowPlayingMovies, getPopularMovies, getTrendingMovies, getUpcomingMovies } from "@/lib/tmdb/movies";
import type { Movie } from "@/lib/tmdb/types";
import { calculateCompleteness } from "./completeness";
import { hashValue } from "./hash";
import { recordChange, startSyncJob, finishSyncJob, upsertSearchIndex } from "./repository";
import type { SyncJobResult } from "./types";
import { randomUUID } from "node:crypto";

async function upsertFromTmdb(movie: Movie, syncJobId: string): Promise<"inserted" | "updated" | "unchanged"> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const dataHash = hashValue({
    title: movie.title,
    voteAverage: movie.voteAverage,
    voteCount: movie.voteCount,
    runtime: movie.runtime,
    overview: movie.overview,
    posterPath: movie.posterPath,
  });
  const existing = await db.get<{
    tmdb_id: number;
    tmdb_data_hash: string | null;
    tmdb_rating: number | null;
    tmdb_vote_count: number | null;
  }>("SELECT tmdb_id, tmdb_data_hash, tmdb_rating, tmdb_vote_count FROM movies WHERE tmdb_id = ?", [movie.id]);

  const fields: Array<{ field: string; old: string | null; new: string | null }> = [];
  if (existing) {
    if (existing.tmdb_rating !== movie.voteAverage) {
      fields.push({
        field: "tmdb_rating",
        old: existing.tmdb_rating?.toString() ?? null,
        new: movie.voteAverage?.toString() ?? null,
      });
    }
    if (existing.tmdb_vote_count !== movie.voteCount) {
      fields.push({
        field: "tmdb_vote_count",
        old: existing.tmdb_vote_count?.toString() ?? null,
        new: movie.voteCount?.toString() ?? null,
      });
    }
  }

  const completeness = calculateCompleteness(movie);
  const changed = !existing || existing.tmdb_data_hash !== dataHash;
  const keywordsText = (movie.keywords ?? []).map((k) => k.name).join(" ");

  await db.run(
    `INSERT INTO movies (
      tmdb_id, imdb_id, title, original_title, sort_title, overview, tagline, release_date, year,
      runtime, display_runtime, status, original_language, poster_path, backdrop_path, popularity,
      tmdb_rating, tmdb_vote_count, payload_json, tmdb_data_hash, metadata_completeness,
      last_synced_at, metadata_updated_at, ratings_updated_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(tmdb_id) DO UPDATE SET
      imdb_id = COALESCE(excluded.imdb_id, movies.imdb_id),
      title = excluded.title,
      original_title = excluded.original_title,
      sort_title = excluded.sort_title,
      overview = excluded.overview,
      tagline = excluded.tagline,
      release_date = excluded.release_date,
      year = excluded.year,
      runtime = excluded.runtime,
      display_runtime = excluded.display_runtime,
      original_language = excluded.original_language,
      poster_path = excluded.poster_path,
      backdrop_path = excluded.backdrop_path,
      popularity = excluded.popularity,
      tmdb_rating = excluded.tmdb_rating,
      tmdb_vote_count = excluded.tmdb_vote_count,
      payload_json = excluded.payload_json,
      tmdb_data_hash = excluded.tmdb_data_hash,
      metadata_completeness = excluded.metadata_completeness,
      last_synced_at = excluded.last_synced_at,
      metadata_updated_at = CASE WHEN excluded.tmdb_data_hash != movies.tmdb_data_hash THEN excluded.metadata_updated_at ELSE movies.metadata_updated_at END,
      ratings_updated_at = CASE WHEN excluded.tmdb_rating != movies.tmdb_rating OR excluded.tmdb_vote_count != movies.tmdb_vote_count THEN excluded.ratings_updated_at ELSE movies.ratings_updated_at END,
      updated_at = excluded.updated_at`,
    [
      movie.id,
      movie.imdbId,
      movie.title,
      movie.originalTitle,
      movie.title.toLowerCase(),
      movie.overview,
      movie.tagline,
      movie.releaseDate,
      movie.year,
      movie.runtime,
      movie.runtime,
      movie.status,
      movie.originalLanguage,
      movie.posterPath,
      movie.backdropPath,
      movie.popularity,
      movie.voteAverage,
      movie.voteCount,
      JSON.stringify(movie),
      dataHash,
      completeness,
      now,
      now,
      now,
      now,
      now,
    ],
  );

  await upsertSearchIndex(movie.id, movie.title, movie.originalTitle, movie.year, keywordsText);

  for (const field of fields) {
    await recordChange({
      tmdbId: movie.id,
      source: "tmdb",
      field: field.field,
      oldValue: field.old,
      newValue: field.new,
      detectedAt: now,
      syncJobId,
    });
  }

  await db.run(
    `INSERT INTO movie_source_records (tmdb_id, source, source_id, last_fetched_at, source_version, data_hash, status)
     VALUES (?, 'tmdb', ?, ?, ?, ?, 'CURRENT')
     ON CONFLICT(tmdb_id, source) DO UPDATE SET
       last_fetched_at = excluded.last_fetched_at,
       data_hash = excluded.data_hash,
       status = 'CURRENT'`,
    [movie.id, String(movie.id), now, movie.sourceVersion, dataHash],
  );

  if (!existing) return "inserted";
  return changed ? "updated" : "unchanged";
}

async function discoverIds(): Promise<number[]> {
  const pages = await Promise.all([
    getTrendingMovies("day", 1),
    getPopularMovies(1),
    getNowPlayingMovies(1),
    getUpcomingMovies(1),
  ]);
  const ids = new Set<number>();
  for (const page of pages) {
    page.results.forEach((movie) => ids.add(movie.id));
  }
  return [...ids];
}

export async function runTmdbSync(options: { discovery?: boolean; changes?: boolean } = {}): Promise<SyncJobResult> {
  const jobId = randomUUID();
  const source = "tmdb";
  const started = Date.now();
  if (!(await startSyncJob(jobId, source))) {
    return {
      id: jobId,
      source,
      status: "SKIPPED",
      recordsScanned: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      recordsUnchanged: 0,
      recordsFailed: 0,
      durationMs: 0,
      error: "Sync already running",
    };
  }

  const result: SyncJobResult = {
    id: jobId,
    source,
    status: "SUCCESS",
    recordsScanned: 0,
    recordsInserted: 0,
    recordsUpdated: 0,
    recordsUnchanged: 0,
    recordsFailed: 0,
    durationMs: 0,
  };

  try {
    const idSet = new Set<number>();
    if (options.changes ?? true) {
      const changed = await collectChangedMovieIds(1);
      changed.forEach((id) => idSet.add(id));
    }
    if (options.discovery ?? true) {
      const discovered = await discoverIds();
      discovered.forEach((id) => idSet.add(id));
    }

    for (const tmdbId of idSet) {
      result.recordsScanned += 1;
      try {
        const movie = await fetchTmdbMovieRaw(tmdbId);
        if (!movie) {
          result.recordsFailed += 1;
          continue;
        }
        const outcome = await upsertFromTmdb(movie, jobId);
        if (outcome === "inserted") result.recordsInserted += 1;
        else if (outcome === "updated") result.recordsUpdated += 1;
        else result.recordsUnchanged += 1;
      } catch {
        result.recordsFailed += 1;
      }
    }
  } catch (error) {
    result.status = "FAILED";
    result.error = error instanceof Error ? error.message : "TMDB sync failed";
  }

  result.durationMs = Date.now() - started;
  await finishSyncJob(result);
  return result;
}

export async function refreshMovieFromTmdb(tmdbId: number): Promise<"inserted" | "updated" | "unchanged" | "failed"> {
  const jobId = randomUUID();
  try {
    const movie = await fetchTmdbMovieRaw(tmdbId);
    if (!movie) return "failed";
    return await upsertFromTmdb(movie, jobId);
  } catch {
    return "failed";
  }
}
