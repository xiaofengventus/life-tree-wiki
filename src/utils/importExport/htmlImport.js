// 富文本导入：HTML 文件 → 清洗 + 图片压缩
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { prepareImageBlob } from "@/utils/mediaImages";
import { normalizeLegacyImageCaptionHtml } from "@/utils/imageCaptionHtml";
import { readFileAsText } from "./index";

const MAX_HTML_SIZE = 10 * 1024 * 1024; // 10MB

export async function importHtml(file) {
  if (file.size > MAX_HTML_SIZE) {
    throw new Error("HTML 文件不能超过 10MB");
  }

  let html = await readFileAsText(file);
  if (!html.trim()) {
    throw new Error("文件内容为空");
  }

  // 提取 body 内容（如果包含完整 HTML 文档）
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    html = bodyMatch[1];
  }

  // 压缩 base64 图片
  html = await compressInlineImages(html);

  // 清洗
  html = sanitizeHtml(html);

  // 规范化图片注释
  html = normalizeLegacyImageCaptionHtml(html);

  return html;
}

async function compressInlineImages(html) {
  if (typeof DOMParser === "undefined") return html;
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const images = [...doc.body.querySelectorAll("img")];

  for (const img of images) {
    const src = String(img.getAttribute("src") || "");
    if (!src.startsWith("data:image/")) continue;

    try {
      const blob = dataUrlToBlob(src);
      const prepared = await prepareImageBlob(blob);
      img.setAttribute("src", prepared.dataUrl);
      if (!img.getAttribute("alt")) {
        img.setAttribute("alt", "导入的图片");
      }
    } catch {
      img.remove();
    }
  }

  return doc.body.innerHTML;
}

function dataUrlToBlob(dataUrl) {
  const comma = dataUrl.indexOf(",");
  const mimeType = dataUrl.slice(5, dataUrl.indexOf(";", 5)).toLowerCase();
  const binary = atob(dataUrl.slice(comma + 1));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
}
