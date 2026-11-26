// 导出独立 HTML：只有文档正文，不带站点导航、不带分页。
//
// 复用排版样式（printStyle 的 DOC_CSS，与格下预览 / 纸面 / PDF 同一份规则），
// 公式不引 KaTeX 的 CSS 与字体（那需要额外 20 多个字体文件），而是转成浏览器原生
// MathML —— 双击打开就能看，离线、单文件、不依赖任何外部资源。

import katex from 'katex'
import { translate } from '@/utils/mathKit.js'
import { DOC_CSS } from './printStyle.js'

const escapeHtml = (text) => String(text ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * 把公式占位（[data-tex]）换成原生 MathML。
 * 格子里的 outputHtml 只带占位属性，KaTeX 排版原本发生在 DOM 上，
 * 导出时没法复用那份 DOM，所以这里按同一套 translate + display 判定重排一遍。
 */
function inlineMath(root) {
  for (const el of root.querySelectorAll('[data-tex]')) {
    const raw = el.getAttribute('data-tex')
    if (!raw) continue
    const display = el.classList.contains('laup-math-display') || el.classList.contains('laup2-math-display')
    try {
      el.innerHTML = katex.renderToString(translate(raw) ?? raw, {
        throwOnError: false,
        displayMode: display,
        output: 'mathml',
      })
    } catch { /* 公式非法时保留原文，和预览一致 */ }
  }
}

/** 生成一份可独立打开的 HTML 文档字符串。 */
export function buildHtmlDocument({ html, title = 'Laup 文档' }) {
  const holder = document.createElement('div')
  holder.innerHTML = String(html ?? '')
  inlineMath(holder)
  // 「运行中…」是编辑时的临时反馈，不进导出文件
  for (const node of holder.querySelectorAll('.rt-out-running')) node.remove()
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: light; }
  html, body { margin: 0; padding: 0; background: #fff; }
  .nb-doc { max-width: 780px; margin: 48px auto 80px; padding: 0 24px; }
  @media (max-width: 720px) { .nb-doc { margin: 24px auto 48px; padding: 0 16px; } }
  ${DOC_CSS('.nb-doc')}
</style>
</head>
<body>
<div class="nb-doc">
${holder.innerHTML}
</div>
</body>
</html>
`
}

/** 去掉文件名里系统不认的字符（标题往往带问号、冒号）。 */
export function safeFileName(name, fallback = 'laup') {
  const cleaned = String(name || '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
  return cleaned || fallback
}

/** 触发下载（Blob + a[download]，不经过服务器）。 */
export function downloadHtml(html, filename) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
