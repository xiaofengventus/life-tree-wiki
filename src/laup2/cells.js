/**
 * Laup v2 —— 单元格层。
 *
 * 内核只处理传入的一份源码；这一层把源码拆成格、识别格类型、
 * 合并输入/输出案例卡，并让语义在这份源码的格之间连续。
 * 宿主若逐个传入 Jupyter cell，则每个 cell 都是独立作用域，不会跨宿主 cell 共享状态。
 *
 * 以下是文档内的首行声明，不是宿主的编辑格类型：
 *   [input]            输入栏（纯文本，不声明语言）
 *   [output]           输出栏（纯文本，不声明语言）
 *   [cpp] 等            展示型代码，语言就是方括号里的名字
 *   [references]      参考文献格（一行一条）
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
const CODE_MAGIC = /^%%(cpp|cxx)(?=[ \t]|$)/i;

/** @typedef {{ type: 'laup'|'code', source: string, lang?: string }} CellInput */

/**
 * 字符串按 Laup 分隔符拆格；数组由宿主提供格边界与类型。
 * @param {string|CellInput[]} source
 * @returns {Array<object>}
 */
export function parseCells(source) {
  if (Array.isArray(source)) {
    return source.map((cell) => {
      const text = String(cell.source ?? "");
      if (cell.type === "laup") {
        return { ...classifyCell(text.replace(/\r\n?/g, "\n")), sourceType: "laup" };
      }
      if (cell.type !== "code") throw new TypeError(`未知的格类型：${cell.type}`);

      // 保留魔法命令以及完整代码文本，只标记展示语言，不执行。
      const firstLine = text.split(/\r\n?|\n/, 1)[0];
      const lang = CODE_MAGIC.test(firstLine) ? "cpp" : (cell.lang || "python");
      return { type: "code", sourceType: "code", pane: null, lang, source: text, body: text };
    });
  }

  const lines = String(source ?? "").replace(/\r\n?/g, "\n").split("\n");
  const groups = [[]];
  let skippingBreak = false;
  let fence = null;

  for (const line of lines) {
    if (skippingBreak) {
      if (/^[ \t]*\][ \t]*$/.test(line)) skippingBreak = false;
      continue;
    }

    // 围栏代码块内部不切格：代码格的正文必须原样保留
    const open = /^[ \t]{0,3}(`{3,}|~{3,})/.exec(line);
    const close = /^[ \t]{0,3}(`{3,}|~{3,})[ \t]*$/.exec(line);
    if (fence) {
      if (close && close[1][0] === fence[0] && close[1].length >= fence.length) fence = null;
      groups[groups.length - 1].push(line);
      continue;
    }
    if (open) {
      fence = open[1];
      groups[groups.length - 1].push(line);
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

// v2 已经没有这些首行声明了：出现时把整格当正文（`[cpp]` 这类真语言声明照旧成立），
// 并给一条提示，免得作者以为"写上去就该生效"。
const RESERVED_DECLS = {
  var: "[var] 已经没有变量格了：正文写 {{name}}，值由宿主传入",
  references: "[references] 已经没有文献格了：现在用 \\cite{key} + references.bib",
};

function classifyCell(source) {
  const firstLine = source.split("\n")[0] ?? "";
  const head = firstLine.trim();

  const declared = LANG_DECL.exec(head);
  if (declared) {
    const name = declared[1].toLowerCase();
    if (RESERVED_DECLS[name]) return { type: "laup", source, reservedDecl: RESERVED_DECLS[name] };
    const body = source.slice(firstLine.length).replace(/^\n/, "");
    // [input] / [output] 不是原生代码，是 Laup 格里的对照示例栏
    if (name === "input" || name === "output") return { type: "laup", pane: name, source, body };
    return { type: "code", pane: null, lang: name, source, body };
  }

  return { type: "laup", source };
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
 * 渲染传入的一份 Laup 源码。
 *
 * 传入源码内部可用 `\cellbreak` 分格并共享本次调用的语义状态；
 * 不同调用之间不会共享变量、文献、脚注或公式编号。
 *
 * @param {string|CellInput[]} source
 * @param {{ variables?: Record<string, unknown>, mathDelimiters?: 'dollar'|'jupyter', mathOutput?: 'source', allowAttachment?: boolean, referencePool?: string[], showReferences?: boolean }} options
 */
export function typesetCells(source, options = {}) {
  const cells = parseCells(source);
  const diagnostics = [];
  const report = createDiagnostics(diagnostics);

  const variables = { ...options.variables };

  // ② 解析所有 Laup 格
  const docs = cells.map((cell) => {
    if (cell.type !== "laup") return null;
    if (cell.reservedDecl) report.warn("W_LEGACY_DECL", cell.reservedDecl);
    const { doc, diagnostics: parseDiagnostics } = parse(cell.source, {
      mathDelimiters: options.mathDelimiters,
    });
    diagnostics.push(...parseDiagnostics);
    return doc;
  });

  // ③ 收集阶段：编号、目录、脚注（跨格共享）。文献不在正文里，来自项目级 references.bib。
  const state = createSemanticState({ bib: options.bib });

  // 宿主逐格预览时，把"已渲染过的格"里出现过的文献带过来，保证编号接得上。
  // 传进来的是 [{ key, entry }]，这里原样恢复编号顺序。
  for (const item of options.citedReferences || []) {
    if (item?.key && item.entry) state.resolveCite([item.key]);
  }

  cells.forEach((cell, index) => {
    if (docs[index]) collectSemantics(docs[index], state, { report });
  });

  // ④ 回填阶段：使用宿主传入的变量、文献库与引用编号
  cells.forEach((cell, index) => {
    if (docs[index]) {
      resolveSemantics(docs[index], { state, variables, report });
    }
  });

  // ⑤ 渲染：格内容按顺序，脚注与文献各输出一次（文末）
  const meta = {
    toc: state.toc,
    footnotes: state.footnotes,
    allowAttachment: options.allowAttachment === true,
    mathSource: options.mathOutput === "source",
  };
  const results = [];
  let index = 0;

  while (index < cells.length) {
    const cell = cells[index];

    if (cell.pane === "input") {
      const panes = [paneNode("input", cell)];
      const next = cells[index + 1];
      if (next && next.pane === "output") {
        panes.push(paneNode("output", next));
        index += 1;
      }
      results.push({ cell, html: renderNodes([N.sample(panes)], meta) });
      index += 1;
      continue;
    }

    if (cell.pane === "output") {
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

  // 文献表只列被引用过的条目，按引用顺序编号
  if (state.cited.length && options.showReferences !== false) {
    results.push({ cell: null, html: renderNodes([N.references(state.cited)], meta) });
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
    references: state.cited,
    footnotes: state.footnotes,
    toc: state.toc,
    diagnostics,
  };
}
