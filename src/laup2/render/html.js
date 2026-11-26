/**
 * Laup v2 —— HTML Renderer。
 *
 * 纯函数：AST → 字符串。不做解析、不读全局状态。
 * 所有文字都经过 esc()，所有 URL 都经过 safeHref() / safeSrc()。
 */

const ESCAPE = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ESCAPE[c]);

export function safeHref(raw) {
  const href = String(raw ?? "").trim();
  if (!href) return "";
  if (href.startsWith("#")) return href;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (/^https?:\/\//i.test(href)) return href;
  if (/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(href)) return href;
  return "";
}

export function safeSrc(raw, allowAttachment = false) {
  const src = String(raw ?? "").trim();
  if (!src) return "";
  if (src.startsWith("/") && !src.startsWith("//")) return src;
  if (/^https?:\/\//i.test(src)) return src;
  if (/^data:image\/(?:png|jpe?g|gif|webp|svg\+xml);base64,/i.test(src)) return src;
  // 宿主（如 JupyterLab 的 AttachmentsResolver）负责把 attachment: 换成 dataURL
  if (allowAttachment && /^attachment:[\w.\-\u4e00-\u9fa5]+$/i.test(src)) return src;
  return "";
}

const inline = (nodes, meta) => (nodes || []).map((n) => renderInline(n, meta)).join("");

function blockList(nodes, meta) {
  return (nodes || []).map((n) => renderBlock(n, meta)).join("\n");
}

/** 环境里如果只有一个段落，渲染成裸行内，避免 li/quote 里多一层 <p> */
function looseBlocks(children, meta) {
  if (Array.isArray(children) && children.length === 1 && children[0].type === "Para") {
    return inline(children[0].children, meta);
  }
  return blockList(children, meta);
}

function renderBlock(node, meta) {
  if (!node) return "";

  switch (node.type) {
    case "Heading": {
      const level = Math.min(6, node.attrs.level || 1);
      return `<h${level} id="${esc(node.attrs.id || "")}">${inline(node.children, meta)}</h${level}>`;
    }
    case "Para":
      return `<p>${inline(node.children, meta)}</p>`;
    case "Quote":
      return `<blockquote>\n${blockList(node.children, meta)}\n</blockquote>`;
    case "Center":
      return `<div class="laup2-center">\n${blockList(node.children, meta)}\n</div>`;
    case "Hr":
      return "<hr>";
    case "Code":
      return `<pre class="laup2-code"${node.attrs.lang ? ` data-lang="${esc(node.attrs.lang)}"` : ""}><code${node.attrs.lang ? ` class="language-${esc(node.attrs.lang)}"` : ""}>${esc(node.attrs.value)}</code></pre>`;
    case "Sample":
      return renderSample(node);
    case "Math": {
      // 宿主自己排版数学（如 JupyterLab 的 KaTeX typesetter）：输出 $…$ 文本
      if (meta?.mathSource) {
        return `<p>${esc(node.attrs.display ? `$$${node.attrs.tex}$$` : `$${node.attrs.tex}$`)}</p>`;
      }
      return node.attrs.display
        ? `<div class="laup2-math-display" data-tex="${esc(node.attrs.tex)}">${esc(node.attrs.tex)}</div>`
        : `<p><span class="laup2-math" data-tex="${esc(node.attrs.tex)}">${esc(node.attrs.tex)}</span></p>`;
    }
    case "Equation":
      if (meta?.mathSource) return `<p>$$${esc(node.attrs.tex)}$$</p>`;
      return [
        `<div class="laup2-equation"${node.attrs.id ? ` id="eq-${esc(node.attrs.id)}"` : ""}>`,
        `<div class="laup2-math-display" data-tex="${esc(node.attrs.tex)}">${esc(node.attrs.tex)}</div>`,
        `<span class="laup2-eqno">(${node.attrs.number || "?"})</span>`,
        `</div>`,
      ].join("");
    case "Image": {
      const src = safeSrc(node.attrs.src, meta?.allowAttachment);
      if (!src) return `<p>${esc(node.attrs.alt || node.attrs.src)}</p>`;
      const caption = node.attrs.caption || node.attrs.alt || "";
      const title = node.attrs.title ? ` title="${esc(node.attrs.title)}"` : "";
      return [
        `<figure class="laup2-figure">`,
        `<img src="${esc(src)}" alt="${esc(node.attrs.alt || "")}"${title} loading="lazy">`,
        caption ? `<figcaption>${esc(caption)}</figcaption>` : "",
        `</figure>`,
      ].join("");
    }
    case "Cover": {
      const src = safeSrc(node.attrs.src, meta?.allowAttachment);
      if (!src) return `<p>${esc(node.attrs.caption || node.attrs.src)}</p>`;
      return [
        `<figure class="laup2-cover">`,
        `<img src="${esc(src)}" alt="${esc(node.attrs.caption || "")}" loading="lazy">`,
        node.attrs.caption ? `<figcaption>${esc(node.attrs.caption)}</figcaption>` : "",
        `</figure>`,
      ].join("");
    }
    case "Table":
      return renderTable(node, meta);
    case "Todo":
      return renderTodo(node, meta);
    case "Card":
      return renderCard(node, meta);
    case "TreeEmbed":
      return renderTreeEmbed(node);
    case "References":
      return renderReferences(node);
    case "Toc":
      return renderToc(meta);
    case "List":
      return renderList(node, meta);
    case "Env":
      return renderEnv(node, meta);
    case "Broken":
      return `<div class="laup2-broken" data-message="${esc(node.attrs.message)}">${esc(node.attrs.src)}</div>`;
    default:
      return "";
  }
}

/** 待办清单：只读复选框（可勾选状态一目了然） */
function renderTodo(node, meta) {
  const items = node.attrs.items || [];
  if (!items.length) return `<ul class="laup2-todo"></ul>`;
  const inline = (value) =>
    Array.isArray(value)
      ? value.map((child) => renderInline(child, meta)).join("")
      : esc(value).replace(/\n/g, "<br>");
  const rows = items
    .map((item) => [
      `<li${item.done ? ' class="is-done"' : ""}>`,
      `<input type="checkbox" disabled${item.done ? " checked" : ""}>`,
      `<span>${inline(item.text)}</span>`,
      `</li>`,
    ].join(""))
    .join("");
  return `<ul class="laup2-todo">${rows}</ul>`;
}

/** 分类卡：Wiki 信息框式的「项目 / 内容」两列表；标题与内容都支持行内语法 */
function renderCard(node, meta) {
  const { name, color, rows = [] } = node.attrs;
  const inline = (nodes) => (nodes || []).map((child) => renderInline(child, meta)).join("");
  const style = color ? ` style="--laup2-card-color:${esc(color)}"` : "";
  const body = rows
    .map((row) => [
      `<tr>`,
      row.label ? `<th>${esc(row.label)}</th>` : "",
      `<td${row.label ? "" : ' colspan="2"'}>${inline(row.value)}</td>`,
      `</tr>`,
    ].join(""))
    .join("");
  return [
    `<aside class="laup2-card"${style}>`,
    `<header>${inline(name)}</header>`,
    `<table><tbody>${body}</tbody></table>`,
    `</aside>`,
  ].join("");
}

/** 研究树嵌入：不拉数据，只给入口（与 v1 的 \tree 同一思路） */
function renderTreeEmbed(node) {
  const id = String(node.attrs.id || "");
  const title = node.attrs.title || `研究树 ${id}`;
  return [
    `<figure class="laup2-tree">`,
    `<a href="/life-tree/${encodeURIComponent(id)}">`,
    `<span class="laup2-tree-label">进化树</span>`,
    `<strong>${esc(title)}</strong>`,
    `<span class="laup2-tree-id">${esc(id)}</span>`,
    `</a>`,
    `</figure>`,
  ].join("");
}

function renderList(node, meta) {  const ordered = node.attrs.ordered;
  const tag = ordered ? "ol" : "ul";
  const start = ordered && node.attrs.start > 1 ? ` start="${node.attrs.start}"` : "";
  const items = (node.children || [])
    .map((item) => `<li>${looseBlocks(item.children, meta)}</li>`)
    .join("\n");
  return `<${tag}${start}>\n${items}\n</${tag}>`;
}

function renderEnv(node, meta) {
  const { name, mode, value } = node.attrs;

  if (mode === "raw") {
    return `<div class="laup2-env laup2-env-${esc(name)} laup2-raw">${esc(value)}</div>`;
  }

  if (mode === "items") {
    const tag = name === "enumerate" ? "ol" : "ul";
    const items = (value || [])
      .map((item) => `<li>${looseBlocks(item.children, meta)}</li>`)
      .join("\n");
    return `<${tag}>\n${items}\n</${tag}>`;
  }

  const inner = blockList(value, meta);
  if (name === "center") return `<div class="laup2-center">\n${inner}\n</div>`;
  if (name === "quote") return `<blockquote>\n${inner}\n</blockquote>`;
  if (name === "note" || name === "warning") {
    return `<aside class="laup2-callout laup2-callout-${esc(name)}">\n${inner}\n</aside>`;
  }
  return `<div class="laup2-env laup2-env-${esc(name)}">\n${inner}\n</div>`;
}

function renderTable(node, meta) {
  const { head, rows, align: aligns, caption } = node.attrs;
  const cell = (tag, content, index) => {
    const align = aligns && aligns[index] ? ` style="text-align:${esc(aligns[index])}"` : "";
    return `<${tag}${align}>${inline(content, meta)}</${tag}>`;
  };
  const thead = `<thead><tr>${(head || []).map((c, i) => cell("th", c, i)).join("")}</tr></thead>`;
  const tbody = (rows || [])
    .map((row) => `<tr>${row.map((c, i) => cell("td", c, i)).join("")}</tr>`)
    .join("");
  return [
    `<table class="laup2-table">`,
    caption ? `<caption>${esc(caption)}</caption>` : "",
    thead,
    `<tbody>${tbody}</tbody>`,
    `</table>`,
  ].join("");
}

function renderSample(node) {
  const panes = node.attrs.panes || [];
  if (!panes.length) return "";
  const body = panes
    .map((pane) => {
      const label = pane.kind === "output" ? "输出" : "输入";
      return [
        `<section class="laup2-sample-pane laup2-sample-${esc(pane.kind)}">`,
        `<header>${label}</header>`,
        `<pre><code>${esc(pane.value)}</code></pre>`,
        `</section>`,
      ].join("");
    })
    .join("");
  return `<div class="laup2-sample">${body}</div>`;
}

function renderReferences(node) {
  // entries = [{ key, number, id, entry }]，entry 是 BibTeX 条目的展示文本
  const items = (node.attrs.entries || [])
    .map((item, index) => {
      const text = typeof item === "string" ? item : item.entry?.text || item.key || "";
      const id = typeof item === "string" ? `ref-${index + 1}` : `ref-${item.id}`;
      return `<li id="${esc(id)}">${esc(text)}</li>`;
    })
    .join("\n");
  return `<section class="laup2-references">\n<h2>参考文献</h2>\n<ol>\n${items}\n</ol>\n</section>`;
}

function renderToc(meta) {  const items = (meta.toc || [])
    .map(
      (item) =>
        `<li class="laup2-toc-l${item.level}"><a href="#${esc(item.id)}">${esc(item.text)}</a></li>`,
    )
    .join("");
  return `<nav class="laup2-toc">\n<ul>\n${items}\n</ul>\n</nav>`;
}

function renderInline(node, meta) {
  if (!node) return "";

  switch (node.type) {
    case "Text":
      return esc(node.attrs.value);
    case "Strong":
      return `<strong>${inline(node.children, meta)}</strong>`;
    case "Em":
      return `<em>${inline(node.children, meta)}</em>`;
    case "Del":
      return `<del>${inline(node.children, meta)}</del>`;
    case "Underline":
      return `<u>${inline(node.children, meta)}</u>`;
    case "CodeInline":
      return `<code>${esc(node.attrs.value)}</code>`;
    case "Link": {
      const href = safeHref(node.attrs.href);
      const text = inline(node.children, meta);
      const title = node.attrs.title ? ` title="${esc(node.attrs.title)}"` : "";
      return href ? `<a href="${esc(href)}"${title}>${text}</a>` : text;
    }
    case "Image": {
      const src = safeSrc(node.attrs.src, meta?.allowAttachment);
      const title = node.attrs.title ? ` title="${esc(node.attrs.title)}"` : "";
      return src
        ? `<img class="laup2-inline-img" src="${esc(src)}" alt="${esc(node.attrs.alt || "")}"${title}>`
        : esc(node.attrs.alt || "");
    }
    case "Color": {
      const styles = [];
      if (node.attrs.color) styles.push(`color:${node.attrs.color}`);
      if (node.attrs.bg) styles.push(`background-color:${node.attrs.bg}`);
      const style = styles.length ? ` style="${esc(styles.join(";"))}"` : "";
      return `<span${style}>${inline(node.children, meta)}</span>`;
    }
    case "Size":
      return `<span style="font-size:${Number(node.attrs.size) || 16}px">${inline(node.children, meta)}</span>`;
    case "Math": {
      if (meta?.mathSource) {
        return esc(node.attrs.display ? `$$${node.attrs.tex}$$` : `$${node.attrs.tex}$`);
      }
      return `<span class="laup2-math" data-tex="${esc(node.attrs.tex)}">${esc(node.attrs.tex)}</span>`;
    }
    case "FootnoteRef": {
      const n = node.attrs.number || "?";
      return `<sup class="laup2-fn-ref" id="fnref-${n}"><a href="#fn-${n}">${n}</a></sup>`;
    }
    case "EqRef": {
      const n = node.attrs.number;
      return n
        ? `<a class="laup2-eqref" href="#eq-${esc(node.attrs.id)}">(${n})</a>`
        : `<span class="laup2-eqref-bad">(?)</span>`;
    }
    case "Cite": {
      // 条目自带编号（项目级 references.bib + 正文数引用顺序），没有编号即引用不到
      const items = node.attrs.items || [];
      if (!items.length) return `<span class="laup2-cite-bad">[?]</span>`;
      const links = items
        .map((item) => `<a class="laup2-cite" href="#ref-${item.id}">[${item.number}]</a>`)
        .join("");
      return `<sub class="laup2-cite">${links}</sub>`;
    }
    case "Break":
      return "<br>";
    default:
      return "";
  }
}

export function renderFootnotes(meta) {
  const items = meta.footnotes || [];
  if (!items.length) return "";
  const body = items
    .map((item) => `<li id="fn-${item.number}">${inline(item.children, meta)}</li>`)
    .join("\n");
  return `<section class="laup2-footnotes">\n<ol>\n${body}\n</ol>\n</section>`;
}

/**
 * 渲染整篇文档。
 * @param {object} doc   AST（已跑过语义 pass）
 * @param {{ meta?: object }} options
 */
export function renderHtml(doc, options = {}) {
  const meta = options.meta || { toc: [], footnotes: [] };
  const body = blockList(doc.children, meta);
  const footnotes = options.footnotes === false ? "" : renderFootnotes(meta);
  // fragment：只出内容，不套 <article>。Cells 层用它把多格拼进同一个容器
  if (options.fragment === true) return `${body}\n${footnotes}`.trim();
  return `<article class="laup2">\n${body}\n${footnotes}</article>`;
}

/** 最小的默认样式（宿主可整份替换） */
export const defaultCss = `
.laup2 { color: #1f2328; line-height: 1.75; }
.laup2 h1, .laup2 h2, .laup2 h3, .laup2 h4, .laup2 h5, .laup2 h6 { line-height: 1.35; margin: 1.6em 0 .6em; }
.laup2 h2 { padding-bottom: .3em; border-bottom: 1px solid #e6e8eb; }
.laup2 p { margin: .9em 0; }
.laup2 blockquote { margin: 1.2em 0; padding: .2em 1.1em; border-left: 3px solid #cfd6dd; background: #fafbfc; }
.laup2-center { text-align: center; }
.laup2 pre.laup2-code { background: #f6f8fa; border: 1px solid #e6e8eb; border-radius: 8px; padding: 14px 16px; overflow-x: auto; }
.laup2 table { border-collapse: collapse; width: 100%; margin: 1.2em 0; }
.laup2 th, .laup2 td { border: 1px solid #d8dee4; padding: 8px 12px; vertical-align: top; }
.laup2 th { background: #f6f8fa; }
.laup2-raw { white-space: pre-wrap; overflow-wrap: anywhere; }
.laup2-stay-line { line-height: 1.85; }
.laup2-sample { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 10px; margin: 1.2em 0; }
.laup2-sample-pane { overflow: hidden; border: 1px solid #d8dee4; border-radius: 8px; background: #fff; }
.laup2-sample-pane > header { padding: 6px 10px; border-bottom: 1px solid #e5e9ef; background: #f6f8fa; color: #33475b; font-size: .82em; font-weight: 600; }
.laup2-sample-pane > pre { margin: 0; padding: 10px 12px; border: 0; border-radius: 0; background: #fbfcfd; }
@media (max-width: 640px) { .laup2-sample { grid-auto-flow: row; } }
.laup2-callout { margin: 1.2em 0; padding: .6em 1em; border-left: 4px solid #9aa4ad; background: #f7f9fb; }
.laup2-callout-warning { border-left-color: #d98c00; background: #fff8e6; }
.laup2-broken { padding: .6em 1em; border: 1px dashed #e0a0a0; background: #fff5f5; color: #a33; white-space: pre-wrap; }
.laup2-toc { border: 1px solid #e6e8eb; border-radius: 8px; padding: 14px 18px; background: #fafbfc; }
.laup2-toc ul { list-style: none; padding-left: 0; margin: 0; }
.laup2-toc-l3 { padding-left: 1.2em; }
.laup2-toc-l4, .laup2-toc-l5, .laup2-toc-l6 { padding-left: 2.4em; }
.laup2-footnotes { margin-top: 3em; font-size: .9em; color: #444d56; }
`;
