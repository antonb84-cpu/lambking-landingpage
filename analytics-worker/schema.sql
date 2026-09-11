CREATE TABLE IF NOT EXISTS daily_counts (
  day TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('pageview', 'amazon_click')),
  target_id TEXT NOT NULL DEFAULT '',
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  PRIMARY KEY (day, event_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_counts_event_day
  ON daily_counts (event_type, day);
