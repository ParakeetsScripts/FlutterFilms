CREATE TABLE IF NOT EXISTS watchlist_activity (
  id UUID PRIMARY KEY,
  watchlist_id UUID NOT NULL REFERENCES shared_watchlists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  movie_id INTEGER,
  detail_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_watchlist_activity_list ON watchlist_activity(watchlist_id, created_at DESC);

CREATE TABLE IF NOT EXISTS room_candidates (
  room_id UUID NOT NULL REFERENCES movie_rooms(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (room_id, movie_id)
);

ALTER TABLE movie_rooms ADD COLUMN IF NOT EXISTS spoiler_level TEXT DEFAULT 'none';
ALTER TABLE movie_rooms ADD COLUMN IF NOT EXISTS locked_movie_id INTEGER;
ALTER TABLE movie_rooms ADD COLUMN IF NOT EXISTS voting_round INTEGER DEFAULT 1;
ALTER TABLE movie_rooms ADD COLUMN IF NOT EXISTS result_json JSONB;
