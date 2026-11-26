CREATE TABLE papilot_projects (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('laup', 'tex')),
  location TEXT,
  version INTEGER NOT NULL CHECK (version >= 1),
  snapshot_key TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT
);

CREATE INDEX idx_papilot_projects_active_owner
  ON papilot_projects (owner_id, updated_at DESC, id DESC) WHERE archived_at IS NULL;

CREATE TABLE papilot_preferences (
  owner_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  default_location TEXT
);
