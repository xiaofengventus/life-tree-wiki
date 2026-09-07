// Word (.docx) 导出：HTML → Word 兼容文档
import { downloadBlob } from "./index";
import { timestamp } from "./index";

export function exportDocx(html, title = "专栏文章") {
  const wordHtml = buildWordHtml(html, title);
  const blob = new Blob([wordHtml], {
    type: "application/msword",
  });
  downloadBlob(blob, `${title || "专栏文章"}_${timestamp()}.doc`);
}

function buildWordHtml(html, title) {
  const cleanTitle = escapeXml(title || "专栏文章");
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>${cleanTitle}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page { margin: 2cm; }
    body { font-family: "Noto Serif SC", "Songti SC", "STSong", Georgia, serif; font-size: 16px; line-height: 1.7; color: #30343b; }
    h1 { font-size: 22pt; font-weight: bold; margin: 12pt 0 6pt; }
    h2 { font-size: 18pt; font-weight: bold; margin: 10pt 0 5pt; }
    h3 { font-size: 14pt; font-weight: bold; margin: 8pt 0 4pt; }
    p { margin: 0 0 6pt; }
    blockquote { margin: 1.7em 0; padding: 13px 18px; border-left: 4px solid #75aa99; border-radius: 0 9px 9px 0; background: #f4f8f6; color: #597068; }
    h1, h2, h3 { color: #20242a; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-weight: 700; line-height: 1.45; }
    pre { font-family: "Consolas", "Courier New", monospace; font-size: 10pt;
          background: #f5f5f5; padding: 8pt; margin: 0 0 6pt; }
    code { font-family: "Consolas", "Courier New", monospace; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1pt solid #999; padding: 4pt 6pt; }
    th { background: #eee; font-weight: bold; }
    img { max-width: 100%; }
    a { color: #2563eb; }
    a[href*="#post-citation-"] { padding: 0 0.12em; border-radius: 0.22em; background: rgba(22, 131, 216, 0.1); color: #087fd1; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; text-decoration: none; font-weight: bold; }
    figcaption { font-size: 10pt; color: #888; text-align: center; margin-top: 4pt; }
    sup { font-size: 0.7em; vertical-align: super; }
  </style>
</head>
<body>
${html || ""}
</body>
</html>`;
}

function escapeXml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
