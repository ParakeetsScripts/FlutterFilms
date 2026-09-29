import "server-only";

import { boolParam, getDatabase, isPostgres } from "@/lib/db/client";
import type {
  DrmMode,
  MediaAsset,
  StorageBackend,
  TranscodeJob,
  TranscodeProvider,
  UploadSession,
} from "./types";

function mapAsset(row: Record<string, unknown>): MediaAsset {
  return {
    id: String(row.id),
    tmdbId: Number(row.tmdb_id),
    title: row.title ? String(row.title) : null,
    status: String(row.status) as MediaAsset["status"],
    sourceFilename: row.source_filename ? String(row.source_filename) : null,
    storagePath: String(row.storage_path),
    manifestRelpath: row.manifest_relpath ? String(row.manifest_relpath) : null,
    playbackType: String(row.playback_type) as MediaAsset["playbackType"],
    durationSeconds: row.duration_seconds == null ? null : Number(row.duration_seconds),
    published: isPostgres() ? Boolean(row.published) : Number(row.published) === 1,
    storageBackend: (row.storage_backend ? String(row.storage_backend) : "local") as StorageBackend,
    s3Bucket: row.s3_bucket ? String(row.s3_bucket) : null,
    s3SourceKey: row.s3_source_key ? String(row.s3_source_key) : null,
    cdnUrl: row.cdn_url ? String(row.cdn_url) : null,
    drmMode: (row.drm_mode ? String(row.drm_mode) : "none") as DrmMode,
    awsJobId: row.aws_job_id ? String(row.aws_job_id) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapUpload(row: Record<string, unknown>): UploadSession {
  return {
    id: String(row.id),
    tmdbId: Number(row.tmdb_id),
    filename: String(row.filename),
    totalBytes: Number(row.total_bytes),
    chunkSize: Number(row.chunk_size),
    totalChunks: Number(row.total_chunks),
    receivedChunks: Number(row.received_chunks),
    status: String(row.status) as UploadSession["status"],
    tempPath: String(row.temp_path),
    storageBackend: (row.storage_backend ? String(row.storage_backend) : "local") as StorageBackend,
    s3UploadId: row.s3_upload_id ? String(row.s3_upload_id) : null,
    s3Key: row.s3_key ? String(row.s3_key) : null,
    createdAt: String(row.created_at),
    expiresAt: String(row.expires_at),
  };
}

function mapJob(row: Record<string, unknown>): TranscodeJob {
  return {
    id: String(row.id),
    assetId: String(row.asset_id),
    status: String(row.status) as TranscodeJob["status"],
    progress: Number(row.progress ?? 0),
    error: row.error ? String(row.error) : null,
    provider: (row.provider ? String(row.provider) : "ffmpeg") as TranscodeProvider,
    awsJobId: row.aws_job_id ? String(row.aws_job_id) : null,
    createdAt: String(row.created_at),
    startedAt: row.started_at ? String(row.started_at) : null,
    finishedAt: row.finished_at ? String(row.finished_at) : null,
  };
}

export async function createUploadSession(input: {
  id: string;
  tmdbId: number;
  filename: string;
  totalBytes: number;
  chunkSize: number;
  totalChunks: number;
  tempPath: string;
  expiresAt: string;
  storageBackend?: StorageBackend;
  s3UploadId?: string;
  s3Key?: string;
}): Promise<UploadSession> {
  const now = new Date().toISOString();
  const db = await getDatabase();
  await db.run(
    `INSERT INTO media_upload_sessions
      (id, tmdb_id, filename, total_bytes, chunk_size, total_chunks, received_chunks, status, temp_path, storage_backend, s3_upload_id, s3_key, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, 'open', ?, ?, ?, ?, ?, ?)`,
    [
      input.id,
      input.tmdbId,
      input.filename,
      input.totalBytes,
      input.chunkSize,
      input.totalChunks,
      input.tempPath,
      input.storageBackend ?? "local",
      input.s3UploadId ?? null,
      input.s3Key ?? null,
      now,
      input.expiresAt,
    ],
  );
  const row = await db.get("SELECT * FROM media_upload_sessions WHERE id = ?", [input.id]);
  return mapUpload(row!);
}

export async function getUploadSession(id: string): Promise<UploadSession | null> {
  const db = await getDatabase();
  const row = await db.get("SELECT * FROM media_upload_sessions WHERE id = ?", [id]);
  return row ? mapUpload(row) : null;
}

export async function markUploadChunkReceived(id: string, receivedChunks: number): Promise<void> {
  const db = await getDatabase();
  await db.run("UPDATE media_upload_sessions SET received_chunks = ? WHERE id = ?", [receivedChunks, id]);
}

export async function completeUploadSession(id: string): Promise<void> {
  const db = await getDatabase();
  await db.run("UPDATE media_upload_sessions SET status = 'completed' WHERE id = ?", [id]);
}

export async function createMediaAsset(input: {
  id: string;
  tmdbId: number;
  title?: string;
  sourceFilename: string;
  storagePath: string;
  status: MediaAsset["status"];
  playbackType?: MediaAsset["playbackType"];
  storageBackend?: StorageBackend;
  s3Bucket?: string;
  s3SourceKey?: string;
  cdnUrl?: string;
  drmMode?: DrmMode;
}): Promise<MediaAsset> {
  const now = new Date().toISOString();
  const db = await getDatabase();
  await db.run(
    `INSERT INTO media_assets
      (id, tmdb_id, title, status, source_filename, storage_path, manifest_relpath, playback_type, duration_seconds, published, storage_backend, s3_bucket, s3_source_key, cdn_url, drm_mode, aws_job_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL, ?, NULL, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
    [
      input.id,
      input.tmdbId,
      input.title ?? null,
      input.status,
      input.sourceFilename,
      input.storagePath,
      input.playbackType ?? "hls",
      boolParam(false),
      input.storageBackend ?? "local",
      input.s3Bucket ?? null,
      input.s3SourceKey ?? null,
      input.cdnUrl ?? null,
      input.drmMode ?? "none",
      now,
      now,
    ],
  );
  const row = await db.get("SELECT * FROM media_assets WHERE id = ?", [input.id]);
  return mapAsset(row!);
}

export async function updateMediaAsset(
  id: string,
  patch: Partial<
    Pick<
      MediaAsset,
      | "status"
      | "manifestRelpath"
      | "playbackType"
      | "durationSeconds"
      | "published"
      | "cdnUrl"
      | "awsJobId"
      | "drmMode"
    >
  >,
): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  if (patch.status) {
    fields.push("status = ?");
    values.push(patch.status);
  }
  if (patch.manifestRelpath !== undefined) {
    fields.push("manifest_relpath = ?");
    values.push(patch.manifestRelpath);
  }
  if (patch.playbackType) {
    fields.push("playback_type = ?");
    values.push(patch.playbackType);
  }
  if (patch.durationSeconds !== undefined) {
    fields.push("duration_seconds = ?");
    values.push(patch.durationSeconds);
  }
  if (patch.published !== undefined) {
    fields.push("published = ?");
    values.push(boolParam(patch.published));
  }
  if (patch.cdnUrl !== undefined) {
    fields.push("cdn_url = ?");
    values.push(patch.cdnUrl);
  }
  if (patch.awsJobId !== undefined) {
    fields.push("aws_job_id = ?");
    values.push(patch.awsJobId);
  }
  if (patch.drmMode !== undefined) {
    fields.push("drm_mode = ?");
    values.push(patch.drmMode);
  }
  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);
  const db = await getDatabase();
  await db.run(`UPDATE media_assets SET ${fields.join(", ")} WHERE id = ?`, values);
}

export async function getMediaAsset(id: string): Promise<MediaAsset | null> {
  const db = await getDatabase();
  const row = await db.get("SELECT * FROM media_assets WHERE id = ?", [id]);
  return row ? mapAsset(row) : null;
}

export async function getPublishedAssetForMovie(tmdbId: number): Promise<MediaAsset | null> {
  const db = await getDatabase();
  const published = isPostgres() ? "TRUE" : "1";
  const row = await db.get(
    `SELECT * FROM media_assets
     WHERE tmdb_id = ? AND status = 'ready' AND published = ${published}
     ORDER BY updated_at DESC LIMIT 1`,
    [tmdbId],
  );
  return row ? mapAsset(row) : null;
}

export async function listMediaAssets(limit = 50): Promise<MediaAsset[]> {
  const db = await getDatabase();
  const rows = await db.all("SELECT * FROM media_assets ORDER BY updated_at DESC LIMIT ?", [limit]);
  return rows.map(mapAsset);
}

export async function createTranscodeJob(
  id: string,
  assetId: string,
  provider: TranscodeProvider = "ffmpeg",
  awsJobId?: string,
): Promise<TranscodeJob> {
  const now = new Date().toISOString();
  const db = await getDatabase();
  await db.run(
    `INSERT INTO transcode_jobs (id, asset_id, status, progress, error, provider, aws_job_id, created_at, started_at, finished_at)
     VALUES (?, ?, 'queued', 0, NULL, ?, ?, ?, NULL, NULL)`,
    [id, assetId, provider, awsJobId ?? null, now],
  );
  const row = await db.get("SELECT * FROM transcode_jobs WHERE id = ?", [id]);
  return mapJob(row!);
}

export async function listQueuedTranscodeJobs(limit = 5): Promise<TranscodeJob[]> {
  const db = await getDatabase();
  const rows = await db.all(
    "SELECT * FROM transcode_jobs WHERE status IN ('queued', 'processing') ORDER BY created_at ASC LIMIT ?",
    [limit],
  );
  return rows.map(mapJob);
}

export async function listTranscodeJobs(limit = 20): Promise<TranscodeJob[]> {
  const db = await getDatabase();
  const rows = await db.all("SELECT * FROM transcode_jobs ORDER BY created_at DESC LIMIT ?", [limit]);
  return rows.map(mapJob);
}

export async function updateTranscodeJob(
  id: string,
  patch: Partial<
    Pick<TranscodeJob, "status" | "progress" | "error" | "startedAt" | "finishedAt" | "awsJobId" | "provider">
  >,
): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  if (patch.status) {
    fields.push("status = ?");
    values.push(patch.status);
  }
  if (patch.progress !== undefined) {
    fields.push("progress = ?");
    values.push(patch.progress);
  }
  if (patch.error !== undefined) {
    fields.push("error = ?");
    values.push(patch.error);
  }
  if (patch.startedAt !== undefined) {
    fields.push("started_at = ?");
    values.push(patch.startedAt);
  }
  if (patch.finishedAt !== undefined) {
    fields.push("finished_at = ?");
    values.push(patch.finishedAt);
  }
  if (patch.awsJobId !== undefined) {
    fields.push("aws_job_id = ?");
    values.push(patch.awsJobId);
  }
  if (patch.provider) {
    fields.push("provider = ?");
    values.push(patch.provider);
  }
  values.push(id);
  const db = await getDatabase();
  await db.run(`UPDATE transcode_jobs SET ${fields.join(", ")} WHERE id = ?`, values);
}
