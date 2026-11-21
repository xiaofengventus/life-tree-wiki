-- 显式记录 Laup 正文的内核版本：'v1' | 'v2'。
-- NULL = 富文本正文，或本次迁移之前入库的存量 Laup 文章（渲染时按内容自动判定）。
ALTER TABLE posts ADD COLUMN content_kernel TEXT;
ALTER TABLE post_revisions ADD COLUMN content_kernel TEXT;
