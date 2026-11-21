// Lifeseqence —— 生命时序的 [lifetree] 格：缩进文本 → 分类树。
//
// ── 定位
//   走 Laup 内核的**扩展接口**（defineExtension 的 fenceLangs 挂载点），
//   文档里用 `​```lifetree` 围栏书写，宿主层（Notebook / 站点）把 [lifetree] 格
//   序列化成这个围栏。核心不知道这棵树的存在。
//
// ── 装法
//     import { lifesequence, PACK_NAME } from 'laup/extensions/lifetree.js';
//     defineExtension(lifesequence());
//
// ── 源语法（v1）
//   每行一个节点，每级缩进两个空格；父子由缩进决定，同级顺序即显示顺序。
//   `/` 是真实的匿名分化点，有自己的身份（可带参数：时间、文献、备注、图片）；
//   图上只画分叉，默认不显示 `/` 本身。
//   命名行：
//     人属 Homo Linnaeus, 1758                       一名法（中文名 拉丁名 命名人, 年代）
//     †智人 Homo sapiens Linnaeus, 1758              二名法（属名可缩写 H. sapiens）
//     中文名 ！null                                   中文名缺席写 ！null
//   行尾 [ ] 接参数：`[生存=68-66 文献="Nature 2025"]`
//   生存 = 时间区间「老端-新端」或单值（68-66 / 68 / 裸值 [68-66]；旧写法 [时间=…] 等价）。
//          时序图：区间画棕色色带、单值画圆点、给了值的节点都有标记。
//   分化 = 内节点分化时间（一般不填；缺省自动估计 = 子树内最老证据）。
//   全局配置行（块首第一行、顶格）：`[lifetree 时序]` 或
//     `[样式=时序 配色=单色|分支 刻度=50 网格=开|关 轴=开|关 年代带=开|关 比例=线性|根号]`
//     写了 时序 才进时序图渲染，缺省还是缩进列表。
//   var：`var 人属 Homo Linnaeus, 1758` 定义一个可复用的子树，
//        比它深一级缩进的行是它的孩子；正文用 {{人属}} 或 {{人属 Homo Linnaeus, 1758}}
//        引用，展开按格子顺序拼接。var 定义本身不渲染。
//
// ── 诊断（编辑期就能看见）
//   Tab 与空格混用、缩进不是 2 的倍数、跳级（一次多缩进超过一级）、
//   一块多个根 / 没有根、末尾没有后代的 `/`、var 重复定义、引用未定义的 var。
//   结构性错误（缩进类、多根）在 build 期抛 LaupError（发布路径当场炸）；
//   语义提示（未被引用的 var 等）走 ctx.warn。

import { esc } from '../core/escape.js';
import { LaupError } from '../core/diag.js';
import { renderChrono } from '../../utils/lifeTreeChrono.js';
import {
  CHRONO_GLOBAL_DEFAULTS, CHRONO_GLOBAL_KEYS, CHRONO_LOCAL_KEYS, chronoStyleOptions,
} from '../../utils/lifeTreeChronoStyle.js';

export const PACK_NAME = 'Lifeseqence';
export const LIFETREE_LANG = 'lifetree';
export const LIFETREE_ATTR = 'data-life-tree';

// ── 参数键（行尾 [ ] 与表单共用这一份清单）
//   生存 = 时间区间「老端-新端」或单值（如 68-66 / 68），时序图配色带/圆点用；
//          旧写法 [时间=…] 与裸值 [68-66] 都等价成 生存（时间 ≡ 生存）。
//   分化 = 内节点的分化时间（一般不填，缺省自动估计：子树内最老证据）。
export const PARAM_KEYS = [
  '拉丁名', '阶元', '作者', '年份', '时间', '生存', '分化', '文献', '备注', '图片',
  ...CHRONO_LOCAL_KEYS,
];

// 行内参数键值对：key=value（value 可带引号），逗号或空格分隔
const PARAMS_RE = /\[([^\[\]]*)\]\s*$/;
const PARAM_PAIR_RE = /([^\s=,，]+)\s*=\s*("([^"]*)"|'([^']*)'|[^\s,，]*)/g;

// 命名人 + 年代：`, 1997` / `, 1758` 收尾
const AUTHORITY_RE = /^(.*?)[,，]\s*(\d{4})\s*$/;

function isCJK(ch) {
  return /[\u2E80-\u9FFF\uF900-\uFAFF\u{20000}-\u{2FA1F}]/u.test(ch);
}

function hasCJK(s) {
  return /[\u2E80-\u9FFF\uF900-\uFAFF\u{20000}-\u{2FA1F}]/u.test(s);
}

/** 行尾 [ ] 参数段 → { attrs, rest }。解析不动的键原样保留为字符串。 */
function splitParams(text) {
  const attrs = {};
  let rest = text;
  let matched = false;
  // 从右往左剥**所有**尾部 [...] 组：`[生存=220][]` 这种尾巴（表单回填残留）
  // 不再把参数吞进命名人字段；`[68-66]` 裸值等价成 生存；`[时间=x]` 别名成 生存。
  for (;;) {
    const m = PARAMS_RE.exec(rest);
    if (!m) break;
    const inner = m[1].trim();
    if (!inner) {
      // 空组 `[]`：无害尾巴，剥掉继续往左看
      matched = true;
      rest = rest.slice(0, m.index).trim();
      continue;
    }
    let any = false;
    if (inner && !inner.includes('=')) {
      // 裸值：[68-66] / [68] → 生存
      attrs['生存'] = inner;
      any = true;
    } else {
      for (const pair of inner.matchAll(PARAM_PAIR_RE)) {
        let key = pair[1];
        const value = pair[3] ?? pair[4] ?? pair[2];
        if (key === '时间') {
          // 时间 ≡ 生存：旧写法兼容，两个键都留（旧读者还在读 attrs.时间）
          if (!PARAM_KEYS.includes('时间')) continue;
          attrs['时间'] = value;
          attrs['生存'] = attrs['生存'] ?? value;
          any = true;
          continue;
        }
        if (!PARAM_KEYS.includes(key)) continue;
        attrs[key] = value;
        any = true;
      }
    }
    if (!any) break; // 一个认识的键都没有 → 不是参数段，按字面量处理
    matched = true;
    rest = rest.slice(0, m.index).trim();
  }
  if (!matched) return { attrs: null, rest: text };
  return { attrs, rest };
}

// ── 全局配置行（块首）：`[lifetree 时序]` / `[样式=时序 配色=分支 刻度=50 …]`
//   只认第一行（且顶格）。写了 `时序` 才进时序图渲染，缺省还是缩进列表。
const GLOBAL_KEYS = CHRONO_GLOBAL_KEYS;
const CHRONO_DEFAULTS = CHRONO_GLOBAL_DEFAULTS;

function parseChronoConfig(content, lineNo, diags) {
  const cfg = { ...CHRONO_DEFAULTS };
  for (const tok of content.slice(1, -1).split(/[\s,，]+/).filter(Boolean)) {
    const eq = tok.indexOf('=');
    if (eq > 0) {
      const key = tok.slice(0, eq);
      const val = tok.slice(eq + 1);
      if (!GLOBAL_KEYS.includes(key)) {
        diags.push({ line: lineNo, level: 'warn', message: `全局行忽略未知参数 ${key}（可用：${GLOBAL_KEYS.join('/')}）` });
        continue;
      }
      if (key === '刻度') {
        const n = Number(val);
        cfg[key] = Number.isFinite(n) && n > 0 ? n : 50;
      } else {
        cfg[key] = val;
      }
    } else if (tok === '时序' || tok === 'lifetree') {
      cfg['样式'] = '时序';
    } else if (tok === '列表') {
      cfg['样式'] = '列表';
    } else {
      diags.push({ line: lineNo, level: 'warn', message: `全局行忽略未知记号 ${tok}（写 时序/列表 或 键=值）` });
    }
  }
  return cfg;
}

/**
 * 命名行 → 分类单元字段。认不出的行返回 null（调用方决定报错还是当纯文本）。
 * 形态：†?中文名 拉丁名 [种名] [命名人[, 年代]]
 */
export function parseTaxonLine(text) {
  const { attrs, rest } = splitParams(text);
  let body = rest;
  const extinct = /^[††]/.test(body);
  body = body.replace(/^[††]\s*/, '');

  // 中文名：首个含 CJK 的连续片段（或 ！null / !null 占位）
  let zh = null;
  let latinPart = body;
  const zhM = /^(\S+)\s+(.*)$/.exec(body);
  if (zhM && (hasCJK(zhM[1]) || /^[!！]null$/i.test(zhM[1]))) {
    zh = /^[!！]null$/i.test(zhM[1]) ? null : zhM[1];
    latinPart = zhM[2];
  } else if (!zhM && hasCJK(body)) {
    // 整行只有中文名（无拉丁）→ 容忍，拉丁空
    zh = body;
    latinPart = '';
  }

  // 命名人 + 年代：以 `, 年份` 收尾的部分切出去
  let author = '';
  let year = null;
  const authM = AUTHORITY_RE.exec(latinPart);
  if (authM) {
    latinPart = authM[1].trim();
    year = Number(authM[2]);
  }

  // 拉丁名 vs 命名人：拉丁是 1–2 个词（属名大写或缩写 H.，种名全小写），剩下的是命名人
  let latin = latinPart.trim();
  if (latin) {
    const toks = latin.split(/\s+/);
    // 命名人从第一个「大写开头且前一个词已经是完整拉丁名」的位置切开。
    // 判据：种名只可能是全小写词；一旦遇到大写词，其后全是命名人。
    const isSpeciesTok = (t) => /^[a-z][a-z-]*$/.test(t)
      // 命名人里的连接词不是种加词（von Huene / de Blainville / et al.）
      && !['von', 'van', 'de', 'der', 'den', 'del', 'la', 'le', 'di', 'da', 'et', 'al', 'and'].includes(t);
    const isGenusTok = (t) => /^[A-Z][a-z]*\.?$/.test(t) || /^[A-Z]\.$/.test(t);
    let binomEnd = 0;
    if (toks.length && isGenusTok(toks[0])) {
      binomEnd = 1;
      if (toks.length > 1 && isSpeciesTok(toks[1])) binomEnd = 2;
      // 属名缩写（H.）后面必须跟种名才算二名法：`H. sapiens`
      if (binomEnd === 1 && /^\w\.$/.test(toks[0])) binomEnd = 0;
    }
    if (binomEnd > 0 && binomEnd < toks.length) {
      author = toks.slice(binomEnd).join(' ');
      latin = toks.slice(0, binomEnd).join(' ');
    }
  }

  if (!zh && !latin) return null;
  const genus = latin.split(/\s+/)[0] || '';
  const species = latin.split(/\s+/).slice(1).join(' ') || null;
  return {
    kind: 'taxon',
    extinct,
    zh, // null = 中文名 ！null
    latin: latin || null,
    genus: genus || null,
    species,
    author: author || (attrs?.作者 ?? '') || '',
    year: year ?? (attrs?.年份 != null && /^\d{4}$/.test(attrs.年份) ? Number(attrs.年份) : null),
    attrs: attrs || {},
    paramLatin: attrs?.拉丁名 || null, // 参数段给的拉丁名优先级最高（表单回填用）
  };
}

// ── 缩进测量：Tab 与空格混用直接报错
function measureIndent(line, lineNo) {
  const m = /^([ \t]*)/.exec(line)[1];
  if (m.includes('\t') && m.includes(' ')) {
    throw new LaupError(`第 ${lineNo} 行缩进 Tab 与空格混用`, lineNo, '每级缩进两个空格，别混 Tab');
  }
  if (m.includes('\t')) {
    throw new LaupError(`第 ${lineNo} 行用 Tab 缩进`, lineNo, '每级缩进两个空格，不用 Tab');
  }
  if (m.length % 2 !== 0) {
    throw new LaupError(`第 ${lineNo} 行缩进 ${m.length} 个空格，不是 2 的倍数`, lineNo, '每级缩进两个空格');
  }
  return m.length / 2;
}

// var 行：`var 名 [拉丁…[, 命名人, 年代]]` —— 名必须是首个词
const VAR_RE = /^var\s+(\S+)\s*(.*)$/;

function parseLine(content, lineNo) {
  const ref = /^{{\s*(.+?)\s*}}$/.exec(content);
  if (ref) {
    const inner = ref[1];
    const nameM = /^(\S+)\s*(.*)$/.exec(inner);
    return { kind: 'var-ref', name: nameM[1], override: nameM[2] ? parseTaxonLine(nameM[2]) : null, line: lineNo };
  }
  if (/^\/\s*$/.test(content)) {
    const { attrs } = splitParams(content);
    return { kind: 'diverge', attrs: attrs || {}, line: lineNo };
  }
  if (content.startsWith('/')) {
    const { attrs } = splitParams(content.slice(1).trim());
    return { kind: 'diverge', attrs: attrs || {}, line: lineNo };
  }
  const taxon = parseTaxonLine(content);
  if (!taxon) {
    throw new LaupError(
      `第 ${lineNo} 行认不出节点："${content.slice(0, 40)}"`,
      lineNo,
      '写「中文名 拉丁名 命名人, 年代」、`/`（匿名分化点）或 {{var名}}',
    );
  }
  taxon.line = lineNo;
  return taxon;
}

// ── 解析整块：行 → 原始森林（var 定义挂一边）→ var 展开 → 单根树
/**
 * @returns {{ tree: object|null, vars: Map<string,object>, diags: Array, rawRoots: object[] }}
 */
export function parseLifetree(source) {
  const lines = String(source ?? '').replace(/\r\n?/g, '\n').split('\n');
  const vars = new Map(); // 名 → 定义节点（含 children）
  const diags = [];
  const stack = []; // { depth, node }
  let root = null;
  let rootLine = null;
  // var 定义的子行：挂在最近的 var 定义下（缩进比 var 行深），直到缩进回退
  let varCtx = null; // { depth, def }
  let cfg = null;      // 块首全局配置行（[lifetree 时序] 等），无则 null
  let sawNode = false; // 配置行只认第一行

  const attach = (depth, node) => {
    if (varCtx && depth > varCtx.depth) {
      // var 定义的孩子：跳级同样要拦
      const last = varCtx.lastDepth ?? varCtx.depth;
      if (depth > last + 1) {
        throw new LaupError(`第 ${node.line} 行相对上一行跳级缩进`, node.line, '每级只允许缩进 2 个空格');
      }
      varCtx.def.children.push(node);
      varCtx.lastDepth = depth;
      return;
    }
    varCtx = null;
    if (depth === 0) {
      if (root) {
        throw new LaupError(
          `第 ${node.line} 行是第二个根（第 ${rootLine} 行已经有一个根）`,
          node.line,
          '一块 lifetree 只允许一个根；多棵树拆成多个格',
        );
      }
      root = node;
      rootLine = node.line;
      stack.length = 0;
      stack.push({ depth: 0, node });
      return;
    }
    while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
    if (!stack.length) {
      throw new LaupError(`第 ${node.line} 行缩进找不到父节点`, node.line, '根必须顶格写');
    }
    const parent = stack[stack.length - 1].node;
    if (depth > parent.depthRaw + 1) {
      throw new LaupError(
        `第 ${node.line} 行相对上一行跳级缩进`,
        node.line,
        '每级只允许缩进 2 个空格',
      );
    }
    parent.children.push(node);
    stack.push({ depth, node });
  };

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const raw = lines[i];
    if (!raw.trim()) continue;
    if (/^[ \t]*import\s+(?:Lifeseqence|["'][^"']+["'])\s*$/.test(raw)) continue; // 特性开关行
    const depth = measureIndent(raw, lineNo);
    const content = raw.trim();

    // ── 全局配置行：块首第一行、顶格、整行就是一个 [...]（树节点没这个形态，不冲突）
    if (!sawNode && depth === 0 && /^\[[^[\]]*\]$/.test(content)) {
      cfg = parseChronoConfig(content, lineNo, diags);
      continue;
    }
    sawNode = true;

    const varM = VAR_RE.exec(content);
    // var 行判定：`var 名 …`。同一缩进（或回退到更浅）的连续 var 行都是新定义；
    // 比 varCtx 更深的行是上一个 var 的孩子，不抢。
    if (varM && (varCtx === null || depth <= varCtx.depth)) {
      const name = varM[1];
      const taxon = varM[2] ? parseTaxonLine(varM[2]) : null;
      // var 名本身就是中文显示名（`var 人属 Homo …` 里的「人属」）
      if (taxon && !taxon.zh) taxon.zh = name;
      const def = {
        kind: 'taxon',
        line: lineNo,
        isVarDef: true,
        varName: name,
        children: [],
        ...(taxon || { kind: 'taxon', zh: name, latin: null, extinct: false, author: '', year: null, attrs: {} }),
      };
      if (vars.has(name)) {
        throw new LaupError(`第 ${lineNo} 行重复定义 var ${name}（第 ${vars.get(name).line} 行已定义）`, lineNo);
      }
      vars.set(name, def);
      varCtx = { depth, def, lastDepth: depth };
      continue;
    }

    const node = parseLine(content, lineNo);
    node.depthRaw = depth;
    node.children = node.children || [];
    attach(depth, node);
  }

  // ── var 展开（按定义顺序；引用处拼接定义的孩子，引用行自己的孩子排在后面）
  const usedVars = new Set();
  const expand = (node) => {
    if (node.kind === 'var-ref') {
      const def = vars.get(node.name);
      if (!def) {
        throw new LaupError(
          `第 ${node.line} 行引用了未定义的 var ${node.name}`,
          node.line,
          '先用 `var 名 …` 定义，再 {{名}} 引用',
        );
      }
      usedVars.add(node.name);
      const clone = JSON.parse(JSON.stringify(def));
      clone.isVarDef = false;
      clone.varRefLine = node.line;
      clone.varName = node.name;
      if (node.override) {
        // {{人属 Homo Linnaeus, 1758}}：引用处重写的字段优先
        Object.assign(clone, {
          latin: node.override.latin || clone.latin,
          genus: node.override.genus || clone.genus,
          species: node.override.species ?? clone.species,
          author: node.override.author || clone.author,
          year: node.override.year ?? clone.year,
          extinct: node.override.extinct || clone.extinct,
          attrs: { ...clone.attrs, ...node.override.attrs },
        });
      }
      clone.children = clone.children.map(expand);
      if (node.children?.length) clone.children.push(...node.children.map(expand));
      return clone;
    }
    node.children = (node.children || []).map(expand);
    return node;
  };

  // var 定义块不占树的位置：attach 没把它们挂进 root，这里只需要展开 root。
  if (root) expand(root);

  // ── 语义检查
  const walk = (node, fn, parent) => {
    fn(node, parent);
    for (const c of node.children || []) walk(c, fn, node);
  };
  if (root) {
    walk(root, (n) => {
      if (n.kind === 'diverge' && !(n.children || []).length) {
        throw new LaupError(
          `第 ${n.line} 行的匿名分化点 / 没有后代`,
          n.line,
          '没有后代的 / 没有意义，删掉它或直接写分类单元',
        );
      }
      // 分化时间只对非叶子有效（有后代才需要分化时刻）
      if (n.attrs?.时间 != null && !(n.children || []).length && n.kind === 'diverge') {
        diags.push({ line: n.line, level: 'warn', message: `第 ${n.line} 行的 / 是叶子，分化时间不会显示` });
      }
    });
  }
  // 孤立 var：定义了却没被任何 {{}} 引用（有没有根都提醒 —— var 写了不用多半是笔误）
  const orphanVars = [...vars.values()].filter((d) => !usedVars.has(d.varName));
  for (const d of orphanVars) {
    diags.push({
      line: d.line,
      level: 'warn',
      message: `var ${d.varName}（第 ${d.line} 行定义）没有被任何 {{}} 引用`,
    });
  }

  return { tree: root, vars, diags, rawRoots: root ? [root] : [], cfg };
}

// ── 渲染

function rowHtml(n) {
  if (n.kind === 'diverge') {
    // 默认不显示 / 本身：marker 交给 CSS（.lt-marker 是透明的，悬停/勾选时显形）
    const bits = [];
    if (n.attrs?.时间 != null) bits.push(`<span class="lt-time">${esc(n.attrs.时间)}</span>`);
    if (n.attrs?.文献) bits.push(`<span class="lt-ref" title="${esc(n.attrs.文献)}">献</span>`);
    if (n.attrs?.备注) bits.push(`<span class="lt-note" title="${esc(n.attrs.备注)}">注</span>`);
    if (n.attrs?.图片) bits.push(`<span class="lt-img" title="${esc(n.attrs.图片)}">图</span>`);
    return `<div class="lt-row lt-row-diverge"><span class="lt-marker">/</span>${bits.join('')}</div>`;
  }
  const zh = n.zh ? `<span class="lt-zh">${esc(n.zh)}</span>` : '';
  const mark = n.extinct ? '<span class="lt-extinct">†</span>' : '';
  let latin = '';
  if (n.latin) {
    const genus = `<span class="lt-genus">${esc(n.genus)}</span>`;
    const species = n.species ? ` <span class="lt-species">${esc(n.species)}</span>` : '';
    latin = `<em class="lt-latin">${genus}${species}</em>`;
  }
  const auth = n.author
    ? `<span class="lt-author">${esc(n.author)}${n.year != null ? `, ${n.year}` : ''}</span>`
    : n.year != null ? `<span class="lt-author">${n.year}</span>` : '';
  const chips = [];
  if (n.attrs?.阶元) chips.push(`<span class="lt-chip">${esc(n.attrs.阶元)}</span>`);
  if (n.attrs?.时间 != null) chips.push(`<span class="lt-time">${esc(n.attrs.时间)}</span>`);
  if (n.attrs?.文献) chips.push(`<span class="lt-ref" title="${esc(n.attrs.文献)}">献</span>`);
  if (n.attrs?.备注) chips.push(`<span class="lt-note" title="${esc(n.attrs.备注)}">注</span>`);
  if (n.attrs?.图片) chips.push(`<span class="lt-img" title="${esc(n.attrs.图片)}">图</span>`);
  return `<div class="lt-row">${mark}${zh}${latin}${auth}${chips.join('')}</div>`;
}

function nodeHtml(n) {
  const kids = (n.children || []);
  const cls = n.kind === 'diverge' ? ' lt-node-diverge' : '';
  return `<li class="lt-node${cls}" data-line="${n.line}">`
    + rowHtml(n)
    + (kids.length ? `<ul class="lt-branch">${kids.map(nodeHtml).join('')}</ul>` : '')
    + '</li>';
}

/** 解析好的树 → HTML（浅色分叉线由 CSS 画，源码复制时不带走任何装饰）。 */
export function renderLifetreeHtml(tree) {
  if (!tree) return '';
  return `<div class="life-tree" ${LIFETREE_ATTR}="1"><ul class="lt-branch">${nodeHtml(tree)}</ul></div>`;
}

/** 解析好的树 → 纯文本（每行一个节点，按缩进还原）——导出/降级用。 */
export function renderLifetreeText(tree) {
  const out = [];
  const walk = (n, depth) => {
    const pad = '  '.repeat(depth);
    if (n.kind === 'diverge') out.push(`${pad}/`);
    else {
      const mark = n.extinct ? '†' : '';
      const zh = n.zh ?? '!null';
      out.push(`${pad}${mark}${[zh, n.latin, n.author].filter(Boolean).join(' ')}${n.year != null ? `, ${n.year}` : ''}`);
    }
    for (const c of n.children || []) walk(c, depth + 1);
  };
  if (tree) walk(tree, 0);
  return out.join('\n');
}

/**
 * 浅色分叉线的**字符版**（编辑器 gutter / 纯文本环境用）：
 * 按原始行号给出 │、├─、└─ 前缀。var 定义行不进表（不参与树形）。
 */
export function branchPrefixes(tree) {
  const map = new Map(); // line → prefix
  const walk = (nodes, base) => {
    nodes.forEach((n, i) => {
      const last = i === nodes.length - 1;
      const arm = last ? '└─ ' : '├─ ';
      if (!map.has(n.line)) map.set(n.line, base + arm);
      walk(n.children || [], base + (last ? '   ' : '│  '));
    });
  };
  if (tree) walk([tree], '');
  return map;
}

// ── 扩展包
export function lifesequence() {
  return {
    name: PACK_NAME,
    blockTypes: ['LifeTree'],
    fenceLangs: {
      [LIFETREE_LANG]: (text, at) => {
        // build 期解析：结构性错误当场抛（行号带上围栏偏移）
        const parsed = parseLifetree(text);
        return { type: 'LifeTree', tree: parsed.tree, diags: parsed.diags, base: at || 0, chrono: parsed.cfg };
      },
    },
    // 时序图是自包含 SVG：产物标签与属性在这里登记（auditHtml 只认登记过的）
    whitelist: {
      attrs: [
        LIFETREE_ATTR, 'data-line',
        // ⚠️ auditHtml 比对属性名时会 toLowerCase，驼峰属性必须登记小写形状
        'viewbox',
        'xmlns', 'width', 'height', 'role', 'class',
        'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx',
        'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-dasharray',
        'stroke-linejoin', 'paint-order', 'opacity',
        'font-size', 'font-weight', 'font-style', 'font-family', 'text-anchor',
      ],
      tags: ['svg', 'g', 'line', 'rect', 'circle', 'text', 'tspan', 'title'],
    },
    renderBlock(n, ctx) {
      for (const d of n.diags || []) {
        ctx.warn(d.message);
      }
      if (n.chrono?.样式 === '时序') {
        const { svg, diags } = renderChrono(n.tree, chronoStyleOptions(n.chrono));
        for (const d of diags) ctx.warn(d.message);
        return svg;
      }
      return renderLifetreeHtml(n.tree);
    },
    snippets: {
      lifetree: [
        '人属 Homo Linnaeus, 1758',
        `  †先驱人 H. antecessor Bermudez de Castro et al., 1997`,
        '  智人 H. sapiens Linnaeus, 1758',
      ].join('\n'),
    },
  };
}
