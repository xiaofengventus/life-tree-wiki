PRAGMA foreign_keys = ON;

-- ui-pdf 文档格式：区分普通 HTML 文章和 UI-PDF 文档
ALTER TABLE posts ADD COLUMN document_format TEXT NOT NULL DEFAULT 'html'
  CHECK (document_format IN ('html', 'ui-pdf'));
ALTER TABLE post_revisions ADD COLUMN document_format TEXT NOT NULL DEFAULT 'html'
  CHECK (document_format IN ('html', 'ui-pdf'));

-- ui-pdf 序列化源码：存储 serializeUiPdfDocument() 生成的文本
ALTER TABLE posts ADD COLUMN ui_pdf_source TEXT NOT NULL DEFAULT '';
ALTER TABLE post_revisions ADD COLUMN ui_pdf_source TEXT NOT NULL DEFAULT '';

-- ui-pdf 文档元数据 JSON（排版模板、页面设置、主题等）
ALTER TABLE posts ADD COLUMN ui_pdf_meta_json TEXT NOT NULL DEFAULT '{}';

-- 服务端草稿表：支持 HTML 文章和 UI-PDF 文档的服务端草稿
CREATE TABLE IF NOT EXISTS post_drafts (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'ARTICLE'
    CHECK (content_type IN ('ARTICLE', 'TREE')),
  document_format TEXT NOT NULL DEFAULT 'html'
    CHECK (document_format IN ('html', 'ui-pdf')),
  mode TEXT NOT NULL DEFAULT 'CREATE'
    CHECK (mode IN ('CREATE', 'EDIT', 'FORK', 'CONTRIBUTION')),
  target_id TEXT NOT NULL DEFAULT '',
  base_version INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL DEFAULT '',
  content_html TEXT NOT NULL DEFAULT '',
  ui_pdf_source TEXT NOT NULL DEFAULT '',
  ui_pdf_meta_json TEXT NOT NULL DEFAULT '{}',
  classification_card_json TEXT NOT NULL DEFAULT '{}',
  citations_json TEXT NOT NULL DEFAULT '[]',
  tags_json TEXT NOT NULL DEFAULT '[]',
  cover_media_hash TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_post_drafts_creator
  ON post_drafts(creator_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_drafts_target
  ON post_drafts(target_id, mode);
