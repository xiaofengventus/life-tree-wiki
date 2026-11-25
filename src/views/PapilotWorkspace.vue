<script setup>
import { computed, nextTick, onMounted, onUnmounted, provide, ref, watchEffect } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { createPinia, disposePinia, getActivePinia, setActivePinia } from 'pinia'
import DOMPurify from 'dompurify'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import '@/assets/rich-content.css'
import '@/laup2/laup2.css'
import NotebookView from '@/notebook/NotebookView.vue'
import { notebookContext, useNotebook } from '@/notebook/store.js'
import { importNotebookV2 } from '@/notebook/kernelV2.js'
import { ipynbToCells } from '@/notebook/ipynb.js'
import { typesetCells } from '@/laup2/cells.js'
import { translate } from '@/utils/mathKit.js'

const previousPinia = getActivePinia()
const pinia = createPinia()
const store = useNotebook(pinia)
setActivePinia(previousPinia)
store.storageEnabled = false
store.setKernel('v2')
provide(notebookContext, store)
onUnmounted(() => disposePinia(pinia))

const title = ref('')
const menu = ref(null)
const picker = ref(null)
const output = ref(null)
const previewVisible = ref(true)
const opening = ref(false)
const error = ref('')
const diagnostics = ref([])
const snapshot = () => store.cells.map(({ type, source, attachments }) => ({ type, source, attachments }))
const saved = ref('')
const serialize = () => JSON.stringify({ cells: snapshot(), renderMode: store.renderMode })
const dirty = computed(() => Boolean(title.value) && serialize() !== saved.value)
const mayReplace = () => !dirty.value || window.confirm('当前项目有修改。确定不保存并继续吗？')

onBeforeRouteLeave(mayReplace)
function warnBeforeUnload(event) {
  if (!dirty.value) return
  event.preventDefault()
  event.returnValue = ''
}
onMounted(() => window.addEventListener('beforeunload', warnBeforeUnload))
onUnmounted(() => window.removeEventListener('beforeunload', warnBeforeUnload))

function saveLaup() {
  store.exportLanb(`${title.value.replace(/\.(?:lanb|laup|ipynb)$/i, '')}.lanb`)
  saved.value = serialize()
}

function load(name, payload = {}) {
  store.applyDraft({ renderMode: 'below', ...payload })
  title.value = name
  saved.value = serialize()
  error.value = ''
  previewVisible.value = true
}

function newLaup() {
  if (!mayReplace()) return
  load('未命名 Laup')
  if (menu.value) menu.value.open = false
}

async function openLaup(event) {
  const input = event.currentTarget
  const file = input.files?.[0]
  input.value = ''
  if (!file || !mayReplace()) return
  opening.value = true
  try {
    const text = await file.text()
    let payload
    if (/\.lanb$/i.test(file.name)) payload = JSON.parse(text)
    else if (/\.ipynb$/i.test(file.name)) payload = ipynbToCells(text)
    else if (/\.laup$/i.test(file.name)) payload = { cells: importNotebookV2(text) }
    else throw new Error('请选择 .laup、.lanb 或 .ipynb 文件。')
    if (!Array.isArray(payload?.cells) || !payload.cells.every(cell => typeof cell?.source === 'string')) {
      throw new Error('文件没有有效的单元格数据。')
    }
    load(file.name, { ...payload, cells: payload.cells.map(cell => ({ ...cell, type: cell.type === 'code' ? 'code' : 'laup' })) })
    if (menu.value) menu.value.open = false
  } catch (cause) {
    error.value = `打开 Laup 失败：${cause.message}`
  } finally {
    opening.value = false
  }
}

function closeProject() {
  if (!mayReplace()) return
  title.value = ''
  error.value = ''
  if (menu.value) menu.value.open = false
}

watchEffect((onCleanup) => {
  const node = output.value
  if (!node) return
  const images = []
  const cells = snapshot().filter(cell => cell.source.trim()).map(cell => ({
    ...cell,
    source: cell.type === 'code' ? cell.source : cell.source.replace(/attachment:([\w.\-\u4e00-\u9fa5]+)/g, (original, name) => {
      const url = cell.attachments?.[name]
      if (typeof url !== 'string' || !/^data:image\/(?:png|jpe?g|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/i.test(url)) return original
      return `__preview_attachment_${images.push(url) - 1}.png`
    }),
  }))
  const timer = setTimeout(() => {
    try {
      const result = typesetCells(cells)
      const fragment = DOMPurify.sanitize(result.html, {
        RETURN_DOM_FRAGMENT: true,
        FORBID_TAGS: ['style', 'iframe', 'object', 'embed', 'form'],
      })
      for (const image of fragment.querySelectorAll('img[src]')) {
        const token = /^__preview_attachment_(\d+)\.png$/.exec(image.getAttribute('src'))
        if (token && images[Number(token[1])]) image.setAttribute('src', images[Number(token[1])])
      }
      for (const element of fragment.querySelectorAll('[data-tex]')) {
        const tex = element.dataset.tex || ''
        katex.render(translate(tex) ?? tex, element, {
          displayMode: element.classList.contains('laup2-math-display'), throwOnError: false, trust: false,
        })
      }
      node.replaceChildren(fragment)
      diagnostics.value = result.diagnostics.map(diagnostic => diagnostic.toString())
    } catch (cause) {
      node.replaceChildren()
      diagnostics.value = [cause.message]
    }
  }, 120)
  onCleanup(() => clearTimeout(timer))
})

async function newFromHome() {
  newLaup()
  await nextTick()
  document.getElementById('papilot-preview-toggle')?.focus()
}
</script>

<template>
  <div class="paper-workbench">
    <header class="paper-toolbar">
      <RouterLink to="/create">返回创作中心</RouterLink>
      <details ref="menu" class="project-menu">
        <summary>{{ title || 'Papilot 项目' }}</summary>
        <div class="project-actions">
          <button type="button" :disabled="opening" @click="newLaup">新建 Laup</button>
          <button type="button" :disabled="opening" @click="picker?.click()">导入 Laup / Notebook</button>
          <button v-if="title" type="button" :disabled="opening" @click="closeProject">返回项目首页</button>
        </div>
      </details>
      <button v-if="title" type="button" :disabled="opening" @click="saveLaup">下载项目 (.lanb)</button>
      <button v-if="title" id="papilot-preview-toggle" type="button" :aria-expanded="previewVisible" @click="previewVisible = !previewVisible">{{ previewVisible ? '收起整篇预览' : '展开整篇预览' }}</button>
      <input ref="picker" hidden type="file" accept=".laup,.lanb,.ipynb" @change="openLaup" />
    </header>
    <p v-if="error" role="alert" class="paper-error">{{ error }}</p>
    <main v-if="!title" class="paper-home">
      <h1>Papilot 工作台</h1>
      <p>新建一份 Laup 文档，或打开已有的 Laup / Notebook 文件。</p>
      <button type="button" :disabled="opening" @click="newFromHome">新建 Laup</button>
      <button type="button" :disabled="opening" @click="picker?.click()">导入 Laup / Notebook</button>
      <p>当前站内入口只支持 Laup。TeX、PDF、审阅和 AI 仍在原 Papilot 应用中。</p>
    </main>
    <main v-else class="paper-layout" :class="{ 'with-preview': previewVisible }">
      <NotebookView kernel="v2" embedded />
      <section v-if="previewVisible" class="paper-preview" aria-label="整篇排版预览">
        <h2>整篇排版预览</h2>
        <div ref="output" class="article-content"></div>
        <details v-if="diagnostics.length">
          <summary>排版诊断（{{ diagnostics.length }}）</summary>
          <ul><li v-for="(message, index) in diagnostics" :key="index">{{ message }}</li></ul>
        </details>
      </section>
    </main>
  </div>
</template>

<style scoped>
.paper-workbench { min-height: 100dvh; background: #f6f7f8; color: #202122; }
.paper-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 16px; padding: 12px 20px; border-bottom: 1px solid #dce1e6; background: #fff; }
.paper-toolbar button, .paper-home button { padding: 6px 12px; border: 1px solid #cbd3db; border-radius: 5px; background: #fff; cursor: pointer; }
.project-menu { position: relative; }
.project-menu summary { cursor: pointer; font-weight: 600; }
.project-actions { position: absolute; inset: 100% auto auto 0; z-index: 60; display: grid; gap: 6px; padding: 8px; background: white; border: 1px solid #dce1e6; white-space: nowrap; }
.paper-home { max-width: 680px; margin: 8vh auto; padding: 24px; }
.paper-home button + button { margin-left: 8px; }
.paper-layout { display: grid; grid-template-columns: minmax(0, 1fr); }
.paper-layout.with-preview { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.paper-preview { min-width: 0; padding: 16px 24px; background: #fff; border-left: 1px solid #dce1e6; }
.paper-preview h2 { font-size: 15px; }
.article-content { font: 16px/1.9 Georgia, "Noto Serif SC", "Songti SC", serif; overflow-wrap: anywhere; }
.article-content :deep(img) { max-width: 100%; height: auto; }
.paper-error { color: #a12525; margin: 12px 20px; }
.paper-layout :deep(.notebook-embedded) { min-width: 0; }
.paper-layout :deep(.notebook-embedded #menubar) { flex-wrap: wrap; top: 0; }
@media (max-width: 900px) { .paper-layout.with-preview { grid-template-columns: minmax(0, 1fr); } }
</style>
