// 行内解析：md 行内标记 + Laup 行内命令，混排在同一段里。
//
// ⚠️ 消歧的核心在这条（规范 §10.2）：
//   `\` + **字母** → Laup 命令
//   `\` + **标点** → 字面量（md 的转义语义）
// 这不是妥协，是正交互斥——CommonMark 规定 `\` 后接非标点不构成转义。

import { N } from './ast.js';
import { LaupError } from './diag.js';
import { claimCore, lookupInlineCommand } from './extensions.js';

const NAMED_COLORS = new Set([
  'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'teal', 'gray', 'grey',
  'black', 'white', 'brown', 'cyan', 'magenta', 'lime', 'navy', 'olive', 'maroon',
  'silver', 'aqua', 'fuchsia', 'gold', 'crimson', 'tomato', 'salmon', 'khaki',
  'indigo', 'violet', 'turquoise', 'beige', 'ivory', 'coral', 'plum', 'orchid',
  'tan', 'azure', 'mint', 'lavender', 'transparent',
]);

// 颜色的取值口径由 Laup 自己定：命名色（见上面的 NAMED_COLORS）/ #rgb / #rrggbb /
// rgb() / rgba()。这是 Laup 的规则，不是从别处对齐来的 —— 所以它只在自己的
// 白名单（src/whitelist.js 的 CORE_STYLE_PROPS）里出现一次，改这里就够了。
export function safeColor(raw) {
  const s = String(raw).trim().toLowerCase().replace(/^["']|["']$/g, '');
  if (NAMED_COLORS.has(s)) return s;
  if (/^#[0-9a-f]{3}$/.test(s) || /^#[0-9a-f]{6}$/.test(s)) return s;
  if (/^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/.test(s)) return s;
  return null;
}

export function safeSize(raw) {
  const n = parseInt(String(raw).trim(), 10);
  return Number.isFinite(n) && n >= 8 && n <= 72 ? n : null;
}

function readGroup(src, i) {
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '\\') { j++; continue; }
    if (src[j] === '{') depth++;
    else if (src[j] === '}') {
      depth--;
      if (depth === 0) return { value: src.slice(i + 1, j), next: j + 1 };
    }
  }
  return null;
}

function clean(v) {
  return String(v).trim().replace(/^["']|["']$/g, '');
}

function takePair(src, i, open, close) {
  const end = src.indexOf(close, i + open.length);
  if (end < 0) return null;
  const inner = src.slice(i + open.length, end);
  if (!inner.trim()) return null;
  return { inner, next: end + close.length };
}

// `$` 防价格误判（沿用 latexScan.js 的思路）：判不出来就降级为字面量，不报错
function takeMath(src, i) {
  if (src.startsWith('$$', i)) {
    const end = src.indexOf('$$', i + 2);
    if (end > 0) return { tex: src.slice(i + 2, end), display: true, next: end + 2 };
    return null;
  }
  const end = src.indexOf('$', i + 1);
  if (end < 0) return null;
  const inner = src.slice(i + 1, end);
  if (!inner || /^\s/.test(inner) || /\s$/.test(inner)) return null;
  if (/^[\d\s.,%]+$/.test(inner)) return null;
  const looksMath = /\\[A-Za-z]+/.test(inner) || /[\^_{}<>]|[=+\-*/]/.test(inner) || inner.trim().length <= 8;
  if (!looksMath) return null;
  return { tex: inner, display: false, next: end + 1 };
}

const CMD = {
  textcolor: { n: 2, build: (a, rec, ctx) => tint(clean(a[0]), null, a[1], rec, ctx) },
  fontcolor: { n: 2, build: (a, rec, ctx) => tint(clean(a[0]), null, a[1], rec, ctx) },
  colorbox: { n: 2, build: (a, rec, ctx) => tint(null, clean(a[0]), a[1], rec, ctx) },
  fontsize: {
    n: 2,
    build: (a, rec, ctx) => {
      const size = safeSize(a[0]);
      if (!size) {
        ctx.warn(`字号 "${a[0]}" 必须是 8–72 的整数，已忽略该样式`);
        return rec(a[1]);
      }
      return [N.size(size, rec(a[1]))];
    },
  },
  textbf: { n: 1, build: (a, rec) => [N.strong(rec(a[0]))] },
  textit: { n: 1, build: (a, rec) => [N.emph(rec(a[0]))] },
  underline: { n: 1, build: (a, rec) => [N.underline(rec(a[0]))] },
  sout: { n: 1, build: (a, rec) => [N.del(rec(a[0]))] },
  code: { n: 1, build: (a) => [N.code(a[0])] },
  math: { n: 1, build: (a) => [N.math(a[0], false)] },
  href: { n: 2, build: (a, rec) => [N.link(clean(a[0]), rec(a[1]))] },
  url: { n: 1, build: (a) => [N.link(clean(a[0]), [N.text(clean(a[0]))])] },
  eqref: { n: 1, build: (a) => [N.eqref(clean(a[0]))] },
  footnote: { n: 1, build: (a, rec) => [N.footnote(rec(a[0]))] },
  linebreak: { n: 0, build: () => [N.linebreak()] },
};

// 核心的命令名记账：挡住"扩展想占用核心已经实现的命令名"这种静默遮蔽
// （核心查表在前，扩展装在后面就会被无声盖掉 —— 那种 bug 找不到）。
claimCore('inlineCommand', Object.keys(CMD), 'core/inline.js');

function tint(color, bg, contentSrc, rec, ctx) {
  if (color !== null && !color) { ctx.warn('取到了空颜色值，已忽略'); return rec(contentSrc); }
  const c = color === null ? null : safeColor(color);
  const b = bg === null ? null : safeColor(bg);
  if (color !== null && !c) ctx.warn(`颜色 "${color}" 不在白名单里，已忽略该样式`);
  if (bg !== null && !b) ctx.warn(`背景色 "${bg}" 不在白名单里，已忽略该样式`);
  if (!c && !b) return rec(contentSrc);
  return [N.color(c, b, rec(contentSrc))];
}

function runCommand(name, src, pos, ctx) {
  // 核心表在前、扩展表在后：核心的名字是保留的（defineExtension 会拒绝撞名），
  // 所以这里的顺序不会让谁被无声盖掉。
  const spec = CMD[name.toLowerCase()] || lookupInlineCommand(name.toLowerCase());
  if (!spec) return null;
  const args = [];
  let p = pos;
  for (let k = 0; k < spec.n; k++) {
    while (src[p] === ' ' || src[p] === '\t') p++;
    if (src[p] !== '{') {
      throw new LaupError(`\\${name} 需要 ${spec.n} 个 {} 参数，只读到 ${k} 个`, ctx.line, `写成 \\${name}{…}`);
    }
    const g = readGroup(src, p);
    if (!g) throw new LaupError(`\\${name} 的参数花括号没有闭合`, ctx.line);
    args.push(g.value);
    p = g.next;
  }
  const rec = (s) => parseInline(s, ctx);
  return { nodes: spec.build(args, rec, ctx), next: p };
}

export function parseInline(src, ctx) {
  const out = [];
  let buf = '';
  let i = 0;
  const flush = () => { if (buf) { out.push(N.text(buf)); buf = ''; } };

  while (i < src.length) {
    const c = src[i];
    const rest = src.slice(i);

    if (c === '\\') {
      const cmd = /^\\([A-Za-z][A-Za-z0-9]*)/.exec(rest);
      if (cmd) {
        const r = runCommand(cmd[1], src, i + cmd[0].length, ctx);
        if (r) { flush(); out.push(...r.nodes); i = r.next; continue; }
        ctx.warn(`未知命令 \\${cmd[1]}，已按字面量输出`);
        buf += cmd[0];
        i += cmd[0].length;
        continue;
      }
      const nx = src[i + 1];
      if (nx && !/[A-Za-z0-9]/.test(nx)) { buf += nx; i += 2; continue; }
      buf += '\\';
      i += 1;
      continue;
    }

    if (c === '`') {
      const g = takePair(src, i, '`', '`');
      if (g) { flush(); out.push(N.code(g.inner)); i = g.next; continue; }
    }

    if (c === '!' && src[i + 1] === '[') {
      const m = /^!\[([^\]]*)\]\(\s*([^\s)]+)(?:\s+"([^"]*)")?\s*\)/.exec(rest);
      if (m) {
        flush();
        // md 的 title 是**悬停提示**，不是可见图注 —— 两者分开存，不混为一谈
        out.push(N.image(m[2], { alt: m[1], title: m[3] || '' }));
        i += m[0].length;
        continue;
      }
    }

    if (c === '[') {
      const m = /^\[([^\]]*)\]\(\s*([^\s)]+)\s*\)/.exec(rest);
      if (m) {
        flush();
        out.push(N.link(m[2], parseInline(m[1], ctx)));
        i += m[0].length;
        continue;
      }
    }

    if (c === '<') {
      const m = /^<([a-z][a-z0-9+.-]*:[^>\s]+)>/i.exec(rest);
      if (m) {
        flush();
        out.push(N.link(m[1], [N.text(m[1])]));
        i += m[0].length;
        continue;
      }
    }

    if (c === '$') {
      const g = takeMath(src, i);
      if (g) { flush(); out.push(N.math(g.tex, g.display)); i = g.next; continue; }
    }

    if (c === '*' || c === '~') {
      const open = c === '*' ? (src[i + 1] === '*' ? '**' : '*') : '~~';
      const g = takePair(src, i, open, open);
      if (g) {
        flush();
        const kids = parseInline(g.inner, ctx);
        out.push(open === '**' ? N.strong(kids) : open === '*' ? N.emph(kids) : N.del(kids));
        i = g.next;
        continue;
      }
    }

    buf += c;
    i += 1;
  }

  flush();
  return out;
}
