ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_visibility TEXT NOT NULL DEFAULT 'private';
ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_genres_json JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_languages_json JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_people_json JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS taste_learning_paused BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at);

CREATE TABLE IF NOT EXISTS oauth_accounts (
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_kind ON auth_tokens(user_id, kind);

ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS taste_learning_paused BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS profile_visibility TEXT NOT NULL DEFAULT 'private';

CREATE TABLE IF NOT EXISTS taste_signals (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signal_key TEXT NOT NULL,
  signal_value TEXT NOT NULL,
  weight DOUBLE PRECISION NOT NULL DEFAULT 1,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, signal_key, signal_value)
);

CREATE INDEX IF NOT EXISTS idx_taste_signals_user ON taste_signals(user_id);

ALTER TABLE movie_rooms ADD COLUMN IF NOT EXISTS share_code TEXT UNIQUE;
ALTER TABLE movie_rooms ADD COLUMN IF NOT EXISTS preferences_json JSONB NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS movie_room_participants (
  room_id UUID NOT NULL REFERENCES movie_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_name TEXT,
  preferences_json JSONB NOT NULL DEFAULT '{}',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS shared_watchlist_members (
  watchlist_id UUID NOT NULL REFERENCES shared_watchlists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (watchlist_id, user_id)
);

ALTER TABLE shared_watchlist_items ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE recommendation_events ADD COLUMN IF NOT EXISTS clicked BOOLEAN DEFAULT FALSE;
ALTER TABLE recommendation_events ADD COLUMN IF NOT EXISTS saved BOOLEAN DEFAULT FALSE;
ALTER TABLE recommendation_events ADD COLUMN IF NOT EXISTS watched BOOLEAN DEFAULT FALSE;
ALTER TABLE recommendation_events ADD COLUMN IF NOT EXISTS dismissed BOOLEAN DEFAULT FALSE;
ALTER TABLE recommendation_events ADD COLUMN IF NOT EXISTS explanation_json JSONB;
