// 块级扫描器。这是整条管线唯一的"分岔点"，而且**只有一个分支**（规范 §1.4）：
//
//   行首是 `\` + 字母 且 是已知块级命令  →  Laup 块
//   否则                                →  md 块
//
// 注意后半句：`\` + 字母只是**必要**条件。`\textcolor{红}{字}` 写在行首时是段落，
// 不是块——所以还要判"这个命令是不是块级命令"。这一步判完，就没有别的分支了。
//
// 另外两件服务于编辑器的事，都在 while 循环一层解决（见 try/finally）：
//   1. 每个块挂 pos = { start, end } 源码行范围 → 屏幕上的块能映射回源码
//   2. ctx.tolerant 时出错不抛异常，改成产出 Broken 节点 + 诊断 → 编辑期不炸

import { N } from './ast.js';
import { LaupError } from './diag.js';
import { parseInline } from './inline.js';
import { isDataBlockStart, readDataBlock } from './dataBlock.js';
import {
  matchFence, matchHeading, matchHr, matchList, matchQuote,
  isTableSeparator, startsBlock,
} from './mdBlock.js';
import { readEnv, readList, readPipeTable } from './blockReaders.js';
import { lookupFenceLang } from './extensions.js';

const BLOCK_COMMANDS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'hr', 'tableofcontents', 'linebreak', 'raw',
]);

export function scanBlocks(src, ctx) {
  const lines = String(src).replace(/\r\n?/g, '\n').split('\n');
  return scan(lines, 0, ctx);
}

function commandName(line) {
  const m = /^\s*\\([A-Za-z][A-Za-z0-9]*)/.exec(line);
  return m ? m[1].toLowerCase() : null;
}

function isBlockCommand(line) {
  const name = commandName(line);
  return name !== null && BLOCK_COMMANDS.has(name);
}

// 这一行是否开启新的块？（给段落找终点用）
function opensBlock(line) {
  if (!line.trim()) return true;
  if (/^\s*\\/.test(line)) return isBlockCommand(line);
  return startsBlock(line);
}

// 容错模式吞块：从出错行往下吞，遇到空行或下一个块开头就停。
// 未闭合的 `\table=[ … ]` / `\begin{env}` 会被整块吞掉（它们内部的行都不是
// 块开头），而单行错误不会误吞掉后面的段落。
function guessSpan(lines, startIdx) {
  let j = startIdx + 1;
  while (j < lines.length) {
    if (!lines[j].trim()) break;
    if (opensBlock(lines[j])) break;
    j++;
  }
  return j - startIdx;
}

export function scan(lines, base, ctx) {
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const startIdx = i;
    const from = out.length;

    try {
      const raw = lines[i];
      if (!raw.trim()) { i++; continue; }
      const no = base + i + 1;
      const at = ctx.at(no);

      // ── 原样区：代码围栏
      const fence = matchFence(raw);
      if (fence) {
        const body = [];
        const closeRe = new RegExp('^\\s*' + fence.marker + '{' + fence.len + ',}\\s*$');
        i++;
        while (i < lines.length && !closeRe.test(lines[i])) { body.push(lines[i]); i++; }
        if (i >= lines.length) at.warn('代码围栏没有闭合，已延伸到文末');
        else i++;
        const text = body.join('\n');
        // 语言名先问注册表：` ```sample ` 这类"外形就是普通代码块、语义是自己的"元素，
        // 由装进来的宿主扩展认领。没人认领 → 就是普通代码块。
        // 这正是"寄生在 md 载体上"的好处——扫描器只需要多一次查表，
        // 编辑、撤销、粘贴、导入导出全部白捡，连载体形状都没变。
        const maker = lookupFenceLang(fence.lang);
        out.push(maker ? maker(text, at) : N.codeBlock(fence.lang, text));
        continue;
      }

      // ── 数学区：$$ … $$ 与 \[ … \]
      const displayMath = /^\s*\$\$\s*$/.test(raw)
        ? '$$'
        : /^\s*\\\[\s*$/.test(raw) ? '\\[' : null;
      if (displayMath) {
        const closer = displayMath === '$$' ? /^\s*\$\$\s*$/ : /^\s*\\\]\s*$/;
        const body = [];
        i++;
        while (i < lines.length && !closer.test(lines[i])) { body.push(lines[i]); i++; }
        if (i >= lines.length) at.warn(`块级公式 ${displayMath} 没有闭合`);
        else i++;
        out.push(N.math(body.join('\n').trim(), true));
        continue;
      }

      // ── Laup 数据块：\命令=[ 后紧跟换行
      if (isDataBlockStart(raw)) {
        const r = readDataBlock(lines, i, base, ctx);
        out.push(r.node);
        i = r.next;
        continue;
      }

      // ── Laup 环境：\begin{…}
      if (/^\s*\\begin\{[A-Za-z][A-Za-z0-9-]*\}/.test(raw)) {
        i = readEnv(lines, i, base, ctx, out, scan);
        continue;
      }

      // ── Laup 块级命令：\h1{} \hr \tableofcontents \raw{}
      if (isBlockCommand(raw)) {
        i = readCommandBlock(lines, i, base, ctx, out, no);
        continue;
      }

      // ── md 标题
      const hd = matchHeading(raw);
      if (hd) {
        out.push(N.heading(hd.level, parseInline(hd.text, at)));
        i++;
        continue;
      }

      // ── md 分隔线
      if (matchHr(raw)) {
        out.push(N.hr());
        i++;
        continue;
      }

      // ── md 引用块（内部递归跑一次块级扫描 → 引用里也能写 Laup 块）
      // i 这里还没被动过，所以外层的 startIdx 就是它的起始行，可直接复用。
      if (matchQuote(raw) !== null) {
        const body = [];
        while (i < lines.length && matchQuote(lines[i]) !== null) {
          body.push(matchQuote(lines[i]));
          i++;
        }
        out.push(N.quote(scan(body, base + startIdx, ctx)));
        continue;
      }

      // ── md 列表
      if (matchList(raw)) {
        i = readList(lines, i, base, ctx, out, scan);
        continue;
      }

      // ── md 管道式表格
      if (raw.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
        i = readPipeTable(lines, i, base, ctx, out);
        continue;
      }

      // ── 段落
      const para = [];
      while (i < lines.length && lines[i].trim()) {
        if (para.length && opensBlock(lines[i])) break;
        para.push(lines[i].trim());
        i++;
      }
      out.push(N.para(parseInline(para.join('\n'), at)));
    } catch (err) {
      // 编译期：原样抛出（写错了必须知道）。
      // 编辑期：语法天然不完整（`\table=[` 刚打一半、`\begin{quote}` 还没写 end），
      //         所以吞成 Broken 节点 + 记一条诊断，由界面标红——不打断打字。
      if (!ctx.tolerant) throw err;
      const span = Math.max(1, err.span != null ? err.span : guessSpan(lines, startIdx));
      i = Math.min(lines.length, startIdx + span);
      out.push(N.broken(lines.slice(startIdx, i).join('\n'), err));
      ctx.warn(err.line == null ? base + startIdx + 1 : err.line, err.message);
    } finally {
      // 本轮新产出的节点统一挂源码行范围（1-based 闭区间）。
      // blockReaders 里 push 的节点也在这里被补上，所以它们不用自己管 pos；
      // 一个源码块产出多个 AST 节点时（例如环境拆出多个），它们共享同一范围。
      const range = { start: base + startIdx + 1, end: base + i };
      for (let k = from; k < out.length; k++) out[k].pos = range;
    }
  }

  return out;
}

// 零参 / 单参的块级命令
function readCommandBlock(lines, i, base, ctx, out, no) {
  const at = ctx.at(no);
  const name = commandName(lines[i]);
  const tail = lines[i].replace(/^\s*\\[A-Za-z][A-Za-z0-9]*/, '').trim();

  if (/^h[1-6]$/.test(name)) {
    const g = /^\{([\s\S]*)\}\s*$/.exec(tail);
    if (!g) throw new LaupError(`\\${name} 需要一个 {} 参数`, no, `写成 \\${name}{标题}`, 1);
    out.push(N.heading(Number(name[1]), parseInline(g[1], at)));
    return i + 1;
  }

  if (name === 'hr') { out.push(N.hr()); return i + 1; }
  if (name === 'tableofcontents') { out.push(N.toc()); return i + 1; }
  if (name === 'linebreak') { out.push(N.para([N.linebreak()])); return i + 1; }

  if (name === 'raw') {
    let text = tail;
    let j = i;
    while (!bracesBalanced(text) && j + 1 < lines.length) { j++; text += '\n' + lines[j]; }
    const g = /^\{([\s\S]*)\}\s*$/.exec(text);
    if (!g) {
      throw new LaupError(
        '\\raw{…} 的花括号没有闭合',
        no,
        '\\raw 是唯一放行 HTML 的通道，所以要求显式闭合、可统计',
        j - i + 1,
      );
    }
    out.push(N.raw(g[1]));
    return j + 1;
  }

  throw new LaupError(`\\${name} 不是块级命令`, no, '它是行内命令，请写在段落里', 1);
}

function bracesBalanced(text) {
  let depth = 0;
  for (let k = 0; k < text.length; k++) {
    if (text[k] === '\\') { k++; continue; }
    if (text[k] === '{') depth++;
    else if (text[k] === '}') { depth--; if (depth < 0) return false; }
  }
  return depth === 0;
}
