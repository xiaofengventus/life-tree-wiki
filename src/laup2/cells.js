/**
 * Laup v2 —— 单元格层。
 *
 * 内核只处理「一份文档」；这一层把整篇 Notebook 拆成格、识别格类型、
 * 合并输入/输出案例卡，并让脚注 / 公式 / 文献编号**跨格连续**。
 *
 * 格类型（只看首行）：
 *   [input]            输入栏（纯文本，不声明语言）
 *   [output]           输出栏（纯文本，不声明语言）
 *   [cpp] 等            代码格，语言就是方括号里的名字
 *   [var]              变量格（格内写 `name = value`，可多条）
 *   var x = 1          变量格（单行简写）
 *   [reference]       参考文献格（一行一条）
 *   [references]      同上
 *   其他                Laup 文档格
 *
 * 格与格之间用独占一行的 `\cellbreak` 分隔（兼容 v1 的 `\cellbreak=[` 块写法）。
 */

import { N } from "./ast.js";
import { parse } from "./parser.js";
import { createSemanticState, collectSemantics, resolveSemantics } from "./semantic.js";
import { renderHtml, renderFootnotes } from "./render/html.js";
import { createDiagnostics } from "./diagnostics.js";

const CELLBREAK_START = /^[ \t]*\\cellbreak[ \t]*(?:=[ \t]*\[[ \t]*)?$/;
const LANG_DECL = /^\[([A-Za-z0-9+#-]{1,16})\]$/;
const INLINE_VAR = /^var[ \t]+([A-Za-z_][A-Za-z0-9_]*)[ \t]*=[ \t]*(.*)$/;
const VAR_LINE = /^(?:var[ \t]+)?([A-Za-z_][A-Za-z0-9_]*)[ \t]*=[ \t]*([\s\S]*)$/;

/**
 * 变量求值。支持：
 *   字符串（单/双引号）、数字、true/false/null、JSON 对象/数组，其余按原样字符串。
 */
export function evaluate(raw) {
  const text = String(raw ?? "").trim().replace(/;$/, "");
  if (/^"""[\s\S]*"""$/.test(text)) return text.slice(3, -3);
  if (text.length >= 2 && /^(["'])[\s\S]*\1$/.test(text)) return text.slice(1, -1);
  if (/^-?\d+(?:\.\d+)?$/.test(text)) return Number(text);
  if (text === "true") return true;
  if (text === "false") return false;
  if (text === "null") return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * 把整篇源码拆成格。
 * @returns {Array<object>}
 */
export function parseCells(source) {
  const lines = String(source ?? "").replace(/\r\n?/g, "\n").split("\n");
  const groups = [[]];
  let skippingBreak = false;

  for (const line of lines) {
    if (skippingBreak) {
      if (/^[ \t]*\][ \t]*$/.test(line)) skippingBreak = false;
      continue;
    }
    if (CELLBREAK_START.test(line)) {
      skippingBreak = /\[[ \t]*$/.test(line);
      groups.push([]);
      continue;
    }
    groups[groups.length - 1].push(line);
  }

  return groups
    .map((group) => group.join("\n").replace(/^\n+|\n+$/g, ""))
    .filter((text) => text.trim() !== "")
    .map(classifyCell);
}

function classifyCell(source) {
  const firstLine = source.split("\n")[0] ?? "";
  const head = firstLine.trim();

  const declared = LANG_DECL.exec(head);
  if (declared) {
    const name = declared[1].toLowerCase();
    const body = source.slice(firstLine.length).replace(/^\n/, "");
    if (name === "input" || name === "output") return { type: "code", pane: name, source, body };
    if (name === "var") return { type: "var", source, body };
    if (name === "references") return { type: "reference", source, body };
    return { type: "code", pane: null, lang: name, source, body };
  }

  if (INLINE_VAR.test(head)) return { type: "var", source };
  return { type: "laup", source };
}

/** 变量格 → [[名字, 值], …]；`[var]` 格里允许裸赋值 */
export function readVarCell(cell) {
  const source = cell.body !== undefined ? cell.body : cell.source;
  const out = [];
  for (const line of String(source ?? "").split("\n")) {
    const match = VAR_LINE.exec(line.trim());
    if (!match || !match[2].trim()) continue;
    out.push([match[1], evaluate(match[2])]);
  }
  return out;
}

/** 参考文献格 → 条目数组（一行一条，空行忽略） */
export function readReferenceCell(cell) {
  return String(cell.body ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const paneNode = (kind, cell) => ({
  kind,
  value: String(cell.body ?? "").replace(/^\n+|\n+$/g, ""),
});

const renderNodes = (nodes, meta) =>
  renderHtml({ type: "Doc", attrs: {}, children: nodes, span: null }, { meta, fragment: true });

/**
 * 渲染整篇 Notebook。
 *
 * @param {string} source
 * @param {{ variables?: Record<string, unknown> }} options
 */
export function typesetCells(source, options = {}) {
  const cells = parseCells(source);
  const diagnostics = [];
  const report = createDiagnostics(diagnostics);

  // ① 变量快照：按出现顺序求值，后面的格能用到前面的定义
  const snapshots = [];
  let variables = { ...options.variables };
  for (const cell of cells) {
    if (cell.type === "var") {
      for (const [name, value] of readVarCell(cell)) variables[name] = value;
    }
    snapshots.push({ ...variables });
  }

  // ② 解析所有 Laup 格
  const docs = cells.map((cell) => {
    if (cell.type !== "laup") return null;
    const { doc, diagnostics: parseDiagnostics } = parse(cell.source);
    diagnostics.push(...parseDiagnostics);
    return doc;
  });

  // ③ 收集阶段：编号、目录、脚注、文献（跨格共享；文献统一进池）
  const state = createSemanticState();
  cells.forEach((cell, index) => {
    if (cell.type === "reference") state.references.push(...readReferenceCell(cell));
    if (docs[index]) {
      collectSemantics(docs[index], state, { report, collectReferences: true });
    }
  });

  // ④ 回填阶段：变量用各自快照，公式/文献引用用全局编号
  cells.forEach((cell, index) => {
    if (docs[index]) {
      resolveSemantics(docs[index], { state, variables: snapshots[index], report });
    }
  });

  // ⑤ 渲染：格内容按顺序，脚注与文献各输出一次（文末）
  const meta = { toc: state.toc, footnotes: state.footnotes };
  const results = [];
  let index = 0;

  while (index < cells.length) {
    const cell = cells[index];

    if (cell.type === "var" || cell.type === "reference") {
      results.push({ cell, html: "" });
      index += 1;
      continue;
    }

    if (cell.type === "code" && cell.pane === "input") {
      const panes = [paneNode("input", cell)];
      const next = cells[index + 1];
      if (next && next.type === "code" && next.pane === "output") {
        panes.push(paneNode("output", next));
        index += 1;
      }
      results.push({ cell, html: renderNodes([N.sample(panes)], meta) });
      index += 1;
      continue;
    }

    if (cell.type === "code" && cell.pane === "output") {
      results.push({ cell, html: renderNodes([N.sample([paneNode("output", cell)])], meta) });
      index += 1;
      continue;
    }

    if (cell.type === "code") {
      results.push({ cell, html: renderNodes([N.code(cell.lang, cell.body)], meta) });
      index += 1;
      continue;
    }

    results.push({ cell, html: renderHtml(docs[index], { meta, footnotes: false, fragment: true }) });
    index += 1;
  }

  if (state.references.length) {
    results.push({ cell: null, html: renderNodes([N.references(state.references)], meta) });
  }
  if (state.footnotes.length) {
    results.push({ cell: null, html: renderFootnotes(meta) });
  }

  // 所有格共用一个 .laup2 容器：每格各自套 <article> 会带上一整套页面 padding，
  // 页面上表现为格与格之间出现巨大空白。
  const html = `<article class="laup2">\n${results
    .map((item) => item.html)
    .filter(Boolean)
    .join("\n")}\n</article>`;

  return {
    html,
    cells: results,
    variables,
    references: state.references,
    footnotes: state.footnotes,
    toc: state.toc,
    diagnostics,
  };
}
