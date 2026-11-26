<script setup>
// Notebook 页面壳（路由 /notebook）：菜单栏 + 单元格区 + 手册整页 + 提交对话框。
// 键盘双模式（命令/编辑）对齐 Jupyter：Esc/Enter/j/k/a/b/d d/m/y/v。
import { onBeforeUnmount, onMounted, ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useNotebook } from './store.js'
import { parseLaupDoc } from './renderer.js'
import { useDraftAutosave } from '@/composables/useDraftAutosave'
import { getDraft, saveDraft, userDraftOwnerKey } from '@/services/drafts'
import { fetchPost } from '@/services/posts'
import { useUserStore } from '@/stores/user'
import { detectLaupKernel } from '../../shared/laupKernel.js'
import { importNotebookV2 } from './kernelV2.js'
import NavBar from '@/components/navBar.vue'
import MenuBar from './components/MenuBar.vue'
import CellCard from './components/CellCard.vue'
import HelpPanel from './components/HelpPanel.vue'
import SubmitDialog from './SubmitDialog.vue'
import './notebook.css'

const route = useRoute()
const store = useNotebook()
const userStore = useUserStore()

// 渲染内核由路由决定：/notebook = v1（旧版），/laup-v2 = v2（公测）。
// 编辑器、快捷键、草稿、提交链路完全共用，只有预览走不同的内核。
const props = defineProps({ kernel: { type: String, default: 'v1' }, embedded: Boolean })

const page = ref(null)
const showHelp = ref(false)
const showSubmit = ref(false)

// ── 实时渲染区（可折叠、宽度可拖动、分页预览）──
// 内容 = 各格 outputHtml 顺序拼接，也就是 v2 内核边打边出的产物。
// 这里按 A4 版心把内容切成一页页「纸」，观感对齐 LaTeX 的 PDF 预览；导出 PDF 用的也是它。
const renderOpen = ref(true)
const renderWidth = ref(44)
const zoom = ref(1)
const paper = ref(null)
const rendered = computed(() => store.cells.filter((c) => c.outputHtml))
const pages = ref([])

// A4 版心（96dpi 下 210×297mm，四周留 18mm/16mm 页边）——
// 高度一定要和样式表里的 .nb-sheet-body 高度保持一致，否则分页会和纸上内容对不上。
const SHEET_WIDTH_PX = Math.round((210 - 32) * 96 / 25.4)
const SHEET_HEIGHT_PX = Math.round((297 - 36) * 96 / 25.4)

// 排版上下文：每张纸上都是一个 .nb-flow，块与块之间的外边距规则和纸上完全一致。
// 不套 .nb-sheet-body 是因为 scoped 样式选择器（.nb-sheet-body[data-v-xxx]）
// 匹配不到新增的离屏节点，必须让 .nb-flow 自己承载印刷体样式。
const MEASURE_CONTEXT_CSS = `
  .nb-measure-root { width: ${SHEET_WIDTH_PX}px; font: 11.5pt/1.75 "Songti SC", "Source Han Serif SC", "SimSun", Georgia, serif; color: #16181c; }
  .nb-measure-root p { margin: 0; text-align: justify; text-indent: 2em; }
  .nb-measure-root h1 { font-size: 1.85em; line-height: 1.35; margin: 0 0 .7em; text-align: center; }
  .nb-measure-root h2 { font-size: 1.35em; margin: 1.1em 0 .5em; }
  .nb-measure-root h3 { font-size: 1.12em; margin: 1em 0 .4em; }
  .nb-measure-root h1 + p, .nb-measure-root h2 + p, .nb-measure-root h3 + p { text-indent: 0; }
  .nb-measure-root ul, .nb-measure-root ol { margin: 0; padding-left: 2.2em; }
  .nb-measure-root figure { margin: .8em 0; text-align: center; }
  .nb-measure-root figcaption { font-size: .86em; color: #4b5563; margin-top: .35em; }
  .nb-measure-root table { border-collapse: collapse; width: 100%; font-size: .9em; }
  .nb-measure-root caption { font-size: .86em; color: #4b5563; margin-bottom: .3em; }
  .nb-measure-root th, .nb-measure-root td { border: 1px solid #c7ccd1; padding: 3px 6px; text-align: left; }
  .nb-measure-root thead th { background: #f2f4f6; }
  .nb-measure-root pre { margin: 0; background: #f6f8fa; border: 1px solid #e5e8eb; border-radius: 4px; padding: 8px 10px; font: 9.5pt/1.55 Consolas, Menlo, monospace; white-space: pre-wrap; overflow-wrap: anywhere; }
  .nb-measure-root code { font-family: Consolas, Menlo, monospace; font-size: .92em; }
  .nb-measure-root img, .nb-measure-root svg { max-width: 100%; height: auto; }
  .nb-measure-root blockquote { margin: 0; padding-left: 1em; border-left: 3px solid #d0d7de; color: #4b5563; }
  .nb-measure-root .nb-flow > * + * { margin-top: .6em; }
`

const MEASURE_STYLE_ID = 'nb-measure-style'

/** 把整篇 HTML 切成若干页（离屏量块高 → 按版心高度累加；超长块再按行切）。
 *  返回 { pages, pending }：pending 是测量时还没解码完的图片，宿主可据此补排。 */
function paginate(html) {
  if (!html.trim()) return { pages: [], pending: [] }
  if (!document.getElementById(MEASURE_STYLE_ID)) {
    const style = document.createElement('style')
    style.id = MEASURE_STYLE_ID
    style.textContent = MEASURE_CONTEXT_CSS
    document.head.appendChild(style)
  }
  const stage = document.createElement('div')
  stage.className = 'nb-measure-root nb-sheet-measure'
  stage.innerHTML = `<div class="nb-flow">${html}</div>`
  document.body.appendChild(stage)
  const flow = stage.firstElementChild
  const blocks = Array.from(flow.children)
  const result = []
  const pending = []
  let current = ''
  let used = 0
  const flush = () => {
    if (!current) return
    result.push(`<div class="nb-flow">${current}</div>`)
    current = ''
    used = 0
  }
  try {
    // 图片没解码完时高度不可信（会被当成 0），记下来让宿主排完再补一次
    for (const img of stage.querySelectorAll('img')) {
      if (img.complete) continue
      pending.push(new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true })
        img.addEventListener('error', resolve, { once: true })
      }))
    }

    for (const block of blocks) {
      const height = flowHeight(block, flow)
      if (used + height <= SHEET_HEIGHT_PX) {
        current += block.outerHTML
        used += height
        continue
      }
      if (height <= SHEET_HEIGHT_PX) {
        flush()
        current += block.outerHTML
        used = height
        continue
      }
      // 超长块（长代码、长表、长引用、长公式）：先结页，再逐行切开
      flush()
      for (const piece of splitOversize(block, flow)) result.push(piece)
    }
    flush()
  } finally {
    stage.remove()
  }
  return { pages: result, pending }
}

/** 元素在连续流里的占位高度：自身高度 + .nb-flow > * + * 的上外边距。 */
function flowHeight(node, flow) {
  const rect = node.getBoundingClientRect().height
  const margin = node === flow.firstElementChild ? 0 : parseFloat(getComputedStyle(node).marginTop) || 0
  return rect + margin
}

const escHtml = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const TAG_OPEN = (el) => `<${el.tagName.toLowerCase()}${el.className ? ` class="${el.className}"` : ''}>`
const TAG_CLOSE = (el) => `</${el.tagName.toLowerCase()}>`

/** 超长块按单元切页。返回若干「整页」HTML（每段都带自己的 nb-flow 包裹）。 */
function splitOversize(block, flow) {
  const out = []
  const open = TAG_OPEN(block)
  const close = TAG_CLOSE(block)
  const units = segmentUnits(block)

  // 没有可切分的子元素（单行超长代码 / 单张超高图…）：整块独占一页，
  // 让它自己溢出，也不要把它后面的内容挤成空白页。
  if (!units.length) {
    out.push(`<div class="nb-flow nb-overflow">${block.outerHTML}</div>`)
    return out
  }

  let pageRemain = SHEET_HEIGHT_PX
  let chunk = ''
  const flushChunk = () => {
    if (!chunk) return
    out.push(`<div class="nb-flow">${open}${chunk}${close}</div>`)
    chunk = ''
    pageRemain = SHEET_HEIGHT_PX
  }

  for (const unit of units) {
    // 没有 DOM 节点的单元是纯文本行组（高亮缺失时的兜底），按行高直接算
    const unitHeight = unit.chunkText !== undefined ? unit.chunkHeight : flowHeight(unit, flow)
    const unitHtml = unit.chunkText !== undefined ? escHtml(unit.chunkText) : unit.outerHTML
    if (unitHeight <= pageRemain) {
      chunk += unitHtml
      pageRemain -= unitHeight
      continue
    }
    flushChunk()
    // 这一行自己就超过整页版心：单独占一页，不切行内文字
    if (unitHeight > SHEET_HEIGHT_PX) {
      out.push(`<div class="nb-flow nb-overflow">${open}${unitHtml}${close}</div>`)
      pageRemain = SHEET_HEIGHT_PX
      continue
    }
    chunk = unitHtml
    pageRemain = SHEET_HEIGHT_PX - unitHeight
  }
  flushChunk()
  return out
}

/** 表格 / 列表 / 代码以外，用直接子元素当下限（段落就整段不切，和 LaTeX 的段落处理一致）。 */
function segmentUnits(el) {
  const tag = el.tagName.toLowerCase()
  if (tag === 'table') return Array.from(el.querySelectorAll('tbody > tr, thead > tr'))
  if (tag === 'ul' || tag === 'ol') return Array.from(el.children).filter((c) => c.tagName === 'LI')
  if (tag === 'pre') {
    // 高亮器把代码逐行包成 <span class="ln">（没有高亮的走 <code> 纯文本，按行高等分）
    const lines = Array.from(el.querySelectorAll('.ln'))
    if (lines.length) return lines
    const raw = (el.textContent || '').split('\n')
    if (raw.length < 2) return []
    const box = getComputedStyle(el)
    const lineHeight = parseFloat(box.lineHeight) || 0
    if (!lineHeight) return []
    const padding = (parseFloat(box.paddingTop) || 0) + (parseFloat(box.paddingBottom) || 0)
    const usable = el.getBoundingClientRect().height - padding
    const perLine = Math.max(1, Math.floor(usable / lineHeight))
    return Array.from({ length: Math.ceil(raw.length / perLine) }, (_, i) => ({
      chunkText: raw.slice(i * perLine, (i + 1) * perLine).join('\n'),
      chunkHeight: lineHeight * Math.min(perLine, raw.length - i * perLine),
    }))
  }
  return Array.from(el.children)
}

// 分页是同步的：块高必须当场量准。字体由 document.fonts.ready 兜一次，
// 图片由 startPageObserver() 在解码完成后触发重排。
let pageTimer = null
let pageSeq = 0
function repaginate() {
  const html = rendered.value.map((cell) => cell.outputHtml).join('')
  if (!html.trim()) {
    pages.value = []
    return
  }
  try {
    const { pages: next, pending } = paginate(html)
    pages.value = next
    // 离屏测量时还有图片没解码：块高偏小，切页会错。等它们就绪后补排一次（只补一次）。
    if (pending.length) {
      const seq = ++pageSeq
      Promise.all(pending).then(() => {
        if (seq === pageSeq) setTimeout(repaginate, 0)
      })
    }
  } catch (error) {
    console.warn('分页失败，退回单页预览', error)
    pages.value = [`<div class="nb-flow">${html}</div>`]
  }
}

// 落进渲染面板的图（附件 / 外链）解码完成后重排一次：首屏时它们多半还没量出高度。
let pageObserver = null
function startPageObserver() {
  if (!paper.value) return
  pageObserver = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue
        const imgs = node.tagName === 'IMG' ? [node] : Array.from(node.querySelectorAll('img'))
        for (const img of imgs) {
          if (!img.complete) img.addEventListener('load', () => repaginate(), { once: true })
        }
      }
    }
  })
  pageObserver.observe(paper.value, { childList: true, subtree: true })
}

// 源码一变就重排（边打边出）：格数多时也只是几十次块高测量，成本很低。
// 纸张固定 A4 尺寸，与面板宽度无关，所以拖动分隔条不重排。
watch(
  () => store.cells.map((c) => (c.outputHtml ? c.outputHtml.length : 0)).join(','),
  () => {
    clearTimeout(pageTimer)
    pageTimer = setTimeout(repaginate, 90)
  },
  { immediate: true },
)
// 面板从收起变展开时也重排一次（收起期间量不到真实宽度的情况兜底）
watch(renderOpen, (open) => {
  if (open) requestAnimationFrame(() => { repaginate(); startPageObserver() })
})

// 字体加载完再排一次：首屏字体未就绪时行高偏小，页数会算少。
if (document.fonts?.ready) document.fonts.ready.then(repaginate)

function startDrag(event) {
  const shell = event.currentTarget.parentElement
  const move = (e) => {
    const rect = shell.getBoundingClientRect()
    const percent = ((rect.right - e.clientX) / rect.width) * 100
    renderWidth.value = Math.min(70, Math.max(25, Math.round(percent)))
  }
  const up = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
}

// 导出 PDF：用浏览器自己的打印引擎出 A4、文字可选中，不额外塞一个 pdf 库。
// 送进打印文档的是同一套分页结果，所以屏幕上看的样子就是印出来的样子。
function exportPdf() {
  if (!pages.value.length) {
    store.toast = '还没有可导出的内容'
    return
  }
  const host = document.createElement('iframe')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0'
  document.body.appendChild(host)
  const title = (store.draftTitle || 'Laup 文档').replace(/[<>&]/g, '')
  const sheets = pages.value
    .map((page) => `<section class="nb-print-sheet">${page}</section>`)
    .join('')
  const doc = host.contentDocument
  doc.open()
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #16181c; font: 11.5pt/1.75 "Songti SC", "Source Han Serif SC", "SimSun", Georgia, serif; }
  .nb-print-sheet { break-after: page; }
  .nb-print-sheet:last-child { break-after: auto; }
  .nb-flow > * + * { margin-top: .6em; }
  h1 { font-size: 1.85em; line-height: 1.35; margin: 0 0 .7em; text-align: center; }
  h2 { font-size: 1.35em; margin: 1.1em 0 .5em; }
  h3 { font-size: 1.12em; margin: 1em 0 .4em; }
  p { margin: 0; text-align: justify; text-indent: 2em; hyphens: auto; }
  .nb-flow > h1 + p, .nb-flow > h2 + p, .nb-flow > h3 + p, .nb-flow > ul + p, .nb-flow > table + p { text-indent: 0; }
  ul, ol { margin: 0; padding-left: 2.2em; }
  figure { margin: .8em 0; text-align: center; }
  figcaption { font-size: .86em; color: #4b5563; margin-top: .35em; }
  table { border-collapse: collapse; width: 100%; font-size: .9em; }
  caption { font-size: .86em; color: #4b5563; margin-bottom: .3em; }
  th, td { border: 1px solid #c7ccd1; padding: 3px 6px; text-align: left; }
  thead th { background: #f2f4f6; }
  pre { margin: 0; background: #f6f8fa; border: 1px solid #e5e8eb; border-radius: 4px; padding: 8px 10px; font: 9.5pt/1.55 Consolas, Menlo, monospace; white-space: pre-wrap; overflow-wrap: anywhere; }
  code { font-family: Consolas, Menlo, monospace; font-size: .92em; }
  img, svg { max-width: 100%; height: auto; }
  blockquote { margin: 0; padding-left: 1em; border-left: 3px solid #d0d7de; color: #4b5563; }
  hr { border: 0; border-top: 1px solid #d0d7de; }
  .nb-flow, .nb-flow * { break-inside: auto; }
  h1, h2, h3, caption, figcaption { break-after: avoid; }
</style></head><body>${sheets}</body></html>`)
  doc.close()
  const fire = () => {
    host.contentWindow.focus()
    host.contentWindow.print()
    setTimeout(() => host.remove(), 1500)
  }
  if (doc.readyState === 'complete') fire()
  else host.onload = fire
}

// ── 草稿箱（与 laup_editor 同一套 IndexedDB 服务 + 自动保存 composable）──
// 快照/载荷都只含可序列化字段：格源码 + 附件 dataURL + 作用域 + 运行计数。
function draftBody() {
  return {
    cells: store.cells.map((c) => ({ type: c.type, source: c.source, attachments: c.attachments || {} })),
    scope: store.scope,
    execCounter: store.execCounter,
    // 渲染位置（下方/原地/折叠）跟草稿一起走：换台机器继续编辑时观感一致
    renderMode: store.renderMode,
    // 内核标记：草稿箱据此把「继续编辑」送回 /notebook 或 /laup-v2
    kernel: store.kernel,
  }
}

const draftAutosave = useDraftAutosave({
  source: draftBody,
  buildDraft: async (draftId) => {
    await userStore.initialize().catch(() => {})
      return {
        ownerKey: userDraftOwnerKey(userStore.user),
        contentType: 'NOTEBOOK',
        mode: 'CREATE',
        title: store.draftTitle,
        // JSON 深克隆脱掉 Vue 的 reactive Proxy —— IndexedDB 结构化克隆不收 Proxy
        payload: JSON.parse(JSON.stringify({ ...draftBody(), editPost: store.editPost || null })),
      }
  },
})

// 草稿 id / 状态文案同步到 store（SubmitDialog 发布后删草稿、MenuBar 显示状态）
watch([draftAutosave.draftId, draftAutosave.status, draftAutosave.lastSavedAt, draftAutosave.errorMessage], () => {
  store.draftId = draftAutosave.draftId.value
  const time = draftAutosave.lastSavedAt.value
    ? new Date(draftAutosave.lastSavedAt.value).toLocaleTimeString()
    : ''
  if (draftAutosave.errorMessage.value) store.draftStatus = `草稿保存失败：${draftAutosave.errorMessage.value}`
  else if (draftAutosave.status.value === 'saving') store.draftStatus = '正在保存草稿……'
  else if (draftAutosave.status.value === 'pending' || draftAutosave.status.value === 'dirty') store.draftStatus = '有未保存的修改'
  else if (draftAutosave.status.value === 'saved') store.draftStatus = time ? `草稿已保存 · ${time}` : '草稿已保存'
  else store.draftStatus = ''
}, { immediate: true })

onMounted(async () => {
  // 渲染面板只在 v2 页面上首屏打开（v2 内核是边打边出，天生就是"实时"的）
  if (props.kernel !== 'v2') {
    renderOpen.value = false
  } else {
    // 面板首屏就是展开的，watch 不会触发，这里手动接管图片就绪后的重排
    requestAnimationFrame(startPageObserver)
  }
  store.setKernel(props.kernel)
  store.ensureLoaded()
  if (props.embedded) return
  // ?draft=<id>：从草稿箱「继续编辑」跳回来
  const draftId = String(route.query.draft || '')
  if (draftId) {
    try {
      const draft = await getDraft(draftId)
      // NOTEBOOK 正规体裁；ARTICLE 是早期版本误存的（payload.cells 为指纹），载入时顺手修复类型
      const isNotebookDraft = draft && (
        draft.contentType === 'NOTEBOOK' ||
        (draft.contentType === 'ARTICLE' && Array.isArray(draft.payload?.cells))
      )
      if (isNotebookDraft) {
        if (draft.contentType !== 'NOTEBOOK') {
          await saveDraft({ ...draft, contentType: 'NOTEBOOK' }).catch(() => {})
        }
        store.applyDraft(draft.payload || {})
        store.editPost = draft.payload?.editPost || null
        draftAutosave.setDraft(draft)
        // 草稿带着内核标记：跨页打开时提示一下，避免"v2 稿子在 v1 页面里看着不对"被当成渲染 bug
        const draftKernel = draft.payload?.kernel === 'v2' ? 'v2' : 'v1'
        store.toast = draftKernel === props.kernel
          ? '已载入本机草稿'
          : `这份草稿是用 ${draftKernel} 内核保存的，当前是 ${props.kernel} 内核，建议回草稿箱重新打开`
      } else {
        store.toast = '没找到这份草稿（可能已被删除或换过浏览器）'
      }
    } catch {
      store.toast = '草稿载入失败'
    }
  }
  // ?edit=<postId>：从文章详情页「编辑」跳回来 —— 载入 Laup 源码并记住编辑目标
  const editId = String(route.query.edit || '')
  if (editId) {
    try {
      await userStore.initialize().catch(() => {})
      const post = await fetchPost(editId)
      if (post?.contentType !== 'laup' || !post.contentSource) {
        store.toast = '这篇不是 Laup 正文，无法在 Notebook 中编辑'
      } else {
        // 文档由哪套内核写的，就用哪套解析器装回格（v2 的格标记 v1 解析器不认）
        const docKernel = post.contentKernel === 'v1' || post.contentKernel === 'v2'
          ? post.contentKernel
          : detectLaupKernel(post.contentSource)
        const cells = docKernel === 'v2'
          ? importNotebookV2(post.contentSource)
          : parseLaupDoc(post.contentSource)
        store.applyDraft({ cells, scope: {}, execCounter: 0 })
        store.toast = docKernel === props.kernel
          ? `正在编辑文章「${post.title}」`
          : `这篇是用 ${docKernel} 内核写的，当前是 ${props.kernel} 页面 —— 建议到对应入口编辑`
        store.editPost = {
          id: post.id,
          version: Number(post.version) || 1,
          title: post.title || '',
          author: post.author || '',
          tags: Array.isArray(post.tags) ? post.tags : [],
          type: post.type || '',
          license: post.license || '支持闭源',
          visibility: post.visibility || 'PUBLIC',
        }
      }
    } catch (e) {
      store.toast = `文章载入失败：${e?.message || '未知错误'}`
    }
  }
  draftAutosave.setReady(true)
})

// toast 自动消失
let toastTimer = null
watch(() => store.toast, (t) => {
  if (!t) return
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { store.toast = null }, 3500)
})

// 发布成功后 SubmitDialog 会清空 store.draftId；这里把自动保存器一并作废，
// 否则它的内部 draftId 还指着已删除的草稿（或在途保存返回后把草稿"复活"）。
watch(() => store.draftId, (val, old) => {
  if (old && !val) draftAutosave.discardDraft()
})

// 命令模式快捷键（编辑态或焦点在表单/编辑器内时不拦截）
let lastKey = null
function onKeydown(e) {
  if (showHelp.value || showSubmit.value) return
  // Ctrl/Cmd+P：导出的 PDF 用面板的分页结果，别让浏览器去打印整个编辑界面
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
    if (props.kernel !== 'v2') return
    e.preventDefault()
    exportPdf()
    return
  }
  if (store.mode === 'edit') return
  const t = e.target
  if (props.embedded && !page.value?.contains(t)) return
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'BUTTON' || t.tagName === 'SELECT' || t.closest?.('.cm-editor'))) return

  if (e.shiftKey && e.key === 'Enter') {
    e.preventDefault()
    if (store.selectedId == null && store.cells.length) store.select(store.cells[0].id)
    store.runCell(store.selectedId, true)
    return
  }
  switch (e.key) {
    case 'Enter':
      e.preventDefault()
      if (store.selectedId == null && store.cells.length) store.select(store.cells[0].id)
      store.setMode('edit')
      break
    case 'j': case 'ArrowDown':
      e.preventDefault(); store.moveSel(1); break
    case 'k': case 'ArrowUp':
      e.preventDefault(); store.moveSel(-1); break
    case 'a': store.insertCell(Math.max(0, store.selectedIndex) - 1); break
    case 'b': store.insertCell(Math.max(0, store.selectedIndex)); break
    case 'd':
      if (lastKey === 'd') store.delCell()
      break
    case 'm': if (store.selectedId) store.setType(store.selectedId, 'laup'); break
    case 'v': if (store.kernel === 'v1' && store.selectedId) store.setType(store.selectedId, 'var'); break
    case 'y': if (store.selectedId) store.setType(store.selectedId, 'code'); break
  }
  lastKey = e.key
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  clearTimeout(toastTimer)
  clearTimeout(pageTimer)
  pageObserver?.disconnect()
})
</script>

<template>
  <div id="notebook-page" ref="page" :class="{ 'notebook-embedded': embedded }">
    <template v-if="!showHelp">
      <NavBar v-if="!embedded" />
      <MenuBar :embedded="embedded" @toggle-help="showHelp = true" @submit="showSubmit = true" />
      <div id="notebook">
        <CellCard v-for="c in store.cells" :key="c.id" :cell="c" />
        <div class="ghost-add" title="在末尾新建 laup 格（快捷键 B）" @click="store.insertCell(store.cells.length - 1)">
          + 新建单元格
        </div>
      </div>
      <!-- 实时渲染区（可折叠）：Laup 产物按 A4 分页排成阅读版式，跟 LaTeX 的 PDF 预览一个意思 -->
      <aside v-if="renderOpen" class="nb-render" :style="{ width: renderWidth + '%' }">
        <div class="nb-render-bar">
          <span>实时渲染 · {{ pages.length }} 页</span>
          <span class="nb-render-actions">
            <button type="button" title="缩小" @click="zoom = Math.max(0.6, +(zoom - 0.1).toFixed(2))">−</button>
            <button type="button" class="nb-zoom-value" title="恢复 100%" @click="zoom = 1">{{ Math.round(zoom * 100) }}%</button>
            <button type="button" title="放大" @click="zoom = Math.min(2, +(zoom + 0.1).toFixed(2))">+</button>
            <button type="button" title="导出为 PDF（浏览器打印，可选另存为 PDF）" @click="exportPdf">导出 PDF</button>
            <button type="button" title="收起渲染区" @click="renderOpen = false">收起</button>
          </span>
        </div>
        <div ref="paper" class="nb-paper">
          <div class="nb-paper-stack" :style="{ '--nb-zoom': zoom }">
            <section v-for="(page, i) in pages" :key="i" class="nb-sheet">
              <div class="nb-sheet-body" v-html="page"></div>
              <div class="nb-sheet-no">{{ i + 1 }} / {{ pages.length }}</div>
            </section>
            <p v-if="!pages.length" class="nb-paper-empty">在左边写 Laup，这里会实时出现排版结果。</p>
          </div>
        </div>
      </aside>
      <div v-if="renderOpen" class="nb-render-split" role="separator" aria-orientation="vertical" tabindex="0"
           aria-label="拖动调整渲染区宽度" @pointerdown="startDrag"
           @keydown.left.prevent="renderWidth = Math.min(70, renderWidth + 2)"
           @keydown.right.prevent="renderWidth = Math.max(25, renderWidth - 2)"></div>
      <button v-else class="nb-render-show" type="button" title="展开实时渲染区" @click="renderOpen = true">渲染</button>
      <transition name="nb-toast">
        <div v-if="store.toast" class="nb-toast">{{ store.toast }}</div>
      </transition>
    </template>

    <HelpPanel v-else @close="showHelp = false" />

    <SubmitDialog v-if="showSubmit" @close="showSubmit = false" />
  </div>
</template>

<style scoped>
.nb-toast {
  position: fixed;
  left: 50%;
  bottom: 34px;
  transform: translateX(-50%);
  background: #2c2c2a;
  color: #fff;
  font-size: 13px;
  padding: 8px 18px;
  border-radius: 8px;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, .2);
}
.nb-toast-enter-active, .nb-toast-leave-active { transition: opacity .25s, transform .25s; }
.nb-toast-enter-from, .nb-toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(8px); }

/* ── 实时渲染区 ──
   页面本来就是竖向流（NavBar → 菜单 → 单元格），渲染区贴在右侧：
   整页改为横向 flex + 换行，头部（NavBar/菜单）各占满一行，正文区左右分栏。 */
#notebook-page { display: flex; flex-direction: row; flex-wrap: wrap; align-items: flex-start; }
#notebook-page :deep(#menubar) { flex: 0 0 100%; }
#notebook-page > .servicenav, #notebook-page > nav:first-child { flex: 0 0 100%; }
#notebook-page #notebook { flex: 1 1 420px; min-width: 0; min-height: 60vh; }
/* 分栏后左右两侧各自滚动：编辑区跟着窗口走，渲染区固定在可视高度里翻页看 */
#notebook-page #notebook { max-height: calc(100vh - 108px); overflow: auto; }
.nb-render { height: calc(100vh - 108px); position: sticky; top: 8px; }
.nb-render {
  flex: none; display: flex; flex-direction: column;
  min-width: 0; border-left: 1px solid #e3e3e3; background: #fbfbfa;
}
.nb-render-bar {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  flex: none; padding: 6px 12px; border-bottom: 1px solid #e3e3e3;
  font: 12px/1.4 system-ui, sans-serif; color: #57606a; background: #fff;
}
.nb-render-actions { display: inline-flex; gap: 6px; }
.nb-render-actions button {
  border: 1px solid #d8d8d8; border-radius: 4px; background: #fff;
  padding: 2px 9px; font: 12px/1.5 system-ui, sans-serif; color: #333; cursor: pointer;
}
.nb-render-actions button:hover { border-color: #2f806a; color: #2f806a; }
.nb-zoom-value { min-width: 46px; }
.nb-paper {
  flex: 1; min-height: 0; overflow: auto; padding: 18px 10px 40px;
  background: #eceded;
}
.nb-paper-stack {
  display: flex; flex-direction: column; align-items: center; gap: 18px;
  /* 纸张按 A4 实际尺寸排版，再整体缩放到面板宽度 / 用户缩放比例 */
  zoom: var(--nb-zoom, 1);
}
/* 一张 A4 纸：210×297mm 版心 176×261mm（页边 16mm / 18mm） */
.nb-sheet {
  position: relative; flex: none;
  width: 178mm; min-height: 261mm;
  padding: 18mm 16mm;
  background: #fff; box-sizing: border-box;
  box-shadow: 0 1px 2px rgba(15, 23, 42, .08), 0 6px 18px rgba(15, 23, 42, .10);
  color: #16181c;
  font: 11.5pt/1.75 "Songti SC", "Source Han Serif SC", "SimSun", Georgia, serif;
}
.nb-sheet-no {
  position: absolute; bottom: 8mm; left: 0; right: 0;
  text-align: center; font: 10px/1 system-ui, sans-serif; color: #9aa3ad;
}
.nb-sheet-body { width: 100%; }
/* 离屏测量：必须真实排版（不能 display:none / visibility:hidden），否则高度全是 0。
   印刷体样式由 paginate() 注入的全局 .nb-measure-root 提供（scoped 样式选不中后插的节点）。 */
.nb-sheet-measure {
  position: fixed; left: -20000px; top: 0; z-index: -1;
  pointer-events: none; background: #fff;
}
.nb-sheet-body > .nb-flow > * + * { margin-top: .6em; }
.nb-sheet-body :deep(h1) { font-size: 1.85em; line-height: 1.35; margin: 0 0 .7em; text-align: center; }
.nb-sheet-body :deep(h2) { font-size: 1.35em; margin: 1.1em 0 .5em; }
.nb-sheet-body :deep(h3) { font-size: 1.12em; margin: 1em 0 .4em; }
.nb-sheet-body :deep(p) { margin: 0; text-align: justify; text-indent: 2em; }
.nb-sheet-body :deep(h1 + p), .nb-sheet-body :deep(h2 + p), .nb-sheet-body :deep(h3 + p) { text-indent: 0; }
.nb-sheet-body :deep(ul), .nb-sheet-body :deep(ol) { margin: 0; padding-left: 2.2em; }
.nb-sheet-body :deep(figure) { margin: .8em 0; text-align: center; }
.nb-sheet-body :deep(figcaption) { font-size: .86em; color: #4b5563; margin-top: .35em; }
.nb-sheet-body :deep(table) { border-collapse: collapse; width: 100%; font-size: .9em; }
.nb-sheet-body :deep(caption) { font-size: .86em; color: #4b5563; margin-bottom: .3em; }
.nb-sheet-body :deep(th), .nb-sheet-body :deep(td) { border: 1px solid #c7ccd1; padding: 3px 6px; text-align: left; }
.nb-sheet-body :deep(thead th) { background: #f2f4f6; }
.nb-sheet-body :deep(pre) {
  margin: 0; background: #f6f8fa; border: 1px solid #e5e8eb; border-radius: 4px;
  padding: 8px 10px; font: 9.5pt/1.55 Consolas, Menlo, monospace;
  white-space: pre-wrap; overflow-wrap: anywhere;
}
.nb-sheet-body :deep(code) { font-family: Consolas, Menlo, monospace; font-size: .92em; }
.nb-sheet-body :deep(img), .nb-sheet-body :deep(svg) { max-width: 100%; height: auto; }
.nb-sheet-body :deep(blockquote) { margin: 0; padding-left: 1em; border-left: 3px solid #d0d7de; color: #4b5563; }
/* 单块高于整页（超长代码 / 长表 / 大图）：不硬切行内，让它自己撑出边界，
   下面垫一条警示色，避免被误当成"排版漏了" */
.nb-sheet-body :deep(.nb-overflow) { outline: 2px dashed #e0a03a; outline-offset: 6px; }
.nb-paper-empty { color: #98a2b3; font: 13px/1.6 system-ui, sans-serif; }
.nb-render-split { flex: 0 0 5px; cursor: col-resize; background: #f0f1f2; }
.nb-render-split:hover { background: #d8dee4; }
.nb-render-show {
  position: fixed; right: 16px; top: 96px; z-index: 30;
  border: 1px solid #d8d8d8; border-radius: 999px; background: #fff;
  padding: 5px 14px; font: 12px/1.5 system-ui, sans-serif; color: #333; cursor: pointer;
  box-shadow: 0 2px 8px rgba(15, 23, 42, .12);
}
.nb-render-show:hover { border-color: #2f806a; color: #2f806a; }

/* 打印整页时只留编辑区，渲染区/菜单/提示都不要 */
@media print {
  .nb-render, .nb-render-split, .nb-render-show, .nb-toast { display: none !important; }
  #notebook-page #notebook { overflow: visible !important; max-height: none !important; padding: 0 !important; }
  #notebook-page .toolbar { display: none !important; }
}
</style>
