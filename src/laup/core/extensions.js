// Laup 扩展点 —— 核心只认通用语法，站点自己的元素由宿主装进来。
//
// ── 为什么要有这一层
//   Laup 是"写文档的工具"，不是"某个网站的前端"。它自带的那套语法（md 的形状 +
//   标题/列表/表格/公式/脚注/目录/…）对任何文档都成立。但总有一些元素只对**某一个站点**
//   成立：某个站点要嵌自己的研究树、要渲染自家的代码样例卡片、要用自家已有的锚点前缀。
//
//   这类东西一旦写进核心渲染器，核心就不再通用了 —— 它开始知道某个站点的路由
//   （`/life-tree/:id`）、某个站点的 class 名，甚至反过来让站点的清洗白名单决定核心的标签表。
//   那不是"Laup 支持某个网站"，那是"Laup 变成那个网站的一个零件"。
//
//   所以本文件只提供**机制**，**内容**由宿主用 defineExtension() 装进来。
//
// ── 五个挂载点（正好是管线的五个分岔处）
//   fenceLangs     围栏语言名 → 节点       ` ```sample ` ——"外形是普通代码块、语义是自己的"
//   inlineCommands `\命令{…}` → 节点       `\cite{1}`
//   dataBlocks     `\命令=[ … ]` → 节点    `\tree=[ id="…" ]`
//   renderBlock / renderInline   节点 → HTML（按声明的 blockTypes / inlineTypes 派发）
//   setup / finish   整篇级的渲染前准备与收尾（跨块信息：编号、反向校验）
//
//   外加 whitelist：扩展自己的产物条目**由扩展自己登记**，核心名单不必为它让路。
//
// ── 装了没装，核心都照样跑
//   没装扩展时，` ```sample ` 就是一个 `sample` 语言的普通代码块，`\tree=[…]` 会因为
//   "未知的数据块类型"当场报错并列出可用类型。核心不会因为缺了某个站点的元素就崩，
//   这正是扩展点该有的样子。

import { allowEntries } from './whitelist.js';

// 插入骨架模板里表示"光标落点"的字符。工具栏把模板写进文档后，光标落在这个字符原来的位置。
// 定义在这里而不是编辑器里：模板由扩展提供，扩展与编辑器得有同一个约定。
export const SNIPPET_CARET = '\u25AE'; // ▮

// 注册表：名字 → 规格，装的时候查重，用的时候 O(1)。
const inlineCommands = new Map();
const dataBlocks = new Map();
const fenceLangs = new Map();
const blockRenderers = new Map();   // 节点 type → 装它的扩展记录
const inlineRenderers = new Map();
// 谁占了哪个名字 —— 只为了让冲突报错能指出对方是谁。
// ⚠️ 核心名与扩展名**分开记**：uninstallExtensions() 只清扩展侧的，
// 核心那份清了就再也回不来（核心的名字是模块加载时登记的，没有"重新加载"这回事）。
const coreClaims = new Map();       // `kind:name` → 核心模块
const extClaims = new Map();        // `kind:name` → 扩展名
const packs = [];

/**
 * 核心声明自己已经用掉的名字。核心的注册表不在本文件里（各自的模块自己持有），
 * 所以这里只留一份"名字账"，用来挡住"扩展想占用核心已实现的名字"这种静默遮蔽。
 * 只该被 src/ 下的核心模块调用。
 */
export function claimCore(kind, names, owner) {
  for (const n of names) coreClaims.set(`${kind}:${n}`, owner || '核心');
}

function firstOwner(kind, key) {
  const k = `${kind}:${key}`;
  return extClaims.get(k) || coreClaims.get(k) || null;
}

/**
 * 装一个扩展。参数里出现过的每一项都会登记，没写的项就当这个扩展不需要。
 *
 * @param {object} pack
 * @param {string} pack.name            扩展名。必填 —— 冲突报错和白名单归属都要靠它。
 * @param {string[]} [pack.blockTypes]   它要渲染的块节点 type（`['Tree']`）
 * @param {string[]} [pack.inlineTypes]  它要渲染的行内节点 type（`['Citation']`）
 * @param {object} [pack.inlineCommands] 行内命令：`{ cite: { n: 1, build(args, rec, ctx) } }`
 * @param {object} [pack.dataBlocks]     数据块：`{ tree: { fields, positional, aliases, build } }`
 * @param {object} [pack.fenceLangs]     围栏语言：`{ sample: (text, at) => node }`
 * @param {(node, ctx) => string} [pack.renderBlock]
 * @param {(node, ctx) => string} [pack.renderInline]
 * @param {() => object} [pack.createState] 每次渲染一份的状态对象（编号计数器、跨块集合…）
 * @param {(state, doc, ctx) => void} [pack.setup]  渲染前拿到整篇（跨块统计）
 * @param {(state, ctx) => void} [pack.finish]      渲染收尾（反向校验之类）
 * @param {{tags?:string[],attrs?:string[],styleProps?:object}} [pack.whitelist]
 * @param {object} [pack.snippets] 插入骨架模板：`{ cite: '\\cite{▮}' }`，用 SNIPPET_CARET 标落点
 * @returns {object} 原样返回 pack
 */
export function defineExtension(pack) {
  if (!pack || typeof pack !== 'object') {
    throw new Error('defineExtension(pack)：需要一个对象');
  }
  const name = String(pack.name || '').trim();
  if (!name) {
    throw new Error('扩展必须写 name —— 冲突报错和产物白名单的归属都要靠它');
  }
  if (packs.some((p) => p.name === name)) {
    throw new Error(`扩展「${name}」已经装过了（同一个扩展不能装两遍）`);
  }

  const record = {
    name,
    renderBlock: typeof pack.renderBlock === 'function' ? pack.renderBlock : null,
    renderInline: typeof pack.renderInline === 'function' ? pack.renderInline : null,
    createState: typeof pack.createState === 'function' ? pack.createState : null,
    setup: typeof pack.setup === 'function' ? pack.setup : null,
    finish: typeof pack.finish === 'function' ? pack.finish : null,
    snippets: { ...(pack.snippets || {}) },
  };

  // 先全部校验、再统一落地：装到一半失败会留下半个注册表，下次报错就查不清了。
  const staged = [
    ...Object.entries(pack.inlineCommands || {}).map(([k, v]) => ['inlineCommand', inlineCommands, k, v]),
    ...Object.entries(pack.dataBlocks || {}).map(([k, v]) => ['dataBlock', dataBlocks, k, v]),
    ...Object.entries(pack.fenceLangs || {}).map(([k, v]) => ['fenceLang', fenceLangs, k, v]),
    ...(pack.blockTypes || []).map((t) => ['blockType', blockRenderers, t, record]),
    ...(pack.inlineTypes || []).map((t) => ['inlineType', inlineRenderers, t, record]),
  ];
  // 数据块的别名（`\进化树=[` 之于 `\tree=[` 那种）共用同一张表，所以走同一条查重
  for (const [k, spec] of Object.entries(pack.dataBlocks || {})) {
    for (const alias of (spec && spec.aliases) || []) {
      staged.push(['dataBlock 别名', dataBlocks, alias, spec]);
    }
  }
  for (const [kind, map, key] of staged) {
    const owner = firstOwner(kind, key);
    if (owner || map.has(key)) {
      throw new Error(`扩展「${name}」想占用 ${kind} \`${key}\`，但已被「${owner || '本扩展的其他条目'}」占用`);
    }
  }
  for (const [kind, map, key, value] of staged) {
    extClaims.set(`${kind}:${key}`, name);
    map.set(key, value);
  }

  // 扩展自己的产物条目，扩展自己登记 —— 核心白名单不必为它让路。
  if (pack.whitelist) {
    allowEntries({ ...pack.whitelist, owner: `扩展 ${name}` });
  }

  packs.push(record);
  return pack;
}

/** 已装的扩展（按装入顺序）。 */
export function listExtensions() {
  return packs.map((p) => p.name);
}

/**
 * 卸掉所有扩展。**只给测试用** —— 模块级注册表是单例，测试之间要能回到干净状态。
 * 核心自己登记的名字留在 coreClaims 里不动（见上面的说明）。
 */
export function uninstallExtensions() {
  inlineCommands.clear();
  dataBlocks.clear();
  fenceLangs.clear();
  blockRenderers.clear();
  inlineRenderers.clear();
  extClaims.clear();
  packs.length = 0;
}

// ── 核心查询口（核心模块只调这几个）
export function lookupInlineCommand(name) {
  return inlineCommands.get(name) || null;
}

export function lookupDataBlock(name) {
  return dataBlocks.get(name) || null;
}

export function lookupFenceLang(lang) {
  return fenceLangs.get(lang) || null;
}

export function lookupBlockRenderer(type) {
  const owner = blockRenderers.get(type);
  return owner ? owner.renderBlock : null;
}

export function lookupInlineRenderer(type) {
  const owner = inlineRenderers.get(type);
  return owner ? owner.renderInline : null;
}

/** 扩展登记过的数据块名字（核心拼"可用类型"的报错信息要用）。 */
export function extensionDataBlockNames() {
  return [...dataBlocks.keys()];
}

/** 合并所有扩展提供的插入骨架模板。 */
export function extensionSnippets() {
  const out = {};
  for (const p of packs) Object.assign(out, p.snippets);
  return out;
}

// ── 生命周期：每次渲染一份扩展状态
export function createExtStates() {
  const states = new Map();
  for (const p of packs) {
    if (p.createState || p.setup || p.finish) {
      states.set(p.name, p.createState ? p.createState() : {});
    }
  }
  return states;
}

export function runSetup(states, doc, ctx) {
  for (const p of packs) {
    if (p.setup && states.has(p.name)) p.setup(states.get(p.name), doc, ctx);
  }
}

export function runFinish(states, ctx) {
  for (const p of packs) {
    if (p.finish && states.has(p.name)) p.finish(states.get(p.name), ctx);
  }
}
