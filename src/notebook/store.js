import { defineStore } from 'pinia'
import { hasInjectionContext, inject } from 'vue'
import {
  buildRefPool, collectCitedNums, collectRefBlocks, exportLaupDoc, migrateCodeCells,
  parseLaupDoc, planCodePanes, runCellSource,
} from './renderer.js'
import { runCellSourceV2, exportNotebookV2, collectV2References, v2ReferenceDisplayIndex, normalizeV2Cell, normalizeV2CellType } from './kernelV2.js'
import { ipynbToCells } from './ipynb.js'

// 两套内核各存各的：v2 公测页不读也不写 v1 的稿子。
// v1 的键沿用历史名字（laup-notebook-v2），改名会让存量草稿凭空消失。
const LS_KEYS = { v1: 'laup-notebook-v2', v2: 'laup2-beta-notebook' }

/** 渲染位置的合法取值（默认 below）。 */
export const RENDER_MODES = ['below', 'inplace', 'folded']

function makeId() {
  return 'cell-' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)
}

function emptyCell(type = 'laup') {
  return { id: makeId(), type, source: '', attachments: {}, execCount: null, outputHtml: '' }
}

export const notebookContext = Symbol('notebook')

export function useNotebook(pinia) {
  return (!pinia && hasInjectionContext() && inject(notebookContext, null)) || useNotebookStore(pinia)
}

const useNotebookStore = defineStore('notebook', {
  state: () => ({
    cells: [],
    storageEnabled: true,
    // 渲染内核：'v1'（旧版，/notebook）| 'v2'（公测，/laup-v2）。
    kernel: 'v1',
    selectedId: null,
    mode: 'command', // command | edit，对齐 Jupyter 双模式
    // 渲染结果的显示位置（工具条上的开关，用户自选；默认保留下方）：
    //   below   源码在上、结果在下（Jupyter 的样子）
    //   inplace 结果占住整格，双击/回车才回到源码
    //   folded  结果在上，源码收成一行摘要条（点它展开）
    renderMode: 'below',
    scope: {},       // 宿主层变量作用域（运行顺序生效，运行全部重置）
    execCounter: 0,
    savedAt: null,
    toast: null, // 一次性提示（图片校验失败等），由 App 端定时清除
    draftId: '',     // 草稿箱联动：当前笔记本对应的本地草稿 id（发布成功后清除）
    draftStatus: '', // 草稿状态文案（MenuBar 显示），由 NotebookView 的自动保存同步
    editPost: null,  // 正在编辑的已发布文章 { id, version, title, author, tags, type, license, visibility }（?edit= 载入，更新发布后清空）
  }),

  getters: {
    selectedIndex(state) {
      return state.cells.findIndex((c) => c.id === state.selectedId)
    },
    // 草稿箱里显示的标题：优先任意 laup 格的 `# 标题`，退化到首个 laup 格非空行，再退化到占位
    draftTitle(state) {
      const firstLine = { value: '' }
      for (const c of state.cells) {
        if (c.type !== 'laup') continue
        for (const line of c.source.split('\n')) {
          const m = line.match(/^\s*#\s+(\S.{0,79}?)\s*$/)
          if (m) return m[1].replace(/[ \t]+#+[ \t]*$/, '')
          const t = line.trim()
          if (t && !firstLine.value) firstLine.value = t.slice(0, 40)
        }
      }
      return firstLine.value || '未命名 Notebook'
    },
  },

  actions: {
    // 切换内核：先把当前稿子同步落盘（用旧内核的键），再换键加载。
    // 两套内核的数据互不可见，避免 v2 公测页把 v1 的稿子渲染成"坏掉的样子"。
    setKernel(kernel) {
      const next = kernel === 'v2' ? 'v2' : 'v1'
      if (this.kernel === next) return
      this.persist(true)
      this.kernel = next
      this.cells = []
      this.selectedId = null
      this.mode = 'command'
      this.scope = {}
      this.execCounter = 0
      this.editPost = null
      this.savedAt = null
      this.draftStatus = ''
    },

    // ---------- 初始化：localStorage 优先，否则空白启动（一个空 laup 格） ----------
    ensureLoaded() {
      let data = null
      if (this.storageEnabled) {
        try { data = JSON.parse(localStorage.getItem(LS_KEYS[this.kernel]) || 'null') } catch { data = null }
      } else if (this.cells.length) {
        return
      }
      if (Array.isArray(data?.cells) && data.cells.length) {
        // v1 迁移旧输入输出格；v2 只收口编辑格类型，不改旧 var 原文。
        this.cells = this.prepareCells(data.cells)
        this.execCounter = data.execCounter || 0
        // 渲染位置是**用户偏好**，跟着本机存，不跟着文档走（换文章也还是他自己选的那档）
        if (RENDER_MODES.includes(data.renderMode)) this.renderMode = data.renderMode
        this.selectedId = this.cells[0].id
      } else {
        this.clearAll(false)
      }
      this.runAll(false)
    },

    // 清空：回到单个空 laup 格
    clearAll(run = true) {
      this.cells = [emptyCell('laup')]
      this.execCounter = 0
      this.selectedId = this.cells[0].id
      this.mode = 'command'
      this.scope = {}
      this.editPost = null
      if (run) { this.runAll(false); this.persist(true) }
    },

    prepareCells(cells) {
      return this.kernel === 'v2'
        ? cells.map(normalizeV2Cell)
        : migrateCodeCells(cells, () => emptyCell('code'))
    },

    // 从草稿箱恢复（payload 由 buildDraft 写入，见 NotebookView 的 useDraftAutosave）
    applyDraft(payload = {}) {
      const raw = Array.isArray(payload.cells) && payload.cells.length
        ? payload.cells.map((c) => ({ ...emptyCell(c.type), type: c.type, source: c.source || '', attachments: c.attachments || {} }))
        : [emptyCell('laup')]
      const cells = this.prepareCells(raw)
      this.cells = cells
      this.execCounter = Number(payload.execCounter) || 0
      // 草稿带了就跟着走；没带（如 ?edit= 载入已发布文章）就沿用本机偏好，不重置
      if (RENDER_MODES.includes(payload.renderMode)) this.renderMode = payload.renderMode
      this.scope = payload.scope && typeof payload.scope === 'object' ? payload.scope : {}
      this.selectedId = cells[0].id
      this.mode = 'command'
      this.runAll(false)
      this.persist(true)
    },

    // 载入 public/example.laup（laup 语法完整演示）
    async loadExample() {
      const res = await fetch(import.meta.env.BASE_URL + 'notebook-example.laup')
      if (!res.ok) throw new Error('example.laup 加载失败：HTTP ' + res.status)
      const text = await res.text()
      const parsed = parseLaupDoc(text)
      if (!parsed.length) throw new Error('example.laup 里没有内容')
      this.cells = this.prepareCells(parsed.map((c) => ({ ...emptyCell(c.type), source: c.source })))
      this.execCounter = 0
      this.selectedId = this.cells[0].id
      this.mode = 'command'
      this.runAll(false)
      this.persist(true)
    },

    // ---------- 持久化（防抖） ----------
    _t: null,
    persist(immediate = false) {
      clearTimeout(this._t)
      if (!this.storageEnabled) return
      const key = LS_KEYS[this.kernel]
      const write = () => {
        if (!this.storageEnabled) return
        try {
          localStorage.setItem(key, JSON.stringify({
            cells: this.cells, execCounter: this.execCounter, renderMode: this.renderMode,
          }))
          this.savedAt = new Date().toLocaleTimeString()
        } catch (e) {
          // 配额爆了（多半是图片附件 base64 太大）：降级为只存正文不存附件，
          // 保证文字不丢；提交/导出走内存里的完整数据，不受影响。不用 alert（移动端又挡又吵）。
          try {
            const slim = {
              cells: this.cells.map((c) => ({ ...c, attachments: {} })),
              execCounter: this.execCounter,
              renderMode: this.renderMode,
            }
            localStorage.setItem(key, JSON.stringify(slim))
            this.savedAt = new Date().toLocaleTimeString()
            this.toast = '图片附件超出本机存储，草稿只保存了文字（提交不受影响）'
          } catch {
            this.toast = '本机保存失败：' + (e?.message || e)
          }
        }
      }
      immediate ? write() : (this._t = setTimeout(write, 400))
    },

    setSource(id, source) {
      const c = this.cells.find((x) => x.id === id)
      if (!c || c.source === source) return
      const refreshReferences = this.kernel === 'v2' && c.type === 'code'
        && /^\[references\][ \t]*(?:\r?\n|$)/im.test(`${c.source}\n${source}`)
      c.source = source
      // 代码格与 v2 的 laup 格边打边预览；文献声明变化时同步更新编号和列表。
      // v2 的渲染是纯函数（不写入变量作用域），所以编辑 Laup 也能实时重排。
      if (c.type === 'code' || this.kernel === 'v2') this.renderCodeCells(refreshReferences)
      this.persist()
    },

    // 按当前内核渲染一格。v2 交给独立适配层，不写入变量作用域。
    renderCell(c, pool, cited, isDisp, pane) {
      if (this.kernel === 'v2') {
        return runCellSourceV2(c, { scope: this.scope, refPool: pool, isRefDisplay: isDisp, pane })
      }
      return runCellSource(c, this.scope, pool, cited, isDisp, pane)
    },

    // 渲染位置开关：只改「结果画在哪」，一格数据都不动，所以不触发重渲。
    // 非法值退回默认档，免得本地存了个旧值时整页没有输出区。
    setRenderMode(mode) {
      this.renderMode = RENDER_MODES.includes(mode) ? mode : 'below'
      this.persist()
    },

    // 代码格没有「运行」这回事：预览随时可以重画（不编译 Laup，成本可忽略）。
    // 配对关系（[input] + [output] 并成一张对照卡）会因邻格改动而变，
    // 所以整批重画，免得配对的另一半留着旧产物。
    renderCodeCells(refreshReferences = false) {
      const panes = planCodePanes(this.cells)
      const pool = this.kernel === 'v2' ? this.refPool() : []
      const display = this.kernel === 'v2' ? this.refDisplayIdx() : -1
      this.cells.forEach((c, i) => {
        if (c.type !== 'code' && !refreshReferences) return
        c.outputHtml = this.renderCell(c, pool, null, i === display, panes.get(i) || null).outputHtml
      })
    },

    addAttachment(id, dataUrl) {
      const c = this.cells.find((x) => x.id === id)
      if (!c) return null
      c.attachments = c.attachments || {}
      const name = `paste-${++pasteCounter}.png`
      c.attachments[name] = dataUrl
      this.persist()
      return name
    },

    // 统一图片入口（上传 / 粘贴 / 拖拽共用）：校验类型与大小，存为格附件
    // 返回 Promise<name|null>，null = 校验拒绝
    addImageFile(id, file) {
      const MAX = 8 * 1024 * 1024
      if (!file?.type?.startsWith('image/')) {
        this.toast = `「${file?.name || '未知文件'}」不是图片（仅支持 image/*）`
        return Promise.resolve(null)
      }
      if (file.size > MAX) {
        this.toast = `图片过大（${(file.size / 1048576).toFixed(1)}MB），上限 8MB`
        return Promise.resolve(null)
      }
      return new Promise((resolve) => {
        const done = (dataUrl) => resolve(this.addAttachment(id, dataUrl))
        const rd = new FileReader()
        rd.onerror = () => { this.toast = '图片读取失败'; resolve(null) }
        // 大图压缩：手机照片/高分辨率截图动辄几 MB，base64 会同时进附件、输出 HTML
        // 和 localStorage，移动端「运行全部」直接把页面内存撑爆（白屏崩溃）。
        // 超过阈值的等比缩到 ≤1600px 再存；GIF 会丢动画，跳过。
        const SHRINK_OVER = 1.5 * 1024 * 1024
        if (file.type === 'image/gif' || file.size <= SHRINK_OVER) {
          rd.onload = () => done(rd.result)
          rd.readAsDataURL(file)
          return
        }
        rd.onload = () => {
          const img = new Image()
          img.onload = () => {
            try {
              const scale = Math.min(1, 1600 / Math.max(img.width, img.height))
              const w = Math.max(1, Math.round(img.width * scale))
              const h = Math.max(1, Math.round(img.height * scale))
              const cv = document.createElement('canvas')
              cv.width = w
              cv.height = h
              cv.getContext('2d').drawImage(img, 0, 0, w, h)
              done(cv.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85))
            } catch { done(rd.result) } // 画布失败就用原图
          }
          img.onerror = () => done(rd.result)
          img.src = rd.result
        }
        rd.readAsDataURL(file)
      })
    },

    // 全局文献池：v2 认 [references] 首行声明；v1 走原有的数据块汇总
    refPool() {
      return this.kernel === 'v2' ? collectV2References(this.cells) : buildRefPool(this.cells)
    },

    citedNums() {
      const s = new Set()
      for (const c of this.cells) {
        if (c.type !== 'laup') continue
        for (const n of collectCitedNums(c.source)) s.add(n)
      }
      return s
    },

    // 全局文献列表的展示格：优先第一个自带 \references 块的 laup 格；
    // 声明只出现在 var 格时，var 格本身不渲染文献列表，退化为第一个 \cite 的 laup 格
    refDisplayIdx() {
      if (this.kernel === 'v2') return v2ReferenceDisplayIndex(this.cells)
      const cells = this.cells
      const i = cells.findIndex((c) => c.type === 'laup' && collectRefBlocks(c.source).length > 0)
      if (i >= 0) return i
      return cells.findIndex((c) => c.type === 'laup' && /\\cite\s*\{/.test(c.source))
    },

    // ---------- 运行 ----------
    runCell(id, advance = false) {
      const c = this.cells.find((x) => x.id === id)
      if (!c) return
      // 代码格没有「执行」这回事：只是重画预览（不编译 Laup）
      if (c.type === 'code') {
        this.renderCodeCells()
      } else {
        c.execCount = ++this.execCounter
        const { outputHtml } = this.renderCell(c, this.refPool(), this.citedNums(),
          this.cells.findIndex((x) => x.id === id) === this.refDisplayIdx(), null)
        c.outputHtml = outputHtml
      }
      this.persist()
      if (advance) {
        const i = this.selectedIndex
        if (i >= 0 && i < this.cells.length - 1) {
          this.select(this.cells[i + 1].id)
        } else {
          this.insertCell(this.cells.length - 1, 'laup')
        }
        this.mode = 'command'
      }
    },

    runAll(selectId) {
      this.scope = {}
      this.execCounter = 0
      const pool = this.refPool()
      const cited = this.citedNums()
      const disp = this.refDisplayIdx()
      const panes = planCodePanes(this.cells)
      this.cells.forEach((c, i) => {
        if (c.type !== 'code') c.execCount = ++this.execCounter
        try {
          const { outputHtml } = this.renderCell(c, pool, cited, i === disp, panes.get(i) || null)
          c.outputHtml = outputHtml
        } catch (e) {
          // 单格异常不许中断「运行全部」——把错误画进这一格的输出区
          c.outputHtml = `<pre class="error-out">运行失败：${String(e?.message || e)}</pre>`
        }
      })
      this.persist()
      if (selectId) this.select(selectId)
    },

    // ---------- 结构操作 ----------
    select(id) { this.selectedId = id },

    setMode(m) {
      this.mode = m
      if (m === 'command') document.activeElement?.blur?.()
    },

    moveSel(delta) {
      const i = this.selectedIndex
      if (i < 0) return
      const j = Math.min(this.cells.length - 1, Math.max(0, i + delta))
      this.selectedId = this.cells[j].id
    },

    insertCell(afterIndex, type = 'laup') {
      const cell = emptyCell(this.kernel === 'v2' ? normalizeV2CellType(type) : type)
      this.cells.splice(afterIndex + 1, 0, cell)
      this.selectedId = cell.id
      this.mode = 'command'
      this.persist()
      return cell.id
    },

    delCell(id) {
      const i = this.cells.findIndex((x) => x.id === (id || this.selectedId))
      if (i < 0 || this.cells.length <= 1) return
      this.cells.splice(i, 1)
      this.selectedId = this.cells[Math.min(i, this.cells.length - 1)].id
      this.persist()
    },

    dupCell(id) {
      const i = this.cells.findIndex((x) => x.id === id)
      if (i < 0) return
      const copy = JSON.parse(JSON.stringify(this.cells[i]))
      copy.id = makeId()
      copy.execCount = null
      this.cells.splice(i + 1, 0, copy)
      this.selectedId = copy.id
      this.persist()
    },

    moveCell(id, dir) {
      const i = this.cells.findIndex((x) => x.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= this.cells.length) return
      ;[this.cells[i], this.cells[j]] = [this.cells[j], this.cells[i]]
      this.persist()
    },

    setType(id, type) {
      const c = this.cells.find((x) => x.id === id)
      if (!c) return
      c.type = this.kernel === 'v2' ? normalizeV2CellType(type) : type
      this.persist()
    },

    // v1：laup → code → var → laup 循环。
    // v2：格型由首行声明决定（[cpp] / [input] / %%python …），laup 与 code 不互转——
    //     互转会把正文整段塞进代码格，看起来就像"点了 laup 变成 [cpp]"。
    cycleType(id) {
      const c = this.cells.find((x) => x.id === id)
      if (!c) return
      if (this.kernel === 'v2') {
        this.toast?.('v2 的格类型由首行声明决定：写 [cpp] / [input] / %%python 即切换')
        return
      }
      this.setType(id, c.type === 'laup' ? 'code' : c.type === 'code' ? 'var' : 'laup')
    },

    // ---------- 导入导出 ----------
    exportLanb(filename = 'notebook.lanb') {
      const blob = new Blob([JSON.stringify({
        cells: this.cells, execCounter: this.execCounter, renderMode: this.renderMode,
        // 内核标记：.lanb 是"编辑器快照"，带上它才能把文件还原到对的内核
        kernel: this.kernel,
      }, null, 2)], { type: 'application/json' })
      download(blob, filename)
    },

    importLanb(text) {
      const data = JSON.parse(text)
      if (!Array.isArray(data.cells) || !data.cells.length) throw new Error('文件里没有单元格')
      this.cells = this.prepareCells(data.cells)
      this.execCounter = data.execCounter || 0
      if (RENDER_MODES.includes(data.renderMode)) this.renderMode = data.renderMode
      this.selectedId = this.cells[0].id
      this.scope = {}
      this.runAll(false)
      this.persist(true)
      // 内核只是提示，不强行切换：导入后立即换成另一套渲染会让人以为文件被改了
      if (data.kernel === 'v2' && this.kernel !== 'v2') {
        this.toast = '这份 .lanb 由 v2 内核导出，建议到「Laup v2」页打开以获得同样的预览'
      }
    },

    // ipynb（Jupyter Notebook）导入：转换成标准 Laup 格
    //   markdown → laup 格；code → [语言] 代码格（+ 可选 [output] 格）；raw → stay
    importIpynb(text) {
      const { cells, stats } = ipynbToCells(text)
      this.cells = cells
      this.selectedId = this.cells[0].id
      this.scope = {}
      this.execCounter = 0
      this.runAll(false)
      this.persist(true)
      const detail = [
        `${stats.markdown} 个 Markdown`,
        `${stats.code} 个代码格`,
        stats.outputs ? `${stats.outputs} 个输出` : '',
        stats.raw ? `${stats.raw} 个 Raw` : '',
      ].filter(Boolean).join('、')
      this.toast = `已导入 ipynb：${detail}`
    },

    exportLaup() {
      try {
        // 两套内核各导各的：v2 不生成 v1 的宿主层数据块或代码围栏。
        const text = this.kernel === 'v2'
          ? exportNotebookV2(this.cells)
          : exportLaupDoc(this.cells, this.scope)
        const blob = new Blob([text], { type: 'text/plain' })
        download(blob, 'notebook.laup')
      } catch (error) {
        // 导出同时做 v2 语法校验：v1 写法混进来时给出明确提示，而不是导出坏文档
        this.toast = `导出失败：${error?.message || error}`
      }
    },
  },
})

let pasteCounter = 0

function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
