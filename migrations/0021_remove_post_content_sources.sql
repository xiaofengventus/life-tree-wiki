PRAGMA foreign_keys = ON;

ALTER TABLE posts DROP COLUMN references_text;
ALTER TABLE posts DROP COLUMN image_credits_text;
ALTER TABLE post_revisions DROP COLUMN references_text;
ALTER TABLE post_revisions DROP COLUMN image_credits_text;
