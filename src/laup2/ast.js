/**
 * Laup v2 —— 类型化 AST。
 *
 * 所有节点都是同一个形状：
 *   { type, attrs?, children?, span: [start, end] }
 * `span` 是源码行号区间（1-based，闭区间），用于诊断定位。
 *
 * 与 v1 的区别：
 *   - 节点类型集中在这里，渲染器只按 type 分派；
 *   - 块级 / 行内节点不再靠"渲染时顺手拼字符串"产生；
 *   - 环境节点（Env）保留原始内容，由语义层决定如何展开。
 */

const node = (type, attrs = {}, children = null) => ({ type, attrs, children, span: null });

export const N = {
  // ── 文档
  doc: (children) => node("Doc", {}, children),

  // ── 块级
  heading: (level, children) => node("Heading", { level }, children),
  para: (children) => node("Para", {}, children),
  list: (ordered, start, items) => node("List", { ordered, start }, items),
  item: (children) => node("Item", {}, children),
  quote: (children) => node("Quote", {}, children),
  center: (children) => node("Center", {}, children),
  code: (lang, value) => node("Code", { lang, value }),
  /** 输入/输出案例卡：panes = [{ kind:'input'|'output', value }]（纯文本，无语言） */
  sample: (panes) => node("Sample", { panes }),
  hr: () => node("Hr"),
  math: (tex, display) => node("Math", { tex, display }),
  equation: (id, tex) => node("Equation", { id, tex, number: null }),
  image: (src, opts = {}) =>
    node("Image", {
      src,
      alt: opts.alt || "",
      caption: opts.caption || "",
      title: opts.title || "",
    }),
  /** 文档封面：独立于正文图片，渲染成通栏大图 */
  cover: (src, caption = "") => node("Cover", { src, caption }),
  table: (data) =>
    node("Table", {
      caption: data.caption || "",
      align: data.align || "",
      head: data.head || [],
      rows: data.rows || [],
    }),
  toc: () => node("Toc"),
  references: (entries) => node("References", { entries }),
  /** 待办清单：items = [{ done, text }] */
  todo: (items) => node("Todo", { items }),
  /** 分类卡：name 是行内节点数组，color 是主题色，rows = [{ label, value: 行内节点[] }] */
  card: (name, color, rows) => node("Card", { name, color, rows }),
  /** 研究树嵌入：id 是站内研究树 uid；title 可选 */
  treeEmbed: (id, opts = {}) => node("TreeEmbed", { id, title: opts.title || "" }),
  /** 环境节点：mode 决定 body 的展开方式，见 registry.js */
  env: (name, mode, value) => node("Env", { name, mode, value }),
  /** 语法错误/未知命令：保留源码，不静默丢弃 */
  broken: (message, src) => node("Broken", { message, src }),
  footnotes: (items) => node("Footnotes", {}, items),

  // ── 行内
  text: (value) => node("Text", { value }),
  strong: (children) => node("Strong", {}, children),
  em: (children) => node("Em", {}, children),
  del: (children) => node("Del", {}, children),
  underline: (children) => node("Underline", {}, children),
  codeInline: (value) => node("CodeInline", { value }),
  link: (href, children, title = "") => node("Link", { href, title }, children),
  color: (color, bg, children) => node("Color", { color, bg }, children),
  size: (size, children) => node("Size", { size }, children),
  footnoteRef: (children) => node("FootnoteRef", {}, children),
  eqRef: (id) => node("EqRef", { id, number: null }),
  cite: (ids) => node("Cite", { ids, numbers: [] }),
  varRef: (name) => node("Var", { name }),
  br: () => node("Break"),
};

/** 遍历所有子节点（块级 + 行内统一处理） */
export function walk(n, visit) {
  if (!n) return;
  visit(n);
  if (Array.isArray(n.children)) n.children.forEach((child) => walk(child, visit));
}

/** 纯文本提取（标题 slug、摘要用） */
export function plainText(n) {
  if (!n) return "";
  if (n.type === "Text") return n.attrs.value;
  if (n.type === "Break") return " ";
  if (n.type === "CodeInline") return n.attrs.value;
  if (n.type === "Math") return n.attrs.tex;
  if (n.type === "Var") return `{{${n.attrs.name}}}`;
  return Array.isArray(n.children) ? n.children.map(plainText).join("") : "";
}

/** 生成锚点 id：保留中文，其余转连字符 */
export function slugify(text) {
  const base = String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "");
  return base || "section";
}
