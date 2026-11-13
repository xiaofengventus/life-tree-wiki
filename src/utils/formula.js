import katex from "katex";
import "katex/dist/katex.min.css";
import "../assets/formula.css";
import { upgradeTextLatex, wrapTopLevelLineBreaks } from "./latexScan.js";

export const MAX_FORMULA_LENGTH = 4_000;

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function cleanLatex(value) {
  return String(value || "").trim().slice(0, MAX_FORMULA_LENGTH);
}

export function renderLatex(latex, displayMode = false, { throwOnError = false } = {}) {
  const source = cleanLatex(latex);
  if (!source) return "";
  // 块级公式的顶层 `\\` 在 LaTeX 里是空操作（display 模式不产生换行），
  // 多行时自动包一层 gathered 才能真的换行。详见 utils/latexScan.js。
  const target = displayMode ? wrapTopLevelLineBreaks(source) : source;
  try {
    return katex.renderToString(target, {
      displayMode: Boolean(displayMode),
      throwOnError,
      trust: false,
      strict: "warn",
      output: "htmlAndMathml",
    });
  } catch (error) {
    if (throwOnError) throw error;
    return `<span class="life-math-error">${escapeHtml(source)}</span>`;
  }
}

/**
 * 渲染正文里的全部公式。
 *
 * 两步：
 *   1. `upgradeTextLatex` —— 把**文字层**里手写的 LaTeX（`$…$`、`$$…$$`、
 *      `\(…\)`、`\[…\]` 以及裸 LaTeX）升级成公式节点。
 *      富文本编辑器对正文文字不做任何 md 解析，作者直接把公式敲进段落时，
 *      这些字符就一直停在文字层、读者永远看不到渲染结果 —— 这一步补上它。
 *   2. 把 `[data-life-math]` 交给 KaTeX 渲染（inline 与 block 都走这里）。
 *
 * 之所以放在这一个函数里，是因为**所有显示正文的入口都经过它**：
 * 阅读页（utils/postBlocks.js）、编辑器 Markdown 预览面板、Markdown 单元格
 * （utils/markdownCellRender.js）、PDF 导出（utils/uiPdf.js）、后台回收站。
 * 改这一处即可全局生效。
 */
export function renderFormulaNodes(rawHtml) {
  const html = String(rawHtml || "");
  if (typeof DOMParser === "undefined") return html;

  const parsed = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  upgradeTextLatex(parsed);
  parsed.body.querySelectorAll("[data-life-math]").forEach((element) => {
    const mode = element.getAttribute("data-life-math");
    const latex = cleanLatex(element.getAttribute("data-latex") || element.textContent);
    const isBlock = mode === "block";
    const validElement =
      (mode === "inline" && element.tagName === "SPAN") ||
      (isBlock && (element.tagName === "DIV" || element.tagName === "P"));
    if (!validElement || !latex) {
      element.replaceWith(parsed.createTextNode(element.textContent || ""));
      return;
    }

    element.className = isBlock ? "life-math-block" : "life-math-inline";
    element.setAttribute("aria-label", `数学公式：${latex}`);
    element.innerHTML = renderLatex(latex, isBlock);
  });
  return parsed.body.innerHTML;
}
