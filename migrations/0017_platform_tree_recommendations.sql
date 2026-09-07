PRAGMA foreign_keys = ON;

ALTER TABLE published_trees
  ADD COLUMN platform_recommended INTEGER NOT NULL DEFAULT 0
  CHECK (platform_recommended IN (0, 1));
ALTER TABLE published_trees ADD COLUMN platform_reviewed_at TEXT;
ALTER TABLE published_trees ADD COLUMN platform_reviewed_by TEXT
  REFERENCES users(id);

-- Keep already-published legacy platform trees visible after switching to
-- recommendation metadata. New recommendations no longer create tree copies.
UPDATE published_trees
   SET platform_recommended = 1,
       platform_reviewed_at = updated_at
 WHERE kind = 'OFFICIAL';

CREATE INDEX IF NOT EXISTS idx_published_trees_platform_recommended
  ON published_trees(platform_recommended, deleted_at, updated_at DESC, id DESC);
