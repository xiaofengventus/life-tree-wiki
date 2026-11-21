/**
 * 两个「保留换行」的段落环境。
 *
 * CommonMark 里单个换行是「软换行」，渲染后会被合并成一行，只有空行才分段。
 * 逐条笔记、歌词、对照清单这类内容就会全挤在一起。两个环境分工不同：
 *
 *   \begin{stay} … \end{stay}
 *       完全原样：不参与任何 Markdown / LaTeX 解析，换行、缩进、空格全保留。
 *       适合代码清单、逐字稿、不想被改写的原文。
 *
 *   \begin{stay-line} … \end{stay-line}
 *       只保留换行：**行内内容照常解析**（`**粗体**`、`$x^2$`、
 *       `\textcolor{red}{红字}` 都正常工作），只是每个换行都留成独立一行。
 *
 * 环境标记各占一行，可带缩进；代码围栏里的同名文本只是示例，不会触发。
 * 未写结束标记时一直吃到文末。
 */

const TOKEN_PREFIX = "LIFETREESTAYBLOCKTOKEN";
const STAY_OPEN_RE = /^[ \t]*\\begin\{stay\}[ \t]*$/;
const STAY_CLOSE_RE = /^[ \t]*\\end\{stay\}[ \t]*$/;
const LINE_OPEN_RE = /^[ \t]*\\begin\{stay-line\}[ \t]*$/;
const LINE_CLOSE_RE = /^[ \t]*\\end\{stay-line\}[ \t]*$/;
const FENCE_RE = /^[ \t]{0,3}(`{3,}|~{3,})/;
/** 行首缩进换成不换行空格，避免 4 空格缩进被当成代码块 */
const NBSP = "\u00a0";

function escapeText(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function hardenLine(line) {
  return line
    .replace(/\s+$/, "")
    .replace(/^[ \t]+/, (indent) => NBSP.repeat(indent.length));
}

/**
 * 展开两个环境。
 *
 * - `stay-line` 当场改写成「行尾两个空格」的硬换行，继续走 Markdown 解析；
 * - `stay` 整块摘出来换成一行占位标记，解析完由 restoreStayBlocks 换回原样块。
 *
 * @param {string} markdown
 * @returns {{ source: string, blocks: string[] }}
 */
export function normalizeStayBlocks(markdown) {
  const text = String(markdown ?? "");
  if (!text.includes("\\begin{stay")) return { source: text, blocks: [] };

  const lines = text.split("\n");
  const out = [];
  const blocks = [];
  let verbatim = null;
  let breakLines = null;
  let fenceChar = "";
  let fenceLength = 0;

  const separate = () => {
    if (out.length && out[out.length - 1].trim() !== "") out.push("");
  };

  const flushVerbatim = () => {
    const index = blocks.push(verbatim.join("\n")) - 1;
    separate();
    out.push(`${TOKEN_PREFIX}${index}`);
    out.push("");
    verbatim = null;
  };

  const flushLine = () => {
    const body = breakLines.map(hardenLine).join("  \n");
    separate();
    out.push(body);
    out.push("");
    breakLines = null;
  };

  for (const line of lines) {
    if (verbatim) {
      if (STAY_CLOSE_RE.test(line)) flushVerbatim();
      else verbatim.push(line);
      continue;
    }
    if (breakLines) {
      if (LINE_CLOSE_RE.test(line)) flushLine();
      else breakLines.push(line);
      continue;
    }

    const fence = FENCE_RE.exec(line);
    if (fence) {
      const char = fence[1][0];
      const length = fence[1].length;
      if (!fenceChar) {
        fenceChar = char;
        fenceLength = length;
      } else if (char === fenceChar && length >= fenceLength) {
        fenceChar = "";
        fenceLength = 0;
      }
      out.push(line);
      continue;
    }
    if (fenceChar) {
      out.push(line);
      continue;
    }

    if (STAY_OPEN_RE.test(line)) {
      verbatim = [];
      continue;
    }
    if (LINE_OPEN_RE.test(line)) {
      breakLines = [];
      continue;
    }
    out.push(line);
  }

  if (verbatim) flushVerbatim();
  if (breakLines) flushLine();
  return { source: out.join("\n"), blocks };
}

/**
 * 把解析结果里的占位段落换回 `stay` 原样块。
 *
 * @param {string} html micromark 输出的 HTML
 * @param {string[]} blocks normalizeStayBlocks 返回的原样块内容
 * @returns {string}
 */
export function restoreStayBlocks(html, blocks) {
  if (!blocks.length) return html;
  const pattern = new RegExp(
    `<p>[ \\t\\n]*${TOKEN_PREFIX}(\\d+)[ \\t\\n]*</p>`,
    "g",
  );
  return String(html ?? "").replace(pattern, (match, index) => {
    const block = blocks[Number(index)];
    if (block === undefined) return match;
    return `<div data-life-stay>${escapeText(block)}</div>`;
  });
}
