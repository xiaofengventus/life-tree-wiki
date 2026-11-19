-- 可选写作模板独立于正文体裁、分类卡片及文章类型；旧文保持自由写作。
ALTER TABLE posts ADD COLUMN article_template_json TEXT NOT NULL DEFAULT 'null';
ALTER TABLE post_revisions ADD COLUMN article_template_json TEXT NOT NULL DEFAULT 'null';
