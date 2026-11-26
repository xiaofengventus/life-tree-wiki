// 自力输出 PDF —— 不走 window.print()。
//
// 为什么不能用 print()：打印驱动会对页面做第二次排版（忽略部分 CSS、按自己的规则分页），
// 屏幕上看对的东西印出来会变样。这里改用和 pdftex 一样的思路：排版已经在浏览器里完成，
// 我们只负责把"每个字形放在哪、多大、什么颜色、什么字体"写进 PDF 的 content stream。
//
// 管线：隐藏工作区按版心宽重排 → 逐字取矩形（坐标 + 样式）→ 按行归并 → 连成 run → pdf-lib 写 A4 页。
// 字体：思源宋体 / 思源黑体 / 等宽（public/fonts），按字形名做 A/B/C 三态对齐，
//       正体用常规字重，粗体（标题、<strong>）用 Bold 字重，中文与西文都按真实字宽排。

import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import katex from 'katex'
import { MEASURE_CSS } from './printStyle.js'

const PX_PER_MM = 96 / 25.4
const PT_PER_PX = 72 / 96
const DEFAULT_SIZE = 15.33 // 11.5pt
const INK = rgb(0.09, 0.09, 0.11)

/** 三族 × 两字重。字形名做 key 时会把各组的第一项当 ASCII 映射，其余当 Unicode 映射。 */
const FONT_FILES = {
  serif: {
    url: '/fonts/SourceHanSerifSC-Regular.otf',
    regular: '/fonts/SourceHanSerifSC-Regular.otf',
    bold: '/fonts/SourceHanSerifSC-Bold.otf',
  },
  sans: {
    url: '/fonts/SourceHanSansSC-Regular.otf',
    regular: '/fonts/SourceHanSansSC-Regular.otf',
    bold: '/fonts/SourceHanSansSC-Bold.otf',
  },
  mono: {
    url: '/fonts/JetBrainsMono-Regular.ttf',
    regular: '/fonts/JetBrainsMono-Regular.ttf',
    bold: '/fonts/JetBrainsMono-Bold.ttf',
  },
}

/** 样式里的 font-family → 三族之一。浏览器挑字体时也是先看物理字形，这里按族兜一层。 */
function pickFamily(fontFamily) {
  const list = String(fontFamily || '').toLowerCase()
  if (/mono|consolas|menlo|courier|jetbrains/.test(list)) return 'mono'
  if (/sans|hei|arial|helvetica|system-ui|-apple-system/.test(list)) return 'sans'
  return 'serif'
}

/**
 * OTF 的 CFF 字符集里有一小撮"名字是造出来的"字形，拿不到标准字形名；
 * 它们恰恰是最常用的标点。name → Unicode 的兜底表，保证这些字能落进文本、能被复制。
 */
const CN_FALLBACK = {
  'uni00A0': 0x00a0, space: 0x20, nbspace: 0x00a0,
  'uni3001': 0x3001, 'uni3002': 0x3002, 'uniFF0C': 0xff0c, 'uniFF1A': 0xff1a,
  'uniFF1B': 0xff1b, 'uniFF1F': 0xff1f, 'uniFF01': 0xff01, 'uniFF08': 0xff08,
  'uniFF09': 0xff09, 'uniFF0E': 0xff0e, 'uni300A': 0x300a, 'uni300B': 0x300b,
  'uni3008': 0x3008, 'uni3009': 0x3009, 'uni300C': 0x300c, 'uni300D': 0x300d,
  'uni300E': 0x300e, 'uni300F': 0x300f, 'uni3010': 0x3010, 'uni3011': 0x3011,
  'uni2018': 0x2018, 'uni2019': 0x2019, 'uni201C': 0x201c, 'uni201D': 0x201d,
  'uni2014': 0x2014, 'uni2026': 0x2026, 'uni00B7': 0x00b7, 'uni2013': 0x2013,
  'uni00D7': 0x00d7, 'uni00F7': 0x00f7, 'uni2192': 0x2192, 'uni2190': 0x2190,
  'uni2264': 0x2264, 'uni2265': 0x2265, 'uni2260': 0x2260, 'uni221A': 0x221a,
  'uni2211': 0x2211, 'uni222B': 0x222b, 'uni00B1': 0x00b1, 'uni00B0': 0x00b0,
  'uni2032': 0x2032, 'uni2033': 0x2033, 'uni2208': 0x2208, 'uni2205': 0x2205,
  'uni2200': 0x2200, 'uni2203': 0x2203, 'uni2229': 0x2229, 'uni222A': 0x222a,
  'uni21D2': 0x21d2, 'uni21D4': 0x21d4, 'uni2202': 0x2202, 'uni221E': 0x221e,
  'uni2248': 0x2248, 'uni2261': 0x2261, 'uni2262': 0x2262, 'uni2295': 0x2295,
  'uni00A9': 0x00a9, 'uni00AE': 0x00ae, 'uni2122': 0x2122, 'uni20AC': 0x20ac,
  'uni00A5': 0x00a5, 'uni00A3': 0x00a3, 'uni00AB': 0x00ab, 'uni00BB': 0x00bb,
  'uni2039': 0x2039, 'uni203A': 0x203a, 'uni02C6': 0x02c6, 'uni02DC': 0x02dc,
  'uniFB01': 0xfb01, 'uniFB02': 0xfb02, 'uniFFE5': 0xffe5, 'uni00A2': 0x00a2,
  'uniFF05': 0xff05, 'uniFF06': 0xff06, 'uniFF0A': 0xff0a, 'uniFF1C': 0xff1c,
  'uniFF1E': 0xff1e, 'uniFF3B': 0xff3b, 'uniFF3D': 0xff3d, 'uniFF5B': 0xff5b,
  'uniFF5D': 0xff5d, 'uniFF5E': 0xff5e, 'uniFF3F': 0xff3f, 'uniFF04': 0xff04,
  'uniFF20': 0xff20, 'uniFF0B': 0xff0b, 'uniFF0D': 0xff0d, 'uniFF1D': 0xff1d,
  'uniFF1E': 0xff1e, 'uniFF3C': 0xff3c, 'uniFF5C': 0xff5c, 'uniFF5F': 0xff5f,
}

const ZH_NAME = /^(uni|u)([0-9A-Fa-f]{4,6})$/

/** 使用 pdf-lib 的公开字符集 API，避免访问字体内部 glyph/characterSet 结构。 */
function canEncode(font, ch) {
  try {
    return font.encodeText(ch)
  } catch {
    return null
  }
}

// ── 字体加载 ──────────────────────────────────────────────────────────
const bytesCache = new Map()
function loadFontBytes(url) {
  if (!bytesCache.has(url)) {
    const promise = fetch(url).then((res) => {
      if (!res.ok) throw new Error(`字体加载失败：${url} ${res.status}`)
      return res.arrayBuffer()
    }).catch((error) => {
      bytesCache.delete(url)
      throw error
    })
    bytesCache.set(url, promise)
  }
  return bytesCache.get(url)
}

// ── 颜色 ──────────────────────────────────────────────────────────────
const colorCache = new Map()
function parseColor(value) {
  const text = String(value || '').trim()
  if (!text || text === 'transparent') return null
  if (colorCache.has(text)) return colorCache.get(text)
  let out = null
  const m = /^rgba?\(([^)]+)\)$/i.exec(text)
  if (m) {
    const parts = m[1].split(/[,\s/]+/).filter(Boolean).map(Number)
    if (parts.length >= 3 && (parts.length < 4 || parts[3] > 0.05)) {
      out = rgb(parts[0] / 255, parts[1] / 255, parts[2] / 255)
    }
  } else if (text.startsWith('#')) {
    let hex = text.slice(1)
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
    if (/^[0-9a-f]{6}$/i.test(hex)) {
      out = rgb(
        parseInt(hex.slice(0, 2), 16) / 255,
        parseInt(hex.slice(2, 4), 16) / 255,
        parseInt(hex.slice(4, 6), 16) / 255,
      )
    }
  }
  colorCache.set(text, out)
  return out
}

// ── 文本量坐标 ────────────────────────────────────────────────────────
const WS = /[\s\u200b\u00a0\u3000]/

/** 元素里所有非空文本节点，按文档顺序，带各自的计算样式。 */
function collectTextNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => (node.nodeValue && node.nodeValue.trim()
      ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  })
  const out = []
  let node = walker.nextNode()
  while (node) {
    const parent = node.parentElement
    if (parent) out.push({ node, style: getComputedStyle(parent), parent })
    node = walker.nextNode()
  }
  return out
}

/**
 * 逐字量成字符盒（x / y / 宽 / 高 / 字号 / 字体 / 颜色 / 字重 / 倾斜）。
 * 断行已经在浏览器里完成：Range 逐字取矩形，得到的就是"这个字印在哪、多宽"。
 * 换行判定用垂直中心，同一行里字号不同（上下标、代码与正文混排）不会被切成两行。
 */
function measureChars(root, origin) {
  const chars = []
  const range = document.createRange()
  for (const { node, style, parent } of collectTextNodes(root)) {
    const size = parseFloat(style.fontSize) || DEFAULT_SIZE
    const weight = parseInt(style.fontWeight, 10) || 400
    const base = {
      size,
      family: pickFamily(style.fontFamily),
      bold: weight >= 600 || parent.tagName === 'STRONG' || parent.tagName === 'B' || parent.tagName === 'TH',
      italic: style.fontStyle === 'italic' || parent.tagName === 'EM' || parent.tagName === 'I',
      color: parseColor(style.color),
      underline: style.textDecorationLine.includes('underline') || parent.tagName === 'U',
      strike: parent.tagName === 'DEL' || parent.tagName === 'S',
    }
    const text = node.nodeValue
    let lineCenter = null
    let lineIndex = -1
    for (let i = 0; i < text.length; i += 1) {
      if (WS.test(text[i])) continue
      try {
        range.setStart(node, i)
        range.setEnd(node, i + 1)
      } catch {
        continue
      }
      const rects = range.getClientRects()
      if (!rects.length) continue
      const r = rects[rects.length - 1]
      if (!r.width && !r.height) continue
      const y = r.top - origin.top
      const center = y + r.height / 2
      if (lineCenter === null || Math.abs(center - lineCenter) > Math.max(r.height, 1) * 0.5) {
        lineIndex += 1
        lineCenter = center
      }
      chars.push({
        ch: text[i], x: r.left - origin.left, y, w: r.width, h: r.height, lineIndex, ...base,
      })
    }
  }
  return chars
}

/** 字符盒 → 行（按 lineIndex 分组；行内按 x 排序，行间留出排版余量）。 */
function groupLines(chars) {
  const map = new Map()
  for (const c of chars) {
    if (!map.has(c.lineIndex)) map.set(c.lineIndex, [])
    map.get(c.lineIndex).push(c)
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, list]) => {
      list.sort((a, b) => a.x - b.x)
      const top = Math.min(...list.map((c) => c.y))
      const bottom = Math.max(...list.map((c) => c.y + c.h))
      return { chars: list, top, bottom, height: bottom - top }
    })
}

/** 行内相邻同款式的字连成 run：行尾自然对齐字宽，不再逐字算间距。 */
function lineRuns(line) {
  const runs = []
  let run = null
  for (const c of line.chars) {
    const key = `${c.family}|${c.bold}|${c.italic}|${Math.round(c.size * 10)}|${c.color ? c.color.toString() : ''}`
    if (run && run.key === key) {
      run.chars.push(c)
      run.text += c.ch
      continue
    }
    run = { key, chars: [c], text: c.ch }
    runs.push(run)
  }
  return runs
}

// ── 绘制指令 ──────────────────────────────────────────────────────────
/**
 * 一个块 → 指令。文本类指令统一成 { type:'text', lines }，让断页逻辑只有一条路；
 * keepNext = 标题这类"不许落页底"的块（LaTeX 的 penalty = ∞）。
 */
function collectOps(flow, origin) {
  const ops = []
  // 同属一个块的指令共享 block 键：分页时"短块不许拆、超页块逐行拆"靠它判断
  let block = 0
  const nextBlock = () => {
    block += 1
    return block
  }
  const textOp = (el, keepNext = false, owner = null) => {
    const chars = measureChars(el, origin)
    if (!chars.length) return
    ops.push({ type: 'text', lines: groupLines(chars), keepNext, block: owner ?? nextBlock() })
  }
  const boxOp = (el, owner = null) => {
    const style = getComputedStyle(el)
    const bg = parseColor(style.backgroundColor)
    const r = el.getBoundingClientRect()
    const key = owner ?? nextBlock()
    const rect = (x, y, w, h, color) => {
      ops.push({ type: 'rect', x, y, w, h, color, block: key })
    }
    if (bg) rect(r.left - origin.left, r.top - origin.top, r.width, r.height, bg)
    if (style.borderLeftStyle !== 'none' && parseFloat(style.borderLeftWidth) >= 1.5) {
      const border = parseColor(style.borderLeftColor)
      const bw = parseFloat(style.borderLeftWidth)
      if (border) rect(r.left - origin.left, r.top - origin.top, bw, r.height, border)
    }
    // 横线：<hr> 用 border-top，表格行间用 border-bottom，都只在 top 处画一条
    if (style.borderTopStyle !== 'none' && parseFloat(style.borderTopWidth) >= 1) {
      const color = parseColor(style.borderTopColor)
      if (color) {
        ops.push({
          type: 'line', block: key, x1: r.left - origin.left, x2: r.right - origin.left,
          y: r.top - origin.top, thickness: parseFloat(style.borderTopWidth), color,
        })
      }
    }
    if (style.borderBottomStyle !== 'none' && parseFloat(style.borderBottomWidth) >= 1) {
      const color = parseColor(style.borderBottomColor)
      if (color) {
        ops.push({
          type: 'line', block: key, x1: r.left - origin.left, x2: r.right - origin.left,
          y: r.bottom - origin.top, thickness: parseFloat(style.borderBottomWidth), color,
        })
      }
    }
    if (style.borderTopStyle === 'none') {
      // 表格单元格：四边的竖线与横线都要画，否则表格看起来"样式全无"
      for (const side of ['Right', 'Left', 'Bottom']) {
        const kind = style[`border${side}Style`]
        const width = parseFloat(style[`border${side}Width`]) || 0
        if (kind === 'none' || width < 1) continue
        const color = parseColor(style[`border${side}Color`])
        if (!color) continue
        const x = side === 'Right' ? r.right - origin.left : r.left - origin.left
        ops.push({
          type: 'line', block: key, x1: x, x2: x, y1: r.top - origin.top, y2: r.bottom - origin.top,
          thickness: width, color,
        })
      }
    }
  }

  for (const el of flow.children) {
    const tag = el.tagName
    const style = getComputedStyle(el)
    if (style.display === 'none') continue

    if (tag === 'TABLE') {
      // 表格按行断页，表头跟着首行（thead 的 keepNext = 不许落页底）；整张表算一个块
      const key = nextBlock()
      boxOp(el, key)
      const cap = el.querySelector('caption')
      if (cap) textOp(cap, true, key)
      const thead = el.querySelector('thead')
      if (thead) {
        for (const tr of thead.querySelectorAll('tr')) {
          for (const cell of tr.children) boxOp(cell, key)
          textOp(tr, true, key)
        }
      }
      for (const tr of el.querySelectorAll('tbody > tr')) {
        for (const cell of tr.children) boxOp(cell, key)
        textOp(tr, false, key)
      }
      continue
    }

    if (tag === 'PRE') {
      // 高亮器把代码逐行包成 .nb-ln：一行一个断点，长代码可以跨页
      const key = nextBlock()
      const lines = el.querySelectorAll('.nb-ln')
      boxOp(el, key)
      if (lines.length) for (const line of lines) textOp(line, false, key)
      else textOp(el, false, key)
      continue
    }

    if (tag === 'UL' || tag === 'OL') {
      for (const li of el.children) {
        if (li.tagName !== 'LI') continue
        const key = nextBlock()
        const liStyle = getComputedStyle(li)
        const size = parseFloat(liStyle.fontSize) || DEFAULT_SIZE
        if (liStyle.listStyleType && liStyle.listStyleType !== 'none') {
          // 列表标记单独成一个字符盒：浏览器不给量 li 的 ::marker 矩形
          const r = li.getBoundingClientRect()
          const marker = tag === 'OL'
            ? `${Array.from(el.children).indexOf(li) + 1}.`
            : '•'
          ops.push({
            type: 'text',
            block: key,
            lines: [{
              chars: [{
                ch: marker, x: r.left - origin.left - 14, y: r.top - origin.top, w: 14, h: size,
                size, family: pickFamily(liStyle.fontFamily), bold: false, italic: false, color: INK,
              }],
              top: r.top - origin.top,
              bottom: r.top - origin.top + size,
              height: size,
            }],
          })
        }
        textOp(li, false, key)
      }
      continue
    }

    if (tag === 'IMG' || tag === 'SVG') {
      const r = el.getBoundingClientRect()
      ops.push({ type: 'image', el, block: nextBlock(), x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height })
      continue
    }

    if (tag === 'HR') {
      const r = el.getBoundingClientRect()
      ops.push({ type: 'line', block: nextBlock(), x1: r.left - origin.left, x2: r.right - origin.left, y: r.top - origin.top, thickness: 1, color: rgb(0.82, 0.85, 0.88) })
      continue
    }

    {
      const key = nextBlock()
      boxOp(el, key)
      textOp(el, ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'CAPTION'].includes(tag), key)
    }
  }
  return ops
}

/** 公式先由 KaTeX 排出来，再按普通文字量坐标（矢量输出，不是截图）。 */
function typesetMath(stage) {
  for (const el of stage.querySelectorAll('[data-tex]')) {
    if (el.dataset.pdfDone) continue
    const tex = el.getAttribute('data-tex')
    if (!tex) continue
    try {
      const display = el.classList.contains('laup2-math-display') || el.classList.contains('laup-math-display')
      katex.render(tex, el, { throwOnError: false, displayMode: display })
      el.dataset.pdfDone = '1'
    } catch { /* 公式非法时保留原文 */ }
  }
}

function ensureStageStyle() {
  if (document.getElementById('nb-measure-style')) return
  const style = document.createElement('style')
  style.id = 'nb-measure-style'
  style.textContent = MEASURE_CSS
  document.head.appendChild(style)
}

/** 隐藏工作区退出可见区域，但仍参与排版（不能 display:none，否则量不到矩形）。 */
function ensureStageCss() {
  if (document.getElementById('nb-pdf-stage-style')) return
  const style = document.createElement('style')
  style.id = 'nb-pdf-stage-style'
  style.textContent = `
    .nb-pdf-stage { position: absolute; left: -100000px; top: 0; visibility: visible; pointer-events: none; }
    .nb-pdf-stage .nb-flow + .nb-flow { margin-top: 0; }
  `
  document.head.appendChild(style)
}

// ── 分页 ──────────────────────────────────────────────────────────────
// 指令 → 页。断点模型对齐 LaTeX 的 penalties：
//   · 行是唯一可断点（段落内部、代码行间、表格行间）
//   · 标题 keepNext：不允许成为页尾最后一块（它到页底就带上后面的内容一起挪）
//   · 短块整块挪页；比整页还高的块退化为行级硬切
// 同一 block 键的指令（背景矩形 + 文字 + 表格线）永远同页、同位移，底色不会跑到上一页。
function layoutPages(ops, bodyHeight) {
  const pages = [[]]
  let cursor = 0
  const current = () => pages[pages.length - 1]
  const nextPage = () => {
    pages.push([])
    cursor = 0
  }
  const nextBlockOp = (index) => {
    for (let j = index + 1; j < ops.length; j += 1) {
      if (ops[j].block !== ops[index].block) return ops[j]
    }
    return null
  }
  // 页尾不许落一个标题（keepNext）
  const fitsTail = (height, following) => {
    if (cursor + height <= bodyHeight) return true
    if (cursor === 0) return true
    return !following?.keepNext
  }

  for (let i = 0; i < ops.length; i += 1) {
    const op = ops[i]

    if (op.type !== 'text') {
      const height = op.type === 'line' ? 0 : op.h || 0
      if (op.type !== 'line' && !fitsTail(height, nextBlockOp(i))) {
        nextPage()
        current().push({ ...op })
        cursor = height
        continue
      }
      current().push(op)
      cursor += height
      continue
    }

    const { lines } = op
    const height = lines[lines.length - 1].bottom - lines[0].top

    if (cursor + height <= bodyHeight) {
      const shift = cursor - lines[0].top
      current().push({ ...op, shift, lines: lines.map((line) => shiftLine(line, shift)) })
      cursor += height
      continue
    }

    if (height <= bodyHeight) {
      // 整块放不下 → 整体挪到下一页（短段落 / 标题 / 图注都走这条）
      if (cursor > 0) nextPage()
      const shift = cursor - lines[0].top
      current().push({ ...op, shift, lines: lines.map((line) => shiftLine(line, shift)) })
      cursor += height
      continue
    }

    // 比整页还高：逐行切
    for (let i2 = 0; i2 < lines.length; i2 += 1) {
      const line = lines[i2]
      if (cursor + line.height > bodyHeight && cursor > 0) nextPage()
      const shift = cursor - line.top
      current().push({ ...op, shift, lines: [shiftLine(line, shift)] })
      cursor += line.height
    }
  }
  return pages
}

function shiftLine(line, shift) {
  return {
    ...line,
    top: line.top + shift,
    bottom: line.bottom + shift,
    chars: line.chars.map((c) => ({ ...c, y: c.y + shift })),
  }
}

// ── 主入口 ────────────────────────────────────────────────────────────
/**
 * @param {{ pagesHtml: string[], sheet?: object, title?: string, dark?: boolean, onProgress?: (msg:string)=>void }} options
 *   sheet 与屏幕上的纸同一份尺寸（96dpi px），默认 A4（210×297mm，页边 18/16mm）。
 */
export async function exportHtmlToPdf({ pagesHtml, sheet = A4_SHEET, title = 'Laup 文档', onProgress } = {}) {
  if (!pagesHtml?.length) throw new Error('还没有可导出的内容')
  const progress = onProgress || (() => {})
  progress('准备排版…')

  ensureStageStyle()
  ensureStageCss()
  const bodyW = sheet.width - sheet.padLeft - sheet.padRight
  const bodyH = sheet.height - sheet.padTop - sheet.padBottom

  // 隐藏工作区：宽度 = 版心宽，样式复用纸面那一份（.nb-measure-root）
  const stage = document.createElement('div')
  stage.className = 'nb-measure-root nb-sheet-measure nb-pdf-stage'
  stage.style.width = `${bodyW}px`
  stage.innerHTML = pagesHtml.map((html) => `<div class="nb-flow">${html}</div>`).join('')
  document.body.appendChild(stage)

  let pdf = null
  try {
    await Promise.all(Array.from(stage.querySelectorAll('img')).map((img) => (img.complete
      ? Promise.resolve()
      : new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true })
        img.addEventListener('error', resolve, { once: true })
      }))))
    typesetMath(stage)
    if (document.fonts?.ready) await document.fonts.ready

    const origin = stage.getBoundingClientRect()
    const ops = []
    for (const flow of stage.children) ops.push(...collectOps(flow, origin))

    const layout = layoutPages(ops, bodyH)
    progress(`排版完成，共 ${layout.length} 页`)

    pdf = await PDFDocument.create()
    pdf.registerFontkit(fontkit)
    pdf.setTitle(title)
    pdf.setCreator('Laup v2')
    pdf.setProducer('Laup v2')

    // 每种族 × 字重只嵌入一次。pdf-lib 会在 save() 时自动完成字体嵌入，
    // 这里不调用 PDFFont 的内部 embedder API，避免版本差异导致导出失败。
    const glyphMapCache = new Map()
    async function glyphMapFor(family, bold) {
      const files = FONT_FILES[family] || FONT_FILES.serif
      const url = bold ? files.bold : files.regular
      const key = `${family}|${bold ? 'b' : 'r'}`
      if (!glyphMapCache.has(key)) {
        try {
          const bytes = new Uint8Array(await loadFontBytes(url))
          // 中文字体不能使用子集字体：pdf-lib 的子集编码在逐字绘制时会重排字形，
          // 部分 PDF 阅读器会把 CID 当成错误字符，最终显示为乱码。直接嵌入完整字体，
          // 让每次 drawText 都使用稳定的 Unicode → CID 映射。
          const font = await pdf.embedFont(bytes, {
            subset: false,
            customName: `${family}${bold ? 'B' : 'R'}`,
          })
          glyphMapCache.set(key, { font })
        } catch (error) {
          // Bold 缺失时退回同族常规字重，不让整次导出失败
          if (bold) return glyphMapFor(family, false)
          throw error
        }
      }
      return glyphMapCache.get(key)
    }

    // 图片先解码（pdf-lib 直接吃 PNG / JPG 字节）
    const imageCache = new Map()
    for (const op of ops) {
      if (op.type !== 'image' || !op.w || !op.h) continue
      if (op.el.tagName !== 'IMG') continue
      try {
        const res = await fetch(op.el.currentSrc || op.el.src)
        const bytes = new Uint8Array(await res.arrayBuffer())
        const isPng = bytes[0] === 0x89 && bytes[1] === 0x50
        imageCache.set(op, isPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes))
      } catch {
        // 跨域图片取不到字节：跳过这一张，不中断导出
      }
    }

    // PDF 页按真实 A4（595×842pt）出，绘制坐标从 96dpi px 换算成 pt
    const PAGE_W = SHEET_MM.width * 72 / 25.4
    const PAGE_H = SHEET_MM.height * 72 / 25.4

    for (let p = 0; p < layout.length; p += 1) {
      const opsOnPage = layout[p]
      const page = pdf.addPage([PAGE_W, PAGE_H])
      const X = (x) => (sheet.padLeft + x) * PT_PER_PX
      const Y = (y) => PAGE_H - (sheet.padTop + y) * PT_PER_PX

      // 本页需要的字按族收集，再逐族嵌子集
      const needed = new Map()
      for (const op of opsOnPage) {
        if (op.type !== 'text') continue
        for (const line of op.lines) {
          for (const c of line.chars) {
            const key = `${c.family}|${c.bold ? 'b' : 'r'}`
            if (!needed.has(key)) needed.set(key, { family: c.family, bold: !!c.bold, chars: new Set() })
            needed.get(key).chars.add(c.ch)
          }
        }
      }
      for (const item of needed.values()) {
        await glyphMapFor(item.family, item.bold)
      }

      // 底：背景、表格线、图片（先画，避免盖住文字）
      for (const op of opsOnPage) {
        if (op.type === 'rect') {
          page.drawRectangle({
            x: X(op.x), y: Y(op.y + op.h), width: op.w * PT_PER_PX, height: op.h * PT_PER_PX, color: op.color,
          })
        } else if (op.type === 'line') {
          page.drawLine({
            start: { x: X(op.x1), y: Y(op.y1 ?? op.y) },
            end: { x: X(op.x2), y: Y(op.y2 ?? op.y) },
            thickness: (op.thickness || 1) * PT_PER_PX,
            color: op.color || rgb(0.82, 0.85, 0.88),
          })
        } else if (op.type === 'image') {
          const image = imageCache.get(op)
          if (image) {
            page.drawImage(image, {
              x: X(op.x), y: Y(op.y + op.h), width: op.w * PT_PER_PX, height: op.h * PT_PER_PX,
            })
          }
        }
      }

      // 文字：一行一行、一段一段连起来画，行尾自然按真实字宽对齐
      for (const op of opsOnPage) {
        if (op.type !== 'text') continue
        for (const line of op.lines) {
          for (const run of lineRuns(line)) {
            const c0 = run.chars[0]
            const key = `${c0.family}|${c0.bold ? 'b' : 'r'}`
            const { font } = await glyphMapFor(c0.family, c0.bold)
            const color = c0.color || INK
            const size = c0.size * PT_PER_PX
            for (const char of run.chars) {
              const encoded = canEncode(font, char.ch)
              if (!encoded) continue
              page.drawText(char.ch, {
                x: X(char.x),
                y: Y(char.y + char.size * 0.82),
                size,
                font,
                color,
                // 有斜体样式但字体没有斜体时，用合成斜切
                ...(char.italic ? { xSkew: { angle: 12 } } : {}),
              })
            }
            if (c0.underline || c0.strike) {
              const last = run.chars[run.chars.length - 1]
              const yLine = c0.underline ? c0.y + c0.h : c0.y + c0.h / 2
              page.drawLine({
                start: { x: X(c0.x), y: Y(yLine) },
                end: { x: X(last.x + last.w), y: Y(yLine) },
                thickness: 0.6,
                color,
              })
            }
          }
        }
      }
    }

    progress('写入文件…')
    return await pdf.save()
  } finally {
    stage.remove()
  }
}

export function downloadPdf(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

/** 屏幕上的纸：A4（210×297mm），页边 18mm / 16mm。坐标统一用 96dpi px。 */
export const SHEET_MM = {
  width: 210, height: 297, padTop: 18, padRight: 16, padBottom: 18, padLeft: 16,
}

export const A4_SHEET = {
  width: 210 * PX_PER_MM,
  height: 297 * PX_PER_MM,
  padTop: 18 * PX_PER_MM,
  padRight: 16 * PX_PER_MM,
  padBottom: 18 * PX_PER_MM,
  padLeft: 16 * PX_PER_MM,
}
