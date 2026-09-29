ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS storage_backend TEXT NOT NULL DEFAULT 'local';
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS s3_bucket TEXT;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS s3_source_key TEXT;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS cdn_url TEXT;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS drm_mode TEXT NOT NULL DEFAULT 'none';
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS aws_job_id TEXT;

ALTER TABLE media_upload_sessions ADD COLUMN IF NOT EXISTS storage_backend TEXT NOT NULL DEFAULT 'local';
ALTER TABLE media_upload_sessions ADD COLUMN IF NOT EXISTS s3_upload_id TEXT;
ALTER TABLE media_upload_sessions ADD COLUMN IF NOT EXISTS s3_key TEXT;

ALTER TABLE transcode_jobs ADD COLUMN IF NOT EXISTS aws_job_id TEXT;
ALTER TABLE transcode_jobs ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'ffmpeg';

CREATE TABLE IF NOT EXISTS live_channels (
  id TEXT PRIMARY KEY,
  tmdb_id INTEGER,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  ingest_endpoint TEXT NOT NULL,
  stream_key TEXT NOT NULL,
  rtmp_url TEXT NOT NULL,
  playback_url TEXT NOT NULL,
  ivs_channel_arn TEXT NOT NULL,
  drm_mode TEXT NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_live_channels_movie ON live_channels(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_live_channels_status ON live_channels(status);
