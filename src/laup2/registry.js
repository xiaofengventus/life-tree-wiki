/**
 * Laup v2 —— 命令 / 环境注册表。
 *
 * 每个命令与环境都**声明一次**，解析器和渲染器都从这里读：
 *
 *   defineCommand({
 *     name: 'textcolor',
 *     scope: 'inline',                  // 'inline' | 'block'
 *     args: [
 *       { name: 'color', type: 'color' },
 *       { name: 'content', type: 'inline' },
 *     ],
 *     build: (args) => N.color(args.color, null, args.content),
 *   })
 *
 *   defineEnvironment({
 *     name: 'stay',
 *     content: 'raw',                   // 'raw' | 'blocks' | 'inline-lines' | 'items'
 *     nesting: true,                    // 解析器按 \begin/\end 深度配对
 *   })
 *
 * 未知命令不会静默消失：parser 产出 Broken 节点 + 诊断。
 */

import { N } from "./ast.js";

const commands = new Map();
const environments = new Map();

const NAME_RE = /^[A-Za-z][A-Za-z0-9-]*$/;

export function defineCommand(def) {
  if (!def || !NAME_RE.test(def.name || "")) {
    throw new Error(`命令名不合法：${def && def.name}`);
  }
  commands.set(def.name, { scope: "inline", args: [], ...def });
  return def;
}

export function defineEnvironment(def) {
  if (!def || !NAME_RE.test(def.name || "")) {
    throw new Error(`环境名不合法：${def && def.name}`);
  }
  environments.set(def.name, { content: "blocks", nesting: true, ...def });
  return def;
}

export const getCommand = (name) => commands.get(name) || null;
export const getEnvironment = (name) => environments.get(name) || null;
export const commandNames = () => [...commands.keys()].sort();
export const environmentNames = () => [...environments.keys()].sort();

/** 只给测试用：清空后重新装载内置表 */
export function resetRegistry() {
  commands.clear();
  environments.clear();
  installBuiltins();
}

// ── 参数取值校验 ────────────────────────────────────────────────
export function safeColor(raw) {
  const value = String(raw ?? "").trim().toLowerCase();
  if (/^#[0-9a-f]{3,8}$/.test(value)) return value;
  if (/^[a-z]{3,20}$/.test(value)) return value;
  return "";
}

export function safeSize(raw) {
  const n = parseInt(String(raw ?? "").trim(), 10);
  return Number.isFinite(n) && n >= 8 && n <= 72 ? n : null;
}

/** "1,3-5" → [1,3,4,5]；解析失败返回空数组 */
export function parseCiteIds(raw) {
  const ids = [];
  for (const part of String(raw ?? "").split(/[,，]/)) {
    const text = part.trim();
    if (!text) continue;
    const range = /^(\d{1,3})\s*[-–]\s*(\d{1,3})$/.exec(text);
    if (range) {
      const from = Number(range[1]);
      const to = Number(range[2]);
      for (let n = from; n <= to && n - from < 100; n += 1) ids.push(n);
      continue;
    }
    if (/^\d{1,3}$/.test(text)) ids.push(Number(text));
  }
  return ids;
}

/** 装载全部内置命令 / 环境（resetRegistry 会再调一次） */
function installBuiltins() {
// ── 内置：块级命令 ──────────────────────────────────────────────
for (let level = 1; level <= 6; level += 1) {
  defineCommand({
    name: `h${level}`,
    scope: "block",
    args: [{ name: "content", type: "inline" }],
    build: (args) => N.heading(level, args.content),
  });
}

defineCommand({ name: "hr", scope: "block", args: [], build: () => N.hr() });
defineCommand({ name: "toc", scope: "block", args: [], build: () => N.toc() });
defineCommand({
  name: "tableofcontents",
  scope: "block",
  args: [],
  build: () => N.toc(),
});
defineCommand({
  name: "raw",
  scope: "block",
  args: [{ name: "html", type: "text" }],
  build: (args) => N.broken("\\raw 在 v2 中默认禁用（安全策略）", args.html || ""),
});

defineCommand({
  name: "cover",
  scope: "block",
  args: [
    { name: "src", type: "text" },
    { name: "caption", type: "text" },
  ],
  build: (args) => N.cover(args.src, args.caption),
});

// ── 内置：行内命令 ──────────────────────────────────────────────
defineCommand({
  name: "textcolor",
  scope: "inline",
  args: [
    { name: "color", type: "color" },
    { name: "content", type: "inline" },
  ],
  build: (args) => N.color(args.color, null, args.content),
});

defineCommand({
  name: "fontcolor",
  scope: "inline",
  args: [
    { name: "color", type: "color" },
    { name: "content", type: "inline" },
  ],
  build: (args) => N.color(args.color, null, args.content),
});

defineCommand({
  name: "colorbox",
  scope: "inline",
  args: [
    { name: "color", type: "color" },
    { name: "content", type: "inline" },
  ],
  build: (args) => N.color(null, args.color, args.content),
});

defineCommand({
  name: "fontsize",
  scope: "inline",
  args: [
    { name: "size", type: "number" },
    { name: "content", type: "inline" },
  ],
  build: (args) => (args.size ? N.size(args.size, args.content) : args.content),
});

for (const [name, factory] of [
  ["textbf", (c) => N.strong(c)],
  ["textit", (c) => N.em(c)],
  ["underline", (c) => N.underline(c)],
  ["sout", (c) => N.del(c)],
]) {
  defineCommand({
    name,
    scope: "inline",
    args: [{ name: "content", type: "inline" }],
    build: (args) => factory(args.content),
  });
}

defineCommand({
  name: "code",
  scope: "inline",
  args: [{ name: "value", type: "text" }],
  build: (args) => [N.codeInline(args.value)],
});

defineCommand({
  name: "math",
  scope: "inline",
  args: [{ name: "tex", type: "text" }],
  build: (args) => [N.math(args.tex, false)],
});

defineCommand({
  name: "href",
  scope: "inline",
  args: [
    { name: "href", type: "text" },
    { name: "content", type: "inline" },
  ],
  build: (args) => N.link(args.href, args.content),
});

defineCommand({
  name: "url",
  scope: "inline",
  args: [{ name: "href", type: "text" }],
  build: (args) => [N.link(args.href, [N.text(args.href)])],
});

defineCommand({
  name: "footnote",
  scope: "inline",
  args: [{ name: "content", type: "inline" }],
  build: (args) => N.footnoteRef(args.content),
});

defineCommand({
  name: "linebreak",
  scope: "inline",
  args: [],
  build: () => [N.br()],
});

defineCommand({
  name: "cite",
  scope: "inline",
  args: [{ name: "ids", type: "text" }],
  build: (args) => [N.cite(parseCiteIds(args.ids))],
});

defineCommand({
  name: "eqref",
  scope: "inline",
  args: [{ name: "id", type: "text" }],
  build: (args) => [N.eqRef(args.id)],
});

// ── 内置环境 ────────────────────────────────────────────────────
defineEnvironment({ name: "quote", content: "blocks" });
defineEnvironment({ name: "center", content: "blocks" });
defineEnvironment({ name: "itemize", content: "items" });
defineEnvironment({ name: "enumerate", content: "items" });

/** 原样：一个字都不解析 */
defineEnvironment({ name: "stay", content: "raw", nesting: true });
/** 只保留换行：每行仍按块级文法解析（所以 `#` 能变成标题） */
defineEnvironment({ name: "stay-line", content: "blocks", keepLineBreaks: true, nesting: true });

defineEnvironment({ name: "equation", content: "raw" });
defineEnvironment({ name: "note", content: "blocks", tone: "note" });
defineEnvironment({ name: "warning", content: "blocks", tone: "warning" });

// ── 复合环境：todo / tree / card ────────────────────────────────
// 这三个不是"容器 + 子块"，body 自带固定形状，所以由 build(body) 直接产出节点。
defineEnvironment({ name: "todo", content: "raw", build: buildTodo });
defineEnvironment({ name: "tree", content: "raw", build: buildTree });
defineEnvironment({ name: "card", content: "raw", build: buildCard });
defineEnvironment({ name: "sample", content: "raw", build: buildSample });
}

// 待办行：`- [ ] 事项` / `[x] 事项` 都认；不以方括号开头的行接在上一事项后面
const TODO_LINE_RE = /^[ \t]*(?:[-*+][ \t]*)?\[([ xX])\][ \t]*(.*)$/;
const TREE_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

function buildTodo(body) {
  const items = [];
  for (const line of String(body ?? "").split("\n")) {
    const match = TODO_LINE_RE.exec(line);
    if (match) {
      items.push({ done: match[1].toLowerCase() === "x", text: match[2].trim() });
      continue;
    }
    const text = line.trim();
    if (text && items.length) items[items.length - 1].text += `\n${text}`;
  }
  return N.todo(items);
}

function buildTree(body) {
  const lines = String(body ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const first = lines[0] || "";
  // 认三种写法：uid、站内路径 /life-tree/<uid>、本站完整链接（取其中的 uid）
  const fromLink = /\/life-tree\/([A-Za-z0-9_-]{1,64})/.exec(first);
  const id = fromLink ? fromLink[1] : (TREE_ID_RE.test(first) ? first : "");
  if (!id) {
    return N.broken(
      "\\begin{tree} 需要研究树 uid 或 /life-tree/<uid> 链接（独占一行）",
      first,
    );
  }
  return N.treeEmbed(id, { title: lines[1] || "" });
}

// 输入/输出对照卡（文档级）：`---` 或 `===` 独占一行分隔两栏；空的一栏不渲染
const SAMPLE_SEP_RE = /^[ \t]*(?:-{3,}|={3,})[ \t]*$/;

function buildSample(body) {
  const lines = String(body ?? "").split("\n");
  const index = lines.findIndex((line) => SAMPLE_SEP_RE.test(line));
  const trim = (list) => {
    const copy = [...list];
    while (copy.length && !copy[0].trim()) copy.shift();
    while (copy.length && !copy[copy.length - 1].trim()) copy.pop();
    return copy.join("\n");
  };
  const input = index >= 0 ? trim(lines.slice(0, index)) : trim(lines);
  const output = index >= 0 ? trim(lines.slice(index + 1)) : "";
  const panes = [];
  if (input || !output) panes.push({ kind: "input", value: input });
  if (output) panes.push({ kind: "output", value: output });
  return N.sample(panes);
}

function buildCard(body, ctx) {
  const parse = (text) =>
    (ctx && typeof ctx.parseInline === "function" ? ctx.parseInline(text) : [N.text(String(text ?? ""))]);
  let name = [N.text("分类卡片")];
  let color = "";
  const rows = [];
  for (const raw of String(body ?? "").split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    // 括号行是写法说明，不是内容
    if (/^[(（].*[)）]$/.test(line)) continue;
    // [name …] / [color …]（方括号可省，值里允许 Laup 行内语法）
    const named = /^\[?name[ \t]+([\s\S]*?)\]?$/i.exec(line);
    if (named) {
      name = parse(named[1].trim());
      continue;
    }
    const colored = /^\[?color[ \t]+([\s\S]*?)\]?$/i.exec(line);
    if (colored) {
      color = safeColor(colored[1].trim());
      continue;
    }
    // 一行 = 「项目 内容」；内容可以包含空格
    const match = /^(\S+)[ \t]+([\s\S]*)$/.exec(line);
    if (!match) {
      rows.push({ label: "", value: parse(line) });
      continue;
    }
    rows.push({ label: match[1], value: parse(match[2].trim()) });
  }
  return N.card(name, color, rows);
}

installBuiltins();
