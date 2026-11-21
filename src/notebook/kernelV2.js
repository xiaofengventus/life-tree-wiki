// Notebook 的 v2 内核适配层（v2 为长期支持版本，**不再兼容 v1 写法**）。
//
// v1 与 v2 已彻底独立：
//   · v1 的编辑器 / 解释器（/notebook、src/laup、src/notebook/renderer.js）原样保留；
//   · 这里只做「store 的格 → v2 源码 → typesetCells」这一件事，不翻译任何 v1 语法；
//   · v1 独有的写法（[input:cpp]、\references=[…]、\varcell、```code/.sample、[lifetree]）
//     在 v2 页面直接报错，由作者改写 —— 不做静默兜底。

import { typesetCells } from '@/laup2/index.js'
import { parseCells, readVarCell } from '@/laup2/cells.js'
import { highlightLaupCode, parseCodeDecl } from '@/utils/codeLang.js'
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

// ── 变量格：原生芯片（v2 的变量格本身零输出，芯片是编辑器的反馈） ──────
function renderVarCell(cell, scope) {
  const pairs = readVarCell({ source: cell.source })
  for (const [name, value] of pairs) scope[name] = value
  if (!pairs.length) return ''
  return pairs.map(([name, value]) => {
    const text = String(typeof value === 'string' ? value : JSON.stringify(value))
    const flat = esc(text).replace(/\n/g, '⏎')
    return `<span class="var-chip" title="${esc(text)}">${esc(name)} = ${flat.length > 48 ? `${flat.slice(0, 48)}…` : flat}</span>`
  }).join('')
}

// ── 代码格：只认 v2 的声明；v1 写法直接报错 ──────────────────────────
function renderCodeCell(cell, scope, pane) {
  const decl = parseCodeDecl(cell.source)

  if (decl.kind === 'none') {
    return errorBlock('代码格首行必须写类型声明：[cpp] / [input] / [output] / [var] / [references]')
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
    const result = typesetCells(parts.join('\n\\cellbreak\n'), { variables: scope })
    return sanitizeHtml(articleBody(result.html)) + warningBlock(result.diagnostics)
  }

  const name = decl.raw
  const result = typesetCells(`[${name}]\n${String(decl.body ?? '').replace(/\s+$/, '')}`, {
    variables: scope,
  })
  return highlightLaupCode(sanitizeHtml(articleBody(result.html))) + warningBlock(result.diagnostics)
}

// ── Laup 格 ────────────────────────────────────────────────────────
// v1 留在正文里的宿主层写法：v2 不会自己报错（会被当成普通文字），
// 所以在这里点名，作为"手动迁移清单"的即时提示。
const V1_IN_LAUP = [
  [/^[ \t]*\\references[ \t]*=/m, 'v1 的 \\references=[…] 数据块在 v2 里要改成单独的 [references] 代码格（一条一行）'],
  [/^[ \t]*\\varcell[ \t]*=/m, 'v1 的 \\varcell=[…] 数据块在 v2 里要改成单独的 [var] 代码格'],
  [/^[ \t]*\\image[ \t]*[=!]/m, 'v2 用 ![说明](地址) 插图，不再用 \\image 数据块'],
  [/^[ \t]*\\tree[ \t]*=/m, 'v2 还没有 \\tree 研究树嵌入'],
];

/** 去掉围栏代码块与行内代码，避免「示例代码」被误判成真的 v1 写法。 */
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
  const visible = stripCodeForCheck(text);
  for (const [pattern, message] of V1_IN_LAUP) {
    if (pattern.test(visible)) return message;
  }
  return "";
}

function renderLaupCell(cell, scope, refPool, isRefDisplay) {
  let source = String(cell.source ?? '')
  // 迁移期：命中 v1 写法就只显示提示，避免"看起来渲染出来了"的错觉
  const leftover = v1LeftoverInLaup(source)
  if (leftover) return errorBlock(`这一格还是 v1 写法：${leftover}`)

  // 跨格的文献池：v2 的 \cite 只认同一次渲染里的 [references] 格，
  // 编辑器是一格一格渲染的，所以在这里补一个合成文献格（只有引用/展示格需要）。
  const refs = (Array.isArray(refPool) ? refPool : []).filter(Boolean)
  const hasCite = /\\cite\s*\{/.test(source)
  const declaresRefs = /^[ \t]*\[references\][ \t]*(?:\n|$)/i.test(source)
  const injectRefs = refs.length > 0 && !declaresRefs && (hasCite || isRefDisplay)
  if (injectRefs) source += `\n\n\\cellbreak\n[references]\n${refs.join('\n')}`

  const { src, restore } = withAttachments(source, cell)
  const result = typesetCells(src, { variables: scope })
  let html = restore(articleBody(result.html))
  if (injectRefs && !isRefDisplay) {
    html = html.replace(/<section class="laup2-references">[\s\S]*?<\/section>/g, '')
  }
  return sanitizeHtml(highlightLaupCode(html)) + warningBlock(result.diagnostics)
}

/**
 * 渲染一格（v2）。变量作用域由调用方持有（store.scope），var 格会写回。
 * @param {object} cell
 * @param {{ scope?: object, refPool?: string[], isRefDisplay?: boolean, pane?: object|null }} ctx
 */
export function runCellSourceV2(cell, ctx = {}) {
  const { scope = {}, refPool = [], isRefDisplay = false, pane = null } = ctx
  try {
    if (cell.type === 'var') return { outputHtml: renderVarCell(cell, scope) }
    if (cell.type === 'code') return { outputHtml: renderCodeCell(cell, scope, pane) }
    return { outputHtml: renderLaupCell(cell, scope, refPool, isRefDisplay) }
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
  for (const cell of Array.isArray(cells) ? cells : []) {
    const source = String(cell?.source ?? '').trim()
    if (!source) continue
    // 导出即校验：v1 写法混进 v2 文档时，发布前就报错，不把错误语法写进库
    if (cell.type === 'code') {
      const decl = parseCodeDecl(source)
      if (decl.kind === 'none') {
        throw new Error('代码格首行必须写类型声明：[cpp] / [input] / [output] / [var] / [references]')
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
    parts.push(cell.type === 'var' ? `[var]\n${body}` : body)
  }
  return parts.join('\n\n\\cellbreak\n\n') + '\n'
}

/** v2 `.laup` 源码 → store 的格数组（打开已发布文章 / 导入时用）。 */
export function importNotebookV2(source) {
  return parseCells(source).map((cell) => {
    if (cell.type === 'laup') return { type: 'laup', source: cell.source }
    if (cell.type === 'var') return { type: 'var', source: String(cell.body ?? '').trim() }
    if (cell.type === 'reference') return { type: 'code', source: `[references]\n${cell.body}` }
    return { type: 'code', source: `[${cell.pane || cell.lang || 'text'}]\n${cell.body}` }
  })
}

/** 所有 [references] 代码格的条目，按格顺序汇总（= 全局编号）。 */
export function collectV2References(cells) {
  const out = []
  for (const cell of Array.isArray(cells) ? cells : []) {
    if (cell?.type === 'code') {
      const decl = parseCodeDecl(cell.source)
      if (decl.kind !== 'lang' || decl.raw !== 'references') continue
      for (const line of String(decl.body ?? '').split('\n')) {
        const text = line.trim()
        if (text) out.push(text)
      }
      continue
    }
    // 直接写在 laup 格里的 [references] 段也认（格类型没切到 code 时）
    if (cell?.type === 'laup') {
      const match = /^[ \t]*\[references\][ \t]*\n?([\s\S]*)$/i.exec(String(cell.source ?? ''))
      if (!match) continue
      for (const line of match[1].split('\n')) {
        const text = line.trim()
        if (text) out.push(text)
      }
    }
  }
  return out
}

/** 文献列表的展示格：第一个 [references] 代码格；没有则第一个带 \cite 的 laup 格。 */
export function v2ReferenceDisplayIndex(cells) {
  const list = Array.isArray(cells) ? cells : []
  const declared = list.findIndex((cell) => {
    if (cell?.type === 'laup') return /^[ \t]*\[references\][ \t]*(?:\n|$)/i.test(String(cell.source ?? ''))
    if (cell?.type !== 'code') return false
    const decl = parseCodeDecl(cell.source)
    return decl.kind === 'lang' && decl.raw === 'references'
  })
  if (declared >= 0) return declared
  return list.findIndex((cell) => cell?.type === 'laup' && /\\cite\s*\{/.test(cell.source))
}
