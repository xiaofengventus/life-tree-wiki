// AST → HTML。
//
// ⚠️ 一个有意为之的设计：**Image 节点不记录"来自 md 还是 Laup"**。
// 靠位置区分渲染形状——顶层 Image → 块级 <figure>；行内 Image → <img>。
// 于是 `\image=[…]` 与 md `![](…)` 共享同一个节点，却各得其所。
//
// ⚠️ 这里只认**通用语法**。站点专属的元素（研究树嵌入、代码案例、文献引用…）由宿主
// 扩展在 extensions/ 里自己渲染，本文件只负责按声明的节点 type 把活派过去 ——
// 核心不认识那些 type，也不该认识（机制见 src/extensions.js）。

import { plainText, slugify } from './ast.js';
import { parseInline } from './inline.js';
import { safeUrl } from './safeUrl.js';
import { esc } from './escape.js';
import {
  claimCore, createExtStates, lookupBlockRenderer, lookupInlineRenderer,
  runFinish, runSetup,
} from './extensions.js';

// 表格对齐：源里是**每列一个字母**（`\table=[ align="lrc" ]`，md 的 `:---:` 也归一到同一形状），
// 所以取到单个格子时是 `'l'` / `'c'` / `'r'`。
// ⚠️ 这里必须翻译成 CSS 关键字：直接把字母拼进 `text-align:` 会得到 `text-align: l` ——
// 一句无效声明，浏览器静默忽略，**表格对齐从来没有生效过**。
// （这个 bug 是白名单自检抓出来的：`l` 不在允许的取值形状里。靠眼睛看是看不出来的，
// 因为无效 CSS 不报错、不显示、也不影响任何测试。）**
const ALIGN_CSS = { l: 'left', c: 'center', r: 'right' };

function alignValue(raw) {
  const key = String(raw || '').trim().toLowerCase();
  if (ALIGN_CSS[key]) return ALIGN_CSS[key];
  // 已经写成关键字也认（数据块里可能有人直接写 left）
  return ['left', 'right', 'center'].includes(key) ? key : '';
}

// 行内样式都写成 inline style —— 取值形状由 Laup 自己的白名单（src/whitelist.js）定义，
// 不跟随任何外部编辑器。颜色/字号在解析期就已被 inline.js 校验过一轮，这里是第二道。
function styleOf(node) {
  const parts = [];
  if (node.color) parts.push(`color:${node.color}`);
  if (node.bg) parts.push(`background-color:${node.bg}`);
  if (node.size) parts.push(`font-size:${node.size}px`);
  const align = alignValue(node.align);
  if (align) parts.push(`text-align:${align}`);
  return parts.length ? ` style="${esc(parts.join(';'))}"` : '';
}

// 核心认的节点类型 —— 用来挡住"扩展想占用核心已经实现的名字"这种静默遮蔽。
// 与下面的 switch 是同一份事实的两种写法，故意留着：名单漂了只是少拦一次，
// 不会改变任何渲染结果。
const CORE_BLOCK_TYPES = [
  'Heading', 'Para', 'Quote', 'Center', 'Hr', 'LineBreak', 'Toc', 'Raw', 'Broken',
  'CodeBlock', 'Image', 'Math', 'Equation', 'List', 'Table', 'Footnote',
];
const CORE_INLINE_TYPES = [
  'Text', 'Code', 'Strong', 'Emph', 'Del', 'Underline', 'Color', 'Size', 'Link',
  'Image', 'Math', 'LineBreak', 'EqRef', 'Footnote',
];
claimCore('blockType', CORE_BLOCK_TYPES, 'core/renderHtml.js');
claimCore('inlineType', CORE_INLINE_TYPES, 'core/renderHtml.js');

function collectAll(doc) {
  const headings = [];
  const eqNumbers = new Map();
  const slugSeen = new Map();
  let eq = 0;

  (function visit(node) {
    if (node.type === 'Heading') {
      const text = plainText(node.children);
      const base = slugify(text);
      const c = (slugSeen.get(base) || 0) + 1;
      slugSeen.set(base, c);
      node.slug = c > 1 ? `${base}-${c}` : base;
      headings.push({ level: node.level, text, slug: node.slug });
    } else if (node.type === 'Equation') {
      eq += 1;
      node.number = eq;
      if (node.id) eqNumbers.set(node.id, eq);
    }
    if (node.type === 'List') node.items.forEach(visit);
    else if (Array.isArray(node.children)) node.children.forEach(visit);
  })(doc);

  return { headings, eqNumbers };
}

export function renderHtml(doc, opts = {}) {
  const { headings, eqNumbers } = collectAll(doc);
  const warn = opts.warn || (() => {});
  const idPrefix = opts.idPrefix || '';

  // 扩展状态：每次渲染一份。编号计数器、跨块集合这类东西**不能挂在扩展闭包上** ——
  // 同一篇文档可能在同一张页面上渲染两次（编辑器的正文与"整篇渲染结果"浮层），
  // 挂在闭包上第二次就会从中间接着数。
  const extStates = createExtStates();

  const ctx = {
    headings,
    eqNumbers,
    // 站内锚点的 id 前缀。⚠️ 同一篇文档可能**在同一张页面上渲染两次**
    // （编辑器的正文 #doc 与"整篇渲染结果"浮层），不区分前缀就会 id 重复 →
    // `getElementById` 只认文档里最先那个 → 在浮层里点目录会跳到被浮层盖住的正文上，
    // 浮层自己一动不动，看着就是"点了没反应"（CDP 真鼠标探测发现的）。
    // 所以对外再渲染一份时必须给不同的前缀。
    aid: (x) => idPrefix + x,
    footnotes: [],
    extState: (name) => extStates.get(name),
    opts,
    warn,
  };

  // 扩展的"渲染前"：这时能看到整篇，跨块信息（文献共几条、编号从哪开始）在这里定下来。
  // 放在渲染之前而不是之后，因为渲染期就要用它去校验 \cite 的序号。
  runSetup(extStates, doc, ctx);

  // 逐块渲染并保留「哪块对哪块」的对应关系 —— 编辑器要用（见 editor/）。
  // ⚠️ 分块输出**不会**让公式编号或脚注序号从头开始：collectAll 在整篇上跑，
  // ctx 也是共享的，整篇仍然只渲染一次，只是把结果按块分开交出来。
  const parts = doc.children
    .map((node) => ({ node, html: renderBlock(node, ctx) }))
    .filter((p) => p.html);
  const footnotesHtml = ctx.footnotes.length ? renderFootnotes(ctx.footnotes, ctx) : '';
  const body = parts.map((p) => p.html).join('\n');

  // 扩展的"渲染后"：反向校验这类事情需要整篇渲染完才知道（例如"有条目却从没被引用"）。
  runFinish(extStates, ctx);

  return {
    html: body + footnotesHtml,
    parts,
    footnotesHtml,
    headings,
    footnotes: ctx.footnotes.length,
  };
}

function renderBlock(node, ctx) {
  switch (node.type) {
    case 'Heading': {
      const tag = `h${Math.min(6, node.level)}`;
      return `<${tag} id="${esc(ctx.aid(node.slug))}">${renderInline(node.children, ctx)}</${tag}>`;
    }
    case 'Para':
      return `<p>${renderInline(node.children, ctx)}</p>`;
    case 'Quote':
      return `<blockquote>\n${node.children.map((c) => renderBlock(c, ctx)).join('\n')}\n</blockquote>`;
    case 'Center':
      return `<div class="laup-center">\n${node.children.map((c) => renderBlock(c, ctx)).join('\n')}\n</div>`;
    case 'Hr':
      return '<hr>';
    case 'LineBreak':
      return '<br>';
    case 'Toc':
      return renderToc(ctx);
    case 'Raw':
      return node.html;
    case 'Broken':
      // 只在编辑期出现（写了一半的语法）。原样输出源码并带上诊断，界面标红。
      // 正常编译永远走不到这里 —— 那时是直接抛错的。
      return `<div class="laup-broken" data-message="${esc(node.message)}">${esc(node.src)}</div>`;
    case 'CodeBlock':
      return `<pre><code${node.lang ? ` class="language-${esc(node.lang)}"` : ''}>${esc(node.value)}</code></pre>`;
    case 'Image':
      return renderFigure(node, ctx);
    case 'Math':
      if (node.display) return renderMath(node, ctx, true);
      return `<p>${renderMath(node, ctx, false)}</p>`;
    case 'Equation':
      return renderEquation(node, ctx);
    case 'List':
      return renderList(node, ctx);
    case 'Table':
      return renderTable(node, ctx);
    // Citation 正常只出现在行内；顶层出现时按段落处理（容错）
    case 'Footnote':
      return `<p>${renderInline([node], ctx)}</p>`;
    default: {
      // 宿主扩展的块算这里。核心不认识 type，只按扩展声明的名字派活。
      const ext = lookupBlockRenderer(node.type);
      if (ext) return ext(node, ctx);
      // 走到这里 = 有个块级节点谁都不认。最可能的原因是**产出它的扩展没装**
      // （例如 `\tree=[…]` 编译出来了，但没人渲染 Tree）。
      // 静默丢掉会让整篇看起来少了一节却毫无提示，所以明确报出来。
      if (!Array.isArray(node.children)) {
        ctx.warn(`节点类型 ${node.type} 没有渲染器 —— 产出它的扩展装了没？`);
        return '';
      }
      return `<p>${renderInline([node], ctx)}</p>`;
    }
  }
}

function renderList(node, ctx) {
  const tag = node.ordered ? 'ol' : 'ul';
  const attr = node.ordered && node.start !== 1 ? ` start="${node.start}"` : '';
  const inner = node.items
    .map((it) => {
      const cls = it.checked === null ? '' : ' class="laup-task"';
      const box = it.checked === null
        ? ''
        : `<input type="checkbox" disabled${it.checked ? ' checked' : ''}> `;
      // 紧凑列表：单个段落直接摊平，不套 <p>
      const kids = it.children.length === 1 && it.children[0].type === 'Para'
        ? renderInline(it.children[0].children, ctx)
        : it.children.map((c) => renderBlock(c, ctx)).join('\n');
      return `<li${cls}>${box}${kids}</li>`;
    })
    .join('\n');
  return `<${tag}${attr}>\n${inner}\n</${tag}>`;
}

function renderTable(node, ctx) {
  const aligns = node.align || '';
  const th = node.columns
    .map((c, k) => `<th${styleOf({ align: aligns[k] })}>${renderInline(parseCell(c, ctx), ctx)}</th>`)
    .join('');
  const trs = node.rows
    .map((row) => {
      const tds = row
        .map((c, k) => `<td${styleOf({ align: aligns[k] })}>${renderInline(parseCell(c, ctx), ctx)}</td>`)
        .join('');
      return `<tr>${tds}</tr>`;
    })
    .join('\n');
  const cap = node.caption
    ? `<caption>${renderInline(parseCell(node.caption, ctx), ctx)}</caption>`
    : '';
  return `<table>\n${cap}<thead><tr>${th}</tr></thead>\n<tbody>\n${trs}\n</tbody>\n</table>`;
}

// 单元格里允许行内标记与数学（数据块的字符串元素本身不递归，但行内标记照收）
function parseCell(text, ctx) {
  return parseInline(String(text), ctx);
}

function renderFigure(node, ctx) {
  // 同 renderInline 的 Image 分支：src 必须过 safeUrl（esc 不看协议）。
  const src = safeUrl(node.src, { kind: 'image' });
  if (!src) {
    // 块级图片没有 src 就只是个空图框，不如退成"图注 + 说明"。
    ctx.warn(`图片地址不安全，已按文字渲染：${String(node.src || '').slice(0, 60)}`);
    const label = node.caption || node.alt || '';
    return `<figure><figcaption>${renderInline(parseCell(label, ctx), ctx)}</figcaption></figure>`;
  }
  const img = `<img src="${esc(src)}" alt="${esc(node.alt)}"${node.title ? ` title="${esc(node.title)}"` : ''} loading="lazy">`;
  if (!node.caption) return `<figure>${img}</figure>`;
  // 图注走行内渲染（与表格 caption 同款）：行内标记、\cite、\math 等都可用
  return `<figure>${img}<figcaption>${renderInline(parseCell(node.caption, ctx), ctx)}</figcaption></figure>`;
}

function renderMath(node, ctx, display) {
  const cls = display ? 'laup-math-display' : 'laup-math';
  const tag = display ? 'div' : 'span';
  return `<${tag} class="${cls}" data-tex="${esc(node.tex)}">${esc(node.tex)}</${tag}>`;
}

function renderEquation(node, ctx) {
  const id = node.number;
  return `<div class="laup-equation" id="${esc(ctx.aid(`eq-${id}`))}">`
    + `<span class="laup-math-display" data-tex="${esc(node.tex)}">${esc(node.tex)}</span>`
    + `<span class="laup-eq-no">(${id})</span></div>`;
}

// 目录：扁平 <ul> + 按层级加 class，缩进交给 CSS。
// （嵌套 <ul> 的 <li> 配对容易出 off-by-one，扁平结构等价且不会错。）
function renderToc(ctx) {
  const { headings } = ctx;
  if (!headings.length) return '';
  const items = headings
    .map((h) => {
      const lv = Math.max(1, Math.min(6, h.level));
      return `<li class="laup-toc-l${lv}"><a href="#${esc(ctx.aid(h.slug))}">${esc(h.text)}</a></li>`;
    })
    .join('\n');
  return `<nav class="laup-toc">\n<div class="laup-toc-title">目录</div>\n<ul>\n${items}\n</ul>\n</nav>`;
}

function renderFootnotes(list, ctx) {
  const items = list
    .map((f, k) => `<li id="${esc(ctx.aid(`fn-${k + 1}`))}">${renderInline(f.children, f.ctx)}</li>`)
    .join('\n');
  return `\n<section class="laup-footnotes">\n<hr>\n<ol>\n${items}\n</ol>\n</section>`;
}

export function renderInline(nodes, ctx) {
  let out = '';
  for (const n of nodes || []) {
    switch (n.type) {
      case 'Text': out += esc(n.value); break;
      case 'Code': out += `<code>${esc(n.value)}</code>`; break;
      case 'Strong': out += `<strong>${renderInline(n.children, ctx)}</strong>`; break;
      case 'Emph': out += `<em>${renderInline(n.children, ctx)}</em>`; break;
      case 'Del': out += `<del>${renderInline(n.children, ctx)}</del>`; break;
      case 'Underline': out += `<u>${renderInline(n.children, ctx)}</u>`; break;
      case 'Color':
      case 'Size':
        out += `<span${styleOf(n)}>${renderInline(n.children, ctx)}</span>`;
        break;
      case 'Link': {
        // ⚠️ 必须过 safeUrl：esc() 只管字符转义，不看协议 ——
        // 直接把 href 交给 esc 会让 `[x](javascript:…)` 变成一个可点的脚本链接。
        const href = safeUrl(n.href);
        if (href) {
          out += `<a href="${esc(href)}">${renderInline(n.children, ctx)}</a>`;
        } else {
          // 降级：**保留文字、去掉链接**。作者在阅读端看到"点了没反应"就知道地址没通过，
          // 比整篇渲染失败或塞一个坏标记都更不打搅。
          ctx.warn(`链接地址不安全，已按纯文字渲染：${String(n.href || '').slice(0, 60)}`);
          out += renderInline(n.children, ctx);
        }
        break;
      }
      case 'Image': {
        const src = safeUrl(n.src, { kind: 'image' });
        // 图片不安全的降级与链接不同：`<img>` 没有文字可留，去掉 src 就是个碎图标，
        // 所以直接退成 alt 文字 —— 版面还在，也看得出这里本来有张图。
        out += src
          ? `<img src="${esc(src)}" alt="${esc(n.alt)}" loading="lazy">`
          : esc(n.alt);
        break;
      }
      case 'Math': out += renderMath(n, ctx, false); break;
      case 'LineBreak': out += '<br>'; break;
      case 'EqRef': {
        const num = ctx.eqNumbers.get(n.id);
        if (!num) {
          ctx.warn(`\\eqref{${n.id}} 找不到对应的公式编号`);
          out += `<span class="laup-eqref-bad">(?)</span>`;
        } else {
          out += `<a class="laup-eqref" href="#${esc(ctx.aid(`eq-${num}`))}">(${num})</a>`;
        }
        break;
      }
      case 'Footnote': {
        ctx.footnotes.push({ children: n.children, ctx });
        out += `<sup class="laup-fn-ref">${ctx.footnotes.length}</sup>`;
        break;
      }
      default: {
        // 宿主扩展的行内节点（`\cite{1}` 之类）走这里。
        const ext = lookupInlineRenderer(n.type);
        if (ext) { out += ext(n, ctx); break; }
        out += n.children ? renderInline(n.children, ctx) : '';
      }
    }
  }
  return out;
}
