/**
 * wangEditor HTML ↔ Laup 源码 的双向桥。
 *
 * 为什么落在 HTML 层，而不是 Slate JSON：
 *   · 编辑器保存的本来就是 `editor.getHtml()` 的产物，HTML 是唯一稳定的边界；
 *   · Slate 节点与插件内部 API 强耦合，升级或换编辑器都会把转换器一起拖下水。
 *
 * 约定：
 *   · `htmlToLaup()` 只产出 Laup v2 源码；认不出的节点不丢内容，降级成 `\begin{stay}` 原样块；
 *   · `laupToWangHtml()` 产出**带 wangEditor 自定义节点标记**的 HTML，
 *     这样 `editor.setHtml()` 之后公式 / 引用 / 图片图注还能继续当成富文本编辑；
 *   · 分类卡不进正文（它本来就走 `classificationCards` 独立字段），转换时跳过。
 */

// ── 极简 HTML 解析（够用即可：wangEditor 的产物是良构的） ──────────
const VOID_TAGS = new Set([
  "br", "img", "hr", "input", "meta", "link", "source", "col", "area", "base", "embed", "wbr",
]);

const decodeEntities = (text) => String(text)
  .replace(/&nbsp;/g, " ")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&amp;/g, "&");

function parseAttrs(raw) {
  const attrs = {};
  const re = /([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;
  while ((match = re.exec(raw || ""))) {
    attrs[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attrs;
}

/** HTML 字符串 → 轻量节点树。文本节点是 `{ tag:'#text', text }`。 */
export function parseHtml(html) {
  const root = { tag: "#root", attrs: {}, children: [] };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>|([^<]+)/g;
  let match;
  while ((match = re.exec(String(html ?? "")))) {
    if (match[0].startsWith("<!--")) continue;
    if (match[1]) {
      const tag = match[1].toLowerCase();
      for (let i = stack.length - 1; i > 0; i -= 1) {
        if (stack[i].tag === tag) {
          stack.length = i;
          break;
        }
      }
      continue;
    }
    if (match[2]) {
      const el = { tag: match[2].toLowerCase(), attrs: parseAttrs(match[3]), children: [] };
      stack[stack.length - 1].children.push(el);
      if (!match[4] && !VOID_TAGS.has(el.tag)) stack.push(el);
      continue;
    }
    const text = decodeEntities(match[5] || "");
    if (text) stack[stack.length - 1].children.push({ tag: "#text", text });
  }
  return root;
}

// ── 工具 ────────────────────────────────────────────────────────
const ESCAPE_RE = /([\\`*_~$[\]])/g;
const escapeText = (text) => String(text ?? "").replace(ESCAPE_RE, "\\$1");

const classList = (node) => String(node?.attrs?.class || "").split(/\s+/).filter(Boolean);
const hasClass = (node, name) => classList(node).includes(name);
const textOf = (node) => {
  if (!node) return "";
  if (node.tag === "#text") return node.text;
  return (node.children || []).map(textOf).join("");
};
const collapse = (text) => String(text).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

// ── 行内 ────────────────────────────────────────────────────────
function inline(node) {
  if (!node) return "";
  if (node.tag === "#text") return escapeText(node.text);

  const attrs = node.attrs || {};
  const children = () => (node.children || []).map(inline).join("");

  if (node.tag === "br") return "\\\\";
  if (node.tag === "strong" || node.tag === "b") return `**${children()}**`;
  if (node.tag === "em" || node.tag === "i") return `*${children()}*`;
  if (node.tag === "u") return `\\underline{${children()}}`;
  if (node.tag === "s" || node.tag === "del" || node.tag === "strike") return `~~${children()}~~`;
  if (node.tag === "code") return `\`${textOf(node).replace(/`/g, "\\`")}\``;
  if (node.tag === "sup" && /^\[?\d[\d,\s-]*\]?$/.test(textOf(node).trim())) {
    return `\\cite{${textOf(node).replace(/[^\d,\s-]/g, "").replace(/\s+/g, "")}}`;
  }
  if (node.tag === "a") {
    const href = String(attrs.href || "");
    const citation = /^#post-citation-(\d+)$/.exec(href);
    if (citation) return `\\cite{${citation[1]}}`;
    return `[${children()}](${href})`;
  }
  if (node.tag === "img") {
    return `![${attrs.alt || ""}](${attrs.src || ""})`;
  }
  if (attrs["data-life-math"]) {
    const tex = attrs["data-latex"] || textOf(node);
    return attrs["data-life-math"] === "block" ? `$$\n${tex}\n$$` : `$${tex}$`;
  }
  if (attrs["data-life-inline-hoist"]) return textOf(node);

  // 颜色 / 字号（wangEditor 用内联 style）
  const color = /(?:^|;)\s*color:\s*([^;]+)/i.exec(attrs.style || "");
  const bg = /(?:^|;)\s*background-color:\s*([^;]+)/i.exec(attrs.style || "");
  const size = /(?:^|;)\s*font-size:\s*(\d+)px/i.exec(attrs.style || "");
  let out = children();
  if (color) out = `\\textcolor{${color[1].trim()}}{${out}}`;
  if (bg) out = `\\colorbox{${bg[1].trim()}}{${out}}`;
  if (size) out = `\\fontsize{${size[1]}}{${out}}`;
  return out;
}

const inlineChildren = (node) => (node.children || []).map(inline).join("");

// ── 块级 ────────────────────────────────────────────────────────
function tableToLaup(node) {
  const rows = [];
  for (const section of node.children || []) {
    if (section.tag !== "thead" && section.tag !== "tbody") continue;
    for (const tr of section.children || []) {
      if (tr.tag !== "tr") continue;
      rows.push((tr.children || [])
        .filter((cell) => cell.tag === "th" || cell.tag === "td")
        .map((cell) => inlineChildren(cell).replace(/\|/g, "\\|")));
    }
  }
  if (!rows.length) return "";
  const width = Math.max(...rows.map((row) => row.length));
  const cells = rows.map((row) => [...row, ...Array(width - row.length).fill("")]);
  const head = `| ${cells[0].join(" | ")} |`;
  const sep = `| ${Array(width).fill(":---").join(" | ")} |`;
  return [head, sep, ...cells.slice(1).map((row) => `| ${row.join(" | ")} |`)].join("\n");
}

function listToLaup(node, depth = 0) {
  const ordered = node.tag === "ol";
  const lines = [];
  (node.children || []).forEach((item, index) => {
    if (item.tag !== "li") return;
    const marker = ordered ? `${index + 1}. ` : "- ";
    const head = inlineChildren(item).trim().split("\n")[0];
    lines.push(`${"  ".repeat(depth)}${marker}${head}`);
    for (const child of item.children || []) {
      if (child.tag === "ul" || child.tag === "ol") {
        lines.push(listToLaup(child, depth + 1));
      }
    }
  });
  return lines.join("\n");
}

function todoToLaup(node) {
  const items = [];
  const walk = (current) => {
    for (const child of current.children || []) {
      if (child.tag === "#text") continue;
      const checkbox = (child.children || []).find((el) => el.tag === "input" && el.attrs.type === "checkbox");
      if (checkbox) {
        const text = inlineChildren(child).trim();
        items.push(`- [${checkbox.attrs.checked !== undefined ? "x" : " "}] ${text}`);
        continue;
      }
      walk(child);
    }
  };
  walk(node);
  if (!items.length) return "";
  return ["\\begin{todo}", ...items, "\\end{todo}"].join("\n");
}

function imageToLaup(node) {
  const attrs = node.attrs || {};
  return `![${attrs.alt || ""}](${attrs.src || ""})`;
}

function imageCaptionToLaup(node) {
  const img = (node.children || []).find((child) => child.tag === "img");
  const caption = (node.children || [])
    .filter((child) => child.tag === "figcaption")
    .map(inlineChildren)
    .join("")
    .trim();
  if (!img) return "";
  return `![${caption || img.attrs.alt || ""}](${img.attrs.src || ""})`;
}

function codeSampleToLaup(node) {
  const panes = { input: [], output: [] };
  const walk = (current) => {
    for (const child of current.children || []) {
      if (child.tag === "#text") continue;
      if (hasClass(child, "life-code-sample-pane")) {
        const kind = hasClass(child, "is-input") ? "input" : "output";
        const body = (child.children || []).find((el) => el.tag === "pre");
        panes[kind].push(textOf(body).replace(/\s+$/, ""));
        continue;
      }
      walk(child);
    }
  };
  walk(node);
  if (!panes.input.length && !panes.output.length) return "";
  return [
    "\\begin{sample}",
    panes.input.join("\n\n"),
    "---",
    panes.output.join("\n\n"),
    "\\end{sample}",
  ].join("\n");
}

function treeToLaup(node) {
  const id = node.attrs["data-tree-id"]
    || /data-tree-id=["']([\w-]+)["']/.exec(JSON.stringify(node))?.[1]
    || "";
  const title = (node.children || []).find((child) => child.tag === "header");
  const titleText = title ? collapse(textOf(title)).split("\n")[0] : "";
  if (!id) return "";
  return ["\\begin{tree}", id, ...(titleText ? [titleText] : []), "\\end{tree}"].join("\n");
}

function laupSampleToSource(node) {
  const panes = { input: "", output: "" };
  for (const section of node.children || []) {
    if (!hasClass(section, "laup2-sample-pane")) continue;
    const kind = hasClass(section, "laup2-sample-input") ? "input" : "output";
    const pre = (section.children || []).find((el) => el.tag === "pre");
    panes[kind] = textOf(pre).replace(/\s+$/, "");
  }
  return ["\\begin{sample}", panes.input, "---", panes.output, "\\end{sample}"].join("\n");
}

function laupTodoToSource(node) {
  const items = [];
  for (const li of node.children || []) {
    if (li.tag !== "li") continue;
    const checkbox = (li.children || []).find((el) => el.tag === "input");
    const label = (li.children || []).find((el) => el.tag === "span");
    const done = checkbox && checkbox.attrs.checked !== undefined;
    items.push(`- [${done ? "x" : " "}] ${textOf(label || li).trim()}`);
  }
  return ["\\begin{todo}", ...items, "\\end{todo}"].join("\n");
}

function laupCardToSource(node) {
  const header = (node.children || []).find((el) => el.tag === "header");
  const name = textOf(header).trim() || "分类卡片";
  const rows = [];
  const walk = (current) => {
    for (const child of current.children || []) {
      if (child.tag === "tr") {
        const th = (child.children || []).find((el) => el.tag === "th");
        const td = (child.children || []).find((el) => el.tag === "td");
        const noteEl = (td?.children || []).find((el) => hasClass(el, "laup2-card-note"));
        const note = textOf(noteEl).trim();
        const value = (td?.children || [])
          .filter((el) => el !== noteEl)
          .map((el) => textOf(el))
          .join("")
          .trim();
        rows.push([textOf(th).trim(), value, note].filter(Boolean).join(" "));
        continue;
      }
      walk(child);
    }
  };
  walk(node);
  return ["\\begin{card}", `[name ${name}]`, ...rows, "\\end{card}"].join("\n");
}

function laupTreeToSource(node) {
  const link = (node.children || []).find((el) => el.tag === "a");
  const href = link?.attrs?.href || "";
  const id = /\/life-tree\/([\w-]+)/.exec(href)?.[1] || "";
  const strong = (link?.children || []).find((el) => el.tag === "strong");
  const title = textOf(strong).trim();
  if (!id) return "";
  return ["\\begin{tree}", id, ...(title ? [title] : []), "\\end{tree}"].join("\n");
}

function blockToLaup(node, depth = 0) {
  if (!node) return "";
  if (node.tag === "#text") {
    const text = collapse(node.text);
    return text ? escapeText(text) : "";
  }

  const attrs = node.attrs || {};
  const cls = classList(node);

  // 分类卡：正文里只是预览，数据走 classificationCards 独立字段
  if (attrs["data-life-post-card"] || cls.includes("life-post-card")) return "";

  // Markdown 单元格：内容就是普通 HTML，直接展开
  if (attrs["data-life-md-cell"] !== undefined || cls.includes("life-md-cell-body")) {
    return blockChildren(node).join("\n\n");
  }

  if (hasClass(node, "life-code-sample")) return codeSampleToLaup(node);
  if (hasClass(node, "research-tree-embed")) return treeToLaup(node);
  if (hasClass(node, "life-image-caption-block")) return imageCaptionToLaup(node);

  // ── Laup 渲染器自己的产物（用于「源码 → 编辑器」回填与往返测试） ──
  if (hasClass(node, "laup2-sample")) return laupSampleToSource(node);
  if (hasClass(node, "laup2-todo")) return laupTodoToSource(node);
  if (hasClass(node, "laup2-card")) return laupCardToSource(node);
  if (hasClass(node, "laup2-tree")) return laupTreeToSource(node);
  if (hasClass(node, "laup2-toc")) return "\\tableofcontents";
  if (hasClass(node, "laup2-cover")) {
    const img = (node.children || []).find((el) => el.tag === "img");
    const caption = (node.children || []).find((el) => el.tag === "figcaption");
    if (!img) return "";
    const text = textOf(caption).trim();
    return `\\cover{${img.attrs.src || ""}}${text ? `{${text}}` : ""}`;
  }
  if (hasClass(node, "laup2-equation")) {
    const tex = (node.children || []).find((child) => hasClass(child, "laup2-math-display"));
    const id = String(node.attrs.id || "").replace(/^eq-/, "");
    return ["\\begin{equation}" + (id ? `{${id}}` : ""), tex?.attrs["data-tex"] || "", "\\end{equation}"].join("\n");
  }
  if (hasClass(node, "laup2-callout")) {
    const name = hasClass(node, "laup2-callout-warning") ? "warning" : "note";
    return [`\\begin{${name}}`, blockChildren(node).join("\n\n"), `\\end{${name}}`].join("\n");
  }
  if (hasClass(node, "laup2-raw")) return ["\\begin{stay}", textOf(node), "\\end{stay}"].join("\n");
  if (hasClass(node, "laup2-broken")) return ["\\begin{stay}", textOf(node), "\\end{stay}"].join("\n");

  if (/^h[1-6]$/.test(node.tag)) {
    return `${"#".repeat(Number(node.tag[1]))} ${inlineChildren(node)}`;
  }
  if (node.tag === "p") return inlineChildren(node);
  if (node.tag === "blockquote") {
    return blockChildren(node)
      .join("\n\n")
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
  }
  if (node.tag === "ul" || node.tag === "ol") {
    if (attrs["data-w-e-type"] === "todo") return todoToLaup(node);
    return listToLaup(node, depth);
  }
  if (node.tag === "pre") {
    const code = (node.children || []).find((child) => child.tag === "code");
    const langMatch = /language-([\w+#-]+)/.exec(code?.attrs?.class || attrs.class || "");
    const lang = langMatch ? langMatch[1] : "";
    const body = textOf(code || node).replace(/\s+$/, "");
    return ["```" + lang, body, "```"].join("\n");
  }
  if (node.tag === "figure") return imageCaptionToLaup(node);
  if (node.tag === "img") return imageToLaup(node);
  if (node.tag === "table") return tableToLaup(node);
  if (node.tag === "hr") return "---";
  if (attrs["data-life-math"] === "block") return `$$\n${attrs["data-latex"] || textOf(node)}\n$$`;

  // todo：wangEditor 的待办是 div[data-w-e-type="todo"] 包一串带 checkbox 的节点
  if (attrs["data-w-e-type"] === "todo" || (node.tag === "div" && (node.children || []).some(
    (child) => (child.children || []).some((el) => el.tag === "input" && el.attrs.type === "checkbox"),
  ))) {
    const todo = todoToLaup(node);
    if (todo) return todo;
  }

  // 认不出的块：内容不丢，原样保留（作者可以在源码里继续编辑）
  const inner = blockChildren(node).join("\n\n");
  if (!inner.trim()) return "";
  return ["\\begin{stay}", inner, "\\end{stay}"].join("\n");
}

function blockChildren(node) {
  const out = [];
  for (const child of node.children || []) {
    const text = blockToLaup(child);
    if (text !== "" && text != null) out.push(text);
  }
  return out;
}

/**
 * wangEditor HTML → Laup v2 源码。
 * @param {string} html
 * @returns {{ source: string, warnings: string[] }}
 */
export function htmlToLaup(html) {
  const root = parseHtml(html);
  const warnings = [];
  const blocks = [];
  for (const child of root.children) {
    const text = blockToLaup(child);
    if (text === "") {
      const cls = classList(child).join(".");
      if (cls.includes("life-post-card")) continue;
      if (child.tag !== "#text") warnings.push(`跳过了无法映射的节点 <${child.tag}>`);
      continue;
    }
    blocks.push(text);
  }
  return { source: `${blocks.join("\n\n")}\n`, warnings };
}

/**
 * Laup 源码 → 带 wangEditor 自定义标记的 HTML。
 * 目前只把「公式 / 引用 / 图片图注」还原成编辑器认得的节点；
 * 其余标准标签 wangEditor 自己就能解析。
 */
export function laupToWangHtml(source, render) {
  let html = render(String(source ?? ""));
  html = html.replace(
    /<span class="laup2-math" data-tex="([^"]*)">[\s\S]*?<\/span>/g,
    (_m, tex) => `<span data-life-math="inline" data-latex="${tex}">${tex}</span>`,
  );
  html = html.replace(
    /<div class="laup2-math-display" data-tex="([^"]*)">[\s\S]*?<\/div>/g,
    (_m, tex) => `<div data-life-math="block" data-latex="${tex}">${tex}</div>`,
  );
  html = html.replace(
    /<sup class="laup2-cite">([\s\S]*?)<\/sup>/g,
    (_m, inner) => {
      const numbers = [...String(inner).matchAll(/#ref-(\d+)/g)].map((item) => item[1]);
      return numbers.map((n) => `<a href="#post-citation-${n}">[${n}]</a>`).join("");
    },
  );
  return html;
}
