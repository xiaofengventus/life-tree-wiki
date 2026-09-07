PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS registration_invite_links (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  max_uses INTEGER NOT NULL CHECK (max_uses BETWEEN 2 AND 5000),
  use_count INTEGER NOT NULL DEFAULT 0 CHECK (use_count >= 0 AND use_count <= max_uses),
  last_used_at TEXT,
  revoked_at TEXT,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_registration_invite_links_created
  ON registration_invite_links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_registration_invite_links_active
  ON registration_invite_links(token_hash, revoked_at, expires_at);

CREATE TABLE IF NOT EXISTS registration_invite_link_uses (
  link_id TEXT NOT NULL,
  user_id TEXT NOT NULL UNIQUE,
  used_at TEXT NOT NULL,
  PRIMARY KEY (link_id, user_id),
  FOREIGN KEY (link_id) REFERENCES registration_invite_links(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_registration_invite_link_uses_link
  ON registration_invite_link_uses(link_id, used_at DESC);
