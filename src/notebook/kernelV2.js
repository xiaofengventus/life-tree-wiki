// Notebook 的 v2 内核适配层（v2 为长期支持版本，**不再兼容 v1 写法**）。
//
// v1 与 v2 已彻底独立：
//   · v1 的编辑器 / 解释器（/notebook、src/laup、src/notebook/renderer.js）原样保留；
//   · 这里只做「store 的格 → v2 源码 → typesetCells」这一件事，不翻译任何 v1 语法；
//   · v1 独有的写法（[input:cpp]、\references=[…]、\varcell、```code/.sample、[lifetree]）
//     在 v2 页面直接报错，由作者改写 —— 不做静默兜底。

import { parseCells, readReferenceCell, typesetCells } from '../laup2/index.js'
import { highlightLaupCode, parseCodeDecl } from '../utils/codeLang.js'
import { sanitizeHtml } from './renderer.js'

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** v2 产物带一层文章容器；格输出只需要里面的内容。 */
function articleBody(html) {
  return String(html ?? '')
    .replace(/^\s*<article class="laup2">\s*/, '')
    .replace(/\s*<\/article>\s*$/, '')
}

const errorBlock = (message) => `<pre class="error-out">${esc(message)}</pre>`
const warningBlock = (list) => (list || [])
  .filter((item) => item.level !== 'error')
  .map((item) => `<div class="laup-warn">⚠ ${esc(item.message)}</div>`)
  .join('')

// ── 附件：attachment:name → 安全占位路径 → 渲染完换回 data URL ────────
// （与 v1 的宿主层同一思路，但实现留在 v2 这一侧，不依赖 v1 渲染器）
const ATT_RE = /attachment:([\w.\-\u4e00-\u9fa5]+)/g
const attToken = (i) => `__laup_att_${i}.png`

function withAttachments(source, cell) {
  const atts = []
  const src = String(source ?? '').replace(ATT_RE, (match, name) => {
    const url = cell?.attachments?.[name]
    if (!url) return match
    atts.push(url)
    return attToken(atts.length - 1)
  })
  const restore = (html) => String(html).replace(/__laup_att_(\d+)\.png/g, (m, i) => atts[Number(i)] ?? m)
  return { src, restore }
}

/** 旧快照的 var 只改编辑格类型，源码和附件原样保留。 */
export function normalizeV2CellType(type) {
  return type === 'code' ? 'code' : 'laup'
}

export function normalizeV2Cell(cell) {
  const legacyVarDecl = cell.type === 'code' && /^[ \t]*\[var\][ \t]*(?:\r\n?|\n|$)/i.test(cell.source)
  const type = legacyVarDecl ? 'laup' : normalizeV2CellType(cell.type)
  return type === cell.type ? cell : { ...cell, type }
}

// ── 代码格：只认 v2 的声明；v1 写法直接报错 ──────────────────────────
function renderCodeCell(cell, refOptions, pane) {
  const decl = parseCodeDecl(cell.source)

  if (decl.kind === 'none') {
    return errorBlock('代码格首行必须写类型声明：[cpp] / [input] / [output] / [references]')
  }
  if ((decl.kind === 'input' || decl.kind === 'output') && decl.raw) {
    return errorBlock(
      `v2 的输入/输出栏不声明语言：${decl.declText} 请改成 [${decl.kind}]；`
      + '语言只写在单独的代码格里（如 [cpp]）',
    )
  }
  if (decl.kind === 'lang' && decl.raw === 'lifetree') {
    return errorBlock('v2 还没有 [lifetree] 分类树格：请先用 v1 的 Notebook 维护它')
  }

  // 输入 + 输出并成一张卡（store 已用 pane 规划配好对）
  if (pane?.role === 'merged') return ''
  if (pane?.role === 'card') {
    const parts = []
    for (const item of [pane.input, pane.output]) {
      if (!item) continue
      if (item.raw) {
        return errorBlock(`v2 的输入/输出栏不声明语言：${item.declText} 请改成 [${item.kind}]`)
      }
      parts.push(`[${item.kind}]\n${String(item.body ?? '').replace(/\s+$/, '')}`)
    }
    const result = typesetCells(parts.map((source) => ({ type: 'laup', source })))
    return sanitizeHtml(articleBody(result.html)) + warningBlock(result.diagnostics)
  }

  const result = decl.raw === 'references'
    ? typesetCells([{ type: 'laup', source: cell.source }], refOptions)
    : decl.kind === 'input' || decl.kind === 'output'
      ? typesetCells([{ type: 'laup', source: cell.source }])
      : typesetCells([{ type: 'code', lang: decl.raw, source: decl.body }])
  return highlightLaupCode(sanitizeHtml(articleBody(result.html))) + warningBlock(result.diagnostics)
}

// ── Laup 格 ────────────────────────────────────────────────────────
// v1 留在正文里的宿主层写法：v2 不会自己报错（会被当成普通文字），
// 所以在这里点名，作为"手动迁移清单"的即时提示。
const V1_IN_LAUP = [
  [/^[ \t]*\\references[ \t]*=/m, 'v1 的 \\references=[…] 数据块在 v2 里要改成单独的 [references] 代码格（一条一行）'],
  [/^[ \t]*\\varcell[ \t]*=/m, 'v1 的 \\varcell=[…] 数据块在 v2 里已停用，请保留原文备查并把需要展示的内容写入 Laup 正文'],
  [/^[ \t]*\\image[ \t]*[=!]/m, 'v2 用 ![说明](地址) 插图，不再用 \\image 数据块'],
  [/^[ \t]*\\tree[ \t]*=/m, 'v2 还没有 \\tree 研究树嵌入'],
];

/** 去掉围栏代码块、行内代码与 raw 环境（stay / equation），避免示例文字被误判。 */
function stripRawRegions(source) {
  const visible = stripCodeForCheck(source);
  return visible.replace(/\\begin\{(?:stay|equation)\}[\s\S]*?\\end\{(?:stay|equation)\}/g, "");
}
function stripCodeForCheck(source) {
  const out = [];
  let fence = null;
  for (const line of String(source ?? "").split("\n")) {
    const open = /^[ \t]{0,3}(`{3,}|~{3,})/.exec(line);
    const close = /^[ \t]{0,3}(`{3,}|~{3,})[ \t]*$/.exec(line);
    if (fence) {
      if (close && close[1][0] === fence[0] && close[1].length >= fence.length) fence = null;
      continue;
    }
    if (open) {
      fence = open[1];
      continue;
    }
    out.push(line.replace(/`[^`\n]*`/g, ""));
  }
  return out.join("\n");
}

/** 正文里残留的 v1 写法 → 给作者看的迁移提示（没有则返回 ''）。 */
export function v1LeftoverInLaup(source) {
  const text = String(source ?? "");
  // 围栏本身是 v1 的 sample 语法，必须在剥代码前判断
  if (/^[ \t]{0,3}`{3,}[ \t]*sample\b/m.test(text)) {
    return "输入/输出案例请拆成 [input] / [output] 两个代码格";
  }
  const visible = stripRawRegions(text);
  for (const [pattern, message] of V1_IN_LAUP) {
    if (pattern.test(visible)) return message;
  }
  return "";
}

function renderLaupCell(cell, scope, refOptions) {
  const source = String(cell.source ?? '')
  // 迁移期：命中 v1 写法就只显示提示，避免"看起来渲染出来了"的错觉
  const leftover = v1LeftoverInLaup(source)
  if (leftover) return errorBlock(`这一格还是 v1 写法：${leftover}`)

  const { src, restore } = withAttachments(source, cell)
  const result = typesetCells(src, { variables: scope, ...refOptions })
  return sanitizeHtml(highlightLaupCode(restore(articleBody(result.html)))) + warningBlock(result.diagnostics)
}

/**
 * 渲染一格（v2）。可读取宿主变量，不从格源码写入变量。
 * @param {object} cell
 * @param {{ scope?: object, refPool?: string[], isRefDisplay?: boolean, pane?: object|null }} ctx
 */
export function runCellSourceV2(cell, ctx = {}) {
  const { scope = {}, refPool, isRefDisplay, pane = null } = ctx
  const refOptions = { referencePool: refPool, showReferences: isRefDisplay }
  try {
    const normalized = normalizeV2Cell(cell)
    if (normalized.type === 'code') return { outputHtml: renderCodeCell(normalized, refOptions, pane) }
    return { outputHtml: renderLaupCell(normalized, scope, refOptions) }
  } catch (error) {
    return { outputHtml: errorBlock(`渲染失败：${error?.message || error}`) }
  }
}

// ── v2 文档的读写（发布 / 重新编辑 / 文献池） ─────────────────────────

/** 单元格源码 → v2 `.laup` 源码（发布与导出共用）。 */
export function exportNotebookV2(cells, urlMap = null) {
  const swapMedia = (text) => (urlMap && urlMap.size
    ? String(text).replace(/data:image\/(?:png|jpe?g|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=]+/g,
      (match) => urlMap.get(match) || match)
    : String(text))
  const restoreAttachments = (text, cell) => String(text).replace(ATT_RE, (match, name) => {
    return cell?.attachments?.[name] || match
  })

  const parts = []
  for (const rawCell of Array.isArray(cells) ? cells : []) {
    if (!rawCell) continue
    const cell = normalizeV2Cell(rawCell)
    const source = String(cell.source ?? '')
    if (!source.trim()) continue
    // 导出即校验：v1 写法混进 v2 文档时，发布前就报错，不把错误语法写进库
    if (cell.type === 'code') {
      const decl = parseCodeDecl(source)
      if (decl.kind === 'none') {
        throw new Error('代码格首行必须写类型声明：[cpp] / [input] / [output] / [references]')
      }
      if ((decl.kind === 'input' || decl.kind === 'output') && decl.raw) {
        throw new Error(`v2 的输入/输出栏不声明语言：${decl.declText} 请改成 [${decl.kind}]`)
      }
      if (decl.kind === 'lang' && decl.raw === 'lifetree') {
        throw new Error('v2 还没有 [lifetree] 分类树格')
      }
    } else {
      // 正文里残留 v1 数据块时，服务端会把它判成 v1 文档 —— 发布前必须拦下
      const leftover = v1LeftoverInLaup(source)
      if (leftover) throw new Error(leftover)
    }
    const body = swapMedia(restoreAttachments(source, cell))
    parts.push(body)
  }
  return parts.join('\n\n\\cellbreak\n\n') + '\n'
}

/** v2 `.laup` 源码 → store 的格数组（打开已发布文章 / 导入时用）。 */
export function importNotebookV2(source) {
  return parseCells(source).map((cell) => ({
    type: cell.type === 'laup' ? 'laup' : 'code',
    source: cell.source,
  }))
}

/** 所有 [references] 代码格的条目，按格顺序汇总（= 全局编号）。 */
export function collectV2References(cells) {
  const out = []
  for (const cell of Array.isArray(cells) ? cells : []) {
    for (const section of referenceSections(cell)) out.push(...readReferenceCell(section))
  }
  return out
}

function referenceSections(cell) {
  if (cell?.type === 'laup') return parseCells(cell.source).filter((part) => part.type === 'reference')
  if (cell?.type !== 'code') return []
  const decl = parseCodeDecl(cell.source)
  return decl.declText === '[references]'
    ? parseCells([{ type: 'laup', source: cell.source }]).filter((part) => part.type === 'reference')
    : []
}

/** 文献列表显示在首个 [references] 声明所在的编辑格中。 */
export function v2ReferenceDisplayIndex(cells) {
  return (Array.isArray(cells) ? cells : []).findIndex((cell) => referenceSections(cell).length > 0)
}
