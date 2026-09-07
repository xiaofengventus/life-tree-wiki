PRAGMA foreign_keys = ON;

ALTER TABLE posts ADD COLUMN citations_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE post_revisions ADD COLUMN citations_json TEXT NOT NULL DEFAULT '[]';
