CREATE TABLE IF NOT EXISTS mobile_auth_handoffs (
  code_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  used_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_mobile_auth_handoffs_expiry
  ON mobile_auth_handoffs(expires_at);
