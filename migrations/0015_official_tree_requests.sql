PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tree_official_requests (
  id TEXT PRIMARY KEY,
  tree_id TEXT NOT NULL,
  applicant_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN')),
  response_note TEXT NOT NULL DEFAULT '',
  official_tree_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  responded_at TEXT,
  FOREIGN KEY (tree_id) REFERENCES published_trees(id),
  FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (official_tree_id) REFERENCES published_trees(id)
);

CREATE INDEX IF NOT EXISTS idx_tree_official_requests_tree
  ON tree_official_requests(tree_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tree_official_requests_author
  ON tree_official_requests(author_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tree_official_requests_applicant
  ON tree_official_requests(applicant_id, status, updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tree_official_requests_pending
  ON tree_official_requests(tree_id) WHERE status = 'PENDING';

ALTER TABLE notifications RENAME TO notifications_legacy_0015;

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  recipient_id TEXT NOT NULL,
  actor_id TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'COMMENT_POST',
    'COMMENT_TREE',
    'CONTRIBUTION_SUBMITTED',
    'CONTRIBUTION_APPROVED',
    'CONTRIBUTION_REJECTED',
    'OFFICIAL_TREE_REQUESTED',
    'OFFICIAL_TREE_APPROVED',
    'OFFICIAL_TREE_REJECTED'
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

INSERT INTO notifications
  (id, recipient_id, actor_id, type, target_type, target_id, source_id,
   message, read_at, created_at)
SELECT id, recipient_id, actor_id, type, target_type, target_id, source_id,
       message, read_at, created_at
  FROM notifications_legacy_0015;

DROP TABLE notifications_legacy_0015;

CREATE INDEX idx_notifications_recipient
  ON notifications(recipient_id, read_at, created_at DESC);
