PRAGMA foreign_keys = ON;

ALTER TABLE users ADD COLUMN media_quota_bytes INTEGER NOT NULL DEFAULT 20971520;

CREATE TABLE IF NOT EXISTS media_assets (
  content_hash TEXT PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  byte_size INTEGER NOT NULL CHECK (byte_size > 0),
  width INTEGER NOT NULL CHECK (width > 0),
  height INTEGER NOT NULL CHECK (height > 0),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS media_owners (
  content_hash TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (content_hash, user_id),
  FOREIGN KEY (content_hash) REFERENCES media_assets(content_hash) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_media_owners_user ON media_owners(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS media_user_usage (
  user_id TEXT PRIMARY KEY,
  used_bytes INTEGER NOT NULL DEFAULT 0 CHECK (used_bytes >= 0),
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO media_user_usage (user_id, used_bytes, updated_at)
SELECT id, 0, updated_at FROM users;

CREATE TABLE IF NOT EXISTS media_global_usage (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  used_bytes INTEGER NOT NULL DEFAULT 0 CHECK (used_bytes >= 0),
  updated_at TEXT NOT NULL
);
INSERT OR IGNORE INTO media_global_usage (id, used_bytes, updated_at)
VALUES (1, 0, CURRENT_TIMESTAMP);

CREATE TRIGGER IF NOT EXISTS users_create_media_usage
AFTER INSERT ON users
BEGIN
  INSERT OR IGNORE INTO media_user_usage (user_id, used_bytes, updated_at)
  VALUES (NEW.id, 0, NEW.created_at);
END;

CREATE TRIGGER IF NOT EXISTS media_assets_increase_global_usage
AFTER INSERT ON media_assets
BEGIN
  UPDATE media_global_usage
     SET used_bytes = used_bytes + NEW.byte_size,
         updated_at = NEW.created_at
   WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS media_assets_decrease_global_usage
AFTER DELETE ON media_assets
BEGIN
  UPDATE media_global_usage
     SET used_bytes = MAX(0, used_bytes - OLD.byte_size),
         updated_at = CURRENT_TIMESTAMP
   WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS media_owners_increase_user_usage
AFTER INSERT ON media_owners
BEGIN
  INSERT OR IGNORE INTO media_user_usage (user_id, used_bytes, updated_at)
  VALUES (NEW.user_id, 0, NEW.created_at);
  UPDATE media_user_usage
     SET used_bytes = used_bytes + (
           SELECT byte_size FROM media_assets WHERE content_hash = NEW.content_hash
         ),
         updated_at = NEW.created_at
   WHERE user_id = NEW.user_id;
END;

CREATE TRIGGER IF NOT EXISTS media_owners_decrease_user_usage
AFTER DELETE ON media_owners
BEGIN
  UPDATE media_user_usage
     SET used_bytes = MAX(0, used_bytes - COALESCE(
           (SELECT byte_size FROM media_assets WHERE content_hash = OLD.content_hash), 0
         )),
         updated_at = CURRENT_TIMESTAMP
   WHERE user_id = OLD.user_id;
END;
