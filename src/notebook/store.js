import { defineStore } from 'pinia'
import { hasInjectionContext, inject } from 'vue'
import { planCodePanes } from './renderer.js'
import { runCellSourceV2, exportNotebookV2, collectV2References, v2ReferenceDisplayIndex, normalizeV2Cell, normalizeV2CellType } from './kernelV2.js'
import { ipynbToCells } from './ipynb.js'
import { normalizeLang } from '@/utils/codeLang.js'
import { isRuntimeReady, runCodeCell } from './runtime/index.js'
import { RUNNING_HTML, RUNTIME_MARK } from './runtime/render.js'

// 编辑器只剩 v2 内核：本地稿只有一个键（v1 的 laup-notebook-v2 随 v1 编辑器停用）。
const LS_KEY = 'laup2-beta-notebook'

/** 渲染位置的合法取值（默认 below）。 */
export const RENDER_MODES = ['below', 'inplace', 'folded']

function makeId() {
  return 'cell-' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)
}

// 同一格可能被连按几次「运行」：用递增序号丢弃过期结果，只让最后一次落到界面上。
const rtRuns = new WeakMap()

const escapeHtml = (text) => String(text ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function emptyCell(type = 'laup') {
  return {
    id: makeId(), type, source: '', attachments: {}, execCount: null, outputHtml: '',
    // 本机内核的真实输出（只有 code 格会用到）：rtHtml 是最后一次执行的产物，
    // rtRunning 表示还在跑。预览与真实输出上下相接显示，见 codeRuntimeHtml。
    rtHtml: '', rtRunning: false,
  }
}

export const notebookContext = Symbol('notebook')

export function useNotebook(pinia) {
  return (!pinia && hasInjectionContext() && inject(notebookContext, null)) || useNotebookStore(pinia)
}

const useNotebookStore = defineStore('notebook', {
  state: () => ({
    cells: [],
    // 项目基本信息：新建时问一次，之后在菜单里可改
    projectName: '', // 项目名（默认当文章标题）
    codeLang: 'python', // 原生代码格的全局语言（格子里不写声明）
    storageEnabled: true,
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
    // 草稿箱里显示的标题：优先项目名，其次任意 laup 格的 `# 标题`，再退化到首个非空行
    draftTitle(state) {
      if (state.projectName.trim()) return state.projectName.trim()
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
      if (this.storageEnabled) {
        try { data = JSON.parse(localStorage.getItem(LS_KEY) || 'null') } catch { data = null }
      } else if (this.cells.length) {
        return
      }
      if (Array.isArray(data?.cells) && data.cells.length) {
        // v2 只收口编辑格类型，不改旧 var 原文。
        this.cells = this.prepareCells(data.cells)
        this.execCounter = data.execCounter || 0
        if (typeof data.projectName === 'string') this.projectName = data.projectName
        if (typeof data.codeLang === 'string' && data.codeLang) this.codeLang = data.codeLang
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
      return cells.map((cell) => {
        const next = normalizeV2Cell(cell)
        // 内核输出不跨会话：刷新 / 重开之后内核已经不在，留着会让人以为是新结果
        if (next.rtHtml || next.rtRunning) return { ...next, rtHtml: '', rtRunning: false }
        return next
      })
    },

    // ── 项目基本信息（新建时问一次，之后在菜单里可改） ──
    setProjectName(name) {
      this.projectName = String(name ?? '')
      this.persist()
    },

    // 原生代码格的全局语言：改完全部代码格按新语言重排
    setCodeLang(lang) {
      this.codeLang = normalizeLang(lang) || 'text'
      this.renderCodeCells()
      this.persist()
    },

    /** 新建项目：名称 + 代码语言 + 初始格（模板 / 导入时连同内容一起给）。 */
    newProject({ name = '', codeLang = 'python', cells = null } = {}) {
      this.projectName = String(name || '').trim()
      this.codeLang = normalizeLang(codeLang) || 'python'
      const initial = Array.isArray(cells) && cells.length ? cells : [{ type: 'laup' }]
      // 传进来的格可能只有 { type, source }（模板 / 导入），这里补上 id 等运行时字段
      this.cells = this.prepareCells(initial.map((c) => ({ ...emptyCell(c.type), ...c })))
      this.execCounter = 0
      this.selectedId = this.cells[0].id
      this.mode = 'command'
      this.scope = {}
      this.editPost = null
      this.runAll(false)
      this.persist(true)
    },

    // 从草稿箱恢复（payload 由 buildDraft 写入，见 NotebookView 的 useDraftAutosave）
    applyDraft(payload = {}) {
      const raw = Array.isArray(payload.cells) && payload.cells.length
        ? payload.cells.map((c) => ({ ...emptyCell(c.type), type: c.type, source: c.source || '', attachments: c.attachments || {} }))
        : [emptyCell('laup')]
      const cells = this.prepareCells(raw)
      this.cells = cells
      this.execCounter = Number(payload.execCounter) || 0
      if (typeof payload.projectName === 'string') this.projectName = payload.projectName
      if (typeof payload.codeLang === 'string' && payload.codeLang) this.codeLang = payload.codeLang
      // 草稿带了就跟着走；没带（如 ?edit= 载入已发布文章）就沿用本机偏好，不重置
      if (RENDER_MODES.includes(payload.renderMode)) this.renderMode = payload.renderMode
      this.scope = payload.scope && typeof payload.scope === 'object' ? payload.scope : {}
      this.selectedId = cells[0].id
      this.mode = 'command'
      this.runAll(false)
      this.persist(true)
    },

    // ---------- 持久化（防抖） ----------
    _t: null,
    persist(immediate = false) {
      clearTimeout(this._t)
      if (!this.storageEnabled) return
      const key = LS_KEY
      const write = () => {
        if (!this.storageEnabled) return
        try {
          localStorage.setItem(key, JSON.stringify({
            cells: this.cells, execCounter: this.execCounter, renderMode: this.renderMode,
            projectName: this.projectName, codeLang: this.codeLang,
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
              projectName: this.projectName,
              codeLang: this.codeLang,
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
      const refreshReferences = /^\[references\][ \t]*(?:\r?\n|$)/im.test(`${c.source}\n${source}`)
      c.source = source
      // 源码改了，上一次的内核输出就作废（不然会以为新代码跑出了旧结果）；
      // 同时给正在跑的那次执行换序号，让迟到的输出落不进来。
      if (c.type === 'code' && (c.rtHtml || c.rtRunning)) {
        c.rtHtml = ''
        c.rtRunning = false
        rtRuns.set(c, (rtRuns.get(c) || 0) + 1)
      }
      // 代码格与 Laup 格边打边预览；文献声明变化时同步更新编号和列表。
      // v2 的渲染是纯函数（不写入变量作用域），所以编辑 Laup 也能实时重排。
      this.renderCodeCells(refreshReferences, this.cells.indexOf(c))
      this.persist()
    },

    // 按 v2 内核渲染一格（纯函数，不写入变量作用域）。
    renderCell(c, pool, cited, isDisp, pane) {
      return runCellSourceV2(c, {
        scope: this.scope, refPool: pool, isRefDisplay: isDisp, pane, codeLang: this.codeLang,
      })
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
    // focusIndex：正在编辑的格下标 —— 它的左右邻格可能因配对变化而要重画。
    renderCodeCells(refreshReferences = false, focusIndex = -1) {
      const panes = planCodePanes(this.cells)
      const pool = this.refPool()
      const display = this.refDisplayIdx()
      this.cells.forEach((c, i) => {
        const near = focusIndex >= 0 && Math.abs(i - focusIndex) <= 1
        if (c.type !== 'code' && !panes.has(i) && !refreshReferences && !near) return
        const html = this.renderCell(c, pool, null, i === display, panes.get(i) || null).outputHtml
        c.outputHtml = c.type === 'code' ? html + this.codeRuntimeHtml(c) : html
      })
    },

    // 代码格显示 = 语法高亮预览 + 本机内核的真实输出（没连内核时后半段为空）。
    // 两段之间放一个标记，纸面预览与导出 PDF 据此只取预览部分。
    codeRuntimeHtml(c) {
      const runtimeHtml = (c.rtHtml || '') + (c.rtRunning ? RUNNING_HTML : '')
      return runtimeHtml ? RUNTIME_MARK + runtimeHtml : ''
    },

    // 只重画一格代码格（执行过程中增量刷新输出用，不惊动别的格）
    refreshCodeCell(c) {
      c.outputHtml = this.renderCell(c, null, null, false, null).outputHtml + this.codeRuntimeHtml(c)
    },

    // 把这一格交给本机内核执行。只有连上内核、且确实是代码格时才会走到这里。
    executeCodeCell(id) {
      const c = this.cells.find((x) => x.id === id)
      if (!c || c.type !== 'code') return
      const seq = (rtRuns.get(c) || 0) + 1
      rtRuns.set(c, seq)
      c.rtRunning = true
      this.refreshCodeCell(c)
      runCodeCell(c.source, {
        onUpdate: (html) => {
          if (rtRuns.get(c) !== seq) return
          c.rtHtml = html
          this.refreshCodeCell(c)
        },
      }).then((result) => {
        if (rtRuns.get(c) !== seq) return
        c.rtHtml = result.html
        if (result.executionCount) c.execCount = result.executionCount
        c.rtRunning = false
        this.refreshCodeCell(c)
        this.persist()
      }).catch((error) => {
        if (rtRuns.get(c) !== seq) return
        c.rtRunning = false
        c.rtHtml = `<div class="rt-out"><pre class="error-out rt-error">执行失败：${escapeHtml(error?.message || error)}</pre></div>`
        this.refreshCodeCell(c)
        this.persist()
      })
    },

    addAttachment(id, dataUrl) {
      const c = this.cells.find((x) => x.id === id)
      if (!c) return null
      c.attachments = c.attachments || {}
      let name
      do { name = `paste-${++pasteCounter}.png` } while (Object.hasOwn(c.attachments, name))
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

    // 全局文献池：v2 认 [references] 首行声明
    refPool() {
      return collectV2References(this.cells)
    },

    // 全局文献列表的展示格：由 v2 自己判定
    refDisplayIdx() {
      return v2ReferenceDisplayIndex(this.cells)
    },

    // ---------- 运行 ----------
    runCell(id, advance = false) {
      const c = this.cells.find((x) => x.id === id)
      if (!c) return
      // 代码格没有「执行」这回事：只是重画预览（不编译 Laup）；
      // 连上本机内核后，代码格才真的执行（单格执行，运行全部仍然只做预览）。
      if (c.type === 'code') {
        this.renderCodeCells()
        if (isRuntimeReady()) this.executeCodeCell(c.id)
      } else {
        c.execCount = ++this.execCounter
        const { outputHtml } = this.renderCell(c, this.refPool(), null,
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
      const disp = this.refDisplayIdx()
      const panes = planCodePanes(this.cells)
      this.cells.forEach((c, i) => {
        if (c.type !== 'code') c.execCount = ++this.execCounter
        try {
          const { outputHtml } = this.renderCell(c, pool, null, i === disp, panes.get(i) || null)
          c.outputHtml = outputHtml + (c.type === 'code' ? this.codeRuntimeHtml(c) : '')
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
      const cell = emptyCell(normalizeV2CellType(type))
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
      const next = normalizeV2CellType(type)
      if (c.type === next) return
      c.type = next
      // 切回 Laup：上一次的内核输出不再属于这一格，作废（含正在跑的那次）
      if (next !== 'code') {
        c.rtHtml = ''
        c.rtRunning = false
        rtRuns.set(c, (rtRuns.get(c) || 0) + 1)
      }
      // 换格型只重画，不执行 —— 切到代码格时也别偷偷跑一遍
      this.renderCodeCells(false, this.cells.indexOf(c))
      this.persist()
    },

    // ---------- 导入导出 ----------
    exportLanb(filename = 'notebook.lanb') {
      const blob = new Blob([JSON.stringify({
        // 内核输出属于「这台机器这一刻」，不进快照（换台机器打开会看见不存在的输出）
        cells: this.cells.map((c) => ({
          ...c,
          rtHtml: '',
          rtRunning: false,
          outputHtml: String(c.outputHtml || '').split(RUNTIME_MARK)[0],
        })),
        execCounter: this.execCounter, renderMode: this.renderMode,
        projectName: this.projectName, codeLang: this.codeLang,
      }, null, 2)], { type: 'application/json' })
      download(blob, filename)
    },

    importLanb(text) {
      const data = JSON.parse(text)
      if (!Array.isArray(data.cells) || !data.cells.length) throw new Error('文件里没有单元格')
      this.cells = this.prepareCells(data.cells)
      this.execCounter = data.execCounter || 0
      if (typeof data.projectName === 'string') this.projectName = data.projectName
      if (typeof data.codeLang === 'string' && data.codeLang) this.codeLang = normalizeLang(data.codeLang) || this.codeLang
      if (RENDER_MODES.includes(data.renderMode)) this.renderMode = data.renderMode
      this.selectedId = this.cells[0].id
      this.scope = {}
      this.runAll(false)
      this.persist(true)
    },

    // ipynb（Jupyter Notebook）导入：转换成标准 Laup 格
    //   markdown → laup 格；code → 原生代码格（语言记到项目设置里）；输出 → [output] Laup 格
    importIpynb(text) {
      const { cells, stats, lang } = ipynbToCells(text)
      this.cells = this.prepareCells(cells)
      if (lang) this.codeLang = normalizeLang(lang) || this.codeLang
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
      this.toast = `已导入 ipynb：${detail}${lang ? `（代码语言 ${lang}）` : ''}`
    },

    exportLaup() {
      try {
        const text = exportNotebookV2(this.cells, null, this.codeLang)
        const blob = new Blob([text], { type: 'text/plain' })
        download(blob, 'notebook.laup')
      } catch (error) {
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
