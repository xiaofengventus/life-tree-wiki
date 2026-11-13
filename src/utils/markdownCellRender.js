/**
 * Markdown 单元格的渲染器 —— 把单元格里的源码渲染成可安全插入的正文 HTML。
 *
 * 单独成文件的原因：这里要 import utils/markdown.js 和 utils/formula.js，
 * 而 formula.js 顶部带着 `katex/dist/katex.min.css`，Node 原生 ESM 解析不了 CSS。
 * richHtml.js 需要在 tests（node --test）里被 import，所以它不能碰这条链 ——
 * 它改为在应用入口通过 `setMarkdownCellRenderer()` 注册本模块的函数。
 *
 * 渲染走的是和「从 Markdown 导入正文」完全相同的一条管线
 * （micromark + GFM + 数学扩展 → 清洗 → 公式渲染），
 * 所以表格、任务列表、行内 / 块级公式、代码块的表现天然一致。
 */
import { markdownToSafeHtml } from "./markdown.js";
import { renderFormulaNodes } from "./formula.js";
import { MAX_MARKDOWN_CELL_LENGTH } from "./markdownCell.js";

/**
 * 源码 → 正文 HTML（不含外层容器）。
 *
 * 空源码返回空串；超过上限或解析失败会抛错，调用方负责兜底 ——
 * 一个坏单元格不该毁掉整篇渲染。
 */
export function renderMarkdownCellSource(source) {
  const text = String(source ?? "");
  if (!text.trim()) return "";
  if (text.length > MAX_MARKDOWN_CELL_LENGTH) {
    throw new Error("Markdown 单元格内容不能超过 50 万个字符");
  }
  return renderFormulaNodes(markdownToSafeHtml(text));
}
