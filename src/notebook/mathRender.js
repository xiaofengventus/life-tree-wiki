import katex from 'katex'
import 'katex/dist/katex.min.css'
import { translate } from '../utils/mathKit.js'

/**
 * 把 Laup 产物里的公式节点（<span/div class="laup-math*" data-tex="…">）排成 KaTeX。
 *
 * 编译器只输出带 data-tex 的占位，排版交给宿主。格下预览、右侧纸面、导出 PDF
 * 都必须走这一个函数，否则就会出现「左边公式排好了、右边还是一串 \mathbf」。
 */
export function renderMathIn(root) {
  if (!root) return
  for (const el of root.querySelectorAll('[data-tex]')) {
    if (el.dataset.texDone) continue
    const raw = el.getAttribute('data-tex')
    if (!raw) continue
    const display = el.classList.contains('laup-math-display') || el.classList.contains('laup2-math-display')
    try {
      katex.render(translate(raw) ?? raw, el, { throwOnError: false, displayMode: display })
      el.dataset.texDone = '1'
    } catch { /* 公式非法时保留原文 */ }
  }
}
