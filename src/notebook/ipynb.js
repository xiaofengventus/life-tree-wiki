/**
 * Jupyter Notebook（.ipynb）→ Notebook 格。
 *
 * 映射规则（只做「能对上就对上」，不做脑补）：
 *   markdown → laup 格：正文按 Laup 解析；Jupyter 的 \(…\) / \[…\] 折成 $…$ / $$…$$
 *   code     → `[语言]` 代码格；语言由 kernelspec 决定，认不出就退到 `[text]`
 *   code 输出 → 有文本输出时追加一个 `[output]` 格（对照卡的单栏形态）
 *   raw      → `\begin{stay}…\end{stay}`，完全原样
 *   附件     → cell.attachments（base64）转成 dataURL 存进格的 attachments，
 *              markdown 里的 `attachment:xxx` 引用保持不动，由 kernelV2 换回 dataURL。
 *
 * 这样导入后的文档仍是标准 Laup：能继续编辑、导出 .laup、提交发布。
 */

const cellId = () => 'cell-' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)

const makeCell = (type, source, attachments = {}) => ({
  id: cellId(),
  type,
  source,
  attachments,
  execCount: null,
  outputHtml: '',
})

// 只映射到「能被 Notebook 认作语言声明」的名字（见 utils/codeLang.js 的 DECLARABLE），
// 认不出的语言统一退到 text，避免首行 `[r]` 被当成正文。
const LANG_MAP = {
  python: 'python', python3: 'python', ipython: 'python', ipython3: 'python',
  javascript: 'javascript', node: 'javascript', typescript: 'javascript', js: 'javascript',
  c: 'c', cpp: 'cpp', 'c++': 'cpp',
  bash: 'bash', shell: 'bash', sh: 'bash', zsh: 'bash', console: 'bash',
  json: 'json', html: 'html', css: 'css',
}

function kernelLanguage(notebook) {
  const meta = notebook?.metadata || {}
  const raw = String(
    meta.kernelspec?.language || meta.language_info?.name || 'python',
  ).toLowerCase()
  return LANG_MAP[raw] || 'text'
}

const asText = (value) => (Array.isArray(value) ? value.join('') : String(value ?? ''))

/** 把 Jupyter 的 \(…\) / \[…\] 折成 Laup 的 $…$ / $$…$$（跳过围栏与行内代码） */
export function convertMath(text) {
  const chunks = []
  // 私有区字符做占位符：正文里正常不会出现，也不触发 lint 的「控制字符」告警
  const mark = (index) => `\uE000${index}\uE000`
  const mask = (input, pattern) =>
    input.replace(pattern, (match) => mark(chunks.push(match) - 1))

  let out = mask(String(text ?? ''), /^([ \t]{0,3})(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\2[ \t]*$/gm)
  out = mask(out, /`[^`\n]*`/g)
  out = out
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, tex) => `$$${tex}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, tex) => `$${tex}$`)
  return out.replace(/\uE000(\d+)\uE000/g, (_, index) => chunks[Number(index)] ?? '')
}

/** ipynb 的 cell.attachments → 格的 attachments（name → dataURL） */
function readAttachments(raw) {
  const out = {}
  for (const [name, mimes] of Object.entries(raw || {})) {
    const entry = Object.entries(mimes || {})[0]
    if (!entry) continue
    const [mime, data] = entry
    if (!mime || !data) continue
    out[name] = `data:${mime};base64,${String(data).replace(/\s+/g, '')}`
  }
  return out
}

/** 代码格的可读文本输出（stream / execute_result / display_data / error） */
function outputText(outputs) {
  const parts = []
  for (const item of Array.isArray(outputs) ? outputs : []) {
    if (item?.output_type === 'stream') {
      parts.push(asText(item.text))
      continue
    }
    if (item?.output_type === 'execute_result' || item?.output_type === 'display_data') {
      const plain = item.data?.['text/plain']
      if (plain) parts.push(asText(plain))
      continue
    }
    if (item?.output_type === 'error') {
      const name = item.ename ? `${item.ename}: ` : ''
      parts.push(name + asText(item.evalue))
    }
  }
  return parts.join('').replace(/\s+$/, '')
}

/**
 * @param {string|object} input ipynb 文本或已解析对象
 * @returns {{ cells: object[], stats: { markdown: number, code: number, raw: number, outputs: number, skipped: number } }}
 */
export function ipynbToCells(input) {
  let notebook = input
  if (typeof input === 'string') {
    try {
      notebook = JSON.parse(input)
    } catch {
      throw new Error('文件不是有效的 JSON')
    }
  }
  if (!notebook || !Array.isArray(notebook.cells)) {
    throw new Error('不是有效的 ipynb：缺少 cells')
  }

  const lang = kernelLanguage(notebook)
  const cells = []
  const stats = { markdown: 0, code: 0, raw: 0, outputs: 0, skipped: 0 }

  for (const raw of notebook.cells) {
    const body = asText(raw?.source)
    const type = raw?.cell_type

    if (type === 'markdown') {
      if (!body.trim()) {
        stats.skipped += 1
        continue
      }
      cells.push(makeCell('laup', convertMath(body), readAttachments(raw.attachments)))
      stats.markdown += 1
      continue
    }

    if (type === 'code') {
      if (!body.trim()) {
        stats.skipped += 1
        continue
      }
      // 代码格首行必须是语言声明；正文末尾空行去掉，免得导出时多出一堆空行
      cells.push(makeCell('code', `[${lang}]\n${body.replace(/\s+$/, '')}`))
      stats.code += 1

      const text = outputText(raw.outputs)
      if (text.trim()) {
        cells.push(makeCell('code', `[output]\n${text}`))
        stats.outputs += 1
      }
      continue
    }

    if (type === 'raw') {
      if (!body.trim()) {
        stats.skipped += 1
        continue
      }
      cells.push(makeCell('laup', `\\begin{stay}\n${body.replace(/\s+$/, '')}\n\\end{stay}`))
      stats.raw += 1
    }
  }

  if (!cells.length) throw new Error('这个 notebook 里没有可导入的单元格')
  return { cells, stats }
}
