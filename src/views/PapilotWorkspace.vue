<script setup>
// Papilot 工作台（站内版，路由 /papilot）。
//
// 版式照 Papilot 的论文工作台：左栏是项目与导航，中间是编辑区，右栏是「渲染」，
// 最右是可收起的 AI 区。数据全在站内，不走 Papilot 后端：
//   · 项目 = 本机草稿箱里的 Notebook 草稿（与 /laup-v2、/drafts 同一张 IndexedDB 表）
//   · 编辑区 = NotebookView 的 embedded 模式，内核 v2（只认 Laup / Code 两种格）
//   · 保存 = 自动保存回草稿箱；导出 .laup / .lanb 走 Notebook 自带菜单
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNotebook } from '@/notebook/store.js'
import NotebookView from '@/notebook/NotebookView.vue'
import { deleteDraft, getDraft, guestDraftOwnerKey, listDrafts, saveDraft, userDraftOwnerKey } from '@/services/drafts'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const store = useNotebook()
const userStore = useUserStore()

const projects = ref([])
const currentId = ref('')
const loading = ref(true)
const menuOpen = ref(false)
const renderOpen = ref(true)
const aiOpen = ref(true)

const current = computed(() => projects.value.find(p => p.id === currentId.value) || null)
const folderName = computed(() => current.value?.title || '未选择项目')
// 整篇预览的数据源：各格最近一次运行的渲染结果。
const rendered = computed(() => store.cells.filter(c => c.outputHtml))

async function ownerKey() {
  await userStore.initialize().catch(() => {})
  return userStore.user ? userDraftOwnerKey(userStore.user) : guestDraftOwnerKey()
}

// 项目列表 = 草稿箱里的 Notebook 草稿。Papilot 的「论文项目」在这里就是一篇稿子。
async function refresh() {
  const key = await ownerKey()
  const drafts = await listDrafts({ ownerKeys: [key] })
  projects.value = drafts.filter(d => d.contentType === 'NOTEBOOK')
  loading.value = false
}

// 一格的源码就是这个项目的内容；标题跟着首格的首行走，和 Notebook 自己的草稿标题一致。
function payloadOf(payload) {
  return {
    cells: payload.cells || [],
    scope: payload.scope || {},
    execCounter: payload.execCounter || 0,
    renderMode: payload.renderMode || 'below',
    kernel: 'v2',
  }
}

async function open(id) {
  menuOpen.value = false
  if (!id || id === currentId.value) return
  const draft = await getDraft(id)
  if (!draft) return
  store.setKernel('v2')
  store.applyDraft(payloadOf(draft.payload || {}))
  currentId.value = id
}

async function create() {
  menuOpen.value = false
  const key = await ownerKey()
  const draft = await saveDraft({
    ownerKey: key,
    contentType: 'NOTEBOOK',
    mode: 'CREATE',
    title: '未命名 Laup 项目',
    payload: payloadOf({ cells: [{ type: 'laup', source: '' }] }),
  })
  await refresh()
  await open(draft.id)
}

async function remove(id) {
  if (!id) return
  await deleteDraft(id)
  if (id === currentId.value) {
    currentId.value = ''
    store.applyDraft(payloadOf({}))
  }
  await refresh()
}

// 自动保存：格源码变化 1 秒后写回当前草稿，和 /laup-v2 的自动保存同一口径。
let timer = null
watch(
  () => store.cells.map(c => ({ type: c.type, source: c.source, attachments: c.attachments || {} })),
  () => {
    if (!currentId.value) return
    clearTimeout(timer)
    timer = setTimeout(async () => {
      const draft = projects.value.find(p => p.id === currentId.value)
      if (!draft) return
      await saveDraft({
        id: draft.id,
        ownerKey: draft.ownerKey,
        contentType: 'NOTEBOOK',
        mode: draft.mode,
        title: draft.title,
        payload: JSON.parse(JSON.stringify({ ...payloadOf({ ...draft.payload, cells: store.cells }), editPost: draft.payload?.editPost || null })),
      })
      await refresh()
    }, 1000)
  },
  { deep: true },
)

onMounted(async () => {
  store.setKernel('v2')
  await refresh()
  if (projects.value.length) await open(projects.value[0].id)
})
</script>

<template>
  <div class="pp-shell">
    <aside class="pp-sidebar">
      <div class="pp-brand"><span class="pp-logo">P</span>Papilot</div>
      <div class="pp-project">
        <button class="pp-project-btn" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen">
          <span class="pp-project-copy"><b>{{ folderName }}</b><small>本机草稿箱</small></span>
          <span class="pp-chevron">⌄</span>
        </button>
        <div v-if="menuOpen" class="pp-menu">
          <button class="pp-menu-item primary" @click="create">＋ 新建 Laup</button>
          <button class="pp-menu-item" @click="router.push('/laup-v2')">新建论文</button>
          <button class="pp-menu-item" @click="router.push('/laup-v2')">导入 TeX 项目</button>
          <button class="pp-menu-item" @click="router.push('/laup-v2')">导入 Laup 项目</button>
          <div class="pp-menu-sep"></div>
          <p class="pp-menu-label">草稿箱</p>
          <p v-if="loading" class="pp-menu-empty">载入中……</p>
          <p v-else-if="!projects.length" class="pp-menu-empty">还没有项目，点上面「新建 Laup」</p>
          <div v-for="p in projects" :key="p.id" class="pp-menu-row" :class="{ active: p.id === currentId }">
            <button class="pp-menu-item" :title="p.title" @click="open(p.id)">{{ p.title || '未命名' }}</button>
            <button class="pp-menu-del" :aria-label="`删除 ${p.title}`" @click="remove(p.id)">×</button>
          </div>
        </div>
      </div>
      <nav class="pp-nav">
        <button class="pp-nav-item active">Laup</button>
        <button class="pp-nav-item" @click="router.push('/drafts')">稿件</button>
        <button class="pp-nav-item" @click="router.push('/drafts')">文献库</button>
      </nav>
    </aside>

    <main class="pp-main">
      <header class="pp-head">
        <span class="pp-crumb"><span>{{ folderName }}</span> › <b>Laup</b></span>
        <span class="pp-hint">右侧渲染随编辑实时更新</span>
        <div class="pp-head-actions">
          <button class="pp-chip" :aria-pressed="renderOpen" @click="renderOpen = !renderOpen">渲染</button>
          <button class="pp-chip" :aria-pressed="aiOpen" @click="aiOpen = !aiOpen">AI</button>
        </div>
      </header>
      <div class="pp-body">
        <!-- 编辑器就是 /laup-v2 那一套：embedded 去掉站点导航，内核 v2。 -->
        <div class="pp-cells">
          <NotebookView kernel="v2" embedded />
        </div>
        <section v-if="renderOpen" class="pp-pane pp-render">
          <header class="pp-pane-head">渲染<button class="pp-pane-fold" aria-label="收起渲染" @click="renderOpen = false">›</button></header>
          <div class="pp-pane-body pp-render-body">
            <!-- 只读整篇预览：取各格最近一次运行产出的 HTML，不另挂一个编辑器。 -->
            <template v-if="rendered.length">
              <div v-for="(cell, i) in rendered" :key="i" class="pp-render-cell" v-html="cell.outputHtml"></div>
            </template>
            <p v-else class="pp-ai-note">左侧还没有输出。在单元格里写内容并运行，这里显示整篇渲染。</p>
          </div>
        </section>
        <section v-if="aiOpen" class="pp-pane pp-ai">
          <header class="pp-pane-head">AI<button class="pp-pane-fold" aria-label="收起 AI" @click="aiOpen = false">›</button></header>
          <div class="pp-pane-body pp-ai-body">
            <p class="pp-ai-title">接下来要修改什么？</p>
            <p class="pp-ai-note">AI 任务面板接入后会显示在这里。它占自己这一栏，不与渲染互相替换。</p>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.pp-shell { display: flex; height: 100dvh; overflow: hidden; background: #fff; color: #1f2328; }
.pp-sidebar { display: flex; flex-direction: column; flex: 0 0 232px; padding: 12px; border-right: 1px solid #e6e8eb; background: #fafbfc; }
.pp-brand { display: flex; align-items: center; gap: 8px; padding: 4px 6px 14px; font: 600 14px/1 system-ui, sans-serif; }
.pp-logo { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 6px; background: #1f2328; color: #fff; font-size: 12px; }
.pp-project { position: relative; }
.pp-project-btn { display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 10px; border: 1px solid #e6e8eb; border-radius: 8px; background: #fff; text-align: left; cursor: pointer; }
.pp-project-copy { display: flex; flex-direction: column; min-width: 0; gap: 3px; }
.pp-project-copy b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 600 13px/1.2 system-ui, sans-serif; }
.pp-project-copy small { color: #8b949e; font-size: 11px; }
.pp-chevron { margin-left: auto; color: #8b949e; }
.pp-menu { position: absolute; z-index: 20; top: calc(100% + 6px); left: 0; width: 100%; max-height: 60vh; overflow: auto; padding: 6px; border: 1px solid #e6e8eb; border-radius: 10px; background: #fff; box-shadow: 0 10px 26px rgba(15, 23, 42, .13); }
.pp-menu-item { display: block; width: 100%; padding: 7px 8px; border: 0; border-radius: 6px; background: none; color: inherit; font: 13px/1.3 system-ui, sans-serif; text-align: left; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pp-menu-item:hover { background: #f3f5f7; }
.pp-menu-item.primary { font-weight: 600; }
.pp-menu-sep { height: 1px; margin: 6px 2px; background: #eef0f2; }
.pp-menu-label, .pp-menu-empty { margin: 4px 8px; color: #8b949e; font: 11px/1.4 system-ui, sans-serif; }
.pp-menu-row { display: flex; align-items: center; }
.pp-menu-row .pp-menu-item { flex: 1; min-width: 0; }
.pp-menu-row.active .pp-menu-item { background: #eef4ff; color: #1a6fc4; font-weight: 600; }
.pp-menu-del { padding: 0 6px; border: 0; background: none; color: #b42318; font-size: 15px; cursor: pointer; }
.pp-nav { display: flex; flex-direction: column; gap: 2px; margin-top: 16px; }
.pp-nav-item { padding: 8px 10px; border: 0; border-radius: 7px; background: none; color: inherit; font: 13px/1.3 system-ui, sans-serif; text-align: left; cursor: pointer; }
.pp-nav-item:hover { background: #eef0f2; }
.pp-nav-item.active { background: #e9edf1; font-weight: 600; }
.pp-main { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.pp-head { display: flex; align-items: center; gap: 10px; flex: none; height: 42px; padding: 0 12px; border-bottom: 1px solid #e6e8eb; }
.pp-crumb { font: 13px/1 system-ui, sans-serif; color: #8b949e; }
.pp-crumb b { color: #1f2328; }
.pp-hint { overflow: hidden; color: #8b949e; font: 12px/1 system-ui, sans-serif; text-overflow: ellipsis; white-space: nowrap; }
.pp-head-actions { display: flex; gap: 6px; margin-left: auto; }
.pp-chip { padding: 4px 10px; border: 1px solid #d6dae0; border-radius: 999px; background: #fff; font: 12px/1 system-ui, sans-serif; cursor: pointer; }
.pp-chip[aria-pressed="true"] { border-color: #1f2328; background: #1f2328; color: #fff; }
.pp-body { display: flex; flex: 1; min-height: 0; }
.pp-cells { flex: 1; min-width: 0; overflow: auto; }
.pp-pane { display: flex; flex-direction: column; min-width: 0; border-left: 1px solid #e6e8eb; }
.pp-render { flex: 0 0 40%; }
.pp-ai { flex: 0 0 300px; }
.pp-pane-head { display: flex; align-items: center; gap: 8px; flex: none; height: 34px; padding: 0 10px; border-bottom: 1px solid #e6e8eb; font: 600 12px/1 system-ui, sans-serif; }
.pp-pane-fold { margin-left: auto; border: 0; background: none; color: #8b949e; font-size: 15px; cursor: pointer; }
.pp-pane-body { flex: 1; min-height: 0; overflow: auto; }
.pp-render-body { padding: 16px; background: #fff; }
.pp-render-cell + .pp-render-cell { margin-top: 16px; }
.pp-ai-body { padding: 14px; }
.pp-ai-title { margin: 0 0 6px; font: 600 13px/1.4 system-ui, sans-serif; }
.pp-ai-note { margin: 0; color: #8b949e; font: 12px/1.6 system-ui, sans-serif; }
</style>
