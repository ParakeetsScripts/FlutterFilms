CREATE TABLE IF NOT EXISTS room_votes (
  room_id TEXT NOT NULL,
  voter_id TEXT NOT NULL,
  movie_id INTEGER NOT NULL,
  vote INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (room_id, voter_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_room_votes_room ON room_votes(room_id);

ALTER TABLE movie_rooms ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
