/**
 * Laup v2 —— 语义 pass（分两阶段，支持跨格共享状态）。
 *
 *   collectSemantics(doc, state)   编号与收集：标题 id、公式号、脚注号、文献条目
 *   resolveSemantics(doc, opts)    回填：变量、\eqref、\cite
 *
 * 拆成两阶段的原因：`\eqref` / `\cite` 可能引用**后面**的格，必须等全篇编号完再回填。
 * `state` 可以在多个文档间共享，Cells 层靠它实现「脚注 / 公式 / 文献跨格连续」。
 */

import { N, plainText, slugify } from "./ast.js";

/**
 * @param {{ bib?: Map<string, object> }} options 项目文献库：键 → 条目
 */
export function createSemanticState(options = {}) {
  const bib = options.bib instanceof Map ? options.bib : new Map();
  const citeOrder = new Map(); // 键 → 引用序号（首次引用时分配）
  const cited = [];            // 按编号排列的已引用条目
  return {
    slugSeen: new Map(),
    equationNo: 0,
    footnoteNo: 0,
    equationNumbers: new Map(),
    toc: [],
    footnotes: [],
    bib,
    cited,
    /** 键数组 → [{ key, number, id, entry }]；库里没有的键不分配编号（由调用方报诊断）。 */
    resolveCite(keys) {
      const out = [];
      for (const key of keys) {
        const entry = bib.get(key);
        if (!entry) continue;
        if (!citeOrder.has(key)) {
          const number = cited.length + 1;
          citeOrder.set(key, number);
          cited.push({ key, number, id: `ref-${slugify(key) || number}`, entry });
        }
        const rec = cited[citeOrder.get(key) - 1];
        if (!out.includes(rec)) out.push(rec);
      }
      return out;
    },
  };
}

/** 复合块的行内节点挂在 attrs 上（不是 children），语义 pass 也要走进去 */
function mapAttrInlines(node, fn) {
  if (node.type === "Card") {
    if (Array.isArray(node.attrs.name)) node.attrs.name = node.attrs.name.map(fn).filter(Boolean);
    if (Array.isArray(node.attrs.rows)) {
      node.attrs.rows = node.attrs.rows.map((row) => ({
        ...row,
        value: Array.isArray(row.value) ? row.value.map(fn).filter(Boolean) : row.value,
      }));
    }
  }
  if (node.type === "Todo" && Array.isArray(node.attrs.items)) {
    node.attrs.items = node.attrs.items.map((item) => ({
      ...item,
      text: Array.isArray(item.text) ? item.text.map(fn).filter(Boolean) : item.text,
    }));
  }
  if (node.type === "Table") {
    if (Array.isArray(node.attrs.head)) {
      node.attrs.head = node.attrs.head.map((cell) => cell.map(fn).filter(Boolean));
    }
    if (Array.isArray(node.attrs.rows)) {
      node.attrs.rows = node.attrs.rows.map((row) => row.map((cell) => cell.map(fn).filter(Boolean)));
    }
  }
  return node;
}

/** 第一阶段：分配编号、收集目录 / 脚注 / 文献 */
export function collectSemantics(doc, state = createSemanticState(), options = {}) {
  const collectReferences = options.collectReferences === true;

  const assign = (node) => {
    if (!node) return node;

    if (node.type === "Heading") {
      const base = slugify(plainText(node));
      const count = (state.slugSeen.get(base) || 0) + 1;
      state.slugSeen.set(base, count);
      const id = count > 1 ? `${base}-${count}` : base;
      node.attrs.id = id;
      state.toc.push({ level: node.attrs.level, text: plainText(node), id });
    }

    if (node.type === "Equation") {
      state.equationNo += 1;
      node.attrs.number = state.equationNo;
      if (node.attrs.id) state.equationNumbers.set(node.attrs.id, state.equationNo);
    }

    if (node.type === "FootnoteRef") {
      state.footnoteNo += 1;
      node.attrs.number = state.footnoteNo;
      state.footnotes.push({ number: state.footnoteNo, children: node.children || [] });
    }

    if (Array.isArray(node.children)) {
      node.children = node.children.map(assign).filter(Boolean);
    }
    if (node.type === "Env" && Array.isArray(node.attrs.value)) {
      node.attrs.value = node.attrs.value.map(assign).filter(Boolean);
    }
    mapAttrInlines(node, assign);
    return node;
  };

  assign(doc);
  return state;
}

/** 第二阶段：把占位节点换成最终内容（变量、公式引用、文献引用） */
export function resolveSemantics(doc, options = {}) {
  const state = options.state || createSemanticState();
  const variables = options.variables || {};
  const report = options.report || { warn() {} };

  const resolve = (node) => {
    if (!node) return node;

    if (node.type === "Var") {
      const name = node.attrs.name;
      if (Object.prototype.hasOwnProperty.call(variables, name)) {
        return N.text(String(variables[name]));
      }
      report.warn("E_VAR_MISSING", `变量 {{${name}}} 没有值，已原样保留`);
      return N.text(`{{${name}}}`);
    }

    if (node.type === "EqRef") {
      const number = state.equationNumbers.get(node.attrs.id);
      if (number) {
        node.attrs.number = number;
      } else {
        report.warn("E_EQREF_MISSING", `\\eqref{${node.attrs.id}} 找不到对应公式`);
      }
    }

    if (node.type === "Cite") {
      // 键式引用：在项目文献库（references.bib）里按键查；编号按"正文首次引用顺序"分配，
      // 与 BibTeX 一致 —— 库里有 100 条，也只编被引用的那些。
      const keys = node.attrs.ids || [];
      node.attrs.items = state.resolveCite(keys);
      const missing = keys.filter((key) => !node.attrs.items.some((item) => item.key === key));
      if (missing.length) {
        report.warn(
          "E_CITE_KEY",
          state.bib.size === 0
            ? `\\cite{${missing.join(",")}} 找不到文献：当前文档还没有 references.bib`
            : `\\cite 里这些键不在 references.bib：${missing.join(", ")}`,
        );
      }
    }

    if (Array.isArray(node.children)) node.children = node.children.map(resolve).filter(Boolean);
    if (node.type === "Env" && Array.isArray(node.attrs.value)) {
      node.attrs.value = node.attrs.value.map(resolve).filter(Boolean);
    }
    mapAttrInlines(node, resolve);
    return node;
  };

  resolve(doc);
  return doc;
}

/** 单文档便捷入口：两个阶段跑一遍 */
export function applySemantics(doc, options = {}) {
  const state = options.state || createSemanticState();
  const report = options.report || { warn() {} };

  collectSemantics(doc, state, { report, collectReferences: false });
  resolveSemantics(doc, { state, variables: options.variables || {}, report });

  return {
    toc: state.toc,
    footnotes: state.footnotes,
    equations: state.equationNo,
    references: state.references.length,
    diagnostics: options.diagnostics || [],
  };
}
