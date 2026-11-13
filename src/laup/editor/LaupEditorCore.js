// Laup 编辑器的**工厂**：把一台编辑器挂到给定的容器上。
//
// ── 与上游 editor/editor.js 的关系
//   上游那份是「一个页面就是一台编辑器」的写法：元素靠 document.getElementById 满页找、
//   监听器挂在 window/document 上装完不管、启动逻辑写在模块顶层的 IIFE 里。
//   搬进站点、嵌进 Vue 组件之后这三条都不成立 ——
//     · 元素要从**组件根**里找（页面上还有别的东西，将来还可能有第二台编辑器）
//     · 监听器要卸得掉（离开 /laup 再回来是一次新的挂载，不卸就是叠加）
//     · 启动要能被调用（不是 import 就自动跑）
//   所以这一层做三件事：根内查询、监听器登记、显式 mount/destroy。
//   除此之外的编辑逻辑（换态、工具栏、撤销、映射）与上游保持一致。
//
// ── 「渲染态直接编辑」
//   上游的编辑态是「光标那一块换成源码 textarea」。站点要的是**看不见源码**，
//   所以这一块改成 contenteditable 的渲染结果：用户直接在排版好的文字上打字，
//   每次输入事后与"编辑前的可见文字"做差，换算回源码（换算在 liveEdit.js，纯函数可单测）。
//
//   三条刻意的取舍：
//     ① **不拦浏览器的输入**（拦下来自己维护 DOM 与光标太脆），而是事后收口 ——
//        代价是编辑期间 DOM 可能被浏览器改得与源码不严格对应，靠"离开这一块时重渲"收敛。
//        这与上游"打字时不动 DOM、光标离开才重编译"是同一条思路。
//     ② **换算不出来就整块回滚**并提示，绝不猜（表格 / 图表 / 纯公式块就是换算不出来的）。
//        那些块双击展开源码改 —— 这是站点明确选定的兜底。
//     ③ 公式的 TeX 在 KaTeX 渲染后会被替换成排版结果，位置对不上了 →
//        整体标成**原子**（contenteditable=false，且不参与文本比对）。

import { compile, defineExtension, extensionSnippets, SNIPPET_CARET, listExtensions } from '../core/index.js';
import { renderHtml } from '../core/renderHtml.js';
import { lifeElements, PACK_NAME } from '../extensions/life.js';
import {
  sliceBlock, blockIndexAt, applyBlockEdit, blockRange,
  insertBlockAt, moveBlock, removeBlankLine,
  makeHistory, pushHistory, undoHistory, redoHistory, canUndo, canRedo,
} from './model.js';
import { applyFormat, isInlineKey } from './toggleOps.js';
import { translate } from '../../utils/mathKit.js';
import { mapRenderedRange } from './inlineMap.js';
import { alignBlock, insertPoint, applyLiveText } from './liveEdit.js';
import { initFbar } from './fbar.js';
import { FIXED_ROWS } from './formatSpec.js';
import { STARTER_SRC } from './starter.js';
import { buildToolbarGroups, popAction, closePops, togglePopover } from './formatUi.js';

// 站点元素（代码案例 / 研究树 / 文献 / 引用锚点）是**宿主元素**，核心不认识它们。
// 路由与锚点前缀由宿主给 —— 与 server/laup.js 保持一致，否则编辑器里点得动、
// 发出去点不动（或反过来）。
const TREE_ROUTE = (id) => `/life-tree/${id}`;
if (!listExtensions().includes(PACK_NAME)) {
  defineExtension(lifeElements({ treeRoute: TREE_ROUTE }));
}

// 图标栏：`+↑`/`+↓` 是"在块的上面/下面插一个新块"，`↑`/`↓` 是"把这一块上移/下移"。
const RAIL_ACTS = [
  ['above', '+↑', '在这一块的上面插入新块'],
  ['below', '+↓', '在这一块的下面插入新块'],
  ['up', '↑', '把这一块上移（Alt+↑）'],
  ['down', '↓', '把这一块下移（Alt+↓）'],
];

const OVERLAY_ID_PREFIX = 'ov-';
const CARET = SNIPPET_CARET;

// 取"用户看得见的文字"时要跳过的子树：
//   · 块操作图标栏 —— 它是控件不是内容
//   · 原子（公式标了 data-atom / data-tex）—— KaTeX 渲染后它的文本已经不是源码里那段了
const SKIP_SEL = '.laup-rail, [data-atom], [data-tex]';

const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
));

export function createLaupEditor({ root, initialSource = STARTER_SRC, onChange = null, katex = null } = {}) {
  if (!root) throw new Error('createLaupEditor 需要一个容器元素');
  // 公式渲染器由**宿主注入**（站点用的是 npm 装的 katex：自托管、CSP 放行、
  // 与阅读端同一份）。不注入就保留原始 TeX 文本 —— 静默失败比空白好。
  const katexLib = katex;

  // ── 状态
  let source = String(initialSource ?? '');
  let blocks = [];                 // 每块带 pos = { start, end }，1-based 闭区间
  let htmlOf = new Map();          // AST 节点 → 它的 HTML（用引用做 key，每次重编译要重建）
  let footnotesHtml = '';
  let warnings = [];
  let activeIndex = null;          // 正在编辑的**块索引**；null = 全部渲染态
  let editKind = 'live';           // 'live' = 渲染态直接编辑；'source' = 该块展开源码
  let undoStack = null;
  let composing = false;
  let skipNextInput = false;
  let phantom = null;              // 「幻影块」：刚插入还没打字的空块（源码里只有一个空行）
  let pendingPick = null;
  let savedRange = null;
  let tipTimer = null;
  let warnTimer = null;
  let chromeObserver = null;
  let destroyed = false;
  const liveAligns = new Map();    // 块索引 → { align, local, rtxt }

  const disposers = [];
  const els = {};

  // ── 根内查询与监听登记

  const $ = (sel) => root.querySelector(sel);
  function listen(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    disposers.push(() => target.removeEventListener(type, fn, opts));
  }

  function bindEls() {
    Object.assign(els, {
      doc: $('#doc'),
      warnings: $('#warnings'),
      stats: $('#stats'),
      overlay: $('#overlay'),
      overlayDoc: $('#overlay-doc'),
      toolbar: $('#toolbar'),
      fmtAnchor: $('#tb-fmt-anchor'),
      tip: $('#tb-tip'),
      undo: $('#btn-undo'),
      redo: $('#btn-redo'),
      btnRender: $('#btn-render'),
      btnClose: $('#btn-close'),
      tuneFab: $('#tune-fab'),
      tunePanel: $('#tune-panel'),
      tuneMark: $('#tune-mark'),
      tuneBar: $('#tune-bar'),
      tuneBg: $('#tune-bg'),
      tuneBoundary: $('#tune-boundary'),
      tuneGutter: $('#tune-gutter'),
      tuneCopy: $('#tune-copy'),
      tuneReset: $('#tune-reset'),
    });
    if (!els.doc) throw new Error('编辑器容器里没有 #doc —— 检查 LaupEditor.vue 的模板');
  }

  // ── 文本工具

  // 块里"用户看得见的文字"（跳过图标栏与原子）。
  // TreeWalker 是文档序，与源码顺序一致 —— 这是整条映射链的地基。
  function contentText(el) {
    let out = '';
    const walker = root.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement && node.parentElement.closest(SKIP_SEL)) continue;
      out += node.data;
    }
    return out;
  }

  function editableTextNodes(el) {
    const out = [];
    const walker = root.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement && node.parentElement.closest(SKIP_SEL)) continue;
      out.push(node);
    }
    return out;
  }

  // 公式的 TeX 在 KaTeX 之后会被替换成排版结果 → 标成原子：不可编辑、不参与比对。
  function markAtoms(holder) {
    holder.querySelectorAll('[data-tex]').forEach((el) => {
      el.dataset.atom = '1';
      el.contentEditable = 'false';
    });
  }

  // ── 编译

  function recompile() {
    const res = compile(source, { mode: 'edit' });   // edit = 容错，写一半也不会炸
    const late = [];
    const out = renderHtml(res.ast, { warn: (m) => late.push({ line: null, message: m }) });
    blocks = res.ast.children;

    // 幻影块（用户刚插入、还没打字的空块）不在 AST 里，得重新塞回去。
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

  function scheduleWarnRefresh() {
    clearTimeout(warnTimer);
    warnTimer = setTimeout(() => {
      // 只重算诊断，**不替换 blocks** —— 打字期间 blocks 还被 DOM 用着
      if (destroyed) return;
      warnings = compile(source, { mode: 'edit' }).warnings;
      paintWarnings();
    }, 400);
  }

  // ── 绘制

  function paint(opts = {}) {
    // 重绘会换掉整棵 #doc 的 DOM，渲染态的选区当场作废 —— 工具栏必须跟着收起来。
    fbar.hide();
    liveAligns.clear();
    els.doc.innerHTML = '';

    blocks.forEach((blk, k) => {
      let el;
      if (k !== activeIndex) el = makeRendered(blk, k);
      else el = editKind === 'source' ? makeSourceEditor(blk, k) : makeLive(blk, k);
      // ⚠️ 用**块索引**标记，不用行号：打字期间行号会平移（上面的块一变长，
      // 下面所有块的行号都变），索引才不会。用行号会让"点下面的块"点错块。
      el.dataset.index = String(k);
      els.doc.appendChild(el);
    });

    if (footnotesHtml) {
      const sec = root.ownerDocument.createElement('section');
      sec.className = 'laup-footnotes-host';
      sec.innerHTML = footnotesHtml;
      els.doc.appendChild(sec);
    }

    paintWarnings();
    paintStats();
    paintHistoryButtons();
    renderMathIn(els.doc);

    if (opts.focus) focusActive(opts.caret);

    // 源码变化的**唯一收口**：写入口有十来个（工具栏 / 浮动栏 / 撤销 / 插入模板 /
    // 渲染态打字…），逐个挂必漏；它们最后全都要走 paint()。
    onChange?.(source);
  }

  function focusActive(caret = 'end') {
    const ta = els.doc.querySelector('.laup-src');
    if (ta) {
      autoGrow(ta);
      ta.focus();
      const at = caret === 'end' ? ta.value.length : 0;
      ta.setSelectionRange(at, at);
      ta.scrollIntoView({ block: 'nearest' });
      return;
    }
    const live = els.doc.querySelector('.laup-blk.is-live[contenteditable="true"]');
    if (!live) return;
    const nodes = editableTextNodes(live);
    // 空块没有文本节点：只 focus()，让浏览器自己放光标（它会 normalize 出一个
    // 可插入的有效位置）。⚠️ 这里**不能**手动 addRange(live, 0) —— 实测（探针
    // bisect3.mjs）只要 contenteditable=false 的 rail 在场，手动设的
    // element-offset 光标会被 Chromium 判为无效位置，execCommand /
    // Input.insertText / 键盘输入全部被静默拒绝（返回 false、不派发 beforeinput）。
    if (!nodes.length) { live.focus(); return; }
    const last = nodes[nodes.length - 1];
    const range = root.ownerDocument.createRange();
    if (caret === 'start') {
      range.setStart(nodes[0], 0);
    } else {
      range.setStart(last, last.data.length);
    }
    range.collapse(true);
    const sel = root.ownerDocument.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function makeRendered(blk, k) {
    const div = root.ownerDocument.createElement('div');
    div.className = 'laup-blk';
    div.innerHTML = htmlOf.get(blk) || '';
    markAtoms(div);
    div.appendChild(makeRail(k));
    return div;
  }

  // 渲染态**直接编辑**的块：屏幕上就是渲染结果，但可以直接打字。
  function makeLive(blk, k) {
    const div = root.ownerDocument.createElement('div');
    div.className = 'laup-blk is-editing is-live';

    const holder = root.ownerDocument.createElement('div');
    holder.innerHTML = htmlOf.get(blk) || '';
    markAtoms(holder);

    const local = sliceBlock(source, blk);
    const rtxt = contentText(holder);
    const align = alignBlock(local, rtxt);

    // 空块（`# ` / `> ` / `- `…）没有文本节点，光标只能落在元素偏移上 ——
    // 实测（探针 bisect3/br.mjs）：只要 contenteditable=false 的 rail 在场，
    // Chromium 会把这种光标判成无效位置，execCommand / 键盘输入**全部被静默拒绝**。
    // 解法：塞一个 `<br>` 占位（Chrome 空编辑器的标准结构），光标就有了可落点。
    // ⚠️ br 不产生文本节点，不进 contentText，对齐与源码换算完全不受影响。
    if (align.ok && align.empty) {
      const br = root.ownerDocument.createElement('br');
      const first = holder.firstElementChild;
      if (first) first.appendChild(br); else holder.insertBefore(br, holder.firstChild);
    }

    div.innerHTML = holder.innerHTML;
    div.appendChild(makeRail(k));

    if (!align.ok) {
      // 换算不出来（表格 / 图表 / 纯公式块）→ 这一块**不开放直接编辑**，
      // 只读展示。绝不猜着改。要改它的唯一途径是工具栏「导入 Laup」换整篇源码。
      div.classList.add('is-opaque');
      div.title = `${align.reason || '这块不支持直接编辑'} —— 请用工具栏「导入 Laup」修改`;
      return div;
    }

    liveAligns.set(k, { align, local, rtxt });
    div.contentEditable = 'true';
    div.spellcheck = false;
    return div;
  }

  // 源码态（双击 / 映射不了的块 / 用户主动要求）
  function makeSourceEditor(blk, k) {
    const wrap = root.ownerDocument.createElement('div');
    wrap.className = 'laup-blk is-editing is-source';

    const ta = root.ownerDocument.createElement('textarea');
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

  function makeRail(k) {
    const rail = root.ownerDocument.createElement('div');
    rail.className = 'laup-rail';
    rail.contentEditable = 'false';   // 它在可编辑块里面，别被当成内容
    for (const [act, glyph, title] of RAIL_ACTS) {
      const b = root.ownerDocument.createElement('button');
      b.type = 'button';
      b.className = 'laup-rail-btn';
      b.dataset.act = act;
      b.title = title;
      b.textContent = glyph;
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

  function activateBlock(idx, kind = 'live', caret = 'end') {
    recompile();                       // 固化刚才的编辑（块可能因此重新划分）
    if (!blocks[idx] && blocks.length) idx = blocks.length - 1;
    activeIndex = idx;
    editKind = kind;
    paint({ focus: true, caret });
  }

  const jumpTo = (idx, caret) => { if (blocks[idx]) activateBlock(idx, 'live', caret); };

  function leaveEdit() {
    // 用户点了 +↑ / +↓ 却一个字都没打就离开了 —— 把那一行还回去，别攒出一串空行。
    if (phantom) {
      const cleaned = removeBlankLine(source, phantom.pos.start);
      if (cleaned !== null) source = cleaned;
      phantom = null;
    }
    recompile();
    activeIndex = null;
    liveAligns.clear();
    paint();
  }

  // ── 渲染态直接编辑：事后收口

  // 光标在"可见文字"里的偏移。做法是从块首到光标建一个 Range 再取它的文本 ——
  // 不用手算 node 的累加，浏览器已经把偏移算好了。
  function caretOffset(host) {
    const sel = root.ownerDocument.getSelection();
    if (!sel || !sel.rangeCount) return null;
    const range = sel.getRangeAt(0);
    if (!host.contains(range.startContainer)) return null;
    const head = root.ownerDocument.createRange();
    head.setStart(host, 0);
    head.setEnd(range.startContainer, range.startOffset);
    return contentText(head.cloneContents());
  }

  /** 把一块的源码改掉（同时平移后面所有块的行号）。 */
  function writeBlock(k, nextLocal) {
    source = applyBlockEdit(source, blocks, k, nextLocal).source;
  }

  function restoreBlock(host, k, entry) {
    const holder = root.ownerDocument.createElement('div');
    holder.innerHTML = htmlOf.get(blocks[k]) || '';
    markAtoms(holder);
    host.innerHTML = holder.innerHTML;
    host.appendChild(makeRail(k));
    host.contentEditable = 'true';
    liveAligns.set(k, entry);
  }

  // 一块编辑完之后收口：把"可见文字的新样子"换算成源码。
  // 三个入口共用它 —— 打字（input）、输入法上屏（compositionend）、删除。
  function commitLiveText(host, k, kind) {
    const entry = liveAligns.get(k);
    if (!entry || !blocks[k]) return true;
    const after = contentText(host);
    if (after === entry.rtxt) return true;         // 没变（比如只是移动了光标）

    const r = applyLiveText(entry.local, entry.rtxt, after);
    if (!r) {
      restoreBlock(host, k, entry);
      flashTip('这一处改不了 —— 双击这一块，用源码改');
      return false;
    }
    writeBlock(k, r.text);
    entry.local = r.text;
    entry.rtxt = after;
    scheduleWarnRefresh();
    recordHistory(kind, blocks[k] ? blocks[k].pos.start : null);
    onChange?.(source);
    return true;
  }

  function onLiveInput(e) {
    const host = e.target.closest && e.target.closest('.laup-blk');
    if (!host || !host.classList.contains('is-live')) return;
    if (composing) return;                          // 输入法组合期间，等 compositionend 一次算
    if (skipNextInput) { skipNextInput = false; return; }  // compositionend 刚记过一条
    commitLiveText(host, Number(host.dataset.index), 'type');
  }

  function onLiveKeyDown(e) {
    const host = e.target.closest && e.target.closest('.laup-blk');
    if (!host || !host.classList.contains('is-live')) return;
    const k = Number(host.dataset.index);
    if (!blocks[k]) return;

    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      railAct(k, e.key === 'ArrowUp' ? 'up' : 'down');
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); leaveEdit(); return; }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); splitBlockAtCaret(host, k); return; }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const nodes = editableTextNodes(host);
      const sel = root.ownerDocument.getSelection();
      if (!nodes.length || !sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      const atEdge = e.key === 'ArrowUp'
        ? range.startContainer === nodes[0] && range.startOffset === 0
        : range.startContainer === nodes[nodes.length - 1]
          && range.startOffset === nodes[nodes.length - 1].data.length;
      if (!atEdge) return;
      e.preventDefault();
      jumpTo(k + (e.key === 'ArrowUp' ? -1 : 1), e.key === 'ArrowUp' ? 'end' : 'start');
    }
  }

  // 回车 = 在这一处把块拆成两块。⚠️ 拆完必须重编译（块数与行号都变了），
  // 所以光标是"重新放"的，不是延续的。
  function splitBlockAtCaret(host, k) {
    const entry = liveAligns.get(k);
    if (!entry) return;
    const at = caretOffset(host);
    const pos = at == null ? entry.local.length : insertPoint(entry.align, at);
    if (pos == null) { flashTip('这里插不了新段落 —— 换个位置再试'); return; }

    const head = entry.local.slice(0, pos).replace(/\s+$/, '');
    const tail = entry.local.slice(pos).replace(/^\s+/, '');
    writeBlock(k, head + '\n\n' + tail);

    recompile();
    const nk = Math.min(k + 1, Math.max(0, blocks.length - 1));
    activeIndex = nk;
    editKind = 'live';
    paint({ focus: true, caret: 'start' });
    recordHistory('struct', blocks[k] ? blocks[k].pos.start : null);
  }

  function onLivePaste(e) {
    const host = e.target.closest && e.target.closest('.laup-blk');
    if (!host || !host.classList.contains('is-live')) return;
    e.preventDefault();
    const raw = (e.clipboardData && e.clipboardData.getData('text/plain')) || '';
    const lines = raw.replace(/\r\n?/g, '\n').split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;

    const k = Number(host.dataset.index);
    const entry = liveAligns.get(k);
    if (!entry) return;

    // 单行 → 就走"打字"那条路（交给浏览器插入，再由 input 收口）。
    if (lines.length === 1) {
      root.ownerDocument.execCommand?.('insertText', false, lines[0]);
      return;
    }

    // 多行 → 在源码层面插入，然后重渲。
    // ⚠️ 不能直接让浏览器插多行：它会在 DOM 里造出 <br>/<div>，而我们的映射只认文本，
    // 那会让这一块与源码彻底对不上。粘贴是低频操作，重渲一次是可接受的代价。
    const at = caretOffset(host);
    const pos = at == null ? entry.local.length : insertPoint(entry.align, at);
    if (pos == null) { flashTip('这里粘不了 —— 换个位置再试'); return; }
    const before = entry.local.slice(0, pos).replace(/\s+$/, '');
    const after = entry.local.slice(pos).replace(/^\s+/, '');
    const glued = [before, ...lines, after].filter(Boolean).join('\n\n');
    writeBlock(k, glued);
    recompile();
    paint();
    recordHistory('struct', blocks[k] ? blocks[k].pos.start : null);
  }

  // ── 源码态（textarea）：打字只改源码与行号，不碰 DOM

  function onInput(e) {
    const ta = e.target;
    const idx = Number(ta.dataset.index);
    if (!blocks[idx]) return;
    source = applyBlockEdit(source, blocks, idx, ta.value).source;
    autoGrow(ta);
    if (skipNextInput) skipNextInput = false;
    else if (!composing) recordHistory('type', blocks[idx] ? blocks[idx].pos.start : null);
    scheduleWarnRefresh();
    onChange?.(source);
  }

  function onKeyDown(e) {
    const ta = e.target;
    const idx = Number(ta.dataset.index);
    if (!Number.isInteger(idx) || !blocks[idx]) return;

    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      railAct(idx, e.key === 'ArrowUp' ? 'up' : 'down');
      return;
    }

    const before = ta.value.slice(0, ta.selectionStart);
    const lineNo = (before.match(/\n/g) || []).length;
    const total = ta.value.split('\n').length;

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

  // ── 点击：换块 / 退出 / 双击展开源码
  //
  // ⚠️ 渲染态的块**不能在 mousedown 里就动手**：一 preventDefault，浏览器的选区
  // 就永远建不起来 —— "在渲染出来的文字上划选"这条能力会变成真鼠标永远触发不到
  // （探针之前用脚本建选区才验过，所以没暴露）。现在切成两拍：mousedown 先记下来，
  // mouseup 看有没有选中文字再决定。

  function onDocMousedown(e) {
    pendingPick = null;
    if (e.target.closest('.laup-src')) return;              // 点在源码框里，交回浏览器
    if (e.target.closest('.overlay')) return;               // 浮层自己处理
    if (e.target.closest('.laup-rail')) { e.preventDefault(); return; }
    if (e.target.closest('.tb-btn, .fbar-btn')) return;     // 按钮有自己的 mousedown 处理
    if (e.target.closest('.tb-fmt-wrap .fbar-pop')) return; // 色板/标题弹出层整个放行
    if (e.target.closest('.tune-panel, .tune-fab')) return; // 调参面板（里面有原生控件）
    if (e.target.closest('.fbar')) {
      if (!e.target.closest('input[type="color"]')) e.preventDefault();
      return;
    }
    if (e.target.closest('a[href]')) return;                // 链接要能点

    const host = e.target.closest('.laup-blk');
    const i = host ? Number(host.dataset.index) : NaN;
    if (Number.isInteger(i) && blocks[i]) {
      // 落在块上：**先只记下来**，等 mouseup 再决定是"点"还是"划"。
      // ⚠️ 这里绝不能 preventDefault —— 拦了浏览器就不会开始建选区，拖选就没了。
      pendingPick = {
        index: i,
        el: host,
        mode: host.classList.contains('is-live') || host.classList.contains('is-source') ? 'editing' : 'rendered',
      };
      return;
    }

    // 兜底：点在编辑器容器（root）之外的空白/表单上是页面自己的事。
    // 退出编辑态要照做（点标题框时正该把块收起来），但**绝不能 preventDefault** ——
    // 这里挂在 document 上，站内页面整个表单（标题 / 作者 / 下拉 / 按钮）都在 root 之外，
    // 拦了 mousedown 的默认行为，浏览器就不聚焦了：输入框点不进去、下拉拉不开，
    // 看上去就是"整个页面点不动"。（上游独立页整页都是编辑器、没有别的表单，踩不到这个。）
    if (root.contains(e.target)) e.preventDefault();
    leaveEdit();
  }

  function onDocMouseup(e) {
    const pick = pendingPick;
    pendingPick = null;
    if (!pick) return;
    const sel = root.ownerDocument.getSelection();
    if (sel && !sel.isCollapsed && String(sel).trim() !== '') return;   // 划选 → 交给浮动工具栏
    if (!pick.el.contains(e.target)) return;
    if (pick.mode === 'editing') return;    // 已经在这块里编，别重画（重画会丢光标）
    activateBlock(pick.index, 'live');
  }

  function onDblClick(e) {
    // 🔴 双击**不再**展开源码（2026-09-23 用户明确否决）：双击是普通用户的本能操作，
    // 掉进源码框 = "还在写代码"。日常编辑只有渲染态一种；整块换不了（表格/公式）
    // 的走工具栏「导入 Laup」。makeSourceEditor 保留但 UI 上无入口。
  }

  // ── 撤销栈（快照 = { source, line }）
  //
  // 用**行号**而不是字符偏移：撤销后块可能重新划分，偏移会失去意义，行号不会。
  // 渲染态直接编辑下没有 textarea 可量光标，所以行号必须显式传进来。

  function snapshot(lineOverride) {
    if (lineOverride != null) return { source, line: lineOverride };
    const ta = currentSrc();
    if (!ta) return { source, line: blocks[activeIndex] ? blocks[activeIndex].pos.start : 1 };
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
    phantom = null;                    // 撤销回来的是历史状态，幻影块不该跟着穿越
    recompile();
    const idx = blockIndexAt(blocks, snap.line);
    activeIndex = idx >= 0 ? idx : null;
    editKind = 'live';
    paint({ focus: activeIndex != null });
    paintHistoryButtons();
  }

  function paintHistoryButtons() {
    if (!undoStack || !els.undo) return;
    els.undo.disabled = !canUndo(undoStack);
    els.redo.disabled = !canRedo(undoStack);
  }

  const doUndo = () => applySnapshot(undoHistory(undoStack));
  const doRedo = () => applySnapshot(redoHistory(undoStack));

  function onGlobalKeydown(e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const k = e.key.toLowerCase();
    const isRedo = k === 'y' || (k === 'z' && e.shiftKey);
    const isUndo = k === 'z' && !e.shiftKey;
    if (!isUndo && !isRedo) return;
    e.preventDefault();
    if (isRedo) doRedo();
    else doUndo();
  }

  // Ctrl+B / I / U —— 源码态下与按钮等价；渲染态下交给浮动工具栏（要先划选）。
  function onShortcutKeydown(e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
    const ta = currentSrc();
    if (!ta || root.ownerDocument.activeElement !== ta) return;
    const key = { b: 'bold', i: 'italic', u: 'underline' }[e.key.toLowerCase()];
    if (!key || ta.selectionStart === ta.selectionEnd) return;
    e.preventDefault();
    applyFbarInSrc(
      { ta, blockIdx: Number(ta.dataset.index), range: { start: ta.selectionStart, end: ta.selectionEnd } },
      key,
      null,
    );
  }

  // ── 块级操作（图标栏 +↑ / +↓ / ↑ / ↓）

  function railAct(index, act) {
    if (!blocks[index]) return;

    if (act === 'above' || act === 'below') {
      const r = insertBlockAt(source, blocks, index, act);
      if (!r) return;
      source = r.source;
      phantom = { type: 'Phantom', pos: { start: r.line, end: r.line } };
      recompile();                             // 幻影块会被塞到正确位置
      activeIndex = blockIndexAt(blocks, r.line);
      editKind = 'live';
      paint({ focus: true, caret: 'start' });  // 光标直接落进新块
      recordHistory('struct', r.line);         // 结构操作独立成条
      return;
    }

    const r = moveBlock(source, blocks, index, act === 'up' ? -1 : 1);
    if (!r) return;
    source = r.source;
    phantom = null;
    recompile();
    activeIndex = blockIndexAt(blocks, r.line);  // 光标跟着块走，不然移完还得自己找
    editKind = 'live';
    paint({ focus: true, caret: 'start' });
    recordHistory('struct', r.line);
  }

  // ── 工具栏

  const SNIPPETS = {
    'fontsize-18': `\\fontsize{18}{${CARET}}`,
    table: `\\table=[\n    column=[\n        "${CARET}"\n    ]\n]`,
    image: `\\image=[\n    src="${CARET}"\n]`,
    ...extensionSnippets(),
  };

  function flashTip(message) {
    if (!els.tip) return;
    els.tip.textContent = message;
    els.tip.hidden = false;
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => { if (els.tip) els.tip.hidden = true; }, 2400);
  }

  // 把模板插进当前选区：有选区 → 选区文字被包进模板（`▮` 的位置）；
  // 无选区 → 插入骨架，光标落在 `▮` 原来的位置。
  // `range` 可显式传入：系统取色器会**夺走焦点**，得先把选区存下来（见下面取色器那条）。
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

    recordHistory('struct', blocks[idx] ? blocks[idx].pos.start : null);
    scheduleWarnRefresh();
    onChange?.(source);
  }

  let fmtUi = { groups: [], pops: new Map() };

  function buildToolbar() {
    if (!els.toolbar) return;
    fmtUi = buildToolbarGroups(FIXED_ROWS);
    for (const g of fmtUi.groups) els.toolbar.insertBefore(g, els.fmtAnchor);
    // 锚点用完就删 —— 留着它会打断 `.tb-group + .tb-group` 那条画竖线的相邻选择器
    els.fmtAnchor?.remove();

    // mousedown 阶段就阻止默认行为：保住焦点与选区。
    // ⚠️ 唯独 `input[type="color"]` 不能拦 —— 拦了系统取色器就打不开。
    listen(els.toolbar, 'mousedown', (e) => {
      if (e.target.closest('input[type="color"]')) return;
      if (e.target.closest('.tb-btn, .fbar-btn, .fbar-swatch, .fbar-clear, .fbar-head-btn')) {
        e.preventDefault();
      }
    });
    listen(els.toolbar, 'click', (e) => {
      const act = popAction(e.target);
      if (act) { runFormat(act.key, act.arg); closePops(fmtUi.pops); return; }

      const btn = e.target.closest('.tb-btn, .fbar-btn');
      if (!btn) return;
      if (btn.dataset.pop) {
        fbar.hide();
        togglePopover(fmtUi.pops, btn.dataset.pop, { down: true });
        return;
      }
      if (btn.dataset.key) { runFormat(btn.dataset.key); closePops(fmtUi.pops); return; }
      if (btn.dataset.ins) {
        const tpl = SNIPPETS[btn.dataset.ins];
        if (!tpl) flashTip(`「${btn.dataset.ins}」的插入模板没有注册 —— 提供它的扩展没装`);
        else applySnippet(tpl);
        return;
      }
      if (btn.dataset.act === 'undo') doUndo();
      if (btn.dataset.act === 'redo') doRedo();
    });

    // 原生取色器：弹出来就夺走焦点与选区 → 先存选区，挑完色再拿这份选区去包裹。
    for (const [kind, pop] of fmtUi.pops) {
      if (kind === 'head') continue;
      const input = pop.querySelector('input[type="color"]');
      if (!input) continue;
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
  }

  const readRange = () => {
    const ta = currentSrc();
    return ta ? { start: ta.selectionStart, end: ta.selectionEnd } : null;
  };

  // 格式动作的统一入口。作用对象按优先级取：
  //   ① 浮动工具栏正显示的选区（渲染态划选只有它知道"渲染文字的第几个字"）；
  //   ② 正在编辑的源码框的选区；
  //   ③ 光标落在某一块上（渲染态直接编辑）→ 给"整块"上下文，块级动作能直接用；
  //   ④ 都没有 → 提示，**不猜**。
  function formatContext() {
    const live = fbar.ctx;
    if (live) return live;
    const ta = currentSrc();
    if (ta) {
      return {
        mode: 'src',
        ta,
        blockIdx: Number(ta.dataset.index),
        range: { start: ta.selectionStart, end: ta.selectionEnd },
      };
    }
    if (activeIndex != null && blocks[activeIndex]) {
      return { mode: 'block', blockIdx: activeIndex, range: null, rtxt: null, from: null, to: null };
    }
    return null;
  }

  function runFormat(key, arg) {
    const ctx = formatContext();
    if (!ctx) { flashTip('先点一下要改的那一块，再用工具栏'); return false; }
    if (ctx.mode === 'block' && isInlineKey(key)) {
      flashTip('行内格式要先选中文字（在文字上划一下）');
      return false;
    }
    const ok = ctx.mode === 'src' || ctx.mode === 'block'
      ? (ctx.mode === 'src' ? applyFbarInSrc(ctx, key, arg) : applyFbarInRendered(ctx, key, arg))
      : applyFbarInRendered(ctx, key, arg);
    if (!ok) flashTip('这一处改不了 —— 换个位置再试');
    return ok;
  }

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
    recordHistory('struct', blocks[idx] ? blocks[idx].pos.start : null);
    scheduleWarnRefresh();
    onChange?.(source);
    return true;
  }

  function applyFbarInRendered(ctx, key, arg) {
    const blk = blocks[ctx.blockIdx];
    if (!blk) return false;
    const isInline = isInlineKey(key);
    if (isInline && (ctx.rtxt == null || ctx.from == null)) return false;

    let res = null;
    if (isInline) {
      // ⚠️ 必须在**这一块自己的源码**里对齐，不能拿整篇 source 去对 ——
      // `rtxt` 只是这一块渲染出来的文字，拿它跟整篇纯文本对齐，第一帧就错位，
      // 质量闸直接判负 → 什么也改不了（这个 bug 是探针抓出来的）。
      const local = sliceBlock(source, blk);
      const base = blockRange(source, blk).start;
      const m = mapRenderedRange(local, ctx.rtxt, ctx.from, ctx.to, key);
      if (!m) return false;
      // `m.text` 可能与 `local` 不同：边界对齐会**劈开**跨越选区的样式层。
      const src = m.text === local
        ? source
        : source.slice(0, base) + m.text + source.slice(base + local.length);
      res = applyFormat(src, base + m.start, base + m.end, key, arg);
    } else {
      // 块级动作（引用 / 列表 / 标题 / 围栏块）作用在**整块**上，不做字符级换算。
      const r = blockRange(source, blk);
      res = applyFormat(source, r.start, r.end, key, arg);
    }
    if (!res) return false;

    source = res.text;
    recompile();
    // 不切进源码态：用户是在"读"的状态下改的，改完就该看到改完的样子。
    // 渲染态下没有源码框可量光标，所以撤销的落点必须显式给行号。
    const at = blocks[Math.min(ctx.blockIdx, Math.max(0, blocks.length - 1))];
    paint();
    recordHistory('struct', at ? at.pos.start : 1);
    onChange?.(source);
    return true;
  }

  // ── 浮动工具栏（选中文字后出现）

  let fbar = null;

  function initFbarInstance() {
    fbar = initFbar({
      mount: root,
      onApply: (key, arg, ctx) => (ctx.mode === 'src'
        ? applyFbarInSrc(ctx, key, arg)
        : applyFbarInRendered(ctx, key, arg)),
      onTip: (msg) => flashTip(msg),
    });
  }

  // ── 块外观调参面板（只写 CSS 变量与容器上的 data-*，绝不碰 source）

  const TUNE_KEY = 'laup-ui-prefs';
  const TUNE_DEFAULTS = {
    mark: 'bar', bar: '#378ADD', bg: '#ffffff', boundary: '0 none', gutter: 'left',
  };

  const loadPrefs = () => {
    try {
      const raw = root.ownerDocument.defaultView?.localStorage?.getItem(TUNE_KEY);
      return raw ? { ...TUNE_DEFAULTS, ...JSON.parse(raw) } : { ...TUNE_DEFAULTS };
    } catch { return { ...TUNE_DEFAULTS }; }
  };

  function applyPrefs(p) {
    root.style.setProperty('--laup-hover-bar', p.bar);
    root.style.setProperty('--laup-hover-bg', p.bg);
    root.style.setProperty('--laup-blk-boundary', p.boundary);
    root.dataset.hoverMark = p.mark;
    root.dataset.gutter = p.gutter;
  }

  const savePrefs = (p) => {
    try { root.ownerDocument.defaultView?.localStorage?.setItem(TUNE_KEY, JSON.stringify(p)); } catch { /* 隐私模式 */ }
  };

  const tuneCopyText = (p) => [
    ':root {',
    `  --laup-hover-bg: ${p.bg};`,
    `  --laup-hover-bar: ${p.bar};`,
    `  --laup-blk-boundary: ${p.boundary};`,
    '}',
  ].join('\n');

  function initTune() {
    if (!els.tuneFab || !els.tunePanel) return;
    let prefs = loadPrefs();
    applyPrefs(prefs);

    const sync = () => {
      els.tuneMark.value = prefs.mark;
      els.tuneBar.value = prefs.bar;
      els.tuneBg.value = prefs.bg;
      els.tuneBoundary.value = prefs.boundary;
      els.tuneGutter.value = prefs.gutter;
    };
    const commit = () => { applyPrefs(prefs); savePrefs(prefs); };
    sync();

    listen(els.tuneFab, 'click', () => { els.tunePanel.hidden = !els.tunePanel.hidden; });
    listen(els.tuneMark, 'change', () => { prefs.mark = els.tuneMark.value; commit(); });
    listen(els.tuneBar, 'input', () => { prefs.bar = els.tuneBar.value; commit(); });
    listen(els.tuneBg, 'input', () => { prefs.bg = els.tuneBg.value; commit(); });
    listen(els.tuneBoundary, 'change', () => { prefs.boundary = els.tuneBoundary.value; commit(); });
    listen(els.tuneGutter, 'change', () => { prefs.gutter = els.tuneGutter.value; commit(); });

    listen(els.tuneCopy, 'click', async () => {
      const text = tuneCopyText(prefs);
      try {
        await root.ownerDocument.defaultView.navigator.clipboard.writeText(text);
        els.tuneCopy.textContent = '已复制 ✓';
      } catch {
        flashTip('复制失败，可手动抄：' + text.replace(/\n/g, ' '));
        els.tuneCopy.textContent = '复制失败';
      }
      setTimeout(() => { if (els.tuneCopy) els.tuneCopy.textContent = '复制为 CSS'; }, 1600);
    });

    listen(els.tuneReset, 'click', () => {
      prefs = { ...TUNE_DEFAULTS };
      sync();
      commit();
    });
  }

  // ── 面板

  function paintWarnings() {
    if (!els.warnings) return;
    if (!warnings.length) { els.warnings.innerHTML = ''; return; }
    const items = warnings
      .map((w) => `<div class="warn-item"><span class="warn-line">${w.line == null ? '—' : w.line}</span>`
        + `<span>${escapeHtml(w.message)}</span></div>`)
      .join('');
    els.warnings.innerHTML = `<div class="warn-title">诊断 ${warnings.length} 条</div>${items}`;
  }

  function paintStats() {
    if (!els.stats) return;
    const broken = blocks.filter((b) => b.type === 'Broken').length;
    els.stats.textContent = `${blocks.length} 块`
      + (broken ? ` · ${broken} 处语法还没写完` : '')
      + (warnings.length ? ` · ${warnings.length} 条提示` : '');
  }

  // ── 数学：KaTeX 按需渲染，加载失败就保留原始 TeX（不会变空白）

  function renderMathIn(container) {
    if (!katexLib || !container) return;
    container.querySelectorAll('.laup-math, .laup-math-display').forEach((el) => {
      const tex = el.dataset.tex;
      if (!tex || el.dataset.done) return;
      try {
        katexLib.render(translate(tex) ?? tex, el, {
          displayMode: el.classList.contains('laup-math-display'),
          throwOnError: false,
        });
        el.dataset.done = '1';
      } catch {
        // 保留原始 TeX —— 静默失败比空白好
      }
    });
  }

  // ── 顶栏高度 → CSS 变量
  //
  // 站内锚点（目录 / \eqref / \cite）跳转时，目标会被吸顶的 .chrome 盖住 ——
  // 内容其实跳对了，但用户看到的是"一条不相干的段落停在最上面"，于是判断跳错了。
  // ⚠️ **必须实测，不能写死**：工具栏是 flex-wrap，窄屏会换行变高。

  // ⚠️ 量的是 chrome 的**下边缘到视口顶端的距离**（rect.bottom），不是它自己的高度。
  //   宿主把这条工具栏改成 `position: fixed` 挂在导航栏下面（top: 64px）之后，
  //   "工具栏自身的高度"就漏掉了上面那 64px 导航栏 —— 用高度当锚点偏移，
  //   目录 / \eqref / \cite 跳过去会正好被顶栏盖住一截。
  //   fixed 定位下 bottom 天然等于「导航栏 + 工具栏」，窄屏工具栏折行变高也照样对。
  //   （sticky 时代不能用 bottom：没吸附时它在文档流里，bottom 是个很远的值。）
  function syncChromeHeight() {
    const chromeEl = root.querySelector('.chrome');
    if (!chromeEl || !root.ownerDocument.defaultView) return;
    const h = Math.round(chromeEl.getBoundingClientRect().bottom);
    root.style.setProperty('--laup-chrome-h', `${h}px`);
  }

  // ── 事件装配

  function bindEvents() {
    const doc = root.ownerDocument;
    const view = doc.defaultView;

    listen(doc, 'mousedown', onDocMousedown);
    listen(doc, 'mouseup', onDocMouseup);
    listen(doc, 'selectionchange', () => fbar.sync());
    listen(els.doc, 'dblclick', onDblClick);
    listen(els.doc, 'input', onLiveInput);
    listen(els.doc, 'keydown', onLiveKeyDown);
    listen(els.doc, 'paste', onLivePaste);

    // 中文输入法：组合期间每个字母都会触发 input，照常入栈会让 Ctrl+Z 变成逐字母回退。
    listen(els.doc, 'compositionstart', () => { composing = true; }, true);
    listen(els.doc, 'compositionend', (e) => {
      composing = false;
      skipNextInput = true;         // Chrome 在上屏后还会补一次 input
      const host = e.target.closest && e.target.closest('.laup-blk');
      if (host && host.classList.contains('is-live')) {
        commitLiveText(host, Number(host.dataset.index), 'ime');
      }
    }, true);

    listen(view, 'keydown', onGlobalKeydown);
    listen(view, 'keydown', onShortcutKeydown);

    // 图标栏与链接：事件委托挂在 #doc 上 —— paint() 每次都换掉 #doc 的内容。
    listen(els.doc, 'click', (e) => {
      const btn = e.target.closest('.laup-rail-btn');
      if (!btn || btn.disabled) return;
      const host = btn.closest('.laup-blk');
      const i = host ? Number(host.dataset.index) : NaN;
      if (!Number.isInteger(i) || !blocks[i]) return;
      railAct(i, btn.dataset.act);
    });
    // 渲染态里的**外链**：不要在同一个标签页里打开 —— 那会把编辑器页面顶掉，
    // 内存里的稿子就没了。站内锚点（`#…`）不拦，交给浏览器滚到目标标题。
    listen(els.doc, 'click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (href.startsWith('#')) return;
      e.preventDefault();
      view.open(a.href, '_blank', 'noopener');
    });

    // 点别处收起弹出层。用独立监听，避免和 onDocMousedown 那一串放行规则纠缠。
    listen(doc, 'mousedown', (e) => {
      if (![...fmtUi.pops.values()].some((p) => !p.hidden)) return;
      if (e.target.closest('.tb-fmt-wrap')) return;
      closePops(fmtUi.pops);
    });
    listen(doc, 'keydown', (e) => { if (e.key === 'Escape') closePops(fmtUi.pops); });

    listen(view, 'resize', () => { fbar.reposition(); syncChromeHeight(); });
    listen(view, 'scroll', () => fbar.reposition(), true);

    // 整篇渲染结果（对照「编辑器里看到的」与「发布出来的」）
    if (els.btnRender) {
      listen(els.btnRender, 'click', () => {
        const { ast } = compile(source, { mode: 'edit' });
        // ⚠️ 浮层与正文渲染的是同一篇，标题/公式/文献的 id 会一模一样 →
        // 点浮层里的目录会跳到被浮层盖住的正文上，表现就是"点了没反应"。
        // 给独立 id 前缀，两边的锚点各自封闭。
        els.overlayDoc.innerHTML = renderHtml(ast, { idPrefix: OVERLAY_ID_PREFIX }).html;
        els.overlay.hidden = false;
        renderMathIn(els.overlayDoc);
      });
    }
    if (els.btnClose) {
      listen(els.btnClose, 'click', () => {
        els.overlay.hidden = true;
        els.overlayDoc.innerHTML = '';
      });
    }

    const chromeEl = root.querySelector('.chrome');
    if (chromeEl && view.ResizeObserver) {
      chromeObserver = new view.ResizeObserver(syncChromeHeight);
      chromeObserver.observe(chromeEl);
    }
  }

  // ── 装载 / 卸载 / 对外接口

  function mount() {
    bindEls();
    buildToolbar();
    initFbarInstance();
    initTune();
    bindEvents();
    recompile();
    undoStack = makeHistory(snapshot(1));
    paint();
    syncChromeHeight();
    return api;
  }

  /** 整篇换源码：重编译 + 重建撤销栈 + 重画。宿主载入草稿 / 编辑既有文章时用。 */
  function adoptSource(text) {
    source = String(text ?? '');
    phantom = null;
    activeIndex = null;
    liveAligns.clear();
    recompile();
    undoStack = makeHistory(snapshot(1));
    paint();
  }

  function destroy() {
    destroyed = true;
    clearTimeout(tipTimer);
    clearTimeout(warnTimer);
    for (const off of disposers.splice(0)) off();
    chromeObserver?.disconnect();
    chromeObserver = null;
    // 浮动工具栏是我们挂进容器的，得自己带走（Vue 只认自己渲染的节点）
    root.querySelector('.fbar')?.remove();
    if (els.doc) els.doc.innerHTML = '';
  }

  const api = { mount, destroy, getSource: () => source, setSource: adoptSource, getRoot: () => root };
  return api;
}
