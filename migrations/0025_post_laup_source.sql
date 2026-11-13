-- Laup 正文：存源码，HTML 由服务端用 Laup 自己的渲染器重渲后落 content_html。
-- content_laup 为空 = 这篇是 html 正文（既有文章不受影响）。
ALTER TABLE posts ADD COLUMN content_laup TEXT;
ALTER TABLE post_revisions ADD COLUMN content_laup TEXT;
