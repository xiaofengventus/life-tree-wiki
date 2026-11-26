// 本地内核的连接状态：一个 reactive 单例，界面直接读它就够了。
// 安全边界：token 只落在**本机 localStorage**，不进 .lanb、不进文章、不进草稿，
// 也不出现在导出文件里 —— 它只是「这台机器上这个浏览器」和本机 Jupyter 之间的凭据。

import { reactive } from 'vue'

const LS_KEY = 'laup-runtime'

export const runtime = reactive({
  // off 未连接 / connecting 连接中 / ready 可用 / error 出错
  status: 'off',
  baseUrl: '',
  token: '',
  kernelName: '',
  kernelId: '',
  kernelNames: [],
  serverVersion: '',
  error: '',
  hint: '',
  busy: 0, // 正在执行的格数，界面用来显示「运行中」
})

export function loadRuntimeConfig() {
  try {
    const data = JSON.parse(localStorage.getItem(LS_KEY) || 'null')
    if (!data || typeof data !== 'object') return
    if (typeof data.baseUrl === 'string') runtime.baseUrl = data.baseUrl
    if (typeof data.token === 'string') runtime.token = data.token
    if (typeof data.kernelName === 'string') runtime.kernelName = data.kernelName
  } catch { /* 隐私模式 / 坏数据：忽略，等用户重新填 */ }
}

export function saveRuntimeConfig() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      baseUrl: runtime.baseUrl,
      token: runtime.token,
      kernelName: runtime.kernelName,
    }))
  } catch { /* 存不下就算了，不影响当前连接 */ }
}

loadRuntimeConfig()
