-- LS scientific content remains in versioned files in R2. These tables coordinate publication and edit leases only.
CREATE TABLE IF NOT EXISTS ls_projects (
  uid TEXT PRIMARY KEY, title TEXT NOT NULL, owner_id TEXT NOT NULL REFERENCES users(id),
  revision TEXT NOT NULL, object_key TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ls_main (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1), project_uid TEXT NOT NULL REFERENCES ls_projects(uid)
);
CREATE TABLE IF NOT EXISTS ls_edit_leases (
  token TEXT PRIMARY KEY, project_uid TEXT NOT NULL REFERENCES ls_projects(uid), root_uid TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id), revision TEXT NOT NULL, scope_json TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ls_leases_project_expiry ON ls_edit_leases(project_uid, expires_at);
CREATE TABLE IF NOT EXISTS ls_revision_log (
  revision TEXT PRIMARY KEY, project_uid TEXT NOT NULL, parent_revision TEXT, author_id TEXT NOT NULL,
  root_uid TEXT, object_key TEXT NOT NULL, created_at TEXT NOT NULL
);
