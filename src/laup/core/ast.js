// Laup AST —— 唯一真相。
//
// 一条硬性质（规范 §12）：**AST 里不记录"这段是用 md 还是 Laup 写的"**。
// 所以 `Table` 节点只有一个（`\table=[…]` 与管道式都编译到它），
// `Image` 节点也只有一个（`![]()` 与 `\image=[…]` 都编译到它）。

export const N = {
  doc: (children) => ({ type: 'Doc', children }),

  heading: (level, children) => ({ type: 'Heading', level, children }),
  para: (children) => ({ type: 'Para', children }),
  quote: (children) => ({ type: 'Quote', children }),
  center: (children) => ({ type: 'Center', children }),
  hr: () => ({ type: 'Hr' }),
  toc: () => ({ type: 'Toc' }),
  linebreak: () => ({ type: 'LineBreak' }),
  raw: (html) => ({ type: 'Raw', html }),
  // 容错模式的产物：语法还没写完整的一块，原样保留源码 + 诊断。
  // ⚠️ 只在 mode:'edit' 下出现。正常编译一律 throw —— 不会静默产出它，
  // 否则"编译通过"就失去意义了。见 scanner.js 的 scanBlocks。
  broken: (src, err) => ({
    type: 'Broken',
    src,
    message: (err && err.message) || String(err),
    hint: (err && err.hint) || '',
  }),

  list: (ordered, items, start) => ({
    type: 'List',
    ordered: !!ordered,
    start: start || 1,
    items,
  }),
  item: (children, checked) => ({
    type: 'Item',
    checked: checked === undefined ? null : checked,
    children,
  }),

  codeBlock: (lang, value) => ({ type: 'CodeBlock', lang: lang || '', value }),

  // ⚠️ 站点专属的节点形状（研究树嵌入、代码案例、文献引用…）**不在这里**。
  // 它们由宿主扩展自己定义 —— 核心不认识它们，也不该认识。
  // 机制见 src/extensions.js，参考实现见 extensions/life.js。

  table: (columns, rows, opts) => ({
    type: 'Table',
    columns,
    rows,
    caption: (opts && opts.caption) || '',
    align: (opts && opts.align) || '',
  }),

  image: (src, opts) => ({
    type: 'Image',
    src,
    alt: (opts && opts.alt) || '',
    caption: (opts && opts.caption) || '',
    title: (opts && opts.title) || '',
  }),

  math: (tex, display) => ({ type: 'Math', tex, display: !!display }),
  equation: (id, tex) => ({ type: 'Equation', id: id || null, tex, number: null }),
  eqref: (id) => ({ type: 'EqRef', id }),

  // `\begin{stay}`：整块原样输出（不解析任何行内语法）
  stay: (text) => ({ type: 'Stay', text }),
  // `\begin{stay-line}`：只保留换行，每行的行内语法照常解析
  stayLine: (lines) => ({ type: 'StayLine', lines }),

  footnote: (children) => ({ type: 'Footnote', children }),

  text: (value) => ({ type: 'Text', value }),
  strong: (children) => ({ type: 'Strong', children }),
  emph: (children) => ({ type: 'Emph', children }),
  del: (children) => ({ type: 'Del', children }),
  underline: (children) => ({ type: 'Underline', children }),
  color: (color, bg, children) => ({ type: 'Color', color, bg, children }),
  size: (size, children) => ({ type: 'Size', size, children }),
  code: (value) => ({ type: 'Code', value }),
  link: (href, children) => ({ type: 'Link', href, children }),
};

// 可以承载行内子节点的节点类型（用于遍历与纯文本提取）
const CONTAINER = new Set([
  'Doc', 'Heading', 'Para', 'Quote', 'Center', 'Item', 'List',
  'Strong', 'Emph', 'Del', 'Underline', 'Color', 'Size', 'Link', 'Footnote',
]);

export function walk(node, visit) {
  visit(node);
  if (!CONTAINER.has(node.type)) return;
  const kids = node.type === 'List'
    ? node.items
    : node.children || (node.children === undefined ? [] : node.children);
  for (const child of kids || []) walk(child, visit);
}

// 行内节点数组 → 纯文本（做锚点 id、目录、图片 alt 兜底都要用）
export function plainText(nodes) {
  let out = '';
  for (const n of nodes || []) {
    switch (n.type) {
      case 'Text': out += n.value; break;
      case 'Code': out += n.value; break;
      case 'Math': out += n.tex; break;
      case 'Image': out += n.alt; break;
      case 'LineBreak': out += ' '; break;
      case 'EqRef': out += `(${n.id})`; break;
      default:
        if (n.children) out += plainText(n.children);
        else if (n.items) out += n.items.map((it) => plainText(it.children)).join(' ');
    }
  }
  return out;
}

// 生成锚点 id：中文保留，空白转 -，去掉标点
export function slugify(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'section';
}
