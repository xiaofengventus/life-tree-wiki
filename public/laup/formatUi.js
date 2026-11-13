// 格式按钮与色板弹出层的**共用界面件**。
//
// 两个工具栏（浮动 / 固定）用同一份代码建 DOM，只有这样"两边的图标与色板完全一样"
// 才是结构上成立的，而不是靠两处各自维护、靠人去对齐。
// 顺序与图标来自 ./formatSpec.js，色值来自 ./palette.js —— 这个文件只管"长什么样"。
//
// ── 与 wangEditor（原项目）的对应关系
//
// 原项目的色板弹出层（`@wangeditor/basic-modules` 的 `color/menu/BaseMenu.ts`）结构是：
//   `<ul class="w-e-panel-content-color">`
//     ├─ 第一格 `<li data-value="0" class="clear">${CLEAN_SVG}${文案}</li>`   ← **清除项**
//     └─ 后面才是色块
// 点 `data-value="0"` 走的是 `Editor.removeMark(editor, mark)` ——
// 也就是**只去掉这一种标记**，不是"涂成白色"、也不是"清掉所有格式"。
// 这里的 `:none` 后缀（见 toggleOps 的 clearOneStyle）就是同一件事。
//
// 文案也照原项目的 locale 抄：文字色那格叫「默认颜色」，背景色那格叫「清除背景色」。

import { ICONS } from './icons.js';
import { NAMED, ANTD70, ANTD70_ROWS } from './palette.js';
import { ITEMS, HEAD_LEVELS } from './formatSpec.js';
import { NONE_SUFFIX } from './toggleOps.js';

// 原项目色板里那个"清除"图标（CLEAN_SVG），补 fill 才能跟着按钮前景色变色
export const CLEAN_SVG = '<svg viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">'
  + '<path d="M236.8 128L896 787.2V128H236.8z m614.4 704L192 172.8V832h659.2zM192 64h704c38.4 0 64 25.6 64 64v704c0 38.4-25.6 64-64 64H192c-38.4 0-64-25.6-64-64V128c0-38.4 25.6-64 64-64z"/>'
  + '</svg>';

// 文案照 wangEditor 的 zh-CN locale（color.default / color.clear）
const CLEAR_LABEL = { fg: '默认颜色', bg: '清除背景色' };
const CLEAR_TITLE = {
  fg: '默认字体颜色（只去掉文字颜色，别的样式都留着）',
  bg: '清空背景颜色（只去掉背景色，别的样式都留着）',
};

// 命名色里几个浅色要显式画出来，免得"白块"看着像坏了
const namedCss = (name) => (name === 'transparent'
  ? 'repeating-conic-gradient(#e9ecef 0 25%, #fff 0 50%) 0 0 / 8px 8px'
  : name);

// ── 按钮

function makeFormatBtn(key) {
  const it = ITEMS[key];
  // 插入类（`ins: true`，例如字号骨架）：它是"插一段模板"，不是"作用在选区上的格式"，
  // 所以落到 `.tb-btn[data-ins]` 上，由 editor.js 走 applySnippet 那条路。
  if (it.ins) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tb-btn';
    b.dataset.ins = key;
    b.title = it.t;
    b.textContent = it.txt;
    return b;
  }
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'fbar-btn';
  b.dataset.key = key;
  if (it.pop) b.dataset.pop = it.pop;
  b.title = it.t;
  b.setAttribute('aria-label', it.t);
  b.innerHTML = it.txt || ICONS[it.i] || key;
  return b;
}

const makeSep = () => {
  const s = document.createElement('span');
  s.className = 'fbar-sep';
  return s;
};

// ① 浮动工具栏那一排：一个容器里排开，行与行之间插一条细竖线
export function buildFbarButtons(host, rows) {
  rows.forEach((row, k) => {
    if (k) host.appendChild(makeSep());
    for (const key of row) host.appendChild(makeFormatBtn(key));
  });
}

// ② 固定工具栏：每一行单独一个 `.tb-group`（组之间的竖线由 CSS 画）。
//    带弹出层的按钮（文字色 / 背景色 / 标题级别）要和自己的弹出层包在同一个
//    `position:relative` 盒子里 —— 弹出层是绝对定位，得有个定位上下文，
//    否则会挂到 `.chrome` 上、位置全错。
//    返回 `{ groups, pops }`：groups 由调用方插进 #toolbar，pops 由调用方用来开合。
export function buildToolbarGroups(rows) {
  const pops = new Map();
  const groups = rows.map((row) => {
    const g = document.createElement('div');
    g.className = 'tb-group tb-group-fmt';
    for (const key of row) {
      const btn = makeFormatBtn(key);
      const kind = ITEMS[key] && ITEMS[key].pop;
      if (!kind) { g.appendChild(btn); continue; }
      const wrap = document.createElement('div');
      wrap.className = 'tb-fmt-wrap';
      const pop = makePop(kind, { fixed: true });
      pops.set(kind, pop);
      wrap.append(btn, pop);
      g.appendChild(wrap);
    }
    return g;
  });
  return { groups, pops };
}

// ── 色板 / 标题弹出层
//
// `fixed` = 挂在固定工具栏里：默认**往下**弹（工具栏在页面顶部，上方没地方）。
// 浮动工具栏那边默认往上（它在选区上方，往下会盖住刚选中的字）。

export function makeColorPop(kind, { fixed = false } = {}) {
  const pop = document.createElement('div');
  pop.className = `fbar-pop fbar-pop-${kind}${fixed ? ' is-down' : ''}`;
  pop.dataset.pop = kind;
  pop.hidden = true;

  // 第一格：清除（与 wangEditor 的色板一致）
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'fbar-clear';
  clear.dataset.none = kind === 'bg' ? 'bgcolor' : 'fontcolor';
  clear.title = CLEAR_TITLE[kind];
  clear.setAttribute('aria-label', CLEAR_TITLE[kind]);
  clear.innerHTML = `${CLEAN_SVG}<span>${CLEAR_LABEL[kind]}</span>`;
  pop.appendChild(clear);

  const namedRow = document.createElement('div');
  namedRow.className = 'fbar-named';
  for (const [name, label] of NAMED) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'fbar-swatch fbar-swatch-named';
    b.dataset.color = name;
    b.title = `${label}（${name}）`;
    b.style.background = namedCss(name);
    namedRow.appendChild(b);
  }

  const anRow = document.createElement('div');
  anRow.className = 'fbar-grid';
  ANTD70.forEach((hex, k) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'fbar-swatch fbar-swatch-hex';
    b.dataset.color = hex;
    b.title = `${hex}（${ANTD70_ROWS[Math.floor(k / 10)] || 'antd'}）`;
    b.style.background = hex;
    anRow.appendChild(b);
  });

  const foot = document.createElement('div');
  foot.className = 'fbar-pop-foot';
  foot.innerHTML = '<label>自定义 <input type="color" value="#c0392b"></label>'
    + '<span class="fbar-pop-hint">命名色 + antd 70 色</span>';

  pop.append(namedRow, anRow, foot);
  return pop;
}

export function makeHeadPop({ fixed = false } = {}) {
  const pop = document.createElement('div');
  pop.className = `fbar-pop fbar-pop-head${fixed ? ' is-down' : ''}`;
  pop.dataset.pop = 'head';
  pop.hidden = true;

  const row = document.createElement('div');
  row.className = 'fbar-heads';
  for (const [lv, label] of HEAD_LEVELS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'fbar-head-btn';
    b.dataset.level = String(lv);
    b.textContent = label;
    row.appendChild(b);
  }
  pop.appendChild(row);
  return pop;
}

// 按 kind 建弹出层（'fg' / 'bg' / 'head'）
export const makePop = (kind, opts) => (kind === 'head' ? makeHeadPop(opts) : makeColorPop(kind, opts));

// ── 点击解析
//
// 把一次点击的目标解成 `{ key, arg }`，两个工具栏共用 ——
// 免得出现"浮动里点得对、固定里点错"这种最难查的不一致。
// 认不出来返回 null（表示点的是弹出层里的空白）。
export function popAction(target) {
  const sw = target.closest('.fbar-swatch');
  if (sw) {
    const kind = sw.closest('.fbar-pop').dataset.pop === 'bg' ? 'bgcolor' : 'fontcolor';
    return { key: kind, arg: sw.dataset.color };
  }
  const cl = target.closest('.fbar-clear');
  if (cl) return { key: cl.dataset.none + NONE_SUFFIX };
  const hd = target.closest('.fbar-head-btn');
  if (hd) return { key: `heading:${hd.dataset.level}` };
  return null;
}

// ── 开合与位置

export function closePops(pops, except) {
  for (const p of pops.values()) if (p !== except) p.hidden = true;
}

// 展开某个弹出层（已经是开的就收起），并把它摆正。
// ⚠️ 位置只能在**显示之后**量：`display:none` 的元素量出来是 0×0（这个坑踩过很多次）。
export function togglePopover(pops, kind, { down = false } = {}) {
  const pop = pops.get(kind);
  if (!pop) return null;
  const wasOpen = !pop.hidden;
  closePops(pops, pop);
  pop.hidden = wasOpen;
  if (pop.hidden) return null;

  pop.classList.remove('is-below');
  if (down) {
    // 固定工具栏在页面顶部，往下弹基本一定有地方；只有极端情况下才翻回上方
    if (pop.getBoundingClientRect().bottom > window.innerHeight - 8) pop.classList.add('is-below');
  } else if (pop.getBoundingClientRect().top < 8) {
    // 浮动工具栏被顶到吸顶栏下面时，上方根本没空间 —— 会顶出屏幕，点都点不到
    pop.classList.add('is-below');
  }
  // 弹出层比工具栏宽，靠右的按钮会把它顶出屏幕 → 往左挪
  const r = pop.getBoundingClientRect();
  const over = r.right - (window.innerWidth - 8);
  pop.style.marginLeft = over > 0 ? `${-over}px` : '0';
  return pop;
}
