PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS published_trees (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('USER', 'OFFICIAL')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  document_json TEXT NOT NULL,
  node_count INTEGER NOT NULL,
  license TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_published_trees_kind_updated
  ON published_trees(kind, deleted_at, updated_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_published_trees_creator
  ON published_trees(creator_id, deleted_at, updated_at DESC);

CREATE TABLE IF NOT EXISTS tree_revisions (
  tree_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  document_json TEXT NOT NULL,
  node_count INTEGER NOT NULL,
  license TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  PRIMARY KEY (tree_id, version),
  FOREIGN KEY (tree_id) REFERENCES published_trees(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
