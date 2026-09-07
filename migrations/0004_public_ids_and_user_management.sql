PRAGMA foreign_keys = ON;

ALTER TABLE users ADD COLUMN public_id INTEGER;
ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE'
  CHECK (status IN ('ACTIVE', 'SUSPENDED'));
ALTER TABLE posts ADD COLUMN public_id INTEGER;
ALTER TABLE published_trees ADD COLUMN public_id INTEGER;

UPDATE users
   SET public_id = (
     SELECT ranked.sequence
       FROM (
         SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS sequence
           FROM users
       ) AS ranked
      WHERE ranked.id = users.id
   );

UPDATE posts
   SET public_id = (
     SELECT ranked.sequence
       FROM (
         SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS sequence
           FROM posts
       ) AS ranked
      WHERE ranked.id = posts.id
   );

UPDATE published_trees
   SET public_id = (
     SELECT ranked.sequence
       FROM (
         SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS sequence
           FROM published_trees
       ) AS ranked
      WHERE ranked.id = published_trees.id
   );

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_public_id ON users(public_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_public_id ON posts(public_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_published_trees_public_id ON published_trees(public_id);
CREATE INDEX IF NOT EXISTS idx_users_status_public_id ON users(status, public_id DESC);

CREATE TRIGGER IF NOT EXISTS users_assign_public_id
AFTER INSERT ON users
WHEN NEW.public_id IS NULL
BEGIN
  UPDATE users
     SET public_id = (SELECT COALESCE(MAX(public_id), 0) + 1 FROM users WHERE id <> NEW.id)
   WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS posts_assign_public_id
AFTER INSERT ON posts
WHEN NEW.public_id IS NULL
BEGIN
  UPDATE posts
     SET public_id = (SELECT COALESCE(MAX(public_id), 0) + 1 FROM posts WHERE id <> NEW.id)
   WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS published_trees_assign_public_id
AFTER INSERT ON published_trees
WHEN NEW.public_id IS NULL
BEGIN
  UPDATE published_trees
     SET public_id = (
       SELECT COALESCE(MAX(public_id), 0) + 1
         FROM published_trees
        WHERE id <> NEW.id
     )
   WHERE id = NEW.id;
END;
