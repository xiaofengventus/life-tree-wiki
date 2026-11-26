<script setup>
// Notebook 页面壳（路由 /laup-v2）：菜单栏 + 单元格区 + 手册整页 + 提交对话框。
// 键盘双模式（命令/编辑）对齐 Jupyter：Esc/Enter/j/k/a/b/d d/m/y/v。
import { onBeforeUnmount, onMounted, ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useNotebook } from './store.js'
import { useDraftAutosave } from '@/composables/useDraftAutosave'
import { getDraft, saveDraft, userDraftOwnerKey } from '@/services/drafts'
import { fetchPost } from '@/services/posts'
import { useUserStore } from '@/stores/user'
import { detectLaupKernel } from '../../shared/laupKernel.js'
import { importNotebookV2 } from './kernelV2.js'
import { parseLaupDoc } from './renderer.js'
import { MEASURE_CSS, PREVIEW_CSS, SHEET_CSS, SHEET_HEIGHT_PX } from './printStyle.js'
import { renderMathIn } from './mathRender.js'
import { buildHtmlDocument, downloadHtml, safeFileName } from './htmlExport.js'
import NavBar from '@/components/navBar.vue'
import MenuBar from './components/MenuBar.vue'
import CellCard from './components/CellCard.vue'
import HelpPanel from './components/HelpPanel.vue'
import CreateProjectDialog from './CreateProjectDialog.vue'
import RuntimeDialog from './runtime/RuntimeDialog.vue'
import SubmitDialog from './SubmitDialog.vue'
import './notebook.css'

const route = useRoute()
const store = useNotebook()
const userStore = useUserStore()

// 编辑器只有一套内核：认不出的命令原样当正文，旧 v1 文章也能载入修改。
// /notebook 旧链接由路由重定向到这里。
const props = defineProps({ embedded: Boolean })

const page = ref(null)
const showHelp = ref(false)
const showSubmit = ref(false)
// 新建项目对话框：没有项目名（首次进入 / 点了「新建」）时先问基本信息
const showCreate = ref(false)
// 本机内核对话框：连接后代码格才会真的执行
const showRuntime = ref(false)

// ── 实时渲染区（可折叠、宽度可拖动、分页预览）──
// 内容 = 各格 outputHtml 顺序拼接，也就是 v2 内核边打边出的产物。
// 这里按 A4 版心把内容切成一页页「纸」，观感对齐 LaTeX 的 PDF 预览；导出 PDF 用的也是它。
const renderOpen = ref(true)
const renderWidth = ref(44)
const zoom = ref(1)
const paper = ref(null)
// 纸面就是每格的渲染产物 —— 包括代码格的内核输出。
// 与格下预览、导出 PDF / HTML 用同一份 outputHtml，四处不会各显示各的。
const rendered = computed(() => store.cells.map((c) => String(c.outputHtml || '')).filter(Boolean))
const pages = ref([])

// 纸张底色：左边格下预览与右边纸面共用同一个 --nb-paper-bg，跟着本机走
const PAPER_TONES = [
  { id: 'white', label: '白', bg: '#ffffff' },
  { id: 'ivory', label: '米黄', bg: '#fbf6ea' },
  { id: 'celadon', label: '青瓷', bg: '#f2f6f4' },
  { id: 'gray', label: '浅灰', bg: '#f5f6f8' },
]
const PAPER_TONE_KEY = 'nb-paper-tone'
const paperTone = ref((() => {
  try { return localStorage.getItem(PAPER_TONE_KEY) || 'white' } catch { return 'white' }
})())
const paperStyle = computed(() => ({
  '--nb-paper-bg': (PAPER_TONES.find((t) => t.id === paperTone.value) || PAPER_TONES[0]).bg,
}))
watch(paperTone, (id) => {
  try { localStorage.setItem(PAPER_TONE_KEY, id) } catch { /* 隐私模式下忽略 */ }
})

// A4 版心 + 印刷体样式都在 printStyle.js：屏幕上的纸、离屏测量、导出 PDF 三处
// 共用同一份 CSS，分页算出来的高度才对得上纸上的实际内容。
const MEASURE_STYLE_ID = 'nb-measure-style'
const DOC_STYLE_ID = 'nb-doc-style'

/** 格下预览与右侧纸面用同一份 DOC_CSS（只有作用域前缀不同）。 */
function ensureDocStyle() {
  if (document.getElementById(DOC_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = DOC_STYLE_ID
  style.textContent = `${PREVIEW_CSS}\n${SHEET_CSS}`
  document.head.appendChild(style)
}

/** 把整篇 HTML 切成若干页（离屏量块高 → 按版心高度累加；超长块再按行切）。
 *  返回 { pages, pending }：pending 是测量时还没解码完的图片，宿主可据此补排。 */
function paginate(html) {
  if (!html.trim()) return { pages: [], pending: [] }
  ensureDocStyle()
  if (!document.getElementById(MEASURE_STYLE_ID)) {
    const style = document.createElement('style')
    style.id = MEASURE_STYLE_ID
    style.textContent = MEASURE_CSS
    document.head.appendChild(style)
  }
  const stage = document.createElement('div')
  stage.className = 'nb-measure-root nb-sheet-measure'
  stage.innerHTML = `<div class="nb-flow">${html}</div>`
  document.body.appendChild(stage)
  // 公式必须先排成 KaTeX 再量高：占位节点量出来的是一个空 span 的高度，
  // 分页就会错位，纸面上还会直接显示 \mathbf 之类的源码。
  renderMathIn(stage)
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
      // 超长块（长代码、长表、长引用、长公式）：先填满当前页的剩余高度，再逐行续到后续页
      for (const piece of splitOversize(block, flow, SHEET_HEIGHT_PX - used, used > 0)) {
        if (piece.text !== undefined) {
          current += piece.text
          used += piece.height
          continue
        }
        flush()
        result.push(piece.html)
      }
      flush()
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

/**
 * 超长块按单元切页。
 * 第一段可以续在当前页剩余高度里（remain 是当前页剩下的版心，continuePage 表示
 * 当前页还有内容，所以第一段不能超过整页）——否则一段长代码永远从新页开始，
 * 前面那半页就空着了。
 * 返回 [{ text, height }]（续在当前页）或 { html }（独立成页）。
 */
function splitOversize(block, flow, remain = SHEET_HEIGHT_PX, continuePage = false) {
  const out = []
  const open = TAG_OPEN(block)
  const close = TAG_CLOSE(block)
  const units = segmentUnits(block)

  // 没有可切分的子元素（单行超长代码 / 单张超高图…）：整块独占一页，
  // 让它自己溢出，也不要把它后面的内容挤成空白页。
  if (!units.length) {
    out.push({ html: `<div class="nb-flow nb-overflow">${block.outerHTML}</div>` })
    return out
  }

  let pageRemain = continuePage ? remain : SHEET_HEIGHT_PX
  let chunk = ''
  let chunkHeight = 0
  const flushChunk = (asNewPage) => {
    if (!chunk) return
    if (asNewPage) out.push({ html: `<div class="nb-flow">${open}${chunk}${close}</div>` })
    else out.push({ text: `${open}${chunk}${close}`, height: chunkHeight })
    chunk = ''
    chunkHeight = 0
    pageRemain = SHEET_HEIGHT_PX
  }

  for (const unit of units) {
    // 没有 DOM 节点的单元是纯文本行组（高亮缺失时的兜底），按行高直接算
    const unitHeight = unit.chunkText !== undefined ? unit.chunkHeight : flowHeight(unit, flow)
    const unitHtml = unit.chunkText !== undefined ? escHtml(unit.chunkText) : unit.outerHTML
    if (unitHeight <= pageRemain) {
      chunk += unitHtml
      chunkHeight += unitHeight
      pageRemain -= unitHeight
      continue
    }
    flushChunk(true)
    // 这一行自己就超过整页版心：单独占一页，不切行内文字
    if (unitHeight > SHEET_HEIGHT_PX) {
      out.push({ html: `<div class="nb-flow nb-overflow">${open}${unitHtml}${close}</div>` })
      pageRemain = SHEET_HEIGHT_PX
      continue
    }
    chunk = unitHtml
    chunkHeight = unitHeight
    pageRemain = SHEET_HEIGHT_PX - unitHeight
  }
  flushChunk(true)
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
  const html = rendered.value.join('')
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
  () => store.cells.map((c) => String(c.outputHtml || '').length).join(','),
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

// 导出 PDF：真·PDF 文件（pdf-lib 自己写字形），不走 window.print()。
// print() 会让打印驱动二次排版，屏幕正确、印出来错乱；这里把屏幕排好的坐标直接抄进 PDF。
const exporting = ref(false)
async function exportPdf() {
  if (!pages.value.length) {
    store.toast = '还没有可导出的内容'
    return
  }
  if (exporting.value) return
  exporting.value = true
  const title = (store.draftTitle || 'Laup 文档').trim()
  try {
    // 动态引入：pdf-lib + 11MB 字体只在真要导出时才加载，不拖慢编辑页
    const { exportHtmlToPdf, downloadPdf } = await import('./pdfExport.js')
    const bytes = await exportHtmlToPdf({
      pagesHtml: pages.value,
      title,
      onProgress: (msg) => { store.toast = msg },
    })
    downloadPdf(bytes, `${title || 'laup'}.pdf`)
    store.toast = `已导出 ${title}.pdf`
  } catch (error) {
    console.error('导出 PDF 失败', error)
    store.toast = `导出失败：${error?.message || error}`
  } finally {
    exporting.value = false
  }
}

// 导出 HTML：只有文档正文（站点导航、分页都不要），单文件、离线可看。
// 与 PDF 用同一份「渲染后」内容（rendered），所以两者不会一个样一个样。
function exportHtml() {
  const html = rendered.value.join('')
  if (!html.trim()) {
    store.toast = '还没有可导出的内容'
    return
  }
  const title = (store.draftTitle || 'Laup 文档').trim()
  const filename = `${safeFileName(title)}.html`
  try {
    downloadHtml(buildHtmlDocument({ html, title }), filename)
    store.toast = `已导出 ${filename}`
  } catch (error) {
    console.error('导出 HTML 失败', error)
    store.toast = `导出失败：${error?.message || error}`
  }
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
    // 项目基本信息也进草稿：继续编辑时不用重新填名称与代码语言
    projectName: store.projectName,
    codeLang: store.codeLang,
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
  // 面板首屏就是展开的，watch 不会触发，这里手动接管图片就绪后的重排
  requestAnimationFrame(startPageObserver)
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
        store.toast = '已载入本机草稿'
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
        // 内核只有一套：老文章按它自己的写法拆格，认不出的命令原样显示，
        // 作者改好后直接保存 —— 不再有「v1 只能读」这道墙
        const docKernel = post.contentKernel === 'v1' || post.contentKernel === 'v2'
          ? post.contentKernel
          : detectLaupKernel(post.contentSource)
        if (docKernel === 'v1') {
          const cells = parseLaupDoc(post.contentSource).map((c) => ({ type: 'laup', source: c.source }))
          store.applyDraft({ cells, scope: {}, execCounter: 0, projectName: post.title || '' })
          store.toast = `「${post.title}」是旧写法文章，已载入编辑；认不出的命令会原样显示，改好保存即可`
        } else {
          const { cells, codeLang } = importNotebookV2(post.contentSource)
          store.applyDraft({ cells, scope: {}, execCounter: 0, projectName: post.title || '', codeLang })
          store.toast = `正在编辑文章「${post.title}」`
        }
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
  // 新建：显式 ?new=1，或本地还没有项目名（旧快照 / 首次进入）→ 先问基本信息
  if (String(route.query.new || '') === '1' || (!draftId && !editId && !store.projectName)) {
    showCreate.value = true
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
  <div id="notebook-page" ref="page" :class="{ 'notebook-embedded': embedded }" :style="paperStyle">
    <template v-if="!showHelp">
      <NavBar v-if="!embedded" />
      <MenuBar :embedded="embedded" :paper-tone="paperTone" @set-paper-tone="paperTone = $event" @toggle-help="showHelp = true" @submit="showSubmit = true" @new-project="showCreate = true" @runtime="showRuntime = true" />
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
            <button type="button" :disabled="exporting" title="导出为真正的 PDF 文件（文字可选中，中文已嵌字体）" @click="exportPdf">{{ exporting ? '导出中…' : '导出 PDF' }}</button>
            <button type="button" title="导出为独立 HTML 文件：只有正文，不含站点导航，也不分页；双击即可打开" @click="exportHtml">导出 HTML</button>
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

    <CreateProjectDialog v-if="showCreate" dismissible @close="showCreate = false" />
    <RuntimeDialog v-if="showRuntime" @close="showRuntime = false" />
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
  background: var(--nb-paper-bg, #fff); box-sizing: border-box;
  box-shadow: 0 1px 2px rgba(15, 23, 42, .08), 0 6px 18px rgba(15, 23, 42, .10);
  color: #16181c;
  font: 11.5pt/1.75 "Songti SC", "Source Han Serif SC", "SimSun", Georgia, serif;
}
.nb-sheet-no {
  position: absolute; bottom: 8mm; left: 0; right: 0;
  text-align: center; font: 10px/1 system-ui, sans-serif; color: #9aa3ad;
}
.nb-sheet-body { width: 100%; }
/* 纸面排版（标题 / 段落缩进 / 表格 / 代码 / 卡片 / 公式）全部来自 printStyle.js 的
   SHEET_CSS，和格下预览是同一份规则；这里只留纸面自己的盒模型。 */
/* 离屏测量：必须真实排版（不能 display:none / visibility:hidden），否则高度全是 0。
   版式由 paginate() 注入的全局 .nb-measure-root 提供（scoped 样式选不中后插的节点）。 */
.nb-sheet-measure {
  position: fixed; left: -20000px; top: 0; z-index: -1;
  pointer-events: none; background: #fff;
}
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
