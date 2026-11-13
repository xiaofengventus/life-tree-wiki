// 选中文字后出现的**浮动工具栏**（不是跟着光标跑的那种）。
//
// 两条来源都要支持（用户点名要的）：
//   ① 源码态：正在编辑的 textarea 里有选区 → 用 textarea 自己的偏移；
//   ② 渲染态：直接在渲染出来的文字上划选 → 偏移要换算回源码，
//      那是 inlineMap.js 的活，这里只负责把"渲染文字的第几个字符"量出来。
//
// 这个模块只管**界面与选区测量**，不碰 source —— 真正的改动交给 onApply 回调，
// 那边才知道怎么写回稿子。（这样"改坏稿子"和"工具栏长什么样"能分开测。）
//
// 按钮与色板弹出层都来自 ./formatUi.js（与固定工具栏**同一份**，见那边的注释）。
//
// ⚠️ 点按钮时**绝不能**让 textarea 失焦：mousedown 一律 preventDefault，
// 否则选区当场消失、动作落在空气上。唯一的例外是 `input[type="color"]` ——
// 拦了系统取色器就打不开，所以那些按钮走"冻结选区"的路子
// （见冻结 ctx 的说明）。

import { FBAR_ROWS } from './formatSpec.js';
import { buildFbarButtons, makePop, popAction, closePops, togglePopover } from './formatUi.js';

// 量文字宽度用的离屏 canvas（源码态是等宽字体，所以按宽度算出的位置相当准）
let metricsCtx = null;
function textWidth(cs, text) {
  if (!metricsCtx) metricsCtx = document.createElement('canvas').getContext('2d');
  metricsCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`.trim();
  return metricsCtx.measureText(text).width;
}

// ── 选区的"身份"
//
// 内容没变就不要重排工具栏（selectionchange 触发得很密，
// 每次都重建 DOM 会让按钮点不稳）。
function selectionInfo() {
  const active = document.activeElement;

  // ① 源码态：正在编辑的 textarea
  if (active && active.classList && active.classList.contains('laup-src')) {
    const { selectionStart: s, selectionEnd: e } = active;
    if (s === e) return null;
    const wrap = active.closest('.laup-blk');
    const blockIdx = wrap ? Number(wrap.dataset.index) : NaN;
    if (!Number.isInteger(blockIdx)) return null;
    return {
      mode: 'src',
      ta: active,
      blockIdx,
      rtxt: null,
      from: s,
      to: e,
      range: { start: s, end: e },
      rect: textareaSelRect(active, s, e),
      // 滚动后要重新量一次位置（fixed 定位不会自己跟着内容走）
      remeasure: () => textareaSelRect(active, s, e),
      key: `src:${blockIdx}:${s}-${e}:${active.value.length}`,
    };
  }

  // ② 渲染态：浏览器自己的选区，且必须整段落在**同一个没在编辑的块**里
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
  const range = sel.getRangeAt(0);
  const host = closestBlock(range.startContainer);
  if (!host || host.classList.contains('is-editing')) return null;
  if (closestBlock(range.endContainer) !== host) return null;

  const info = blockTextInfo(host);
  const from = info.offsetOf(range.startContainer, range.startOffset);
  const to = info.offsetOf(range.endContainer, range.endOffset);
  if (from < 0 || to < 0 || from === to) return null;

  const clone = range.cloneRange();      // 选区对象会被后续操作改掉，先留一份自己的
  return {
    mode: 'html',
    blockEl: host,
    blockIdx: Number(host.dataset.index),
    rtxt: info.text,
    from: Math.min(from, to),
    to: Math.max(from, to),
    rect: rangeRect(range),
    remeasure: () => rangeRect(clone),
    key: `html:${host.dataset.index}:${from}-${to}`,
  };
}

function closestBlock(node) {
  const el = node && node.nodeType === 3 ? node.parentElement : node;
  return el && el.closest ? el.closest('.laup-blk') : null;
}

// 块里"看得见的文字" + 「DOM 坐标 → 文字下标」的换算。
// ⚠️ 必须跳过左侧图标栏（`.laup-rail`）—— 那几个按钮的箭头也是文本节点，
// 算进去的话所有下标都会偏 4。
function blockTextInfo(host) {
  const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
  const parts = [];
  let text = '';
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (n.parentElement && n.parentElement.closest('.laup-rail')) continue;
    parts.push({ node: n, start: text.length });
    text += n.data;
  }
  const offsetOf = (node, offset) => {
    if (node.nodeType === 3) {
      const hit = parts.find((p) => p.node === node);
      return hit ? hit.start + offset : -1;
    }
    // 元素节点：offset 是"第几个子节点"，换算成它前面所有文字的长度
    let sum = 0;
    const kids = Array.from(node.childNodes).slice(0, offset);
    for (const k of kids) {
      const hit = parts.find((p) => p.node === k);
      if (hit) { sum = hit.start + k.data.length; continue; }
      // 子节点本身是元素 → 用它的所有后代文字
      const w = document.createTreeWalker(k, NodeFilter.SHOW_TEXT);
      let last = sum;
      while (w.nextNode()) {
        const h2 = parts.find((p) => p.node === w.currentNode);
        if (h2) last = h2.start + w.currentNode.data.length;
      }
      sum = last;
    }
    return sum;
  };
  return { text, parts, offsetOf };
}

function rangeRect(range) {
  const rects = range.getClientRects();
  if (!rects.length) {
    const r = range.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
  }
  const first = rects[0];
  const last = rects[rects.length - 1];
  return { left: first.left, right: last.right, top: first.top, bottom: last.bottom };
}

// textarea 里选区的屏幕位置。
// 源码是等宽字体，所以"第几行 × 行高"定位 y、"前几个字符量宽度"定位 x 都够准。
function textareaSelRect(ta, s, e) {
  const cs = getComputedStyle(ta);
  const lh = parseFloat(cs.lineHeight) || 20;
  const padT = parseFloat(cs.paddingTop) || 0;
  const padL = parseFloat(cs.paddingLeft) || 0;
  const box = ta.getBoundingClientRect();
  const val = ta.value;

  const lineOf = (at) => {
    const before = val.slice(0, at);
    const ls = before.split('\n');
    return { idx: ls.length - 1, col: ls[ls.length - 1] };
  };
  const a = lineOf(s);
  const b = lineOf(e);

  const xAt = (at, line) => box.left + padL + textWidth(cs, line) - ta.scrollLeft;
  const yAt = (i) => box.top + padT + i * lh - ta.scrollTop;

  const left = Math.min(xAt(s, a.col), box.right - 12);
  const right = Math.max(xAt(e, b.col), left + 6);
  return { left, right, top: yAt(a.idx), bottom: yAt(b.idx) + lh };
}

// ── 主体

export function initFbar({ onApply, onTip, mount }) {
  const bar = document.createElement('div');
  bar.className = 'fbar';
  bar.hidden = true;

  const pops = new Map();
  let frozen = null;      // 被系统取色器夺焦时冻住的选区

  for (const kind of ['fg', 'bg', 'head']) {
    const pop = makePop(kind);
    bar.appendChild(pop);
    pops.set(kind, pop);
  }
  buildFbarButtons(bar, FBAR_ROWS);

  // ⚠️ 挂进宿主给的容器，不挂 document.body —— 站点把编辑器嵌进 Vue 组件之后，
  // 挂 body 的工具栏就跑到了 .laup-app 外面，而 Laup 的 CSS 变量
  // （--fg / --line / --soft…）全定义在那个容器上 → 工具栏变成没样式的一坨。
  (mount || document.body).appendChild(bar);

  // ── 事件
  //
  // mousedown 一律 preventDefault：不让 textarea 失焦、不让渲染态的选区消失。
  // `input[type=color]` 例外（拦了系统取色器打不开），走冻结选区。
  bar.addEventListener('mousedown', (e) => {
    if (e.target.closest('input[type="color"]')) return;
    e.preventDefault();
  });

  let current = null;

  function fire(key, arg) {
    const ctx = current || frozen;
    if (!ctx) return;
    const ok = onApply(key, arg, ctx);
    if (!ok) onTip('这一处改不了 —— 换个位置再试');
    // 改完后选区已经失效（源码变了 / DOM 重绘了），收起来不让它悬在半空
    hide();
  }

  bar.addEventListener('click', (e) => {
    // 色块 / 「默认颜色 · 清除背景色」/ 标题档位 —— 解析逻辑与固定工具栏共用
    const act = popAction(e.target);
    if (act) { fire(act.key, act.arg); return; }

    const btn = e.target.closest('.fbar-btn');
    if (!btn) return;
    if (btn.dataset.pop) { togglePopover(pops, btn.dataset.pop); return; }
    fire(btn.dataset.key);
  });

  // 系统取色器：一弹出来就会夺焦，先把选区冻住
  for (const kind of ['fg', 'bg']) {
    const input = pops.get(kind).querySelector('input[type="color"]');
    input.addEventListener('mousedown', () => { frozen = current; });
    input.addEventListener('change', () => {
      const color = input.value.trim().toLowerCase();
      // `change` 而不是 `input`：拖动取色器时 input 会连着触发几十次
      fire(kind === 'bg' ? 'bgcolor' : 'fontcolor', color);
    });
  }

  function place(info) {
    const r = info.rect;
    const w = bar.offsetWidth || 300;
    const h = bar.offsetHeight || 34;
    let left = (r.left + r.right) / 2 - w / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    // 默认浮在选区**上方**；上方没地方就落到下方（不然会被吸顶的工具栏压住）
    let top = r.top - h - 8;
    const topLimit = document.querySelector('.chrome')?.getBoundingClientRect().bottom ?? 0;
    if (top < topLimit + 6) top = Math.min(r.bottom + 8, window.innerHeight - h - 8);
    bar.style.left = `${Math.round(left)}px`;
    bar.style.top = `${Math.round(Math.max(8, top))}px`;
  }

  function sync() {
    const info = selectionInfo();
    if (!info) { hide(); return; }
    if (frozen && current && info.key === current.key) { frozen = null; return; }
    current = info;
    frozen = null;
    closePops(pops);
    bar.hidden = false;
    bar.querySelectorAll('.fbar-btn').forEach((b) => b.classList.remove('is-on'));
    place(info);
  }

  function hide() {
    if (!bar.hidden) bar.hidden = true;
    closePops(pops);
    current = null;
    frozen = null;
  }

  let raf = 0;
  // 滚动 / 窗口变化时**重新量一次位置**，而不是收起来。
  //
  // ⚠️ 早先的做法是"一滚动就收起"，结果被一个隐蔽的时序坑到：
  // 进源码态时 `ta.scrollIntoView()` 也会发 scroll 事件，而它是**异步**到的 ——
  // 于是工具栏刚为选区显示出来，马上又被这个 scroll 收掉了，
  // 表现成"选了半天工具栏闪一下就没"。（探针里才看得出来。）
  function reposition() {
    if (bar.hidden || !current) return;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (bar.hidden || !current) return;
      const r = current.remeasure ? current.remeasure() : null;
      if (!r || !Number.isFinite(r.top) || r.right < 0 || r.bottom > window.innerHeight + 40) { hide(); return; }
      current.rect = r;
      place(current);
    });
  }

  return {
    sync,
    hide,
    reposition,
    // 让 editor.js 的 mousedown 处理放行（不然点工具栏会被当成"点空白 → 退出编辑"）
    contains: (node) => !!(node && node.closest && node.closest('.fbar')),
    get ctx() { return current; },
  };
}
