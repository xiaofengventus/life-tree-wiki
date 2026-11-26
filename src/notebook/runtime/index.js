// 本地 Jupyter 内核的对外门面：连接 / 断开 / 执行一格 / 中断 / 重启。
// 编辑器侧只做两件事：读 runtime 状态（菜单栏状态点）、在代码格上调用 runCodeCell。
// 预览渲染、Laup 排版、持久化一概不在这一层 —— 这里只和本机 Jupyter 说话。

import {
  JupyterClient, KernelChannel, RuntimeError, normalizeBaseUrl, parseConnection, uuid,
} from './client.js'
import { runtime, saveRuntimeConfig } from './state.js'

export { runtime, RuntimeError }

let client = null
let channel = null
let sessionId = ''

/** 是否真的可以执行（连接成功且通道还活着）。 */
export function isRuntimeReady() {
  return runtime.status === 'ready' && !!channel
}

function watchChannelClose() {
  if (!channel) return
  channel.onClose = () => {
    channel = null
    if (runtime.status !== 'ready') return
    runtime.status = 'error'
    runtime.error = '内核通道断开了（Jupyter 可能已停止或重启）。'
    runtime.hint = '重新双击启动器，再点「连接」。'
    runtime.busy = 0
  }
}

function readableError(error) {
  if (error instanceof RuntimeError) return { message: error.message, hint: error.hint || '' }
  const message = String(error?.message || error || '未知错误')
  if (/Failed to fetch|NetworkError|Load failed/i.test(message)) {
    return {
      message: '连不上本机 Jupyter。',
      hint: '确认启动器窗口还开着，并在浏览器里信任过一次证书。',
    }
  }
  return { message, hint: '' }
}

async function shutdownKernelQuietly(targetClient, kernelId) {
  if (!targetClient || !kernelId) return
  try {
    await targetClient.shutdownKernel(kernelId)
  } catch { /* 内核可能已经不存在了 */ }
}

/**
 * 连接本机 Jupyter 并启动一个内核。
 * options: { raw } 或 { baseUrl, token }；kernelName 可选（不填就用服务端默认内核）。
 */
export async function connect(options = {}) {
  const parsed = options.raw
    ? parseConnection(options.raw)
    : { baseUrl: normalizeBaseUrl(options.baseUrl), token: String(options.token ?? '') }
  if (!parsed.baseUrl) {
    const error = new RuntimeError('连接串为空。', '粘贴启动器窗口里的 https://127.0.0.1:8888/?token=… 再点连接。')
    runtime.status = 'error'
    runtime.error = error.message
    runtime.hint = error.hint
    throw error
  }
  await disconnect({ quiet: true })
  runtime.status = 'connecting'
  runtime.error = ''
  runtime.hint = ''
  runtime.baseUrl = parsed.baseUrl
  runtime.token = parsed.token
  const nextClient = new JupyterClient(parsed)
  client = nextClient
  let kernel = null
  try {
    const info = await nextClient.status()
    runtime.serverVersion = String(info?.version || '')
    const specs = await nextClient.kernelspecs()
    const names = Object.keys(specs?.kernelspecs || {})
    runtime.kernelNames = names
    if (!names.length) {
      throw new RuntimeError('这台 Jupyter 没有可用内核。', '先在终端执行 pip install ipykernel，再重启本地服务。')
    }
    const preferred = String(options.kernelName || runtime.kernelName || '')
    const name = names.includes(preferred)
      ? preferred
      : (names.includes(specs.default) ? specs.default : names[0])
    kernel = await nextClient.startKernel(name)
    if (!kernel?.id) throw new RuntimeError('内核没有启动成功（Jupyter 没返回 kernel id）。')
    sessionId = uuid()
    channel = await KernelChannel.open({
      baseUrl: parsed.baseUrl, token: parsed.token, kernelId: kernel.id, sessionId,
    })
    watchChannelClose()
    await channel.waitReady()
    runtime.kernelId = kernel.id
    runtime.kernelName = name
    runtime.status = 'ready'
    saveRuntimeConfig()
    return { kernelName: name, kernels: names, version: runtime.serverVersion }
  } catch (error) {
    try {
      channel?.close()
    } catch { /* 通道没建立起来 */ }
    channel = null
    await shutdownKernelQuietly(nextClient, kernel?.id)
    client = null
    const { message, hint } = readableError(error)
    runtime.status = 'error'
    runtime.error = message
    runtime.hint = hint
    throw error
  }
}

/** 断开：关通道 + 让 Jupyter 收掉刚启动的内核（不在那边留垃圾）。 */
export async function disconnect({ quiet = false } = {}) {
  const oldClient = client
  const oldChannel = channel
  const kernelId = runtime.kernelId
  client = null
  channel = null
  try {
    oldChannel?.close()
  } catch { /* 已经关了 */ }
  await shutdownKernelQuietly(oldClient, kernelId)
  runtime.status = 'off'
  runtime.kernelId = ''
  runtime.busy = 0
  runtime.error = ''
  runtime.hint = ''
  if (!quiet) runtime.kernelNames = []
}

/**
 * 执行一格源码。返回 { html, executionCount, status }；
 * onUpdate 在输出增量到达时被调用（参数是累积 HTML），用来边跑边显示。
 */
export async function runCodeCell(code, { onUpdate = null } = {}) {
  if (!isRuntimeReady()) {
    throw new RuntimeError('还没有连接本机内核。', '点菜单栏的「内核」连接后，代码格才会真的执行。')
  }
  const active = channel
  runtime.busy += 1
  try {
    return await active.execute(stripCellMagic(code), { onUpdate })
  } finally {
    runtime.busy = Math.max(0, runtime.busy - 1)
  }
}

// 导出过的 .laup 里代码格首行会有 `%%python`：执行时剥掉，
// 它只是给读者标语言用的，不是合法 Python。
function stripCellMagic(code) {
  return String(code ?? '').replace(/^%%[A-Za-z0-9_+.-]+[ \t]*\r?\n/, '')
}

export async function interruptKernel() {
  if (!client || !runtime.kernelId) return
  await client.interruptKernel(runtime.kernelId)
}

/** 重启内核：Jupyter 会让原来的通道失效，所以重启后重新开一条。 */
export async function restartKernel() {
  if (!client || !runtime.kernelId) return
  const { baseUrl, token, kernelId } = runtime
  await client.restartKernel(kernelId)
  try {
    channel?.close()
  } catch { /* 重启时本来就会断 */ }
  channel = await KernelChannel.open({ baseUrl, token, kernelId, sessionId })
  watchChannelClose()
  await channel.waitReady()
}
