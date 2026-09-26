CREATE TABLE IF NOT EXISTS ai_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  endpoint TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  local BOOLEAN NOT NULL DEFAULT FALSE,
  health_status TEXT NOT NULL DEFAULT 'unknown',
  last_checked TIMESTAMPTZ,
  latency_ms INTEGER,
  error_rate DOUBLE PRECISION DEFAULT 0,
  request_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ai_models (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  api_model_id TEXT NOT NULL,
  description TEXT,
  local BOOLEAN NOT NULL DEFAULT FALSE,
  open_weight BOOLEAN NOT NULL DEFAULT FALSE,
  license TEXT,
  weight_class TEXT NOT NULL DEFAULT 'open',
  capabilities_json JSONB NOT NULL,
  context_window INTEGER,
  cost_type TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  health_status TEXT NOT NULL DEFAULT 'unknown',
  size_bytes BIGINT,
  loaded BOOLEAN,
  speed_tier TEXT,
  category TEXT NOT NULL,
  last_checked TIMESTAMPTZ,
  request_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ai_endpoints (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
  base_url TEXT NOT NULL,
  api_key_ref TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_usage (
  id BIGSERIAL PRIMARY KEY,
  model_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  local BOOLEAN NOT NULL DEFAULT FALSE,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  cost_type TEXT NOT NULL,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_model_usage_created ON model_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_model_usage_model ON model_usage(model_id);

CREATE TABLE IF NOT EXISTS generation_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  kind TEXT NOT NULL,
  provider_id TEXT,
  model_id TEXT,
  status TEXT NOT NULL,
  local BOOLEAN NOT NULL DEFAULT FALSE,
  prompt TEXT,
  input_json JSONB,
  output_json JSONB,
  output_url TEXT,
  progress INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status, created_at DESC);

CREATE TABLE IF NOT EXISTS cache_entries (
  cache_key TEXT PRIMARY KEY,
  payload_json JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache_entries(expires_at);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  device_id TEXT UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  settings_json JSONB NOT NULL DEFAULT '{}',
  spoiler_level TEXT NOT NULL DEFAULT 'none',
  agent_mode BOOLEAN NOT NULL DEFAULT TRUE,
  private_mode BOOLEAN NOT NULL DEFAULT FALSE,
  memory_categories_json JSONB NOT NULL DEFAULT '{"preferences":true,"facts":true,"dislikes":true,"watching_habits":true,"temporary_context":true,"project_context":true}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_watchlist (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL REFERENCES movies(tmdb_id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, movie_id)
);

CREATE TABLE IF NOT EXISTS user_favorites (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL REFERENCES movies(tmdb_id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, movie_id)
);

CREATE TABLE IF NOT EXISTS user_history (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL REFERENCES movies(tmdb_id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_user_history_viewed ON user_history(user_id, viewed_at DESC);

CREATE TABLE IF NOT EXISTS user_continue_watching (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL REFERENCES movies(tmdb_id) ON DELETE CASCADE,
  position_seconds INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  kind TEXT NOT NULL DEFAULT 'movie',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, movie_id)
);

CREATE TABLE IF NOT EXISTS taste_snapshots (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dna_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_memories (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_memories_user ON agent_memories(user_id, category) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS agent_activity (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  payload_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_activity_user ON agent_activity(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS recommendation_events (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  movie_id INTEGER NOT NULL REFERENCES movies(tmdb_id) ON DELETE CASCADE,
  reason TEXT,
  model_id TEXT,
  signals_json JSONB,
  clicked BOOLEAN DEFAULT FALSE,
  saved BOOLEAN DEFAULT FALSE,
  watched BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES recommendation_events(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL REFERENCES movies(tmdb_id) ON DELETE CASCADE,
  feedback TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  model_id TEXT,
  feature_slug TEXT,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  public_taste BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS shared_watchlists (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shared_watchlist_items (
  watchlist_id UUID NOT NULL REFERENCES shared_watchlists(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL REFERENCES movies(tmdb_id) ON DELETE CASCADE,
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (watchlist_id, movie_id)
);

CREATE TABLE IF NOT EXISTS movie_rooms (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_feature_registry (
  feature_id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
