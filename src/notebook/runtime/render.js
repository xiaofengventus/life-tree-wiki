// 把内核发回的 iopub 消息拼成一段可显示的 HTML。
// 只做「消息 → HTML」这一件事：不碰 store、不知道当前是哪一格，
// 因此可以脱离编辑器单独测试。所有来自内核的 HTML 一律过 sanitizeHtml
// （与 Laup 输出同一道消毒），避免本机内核里的第三方库往页面里塞脚本。

import { sanitizeHtml } from '../renderer.js'

const esc = (text) => String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// \u001b[31m 之类的终端控制序列：报错栈里很多，原样显示会满屏乱码
// （ESC 用 fromCharCode 拼出来，避免 lint 把正则里的控制字符当错误）
const ANSI_RE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;?]*[ -/]*[@-~]`, 'g')
export function stripAnsi(text) {
  return String(text ?? '').replace(ANSI_RE, '')
}

const textOf = (value) => (Array.isArray(value) ? value.join('') : String(value ?? ''))

const IMAGE_MIME = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

/** 一张输出图：内核发的是 base64 字符串（data URL 前缀由我们补）。 */
function imageHtml(mime, value) {
  const base64 = String(value ?? '').replace(/\s+/g, '')
  if (!base64) return ''
  return `<img class="rt-img" src="data:${mime};base64,${base64}" alt="内核输出图片">`
}

/**
 * 按 MIME 优先级取一种表现形式：
 * text/html > svg > png/jpeg > text/latex > json > text/plain。
 * （Jupyter 的惯例：同一份结果会附多种 MIME，展示端挑自己最擅长的一种。）
 */
function displayHtml(data = {}) {
  if (data['text/html'] !== undefined) {
    return `<div class="rt-html">${sanitizeHtml(textOf(data['text/html']))}</div>`
  }
  if (data['image/svg+xml'] !== undefined) {
    return `<div class="rt-html">${sanitizeHtml(textOf(data['image/svg+xml']))}</div>`
  }
  for (const mime of Object.keys(IMAGE_MIME)) {
    if (data[mime] !== undefined) return imageHtml(mime, data[mime])
  }
  // LaTeX 不在这里排成公式（KaTeX 由 OutputArea 的 renderMathIn 负责），先原样显示
  if (data['text/latex'] !== undefined) {
    return `<pre class="rt-text">${esc(stripAnsi(textOf(data['text/latex'])))}</pre>`
  }
  if (data['application/json'] !== undefined) {
    try {
      return `<pre class="rt-text">${esc(JSON.stringify(data['application/json'], null, 2))}</pre>`
    } catch {
      return `<pre class="rt-text">${esc(String(data['application/json']))}</pre>`
    }
  }
  if (data['text/plain'] !== undefined) {
    return `<pre class="rt-text">${esc(stripAnsi(textOf(data['text/plain'])))}</pre>`
  }
  return ''
}

/**
 * 累积一次执行的输出。
 * push() 吃 iopub 消息（stream / display_data / execute_result / error / clear_output），
 * toHtml() 给出当前的完整 HTML —— 边执行边刷新就是每来一条 push 一次、再 toHtml 一次。
 */
export class OutputCollector {
  constructor() {
    this.items = []
    this.dirty = false
  }

  push(msg) {
    const type = msg.header?.msg_type
    const content = msg.content || {}
    switch (type) {
      case 'stream':
        this._stream(content.name, content.text)
        break
      case 'execute_result':
      case 'display_data':
        this._display(content)
        break
      case 'update_display_data':
        this._updateDisplay(content)
        break
      case 'error':
        this._error(content)
        break
      case 'clear_output':
        this.items = []
        this.dirty = true
        break
      default:
        break
    }
  }

  // 相邻的同类流合并：print 循环会一条一条地来，不合并就是几千个 <pre>
  _stream(name, text) {
    const chunk = stripAnsi(textOf(text))
    if (!chunk) return
    const last = this.items[this.items.length - 1]
    if (last && last.kind === 'stream' && last.name === name) {
      last.text += chunk
    } else {
      this.items.push({ kind: 'stream', name: name === 'stderr' ? 'stderr' : 'stdout', text: chunk })
    }
    this.dirty = true
  }

  _display(content) {
    const html = displayHtml(content.data)
    if (!html) return
    this.items.push({
      kind: 'display',
      html,
      displayId: content.transient?.display_id || '',
    })
    this.dirty = true
  }

  _updateDisplay(content) {
    const html = displayHtml(content.data)
    const displayId = content.transient?.display_id || ''
    if (!html) return
    if (displayId) {
      const target = this.items.find((item) => item.kind === 'display' && item.displayId === displayId)
      if (target) {
        target.html = html
        this.dirty = true
        return
      }
    }
    this.items.push({ kind: 'display', html, displayId })
    this.dirty = true
  }

  _error(content) {
    const traceback = Array.isArray(content.traceback) ? content.traceback.join('\n') : ''
    const text = stripAnsi(traceback || `${content.ename || 'Error'}: ${content.evalue || ''}`)
    this.items.push({ kind: 'error', text })
    this.dirty = true
  }

  toHtml() {
    if (!this.items.length) return ''
    const body = this.items.map((item) => {
      if (item.kind === 'stream') {
        return `<pre class="rt-stream${item.name === 'stderr' ? ' is-stderr' : ''}">${esc(item.text)}</pre>`
      }
      if (item.kind === 'error') {
        return `<pre class="error-out rt-error">${esc(item.text)}</pre>`
      }
      return item.html
    }).join('')
    return body ? `<div class="rt-out">${body}</div>` : ''
  }
}

/** 运行中的占位（由 store 拼在预览后面）。 */
export const RUNNING_HTML = '<div class="rt-out rt-out-running"><span class="rt-running">运行中…</span></div>'

// 内核输出与「文档预览」的分界标记：右侧纸面 / 导出 PDF 只取标记之前的部分，
// 实时输出属于这台机器的这一刻，不该印进文章里。
export const RUNTIME_MARK = '<!--laup-runtime-->'
