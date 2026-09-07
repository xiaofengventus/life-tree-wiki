PRAGMA foreign_keys = ON;

ALTER TABLE posts ADD COLUMN references_text TEXT NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN image_credits_text TEXT NOT NULL DEFAULT '';
ALTER TABLE post_revisions ADD COLUMN references_text TEXT NOT NULL DEFAULT '';
ALTER TABLE post_revisions ADD COLUMN image_credits_text TEXT NOT NULL DEFAULT '';

ALTER TABLE published_trees ADD COLUMN references_text TEXT NOT NULL DEFAULT '';
ALTER TABLE published_trees ADD COLUMN image_credits_text TEXT NOT NULL DEFAULT '';
ALTER TABLE tree_revisions ADD COLUMN references_text TEXT NOT NULL DEFAULT '';
ALTER TABLE tree_revisions ADD COLUMN image_credits_text TEXT NOT NULL DEFAULT '';

ALTER TABLE tree_contributions ADD COLUMN references_text TEXT NOT NULL DEFAULT '';
ALTER TABLE tree_contributions ADD COLUMN image_credits_text TEXT NOT NULL DEFAULT '';
