PRAGMA foreign_keys = ON;

ALTER TABLE posts ADD COLUMN classification_card_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE post_revisions ADD COLUMN classification_card_json TEXT NOT NULL DEFAULT '{}';
