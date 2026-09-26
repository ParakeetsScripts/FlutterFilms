import "server-only";

import { getDatabase, isPostgres } from "@/lib/db/client";
import type { MetadataChange, SourceHealth, StoredMovieRow, SyncJobResult } from "./types";

export async function getMovieRow(tmdbId: number): Promise<StoredMovieRow | null> {
  const db = await getDatabase();
  return db.get<StoredMovieRow>("SELECT * FROM movies WHERE tmdb_id = ?", [tmdbId]);
}

export async function listRecentlyUpdated(limit = 24, cursor?: string): Promise<StoredMovieRow[]> {
  const db = await getDatabase();
  if (cursor) {
    return db.all<StoredMovieRow>(
      "SELECT * FROM movies WHERE metadata_updated_at < ? ORDER BY metadata_updated_at DESC LIMIT ?",
      [cursor, limit],
    );
  }
  return db.all<StoredMovieRow>("SELECT * FROM movies ORDER BY metadata_updated_at DESC LIMIT ?", [limit]);
}

export async function listRecentlyAdded(limit = 24, cursor?: string): Promise<StoredMovieRow[]> {
  const db = await getDatabase();
  if (cursor) {
    return db.all<StoredMovieRow>(
      "SELECT * FROM movies WHERE created_at < ? ORDER BY created_at DESC LIMIT ?",
      [cursor, limit],
    );
  }
  return db.all<StoredMovieRow>("SELECT * FROM movies ORDER BY created_at DESC LIMIT ?", [limit]);
}

export async function searchIndex(query: string, limit = 20, offset = 0): Promise<StoredMovieRow[]> {
  const db = await getDatabase();
  const key = query.toLowerCase().trim();

  if (isPostgres() && key.length > 1) {
    const ids = await db.all<{ tmdb_id: number }>(
      `SELECT tmdb_id FROM search_index
       WHERE search_vector @@ plainto_tsquery('english', ?)
       ORDER BY ts_rank(search_vector, plainto_tsquery('english', ?)) DESC
       LIMIT ? OFFSET ?`,
      [key, key, limit, offset],
    );
    const rows = await Promise.all(ids.map((row) => getMovieRow(row.tmdb_id)));
    return rows.filter((row): row is StoredMovieRow => row !== null);
  }

  const ids = await db.all<{ tmdb_id: number }>(
    `SELECT tmdb_id FROM search_index
     WHERE sort_key LIKE ? OR title LIKE ? OR original_title LIKE ?
     ORDER BY sort_key LIMIT ? OFFSET ?`,
    [`%${key}%`, `%${key}%`, `%${key}%`, limit, offset],
  );
  const rows = await Promise.all(ids.map((row) => getMovieRow(row.tmdb_id)));
  return rows.filter((row): row is StoredMovieRow => row !== null);
}

export async function recordChange(change: MetadataChange) {
  const db = await getDatabase();
  await db.run(
    `INSERT INTO movie_changes (tmdb_id, source, field, old_value, new_value, detected_at, sync_job_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      change.tmdbId,
      change.source,
      change.field,
      change.oldValue,
      change.newValue,
      change.detectedAt,
      change.syncJobId,
    ],
  );
}

export async function upsertSearchIndex(
  tmdbId: number,
  title: string,
  originalTitle: string | null,
  year: number | null,
  keywordsText = "",
) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.run(
    `INSERT INTO search_index (tmdb_id, title, original_title, year, sort_key, keywords_text, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(tmdb_id) DO UPDATE SET
       title = excluded.title,
       original_title = excluded.original_title,
       year = excluded.year,
       sort_key = excluded.sort_key,
       keywords_text = excluded.keywords_text,
       updated_at = excluded.updated_at`,
    [tmdbId, title, originalTitle, year, title.toLowerCase(), keywordsText, now],
  );
}

export async function startSyncJob(id: string, source: string): Promise<boolean> {
  const db = await getDatabase();
  const lock = await db.get<{ job_id: string }>("SELECT job_id FROM sync_locks WHERE source = ?", [source]);
  if (lock) return false;
  const now = new Date().toISOString();
  await db.run("INSERT INTO sync_locks (source, job_id, locked_at) VALUES (?, ?, ?)", [source, id, now]);
  await db.run("INSERT INTO sync_jobs (id, source, status, started_at) VALUES (?, ?, 'RUNNING', ?)", [id, source, now]);
  return true;
}

export async function finishSyncJob(result: SyncJobResult) {
  const db = await getDatabase();
  const finished = new Date().toISOString();
  await db.run(
    `UPDATE sync_jobs SET
      status = ?, finished_at = ?, records_scanned = ?, records_inserted = ?,
      records_updated = ?, records_unchanged = ?, records_failed = ?,
      error = ?, error_summary = ?, source_version = ?, duration_ms = ?
     WHERE id = ?`,
    [
      result.status,
      finished,
      result.recordsScanned,
      result.recordsInserted,
      result.recordsUpdated,
      result.recordsUnchanged,
      result.recordsFailed,
      result.error ?? null,
      result.error ?? null,
      result.sourceVersion ?? null,
      result.durationMs,
      result.id,
    ],
  );
  await db.run("DELETE FROM sync_locks WHERE source = ?", [result.source]);
  await updateSourceHealth(result);
}

export async function updateSourceHealth(result: SyncJobResult) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const status = result.status === "SUCCESS" ? "HEALTHY" : result.status === "FAILED" ? "FAILED" : "DEGRADED";
  await db.run(
    `INSERT INTO source_health (source, status, last_successful_sync, last_attempted_sync, records_processed, records_updated, error_count, source_version)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(source) DO UPDATE SET
       status = excluded.status,
       last_successful_sync = CASE WHEN excluded.status = 'HEALTHY' THEN excluded.last_attempted_sync ELSE source_health.last_successful_sync END,
       last_attempted_sync = excluded.last_attempted_sync,
       records_processed = excluded.records_processed,
       records_updated = excluded.records_updated,
       error_count = CASE WHEN excluded.status = 'FAILED' THEN source_health.error_count + 1 ELSE source_health.error_count END,
       source_version = excluded.source_version`,
    [
      result.source,
      status,
      result.status === "SUCCESS" ? now : null,
      now,
      result.recordsScanned,
      result.recordsUpdated,
      result.status === "FAILED" ? 1 : 0,
      result.sourceVersion ?? null,
    ],
  );
}

function mapSourceHealth(row: Record<string, unknown>): SourceHealth {
  return {
    source: String(row.source),
    status: row.status as SourceHealth["status"],
    lastSuccessfulSync: (row.last_successful_sync as string | null) ?? null,
    lastAttemptedSync: (row.last_attempted_sync as string | null) ?? null,
    recordsProcessed: Number(row.records_processed ?? 0),
    recordsUpdated: Number(row.records_updated ?? 0),
    errorCount: Number(row.error_count ?? 0),
    averageDurationMs: row.average_duration_ms != null ? Number(row.average_duration_ms) : null,
    sourceVersion: (row.source_version as string | null) ?? null,
  };
}

export async function getSourceHealth(): Promise<SourceHealth[]> {
  const db = await getDatabase();
  const rows = await db.all<Record<string, unknown>>("SELECT * FROM source_health");
  return rows.map(mapSourceHealth);
}

export async function getRecentSyncJobs(limit = 10) {
  const db = await getDatabase();
  return db.all("SELECT * FROM sync_jobs ORDER BY started_at DESC LIMIT ?", [limit]);
}

export async function getMovieChanges(tmdbId: number, limit = 20) {
  const db = await getDatabase();
  return db.all("SELECT * FROM movie_changes WHERE tmdb_id = ? ORDER BY detected_at DESC LIMIT ?", [tmdbId, limit]);
}

export async function countMovies(): Promise<number> {
  const db = await getDatabase();
  const row = await db.get<{ count: number }>("SELECT COUNT(*) as count FROM movies");
  return Number(row?.count ?? 0);
}
