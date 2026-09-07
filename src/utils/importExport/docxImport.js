// Word (.docx) 导入：mammoth 解析 + 图片提取压缩
import { prepareImageBlob } from "@/utils/mediaImages";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { normalizeLegacyImageCaptionHtml } from "@/utils/imageCaptionHtml";
import { readFileAsArrayBuffer } from "./index";

const MAX_DOCX_SIZE = 25 * 1024 * 1024; // 25MB

export async function importDocx(file) {
  if (file.size > MAX_DOCX_SIZE) {
    throw new Error("Word 文档不能超过 25MB");
  }

  const arrayBuffer = await readFileAsArrayBuffer(file);
  // 动态 import，按需加载 mammoth
  const mammoth = await import("mammoth");
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
      ],
    },
  );

  let html = result.value || "";

  // 提取并压缩 base64 图片
  html = await compressInlineImages(html);

  // 清洗 HTML
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
      // 设置 alt 为文件名或默认
      if (!img.getAttribute("alt")) {
        img.setAttribute("alt", "导入的图片");
      }
    } catch {
      // 压缩失败则保留原图或移除
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
