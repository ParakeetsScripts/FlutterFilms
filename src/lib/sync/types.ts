import type { Movie } from "@/lib/tmdb/types";
import type { SourceFieldStatus, SourceName } from "./field-priority";

export type MovieSourceRecord = {
  source: SourceName;
  sourceId: string;
  lastFetchedAt: string | null;
  lastModifiedAt: string | null;
  sourceVersion: string | null;
  dataHash: string | null;
  status: SourceFieldStatus;
  rawReference: string | null;
};

export type MetadataChange = {
  tmdbId: number;
  source: SourceName;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  detectedAt: string;
  syncJobId: string;
};

export type SyncJobStatus = "RUNNING" | "SUCCESS" | "FAILED" | "SKIPPED";

export type SyncJobResult = {
  id: string;
  source: SourceName | "providers";
  status: SyncJobStatus;
  recordsScanned: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsUnchanged: number;
  recordsFailed: number;
  error?: string;
  sourceVersion?: string;
  durationMs: number;
};

export type SourceHealthStatus = "HEALTHY" | "DEGRADED" | "FAILED" | "STALE";

export type SourceHealth = {
  source: string;
  status: SourceHealthStatus;
  lastSuccessfulSync: string | null;
  lastAttemptedSync: string | null;
  recordsProcessed: number;
  recordsUpdated: number;
  errorCount: number;
  averageDurationMs: number | null;
  sourceVersion: string | null;
};

export type CatalogMovie = Movie & {
  imdbRating: number | null;
  imdbVoteCount: number | null;
  tmdbRating: number | null;
  tmdbVoteCount: number | null;
  lastSyncedAt: string | null;
  metadataUpdatedAt: string | null;
  ratingsUpdatedAt: string | null;
  metadataCompleteness: number | null;
  sourceRecords: MovieSourceRecord[];
  runtimeConflict?: { tmdb: number | null; imdb: number | null; selected: number | null };
};

export type StoredMovieRow = {
  tmdb_id: number;
  imdb_id: string | null;
  title: string;
  original_title: string | null;
  overview: string | null;
  tagline: string | null;
  release_date: string | null;
  year: number | null;
  runtime: number | null;
  display_runtime: number | null;
  original_language: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  popularity: number | null;
  tmdb_rating: number | null;
  tmdb_vote_count: number | null;
  imdb_rating: number | null;
  imdb_vote_count: number | null;
  payload_json: string;
  metadata_completeness: number | null;
  last_synced_at: string | null;
  metadata_updated_at: string | null;
  ratings_updated_at: string | null;
  updated_at: string;
};
