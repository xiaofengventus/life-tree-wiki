// 编辑器「格式按钮」的**纯逻辑**：输入 (源码文本, 选区) → 输出 (新文本, 新选区)。
// 不碰 DOM，所以能直接单测。
//
// 四件事在这里定死：
//
// 1. **再点一次 = 取消，而不是再套一层**（用户明确要的）。
// 2. **不产生同类嵌套**：包上之前先把选区里**完整**的同类包裹剥掉，
//    否则 `a\textbf{b}c` 全选再加粗会变成 `\textbf{a\textbf{b}c}`。
// 3. **md 写法与 Laup 写法同等对待**：`**粗**` 和 `\textbf{粗}` 都能识别、都能脱掉，
//    取消时按**原来那一种**还原（不会把 `**粗**` 改成 `\textbf{粗}`）。
// 4. **颜色/字号是"赋值"语义，不是开关**：挑蓝色是要把红色**换掉**，
//    而不是把红色那层删掉、更不是在外面再套一层。只有挑**同一个值**才等于取消。
//
// ── "取消"要认四种选区姿势（顺序不能换）
//
//   ① 选区正好等于某一层的内容         `\textbf{⟨Laup⟩}`           → 脱掉这一层
//   ② 选区正好盖住整层（含头尾）        `⟨\textbf{Laup}⟩`           → 脱掉这一层
//   ③ 选区落在某一层**内部**            `\textbf{L⟨au⟩p}`            → 脱掉整层
//   ④ 其它                             `⟨a\textbf{b}c⟩`            → 先剥掉里面完整的同类层，再包上
//
//   ③ 之所以不做"只给 au 去掉粗体"（那要把标记切开），是因为切开会让源码变得难以预料；
//   整体脱掉更好解释，也更好撤销。
//
// ⚠️ 括号配对必须**感知命令**：`matchBraceClose` 遇到 `\` 就跳一格，
// 所以 `\textbf{a \textcolor{red}{b} c}` 里那个嵌套的 `{red}` 不会被算成正文括号。
// （`readGroup` / `bracesBalanced` 用的是同一条规则，保持一致。）

// ── 匹配器：head 是"开头符号"，close 是三种收尾方式之一
//    'brace'      —— 配对的右花括号
//    { text }     —— 一个字面量收尾串（`**`、`` ` ``、`~~`…）
//    { re }       —— 一个正则收尾（链接的 `](url)`，括号里内容不定长）
// `value`（只给颜色/字号用）从头部里抠出"当前设的是什么值"。

const STYLE = {
  bold: [
    { head: /\\textbf\{/, close: 'brace' },
    { head: /\*\*/, close: { text: '**' } },
  ],
  italic: [
    { head: /\\textit\{/, close: 'brace' },
    // 单星号：两边都不能还是星号，否则会把 `**粗**` 的星号当成斜体的开头
    { head: /\*/, close: { text: '*' }, guard: (t, cut) => t[cut - 2] !== '*' && t[cut] !== '*' },
  ],
  underline: [{ head: /\\underline\{/, close: 'brace' }],
  strike: [
    { head: /\\sout\{/, close: 'brace' },
    { head: /~~/, close: { text: '~~' } },
  ],
  // 行内代码：`\code{}` 与反引号两种都认，**包上时用反引号**（短、好敲）
  code: [
    { head: /\\code\{/, close: 'brace' },
    { head: /`/, close: { text: '`' } },
  ],
  link: [
    { head: /\\href\{[^{}]*\}\{/, close: 'brace' },
    { head: /\[/, close: { re: /\]\([^)\n]*\)/ } },
  ],
  fontcolor: [
    { head: /\\textcolor\{[^{}]*\}\{/, close: 'brace', value: /\\textcolor\{([^{}]*)\}\{$/ },
    { head: /\\fontcolor\{[^{}]*\}\{/, close: 'brace', value: /\\fontcolor\{([^{}]*)\}\{$/ },
  ],
  bgcolor: [{ head: /\\colorbox\{[^{}]*\}\{/, close: 'brace', value: /\\colorbox\{([^{}]*)\}\{$/ }],
  fontsize: [{ head: /\\fontsize\{\d+\}\{/, close: 'brace', value: /\\fontsize\{(\d+)\}\{$/ }],
};

// 「开关」语义的（再点一次取消） vs 「赋值」语义的（换值 / 同值才取消）
export const TOGGLE_KEYS = ['bold', 'italic', 'underline', 'strike', 'code', 'link'];
export const STYLED_KEYS = ['fontcolor', 'bgcolor', 'fontsize'];

// `颜色键:none` = 「只去掉这一种样式」，不是「涂成某种颜色」。
// 对应 wangEditor 色板弹出层最上面那一格（`data-value="0"` → `Editor.removeMark`）：
//   文字色面板 →「默认颜色」   背景色面板 →「清除背景色」
// ⚠️ 语义必须与"再挑一次同样的色"完全一致（都只摘这一层），否则同一个结果有两条路径，
// 其中一条会悄悄把旁边的样式也带走。
export const NONE_SUFFIX = ':none';

// 清除格式要覆盖全部样式（含赋值类），但**不含链接** —— 见 clearStyles 的说明
const STYLE_KEYS_ALL = [...TOGGLE_KEYS.filter((k) => k !== 'link'), ...STYLED_KEYS];

// 包上时用什么形状写进源码。
// ⚠️ 命名色优先（`\textcolor{red}{}`），只有用户自己用系统取色器挑的才是 `#rrggbb` ——
// 可读、可改、与网站清洗白名单同口径。
//
// `selectTail` 是"包上之后光标该停在哪"的特例：链接要把 `url` 占位符选中，
// 让用户直接打字覆盖，而不是手写 `url` 再删。
const WRAP = {
  bold: () => ({ head: '\\textbf{', tail: '}' }),
  italic: () => ({ head: '\\textit{', tail: '}' }),
  underline: () => ({ head: '\\underline{', tail: '}' }),
  strike: () => ({ head: '\\sout{', tail: '}' }),
  code: () => ({ head: '`', tail: '`' }),
  link: () => ({ head: '[', tail: '](url)', selectTail: { offset: 2, len: 3 } }),
  fontcolor: (v) => ({ head: `\\textcolor{${v}}{`, tail: '}' }),
  bgcolor: (v) => ({ head: `\\colorbox{${v}}{`, tail: '}' }),
  fontsize: (v) => ({ head: `\\fontsize{${v}}{`, tail: '}' }),
};

// 预编译 at / before 两个正则，避免每次调用都 new RegExp
for (const list of Object.values(STYLE)) {
  for (const m of list) {
    m.atRe = new RegExp('^(?:' + m.head.source + ')');
    m.beforeRe = new RegExp('(?:' + m.head.source + ')$');
    if (m.close.re) m.close.searchRe = new RegExp(m.close.re.source, 'g');
  }
}

// ── 基础工具

// 从 from 开始找配对右括号，返回它的下标；找不到返回 -1。
// `\` 后面一格直接跳过 —— 这样 `\{` `\}` 是字面量，而 `\textcolor{red}{b}` 里的
// `{red}` 会被算成一个完整的组（因为 `\t` 被跳过了，`{` 才计入 depth）。
export function matchBraceClose(text, from) {
  let depth = 1;
  for (let i = from; i < text.length; i++) {
    const c = text[i];
    if (c === '\\') { i++; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

// pos 处这个匹配器的 head 有多长（0 = 不匹配），带 guard 判定
function headAt(text, pos, m) {
  const x = m.atRe.exec(text.slice(pos));
  if (!x) return 0;
  if (m.guard && !m.guard(text, pos)) return 0;
  return x[0].length;
}

// 截止到 cut（不含 cut），这个匹配器的 head 有多长（从 cut 往左看）
function headBefore(text, cut, m) {
  const x = m.beforeRe.exec(text.slice(0, cut));
  if (!x) return 0;
  if (m.guard && !m.guard(text, cut)) return 0;
  return x[0].length;
}

// 紧跟 i 的收尾符号有多长（-1 = 没有）
function closeLenAt(text, i, m) {
  if (m.close === 'brace') return text[i] === '}' ? 1 : -1;
  if (m.close.text) return text.startsWith(m.close.text, i) ? m.close.text.length : -1;
  m.close.searchRe.lastIndex = i;
  const x = m.close.searchRe.exec(text);
  return x && x.index === i ? x[0].length : -1;
}

// 找 contentStart 之后的收尾：{ contentEnd, closeLen }，找不到返回 null
function findClose(text, contentStart, m) {
  if (m.close === 'brace') {
    const j = matchBraceClose(text, contentStart);
    return j < 0 ? null : { contentEnd: j, closeLen: 1 };
  }
  if (m.close.text) {
    const j = text.indexOf(m.close.text, contentStart);
    return j < 0 ? null : { contentEnd: j, closeLen: m.close.text.length };
  }
  m.close.searchRe.lastIndex = contentStart;
  const x = m.close.searchRe.exec(text);
  return x ? { contentEnd: x.index, closeLen: x[0].length } : null;
}

// 跳过 `\命令名`（**只跳名字，不跳它的参数组**）——
// 组里的内容还要继续扫，不然 `\textbf{a \textit{b}}` 里找斜体就找不到了。
function skipCommandName(text, i) {
  const m = /^\\([A-Za-z][A-Za-z0-9]*)/.exec(text.slice(i));
  return m ? i + m[0].length : i + 1;
}

// ── 找"与选区对齐的那一层"

// ① 选区正好等于它的内容 ② 选区正好盖住整层。两种都返回同一套字段。
function alignedLayer(text, s, e, matchers) {
  for (const m of matchers) {
    const hl = headBefore(text, s, m);
    if (!hl) continue;
    const cl = closeLenAt(text, e, m);
    if (cl > 0) {
      return { m, headStart: s - hl, contentStart: s, contentEnd: e, end: e + cl };
    }
  }
  for (const m of matchers) {
    const hl = headAt(text, s, m);
    if (!hl) continue;
    const r = findClose(text, s + hl, m);
    if (r && r.contentEnd + r.closeLen === e) {
      return { m, headStart: s, contentStart: s + hl, contentEnd: r.contentEnd, end: e };
    }
  }
  return null;
}

// ③ 找包住 pos 的那一层。pos 落在头部里时也算包住
// （用户选到了标记本身，此时"取消"比"再套一层"更符合直觉）。
function enclosingLayer(text, pos, matchers) {
  let i = 0;
  while (i <= pos) {
    const m = matchers.find((mm) => headAt(text, i, mm) > 0);
    if (m) {
      const hl = headAt(text, i, m);
      const contentStart = i + hl;
      const r = findClose(text, contentStart, m);
      if (!r) return null;
      const end = r.contentEnd + r.closeLen;
      if (pos <= r.contentEnd || pos < contentStart) {
        return { m, headStart: i, contentStart, contentEnd: r.contentEnd, end };
      }
      if (pos >= end) { i = end; continue; }
    }
    if (text[i] === '\\' && /[A-Za-z]/.test(text[i + 1] || '')) { i = skipCommandName(text, i); continue; }
    i += 1;
  }
  return null;
}

// 把 s 里**完整**的同类包裹全部剥掉（保留内容）。用于"包上之前先防嵌套"。
// 收尾符号必须完整落在 s 之内 —— 落在选区外的标记一律不动，
// 否则会破坏选区之外的内容。
//
// ⚠️ 「半个层」必须**原样保留，连头部标记一起**。
// 早先的写法是"命中了头部但收尾不在选区内 → 跳掉命令名"，结果留下一个孤零零的
// `{`：`甲 \textbf{乙` 被剥成 `甲 {乙`，再包一层就写出 `\textbf{甲 {乙}丙}` ——
// 渲染出**可见的花括号**。这是会把稿子写坏的那类 bug（单测里第一条就盯着它）。
function stripLayers(s, matchers) {
  let out = '';
  let i = 0;
  while (i < s.length) {
    const m = matchers.find((mm) => headAt(s, i, mm) > 0);
    if (m) {
      const hl = headAt(s, i, m);
      const cs = i + hl;
      const r = findClose(s, cs, m);
      if (r && r.contentEnd + r.closeLen <= s.length) {
        out += stripLayers(s.slice(cs, r.contentEnd), matchers);
        i = r.contentEnd + r.closeLen;
        continue;
      }
      out += s.slice(i, cs);     // 头部原样留下，一个字符都不许丢
      i = cs;
      continue;
    }
    if (s[i] === '\\' && /[A-Za-z]/.test(s[i + 1] || '')) { const n = skipCommandName(s, i); out += s.slice(i, n); i = n; continue; }
    out += s[i];
    i += 1;
  }
  return out;
}

// ── 脱标记：源码 → 纯文本 + 偏移对照表
//
// 用途：**渲染态选中**要落回源码上。渲染出的文字里没有标记（`\textbf{粗}` 渲染成
// `<strong>粗</strong>`），所以只能先把源码「脱成纯文本」，再把渲染出的文字对齐到
// 这份纯文本，最后才能把 DOM 选区换算成源码偏移。见 editor/inlineMap.js。
//
// `map[k]` = 第 k 个纯文本字符来自源码的哪个下标。
//
// 渲染端**生成**的文字（`\cite` 的 `[1]`、公式的排版结果、脚注上标）在源码里
// 没有对应字符 —— 这里把整个命令丢掉，让对齐算法把它们标成「无来源」，
// 而不是硬凑一个位置（硬凑会让选区整体偏一格，比放弃更糟）。

// `\cite{1}` / `\eqref{x}` / `\linebreak` / `\footnote{…}` —— 渲染结果与源码文字无关。
// 注意 `\footnote` 正文只留一个上标数字、内容整段挪到文末，所以整组都要跳掉。
// （已实测：`甲 \cite{1} 乙` → `甲 [1?] 乙`；`甲 \linebreak 乙` → `甲 <br> 乙`。）
//
// ⚠️ 命令名与参数组**分开匹配**：早先把 `{` 一起写进正则，`i` 就跳到了 `{` 之后，
// 于是"下一个字符是 `{` 就跳过整组"这一步永远不触发，`\footnote{注}` 会漏出 `注}`。
const GENERATED_CMD = /^\\(?:cite|eqref|ref|footnote|note)\b/;
const LINEBREAK_LEN = '\\linebreak'.length;

// 跳过一个 `{…}` / `[…]` 组（含嵌套），返回组之后的下标
function skipGroup(text, i) {
  const open = text[i];
  const close = open === '{' ? '}' : open === '[' ? ']' : null;
  if (!close) return i;
  let depth = 0;
  for (let j = i; j < text.length; j++) {
    if (text[j] === '\\') { j++; continue; }
    if (text[j] === open) depth++;
    else if (text[j] === close) { depth--; if (depth === 0) return j + 1; }
  }
  return text.length;
}

// 会被"脱掉"的标记：8 种样式 + 链接（链接只留文字，URL 丢掉）。
// ⚠️ 不含 `\cite` 这类 —— 它们走 GENERATED。
// 等于 STYLE 的全部匹配器（`\href{}` / `[]()` 也在这里，链接也要脱成纯文字）。
const PLAIN_MATCHERS = Object.values(STYLE).flat();
const ALL_STYLE_MATCHERS = PLAIN_MATCHERS;

function walkPlain(text, from, to) {
  const plain = [];
  const map = [];
  const emit = (a, b) => { for (let k = a; k < b; k++) { plain.push(text[k]); map.push(k); } };
  let i = from;
  while (i < to) {
    const g = GENERATED_CMD.exec(text.slice(i, to));
    if (g) {
      let j = i + g[0].length;
      while (j < to && (text[j] === ' ' || text[j] === '\t')) j += 1;
      // 参数组也是"生成物"（脚注正文、引用键），一起跳掉
      if (text[j] === '{' || text[j] === '[') j = skipGroup(text, j);
      i = j;
      continue;
    }
    if (text.startsWith('\\linebreak', i)) { i += LINEBREAK_LEN; continue; }
    const m = PLAIN_MATCHERS.find((mm) => headAt(text, i, mm) > 0);
    if (m) {
      const hl = headAt(text, i, m);
      const r = findClose(text, i + hl, m);
      if (r && r.contentEnd + r.closeLen <= to) {
        const sub = walkPlain(text, i + hl, r.contentEnd);
        for (const ch of sub.plain) plain.push(ch);
        for (const at of sub.map) map.push(at);
        i = r.contentEnd + r.closeLen;
        continue;
      }
    }
    // `\` + 标点 = 字面量：只收标点，不收反斜杠（渲染出来也没有那个反斜杠）
    if (text[i] === '\\' && i + 1 < to && !/[A-Za-z]/.test(text[i + 1])) { emit(i + 1, i + 2); i += 2; continue; }
    // `\` + 字母但不是已知命令：跳掉命令名，参数内容照收（里面可能是真文字）
    if (text[i] === '\\' && /[A-Za-z]/.test(text[i + 1] || '')) { i = skipCommandName(text, i); continue; }
    emit(i, i + 1);
    i += 1;
  }
  return { plain, map };
}

// 源码 → { plain, map }。map[k] = 第 k 个纯文本字符的源码下标。
export function stripToPlain(text) {
  const r = walkPlain(text, 0, text.length);
  return { plain: r.plain.join(''), map: r.map };
}

// ── 把选区边界对齐到「层边界」（只给渲染态用）
//
// 源码态下用户看得见标记，选到哪儿就是哪儿，不需要这一层。
// 渲染态下标记是**隐形**的，选区边界很可能正好落在某一层的中间 ——
// 这时直接包一层会出事：新包的头部会跨过原来那一层的收尾，
// 把**没选中的那半截**一起改了。
// 具体例子：`Laup 是 \textbf{超集} 的` 渲染成「Laup 是 **超**集 的」，
// 用户只选了「是 超」，加个红色 → 不处理的话「集」也一起变红。
//
// 规则一条：**每一层要么整个落进选区，要么整个落在外面**（层是最小原子单位）。
// 两步：
//   ① 边界落在某一层的**内容内部** → 在边界处**劈开**这一层
//      （`\textbf{超集}` → `\textbf{超}\textbf{集}`）。
//      劈开**不改变渲染结果**，所以对所有类型都安全，一律做。
//   ② 边界正好卡在层的**内容末尾 / 内容开头** → 把这一层整体纳进来
//      （末尾 → 收尾括进来；开头 → 头部挪进来）。
//      这一步**只对"正在施加的那一种格式"做** ——
//      对别的类型也扩，会把用户没选中的内容卷进来（`\textbf{一整句话很长}` 里
//      选中间几个字加红色，红色就染满整句了）。
//      ② 选"纳进来"而不是"推出去"，是为了和取消语义一致：
//      选区正好等于某一层的内容时，再点一次应当**取消这一层**（posture ②）。
export function alignToLayerBounds(text, start, end, key) {
  const sameType = key && STYLE[key] ? STYLE[key] : null;
  let cur = text;
  let s = Math.max(0, Math.min(start, text.length));
  let e = Math.max(s, Math.min(end, text.length));
  if (s === e) return { text: cur, start: s, end: e };

  for (let guard = 0; guard < 24; guard += 1) {
    // ① 先处理 e（靠后的那个），再处理 s —— 这样前面的偏移不会被后面的插入带跑
    const hE = straddlerAt(cur, e);
    if (hE) {
      cur = cur.slice(0, e)
        + cur.slice(hE.contentEnd, hE.contentEnd + hE.closeLen)
        + cur.slice(hE.headStart, hE.headStart + hE.headLen)
        + cur.slice(e);
      e += hE.closeLen;    // 左半截的收尾紧贴在 e 上，把它纳进选区
      continue;
    }
    const hS = straddlerAt(cur, s);
    if (hS) {
      const ins = hS.headLen + hS.closeLen;
      cur = cur.slice(0, s)
        + cur.slice(hS.contentEnd, hS.contentEnd + hS.closeLen)
        + cur.slice(hS.headStart, hS.headStart + hS.headLen)
        + cur.slice(s);
      // 插入形态是「收尾 + 头部」，所以新区间从**右半截的头部**起（s + 收尾长度）。
      // 与 e 那边的 `+= closeLen` 对称：这样区间要么"正好是层的内容"（头部在左、
      // 收尾在右，触发取消语义），要么"正好是整层"（头尾都在内）——
      // 不会出现"内容 + 收尾"这种既不触发取消、又让 stripLayers 剥不干净的半吊子形态。
      s += hS.closeLen;
      e += ins;
      continue;
    }
    // ② 同类层的两个边界情形
    if (sameType) {
      const lEnd = layerWhere(cur, sameType, (L) => L.contentEnd === e);
      if (lEnd) { e += lEnd.closeLen; continue; }
      const lStart = layerWhere(cur, sameType, (L) => L.contentStart === s);
      if (lStart) { s -= lStart.headLen; continue; }
    }
    break;
  }
  return { text: cur, start: s, end: e };
}

// 按顺序遍历 text 里**最外层**的样式层（进到某一层内部就不再看它的嵌套了），
// `pick` 返回真值就立刻返回那一层的信息。
function layerWhere(text, matchers, pick) {
  let i = 0;
  while (i < text.length) {
    const m = matchers.find((mm) => headAt(text, i, mm) > 0);
    if (m) {
      const hl = headAt(text, i, m);
      const cs = i + hl;
      const r = findClose(text, cs, m);
      if (r) {
        const L = { headStart: i, headLen: hl, contentStart: cs, contentEnd: r.contentEnd, closeLen: r.closeLen };
        const hit = pick(L);
        if (hit) return L;
        i = L.contentEnd + L.closeLen;
        continue;
      }
      i = cs;      // 半个层（没有收尾）：继续往里扫
      continue;
    }
    if (text[i] === '\\' && /[A-Za-z]/.test(text[i + 1] || '')) { i = skipCommandName(text, i); continue; }
    i += 1;
  }
  return null;
}

// pos 是否**严格落在**某一层的内容内部
const straddlerAt = (text, pos) => layerWhere(
  text,
  ALL_STYLE_MATCHERS,
  (L) => pos > L.contentStart && pos < L.contentEnd,
);

const clampRange = (text, start, end) => {
  const s = Math.max(0, Math.min(start, text.length));
  return { s, e: Math.max(s, Math.min(end, text.length)) };
};

// 脱掉整层，选区落在这一层的内容上
function unwrapLayer(text, layer) {
  const content = text.slice(layer.contentStart, layer.contentEnd);
  const next = text.slice(0, layer.headStart) + content + text.slice(layer.end);
  return { text: next, start: layer.headStart, end: layer.headStart + content.length };
}

// 换成新的头部/尾部，选区落在新层的内容上
function replaceLayer(text, layer, head, tail) {
  const content = text.slice(layer.contentStart, layer.contentEnd);
  const next = text.slice(0, layer.headStart) + head + content + tail + text.slice(layer.end);
  const start = layer.headStart + head.length;
  return { text: next, start, end: start + content.length };
}

// ── 行内：开关语义（粗/斜/下划线/删除线/行内码/链接）

export function toggleInline(text, start, end, key) {
  const matchers = STYLE[key];
  const mk = WRAP[key];
  if (!matchers || !mk) return null;
  const { s, e } = clampRange(text, start, end);

  // ①② 选区与某一层对齐 → 脱掉
  const aligned = alignedLayer(text, s, e, matchers);
  if (aligned) return unwrapLayer(text, aligned);

  // ③ 选区在某一层内部 → 脱掉整层
  const inner = enclosingLayer(text, s, matchers);
  if (inner && inner.contentEnd >= e && inner.end <= text.length) return unwrapLayer(text, inner);

  // ④ 包上。先把选区里完整的同类包裹剥掉，免得套娃。
  const selected = stripLayers(text.slice(s, e), matchers);
  const { head, tail, selectTail } = mk();
  const next = text.slice(0, s) + head + selected + tail + text.slice(e);
  const contentStart = s + head.length;
  if (selectTail) {
    return {
      text: next,
      start: contentStart + selected.length + selectTail.offset,
      end: contentStart + selected.length + selectTail.offset + selectTail.len,
    };
  }
  return { text: next, start: contentStart, end: contentStart + selected.length };
}

// ── 行内：赋值语义（文字色 / 背景色 / 字号）
//
// 与开关语义的区别：落在已有那一层里时**先换值**，
// 只有新值和旧值一样才当成"取消"。
// （不然「把红色改成蓝色」会变成「把红色删掉」—— 那是错的。）
export function setStyled(text, start, end, key, arg) {
  const matchers = STYLE[key];
  const mk = WRAP[key];
  if (!matchers || !mk || arg == null) return null;
  const { s, e } = clampRange(text, start, end);
  const want = String(arg);

  const valueOf = (m, cut) => {
    const x = m.value ? m.value.exec(text.slice(0, cut)) : null;
    return x ? x[1] : null;
  };

  const aligned = alignedLayer(text, s, e, matchers);
  if (aligned) {
    if (valueOf(aligned.m, aligned.contentStart) === want) return unwrapLayer(text, aligned);
    const { head, tail } = mk(arg);
    return replaceLayer(text, aligned, head, tail);
  }

  const inner = enclosingLayer(text, s, matchers);
  if (inner && inner.contentEnd >= e && inner.end <= text.length) {
    if (valueOf(inner.m, inner.contentStart) === want) return unwrapLayer(text, inner);
    const { head, tail } = mk(arg);
    return replaceLayer(text, inner, head, tail);
  }

  // 包上（同样先剥掉选区里完整的同类层，否则会叠出两层颜色）
  const selected = stripLayers(text.slice(s, e), matchers);
  const { head, tail } = mk(arg);
  const next = text.slice(0, s) + head + selected + tail + text.slice(e);
  return { text: next, start: s + head.length, end: s + head.length + selected.length };
}

// ── 只去掉**某一种**赋值类样式（「默认文字色」/「清空背景色」）
//
// 与 clearStyles 的区别：clearStyles 是"把这一段的样式全摘掉"，
// 这个是"只把这一种去掉，别的都不许动"。
// 用途：色板里那个"默认色 / 无背景"格子 —— 它是**取消**，不是"涂成某种颜色"。
//
// ⚠️ 用 alignToLayerBounds 先劈开跨界的层，语义才和"再挑一次同样的色"一致：
// 只给选中的那半截去掉颜色，不会把整句的颜色一起摘了。
// 本来就没有这一层 → 原样返回（是"无事发生"，不是错误）。
// 实现要点（踩过的坑，别再退回那一版）：
// **不要**用 alignToLayerBounds + alignedLayer/enclosingLayer 来做这件事。
// 那套工具是为「包一层新格式」写的：它会把**所有**类型的层都劈开（`\textbf{超集}`
// → `\textbf{超}\textbf{集}`），因为"劈开不改变渲染结果"。可边界一落到**嵌套层内部**，
// 劈出来的就是 `\textbf{\textcolor{red}{}}` 这种半拉子 —— 再拿"同类 matcher"去找，
// 找到的根本不是原来那一层。实测：`\textbf{\textcolor{red}{超}\colorbox{yellow}{集}}`
// 上摘文字色，会炸成三段 `\textbf{...}`（3 条单测盯着）。
//
// 所以这里**只认目标类型**的层，逐层按「与选区的交叠」重组：
//   不相交 → 原样留着；相交 → 劈成 前缀(仍着色) + 中段(去色) + 后缀(仍着色)，
//   只有真的还有内容的半边才重新包上（不然会留下 `\textcolor{red}{}` 空壳）。
//
// 「选区重组完跑到哪去了」由**写入过程自己记账**（makeSink 里的 chunks），
// 不再用哨兵字符标位置。
// 为什么换掉哨兵法：切断再重组时，未选中的半边会被重新包上 `head + … + tail`，
// 哨兵正好卡在边界上就会被裹进那一对花括号里 —— 重组完再去 `indexOf` 读回来，
// 下标已经飘了（实测差一位，清完色选区落在 `}` 上，肉眼可见）。
// chunks 记的是"这一截原文搬到新串的哪个位置"，边界落在被摘掉的标记里时
// 自动贴到最近的那一边；递归也就不用再做坐标换算了。

// 写入器：raw 写"重新拼出来的标记"（不记位置），take 搬"原文里的某一截"（记位置）。
function makeSink(text) {
  const chunks = [];
  let out = '';
  return {
    raw(str) { out += str; },
    take(from, to) {
      if (to <= from) return;
      chunks.push({ from, to, out: out.length });
      out += text.slice(from, to);
    },
    // 原文下标 → 新串下标。两个方向要分开问：
    //   mapStart：选区**起头**。下标正好卡在两段之间时取**后**一段的开头
    //             （第一个选中的字符在后一段里）。
    //   mapEnd：选区**收尾**。同一情形取**前**一段的末尾
    //             （最后一个选中的字符在前一段里）。
    // 合成一个函数就必然有一边差一位（`一二\textcolor{red}{三}` 上实测：
    // 合起来时选区会多带出半个 `\textcolor{red}{`）。落在被摘掉的标记里就贴最近的一边。
    mapStart(pos) {
      for (const c of chunks) {
        if (pos < c.from) return c.out;
        if (pos < c.to) return c.out + (pos - c.from);
      }
      return out.length;
    },
    mapEnd(pos) {
      for (const c of chunks) {
        if (pos <= c.to) return Math.max(c.out, c.out + (pos - c.from));
      }
      return out.length;
    },
    text() { return out; },
  };
}

// 收集 [from, to) 里**所有**层（含嵌套），按出现顺序。给 effSel 用。
function collectLayers(text, from, to, matchers, out = []) {
  let i = from;
  while (i < to) {
    const m = matchers.find((mm) => headAt(text, i, mm) > 0);
    if (m) {
      const hl = headAt(text, i, m);
      const cs = i + hl;
      const r = findClose(text, cs, m);
      if (r && r.contentEnd + r.closeLen <= to) {
        out.push({ headStart: i, contentStart: cs, contentEnd: r.contentEnd, end: r.contentEnd + r.closeLen });
        collectLayers(text, cs, r.contentEnd, matchers, out);
        i = r.contentEnd + r.closeLen;
        continue;
      }
      i = cs;
      continue;
    }
    if (text[i] === '\\' && /[A-Za-z]/.test(text[i + 1] || '')) { i = skipCommandName(text, i); continue; }
    i += 1;
  }
  return out;
}

// 目标层的内容 [cs, ce) 里，哪一段算「被选中」。
//
// 初值是与选区 [selLo, selHi) 求交（都是**原文**下标）；然后**把部分重叠的嵌套层整段拉进来**：
// 嵌套层的头和尾不能被劈开，劈了源码立刻坏掉。反例（实测炸过）——
//   `\textcolor{red}{\colorbox{yellow}{超}}` 只选「超」清文字色：
//   不拉进来的话，`\colorbox{yellow}{` 与它的 `}` 会分别落到两个"未选中"段里，
//   各包一层 → `\textcolor{red}{\colorbox{yellow}{}超\textcolor{red}{}` ——
//   黄色底直接没了，而且多出两个空壳。拉进来之后整层一起算选中 → 正确得到
//   `\colorbox{yellow}{超}`（去掉的是红色，黄底留着）。
//
// 目标类型自己的层不参与这一步 —— 劈开它正是这次操作的目的。
// 返回 [lo, hi)，lo >= hi 表示这一层整个不在选区里。
function effSel(text, cs, ce, allM, selLo, selHi) {
  let lo = Math.max(cs, selLo);
  let hi = Math.min(ce, selHi);
  if (lo > hi) { lo = cs; hi = cs; }
  if (allM) {
    for (let guard = 0; guard < 12; guard += 1) {
      let grew = false;
      for (const L of collectLayers(text, cs, ce, allM)) {
        if (!(L.headStart < hi && L.end > lo)) continue;        // 不相交
        if (L.headStart >= lo && L.end <= hi) continue;         // 整个在里面
        lo = Math.min(lo, L.headStart);
        hi = Math.max(hi, L.end);
        grew = true;
      }
      if (!grew) break;
    }
  }
  return [lo, hi];
}

// 重写 text：目标类型的层按「与选区 [lo, hi) 的交叠」切开，
// 选中的那段去色、没选中的那段留着（重新包上头和尾）。
// 全程用**原文下标**（扫描范围 [from, to) 也只是原文的一个窗口）——
// 位置由 sink 记账，递归不用做任何坐标换算。
function clearWalk(text, matchers, allM, lo, hi, sink, from = 0, to = text.length) {
  let i = from;
  while (i < to) {
    const m = matchers.find((mm) => headAt(text, i, mm) > 0);
    if (m) {
      const hl = headAt(text, i, m);
      const cs = i + hl;
      const r = findClose(text, cs, m);
      if (!r) { sink.take(i, cs); i = cs; continue; }            // 半个层：原样留下
      const ce = r.contentEnd;
      const endAll = ce + r.closeLen;
      const head = text.slice(i, cs);
      const tail = text.slice(ce, endAll);
      const [a, b] = effSel(text, cs, ce, allM, lo, hi);
      if (a >= b) {                                              // 整层都不在选区里
        sink.take(i, endAll);
        i = endAll;
        continue;
      }
      let p = cs;
      while (p < ce) {
        const sel = p >= a && p < b;
        let q = p + 1;
        while (q < ce && (q >= a && q < b) === sel) q += 1;
        if (sel) {
          // 这一段整个在选区里 → 把扫描窗口收到这一段再走一遍，里面的同类层一并去掉
          clearWalk(text, matchers, allM, p, q, sink, p, q);
        } else {
          // 没选中的半边：连标记一起留，正好一套 head/tail 包住
          sink.raw(head);
          sink.take(p, q);
          sink.raw(tail);
        }
        p = q;
      }
      i = endAll;
      continue;
    }
    if (text[i] === '\\' && /[A-Za-z]/.test(text[i + 1] || '')) {
      const n = skipCommandName(text, i); sink.take(i, n); i = n; continue;
    }
    sink.take(i, i + 1);
    i += 1;
  }
}

export function clearOneStyle(text, start, end, key) {
  const matchers = STYLE[key];
  if (!matchers) return null;
  const { s, e } = clampRange(text, start, end);
  if (s >= e) return { text, start: s, end: e };

  const sink = makeSink(text);
  clearWalk(text, matchers, PLAIN_MATCHERS, s, e, sink);
  // 去色只动标记、不动字 —— 选中的正文字符在新串里还是连着的那一段，
  // 起止位置直接问记账器要（边界落在被摘掉的标记里时，它会贴到最近的一边）。

  return { text: sink.text(), start: sink.mapStart(s), end: sink.mapEnd(e) };
}

// 这个 key 是不是"行内"动作。`<样式>:none`（去掉这一种样式）也算行内。
// ⚠️ 调用方靠它决定"作用在选区上"还是"作用在整块上"，判错会把整块都改掉。
export function isInlineKey(key) {
  if (!key) return false;
  const base = key.endsWith(NONE_SUFFIX) ? key.slice(0, -NONE_SUFFIX.length) : key;
  return TOGGLE_KEYS.includes(base) || STYLED_KEYS.includes(base);
}

// ── 清除格式
//
// 只摘「样式类」标记：粗/斜/下划线/删除线/行内码/颜色/字号，以及 md 的 `**` `*` `~~` 反引号。
// **不动链接、公式、引用锚点、脚注** —— 那些承载的是信息而不是样式，
// 顺手删掉等于丢内容（链接的 URL 会没）。
//
// 先"向外扩"：紧贴选区的样式层整层展开，然后剥掉。
// 这样选中 `\textbf{Laup}` 里的 `Laup` 再点清除，也会把外层那圈粗体摘掉 ——
// 符合"我要这段文字恢复常态"的直觉。
export function clearStyles(text, start, end) {
  const matchers = STYLE_KEYS_ALL.flatMap((k) => STYLE[k]);
  let { s, e } = clampRange(text, start, end);

  for (let guard = 0; guard < 20; guard++) {
    let grew = false;
    for (const m of matchers) {
      const hl = headBefore(text, s, m);
      if (!hl) continue;
      const cl = closeLenAt(text, e, m);
      if (cl < 0) continue;
      s -= hl;
      e += cl;
      grew = true;
      break;
    }
    if (!grew) break;
  }
  const stripped = stripLayers(text.slice(s, e), matchers);
  return { text: text.slice(0, s) + stripped + text.slice(e), start: s, end: s + stripped.length };
}

// ── 块级：行前缀

// 选区涉及哪些整行（字符偏移范围）
export function lineSpan(text, start, end) {
  const from = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
  const nl = text.indexOf('\n', end);
  return { from, to: nl < 0 ? text.length : nl };
}

// 行前缀。正则带一个捕获组 `(\s*)` —— **去掉时要把缩进留着**，
// 否则 `  - 甲` 一点就变成 `甲`，缩进层次被抹平。
const LINE_MARKS = {
  ul: { re: /^(\s*)- (?!\[[ xX]\]\s)/, add: '- ' },
  ol: { re: /^(\s*)\d+[.)] /, add: '1. ' },
  todo: { re: /^(\s*)- \[[ xX]\] /, add: '- [ ] ' },
  quote: { re: /^(\s*)> /, add: '> ' },
};

// 三种列表前缀**互斥**：一行不可能同时是无序、有序和待办。
// 加新前缀前先把另外两种剥掉 —— `- [ ] 甲` 点「无序列表」应该变成 `- 甲`，
// 而不是变成 `- - [ ] 甲`。
const LIST_KINDS = ['ul', 'ol', 'todo'];

export const LINE_KEYS = Object.keys(LINE_MARKS);

// 行前缀的 toggle：**所有**非空行都已经有该前缀 → 去掉；否则全部加上。
// 空行原样保留（不然会在块中间造出空行，反而把块切开）。
// ⚠️ `ul` 的正则有 `(?!\[[ xX]\]\s)` 负向断言 —— 待办行不算"已有无序前缀"。
export function toggleLinePrefix(text, start, end, key) {
  const spec = LINE_MARKS[key];
  if (!spec) return null;
  const { from, to } = lineSpan(text, start, end);
  const lines = text.slice(from, to).split('\n');
  const real = lines.filter((l) => l.trim() !== '');
  if (!real.length) return null;
  const all = real.every((l) => spec.re.test(l));

  const next = lines.map((l) => {
    if (l.trim() === '') return l;
    if (all) return l.replace(spec.re, '$1');       // 去掉，缩进留下
    let base = l;
    if (LIST_KINDS.includes(key)) {
      for (const k of LIST_KINDS) if (k !== key) base = base.replace(LINE_MARKS[k].re, '$1');
    }
    return base.replace(/^(\s*)/, '$1' + spec.add);
  });

  const span = next.join('\n');
  return { text: text.slice(0, from) + span + text.slice(to), start: from, end: from + span.length };
}

// 标题级别 toggle：`# ` / `## ` / `### `（0 = 恢复成正文）
export function toggleHeading(text, start, end, level) {
  const { from, to } = lineSpan(text, start, end);
  const lines = text.slice(from, to).split('\n');
  const cur = (() => {
    const l = lines.find((x) => x.trim() !== '');
    const m = l ? /^\s*(#{1,6})\s+/.exec(l) : null;
    return m ? m[1].length : 0;
  })();
  const body = lines.map((l) => (l.trim() === '' ? l : l.replace(/^\s*#{1,6}\s+/, '')));
  const target = cur === level ? 0 : level;
  const mark = target ? '#'.repeat(target) + ' ' : '';
  const next = body.map((l) => (l.trim() === '' ? l : mark + l));
  const span = next.join('\n');
  return { text: text.slice(0, from) + span + text.slice(to), start: from, end: from + span.length };
}

// 行间代码：把选区就地包成围栏块。
//
// ⚠️ 这里**不需要补空行**：围栏 ``` 本身命中 matchFence，属于"块开头"，
// 所以 `前文。\n```\ncode\n```\n后文。` 会自然裂成 3 块（已实测）。
// 只在选区没有贴住行首/行尾时补一个换行，让围栏落在行首。
export function toggleCodeBlock(text, start, end) {
  const { s, e } = clampRange(text, start, end);
  const before = text.slice(0, s);
  const after = text.slice(e);

  // 已经正好被围栏包住 → 脱掉。只摘围栏那一行，**两侧的换行留着**，
  // 否则 `前面\n```\ncode\n```\n后面` 会粘成 `前面code后面`。
  const openFence = /(^|\n)[ \t]*```[^\n]*\n$/.exec(before);
  const closeFence = /^\n[ \t]*```[ \t]*/.exec(after);
  if (openFence && closeFence) {
    const fenceLineLen = openFence[0].length - (openFence[1] ? 1 : 0);
    const cutStart = s - fenceLineLen;
    const body = text.slice(s, e);
    return {
      text: text.slice(0, cutStart) + body + after.slice(closeFence[0].length),
      start: cutStart,
      end: cutStart + body.length,
    };
  }

  const pre = s > 0 && text[s - 1] !== '\n' ? '\n' : '';
  const post = e < text.length && text[e] !== '\n' ? '\n' : '';
  const head = pre + '```\n';
  const body = text.slice(s, e);
  const next = before + head + body + '\n```' + post + after;
  const contentStart = s + head.length;
  return { text: next, start: contentStart, end: contentStart + body.length };
}

// 段内可见换行：`\linebreak` 渲染成 `<br>`。
// 这是 Laup **本来就有**的能力（不新增语法），只是以前没接到按钮上。
export function insertLinebreak(text, start, end) {
  const { e } = clampRange(text, start, end);
  const next = text.slice(0, e) + '\\linebreak' + text.slice(e);
  const at = e + '\\linebreak'.length;
  return { text: next, start: at, end: at };
}

// ── 入口：按 key 分派
//
// key 的两种后缀写法：
//   `heading:3`      → 带参数的块级动作（标题级别）
//   `fontcolor:none` → 「去掉这一种样式」（色板里的"默认色 / 无背景"）
export function applyFormat(text, start, end, key, arg) {
  if (!key) return null;
  if (key === 'clear') return clearStyles(text, start, end);
  if (key === 'codeblock') return toggleCodeBlock(text, start, end);
  if (key === 'linebreak') return insertLinebreak(text, start, end);
  if (key.endsWith(NONE_SUFFIX)) {
    const base = key.slice(0, -NONE_SUFFIX.length);
    return STYLED_KEYS.includes(base) ? clearOneStyle(text, start, end, base) : null;
  }
  if (key.startsWith('heading:')) return toggleHeading(text, start, end, Number(key.split(':')[1]) || 0);
  if (LINE_KEYS.includes(key)) return toggleLinePrefix(text, start, end, key);
  if (STYLED_KEYS.includes(key)) return setStyled(text, start, end, key, arg);
  if (TOGGLE_KEYS.includes(key)) return toggleInline(text, start, end, key);
  return null;
}
