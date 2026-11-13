// 渲染态选中 → 源码偏移。纯逻辑，不碰 DOM，所以能单测。
//
// 为什么需要这一层：渲染态下块显示的是 HTML，界面上的文字**没有标记**
// （`\textbf{粗}` 显示成加粗的「粗」）。用户在渲染态选了一段文字再点「加粗」，
// 我们必须知道这段文字在**源码**里是哪几个字符，否则整篇源码就没法改。
//
// 做法三步：
//   ① 把源码「脱标记」成纯文本，并记住每个纯文本字符来自源码的哪个下标
//      （toggleOps.js 的 `stripToPlain`）；
//   ② 把**渲染出来的文字**对齐到这份纯文本 —— 两个串本该逐字相同，但渲染端会
//      生成源码里没有的字（`\cite{1}` → `[1]`、公式的排版结果、脚注上标），
//      也会丢掉一些（`\linebreak` → `<br>`），所以要用带窗口的容错对齐；
//   ③ 把渲染文字的下标换算成源码下标。
//
// ⚠️ 对齐是**启发式**的，可能会锁到错的位置上。所以最后有一道质量闸：
// 对不上的比例太高（表格 / 图表 / 纯公式块）就返回 null，
// 让调用方明确地"不动作 + 提示"，而不是改坏稿子。

import { stripToPlain, alignToLayerBounds } from './toggleOps.js';

// 从 (i, j) 出发，两串还能连续相同多少个字符
function runLen(a, i, b, j) {
  let n = 0;
  while (i + n < a.length && j + n < b.length && a[i + n] === b[j + n]) n += 1;
  return n;
}

// rtxt（渲染文字）→ plain（源码脱标记后的文字）的下标对照。
// 返回长度 = rtxt.length 的数组，-1 表示这个字符是渲染端**生成**的、源码里没有。
//
// `win` 是容错窗口：错位时最多左右各跳这么多字符去找"能重新对上"的位置。
// 取值不用大 —— 生成物通常是几个字符（`[1]`、`(?)`、上标数字）。
export function alignRendered(rtxt, plain, win = 16) {
  const out = new Array(rtxt.length).fill(-1);
  let i = 0;
  let p = 0;
  while (i < rtxt.length && p < plain.length) {
    if (rtxt[i] === plain[p]) { out[i] = p; i += 1; p += 1; continue; }

    // 错位了：在窗口里找最像"重新对上"的那一对 (di, dp)。
    // 打分 = 接下来能连续对上的长度 × 10 − 跳过的字符数 ——
    // 优先"接着能对上一长串"的位置，其次才是"跳得少"。
    // （只按跳得少来选会踩坑：`甲 乙\n丙 丁` 渲染成 `甲 乙 丙 丁`，
    //   在换行处"跳 0 个渲染字符 + 跳 2 个源码字符"能对上 1 个字，
    //   而"各跳 1 个"能对上后面整整 3 个字 —— 后者才是对的。）
    let best = null;
    for (let di = 0; di <= win && i + di < rtxt.length; di += 1) {
      for (let dp = 0; dp <= win && p + dp < plain.length; dp += 1) {
        const cost = di + dp;
        if (best && cost > win && cost > best.cost) break;
        const run = runLen(rtxt, i + di, plain, p + dp);
        if (run === 0) continue;
        // 单个 ASCII 字符的重合多半是巧合（逗号、空格到处都是），要求代价为 0 才算数；
        // 单个 CJK 字符的重合则很有意义（一个字就够独特了）。
        if (run === 1 && cost > 0 && rtxt.charCodeAt(i + di) < 128) continue;
        if (!best || run * 10 - cost > best.score) best = { di, dp, score: run * 10 - cost };
      }
    }

    if (!best) { i += 1; continue; }   // 这个渲染字符在源码里找不到 → 标成"生成物"
    i += best.di;
    p += best.dp;
  }
  return out;
}

// 渲染文字的下标区间 [rs, re) → 源码偏移区间 { text, start, end }。
//
// ⚠️ 返回的 `text` **可能与传入的 `src` 不同** —— 边界对齐会劈开跨越边界的样式层
// （插入 `}` + 头部标记），所以调用方必须用返回的 text，不能继续用自己那份 src。
//
// `key` 是被施加的格式（'bold' / 'fontcolor' …）。它只影响"边界正好卡在层边界上"
// 那一步：只有**同类型**的层才会被整体纳进来，别的类型不动
// （详见 toggleOps.js 的 alignToLayerBounds）。
//
// 对不上（返回 null）的情形：两端都落在"生成物"上、整块没什么可对齐的内容。
export function mapRenderedRange(src, rtxt, rs, re, key = null, win = 16) {
  const { plain, map } = stripToPlain(src);
  if (!plain || !rtxt) return null;

  const al = alignRendered(rtxt, plain, win);
  const matched = al.reduce((n, v) => n + (v >= 0 ? 1 : 0), 0);
  // 质量闸：一半以上都对不上，说明这块不是"纯文字块"（表格 / 图 / 公式）→ 放弃。
  if (matched * 2 < rtxt.length) return null;

  const srcAt = (k) => (al[k] >= 0 ? map[al[k]] : -1);
  const lo = Math.max(0, Math.min(rs, rtxt.length));
  const hi = Math.max(lo, Math.min(re, rtxt.length));

  // 光标（没选中文字）：落到右边最近一个有来源的字符上
  if (lo === hi) {
    let k = lo;
    while (k < rtxt.length && srcAt(k) < 0) k += 1;
    if (k >= rtxt.length) return null;
    const at = srcAt(k);
    return { text: src, start: at, end: at };
  }

  let a = lo;
  while (a < hi && srcAt(a) < 0) a += 1;
  if (a >= hi) return null;
  let b = hi - 1;
  while (b >= a && srcAt(b) < 0) b -= 1;
  if (b < a) return null;

  const start = srcAt(a);
  const end = srcAt(b) + 1;
  if (end <= start) return null;

  // 把边界推到层边界上，否则"只改选中的那半截"做不到（会把没选中的一起改了）
  return alignToLayerBounds(src, start, end, key);
}

// 只想知道"这块能不能在渲染态被编辑"时用（不必算出具体区间）
export function canMapBlock(src, rtxt) {
  const { plain } = stripToPlain(src);
  if (!plain || !rtxt) return false;
  const al = alignRendered(rtxt, plain);
  const matched = al.reduce((n, v) => n + (v >= 0 ? 1 : 0), 0);
  return matched * 2 >= rtxt.length;
}
