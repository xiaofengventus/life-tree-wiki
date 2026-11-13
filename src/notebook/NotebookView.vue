<script setup>
// Notebook 页面壳（路由 /notebook）：菜单栏 + 单元格区 + 手册整页 + 提交对话框。
// 键盘双模式（命令/编辑）对齐 Jupyter：Esc/Enter/j/k/a/b/d d/m/y/v。
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useNotebook } from './store.js'
import { parseLaupDoc } from './renderer.js'
import { useDraftAutosave } from '@/composables/useDraftAutosave'
import { getDraft, saveDraft, userDraftOwnerKey } from '@/services/drafts'
import { fetchPost } from '@/services/posts'
import { useUserStore } from '@/stores/user'
import NavBar from '@/components/navBar.vue'
import MenuBar from './components/MenuBar.vue'
import CellCard from './components/CellCard.vue'
import HelpPanel from './components/HelpPanel.vue'
import SubmitDialog from './SubmitDialog.vue'
import './notebook.css'

const route = useRoute()
const store = useNotebook()
const userStore = useUserStore()

const showHelp = ref(false)
const showSubmit = ref(false)

// ── 草稿箱（与 laup_editor 同一套 IndexedDB 服务 + 自动保存 composable）──
// 快照/载荷都只含可序列化字段：格源码 + 附件 dataURL + 作用域 + 运行计数。
function draftBody() {
  return {
    cells: store.cells.map((c) => ({ type: c.type, source: c.source, attachments: c.attachments || {} })),
    scope: store.scope,
    execCounter: store.execCounter,
    // 渲染位置（下方/原地/折叠）跟草稿一起走：换台机器继续编辑时观感一致
    renderMode: store.renderMode,
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
  store.ensureLoaded()
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
        store.applyDraft({ cells: parseLaupDoc(post.contentSource), scope: {}, execCounter: 0 })
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
        store.toast = `正在编辑文章「${post.title}」`
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
  if (store.mode === 'edit') return
  const t = e.target
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
    case 'v': if (store.selectedId) store.setType(store.selectedId, 'var'); break
    case 'y': if (store.selectedId) store.setType(store.selectedId, 'code'); break
  }
  lastKey = e.key
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  clearTimeout(toastTimer)
})
</script>

<template>
  <div id="notebook-page">
    <template v-if="!showHelp">
      <NavBar />
      <MenuBar @toggle-help="showHelp = true" @submit="showSubmit = true" />
      <div id="notebook">
        <CellCard v-for="c in store.cells" :key="c.id" :cell="c" />
        <div class="ghost-add" title="在末尾新建 laup 格（快捷键 B）" @click="store.insertCell(store.cells.length - 1)">
          + 新建单元格
        </div>
      </div>
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
</style>
