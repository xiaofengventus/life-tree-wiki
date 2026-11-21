/**
 * Laup v2 —— Parser。
 *
 * 输入 token，输出**类型化 AST**；不生成任何 HTML。
 * 块级文法负责分组（列表 / 引用 / 环境），行内文法负责嵌套（强调 / 链接 / 命令）。
 */

import { N } from "./ast.js";
import { lexBlocks, lexInline } from "./lexer.js";
import { getCommand, getEnvironment, safeColor, safeSize } from "./registry.js";
import { createDiagnostics } from "./diagnostics.js";

const trimBlank = (lines) => {
  let start = 0;
  let end = lines.length;
  while (start < end && !lines[start].trim()) start += 1;
  while (end > start && !lines[end - 1].trim()) end -= 1;
  return lines.slice(start, end);
};

/** CJK 之间换行不加空格，其余按空格连接；同时记录每行在拼接文本里的偏移 */
function joinLines(lines, firstLine) {
  const kept = trimBlank(lines);
  const starts = [];
  let text = "";
  kept.forEach((line, index) => {
    const clean = line.replace(/\s+$/, "");
    if (index > 0) {
      const prev = text[text.length - 1] || "";
      const next = clean[0] || "";
      const cjk = /[\u3000-\u9fff\uff00-\uffef]/;
      if (!(cjk.test(prev) && cjk.test(next))) text += " ";
    }
    starts.push({ offset: text.length, line: firstLine + index });
    text += clean;
  });
  return { text, starts };
}

/** 把行内偏移映射成 行:列 */
function makeLocator(starts, columnBase = 1) {
  if (!starts || !starts.length) return null;
  return (offset) => {
    let index = 0;
    for (let i = 0; i < starts.length; i += 1) {
      if (starts[i].offset <= offset) index = i;
      else break;
    }
    const start = starts[index];
    return { line: start.line, column: columnBase + offset - start.offset };
  };
}

const withSpan = (node, span) => {
  node.span = span || null;
  return node;
};

/**
 * 解析源码。
 * @param {string} source
 * @param {{ mode?: 'edit'|'strict' }} options
 * @returns {{ doc: object, diagnostics: import('./diagnostics.js').Diagnostic[] }}
 */
export function parse(source, options = {}) {
  const ctx = { mode: options.mode || "edit", diagnostics: [] };
  ctx.report = createDiagnostics(ctx.diagnostics);
  // 复合环境的字段也要能写行内语法（卡片的标题 / 项目内容）
  ctx.parseInline = (text) => parseInline(String(text ?? ""), ctx);
  const doc = N.doc(parseBlocks(String(source ?? ""), ctx));
  return { doc, diagnostics: ctx.diagnostics };
}

// ── 块级 ────────────────────────────────────────────────────────
export function parseBlocks(source, ctx) {
  const tokens = lexBlocks(source);
  const nodes = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    switch (token.type) {
      case "heading":
        nodes.push(
          withSpan(
            N.heading(
              token.level,
              parseInline(token.text, ctx, (offset) => ({
                line: token.span[0],
                column: token.level + 2 + offset,
              })),
            ),
            token.span,
          ),
        );
        i += 1;
        break;
      case "hr":
        nodes.push(withSpan(N.hr(), token.span));
        i += 1;
        break;
      case "fence":
        nodes.push(withSpan(N.code(token.lang, token.value), token.span));
        i += 1;
        break;
      case "mathblock":
        nodes.push(withSpan(N.math(token.tex, true), token.span));
        if (token.closed === false) {
          ctx.report.warn("E_MATH_UNCLOSED", "公式块缺少结束的 $$", token.span);
        }
        i += 1;
        break;
      case "quote":
        nodes.push(withSpan(N.quote(parseBlocks(token.body, ctx)), token.span));
        i += 1;
        break;
      case "table":
        nodes.push(
          withSpan(
            N.table({
              head: token.head.map((cell) => parseInline(cell, ctx)),
              align: token.align,
              rows: token.rows.map((row) => row.map((cell) => parseInline(cell, ctx))),
            }),
            token.span,
          ),
        );
        i += 1;
        break;
      case "env":
        nodes.push(parseEnvironment(token, ctx));
        i += 1;
        break;
      case "command":
        nodes.push(...parseBlockCommand(token, ctx));
        i += 1;
        break;
      case "list-item": {
        const group = parseList(tokens, i, ctx);
        nodes.push(group.node);
        i = group.next;
        break;
      }
      case "para": {
        const joined = joinLines(token.lines, token.span[0]);
        const locator = makeLocator(joined.starts);
        nodes.push(withSpan(N.para(parseInline(joined.text, ctx, locator)), token.span));
        i += 1;
        break;
      }
      default:
        i += 1;
    }
  }

  return nodes;
}

// ── 列表：按缩进嵌套 ────────────────────────────────────────────
function parseList(tokens, start, ctx) {
  const baseIndent = tokens[start].indent;
  const ordered = tokens[start].ordered;
  const items = [];
  let i = start;

  while (
    i < tokens.length &&
    tokens[i].type === "list-item" &&
    tokens[i].indent === baseIndent &&
    tokens[i].ordered === ordered
  ) {
    const token = tokens[i];
    const children = [N.para(parseInline(token.text, ctx))];
    i += 1;

    while (i < tokens.length && tokens[i].type === "list-item" && tokens[i].indent > baseIndent) {
      const nested = parseList(tokens, i, ctx);
      children.push(nested.node);
      i = nested.next;
    }
    items.push(withSpan(N.item(children), token.span));
  }

  return { node: N.list(ordered, tokens[start].start, items), next: i };
}

// ── 环境 ────────────────────────────────────────────────────────
function parseEnvironment(token, ctx) {
  const def = getEnvironment(token.name);

  if (!token.closed) {
    ctx.report.warn("E_ENV_UNCLOSED", `\\begin{${token.name}} 缺少 \\end{${token.name}}`, token.span);
  }

  if (!def) {
    ctx.report.warn("E_ENV_UNKNOWN", `未知环境 \\begin{${token.name}}，已原样输出`, token.span);
    return withSpan(N.broken(`未知环境 ${token.name}`, token.body), token.span);
  }

  if (token.name === "equation") {
    const id = /\{([^}]*)\}/.exec(token.meta || "");
    return withSpan(N.equation(id ? id[1].trim() : null, token.body.trim()), token.span);
  }

  // 复合环境（todo / tree / card）：body 自带固定形状，注册表直接给出节点
  if (typeof def.build === "function") {
    return withSpan(def.build(token.body, ctx), token.span);
  }

  if (def.content === "raw") {
    return withSpan(N.env(token.name, "raw", token.body), token.span);
  }

  if (def.content === "items") {
    return withSpan(N.env(token.name, "items", splitItems(token.body, ctx)), token.span);
  }

  if (def.keepLineBreaks) {
    // stay-line：每行单独走块级文法 → `# 标题` 依然是标题
    const blocks = [];
    for (const line of trimBlank(token.body.split("\n"))) {
      if (line.trim()) blocks.push(...parseBlocks(line, ctx));
    }
    return withSpan(N.env(token.name, "blocks", blocks), token.span);
  }

  return withSpan(N.env(token.name, "blocks", parseBlocks(token.body, ctx)), token.span);
}

function splitItems(body, ctx) {
  const items = [];
  let current = null;
  for (const line of String(body).split("\n")) {
    const match = /^\s*\\item\s*(.*)$/.exec(line);
    if (match) {
      if (current) items.push(N.item(parseBlocks(current.join("\n"), ctx)));
      current = match[1].trim() ? [match[1]] : [];
      continue;
    }
    if (current) current.push(line);
  }
  if (current) items.push(N.item(parseBlocks(current.join("\n"), ctx)));
  return items;
}

// ── 块级命令 ────────────────────────────────────────────────────
function parseBlockCommand(token, ctx) {
  const def = getCommand(token.name);
  if (!def) {
    ctx.report.warn("E_COMMAND_UNKNOWN", `未知命令 \\${token.name}`, token.span);
    return [withSpan(N.para([N.text(token.rawArgs || "")]), token.span)];
  }
  const args = readRawArgs(token.rawArgs, def, ctx);
  const built = def.build(args, ctx);
  return (Array.isArray(built) ? built : [built])
    .filter(Boolean)
    .map((node) => withSpan(node, token.span));
}

function readRawArgs(raw, def, ctx) {
  const args = {};
  let cursor = 0;
  for (const argDef of def.args) {
    while (raw[cursor] === " " || raw[cursor] === "\t") cursor += 1;
    if (raw[cursor] !== "{") {
      ctx.report.warn("E_ARG_MISSING", `\\${def.name} 缺少参数 {…}`);
      args[argDef.name] = argDef.type === "inline" ? [] : "";
      continue;
    }
    let depth = 0;
    let end = -1;
    for (let i = cursor; i < raw.length; i += 1) {
      if (raw[i] === "\\") {
        i += 1;
        continue;
      }
      if (raw[i] === "{") depth += 1;
      else if (raw[i] === "}") {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end < 0) {
      ctx.report.warn("E_ARG_UNCLOSED", `\\${def.name} 的花括号没有闭合`);
      break;
    }
    args[argDef.name] = convertArg(raw.slice(cursor + 1, end), argDef, ctx);
    cursor = end + 1;
  }
  return args;
}

function convertArg(value, argDef, ctx, span = null) {
  if (argDef.type === "inline") return parseInline(value, ctx);
  if (argDef.type === "color") {
    const color = safeColor(value);
    if (!color) ctx.report.warn("E_COLOR", `颜色 "${value}" 无效，已忽略`, span);
    return color;
  }
  if (argDef.type === "number") {
    const size = safeSize(value);
    if (!size) ctx.report.warn("E_SIZE", `字号 "${value}" 必须是 8–72 的整数，已忽略`, span);
    return size;
  }
  return String(value);
}

// ── 行内 ────────────────────────────────────────────────────────
export function parseInline(src, ctx, locator = null) {
  return parseInlineTokens(
    lexInline(src, {
      warn: (code, message) => ctx.report.warn(code, message),
    }),
    ctx,
    locator,
  );
}

/** 行内 token → 源码位置：有 locator 时给 { line, column }，否则给字符偏移 */
function spanOf(locator, token) {
  if (!token || token.start === undefined) return null;
  if (!locator) return { start: token.start, end: token.end };
  const start = locator(token.start);
  const end = locator(Math.max(token.end - 1, token.start));
  return {
    line: start.line,
    column: start.column,
    endLine: end.line,
    endColumn: end.column,
  };
}

function withInlineSpan(node, token, locator) {
  const span = spanOf(locator, token);
  if (span) node.span = span;
  return node;
}

function parseInlineTokens(tokens, ctx, locator) {
  const out = [];

  for (const token of tokens) {
    switch (token.type) {
      case "text":
        if (token.value) out.push(N.text(token.value));
        break;
      case "break":
        out.push(N.br());
        break;
      case "code":
        out.push(N.codeInline(token.value));
        break;
      case "math":
        out.push(N.math(token.tex, token.display));
        break;
      case "var":
        out.push(N.varRef(token.name));
        break;
      case "strong":
        out.push(withInlineSpan(N.strong(parseInlineTokens(token.tokens, ctx, locator)), token, locator));
        break;
      case "em":
        out.push(withInlineSpan(N.em(parseInlineTokens(token.tokens, ctx, locator)), token, locator));
        break;
      case "del":
        out.push(withInlineSpan(N.del(parseInlineTokens(token.tokens, ctx, locator)), token, locator));
        break;
      case "link":
        out.push(
          withInlineSpan(
            N.link(token.href, parseInlineTokens(token.tokens, ctx, locator)),
            token,
            locator,
          ),
        );
        break;
      case "image":
        out.push(N.image(token.src, { alt: token.alt }));
        break;
      case "command":
        out.push(...buildInlineCommand(token, ctx, locator));
        break;
      default:
        break;
    }
  }

  return out;
}

function buildInlineCommand(token, ctx, locator) {
  const def = getCommand(token.name);
  if (!def) {
    ctx.report.warn(
      "E_COMMAND_UNKNOWN",
      `未知命令 \\${token.name}`,
      spanOf(locator, token),
    );
    return [withInlineSpan(N.text(token.raw), token, locator)];
  }

  const span = spanOf(locator, token);
  const args = {};
  def.args.forEach((argDef, index) => {
    const raw = token.args[index] ? token.args[index].raw : "";
    args[argDef.name] = convertArg(raw, argDef, ctx, span);
  });

  const built = def.build(args, ctx);
  return (Array.isArray(built) ? built : [built])
    .filter(Boolean)
    .map((node) => withInlineSpan(node, token, locator));
}
