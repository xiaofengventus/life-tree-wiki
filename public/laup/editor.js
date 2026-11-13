// Laup 编辑器 —— 「光标块换态」（单栏）+ 工具栏 + 自建撤销栈。
//
// 屏幕上的每一块，除了光标所在的那一块，显示的都是**最终渲染结果**；
// 光标那一块换成 textarea 让你改源码。渲染用的就是 renderHtml() ——
// 和阅读端同一个函数，所以"编辑器和阅读面同一个视角"是结构上成立的，
// 不是靠两边同步维持的。
//
// 三条硬约束：
//   1. 打字时**不重建 DOM**。源码实时写回，块的行号手动平移。
//   2. 只在"光标离开块"时才重新编译 + 重绘。
//   3. **全面接管 Ctrl+Z**（见下）。
//
// 关于撤销：光标块换态下每个 textarea 都是独立的原生撤销域，
// 所以浏览器原生撤销只作用于"当前块的最后几次输入"，跨块操作与
// 插入骨架这类结构操作它完全管不了。全面接管比部分接管更好理解。
// 纯逻辑在 editor/model.js，有单测盯着（tests/history.test.mjs）。

import { compile, defineExtension, extensionSnippets, SNIPPET_CARET } from './src/index.js';
import { renderHtml } from './src/renderHtml.js';
import { lifeElements } from './extensions/life.js';
import {
  sliceBlock, blockIndexAt, applyBlockEdit, blockRange,
  insertBlockAt, moveBlock, removeBlankLine,
  makeHistory, pushHistory, undoHistory, redoHistory, canUndo, canRedo,
} from './model.js';
import { applyFormat, isInlineKey } from './toggleOps.js';
import { mapRenderedRange } from './inlineMap.js';
import { initFbar } from './fbar.js';
import { FIXED_ROWS } from './formatSpec.js';
import { STARTER_SRC } from './starter.js';
import { buildToolbarGroups, popAction, closePops, togglePopover } from './formatUi.js';
import { initHost, hostTouched } from './hostUi.js';

// ── 装扩展
//
// 核心不认识 \cite / \tree / \references / ```sample —— 它们是**宿主元素**，
// 住在 extensions/life.js（机制见 src/extensions.js）。编辑器这里把参考实现装上，
// 演示的是"宿主怎么接"：站点接 Laup 时装自己那一份，还可以传 options 换掉
// 锚点前缀与研究树路由（defineExtension(lifeElements({ citationAnchor: 'post-citation' }))），
// 一行都不用改核心。
defineExtension(lifeElements());

const els = {
  doc: document.getElementById('doc'),
  warnings: document.getElementById('warnings'),
  stats: document.getElementById('stats'),
  overlay: document.getElementById('overlay'),
  overlayDoc: document.getElementById('overlay-doc'),
  toolbar: document.getElementById('toolbar'),
  tip: document.getElementById('tb-tip'),
  undo: document.getElementById('btn-undo'),
  redo: document.getElementById('btn-redo'),
};

let source = STARTER_SRC;
let blocks = [];        // 每块带 pos = { start, end }，1-based 闭区间
let htmlOf = new Map(); // AST 节点 → 它的 HTML（用引用做 key，所以每次重编译都要重建）
let footnotesHtml = '';
let warnings = [];
let activeLine = null;  // 正在编辑的块的起始源码行；null = 全部渲染态
let undoStack = null;
let composing = false;  // 中文输入法组合期间：不记录（否则一次"你好"会留下几十条）
let skipNextInput = false;

// 整篇渲染浮层的 id 前缀。见 btn-render 处的注释：浮层与正文渲染同一篇，
// 不区分前缀就会 id 重复，站内锚点会跳到被盖住的那一份上。
const OVERLAY_ID_PREFIX = 'ov-';

// 「幻影块」—— 用户点了 +↑ / +↓ 插入的空块。
// 源码里只多了一个空行（空行不构成块），但我们得让用户能直接往里打字，
// 所以临时捏一个假块塞进 blocks，pos 正好覆盖那一行。这样 makeEditor /
// applyBlockEdit / 撤销栈全部原样复用，不需要给编辑器加第二套写回路径。
// 用户打出内容后，下一轮 recompile 那个位置就成了真块，幻影块自己消失。
let phantom = null;

// 图标栏：`+↑`/`+↓` 是"在块的上面/下面插一个新块"，`↑`/`↓` 是"把这一块上移/下移"。
// 图标全部放在块的**外部**左侧留白里 —— 放内部会让正文变窄。
const RAIL_ACTS = [
  ['above', '+↑', '在这一块的上面插入新块'],
  ['below', '+↓', '在这一块的下面插入新块'],
  ['up', '↑', '把这一块上移（Alt+↑）'],
  ['down', '↓', '把这一块下移（Alt+↓）'],
];

const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
));

// ── 编译

function recompile() {
  const res = compile(source, { mode: 'edit' });   // edit = 容错，写一半也不会炸
  const late = [];
  const out = renderHtml(res.ast, { warn: (m) => late.push({ line: null, message: m }) });
  blocks = res.ast.children;

  // 幻影块（用户刚插入、还没打字的空块）不在 AST 里，得重新塞回去。
  // ⚠️ 两个出口：① 它那一行已经有真块了（用户打出内容了）→ 丢掉幻影块；
  //            ② 还是没有 → 按行号插到正确位置。
  if (phantom) {
    const covered = blocks.some((b) => b.pos.start <= phantom.pos.start && b.pos.end >= phantom.pos.start);
    if (covered) phantom = null;
    else {
      const at = blocks.findIndex((b) => b.pos.start > phantom.pos.start);
      blocks.splice(at < 0 ? blocks.length : at, 0, phantom);
    }
  }

  htmlOf = new Map(out.parts.map((p) => [p.node, p.html]));
  footnotesHtml = out.footnotesHtml;
  warnings = res.warnings.concat(late);
}

let warnTimer = null;
function scheduleWarnRefresh() {
  clearTimeout(warnTimer);
  warnTimer = setTimeout(() => {
    // 只重算诊断，**不替换 blocks** —— 打字期间 blocks 还被 DOM 用着
    warnings = compile(source, { mode: 'edit' }).warnings;
    paintWarnings();
  }, 400);
}

// ── 绘制

function paint(opts = {}) {
  // 重绘会换掉整棵 #doc 的 DOM，渲染态的选区当场作废 —— 工具栏必须跟着收起来，
  // 否则它会悬在一个已经不存在的位置上。（源码态那边不受影响：
  // 改完源码我们会重设 textarea 的选区，selectionchange 会让它自己再冒出来。）
  fbar.hide();
  const idx = blockIndexAt(blocks, activeLine);
  els.doc.innerHTML = '';

  blocks.forEach((blk, k) => {
    const el = k === idx ? makeEditor(blk, k) : makeRendered(blk, k);
    // ⚠️ 用**块索引**标记，不用行号：打字期间行号会平移（上面的块一变长，
    // 下面所有块的行号都变），索引才不会。用行号会让"点下面的块"点错块。
    el.dataset.index = String(k);
    els.doc.appendChild(el);
  });

  if (footnotesHtml) {
    const sec = document.createElement('section');
    sec.className = 'laup-footnotes-host';
    sec.innerHTML = footnotesHtml;
    els.doc.appendChild(sec);
  }

  paintWarnings();
  paintStats();
  paintHistoryButtons();
  renderMathIn(els.doc);

  const ta = els.doc.querySelector('.laup-src');
  if (ta && opts.focus) {
    autoGrow(ta);
    ta.focus();
    const end = opts.caret === 'end' ? ta.value.length : 0;
    ta.setSelectionRange(end, end);
    ta.scrollIntoView({ block: 'nearest' });
  }

  // 宿主：草稿自动保存。挂在 paint() 出口而不是每一次改源码的地方 ——
  // 源码的写入口有十来个（工具栏 / 浮动栏 / 撤销 / 插入模板…），
  // 逐个挂必漏；它们最后全都要走 paint()，这里才是唯一的收口。
  // 没探到宿主（Laup 自己的服务器）时它是空操作。
  hostTouched();
}

function makeRendered(blk, k) {
  const div = document.createElement('div');
  div.className = 'laup-blk';
  div.innerHTML = htmlOf.get(blk) || '';
  div.appendChild(makeRail(k));
  return div;
}

// 编辑态要包一层 —— 图标栏必须挂在"块"上（悬停块**或**悬停图标栏都要让它保持可见），
// 而 textarea 不能有子元素。data-index 同时挂在包装层与 textarea 上：
// 包装层给 mousedown 的定位用，textarea 给 onInput / snapshot / 工具栏用。
function makeEditor(blk, k) {
  const wrap = document.createElement('div');
  wrap.className = 'laup-blk is-editing';

  const ta = document.createElement('textarea');
  ta.className = 'laup-src';
  ta.spellcheck = false;
  ta.dataset.index = String(k);
  ta.value = sliceBlock(source, blk);
  ta.addEventListener('input', onInput);
  ta.addEventListener('keydown', onKeyDown);

  wrap.appendChild(ta);
  wrap.appendChild(makeRail(k));
  return wrap;
}

// 块级操作图标栏（在块的左侧留白里，靠 CSS 控制悬停才出现）
function makeRail(k) {
  const rail = document.createElement('div');
  rail.className = 'laup-rail';
  for (const [act, glyph, title] of RAIL_ACTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'laup-rail-btn';
    b.dataset.act = act;
    b.title = title;
    b.textContent = glyph;
    // 首块不能上移、末块不能下移 —— 禁用掉，别让用户点了没反应以为坏了
    if ((act === 'up' && k === 0) || (act === 'down' && k === blocks.length - 1)) b.disabled = true;
    rail.appendChild(b);
  }
  return rail;
}

function autoGrow(ta) {
  ta.style.height = 'auto';
  ta.style.height = `${ta.scrollHeight}px`;
}

const currentSrc = () => els.doc.querySelector('.laup-src');

// ── 定位
//
// blockIndexAt / sliceBlock / applyBlockEdit 都在 ./model.js
// —— 纯逻辑抽出去才测得到，这里是编辑器最容易错的几行。

function activateLine(line, caret) {
  recompile();          // 固化刚才的编辑（块可能因此重新划分）
  activeLine = line;
  paint({ focus: true, caret });
}

function leaveEdit() {
  // 用户点了 +↑ / +↓ 却一个字都没打就离开了 —— 把那一行还回去，别攒出一串空行。
  // removeBlankLine 遇到非空行会返回 null，所以真打了内容绝不会被误删。
  if (phantom) {
    const cleaned = removeBlankLine(source, phantom.pos.start);
    if (cleaned !== null) source = cleaned;
    phantom = null;
  }
  recompile();
  activeLine = null;
  paint();
}

function jumpTo(idx, caret) {
  const blk = blocks[idx];
  if (blk) activateLine(blk.pos.start, caret);
}

// ── 块级操作（图标栏 +↑ / +↓ / ↑ / ↓）
//
// 逻辑全在 model.js 的纯函数里（有单测），这里只负责接线：
// 改 source → 重编译 → 重绘 → 记一条撤销。
// ⚠️ 顺序有讲究：recordHistory 必须在 paint **之后** —— 它要读 textarea 的
// 真实选区来算出光标所在行，而 paint 才会把新内容与新行号装进 DOM。
// 反过来记录的话，撤销时光标会跳到别处。

function railAct(index, act) {
  if (!blocks[index]) return;

  if (act === 'above' || act === 'below') {
    const r = insertBlockAt(source, blocks, index, act);
    if (!r) return;
    source = r.source;
    phantom = { type: 'Phantom', pos: { start: r.line, end: r.line } };
    activeLine = r.line;
    recompile();                             // 幻影块会被塞到正确位置
    paint({ focus: true, caret: 'start' });  // 光标直接落进新块
    recordHistory('struct');                 // 结构操作独立成条
    return;
  }

  const r = moveBlock(source, blocks, index, act === 'up' ? -1 : 1);
  if (!r) return;
  source = r.source;
  phantom = null;
  recompile();
  activeLine = r.line;                       // 光标跟着块走，不然移完还得自己找
  paint({ focus: true, caret: 'start' });
  recordHistory('struct');
}

// ── 打字：只改源码与行号，不碰 DOM

function onInput(e) {
  const ta = e.target;
  const idx = Number(ta.dataset.index);
  if (!blocks[idx]) return;
  // 源码写回 + 后面所有块的行号平移，都在 model.js 里（那里有单测盯着）
  source = applyBlockEdit(source, blocks, idx, ta.value).source;
  autoGrow(ta);

  if (skipNextInput) {
    // compositionend 已经记过一条了，紧跟着的这次 input 是同一动作的尾巴
    skipNextInput = false;
  } else if (!composing) {
    recordHistory('type');
  }
  scheduleWarnRefresh();
}

function onKeyDown(e) {
  const ta = e.target;
  const idx = Number(ta.dataset.index);
  if (!Number.isInteger(idx) || !blocks[idx]) return;

  // Alt+↑ / Alt+↓：整块上移 / 下移（与图标栏的 ↑ ↓ 是同一个动作，纯键盘也能用）
  if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
    e.preventDefault();
    railAct(idx, e.key === 'ArrowUp' ? 'up' : 'down');
    return;
  }

  const before = ta.value.slice(0, ta.selectionStart);
  const lineNo = (before.match(/\n/g) || []).length;
  const total = ta.value.split('\n').length;

  // 上下箭头越过块边界 → 跳到相邻块，这样整篇读起来是连续的
  if (e.key === 'ArrowUp' && lineNo === 0 && ta.selectionStart === 0) {
    e.preventDefault();
    jumpTo(idx - 1, 'end');
  } else if (e.key === 'ArrowDown' && lineNo === total - 1 && ta.selectionStart === ta.value.length) {
    e.preventDefault();
    jumpTo(idx + 1, 'start');
  } else if (e.key === 'Escape') {
    e.preventDefault();
    leaveEdit();
  }
}

// 点某一块 → 换到那块编辑；点其余任何地方 → 退出编辑回到渲染态。
// ⚠️ 监听器必须挂在 document 上，不能挂在 #doc 上：页眉、页脚（诊断面板）、
// 整篇渲染浮层都在 #doc **之外**，挂 #doc 会导致「点页脚没反应」（探测发现的 bug）。
//
// ⚠️⚠️ 渲染态的块**不能在 mousedown 里就切成源码态**（这是后来改的，见下面 onDocMouseup）：
// 一 preventDefault + paint()，浏览器的选区就永远建不起来 —— "在渲染出来的文字上划选"
// 这条能力会变成**真鼠标永远触发不到**（探针之前是用脚本 `getSelection().addRange()`
// 建选区才验过的，所以没暴露）。现在切成两拍：mousedown 先不下手，mouseup 看有没有选中文字。
function onDocMousedown(e) {
  pendingPick = null;                          // 上一拍没被消费就作废
  if (e.target.closest('.laup-src')) return;   // 点在编辑器内部，交回浏览器
  if (e.target.closest('.overlay')) return;    // 浮层自己处理
  // 图标栏：连容器带按钮一起放行。preventDefault 是为了别把焦点从 textarea 上抢走 ——
  // 真正的动作在 click 里做，做完它会显式把焦点交给该去的那一块。
  if (e.target.closest('.laup-rail')) { e.preventDefault(); return; }
  // ⚠️ 只对**按钮本身**放行，不要对整个 #toolbar 放行：
  // 工具栏那一行的空白区（flex 尾部、换行后的空档）也是"页面空白"，
  // 点它应当退出编辑；早先整块 return 导致点了毫无反应（探测发现的 bug）。
  if (e.target.closest('.tb-btn, .fbar-btn')) return;   // 按钮有自己的 mousedown 处理
  // 固定工具栏的色板 / 标题级别弹出层：整个放行。它里面有 <input type="color">，
  // 在这里 preventDefault() 会把系统取色器/下拉直接掐掉（和调参面板同一个坑）。
  // ⚠️ 只放行 `.fbar-pop` 这个具体元素，**不要**放行整个 `#toolbar` ——
  // 那一行的空白区也是"页面空白"，点它应当退出编辑。
  if (e.target.closest('.tb-fmt-wrap .fbar-pop')) return;
  // 调参面板：整个放行。它里面有 <select> 与 <input type="color">，
  // 在这里 preventDefault() 会把系统取色器/下拉直接掐掉（打不开）。
  if (e.target.closest('.tune-panel, .tune-fab')) return;
  // 浮动工具栏：整个放行 + preventDefault 保住 textarea 的焦点与选区。
  // ⚠️ 必须放行：不放行的话点按钮会先被当成"点了正文空白"，
  // 当场把这一块切回渲染态（选中的字就没了，动作落空）。
  // ⚠️ 唯独 `input[type="color"]` 不能拦 —— 拦了系统取色器打不开。
  if (e.target.closest('.fbar')) {
    if (!e.target.closest('input[type="color"]')) e.preventDefault();
    return;
  }
  // 渲染态里的链接（目录、\eqref、\cite、外链）也要能点。
  // ⚠️ 这里**绝不能 preventDefault** —— 一旦那么做，下面就会把这一块换成源码态，
  // `paint()` 立刻换掉整个 #doc 的 DOM，浏览器连 `click` 都来不及派发，
  // 于是"点目录没反应"（CDP 真鼠标探测发现的）。直接放行走浏览器默认行为。
  // 想改这一块仍然可以：点链接**以外**的地方（目录里的「目录」标题、条目右侧的空白）
  // 照旧进入源码态 —— 因为 `<a>` 是行内元素，只占文字那一小段。
  if (e.target.closest('a[href]')) return;

  const host = e.target.closest('.laup-blk');
  const i = host ? Number(host.dataset.index) : NaN;
  if (Number.isInteger(i) && blocks[i]) {
    // 落在渲染态的块上：**先只记下来**，等 mouseup 再决定是"点"还是"划"。
    // ⚠️ 这里绝不能 preventDefault —— 拦了浏览器就不会开始建选区，拖选就没了。
    pendingPick = { index: i, el: host };
    return;
  }

  e.preventDefault();                          // 点别处我们自己接管焦点
  leaveEdit();
}

// 第二拍：mousedown 落在渲染态的块上之后，看这一次到底是不是"划选"。
//   选中了非空白文字 → 用户是在划选，交给浏览器与浮动工具栏，**别切走**；
//   没选中（普通一点，或拖到块外松手）→ 才切进源码态。
let pendingPick = null;
function onDocMouseup(e) {
  const pick = pendingPick;
  pendingPick = null;
  if (!pick) return;
  const sel = window.getSelection();
  if (sel && !sel.isCollapsed && String(sel).trim() !== '') return;
  if (!pick.el.contains(e.target)) return;
  // 行号从 blocks 现取 —— 不用 DOM 上的值，它可能已经被打字平移过
  activateLine(blocks[pick.index].pos.start, 'start');
}

// ── 撤销栈
//
// 快照 = { source, line }。line 是光标所在的**源码行号**（1-based），
// 用它而不是字符偏移：撤销后块可能重新划分，偏移会失去意义，行号不会。

// `lineOverride` 给"渲染态下的改动"用：那时候没有 textarea 可量光标，
// 不传的话 line 会退化成 1，撤销时就把人扔回文稿最开头了。
function snapshot(lineOverride) {
  if (lineOverride != null) return { source, line: lineOverride };
  const ta = currentSrc();
  if (!ta) return { source, line: activeLine == null ? 1 : activeLine };
  const idx = Number(ta.dataset.index);
  const blk = blocks[idx];
  const before = ta.value.slice(0, ta.selectionStart);
  const offset = (before.match(/\n/g) || []).length;
  return { source, line: (blk ? blk.pos.start : 1) + offset };
}

function recordHistory(kind, line) {
  if (!undoStack) return;
  pushHistory(undoStack, snapshot(line), kind, Date.now());
  paintHistoryButtons();
}

function applySnapshot(snap) {
  if (!snap) return;
  source = snap.source;
  phantom = null;              // 撤销回来的是历史状态，幻影块不该跟着穿越
  recompile();                 // 撤销是低频操作，可以重建 DOM（与打字路径不同）
  const idx = blockIndexAt(blocks, snap.line);
  activeLine = idx >= 0 ? blocks[idx].pos.start : null;
  paint({ focus: activeLine != null });
  paintHistoryButtons();
}

function paintHistoryButtons() {
  if (!undoStack || !els.undo) return;
  els.undo.disabled = !canUndo(undoStack);
  els.redo.disabled = !canRedo(undoStack);
}

function doUndo() { applySnapshot(undoHistory(undoStack)); }
function doRedo() { applySnapshot(redoHistory(undoStack)); }

// ⚠️ 必须 e.preventDefault()：否则 textarea 会执行**原生**撤销（块内局部），
// 与我们的全局撤销语义冲突，表现为"同一个 Ctrl+Z 有时回一步有时回多步"。
window.addEventListener('keydown', (e) => {
  if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
  const k = e.key.toLowerCase();
  const isRedo = k === 'y' || (k === 'z' && e.shiftKey);
  const isUndo = k === 'z' && !e.shiftKey;
  if (!isUndo && !isRedo) return;
  e.preventDefault();
  if (isRedo) doRedo();
  else doUndo();
});

// 中文输入法：组合期间每个字母都会触发 input，照常入栈会让 Ctrl+Z 变成逐字母回退
els.doc.addEventListener('compositionstart', () => { composing = true; }, true);
els.doc.addEventListener('compositionend', () => {
  composing = false;
  skipNextInput = true;         // Chrome 在上屏后还会补一次 input
  recordHistory('ime');         // 一次中文输入 = 一条记录（kind 不是 type，不与打字合并）
}, true);

// ── 工具栏
//
// 两个动作都作用在**当前选区**上，所以点按钮时
// 绝不能让它失焦 —— mousedown 一律 preventDefault。
//
// 格式按钮与色板弹出层来自 editor/formatUi.js —— 与浮动工具栏**同一份**，
// 顺序来自 editor/formatSpec.js 的 FIXED_ROWS（照 生命时序-wiki 的 EditorToolbar.vue 迁）。
// 这个文件只负责"把改动写回稿子"。

// ▮ 模板里的光标落点标记（与扩展同一个约定，见 src/extensions.js 的 SNIPPET_CARET）
const CARET = SNIPPET_CARET;

// 只留**插入骨架**这一类。粗体/斜体/下划线/删除线/行内码搬去格式按钮了
// （applyFormat 是"作用在选区上、再点一次取消"，插模板做不到取消，
//   两套语义混在一个按钮上最难解释）。
//
// 前三个是核心语法的骨架；后面那批来自**已装的扩展**（extensionSnippets()）——
// 编辑器自己不知道 \cite / \tree / ```sample 长什么样，是扩展告诉它的。
// 于是"卸掉扩展"就等于"这几个按钮消失"，不需要在这里维护第二份名单。
const SNIPPETS = {
  'fontsize-18': `\\fontsize{18}{${CARET}}`,
  table: `\\table=[\n    column=[\n        "${CARET}"\n    ]\n]`,
  image: `\\image=[\n    src="${CARET}"\n]`,
  ...extensionSnippets(),
};

let tipTimer = null;
function flashTip(message) {
  if (!els.tip) return;
  els.tip.textContent = message;
  els.tip.hidden = false;
  clearTimeout(tipTimer);
  tipTimer = setTimeout(() => { els.tip.hidden = true; }, 2400);
}

// 把模板插进当前 textarea 的选区：
//   有选区 → 选区文字被包进模板（`▮` 的位置）
//   无选区 → 插入骨架，光标落在 `▮` 原来的位置（不用手动退格）
//
// `range` 可以显式传入 { start, end }。什么时候需要：
// 系统取色器（<input type="color">）会**把 textarea 弄失焦**，而它又必须失焦
// 才能弹出原生面板（不能 preventDefault）。所以点它之前先把选区存下来，
// 挑完颜色再拿这份存的选区来包裹 —— 否则会落在"光标被重置到 0"的空位置上。
function applySnippet(tpl, range = null) {
  if (!tpl) return;
  const ta = currentSrc();
  if (!ta) { flashTip('先把光标放到某一块里，再用工具栏'); return; }
  const idx = Number(ta.dataset.index);
  if (!blocks[idx]) return;

  const start = range ? range.start : ta.selectionStart;
  const end = range ? range.end : ta.selectionEnd;
  const selected = ta.value.slice(start, end);
  const at = tpl.indexOf(CARET);
  const head = tpl.slice(0, at);
  const tail = tpl.slice(at + 1);

  ta.value = ta.value.slice(0, start) + head + selected + tail + ta.value.slice(end);
  const caret = start + head.length + selected.length;

  source = applyBlockEdit(source, blocks, idx, ta.value).source;
  ta.focus();
  ta.setSelectionRange(caret, caret);
  autoGrow(ta);

  recordHistory('struct');     // 结构操作独立成条，不与后续打字合并
  scheduleWarnRefresh();
}

// ── 固定工具栏：格式组 + 它的弹出层
//
// 按钮表与色板都来自 editor/formatUi.js（与浮动工具栏同一份），
// 顺序来自 editor/formatSpec.js 的 FIXED_ROWS —— 照 生命时序-wiki 的
// `EditorToolbar.vue`（toolbarKeys）迁过来：标题 │ 粗 斜 下划线 删除线 字号
// 文字色 背景色 │ 无序 有序 待办 引用 │ 行内码 行间码 链接。
const fmtUi = els.toolbar ? buildToolbarGroups(FIXED_ROWS) : { groups: [], pops: new Map() };
if (els.toolbar) {
  const anchor = document.getElementById('tb-fmt-anchor');
  for (const g of fmtUi.groups) els.toolbar.insertBefore(g, anchor);
  // 锚点用完就删 —— 留着它会打断 `.tb-group + .tb-group` 那条画竖线的相邻选择器
  anchor?.remove();
}

let savedRange = null;    // 系统取色器夺焦前存下的选区

const readRange = () => {
  const ta = currentSrc();
  return ta ? { start: ta.selectionStart, end: ta.selectionEnd } : null;
};

// 格式动作的统一入口（固定工具栏的图标按钮 + 色板里的色块/清除项都走这里）。
//
// 作用对象按优先级取：
//   ① 浮动工具栏正显示的选区 —— 渲染态划选只有它知道"渲染文字的第几个字"；
//   ② 正在编辑的 textarea 的选区；
//   ③ 都没有 → 提示，**不猜**。
function formatContext() {
  const live = fbar.ctx;
  if (live) return live;
  const ta = currentSrc();
  if (!ta) return null;
  return {
    mode: 'src',
    ta,
    blockIdx: Number(ta.dataset.index),
    range: { start: ta.selectionStart, end: ta.selectionEnd },
  };
}

function runFormat(key, arg) {
  const ctx = formatContext();
  if (!ctx) { flashTip('先把光标放到某一块里，再用工具栏'); return false; }
  const ok = ctx.mode === 'src'
    ? applyFbarInSrc(ctx, key, arg)
    : applyFbarInRendered(ctx, key, arg);
  if (!ok) flashTip('这一处改不了 —— 换个位置再试');
  return ok;
}

if (els.toolbar) {
  // mousedown 阶段就阻止默认行为：保住 textarea 的焦点与选区。
  // ⚠️ 唯独 `input[type="color"]` 不能拦 —— 拦了系统取色器就打不开。
  els.toolbar.addEventListener('mousedown', (e) => {
    if (e.target.closest('input[type="color"]')) return;
    if (e.target.closest('.tb-btn, .fbar-btn, .fbar-swatch, .fbar-clear, .fbar-head-btn')) {
      e.preventDefault();
    }
  });
  els.toolbar.addEventListener('click', (e) => {
    // 色块 / 「默认颜色 · 清除背景色」/ 标题档位 —— 与浮动工具栏共用同一份解析
    const act = popAction(e.target);
    if (act) { runFormat(act.key, act.arg); closePops(fmtUi.pops); return; }

    const btn = e.target.closest('.tb-btn, .fbar-btn');
    if (!btn) return;
    if (btn.dataset.pop) {
      // 文字色 / 背景色 / 标题级别。与浮动工具栏互斥：两个弹出层同时开着只会互相打架
      // （浮动工具栏会正好压在色板下拉上，色块点不到）。
      fbar.hide();
      togglePopover(fmtUi.pops, btn.dataset.pop, { down: true });
      return;
    }
    if (btn.dataset.key) { runFormat(btn.dataset.key); closePops(fmtUi.pops); return; }
    if (btn.dataset.ins) {
      const tpl = SNIPPETS[btn.dataset.ins];
      // 按钮还在、模板没了 = 对应的扩展没装（或卸了）。说清楚是哪一类，别静默。
      if (!tpl) flashTip(`「${btn.dataset.ins}」的插入模板没有注册 —— 提供它的扩展没装`);
      else applySnippet(tpl);
      return;
    }
    if (btn.dataset.act === 'undo') doUndo();
    if (btn.dataset.act === 'redo') doRedo();
  });
}

// 「自定义」那条路（系统的原生取色器）。
//
// 原生面板一弹出来就会夺走 textarea 的焦点与选区 —— 先把选区存下来，
// 挑完色再拿这份存的选区去包裹，否则会落在"光标被重置到 0"的空位置上。
// （所以这里**不能** preventDefault，见上面 mousedown 里的例外）
for (const [kind, pop] of fmtUi.pops) {
  if (kind === 'head') continue;
  const input = pop.querySelector('input[type="color"]');
  input.addEventListener('mousedown', () => { savedRange = readRange(); });
  // ⚠️ 用 change 而不是 input：拖动取色器时 input 会连续触发，
  // 一拖就插进去几十个 \textcolor。change 只在确定时来一次。
  input.addEventListener('change', () => {
    const color = input.value.trim().toLowerCase();
    const tpl = (kind === 'bg' ? '\\colorbox{' : '\\textcolor{') + color + `}{${CARET}}`;
    applySnippet(tpl, savedRange);
    savedRange = null;
    closePops(fmtUi.pops);
  });
}

// 点别处收起来。用独立的 document 监听，避免和 onDocMousedown 的
// 那一串"什么时候放行"纠缠在一起。
document.addEventListener('mousedown', (e) => {
  if (![...fmtUi.pops.values()].some((p) => !p.hidden)) return;
  if (e.target.closest('.tb-fmt-wrap')) return;
  closePops(fmtUi.pops);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePops(fmtUi.pops);
});

// 图标栏的点击：事件委托挂在 #doc 上 —— paint() 每次都会换掉 #doc 的内容，
// 挂在图标按钮自己身上会跟着一起消失。
els.doc.addEventListener('click', (e) => {
  const btn = e.target.closest('.laup-rail-btn');
  if (!btn || btn.disabled) return;
  const host = btn.closest('.laup-blk');
  const i = host ? Number(host.dataset.index) : NaN;
  if (!Number.isInteger(i) || !blocks[i]) return;
  railAct(i, btn.dataset.act);
});

// 渲染态里的**外链**：不要在同一个标签页里打开 —— 那会把编辑器页面顶掉，
// 内存里的稿子（还没落到磁盘的部分）就没了。站内锚点（`#…`）不拦，
// 交给浏览器滚到目标标题（目录 / \eqref / \cite 都靠它）。
els.doc.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a) return;
  const href = a.getAttribute('href') || '';
  if (href.startsWith('#')) return;
  e.preventDefault();
  window.open(a.href, '_blank', 'noopener');
});

// ── 浮动工具栏（选中文字后出现）
//
// 界面与选区测量都在 editor/fbar.js，这里只负责**把改动写回稿子** ——
// 两种来源走两条路：
//
//   ① 源码态（正在编辑的那一块）：选区就是 textarea 的偏移，
//      直接在 ta.value 上改，再走 applyBlockEdit 写回（与工具栏插骨架同一条路）。
//   ② 渲染态（在渲染出来的文字上画选）：渲染出来的字里**没有标记**，
//      得先用 inlineMap.js 把"渲染文字的第几个字符"换算成源码偏移，
//      再作用在**这一块自己的源码**上（不能拿整篇去对，见 applyFbarInRendered 的注释）。
//
// ⚠️ 一律用工具栏**出现时捕获的**选区（ctx.range / ctx.rtxt），不用"当下"的选区 ——
// 点按钮那一刻焦点可能已经变了（系统取色器那条路必然会变）。
//
// ⚠️ 换算不出来时**什么都不做**并给提示，绝不去猜。
// 表格 / 图表 / 纯公式块在渲染态就是换算不出来的，那类块要点进源码态改。

const fbar = initFbar({
  onApply: (key, arg, ctx) => (ctx.mode === 'src'
    ? applyFbarInSrc(ctx, key, arg)
    : applyFbarInRendered(ctx, key, arg)),
  onTip: (msg) => flashTip(msg),
});

// ① 源码态
function applyFbarInSrc(ctx, key, arg) {
  const ta = ctx.ta;
  const idx = ctx.blockIdx;
  if (!ta || !blocks[idx]) return false;
  const r = applyFormat(ta.value, ctx.range.start, ctx.range.end, key, arg);
  if (!r) return false;
  ta.value = r.text;
  source = applyBlockEdit(source, blocks, idx, ta.value).source;
  ta.focus();
  ta.setSelectionRange(r.start, r.end);
  autoGrow(ta);
  recordHistory('struct');
  scheduleWarnRefresh();
  return true;
}

// ② 渲染态
function applyFbarInRendered(ctx, key, arg) {
  const blk = blocks[ctx.blockIdx];
  if (!blk) return false;
  // ⚠️ 用 isInlineKey 而不是"手动列 TOGGLE_KEYS / STYLED_KEYS"：
  // `fontcolor:none`（色板里的「默认颜色」）也是行内动作，
  // 手动列的话它会掉进下面的"块级"分支，把**整块**的颜色都摘掉。
  const isInline = isInlineKey(key);

  let res = null;
  if (isInline) {
    // ⚠️ 必须在**这一块自己的源码**里对齐，不能拿整篇 source 去对 ——
    // `rtxt` 只是这一块渲染出来的文字，拿它跟整篇的纯文本对齐，
    // 第一帧就错位，质量闸直接判负 → 什么也改不了（这个 bug 是探针抓出来的）。
    const local = sliceBlock(source, blk);
    const base = blockRange(source, blk).start;
    const m = mapRenderedRange(local, ctx.rtxt, ctx.from, ctx.to, key);
    if (!m) return false;         // 换算不出来 → 不动作（宁可不改，也不猜）
    // `m.text` 可能与 `local` 不同：边界对齐会**劈开**跨越选区的样式层。
    // 那就先把劈开的结果写回这一块，再用块内偏移换算成整篇偏移。
    const src = m.text === local
      ? source
      : source.slice(0, base) + m.text + source.slice(base + local.length);
    res = applyFormat(src, base + m.start, base + m.end, key, arg);
  } else {
    // 块级动作（引用 / 列表 / 标题 / 围栏块）作用在**整块**上，不做字符级换算 ——
    // 刻意的：这些标记本来就是"整行"的，字符级精度没有意义，还更容易出错。
    const r = blockRange(source, blk);
    res = applyFormat(source, r.start, r.end, key, arg);
  }
  if (!res) return false;

  source = res.text;
  recompile();
  // 不切进源码态：用户是在"读"的状态下改的，改完就该看到改完的样子。
  // 渲染态下没有 textarea 可量光标，所以撤销的落点必须显式给行号
  // （不给的话 line 退化成 1，撤销会把人扔回文稿最开头）。
  const at = blocks[Math.min(ctx.blockIdx, blocks.length - 1)];
  paint();
  recordHistory('struct', at ? at.pos.start : 1);
  return true;
}

// Ctrl+B / I / U：源码态下与按钮等价。
// 只在"确实选中了东西"时才拦 —— 否则会把浏览器的默认行为吃掉。
window.addEventListener('keydown', (e) => {
  if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
  const ta = currentSrc();
  if (!ta || document.activeElement !== ta) return;
  const key = { b: 'bold', i: 'italic', u: 'underline' }[e.key.toLowerCase()];
  if (!key || ta.selectionStart === ta.selectionEnd) return;
  e.preventDefault();
  applyFbarInSrc(
    { ta, blockIdx: Number(ta.dataset.index), range: { start: ta.selectionStart, end: ta.selectionEnd } },
    key,
    null,
  );
});

// 选区一变就重新摆一次。
// `selectionchange` 在 textarea 里改选区时也会触发（规范如此），两种来源共用一个入口。
document.addEventListener('selectionchange', () => fbar.sync());
// 滚动/改窗口大小 → **重新量位置**（不是收起）。
// ⚠️ 别改成收起：进源码态时 `ta.scrollIntoView()` 也会发 scroll 事件、
// 而且**异步**到 —— 工具栏会刚显示就被收掉。（探针里才看得出来。）
window.addEventListener('resize', () => fbar.reposition());
window.addEventListener('scroll', () => fbar.reposition(), true);

// ── 块外观调参面板
//
// 「由前端调整」的落点。它只写 CSS 变量 + <body> 上的 data-* 属性，
// **完全不碰 source** —— 所以调它绝不会弄脏你的稿子，也不必进撤销栈。
// 选择存 localStorage，下次打开还是调好的样子。
//
// 为什么用变量而不是直接改样式表：变量能被"复制为 CSS"原样带走，
// 粘进 index.html 的 :root 就成了新默认值，不用再翻代码找那几行。

const TUNE_KEY = 'laup-ui-prefs';
const TUNE_DEFAULTS = {
  mark: 'bar',            // bar | outline | none
  bar: '#378ADD',         // 悬停标记颜色
  bg: '#ffffff',          // 悬停底色
  boundary: '0 none',     // 块间常显分隔线
  gutter: 'left',         // 图标栏在左还是右
};

const tuneEls = {
  fab: document.getElementById('tune-fab'),
  panel: document.getElementById('tune-panel'),
  mark: document.getElementById('tune-mark'),
  bar: document.getElementById('tune-bar'),
  bg: document.getElementById('tune-bg'),
  boundary: document.getElementById('tune-boundary'),
  gutter: document.getElementById('tune-gutter'),
  copy: document.getElementById('tune-copy'),
  reset: document.getElementById('tune-reset'),
};

function loadPrefs() {
  try {
    const raw = localStorage.getItem(TUNE_KEY);
    return raw ? { ...TUNE_DEFAULTS, ...JSON.parse(raw) } : { ...TUNE_DEFAULTS };
  } catch { return { ...TUNE_DEFAULTS }; }
}

// 把一份偏好"投影"到页面上。⚠️ 写在 documentElement 的行内样式上
// （优先级高于 :root 的声明），这样 index.html 里那几行仍然是"出厂默认"，
// 一眼能看出用户到底改了什么。
function applyPrefs(p) {
  const root = document.documentElement;
  root.style.setProperty('--laup-hover-bar', p.bar);
  root.style.setProperty('--laup-hover-bg', p.bg);
  root.style.setProperty('--laup-blk-boundary', p.boundary);
  document.body.dataset.hoverMark = p.mark;
  document.body.dataset.gutter = p.gutter;
}

function savePrefs(p) {
  try { localStorage.setItem(TUNE_KEY, JSON.stringify(p)); } catch { /* 隐私模式，忽略 */ }
}

const tuneCopyText = (p) => [
  ':root {',
  `  --laup-hover-bg: ${p.bg};`,
  `  --laup-hover-bar: ${p.bar};`,
  `  --laup-blk-boundary: ${p.boundary};`,
  '}',
  `/* body 属性：data-hover-mark="${p.mark}"  data-gutter="${p.gutter}" */`,
].join('\n');

function initTune() {
  if (!tuneEls.fab || !tuneEls.panel) return;
  let prefs = loadPrefs();
  applyPrefs(prefs);

  const sync = () => {
    tuneEls.mark.value = prefs.mark;
    tuneEls.bar.value = prefs.bar;
    tuneEls.bg.value = prefs.bg;
    tuneEls.boundary.value = prefs.boundary;
    tuneEls.gutter.value = prefs.gutter;
  };
  const commit = () => { applyPrefs(prefs); savePrefs(prefs); };
  sync();

  tuneEls.fab.addEventListener('click', () => { tuneEls.panel.hidden = !tuneEls.panel.hidden; });

  tuneEls.mark.addEventListener('change', () => { prefs.mark = tuneEls.mark.value; commit(); });
  tuneEls.bar.addEventListener('input', () => { prefs.bar = tuneEls.bar.value; commit(); });
  tuneEls.bg.addEventListener('input', () => { prefs.bg = tuneEls.bg.value; commit(); });
  tuneEls.boundary.addEventListener('change', () => { prefs.boundary = tuneEls.boundary.value; commit(); });
  tuneEls.gutter.addEventListener('change', () => { prefs.gutter = tuneEls.gutter.value; commit(); });

  tuneEls.copy.addEventListener('click', async () => {
    const text = tuneCopyText(prefs);
    try {
      await navigator.clipboard.writeText(text);
      tuneEls.copy.textContent = '已复制 ✓';
    } catch {
      // 剪贴板被拒（非 https / 无权限）时退化成提示，至少让用户看得到内容
      flashTip('复制失败，可手动抄：' + text.replace(/\n/g, ' '));
      tuneEls.copy.textContent = '复制失败';
    }
    setTimeout(() => { tuneEls.copy.textContent = '复制为 CSS'; }, 1600);
  });

  tuneEls.reset.addEventListener('click', () => {
    prefs = { ...TUNE_DEFAULTS };
    sync();
    commit();
  });
}

// ── 面板

function paintWarnings() {
  if (!warnings.length) {
    els.warnings.innerHTML = '';
    return;
  }
  const items = warnings
    .map((w) => `<div class="warn-item"><span class="warn-line">${w.line == null ? '—' : w.line}</span>`
      + `<span>${escapeHtml(w.message)}</span></div>`)
    .join('');
  els.warnings.innerHTML = `<div class="warn-title">诊断 ${warnings.length} 条</div>${items}`;
}

function paintStats() {
  const broken = blocks.filter((b) => b.type === 'Broken').length;
  els.stats.textContent = `${blocks.length} 块`
    + (broken ? ` · ${broken} 处语法还没写完` : '')
    + (warnings.length ? ` · ${warnings.length} 条提示` : '');
}

// ── 数学：KaTeX 按需渲染，加载失败就保留原始 TeX（不会变空白）

function renderMathIn(root) {
  if (!window.katex || !root) return;
  root.querySelectorAll('.laup-math, .laup-math-display').forEach((el) => {
    const tex = el.dataset.tex;
    if (!tex || el.dataset.done) return;
    try {
      window.katex.render(tex, el, {
        displayMode: el.classList.contains('laup-math-display'),
        throwOnError: false,
      });
      el.dataset.done = '1';
    } catch {
      // 保留原始 TeX —— 静默失败比空白好
    }
  });
}

// ── 整篇渲染结果（对照「编辑器里看到的」和「发布出来的」）

document.getElementById('btn-render').addEventListener('click', () => {
  const { ast } = compile(source, { mode: 'edit' });
  // ⚠️ 必须给独立 id 前缀：浮层与正文 #doc 渲染的是同一篇，
  // 标题/公式/文献的 id 会一模一样 → `getElementById` 只认文档里最先那个（正文那份）
  // → 在浮层里点目录会跳到被浮层盖住的正文上，浮层自己一动不动，
  // 表现就是"点了没反应"。加前缀之后两边的锚点各自封闭。
  els.overlayDoc.innerHTML = renderHtml(ast, { idPrefix: OVERLAY_ID_PREFIX }).html;
  els.overlay.hidden = false;
  renderMathIn(els.overlayDoc);
});

document.getElementById('btn-close').addEventListener('click', () => {
  els.overlay.hidden = true;
  els.overlayDoc.innerHTML = '';
});

document.addEventListener('mousedown', onDocMousedown);
document.addEventListener('mouseup', onDocMouseup);
window.addEventListener('load', () => renderMathIn(els.doc));
initTune();   // 块外观调参（纯视觉，与文档内容无关，可以立即生效）

// ── 顶栏高度 → CSS 变量
//
// 站内锚点（目录 / \eqref / \cite）跳转时，目标会被吸顶的 .chrome 盖住 ——
// 内容其实跳对了，但用户看到的是"一条不相干的段落停在最上面"，于是判断跳错了。
// 修法是给目标加 `scroll-margin-top`，值就是顶栏的实测高度。
// ⚠️ **必须实测，不能写死**：工具栏是 flex-wrap，窄屏会换行变高。
const chromeEl = document.querySelector('.chrome');
function syncChromeHeight() {
  if (!chromeEl) return;
  const h = Math.round(chromeEl.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--laup-chrome-h', `${h}px`);
}
syncChromeHeight();
if (chromeEl && window.ResizeObserver) new ResizeObserver(syncChromeHeight).observe(chromeEl);
window.addEventListener('resize', syncChromeHeight);

// ── 启动

/** 整篇换源码：重编译 + 重建撤销栈 + 重画。宿主载入草稿时用。 */
function adoptSource(text) {
  source = String(text ?? '');
  phantom = null;
  activeLine = null;
  recompile();
  undoStack = makeHistory(snapshot());
  paint();
}

(async function init() {
  // 默认打开的是**骨架**（editor/starter.js）—— 这就是"新建文档"的开局，
  // 不联网、不 fetch，打开即是空白可写的稿纸。以前默认打开 case-01-overview，
  // 那是介绍 Laup 自己的长文，等于每次写东西先删一整篇。
  // 要看示例：`?doc=case-01-overview.laup`（白名单只放文件名，防目录穿越）。
  const want = new URLSearchParams(location.search).get('doc');
  const file = want && /^[a-z0-9-]+\.laup$/i.test(want) ? want : '';
  if (file) {
    try {
      const res = await fetch(`./examples/${file}`, { cache: 'no-store' });
      if (res.ok) source = await res.text();
    } catch {
      // 读不到就留在骨架上，不打断
    }
  }
  recompile();
  undoStack = makeHistory(snapshot());
  paint();

  // 宿主（草稿箱 / 发布）最后接：它需要 `source` 已经是最终值，
  // 而且 `?draft=` 命中的话会用草稿源码覆盖上面那套（示例也一样被覆盖）。
  // 没有宿主时 initHost 直接返回 false，这里什么都不发生。
  await initHost({ getSource: () => source, adoptSource });
})();
