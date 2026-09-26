CREATE TABLE IF NOT EXISTS feature_runs (
  id TEXT PRIMARY KEY,
  feature_slug TEXT NOT NULL,
  user_id TEXT,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL,
  error TEXT,
  latency_ms INTEGER,
  model_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_runs_slug ON feature_runs(feature_slug);
CREATE INDEX IF NOT EXISTS idx_feature_runs_created ON feature_runs(created_at DESC);

CREATE TABLE IF NOT EXISTS feature_errors (
  id TEXT PRIMARY KEY,
  feature_slug TEXT NOT NULL,
  user_id TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_errors_slug ON feature_errors(feature_slug);
