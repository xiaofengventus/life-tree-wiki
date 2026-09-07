// Markdown 导入：复用已有的 markdownToSafeHtml
import { markdownToSafeHtml } from "@/utils/markdown";
import { readFileAsText } from "./index";

const MAX_MARKDOWN_SIZE = 500_000; // 500KB

export async function importMarkdown(file) {
  if (file.size > MAX_MARKDOWN_SIZE) {
    throw new Error("Markdown 文件不能超过 500KB");
  }

  const text = await readFileAsText(file);
  if (!text.trim()) {
    throw new Error("文件内容为空");
  }

  // 复用已有的 markdown → HTML 转换（含 GFM、公式、sanitize）
  const html = markdownToSafeHtml(text);
  return html;
}
