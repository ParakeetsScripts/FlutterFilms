CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  tmdb_id INTEGER NOT NULL,
  title TEXT,
  status TEXT NOT NULL,
  source_filename TEXT,
  storage_path TEXT NOT NULL,
  manifest_relpath TEXT,
  playback_type TEXT NOT NULL DEFAULT 'hls',
  duration_seconds INTEGER,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_media_assets_movie ON media_assets(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_status ON media_assets(status);

CREATE TABLE IF NOT EXISTS media_upload_sessions (
  id TEXT PRIMARY KEY,
  tmdb_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  total_bytes INTEGER NOT NULL,
  chunk_size INTEGER NOT NULL,
  total_chunks INTEGER NOT NULL,
  received_chunks INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  temp_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_media_upload_sessions_status ON media_upload_sessions(status);

CREATE TABLE IF NOT EXISTS transcode_jobs (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_transcode_jobs_asset ON transcode_jobs(asset_id);
CREATE INDEX IF NOT EXISTS idx_transcode_jobs_status ON transcode_jobs(status);
