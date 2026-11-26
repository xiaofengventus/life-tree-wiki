// 本机 Jupyter Server 的纯协议层：HTTP 控制面 + WebSocket 内核通道。
// 这里不引用 Vue、Pinia、store 或任何编辑器状态 —— 只负责「说话」，
// 上层（runtime/index.js）怎么用、界面怎么显示都与它无关，也方便单独替换。
//
// 对应 Jupyter Server 5.x / JupyterLab 的公开接口：
//   GET  /api/status                     服务是否就绪
//   GET  /api/kernelspecs                可用内核列表
//   POST /api/kernels                    启动内核 { name }
//   POST /api/kernels/<id>/interrupt     中断
//   POST /api/kernels/<id>/restart       重启
//   DEL  /api/kernels/<id>               关闭
//   WS   /api/kernels/<id>/channels      消息通道（Jupyter 消息协议 5.3）

import { OutputCollector } from './render.js'

const PROTOCOL_VERSION = '5.3'

/** 协议层错误：带一句给用户看的原因与一条可操作的提示。 */
export class RuntimeError extends Error {
  constructor(message, hint = '') {
    super(message)
    this.name = 'RuntimeError'
    this.hint = hint
  }
}

/** 生成 UUID（crypto.randomUUID 在非安全上下文里可能没有）。 */
export function uuid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

/**
 * 解析用户粘贴的连接串：`https://127.0.0.1:8888/?token=abc` → { baseUrl, token }。
 * 只填主机端口（`127.0.0.1:8888`）也行；空串返回空值，由上层给提示。
 */
export function parseConnection(raw) {
  const text = String(raw ?? '').trim()
  if (!text) return { baseUrl: '', token: '' }
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `http://${text}`)
    return {
      baseUrl: `${url.protocol}//${url.host}${url.pathname.replace(/\/+$/, '')}`,
      token: url.searchParams.get('token') || url.searchParams.get('password') || '',
    }
  } catch {
    return { baseUrl: '', token: '' }
  }
}

/** 只归一化地址（不带 token 的输入也能用）。 */
export function normalizeBaseUrl(raw) {
  return parseConnection(raw).baseUrl
}

/** 通道地址：http→ws、https→wss，token 走查询串（浏览器 WS 不能带自定义头）。 */
function channelsUrl(baseUrl, kernelId, sessionId, token) {
  const url = new URL(`${baseUrl}/api/kernels/${encodeURIComponent(kernelId)}/channels`)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.searchParams.set('session_id', sessionId)
  if (token) url.searchParams.set('token', token)
  return url.toString()
}

export class JupyterClient {
  constructor({ baseUrl, token = '' } = {}) {
    this.baseUrl = normalizeBaseUrl(baseUrl)
    this.token = String(token ?? '')
  }

  async request(path, { method = 'GET', body = null } = {}) {
    const url = `${this.baseUrl}${path}`
    const headers = {}
    if (this.token) headers.Authorization = `token ${this.token}`
    if (body !== null) headers['Content-Type'] = 'application/json'
    const options = { method, headers, credentials: 'omit' }
    if (body !== null) options.body = JSON.stringify(body)
    let response
    try {
      response = await fetch(url, options)
    } catch {
      throw new RuntimeError(
        `连不上本机 Jupyter（${url}）。`,
        `先在浏览器里打开 ${this.baseUrl} ：如果提示「您的连接不是私密连接」，点「高级 → 继续前往」信任一次证书；` +
        '若打不开，说明本地服务还没启动，请双击 tools/local-runtime 里的启动器。',
      )
    }
    if (response.status === 401 || response.status === 403) {
      throw new RuntimeError(
        '令牌不对（token 无效）。',
        '请从启动器窗口里复制完整的连接串（结尾带 ?token=…），不要只复制地址。',
      )
    }
    if (response.status === 404) {
      throw new RuntimeError(
        `这个地址不是 Jupyter 服务（404）：${url}`,
        '确认端口是启动器打印的那个；如果 Jupyter 配了 base_url（如 /jupyter/），要把路径也一起填进来。',
      )
    }
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new RuntimeError(`Jupyter 返回 ${response.status}${text ? '：' + text.slice(0, 200) : ''}。`)
    }
    if (response.status === 204) return null
    return response.json()
  }

  status() {
    return this.request('/api/status')
  }

  kernelspecs() {
    return this.request('/api/kernelspecs')
  }

  listKernels() {
    return this.request('/api/kernels')
  }

  startKernel(name) {
    return this.request('/api/kernels', { method: 'POST', body: { name } })
  }

  shutdownKernel(kernelId) {
    return this.request(`/api/kernels/${encodeURIComponent(kernelId)}`, { method: 'DELETE' })
  }

  interruptKernel(kernelId) {
    return this.request(`/api/kernels/${encodeURIComponent(kernelId)}/interrupt`, { method: 'POST', body: {} })
  }

  restartKernel(kernelId) {
    return this.request(`/api/kernels/${encodeURIComponent(kernelId)}/restart`, { method: 'POST', body: {} })
  }
}

// execute_reply 等「请求-应答」型消息：收到就结束这一次等待
const REPLY_TYPES = new Set(['execute_reply', 'kernel_info_reply', 'interrupt_reply', 'shutdown_reply', 'complete_reply'])

export class KernelChannel {
  constructor({ socket, sessionId }) {
    this.socket = socket
    this.sessionId = sessionId
    this.pending = new Map()
    this.closed = false
    this.onClose = null
    socket.addEventListener('message', (event) => this._onMessage(event))
    socket.addEventListener('close', () => {
      this.closed = true
      for (const handler of this.pending.values()) {
        handler.reject?.(new RuntimeError('内核通道已关闭。', 'Jupyter 可能停止或重启了，请重新连接。'))
      }
      this.pending.clear()
      this.onClose?.()
    })
  }

  /** 打开通道；连不上（证书未信任 / 不是 Jupyter）时给出可读原因。 */
  static open({ baseUrl, token, kernelId, sessionId }) {
    const url = channelsUrl(baseUrl, kernelId, sessionId, token)
    return new Promise((resolve, reject) => {
      let socket
      try {
        socket = new WebSocket(url)
      } catch {
        reject(new RuntimeError('内核通道地址不合法。', url))
        return
      }
      const timer = setTimeout(() => {
        socket.close()
        reject(new RuntimeError('内核通道连接超时（15 秒）。', `确认 ${baseUrl} 在浏览器里能打开，且已信任证书。`))
      }, 15000)
      socket.addEventListener('open', () => {
        clearTimeout(timer)
        resolve(new KernelChannel({ socket, sessionId }))
      }, { once: true })
      socket.addEventListener('error', () => {
        clearTimeout(timer)
        reject(new RuntimeError(
          '内核通道连不上（WebSocket 被拒绝）。',
          `多半是证书没被信任：先在浏览器打开 ${baseUrl} 点「继续前往」，回来再连。`,
        ))
      }, { once: true })
    })
  }

  _send(msgType, content) {
    if (this.closed || this.socket.readyState !== WebSocket.OPEN) {
      throw new RuntimeError('内核通道已关闭。', '请重新连接本机内核。')
    }
    const msgId = uuid()
    this.socket.send(JSON.stringify({
      header: {
        msg_id: msgId,
        username: 'laup',
        session: this.sessionId,
        msg_type: msgType,
        version: PROTOCOL_VERSION,
        date: new Date().toISOString(),
      },
      parent_header: {},
      metadata: {},
      content,
      channel: 'shell',
      buffers: [],
    }))
    return msgId
  }

  _onMessage(event) {
    let msg
    try {
      msg = JSON.parse(event.data)
    } catch {
      return
    }
    const parentId = msg.parent_header?.msg_id
    const handler = parentId ? this.pending.get(parentId) : null
    if (!handler) return
    handler.onMessage?.(msg)
    if (REPLY_TYPES.has(msg.header?.msg_type)) handler.onReply?.(msg)
  }

  /** 等内核真正可用（发 kernel_info_request，收到回复即算就绪）。 */
  waitReady(timeout = 30000) {
    return new Promise((resolve, reject) => {
      let msgId
      const timer = setTimeout(() => {
        this.pending.delete(msgId)
        reject(new RuntimeError(`内核启动超时（${Math.round(timeout / 1000)} 秒）。`, '内核可能缺依赖；在 JupyterLab 里看内核是否正常。'))
      }, timeout)
      try {
        msgId = this._send('kernel_info_request', {})
      } catch (error) {
        clearTimeout(timer)
        reject(error)
        return
      }
      this.pending.set(msgId, {
        onReply: () => {
          clearTimeout(timer)
          this.pending.delete(msgId)
          resolve()
        },
        reject: (error) => {
          clearTimeout(timer)
          reject(error)
        },
      })
    })
  }

  /**
   * 执行一段代码。输出边到边回调（onUpdate 收到的是累积后的 HTML），
   * 执行结束（execute_reply）时带上最终 HTML 与执行序号。
   */
  execute(code, { onUpdate = null } = {}) {
    const collector = new OutputCollector()
    return new Promise((resolve, reject) => {
      let msgId
      try {
        msgId = this._send('execute_request', {
          code: String(code ?? ''),
          silent: false,
          store_history: true,
          user_expressions: {},
          allow_stdin: false,
          stop_on_error: false,
        })
      } catch (error) {
        reject(error)
        return
      }
      this.pending.set(msgId, {
        onMessage: (msg) => {
          collector.push(msg)
          if (collector.dirty) {
            collector.dirty = false
            try {
              onUpdate?.(collector.toHtml())
            } catch { /* 界面回调的异常不该掐断执行 */ }
          }
        },
        onReply: (msg) => {
          this.pending.delete(msgId)
          const content = msg.content || {}
          resolve({
            html: collector.toHtml(),
            executionCount: content.execution_count ?? null,
            status: content.status || 'ok',
          })
        },
        reject,
      })
    })
  }

  close() {
    try {
      this.socket.close()
    } catch { /* 已经关了就算了 */ }
  }
}
