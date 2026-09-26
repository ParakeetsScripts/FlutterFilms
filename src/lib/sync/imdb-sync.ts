import "server-only";

import { gunzipSync } from "node:zlib";
import { getDatabase } from "@/lib/db/client";
import { recordChange, startSyncJob, finishSyncJob } from "./repository";
import type { SyncJobResult } from "./types";
import { randomUUID } from "node:crypto";

const IMDB_RATINGS_URL = "https://datasets.imdbws.com/title.ratings.tsv.gz";
const IMDB_BASICS_URL = "https://datasets.imdbws.com/title.basics.tsv.gz";

type RatingRow = { tconst: string; averageRating: number; numVotes: number };

async function downloadTsv(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`IMDb dataset unavailable: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return gunzipSync(buffer).toString("utf8");
}

function parseRatings(tsv: string): Map<string, RatingRow> {
  const map = new Map<string, RatingRow>();
  const lines = tsv.split("\n");
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) continue;
    const [tconst, averageRating, numVotes] = line.split("\t");
    if (!tconst || !averageRating) continue;
    map.set(tconst, {
      tconst,
      averageRating: Number(averageRating),
      numVotes: Number(numVotes),
    });
  }
  return map;
}

function parseBasicsRuntime(tsv: string, wanted: Set<string>): Map<string, number> {
  const map = new Map<string, number>();
  const lines = tsv.split("\n");
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) continue;
    const parts = line.split("\t");
    const tconst = parts[0];
    if (!tconst || !wanted.has(tconst)) continue;
    const runtime = parts[7];
    if (runtime && runtime !== "\\N") {
      map.set(tconst, Number(runtime));
    }
  }
  return map;
}

export async function runImdbSync(): Promise<SyncJobResult> {
  const jobId = randomUUID();
  const source = "imdb" as const;
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
    sourceVersion: new Date().toISOString().slice(0, 10),
  };

  try {
    const db = await getDatabase();
    const linked = await db.all<{
      tmdb_id: number;
      imdb_id: string;
      imdb_rating: number | null;
      imdb_vote_count: number | null;
      runtime: number | null;
    }>("SELECT tmdb_id, imdb_id, imdb_rating, imdb_vote_count, runtime FROM movies WHERE imdb_id IS NOT NULL");

    result.diagnostics = { catalogWithImdbIds: linked.length, ratingsMatched: 0, ratingsMissing: 0 };

    if (!linked.length) {
      result.durationMs = Date.now() - started;
      result.error =
        "IMDb sync completed with 0 catalog matches — no movies with imdb_id. Run TMDB sync first.";
      await finishSyncJob(result);
      return result;
    }

    const imdbIds = new Set(linked.map((row) => row.imdb_id));
    const ratingsTsv = await downloadTsv(IMDB_RATINGS_URL);
    const ratings = parseRatings(ratingsTsv);

    let basicsRuntimes = new Map<string, number>();
    if (process.env.IMDB_IMPORT_BASICS === "true") {
      const basicsTsv = await downloadTsv(IMDB_BASICS_URL);
      basicsRuntimes = parseBasicsRuntime(basicsTsv, imdbIds);
      result.diagnostics!.basicsImported = true;
    }

    const now = new Date().toISOString();
    for (const row of linked) {
      result.recordsScanned += 1;
      const ratingRow = ratings.get(row.imdb_id);
      if (!ratingRow) {
        result.recordsUnchanged += 1;
        result.diagnostics!.ratingsMissing = (result.diagnostics!.ratingsMissing ?? 0) + 1;
        continue;
      }
      result.diagnostics!.ratingsMatched = (result.diagnostics!.ratingsMatched ?? 0) + 1;

      const imdbRuntime = basicsRuntimes.get(row.imdb_id) ?? null;
      const ratingChanged =
        row.imdb_rating !== ratingRow.averageRating || row.imdb_vote_count !== ratingRow.numVotes;
      const runtimeChanged = imdbRuntime != null && row.runtime !== imdbRuntime;

      if (!ratingChanged && !runtimeChanged) {
        result.recordsUnchanged += 1;
        continue;
      }

      await db.run(
        `UPDATE movies SET
          imdb_rating = ?,
          imdb_vote_count = ?,
          runtime = COALESCE(?, runtime),
          ratings_updated_at = ?,
          metadata_updated_at = ?,
          updated_at = ?
         WHERE tmdb_id = ?`,
        [ratingRow.averageRating, ratingRow.numVotes, imdbRuntime, now, now, now, row.tmdb_id],
      );

      if (ratingChanged && row.imdb_rating != null) {
        await recordChange({
          tmdbId: row.tmdb_id,
          source: "imdb",
          field: "imdb_rating",
          oldValue: String(row.imdb_rating),
          newValue: String(ratingRow.averageRating),
          detectedAt: now,
          syncJobId: jobId,
        });
      }

      await db.run(
        `INSERT INTO movie_source_records (tmdb_id, source, source_id, last_fetched_at, source_version, status)
         VALUES (?, 'imdb', ?, ?, ?, 'CURRENT')
         ON CONFLICT(tmdb_id, source) DO UPDATE SET
           last_fetched_at = excluded.last_fetched_at,
           source_version = excluded.source_version,
           status = 'CURRENT'`,
        [row.tmdb_id, row.imdb_id, now, result.sourceVersion],
      );

      result.recordsUpdated += 1;
    }
  } catch (error) {
    result.status = "FAILED";
    result.error = error instanceof Error ? error.message : "IMDb sync failed";
  }

  result.durationMs = Date.now() - started;
  await finishSyncJob(result);
  return result;
}
