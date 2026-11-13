// 渲染态直接编辑的**纯逻辑**：把「渲染文字上的改动」换算成「源码上的改动」。
//
// ── 为什么需要这一层
//   Laup 的块在屏幕上是渲染结果（`\textbf{粗}` 显示成加粗的「粗」），
//   界面上根本没有标记。用户在渲染态里打字、删字、用输入法上屏，
//   浏览器改的是**渲染出来的 DOM**，而我们要改的是**源码**。
//   两者之间隔着一层映射 —— 就是这里。
//
// ── 与 inlineMap.js 的分工
//   inlineMap 解决"渲染态**划选**一段 → 源码区间"（一次性、有交互兜底：
//   换算不出来就提示，用户换个位置重试）。
//   这里解决的是"**每一次按键**"：位置要更精确、失败要更早暴露，
//   所以把对齐结果缓存成 align 结构反复用，而不是每敲一个字重算一遍。
//
// ── 诚实的边界
//   对齐是**启发式**的（见 inlineMap 的文件头）。所以：
//     · 整块对不上（表格 / 图表 / 纯公式）→ `ok:false`，调用方让这块退回源码态；
//     · 局部对不上（公式排版结果、`\cite{1}` 渲染出来的 `[1]`）→ 那些字符是**原子**，
//       光标不能落进去、删除也不能跨过去。
//   宁可让用户双击展开源码，也不要悄悄改坏稿子。

import { stripToPlain, sweepEmptyLayers } from "./toggleOps.js";
import { alignRendered } from "./inlineMap.js";

/**
 * 空块：源码剥掉**块级标记**与空白之后一无所有（`# ` / `> ` / `- ` / `1. ` / `- [ ] ` / 空行）。
 *
 * ⚠️ 为什么不能只看"渲染文字为空"：`\m{x^2}` 这种纯公式块里的公式是**原子**，
 * `contentText` 会把它跳过，所以它的渲染文字也是空的 —— 但它绝不能被当成空块，
 * 往里打字会改掉这一块的语义（公式块变成"公式 + 文字"）。
 * 所以必须同时要求**源码本身没有任何内容**。
 */
export function isBlankSource(local) {
  return String(local)
    .split("\n")
    .every((line) => /^\s*(?:#{1,6}|>|[-*+]|\d+\.)?\s*(?:\[[ xX]\]\s*)?$/.test(line));
}

/**
 * 给一块建立"渲染文字 → 源码"的对齐表。
 *
 * @param {string} local 这一块的源码（不是整篇）
 * @param {string} rtxt  这一块渲染出来的纯文字（**不含**块操作图标栏的文字）
 * @returns {{ok: boolean, plain: string, map: number[], al: number[], empty?: boolean, emptyAt?: number, reason?: string}}
 *   `al[i]` = 渲染文字第 i 个字符来自 plain 的第几个字符，-1 表示"源码里没有"（渲染端生成的）
 *   `map[j]` = plain 第 j 个字符在源码里的下标
 *   `empty:true` = 这是个空块（见下），`emptyAt` 是它的插入点
 */
export function alignBlock(local, rtxt) {
  const { plain, map } = stripToPlain(local);
  if (!plain || !rtxt) {
    // ── 「空块」不是失败，它**必须能直接打字**。
    //   新建文档的骨架就是一个空块（starter.js 的 `# `），回车拆块、把内容删光，
    //   得到的也都是空块 —— 这是最常见的开局。原先这里一律返回 ok:false，
    //   于是 makeLive() 把块标成 `is-opaque` 且**不给 contenteditable**：
    //   用户点上去看着毫无反应、也打不了字，只有双击展开源码才能写。
    //   那既违背本项目「渲染态直接编辑、看不见源码」的立场，也让新建文档根本没法开始。
    //   （这是真鼠标探针抓出来的：站内 /laup 与 public/laup/ 静态副本共用同一个内核，
    //   但静态副本单点是进源码 textarea，站内版落到 is-opaque —— 差异就出在这一行。）
    if (!rtxt && isBlankSource(local)) {
      return {
        ok: true,
        plain: plain || "",
        map: map || [],
        al: [],
        empty: true,
        emptyAt: String(local).length,
      };
    }
    return { ok: false, plain: plain || "", map: map || [], al: [], reason: "空的" };
  }
  const al = alignRendered(rtxt, plain);
  const matched = al.reduce((n, v) => n + (v >= 0 ? 1 : 0), 0);
  // 与 inlineMap 的质量闸同一个口径：一半以上对不上就整体放弃。
  if (matched * 2 < rtxt.length) {
    return { ok: false, plain, map, al, reason: "这块不是纯文字（表格 / 图表 / 公式）" };
  }
  return { ok: true, plain, map, al };
}

/** 渲染文字的位置 k 是不是"源码里没有的"（公式排版结果、`[1]` 这类生成物）。 */
export function isAtom(align, k) {
  return !align || k < 0 || k >= align.al.length || align.al[k] < 0;
}

/**
 * 渲染文字区间 [from, to) → 源码区间。两端都落在生成物上则返回 null。
 * @returns {{start:number,end:number}|null}
 */
export function rangeOf(align, from, to) {
  if (!align?.ok) return null;
  let a = Math.max(0, from);
  const hi = Math.min(to, align.al.length);
  while (a < hi && align.al[a] < 0) a += 1;
  if (a >= hi) return null;
  let b = hi - 1;
  while (b >= a && align.al[b] < 0) b -= 1;
  if (b < a) return null;
  const start = align.map[align.al[a]];
  const end = align.map[align.al[b]] + 1;
  if (end <= start) return null;
  return { start, end };
}

/**
 * 光标（渲染文字的第 at 个字符处）对应源码里的**插入点**偏移。
 *
 * 规则：往右找第一个有来源的字符，插在它**前面**；右边没有就找左边第一个，
 * 插在它**后面**。这样"在加粗文字末尾打字"会落在 `\textbf{…}` 的花括号**里面**，
 * 而不是跑出标记外面 —— 用户看到的粗体字继续是粗体。
 *
 * @returns {number|null}
 */
export function insertPoint(align, at) {
  if (!align?.ok) return null;
  // 空块没有可对齐的文字，插入点就定在这块源码的末尾 ——
  // 块级标记（`# ` / `> ` / `- ` / `1. `）都是**前缀**，追加在末尾正好是"标记之后"，
  // 也就是用户看着一个空行、往里打字时想要的落点。
  if (align.empty) return align.emptyAt;
  const n = align.al.length;
  const k = Math.max(0, Math.min(at, n));
  for (let i = k; i < n; i += 1) {
    if (align.al[i] >= 0) return align.map[align.al[i]];
  }
  for (let i = Math.min(k, n) - 1; i >= 0; i -= 1) {
    if (align.al[i] >= 0) return align.map[align.al[i]] + 1;
  }
  return null;
}

/**
 * 渲染文字的第 at 个字符处**能不能**插入（不能 = 那儿是原子，比如块里只有一个公式）。
 */
export function canInsertAt(align, at) {
  return insertPoint(align, at) != null;
}

/**
 * 反差两段渲染文字，得到"哪里变成了什么"。
 * 返回的区间是**旧文字坐标**：把旧文字 [start, end) 换成 `text` 就得到新文字。
 *
 * @returns {{start:number, end:number, text:string}}
 */
export function diffText(before, after) {
  const a = String(before ?? "");
  const b = String(after ?? "");
  const max = Math.min(a.length, b.length);
  let s = 0;
  while (s < max && a[s] === b[s]) s += 1;
  let tail = 0;
  while (tail < max - s && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail += 1;
  return { start: s, end: a.length - tail, text: b.slice(s, b.length - tail) };
}

/** 源码里把 [start, end) 换成 text。 */
export function replaceSource(local, start, end, text) {
  return local.slice(0, start) + text + local.slice(end);
}

/**
 * 「渲染态直接编辑」的一次完整换算。
 *
 * 三种意图共用它：
 *   · 插入文字（打字、粘贴、输入法上屏）：`before`/`after` 给旧新文字
 *   · 删除（退格 / Delete / 选中后删除）：同上，`text` 为空
 *
 * @param {string} local  改动前这一块的源码
 * @param {string} rtxt   改动前这一块渲染出来的文字
 * @param {string} after  改动后这一块渲染出来的文字
 * @returns {{text:string, caret:number}|null}
 *   `text` = 改动后的块源码；`caret` = 光标应落在**渲染文字**的哪个位置上。
 *   返回 null = 换算不出来，调用方必须放弃这次改动并提示（绝不猜）。
 */
export function applyLiveText(local, rtxt, after) {
  const align = alignBlock(local, rtxt);
  if (!align.ok) return null;

  const d = diffText(rtxt, after);
  // 删除：把 [start, end) 映射回源码，整段删掉。
  // ⚠️ 删完要扫一遍空层：用户把 `\textbf{粗}` 删成空之后，源码里留一个 `\textbf{}`
  // 他自己是看不见的（渲染态直接编辑下他根本看不到源码）—— 这活得编辑器替他干。
  if (!d.text) {
    const r = rangeOf(align, d.start, d.end);
    if (!r) return null;
    const text = sweepEmptyLayers(replaceSource(local, r.start, r.end, ""));
    return { text, caret: d.start };
  }

  // 插入：位置映射成一个插入点。⚠️ start === end 时走 insertPoint，
  // 否则（替换式输入）按区间替换。
  if (d.start === d.end) {
    const at = insertPoint(align, d.start);
    if (at == null) return null;
    return {
      text: replaceSource(local, at, at, d.text),
      caret: d.start + d.text.length,
    };
  }

  const r = rangeOf(align, d.start, d.end);
  if (!r) return null;
  return {
    text: replaceSource(local, r.start, r.end, d.text),
    caret: d.start + d.text.length,
  };
}

/**
 * 把渲染出来的文字切成「一段段可编辑区间」，供 DOM 层逐个文本节点标记。
 *
 * @param {{al:number[], map:number[]}} align
 * @param {number} from 该文本节点在渲染文字里的起始偏移
 * @param {number} to   该文本节点在渲染文字里的结束偏移（不含）
 * @returns {{start:number, end:number}|null} 源码区间；null = 这个节点整个是生成物
 */
export function nodeRange(align, from, to) {
  return rangeOf(align, from, to);
}
