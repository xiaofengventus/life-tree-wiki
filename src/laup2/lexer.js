/**
 * Laup v2 —— Lexer。
 *
 * 两级词法：
 *   lexBlocks(source)  按行切块：标题 / 段落行 / 列表项 / 引用 / 围栏 / 公式块 /
 *                      表格 / 命令 / 环境（**按 \begin/\end 深度配对**）
 *   lexInline(text)    按字符切行内：文本 / 命令 / 代码 / 公式 / 链接 / 图片 /
 *                      强调标记 / 变量
 *
 * 词法层不产出 HTML，只产出 token；解析与渲染都在后面。
 */

import { getCommand } from "./registry.js";

const FENCE_RE = /^[ \t]{0,3}(`{3,}|~{3,})[ \t]*([^\s`]*)[ \t]*$/;
const HEADING_RE = /^[ \t]{0,3}(#{1,6})[ \t]+(.*)$/;
const HR_RE = /^[ \t]{0,3}(?:-{3,}|\*{3,}|_{3,})[ \t]*$/;
const QUOTE_RE = /^[ \t]{0,3}>[ \t]?(.*)$/;
const LIST_RE = /^([ \t]*)([-*+]|\d{1,9}[.)])[ \t]+(.*)$/;
const ENV_RE = /^[ \t]*\\begin\{([A-Za-z][A-Za-z0-9-]*)\}[ \t]*(.*)$/;
const ENV_END_RE = /^[ \t]*\\end\{([A-Za-z][A-Za-z0-9-]*)\}[ \t]*$/;
const COMMAND_RE = /^[ \t]*\\([A-Za-z][A-Za-z0-9-]*)(.*)$/;
const TABLE_SEP_RE = /^[ \t]*\|?[ \t]*:?-{1,}:?[ \t]*(\|[ \t]*:?-{1,}:?[ \t]*)*\|?[ \t]*$/;

const isBlank = (line) => !String(line).trim();

/** 某个字符前面是否有奇数个反斜杠（= 被转义） */
function isEscaped(text, index) {
  let count = 0;
  for (let i = index - 1; i >= 0 && text[i] === "\\"; i -= 1) count += 1;
  return count % 2 === 1;
}

/**
 * 表格行按 `|` 切格 —— 逐字符扫描，而不是 `split('|')`：
 *   · `\|` 是转义，拼成字面 `|`，不切格
 *   · 行内代码（`…` / ``…``）里的 `|` 不切格
 *   · 其它转义原样保留，交给行内解析器
 */
export function splitTableRow(line) {
  const text = String(line ?? "");
  const cells = [];
  let cell = "";
  let codeTicks = 0;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\\" && i + 1 < text.length) {
      const next = text[i + 1];
      cell += next === "|" ? "|" : ch + next;
      i += 2;
      continue;
    }
    if (ch === "`") {
      let run = 1;
      while (text[i + run] === "`") run += 1;
      if (codeTicks === 0) codeTicks = run;
      else if (codeTicks === run) codeTicks = 0;
      cell += "`".repeat(run);
      i += run;
      continue;
    }
    if (ch === "|" && codeTicks === 0) {
      cells.push(cell.trim());
      cell = "";
      i += 1;
      continue;
    }
    cell += ch;
    i += 1;
  }
  cells.push(cell.trim());
  return cells;
}


function lineStart(source, index) {
  return source.slice(0, index).split("\n").length;
}

/**
 * 块级词法。
 * @returns {Array<object>} tokens
 */
export function lexBlocks(source) {
  const text = String(source ?? "").replace(/\r\n?/g, "\n");
  const lines = text.split("\n");
  const tokens = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];

    if (isBlank(raw)) {
      i += 1;
      continue;
    }

    // 围栏代码块
    const fence = FENCE_RE.exec(raw);
    if (fence) {
      const marker = fence[1];
      const lang = fence[2] || "";
      const body = [];
      let j = i + 1;
      for (; j < lines.length; j += 1) {
        const close = FENCE_RE.exec(lines[j]);
        if (close && close[1][0] === marker[0] && close[1].length >= marker.length) break;
        body.push(lines[j]);
      }
      tokens.push({ type: "fence", lang, value: body.join("\n"), span: [i + 1, Math.min(j + 1, lines.length)] });
      i = j + 1;
      continue;
    }

    // 公式块 $$ … $$
    const trimmed = raw.trim();
    if (trimmed.startsWith("$$")) {
      const rest = trimmed.slice(2);
      if (rest.endsWith("$$") && rest.length >= 2) {
        tokens.push({ type: "mathblock", tex: rest.slice(0, -2).trim(), span: [i + 1, i + 1] });
        i += 1;
        continue;
      }
      const body = rest ? [rest] : [];
      let j = i + 1;
      let closed = false;
      for (; j < lines.length; j += 1) {
        const line = lines[j].trim();
        if (line === "$$") {
          closed = true;
          break;
        }
        body.push(lines[j]);
      }
      tokens.push({
        type: "mathblock",
        tex: body.join("\n").trim(),
        span: [i + 1, Math.min(j + 1, lines.length)],
        closed,
      });
      i = j + 1;
      continue;
    }

    // 环境（深度配对）
    const env = ENV_RE.exec(raw);
    if (env) {
      const name = env[1];
      const body = [];
      let depth = 1;
      let j = i + 1;
      let closed = false;
      for (; j < lines.length; j += 1) {
        const open = ENV_RE.exec(lines[j]);
        if (open && open[1] === name) {
          depth += 1;
          body.push(lines[j]);
          continue;
        }
        const close = ENV_END_RE.exec(lines[j]);
        if (close && close[1] === name) {
          depth -= 1;
          if (depth === 0) {
            closed = true;
            break;
          }
          body.push(lines[j]);
          continue;
        }
        body.push(lines[j]);
      }
      tokens.push({
        type: "env",
        name,
        body: body.join("\n"),
        closed,
        meta: env[2] || "",
        span: [i + 1, Math.min(j + 1, lines.length)],
      });
      i = closed ? j + 1 : lines.length;
      continue;
    }

    // 标题
    const heading = HEADING_RE.exec(raw);
    if (heading) {
      tokens.push({ type: "heading", level: heading[1].length, text: heading[2], span: [i + 1, i + 1] });
      i += 1;
      continue;
    }

    // 分隔线
    if (HR_RE.test(raw)) {
      tokens.push({ type: "hr", span: [i + 1, i + 1] });
      i += 1;
      continue;
    }

    // 引用（连续 > 行）
    const quote = QUOTE_RE.exec(raw);
    if (quote) {
      const body = [];
      let j = i;
      let current = quote;
      while (j < lines.length && (current = QUOTE_RE.exec(lines[j]))) {
        body.push(current[1]);
        j += 1;
      }
      tokens.push({ type: "quote", body: body.join("\n"), span: [i + 1, j] });
      i = j;
      continue;
    }

    // 列表项
    const list = LIST_RE.exec(raw);
    if (list) {
      const marker = list[2];
      tokens.push({
        type: "list-item",
        indent: list[1].replace(/\t/g, "  ").length,
        ordered: /^\d/.test(marker),
        start: /^\d/.test(marker) ? parseInt(marker, 10) : 1,
        text: list[3],
        lines: [list[3]],
        span: [i + 1, i + 1],
      });
      i += 1;
      continue;
    }

    // 表格：本行含 |，且下一行是分隔行
    if (raw.includes("|") && i + 1 < lines.length && TABLE_SEP_RE.test(lines[i + 1]) && lines[i + 1].includes("-")) {
      const parseRow = (line) => {
        let text = String(line ?? "").trim();
        if (text.startsWith("|")) text = text.slice(1);
        if (text.endsWith("|") && !isEscaped(text, text.length - 1)) text = text.slice(0, -1);
        return splitTableRow(text);
      };
      const head = parseRow(raw);
      const aligns = parseRow(lines[i + 1]).map((cell) => {
        const left = cell.startsWith(":");
        const right = cell.endsWith(":");
        return left && right ? "center" : right ? "right" : "left";
      });
      const rows = [];
      let j = i + 2;
      while (j < lines.length && lines[j].includes("|") && !isBlank(lines[j])) {
        rows.push(parseRow(lines[j]));
        j += 1;
      }
      tokens.push({ type: "table", head, align: aligns, rows, span: [i + 1, j] });
      i = j;
      continue;
    }

    // 块级命令
    const command = COMMAND_RE.exec(raw);
    if (command) {
      const def = getCommand(command[1]);
      if (def && def.scope === "block") {
        tokens.push({
          type: "command",
          name: command[1],
          rawArgs: command[2] || "",
          span: [i + 1, i + 1],
        });
        i += 1;
        continue;
      }
    }

    // 普通段落行（连续行合并）
    const para = [raw];
    let j = i + 1;
    while (j < lines.length) {
      const next = lines[j];
      if (isBlank(next)) break;
      if (
        FENCE_RE.test(next) ||
        HEADING_RE.test(next) ||
        HR_RE.test(next) ||
        QUOTE_RE.test(next) ||
        LIST_RE.test(next) ||
        ENV_RE.test(next) ||
        next.trim().startsWith("$$")
      ) {
        break;
      }
      const cmd = COMMAND_RE.exec(next);
      if (cmd && getCommand(cmd[1])?.scope === "block") break;
      para.push(next);
      j += 1;
    }
    tokens.push({ type: "para", lines: para, span: [i + 1, j] });
    i = j;
  }

  return tokens;
}

// ── 行内词法 ────────────────────────────────────────────────────

const INLINE_SPECIAL = new Set(["\\", "`", "$", "*", "_", "~", "[", "]", "!", "{", "}"]);

function readBalanced(src, start) {
  // src[start] === '{'
  let depth = 0;
  for (let i = start; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === "\\") {
      i += 1;
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return { value: src.slice(start + 1, i), next: i + 1 };
    }
  }
  return null;
}

// ── 强调定界符的 flanking 规则（CommonMark 的核心部分） ──────────
const WORD_CHAR = /[\p{L}\p{N}]/u;
const isWordChar = (ch) => Boolean(ch) && WORD_CHAR.test(ch);

function isEscapedAt(src, index) {
  let count = 0;
  for (let i = index - 1; i >= 0 && src[i] === "\\"; i -= 1) count += 1;
  return count % 2 === 1;
}

/** 能否作为强调的起始：后面不能是空白；`_` 不能在词内 */
function canOpenEmphasis(src, index, marker) {
  const before = src[index - 1] || "";
  const after = src[index + marker.length] || "";
  if (!after || /\s/.test(after)) return false;
  if (marker[0] === "_" && isWordChar(before) && isWordChar(after)) return false;
  return true;
}

/** 能否作为强调的结束：前面不能是空白；`_` 不能在词内 */
function canCloseEmphasis(src, index, marker) {
  const before = src[index - 1] || "";
  const after = src[index + marker.length] || "";
  if (!before || /\s/.test(before)) return false;
  if (marker[0] === "_" && isWordChar(before) && isWordChar(after)) return false;
  return true;
}

function findEmphasisClose(src, from, marker) {
  let i = from;
  while (i < src.length) {
    const at = src.indexOf(marker, i);
    if (at < 0) return -1;
    if (!isEscapedAt(src, at) && canCloseEmphasis(src, at, marker)) return at;
    i = at + marker.length;
  }
  return -1;
}

/**
 * 行内词法 → 嵌套 token（强调、链接在词法阶段就配对好）。
 * @param {string} src
 * @param {object} ctx  { warn(code, message) }
 */
export function lexInline(src, ctx = {}) {
  const text = String(src ?? "");
  const tokens = [];
  let buffer = "";
  const flush = () => {
    if (buffer) {
      tokens.push({ type: "text", value: buffer });
      buffer = "";
    }
  };

  let i = 0;
  while (i < text.length) {
    const ch = text[i];

    // 转义 / 换行
    if (ch === "\\") {
      const next = text[i + 1];
      if (next === "\\") {
        flush();
        tokens.push({ type: "break" });
        i += 2;
        continue;
      }
      if (next && /[!-/:-@[-`{-~]/.test(next)) {
        buffer += next;
        i += 2;
        continue;
      }
      const match = /^\\([A-Za-z][A-Za-z0-9-]*)/.exec(text.slice(i));
      if (match) {
        flush();
        const name = match[1];
        const def = getCommand(name);
        let cursor = i + match[0].length;
        const args = [];
        if (def) {
          for (let k = 0; k < def.args.length; k += 1) {
            while (text[cursor] === " " || text[cursor] === "\t") cursor += 1;
            if (text[cursor] !== "{") {
              if (ctx.warn) {
                ctx.warn("E_ARG_MISSING", `\\${name} 缺少第 ${k + 1} 个参数 {…}`);
              }
              args.push({ raw: "", type: def.args[k].type });
              continue;
            }
            const group = readBalanced(text, cursor);
            if (!group) {
              if (ctx.warn) ctx.warn("E_ARG_UNCLOSED", `\\${name} 的花括号没有闭合`);
              args.push({ raw: "", type: def.args[k].type });
              cursor = text.length;
              break;
            }
            args.push({ raw: group.value, type: def.args[k].type });
            cursor = group.next;
          }
        }
        tokens.push({
          type: "command",
          name,
          args,
          known: Boolean(def),
          raw: text.slice(i, cursor),
          start: i,
          end: cursor,
        });
        i = cursor;
        continue;
      }
      buffer += ch;
      i += 1;
      continue;
    }

    // 行内代码
    if (ch === "`") {
      const run = /^`+/.exec(text.slice(i))[0];
      const close = text.indexOf(run, i + run.length);
      if (close >= 0) {
        flush();
        tokens.push({ type: "code", value: text.slice(i + run.length, close) });
        i = close + run.length;
        continue;
      }
    }

    // 数学
    if (ch === "$") {
      if (text.startsWith("$$", i)) {
        const end = text.indexOf("$$", i + 2);
        if (end > i) {
          flush();
          tokens.push({ type: "math", tex: text.slice(i + 2, end), display: true });
          i = end + 2;
          continue;
        }
      } else {
        const end = text.indexOf("$", i + 1);
        const inner = end > i ? text.slice(i + 1, end) : "";
        const looksMath =
          inner &&
          !/^\s/.test(inner) &&
          !/\s$/.test(inner) &&
          !/^[\d\s.,%]+$/.test(inner) &&
          (/\\[A-Za-z]+/.test(inner) || /[\^_{}<>]|[=+\-*/]/.test(inner) || inner.length <= 8);
        if (looksMath) {
          flush();
          tokens.push({ type: "math", tex: inner, display: false });
          i = end + 1;
          continue;
        }
      }
    }

    // 变量 {{name}}
    if (ch === "{" && text.startsWith("{{", i)) {
      const end = text.indexOf("}}", i + 2);
      if (end > i) {
        flush();
        tokens.push({ type: "var", name: text.slice(i + 2, end).trim() });
        i = end + 2;
        continue;
      }
    }

    // 强调 / 删除线（按 flanking 规则判定能否开合）
    let emphasized = false;
    for (const [marker, type] of [
      ["**", "strong"],
      ["__", "strong"],
      ["~~", "del"],
      ["*", "em"],
      ["_", "em"],
    ]) {
      if (!text.startsWith(marker, i)) continue;
      if (!canOpenEmphasis(text, i, marker)) continue;
      const close = findEmphasisClose(text, i + marker.length, marker);
      if (close < 0) continue;
      flush();
      tokens.push({
        type,
        tokens: lexInline(text.slice(i + marker.length, close), ctx),
        start: i,
        end: close + marker.length,
      });
      i = close + marker.length;
      emphasized = true;
      break;
    }
    if (emphasized) continue;

    // 图片 ![alt](src)
    if (ch === "!" && text[i + 1] === "[") {
      const close = text.indexOf("]", i + 2);
      const hrefEnd = text.indexOf(")", close + 1);
      if (close > i && hrefEnd > close && text[close + 1] === "(") {
        flush();
        tokens.push({
          type: "image",
          alt: text.slice(i + 2, close),
          src: text.slice(close + 2, hrefEnd).trim(),
        });
        i = hrefEnd + 1;
        continue;
      }
    }

    // 链接 [text](href)
    if (ch === "[") {
      const close = text.indexOf("]", i + 1);
      const hrefEnd = close > i ? text.indexOf(")", close + 1) : -1;
      if (close > i && hrefEnd > close && text[close + 1] === "(") {
        flush();
        tokens.push({
          type: "link",
          href: text.slice(close + 2, hrefEnd).trim(),
          tokens: lexInline(text.slice(i + 1, close), ctx),
        });
        i = hrefEnd + 1;
        continue;
      }
    }

    buffer += ch;
    i += 1;
  }

  flush();
  return tokens;
}

export { lineStart, INLINE_SPECIAL };
