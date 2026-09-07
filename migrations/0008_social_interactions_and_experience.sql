PRAGMA foreign_keys = ON;

ALTER TABLE users ADD COLUMN avatar_media_hash TEXT
  REFERENCES media_assets(content_hash) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN experience INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS user_follows (
  follower_id TEXT NOT NULL,
  followed_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (follower_id, followed_id),
  CHECK (follower_id <> followed_id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (followed_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_user_follows_followed
  ON user_follows(followed_id, created_at DESC);

CREATE TABLE IF NOT EXISTS content_comments (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('POST', 'TREE')),
  target_id TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_content_comments_target
  ON content_comments(target_type, target_id, deleted_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_comments_creator
  ON content_comments(creator_id, created_at DESC);

CREATE TABLE IF NOT EXISTS content_likes (
  target_type TEXT NOT NULL CHECK (target_type IN ('POST', 'TREE')),
  target_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (target_type, target_id, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_content_likes_target
  ON content_likes(target_type, target_id, created_at DESC);

CREATE TABLE IF NOT EXISTS content_favorites (
  target_type TEXT NOT NULL CHECK (target_type IN ('POST', 'TREE')),
  target_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (target_type, target_id, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_content_favorites_target
  ON content_favorites(target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_favorites_user
  ON content_favorites(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS content_stats (
  target_type TEXT NOT NULL CHECK (target_type IN ('POST', 'TREE')),
  target_id TEXT NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (target_type, target_id)
);

CREATE TABLE IF NOT EXISTS experience_events (
  user_id TEXT NOT NULL,
  dedupe_key TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('DAILY_LOGIN', 'POST_CREATED', 'TREE_CREATED')),
  points INTEGER NOT NULL CHECK (points > 0 AND points <= 1000),
  occurred_at TEXT NOT NULL,
  PRIMARY KEY (user_id, dedupe_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_experience_events_user
  ON experience_events(user_id, occurred_at DESC);

CREATE TRIGGER IF NOT EXISTS experience_events_award
AFTER INSERT ON experience_events
BEGIN
  UPDATE users
     SET experience = experience + NEW.points,
         level = CAST((experience + NEW.points) / 100 AS INTEGER)
   WHERE id = NEW.user_id;
END;

INSERT OR IGNORE INTO experience_events
  (user_id, dedupe_key, event_type, points, occurred_at)
SELECT creator_id, 'post:' || id, 'POST_CREATED', 20, created_at
  FROM posts WHERE deleted_at IS NULL;

INSERT OR IGNORE INTO experience_events
  (user_id, dedupe_key, event_type, points, occurred_at)
SELECT creator_id, 'tree:' || id, 'TREE_CREATED', 20, created_at
  FROM published_trees WHERE deleted_at IS NULL AND kind = 'USER';

UPDATE users SET level = CAST(experience / 100 AS INTEGER);
