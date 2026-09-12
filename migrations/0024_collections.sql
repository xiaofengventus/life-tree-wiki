PRAGMA foreign_keys = ON;

-- 专栏合集：把同一作者的文章 / 进化树按主题组织在一起（系列、连载、专题）。
-- 只收录作者自己的作品；合集本身可公开，也可单独设为仅自己可见。
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'PUBLIC'
    CHECK (visibility IN ('PUBLIC', 'PRIVATE')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_collections_owner
  ON collections(owner_id, deleted_at, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_collections_public
  ON collections(visibility, deleted_at, updated_at DESC);

-- 合集条目：文章和树共用一个条目表，sort_order 决定展示顺序（小的在前）。
-- 作品被删除或转为私密后条目本身保留，展示时再按可见性过滤。
CREATE TABLE IF NOT EXISTS collection_items (
  collection_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('POST', 'TREE')),
  target_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  added_at TEXT NOT NULL,
  PRIMARY KEY (collection_id, target_type, target_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_collection_items_order
  ON collection_items(collection_id, sort_order, added_at);

CREATE INDEX IF NOT EXISTS idx_collection_items_target
  ON collection_items(target_type, target_id);
