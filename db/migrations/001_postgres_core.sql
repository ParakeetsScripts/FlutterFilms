CREATE TABLE IF NOT EXISTS schema_meta (
  version INTEGER NOT NULL
);

INSERT INTO schema_meta (version) SELECT 3 WHERE NOT EXISTS (SELECT 1 FROM schema_meta);

CREATE TABLE IF NOT EXISTS movies (
  tmdb_id INTEGER PRIMARY KEY,
  imdb_id TEXT,
  title TEXT NOT NULL,
  original_title TEXT,
  sort_title TEXT,
  overview TEXT,
  tagline TEXT,
  release_date DATE,
  year INTEGER,
  runtime INTEGER,
  display_runtime INTEGER,
  status TEXT,
  original_language TEXT,
  spoken_languages_json JSONB,
  genres_json JSONB,
  countries_json JSONB,
  production_companies_json JSONB,
  budget BIGINT,
  revenue BIGINT,
  poster_path TEXT,
  backdrop_path TEXT,
  popularity DOUBLE PRECISION,
  tmdb_rating DOUBLE PRECISION,
  tmdb_vote_count INTEGER,
  imdb_rating DOUBLE PRECISION,
  imdb_vote_count INTEGER,
  payload_json JSONB NOT NULL,
  tmdb_data_hash TEXT,
  imdb_data_hash TEXT,
  metadata_completeness DOUBLE PRECISION,
  last_synced_at TIMESTAMPTZ,
  metadata_updated_at TIMESTAMPTZ,
  ratings_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(original_title, '') || ' ' || coalesce(overview, ''))
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_movies_imdb ON movies(imdb_id);
CREATE INDEX IF NOT EXISTS idx_movies_updated ON movies(metadata_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_movies_release ON movies(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_movies_popularity ON movies(popularity DESC);
CREATE INDEX IF NOT EXISTS idx_movies_tmdb_rating ON movies(tmdb_rating DESC);
CREATE INDEX IF NOT EXISTS idx_movies_year ON movies(year);
CREATE INDEX IF NOT EXISTS idx_movies_language ON movies(original_language);
CREATE INDEX IF NOT EXISTS idx_movies_search ON movies USING GIN (search_vector);

CREATE TABLE IF NOT EXISTS movie_source_records (
  id BIGSERIAL PRIMARY KEY,
  tmdb_id INTEGER NOT NULL REFERENCES movies(tmdb_id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  last_fetched_at TIMESTAMPTZ,
  last_modified_at TIMESTAMPTZ,
  source_version TEXT,
  data_hash TEXT,
  status TEXT NOT NULL,
  raw_reference TEXT,
  UNIQUE(tmdb_id, source)
);

CREATE TABLE IF NOT EXISTS movie_changes (
  id BIGSERIAL PRIMARY KEY,
  tmdb_id INTEGER NOT NULL REFERENCES movies(tmdb_id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sync_job_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_movie_changes_movie ON movie_changes(tmdb_id, detected_at DESC);

CREATE TABLE IF NOT EXISTS sync_jobs (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  records_scanned INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_unchanged INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error TEXT,
  error_summary TEXT,
  source_version TEXT,
  duration_ms INTEGER,
  resume_cursor TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_started ON sync_jobs(started_at DESC);

CREATE TABLE IF NOT EXISTS source_health (
  source TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  last_successful_sync TIMESTAMPTZ,
  last_attempted_sync TIMESTAMPTZ,
  records_processed INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  average_duration_ms INTEGER,
  source_version TEXT
);

CREATE TABLE IF NOT EXISTS sync_locks (
  source TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS search_index (
  tmdb_id INTEGER PRIMARY KEY REFERENCES movies(tmdb_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_title TEXT,
  year INTEGER,
  sort_key TEXT NOT NULL,
  keywords_text TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(original_title, '') || ' ' || coalesce(keywords_text, ''))
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_search_title ON search_index(sort_key);
CREATE INDEX IF NOT EXISTS idx_search_vector ON search_index USING GIN (search_vector);
