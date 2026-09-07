PRAGMA foreign_keys = ON;

ALTER TABLE published_trees ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE published_trees ADD COLUMN change_note TEXT NOT NULL DEFAULT '';
ALTER TABLE published_trees ADD COLUMN fork_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE published_trees ADD COLUMN contribution_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE published_trees ADD COLUMN forked_from_tree_id TEXT
  REFERENCES published_trees(id);

ALTER TABLE tree_revisions ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE tree_revisions ADD COLUMN change_note TEXT NOT NULL DEFAULT '';
ALTER TABLE tree_revisions ADD COLUMN fork_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tree_revisions ADD COLUMN contribution_enabled INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS tree_forks (
  id TEXT PRIMARY KEY,
  source_tree_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  source_version INTEGER NOT NULL,
  published_tree_id TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (source_tree_id, user_id),
  FOREIGN KEY (source_tree_id) REFERENCES published_trees(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (published_tree_id) REFERENCES published_trees(id)
);
CREATE INDEX IF NOT EXISTS idx_tree_forks_source
  ON tree_forks(source_tree_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tree_forks_user
  ON tree_forks(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS tree_contributions (
  id TEXT PRIMARY KEY,
  target_tree_id TEXT NOT NULL,
  contributor_id TEXT NOT NULL,
  base_version INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  document_json TEXT NOT NULL,
  node_count INTEGER NOT NULL,
  license TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  change_note TEXT NOT NULL,
  fork_enabled INTEGER NOT NULL DEFAULT 0,
  contribution_enabled INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  review_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT,
  FOREIGN KEY (target_tree_id) REFERENCES published_trees(id),
  FOREIGN KEY (contributor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_tree_contributions_target
  ON tree_contributions(target_tree_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tree_contributions_contributor
  ON tree_contributions(contributor_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  recipient_id TEXT NOT NULL,
  actor_id TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'COMMENT_POST',
    'COMMENT_TREE',
    'CONTRIBUTION_SUBMITTED',
    'CONTRIBUTION_APPROVED',
    'CONTRIBUTION_REJECTED'
  )),
  target_type TEXT NOT NULL CHECK (target_type IN ('POST', 'TREE', 'CONTRIBUTION')),
  target_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  read_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (recipient_id, type, source_id),
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient
  ON notifications(recipient_id, read_at, created_at DESC);
