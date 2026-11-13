PRAGMA foreign_keys = ON;

-- 专栏文件夹：与文章自身的 type（科普 / 新闻徽标）无关的「组织层」。
-- 一级分区固定三个：science 科普 / news 新闻 / none 未分类；
-- 文章放进文件夹 = posts.folder_id 指过去，不放进任何文件夹 = 「未分类」散文章。
-- 删除文件夹时文章自动回未分类：folder_id 置 NULL（ON DELETE SET NULL），
-- API 侧也在同一批次里显式 UPDATE，双保险。
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'none'
    CHECK (section IN ('science', 'news', 'none')),
  creator_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_folders_section
  ON folders(section, created_at ASC);

-- 只允许公开文章进文件夹：计数与过滤都按这一点约定。
ALTER TABLE posts ADD COLUMN folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_posts_folder
  ON posts(folder_id, deleted_at, updated_at DESC);
