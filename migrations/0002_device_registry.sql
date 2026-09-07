CREATE TABLE IF NOT EXISTS user_devices (
  device_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_user_devices_user ON user_devices(user_id);

INSERT OR IGNORE INTO user_devices (device_hash, user_id, first_seen_at, last_seen_at)
SELECT device_hash, id, created_at, updated_at FROM users;
