PRAGMA foreign_keys = ON;

ALTER TABLE content_comments ADD COLUMN root_id TEXT;
ALTER TABLE content_comments ADD COLUMN reply_to_id TEXT;

CREATE INDEX IF NOT EXISTS idx_content_comments_roots
  ON content_comments(
    target_type,
    target_id,
    root_id,
    deleted_at,
    created_at DESC,
    id DESC
  );

CREATE INDEX IF NOT EXISTS idx_content_comments_replies
  ON content_comments(root_id, deleted_at, created_at ASC, id ASC);

CREATE INDEX IF NOT EXISTS idx_content_comments_reply_to
  ON content_comments(reply_to_id, deleted_at);
