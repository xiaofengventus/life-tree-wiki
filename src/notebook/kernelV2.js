// Notebook 的 v2 内核适配层。
//
// 内核只有一套：认得出来的语法照常排版，认不出来的命令原样当正文 ——
// 不再按 v1 / v2 分家，也不因为「这是旧写法」把整格拦下。
//   · 代码格（type: code）是原生代码，语言由项目设置统一决定，格里不写任何声明；
//   · Laup 格里首行的 `[cpp]` / `[input]` / `[output]` / `[references]` 是 Laup 标记语言；
//   · 发布 / 导出时，原生代码格写成 `%%语言` + 正文（`%%` 只是给读者标语言，正文不变）。

import { parseCells, readReferenceCell, typesetCells } from '../laup2/index.js'
import { highlightLaupCode, normalizeLang } from '../utils/codeLang.js'
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

const ATT_RE = /attachment:([\w.\-\u4e00-\u9fa5]+)/g

function restoreImageAttachments(html, cell) {
  return html.replace(/(<img(?:\s+[\w-]+="[^"]*")*?\s+src=")attachment:([\w.\-\u4e00-\u9fa5]+)"/g, (match, attr, name) => {
    const url = cell?.attachments?.[name]
    return /^data:image\/(?:png|jpe?g|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/i.test(url || '')
      ? `${attr}${url}"` : match
  })
}

/** 旧快照的 var 只改编辑格类型，源码和附件原样保留。 */
export function normalizeV2CellType(type) {
  return type === 'code' ? 'code' : 'laup'
}

// 首行是 Laup 声明（`[cpp]` / `[input]` / `[references]` …）→ 这其实是 Laup 格。
// 老快照 / 老 .lanb 里的「代码格 + 首行声明」按这个规则自动归位，不丢内容。
const CELL_DECL_HEAD = /^\[([A-Za-z0-9_+#-]{1,16})(?::[A-Za-z0-9_+#-]{1,16})?\][ \t]*(?:\r?\n|$)/

export function normalizeV2Cell(cell) {
  const type = normalizeV2CellType(cell.type)
  if (type !== 'code') return type === cell.type ? cell : { ...cell, type }
  const source = String(cell.source ?? '')
  const declHead = CELL_DECL_HEAD.test(source) || /^[ \t]*\[var\][ \t]*(?:\r\n?|\n|$)/i.test(source)
  return declHead ? { ...cell, type: 'laup' } : cell
}

// ── 原生代码格：纯代码，语言来自项目设置 ────────────────────────────
// 格里不写任何声明（首行 `[cpp]` 之类是 Laup 标记语言，见 normalizeV2Cell），
// 正文一个字都不改，只在排版时套上项目声明的语言上色。
function renderCodeCell(cell, refOptions, codeLang) {
  const source = String(cell.source ?? '')
  if (!source.trim()) return ''
  const result = typesetCells([{ type: 'code', lang: codeLang || 'text', source }], refOptions)
  return highlightLaupCode(sanitizeHtml(articleBody(result.html))) + warningBlock(result.diagnostics)
}

// ── Laup 格 ────────────────────────────────────────────────────────
function renderLaupCell(cell, scope, refOptions, pane) {
  const source = String(cell.source ?? '')
  // 输入 + 输出并成一张卡（store 已用 pane 规划配好对，配对可以跨格）
  if (pane?.role === 'merged') return ''
  if (pane?.role === 'card') {
    const parts = []
    for (const item of [pane.input, pane.output]) {
      if (!item) continue
      parts.push(`[${item.kind}]\n${String(item.body ?? '').replace(/\s+$/, '')}`)
    }
    const result = typesetCells(parts.map((src) => ({ type: 'laup', source: src })))
    return sanitizeHtml(articleBody(result.html)) + warningBlock(result.diagnostics)
  }

  const result = typesetCells(source, { variables: scope, ...refOptions, allowAttachment: true })
  const html = restoreImageAttachments(articleBody(result.html), cell)
  return sanitizeHtml(highlightLaupCode(html)) + warningBlock(result.diagnostics)
}

/**
 * 渲染一格。可读取宿主变量，不从格源码写入变量。
 * @param {object} cell
 * @param {{ scope?: object, refPool?: string[], isRefDisplay?: boolean, pane?: object|null, codeLang?: string }} ctx
 */
export function runCellSourceV2(cell, ctx = {}) {
  const { scope = {}, refPool, isRefDisplay, pane = null, codeLang = 'text' } = ctx
  const refOptions = { referencePool: refPool, showReferences: isRefDisplay }
  try {
    const normalized = normalizeV2Cell(cell)
    if (normalized.type === 'code') return { outputHtml: renderCodeCell(normalized, refOptions, codeLang) }
    return { outputHtml: renderLaupCell(normalized, scope, refOptions, pane) }
  } catch (error) {
    return { outputHtml: errorBlock(`渲染失败：${error?.message || error}`) }
  }
}

// ── 文档的读写（发布 / 重新编辑 / 文献池） ───────────────────────────

/**
 * 单元格源码 → `.laup` 源码（发布与导出共用）。
 * 原生代码格写成 `%%语言` + 正文：文档里只有这一行标记，编辑时不出现。
 */
export function exportNotebookV2(cells, urlMap = null, codeLang = 'text') {
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
    let body = swapMedia(restoreAttachments(source, cell))
    if (cell.type === 'code') body = `%%${codeLang || 'text'}\n${body}`
    parts.push(body)
  }
  return parts.join('\n\n\\cellbreak\n\n') + '\n'
}

/**
 * `.laup` 源码 → store 的格数组（打开已发布文章 / 导入时用）。
 * 文档里的 `[cpp]` / `[input]` 是 Laup 标记语言，落在 Laup 格里；
 * 只有 `%%语言` 才是原生代码格，读入时把标记行剥掉。
 * @returns {{ cells: object[], codeLang: string }}
 */
export function importNotebookV2(source) {
  let codeLang = ''
  const cells = parseCells(source).map((cell) => {
    const text = String(cell.source ?? '')
    const magic = /^[ \t]*%%([A-Za-z0-9_+#.-]{1,24})[ \t]*\r?\n?/.exec(text)
    if (!magic) return { type: 'laup', source: text }
    if (!codeLang) codeLang = normalizeLang(magic[1])
    return { type: 'code', source: text.slice(magic[0].length) }
  })
  return { cells, codeLang }
}

/** 所有 [references] 格的条目，按格顺序汇总（= 全局编号）。 */
export function collectV2References(cells) {
  const out = []
  for (const cell of Array.isArray(cells) ? cells : []) {
    for (const section of referenceSections(cell)) out.push(...readReferenceCell(section))
  }
  return out
}

function referenceSections(cell) {
  if (!cell?.source) return []
  const parts = parseCells([{ type: cell.type === 'laup' ? 'laup' : 'code', source: cell.source }])
  return parts.filter((part) => part.pane === 'references')
}

/** 文献列表显示在首个 [references] 格中。 */
export function v2ReferenceDisplayIndex(cells) {
  return (Array.isArray(cells) ? cells : []).findIndex((cell) => referenceSections(cell).length > 0)
}
