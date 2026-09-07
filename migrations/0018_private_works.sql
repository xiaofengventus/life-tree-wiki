PRAGMA foreign_keys = ON;

ALTER TABLE posts ADD COLUMN visibility TEXT NOT NULL DEFAULT 'PUBLIC'
  CHECK (visibility IN ('PUBLIC', 'PRIVATE'));
ALTER TABLE published_trees ADD COLUMN visibility TEXT NOT NULL DEFAULT 'PUBLIC'
  CHECK (visibility IN ('PUBLIC', 'PRIVATE'));

CREATE INDEX IF NOT EXISTS idx_posts_private_owner
  ON posts(creator_id, visibility, deleted_at, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_published_trees_private_owner
  ON published_trees(creator_id, visibility, deleted_at, updated_at DESC);

-- Articles and trees share five numbered slots. The application reserves a
-- free slot and creates the work in one D1 batch transaction.
CREATE TABLE IF NOT EXISTS private_work_slots (
  owner_id TEXT NOT NULL,
  slot_number INTEGER NOT NULL CHECK (slot_number BETWEEN 1 AND 5),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('POST', 'TREE')),
  entity_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (owner_id, slot_number),
  UNIQUE (entity_type, entity_id),
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_private_work_slots_entity
  ON private_work_slots(entity_type, entity_id);
