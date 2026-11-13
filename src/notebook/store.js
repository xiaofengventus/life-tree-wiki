import { defineStore } from 'pinia'
import {
  buildRefPool, collectCitedNums, collectRefBlocks, exportLaupDoc, migrateCodeCells,
  parseLaupDoc, planCodePanes, runCellSource,
} from './renderer.js'

const LS_KEY = 'laup-notebook-v2'

/** 渲染位置的合法取值（默认 below）。 */
export const RENDER_MODES = ['below', 'inplace', 'folded']

function makeId() {
  return 'cell-' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)
}

function emptyCell(type = 'laup') {
  return { id: makeId(), type, source: '', attachments: {}, execCount: null, outputHtml: '' }
}

export const useNotebook = defineStore('notebook', {
  state: () => ({
    cells: [],
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
    // ---------- 初始化：localStorage 优先，否则空白启动（一个空 laup 格） ----------
    ensureLoaded() {
      let data = null
      try { data = JSON.parse(localStorage.getItem(LS_KEY) || 'null') } catch { data = null }
      if (data?.cells?.length) {
        // 旧版代码格（源码是一整块 `输入---输出`）在这一步拆成 [input] / [output] 两格
        this.cells = migrateCodeCells(data.cells, () => emptyCell('code'))
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

    // 从草稿箱恢复（payload 由 buildDraft 写入，见 NotebookView 的 useDraftAutosave）
    applyDraft(payload = {}) {
      const raw = Array.isArray(payload.cells) && payload.cells.length
        ? payload.cells.map((c) => ({ ...emptyCell(c.type), type: c.type, source: c.source || '', attachments: c.attachments || {} }))
        : [emptyCell('laup')]
      const cells = migrateCodeCells(raw, () => emptyCell('code'))
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
      this.cells = migrateCodeCells(parsed.map((c) => ({ ...emptyCell(c.type), source: c.source })), () => emptyCell('code'))
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
      const write = () => {
        try {
          localStorage.setItem(LS_KEY, JSON.stringify({
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
            localStorage.setItem(LS_KEY, JSON.stringify(slim))
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
      c.source = source
      // 代码格的预览很便宜（不编译 Laup），边打边更新；laup 格仍等 Shift+Enter
      if (c.type === 'code') this.renderCodeCells()
      this.persist()
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
    // 代码格的分支不碰全局文献池 —— 传空数组，省掉每次按键的整篇正则扫描。
    renderCodeCells() {
      const panes = planCodePanes(this.cells)
      this.cells.forEach((c, i) => {
        if (c.type !== 'code') return
        c.outputHtml = runCellSource(c, this.scope, [], null, false, panes.get(i) || null).outputHtml
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

    // 全局文献池：所有 laup 格的 \references 块按格顺序汇总（\cite 跨格解析用）
    refPool() {
      return buildRefPool(this.cells)
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
        const { outputHtml } = runCellSource(c, this.scope, this.refPool(), this.citedNums(),
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
          const { outputHtml } = runCellSource(c, this.scope, pool, cited, i === disp, panes.get(i) || null)
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
      const cell = { id: makeId(), type, source: '', attachments: {}, execCount: null, outputHtml: '' }
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
      c.type = type
      this.persist()
    },

    cycleType(id) {
      const c = this.cells.find((x) => x.id === id)
      if (!c) return
      this.setType(id, c.type === 'laup' ? 'code' : c.type === 'code' ? 'var' : 'laup')
    },

    // ---------- 导入导出 ----------
    exportLanb() {
      const blob = new Blob([JSON.stringify({
        cells: this.cells, execCounter: this.execCounter, renderMode: this.renderMode,
      }, null, 2)], { type: 'application/json' })
      download(blob, 'notebook.lanb')
    },

    importLanb(text) {
      const data = JSON.parse(text)
      if (!Array.isArray(data.cells) || !data.cells.length) throw new Error('文件里没有单元格')
      this.cells = migrateCodeCells(data.cells, () => emptyCell('code'))
      this.execCounter = data.execCounter || 0
      if (RENDER_MODES.includes(data.renderMode)) this.renderMode = data.renderMode
      this.selectedId = this.cells[0].id
      this.scope = {}
      this.runAll(false)
      this.persist(true)
    },

    exportLaup() {
      const blob = new Blob([exportLaupDoc(this.cells, this.scope)], { type: 'text/plain' })
      download(blob, 'notebook.laup')
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
