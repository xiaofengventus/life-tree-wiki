PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS media_references (
  content_hash TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('POST', 'TREE')),
  entity_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (content_hash, entity_type, entity_id),
  FOREIGN KEY (content_hash) REFERENCES media_assets(content_hash) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_media_references_entity
  ON media_references(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_media_references_hash
  ON media_references(content_hash);
