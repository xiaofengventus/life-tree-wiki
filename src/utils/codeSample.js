/**
 * 「代码块案例」：把语言标记为 `sample` 的代码块渲染成 输入 / 输出 对照卡片。
 *
 * 刻意复用普通代码块做载体，而不是新增一种元素类型：
 *   1. 编辑、撤销、粘贴、导入导出全部复用已有代码块能力；
 *   2. 两端的 HTML 清洗白名单一个字都不用改 —— 代码块的
 *      `language-xxx` 与 `data-code-language` 本来就会被保留。
 *
 * 作者在代码块里用单独一行 `---`（或 `===`）分隔输入和输出。
 * 空的一侧不渲染：只写了输入就单栏显示「输入」，只写了输出就单栏显示「输出」，
 * 两侧都写了才是双栏对照。这样写一个小案例时不用被空栏占掉一半宽度。
 */

export const CODE_SAMPLE_LANGUAGE = "sample";
export const CODE_SAMPLE_ATTR = "data-life-code-sample";

const SEPARATOR_PATTERN = /^\s*(?:-{3,}|={3,})\s*$/;
const MAX_SIDE_LENGTH = 20_000;
const EMPTY_PLACEHOLDER = "（空）";

export function escapeSampleHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function trimBlankLines(lines) {
  let start = 0;
  let end = lines.length;
  while (start < end && !lines[start].trim()) start += 1;
  while (end > start && !lines[end - 1].trim()) end -= 1;
  return lines.slice(start, end);
}

function clip(value) {
  return String(value).slice(0, MAX_SIDE_LENGTH);
}

/**
 * 把代码块里的原文切成输入 / 输出两段。
 * 返回 { hasSeparator, input, output }。
 */
export function parseCodeSampleText(text) {
  const lines = String(text ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n");
  const separatorIndex = lines.findIndex((line) => SEPARATOR_PATTERN.test(line));
  const hasSeparator = separatorIndex >= 0;
  return {
    hasSeparator,
    input: clip(
      trimBlankLines(
        hasSeparator ? lines.slice(0, separatorIndex) : lines,
      ).join("\n"),
    ),
    output: clip(
      trimBlankLines(
        hasSeparator ? lines.slice(separatorIndex + 1) : [],
      ).join("\n"),
    ),
  };
}

function paneHtml({ kind, index, body }) {
  const isInput = kind === "input";
  const label = isInput ? "输入" : "输出";
  const sub = isInput ? "Input" : "Output";
  const content = body.length ? body : EMPTY_PLACEHOLDER;
  return [
    `<div class="life-code-sample-pane ${isInput ? "is-input" : "is-output"}">`,
    `<div class="life-code-sample-pane-head">`,
    `<span class="life-code-sample-label">${label}<em>#${index}</em></span>`,
    `<span class="life-code-sample-sub">${sub}</span>`,
    `</div>`,
    // 内容用 <pre><code>，这样代码块的「复制」按钮能原样复用到这两栏上
    `<pre class="life-code-sample-body"><code>${escapeSampleHtml(content)}</code></pre>`,
    `</div>`,
  ].join("");
}

/**
 * 渲染成卡片 HTML。`index` 是这个块在文中的序号（第 1 个是 0）。
 *
 * 空的一侧不渲染 —— 只写输入就是单栏「输入」，只写输出就是单栏「输出」。
 * 两侧都空（例如只敲了一个 `---`）时保留「输入」占位栏，避免卡片只剩一个标题。
 */
export function codeSampleHtml(text, index = 0) {
  const safeIndex = Number.isInteger(index) && index >= 0 ? index : 0;
  const { input, output } = parseCodeSampleText(text);
  const hasInput = Boolean(input);
  const hasOutput = Boolean(output);
  const panes = [];
  if (hasInput || !hasOutput) {
    panes.push(paneHtml({ kind: "input", index: safeIndex, body: input }));
  }
  if (hasOutput) {
    panes.push(paneHtml({ kind: "output", index: safeIndex, body: output }));
  }
  return [
    `<div class="life-code-sample" ${CODE_SAMPLE_ATTR}="1">`,
    `<div class="life-code-sample-head">`,
    `<span class="life-code-sample-bar"></span>`,
    `<span class="life-code-sample-title">样例</span>`,
    `<span class="life-code-sample-title-en">Sample</span>`,
    `</div>`,
    `<div class="life-code-sample-grid${panes.length < 2 ? " is-single" : ""}">`,
    panes.join(""),
    `</div>`,
    `</div>`,
  ].join("");
}
