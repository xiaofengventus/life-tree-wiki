PRAGMA foreign_keys = ON;

ALTER TABLE posts ADD COLUMN cover_media_hash TEXT
  REFERENCES media_assets(content_hash) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_posts_cover_media_hash
  ON posts(cover_media_hash);
