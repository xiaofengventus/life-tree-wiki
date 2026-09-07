// 富文本导出：完整 HTML 文档
import { downloadText } from "./index";
import { timestamp } from "./index";

export function exportHtml(html, title = "专栏文章") {
  const fullHtml = buildFullHtml(html, title);
  downloadText(fullHtml, `${title || "专栏文章"}_${timestamp()}.html`, "text/html");
}

function buildFullHtml(html, title) {
  const cleanTitle = escapeHtml(title || "专栏文章");
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${cleanTitle}</title>
  <style>
    body {
      font-family: "Noto Serif SC", "Songti SC", "STSong", Georgia, serif;
      font-size: 16px;
      line-height: 1.7;
      color: #30343b;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
    }
    h1 { font-size: 1.75em; font-weight: 700; margin: 1em 0 0.5em; color: #1e293b; }
    h2 { font-size: 1.4em; font-weight: 700; margin: 1em 0 0.5em; color: #1e293b; }
    h3 { font-size: 1.2em; font-weight: 600; margin: 0.8em 0 0.4em; color: #1e293b; }
    p { margin: 0 0 0.8em; }
    blockquote { margin: 1.7em 0; padding: 13px 18px; border-left: 4px solid #75aa99; border-radius: 0 9px 9px 0; background: #f4f8f6; color: #597068; }
    pre { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; overflow-x: auto; }
    code { font-family: "SF Mono", "Fira Code", Consolas, monospace; font-size: 0.9em; }
    table { border-collapse: collapse; width: 100%; margin: 0 0 1em; }
    td, th { border: 1px solid #cbd5e1; padding: 8px 12px; }
    th { background: #f1f5f9; font-weight: 600; }
    img { max-width: 100%; border-radius: 8px; }
    figure { margin: 1em 0; text-align: center; }
    figcaption { font-size: 0.85em; color: #94a3b8; margin-top: 8px; }
    a { color: #2563eb; text-decoration: underline; }
    a:hover { text-decoration: underline; }
    sup { font-size: 0.7em; vertical-align: super; }
    hr { border: none; border-top: 2px dashed #e2e8f0; margin: 2em 0; }
    input[type="checkbox"] { margin-right: 6px; }
    a[href*="#post-citation-"] { padding: 0 0.12em; border-radius: 0.22em; background: rgba(22, 131, 216, 0.1); color: #087fd1; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-weight: 800; text-decoration: none; }
  </style>
</head>
<body>
${html || ""}
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
