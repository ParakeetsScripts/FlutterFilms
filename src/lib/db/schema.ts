export const SCHEMA_VERSION = 9;

export const MIGRATIONS = `
CREATE TABLE IF NOT EXISTS schema_meta (
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS movies (
  tmdb_id INTEGER PRIMARY KEY,
  imdb_id TEXT,
  title TEXT NOT NULL,
  original_title TEXT,
  sort_title TEXT,
  overview TEXT,
  tagline TEXT,
  release_date TEXT,
  year INTEGER,
  runtime INTEGER,
  display_runtime INTEGER,
  status TEXT,
  original_language TEXT,
  spoken_languages_json TEXT,
  genres_json TEXT,
  countries_json TEXT,
  production_companies_json TEXT,
  budget INTEGER,
  revenue INTEGER,
  poster_path TEXT,
  backdrop_path TEXT,
  popularity REAL,
  tmdb_rating REAL,
  tmdb_vote_count INTEGER,
  imdb_rating REAL,
  imdb_vote_count INTEGER,
  payload_json TEXT NOT NULL,
  tmdb_data_hash TEXT,
  imdb_data_hash TEXT,
  metadata_completeness REAL,
  last_synced_at TEXT,
  metadata_updated_at TEXT,
  ratings_updated_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_movies_imdb ON movies(imdb_id);
CREATE INDEX IF NOT EXISTS idx_movies_updated ON movies(metadata_updated_at);
CREATE INDEX IF NOT EXISTS idx_movies_release ON movies(release_date);

CREATE TABLE IF NOT EXISTS movie_source_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tmdb_id INTEGER NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  last_fetched_at TEXT,
  last_modified_at TEXT,
  source_version TEXT,
  data_hash TEXT,
  status TEXT NOT NULL,
  raw_reference TEXT,
  UNIQUE(tmdb_id, source)
);

CREATE TABLE IF NOT EXISTS movie_changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tmdb_id INTEGER NOT NULL,
  source TEXT NOT NULL,
  field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  detected_at TEXT NOT NULL,
  sync_job_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_movie_changes_movie ON movie_changes(tmdb_id);

CREATE TABLE IF NOT EXISTS sync_jobs (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  records_scanned INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_unchanged INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error TEXT,
  source_version TEXT,
  duration_ms INTEGER
);

CREATE TABLE IF NOT EXISTS source_health (
  source TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  last_successful_sync TEXT,
  last_attempted_sync TEXT,
  records_processed INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  average_duration_ms INTEGER,
  source_version TEXT
);

CREATE TABLE IF NOT EXISTS sync_locks (
  source TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  locked_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS search_index (
  tmdb_id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  original_title TEXT,
  year INTEGER,
  sort_key TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_search_title ON search_index(sort_key);
`;

export const MIGRATIONS_V2 = `
CREATE TABLE IF NOT EXISTS ai_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  endpoint TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  local INTEGER NOT NULL DEFAULT 0,
  health_status TEXT NOT NULL DEFAULT 'unknown',
  last_checked TEXT,
  latency_ms INTEGER,
  error_rate REAL DEFAULT 0,
  request_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ai_models (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  name TEXT NOT NULL,
  api_model_id TEXT NOT NULL,
  description TEXT,
  local INTEGER NOT NULL DEFAULT 0,
  open_weight INTEGER NOT NULL DEFAULT 0,
  license TEXT,
  weight_class TEXT NOT NULL DEFAULT 'open',
  capabilities_json TEXT NOT NULL,
  context_window INTEGER,
  cost_type TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  health_status TEXT NOT NULL DEFAULT 'unknown',
  size_bytes INTEGER,
  loaded INTEGER,
  speed_tier TEXT,
  category TEXT NOT NULL,
  last_checked TEXT,
  request_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ai_endpoints (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  base_url TEXT NOT NULL,
  api_key_ref TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS model_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  local INTEGER NOT NULL DEFAULT 0,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  success INTEGER NOT NULL DEFAULT 1,
  cost_type TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_model_usage_created ON model_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_model_usage_model ON model_usage(model_id);

CREATE TABLE IF NOT EXISTS generation_jobs (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  provider_id TEXT,
  model_id TEXT,
  status TEXT NOT NULL,
  local INTEGER NOT NULL DEFAULT 0,
  input_json TEXT,
  output_json TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  finished_at TEXT
);
`;

export const MIGRATIONS_V3 = `
ALTER TABLE search_index ADD COLUMN keywords_text TEXT;
ALTER TABLE sync_jobs ADD COLUMN error_summary TEXT;
ALTER TABLE sync_jobs ADD COLUMN resume_cursor TEXT;
ALTER TABLE model_usage ADD COLUMN request_id TEXT;
ALTER TABLE generation_jobs ADD COLUMN user_id TEXT;
ALTER TABLE generation_jobs ADD COLUMN prompt TEXT;
ALTER TABLE generation_jobs ADD COLUMN progress INTEGER DEFAULT 0;
ALTER TABLE generation_jobs ADD COLUMN output_url TEXT;
ALTER TABLE generation_jobs ADD COLUMN credits_used INTEGER DEFAULT 0;
ALTER TABLE generation_jobs ADD COLUMN completed_at TEXT;

CREATE TABLE IF NOT EXISTS cache_entries (
  cache_key TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  device_id TEXT UNIQUE,
  display_name TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,
  settings_json TEXT NOT NULL,
  spoiler_level TEXT NOT NULL DEFAULT 'none',
  agent_mode INTEGER NOT NULL DEFAULT 1,
  private_mode INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_watchlist (
  user_id TEXT NOT NULL,
  movie_id INTEGER NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TEXT NOT NULL,
  PRIMARY KEY (user_id, movie_id)
);

CREATE TABLE IF NOT EXISTS user_favorites (
  user_id TEXT NOT NULL,
  movie_id INTEGER NOT NULL,
  added_at TEXT NOT NULL,
  PRIMARY KEY (user_id, movie_id)
);

CREATE TABLE IF NOT EXISTS user_history (
  user_id TEXT NOT NULL,
  movie_id INTEGER NOT NULL,
  viewed_at TEXT NOT NULL,
  PRIMARY KEY (user_id, movie_id)
);

CREATE TABLE IF NOT EXISTS user_continue_watching (
  user_id TEXT NOT NULL,
  movie_id INTEGER NOT NULL,
  position_seconds INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  kind TEXT NOT NULL DEFAULT 'movie',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, movie_id)
);

CREATE TABLE IF NOT EXISTS taste_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  dna_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agent_memories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_agent_memories_user ON agent_memories(user_id, category);

CREATE TABLE IF NOT EXISTS agent_activity (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  payload_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recommendation_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  movie_id INTEGER NOT NULL,
  reason TEXT,
  model_id TEXT,
  signals_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id TEXT PRIMARY KEY,
  event_id TEXT,
  user_id TEXT,
  movie_id INTEGER NOT NULL,
  feedback TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_interactions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  model_id TEXT,
  feature_slug TEXT,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  bio TEXT,
  public_taste INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS shared_watchlists (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shared_watchlist_items (
  watchlist_id TEXT NOT NULL,
  movie_id INTEGER NOT NULL,
  added_by TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TEXT NOT NULL,
  PRIMARY KEY (watchlist_id, movie_id)
);

CREATE TABLE IF NOT EXISTS movie_rooms (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_feature_registry (
  feature_id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export const MIGRATIONS_V4 = `
ALTER TABLE users ADD COLUMN email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN email_verified_at TEXT;
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN username TEXT UNIQUE;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN profile_visibility TEXT NOT NULL DEFAULT 'private';
ALTER TABLE users ADD COLUMN favorite_genres_json TEXT DEFAULT '[]';
ALTER TABLE users ADD COLUMN favorite_languages_json TEXT DEFAULT '[]';
ALTER TABLE users ADD COLUMN favorite_people_json TEXT DEFAULT '[]';
ALTER TABLE users ADD COLUMN taste_learning_paused INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT
);

CREATE TABLE IF NOT EXISTS oauth_accounts (
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  email TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS taste_signals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  signal_key TEXT NOT NULL,
  signal_value TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 1,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, signal_key, signal_value)
);

ALTER TABLE movie_rooms ADD COLUMN share_code TEXT UNIQUE;
ALTER TABLE movie_rooms ADD COLUMN preferences_json TEXT DEFAULT '{}';

CREATE TABLE IF NOT EXISTS movie_room_participants (
  room_id TEXT NOT NULL,
  user_id TEXT,
  guest_name TEXT,
  preferences_json TEXT NOT NULL DEFAULT '{}',
  joined_at TEXT NOT NULL,
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS shared_watchlist_members (
  watchlist_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  joined_at TEXT NOT NULL,
  PRIMARY KEY (watchlist_id, user_id)
);

ALTER TABLE recommendation_events ADD COLUMN clicked INTEGER DEFAULT 0;
ALTER TABLE recommendation_events ADD COLUMN saved INTEGER DEFAULT 0;
ALTER TABLE recommendation_events ADD COLUMN watched INTEGER DEFAULT 0;
ALTER TABLE recommendation_events ADD COLUMN dismissed INTEGER DEFAULT 0;
ALTER TABLE recommendation_events ADD COLUMN explanation_json TEXT;
`;

export const MIGRATIONS_V5 = `
CREATE TABLE IF NOT EXISTS feature_runs (
  id TEXT PRIMARY KEY,
  feature_slug TEXT NOT NULL,
  user_id TEXT,
  success INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  error TEXT,
  latency_ms INTEGER,
  model_used TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feature_runs_slug ON feature_runs(feature_slug);
CREATE INDEX IF NOT EXISTS idx_feature_runs_created ON feature_runs(created_at DESC);

CREATE TABLE IF NOT EXISTS feature_errors (
  id TEXT PRIMARY KEY,
  feature_slug TEXT NOT NULL,
  user_id TEXT,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feature_errors_slug ON feature_errors(feature_slug);
`;

export const MIGRATIONS_V6 = `
CREATE TABLE IF NOT EXISTS room_votes (
  room_id TEXT NOT NULL,
  voter_id TEXT NOT NULL,
  movie_id INTEGER NOT NULL,
  vote INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  PRIMARY KEY (room_id, voter_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_room_votes_room ON room_votes(room_id);

ALTER TABLE movie_rooms ADD COLUMN expires_at TEXT;
`;

export const MIGRATIONS_V7 = `
CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  path TEXT,
  properties_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);

CREATE TABLE IF NOT EXISTS analytics_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  started_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  user_agent TEXT,
  referrer TEXT
);
`;

export const MIGRATIONS_V8 = `
CREATE TABLE IF NOT EXISTS watchlist_activity (
  id TEXT PRIMARY KEY,
  watchlist_id TEXT NOT NULL,
  user_id TEXT,
  action TEXT NOT NULL,
  movie_id INTEGER,
  detail_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_watchlist_activity_list ON watchlist_activity(watchlist_id, created_at DESC);

CREATE TABLE IF NOT EXISTS room_candidates (
  room_id TEXT NOT NULL,
  movie_id INTEGER NOT NULL,
  added_by TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  PRIMARY KEY (room_id, movie_id)
);

ALTER TABLE movie_rooms ADD COLUMN spoiler_level TEXT DEFAULT 'none';
ALTER TABLE movie_rooms ADD COLUMN locked_movie_id INTEGER;
ALTER TABLE movie_rooms ADD COLUMN voting_round INTEGER DEFAULT 1;
ALTER TABLE movie_rooms ADD COLUMN result_json TEXT;
`;

export const MIGRATIONS_V9 = `
CREATE TABLE IF NOT EXISTS product_errors_log (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  route TEXT,
  feature TEXT,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_errors_created ON product_errors_log(created_at DESC);

CREATE TABLE IF NOT EXISTS user_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_feedback_created ON user_feedback(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
`;
