<script setup>
// 「本机内核」对话框：粘贴启动器打印的连接串 → 连接 → 代码格才能真的执行。
// 这一层只做界面与状态展示，协议、渲染、执行都在 runtime/ 里，互不牵连。
import { computed, ref } from 'vue'
import { runtime, connect, disconnect, interruptKernel, restartKernel } from './index.js'
import { parseConnection } from './client.js'

const emit = defineEmits(['close'])

// 高级模式：手填地址 + 令牌（连接串里没有 ?token= 时才需要）
const advanced = ref(false)
const raw = ref(runtime.baseUrl ? `${runtime.baseUrl}/?token=${runtime.token}` : '')
const baseUrl = ref(runtime.baseUrl)
const token = ref(runtime.token)
const kernelName = ref(runtime.kernelName)
const busy = ref(false)
const error = ref('')
const hint = ref('')

const isReady = computed(() => runtime.status === 'ready')
const isConnecting = computed(() => runtime.status === 'connecting' || busy.value)

const statusLabel = computed(() => {
  if (runtime.status === 'connecting') return '连接中…'
  if (runtime.status === 'ready') return `已连接 · ${runtime.kernelName}${runtime.serverVersion ? ' · ' + runtime.serverVersion : ''}`
  if (runtime.status === 'error') return '连接失败'
  return '未连接'
})

const statusClass = computed(() => `is-${runtime.status}`)

// 用户从启动器窗口复制整串时，顺手把地址和令牌拆到高级输入框里（切过去不用重填）
function onRawInput() {
  const parsed = parseConnection(raw.value)
  if (!parsed.baseUrl) return
  baseUrl.value = parsed.baseUrl
  token.value = parsed.token
}

function forgetError() {
  error.value = ''
  hint.value = ''
}

async function runConnect(options) {
  busy.value = true
  forgetError()
  try {
    await connect(options)
    baseUrl.value = runtime.baseUrl
    token.value = runtime.token
    kernelName.value = runtime.kernelName
    raw.value = runtime.baseUrl + (runtime.token ? `/?token=${runtime.token}` : '')
  } catch (e) {
    error.value = e?.message || String(e)
    hint.value = e?.hint || ''
  } finally {
    busy.value = false
  }
}

function onConnect() {
  if (advanced.value) runConnect({ baseUrl: baseUrl.value, token: token.value, kernelName: kernelName.value })
  else runConnect({ raw: raw.value, kernelName: kernelName.value })
}

async function onKernelChange() {
  if (!isReady.value) return
  await runConnect({ baseUrl: runtime.baseUrl, token: runtime.token, kernelName: kernelName.value })
}

async function onDisconnect() {
  busy.value = true
  forgetError()
  try {
    await disconnect()
  } finally {
    busy.value = false
  }
}

async function onInterrupt() {
  try {
    await interruptKernel()
  } catch (e) {
    error.value = `中断失败：${e?.message || e}`
  }
}

async function onRestart() {
  busy.value = true
  forgetError()
  try {
    await restartKernel()
  } catch (e) {
    error.value = `重启失败：${e?.message || e}`
    hint.value = e?.hint || ''
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="rtdlg-mask" @click.self="emit('close')" @keydown.esc="emit('close')">
    <div class="rtdlg" role="dialog" aria-label="本机内核">
      <header>
        <b>本机内核</b>
        <span class="rtdlg-status" :class="statusClass">● {{ statusLabel }}</span>
        <button type="button" class="rtdlg-close" @click="emit('close')">✕</button>
      </header>

      <div class="rtdlg-body">
        <p class="rtdlg-note">
          代码格只有连上本机 Jupyter 才会真的执行（单格执行，Laup 格不受影响）。
          本机的启动与证书都在 <code>tools/local-runtime</code> 里，双击启动器即可，不需要写任何命令。
        </p>

        <label class="rtdlg-row">
          <span>连接串</span>
          <input
            v-model="raw"
            :disabled="advanced || isReady || isConnecting"
            placeholder="https://127.0.0.1:8888/?token=…（启动器窗口里那一行）"
            autocomplete="off"
            @input="onRawInput"
            @keydown.enter.prevent="onConnect"
          />
        </label>

        <button type="button" class="rtdlg-toggle" @click="advanced = !advanced">
          {{ advanced ? '← 用连接串' : '高级：分开填地址与令牌' }}
        </button>

        <template v-if="advanced">
          <label class="rtdlg-row">
            <span>地址</span>
            <input v-model="baseUrl" :disabled="isReady || isConnecting" placeholder="https://127.0.0.1:8888" autocomplete="off" />
          </label>
          <label class="rtdlg-row">
            <span>令牌</span>
            <input v-model="token" :disabled="isReady || isConnecting" placeholder="token= 后面那串" autocomplete="off" />
          </label>
        </template>

        <label v-if="isReady && runtime.kernelNames.length" class="rtdlg-row">
          <span>内核</span>
          <select v-model="kernelName" :disabled="isConnecting" @change="onKernelChange">
            <option v-for="name in runtime.kernelNames" :key="name" :value="name">{{ name }}</option>
          </select>
        </label>

        <p v-if="error" class="rtdlg-error">{{ error }}</p>
        <p v-if="hint" class="rtdlg-hint">{{ hint }}</p>

        <details class="rtdlg-help">
          <summary>第一次用？三步</summary>
          <ol>
            <li>双击 <code>tools/local-runtime/start.cmd</code>（macOS / Linux 用 <code>start.sh</code>），保持窗口开着。</li>
            <li>复制窗口里打印的连接串，粘贴到上面。</li>
            <li>浏览器若提示证书不安全：先在浏览器打开那个地址，点「高级 → 继续前往」，再回来点连接。</li>
          </ol>
        </details>
      </div>

      <footer>
        <button v-if="isReady" type="button" :disabled="isConnecting" @click="onInterrupt">中断</button>
        <button v-if="isReady" type="button" :disabled="isConnecting" @click="onRestart">重启内核</button>
        <button v-if="isReady" type="button" @click="onDisconnect">断开</button>
        <button v-else type="button" class="primary" :disabled="isConnecting" @click="onConnect">
          {{ isConnecting ? '连接中…' : '连接' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.rtdlg-mask {
  position: fixed; inset: 0; z-index: 330;
  background: rgba(0, 0, 0, .28);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 10vh 16px 16px;
}
.rtdlg {
  width: 560px; max-width: 100%;
  background: #fff; border-radius: 8px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, .22);
  font: 13.5px/1.6 system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #1f2328;
}
.rtdlg header {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 18px; border-bottom: 1px solid #ececec;
}
.rtdlg header b { font-size: 15px; }
.rtdlg-status { font-size: 12px; color: #6b7280; }
.rtdlg-status.is-ready { color: #1a7f37; }
.rtdlg-status.is-connecting { color: #b26a00; }
.rtdlg-status.is-error { color: #c62828; }
.rtdlg-close { margin-left: auto; border: none; background: none; color: #999; cursor: pointer; font-size: 14px; }
.rtdlg-body { padding: 14px 18px 4px; }
.rtdlg-note { margin: 0 0 12px; color: #6b7280; font-size: 12.5px; }
.rtdlg-note code { background: #f3f4f6; border-radius: 3px; padding: 1px 5px; font-size: 12px; }
.rtdlg-row { display: flex; align-items: center; gap: 10px; margin: 0 0 10px; }
.rtdlg-row > span { flex: 0 0 64px; color: #6b7280; font-size: 12.5px; }
.rtdlg-row input, .rtdlg-row select {
  flex: 1; min-width: 0;
  border: 1px solid #d5d5d5; border-radius: 4px;
  padding: 6px 9px; font-size: 13px;
  font-family: Consolas, Menlo, monospace;
}
.rtdlg-row select { flex: 0 0 200px; font-family: inherit; cursor: pointer; }
.rtdlg-row input:focus, .rtdlg-row select:focus { outline: none; border-color: #1f6feb; }
.rtdlg-row input:disabled { background: #f6f7f9; color: #8a9199; }
.rtdlg-toggle {
  border: none; background: none; color: #1f6feb;
  font-size: 12px; cursor: pointer; padding: 0 0 10px 74px;
}
.rtdlg-error {
  margin: 4px 0 8px; color: #c00; background: #fdf3f3;
  border: 1px solid #eec7c7; border-radius: 4px; padding: 5px 9px; font-size: 12.5px;
}
.rtdlg-hint { margin: 0 0 8px; color: #8a6d3b; background: #fcf8e3; border: 1px solid #faebcc; border-radius: 4px; padding: 5px 9px; font-size: 12.5px; }
.rtdlg-help { margin: 4px 0 8px; color: #6b7280; font-size: 12.5px; }
.rtdlg-help summary { cursor: pointer; color: #1f6feb; }
.rtdlg-help ol { margin: 6px 0 0; padding-left: 20px; }
.rtdlg-help code { background: #f3f4f6; border-radius: 3px; padding: 1px 5px; font-size: 12px; }
.rtdlg footer { display: flex; justify-content: flex-end; gap: 8px; padding: 10px 18px 16px; }
.rtdlg footer button {
  border: 1px solid #ccc; background: #f7f7f7; border-radius: 4px;
  padding: 5px 16px; font-size: 13px; cursor: pointer; color: #333;
}
.rtdlg footer button.primary { border-color: #1f6feb; background: #1f6feb; color: #fff; font-weight: 600; }
.rtdlg footer button.primary:hover { background: #1a5fd0; }
.rtdlg footer button:disabled { opacity: .6; cursor: default; }
</style>
