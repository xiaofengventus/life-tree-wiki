<script setup>
// Notebook 菜单栏（生命时序站内版）。
// 与 laup_vue 独立版的差异：使用手册改为页面内整页切换（emit），新增「提交文章」。
import { ref, computed } from 'vue'
import { useNotebook } from '../store.js'
import { languageOptions } from '@/utils/codeLang.js'
import { runtime } from '../runtime/index.js'

const props = defineProps({
  embedded: Boolean,
  paperTone: { type: String, default: 'white' },
})
const emit = defineEmits(['toggle-help', 'submit', 'set-paper-tone', 'new-project', 'runtime'])
const store = useNotebook()
const fileInput = ref(null)

// 本机内核状态点：连上之后代码格才真的执行（单格执行，运行全部仍是预览）
const kernelTitle = computed(() => {
  if (runtime.status === 'ready') return `已连接本机内核（${runtime.kernelName}）`
  if (runtime.status === 'connecting') return '正在连接本机内核…'
  if (runtime.status === 'error') return `内核连接失败：${runtime.error || '未知原因'}（点开重试）`
  return '连接本机 Jupyter 内核：连上后代码格才会真的执行'
})

// 原生代码格的全局语言（`[cpp]` 等 Laup 标记里的 lifetree 不是代码语言，不列）
const codeLangs = languageOptions().filter((o) => o.name !== 'lifetree')

// 纸张底色预设：左边预览与右边纸面共用，选完记在本机
const paperTones = [
  { id: 'white', label: '白' },
  { id: 'ivory', label: '米黄' },
  { id: 'celadon', label: '青瓷' },
  { id: 'gray', label: '浅灰' },
]

function onImportFile(ev) {
  const f = ev.target.files?.[0]
  if (!f) return
  const isIpynb = /\.ipynb$/i.test(f.name)
  const rd = new FileReader()
  rd.onload = () => {
    try {
      // 按扩展名分流：.ipynb 先转成 Laup 格，再走和 .lanb 一样的运行流程
      if (isIpynb) store.importIpynb(rd.result)
      else store.importLanb(rd.result)
    } catch (e) {
      alert('导入失败：' + e.message)
    }
  }
  rd.readAsText(f)
  ev.target.value = ''
}
</script>

<template>
  <div id="menubar">
    <span class="brand">laup</span><span class="brand-sub">Notebook</span>
    <span class="kernel-tag" title="Laup 内核：Laup / Code 两种编辑格">v2</span>
    <input
      class="project-name"
      :value="store.projectName"
      maxlength="120"
      placeholder="项目名称（默认当标题）"
      title="项目名称：没填文章标题时用这个"
      @change="store.setProjectName($event.target.value)"
    />
    <label class="render-mode" title="原生代码格的全局语言：所有 code 格按它高亮与发布，格子里不写声明">
      代码语言
      <select :value="store.codeLang" @change="store.setCodeLang($event.target.value)">
        <option v-for="o in codeLangs" :key="o.name" :value="o.name">{{ o.label }}</option>
      </select>
    </label>
    <button title="新建项目：先填名称与代码语言（可空白 / 导入 / 模板）" @click="emit('new-project')">✚ 新建</button>
    <button
      class="kernel-btn"
      :class="{ 'is-ready': runtime.status === 'ready', 'is-error': runtime.status === 'error' }"
      :title="kernelTitle"
      @click="emit('runtime')"
    >
      <span class="kernel-dot">●</span> 内核<template v-if="runtime.status === 'ready'"> · {{ runtime.kernelName }}</template>
    </button>
    <button title="作用域重置并自上而下运行全部单元格" @click="store.runAll()">▶ 运行全部</button>
    <label class="render-mode" title="渲染结果画在哪里 —— 下方（Jupyter 的样子）／原地（结果盖住源码，双击回到源码）／折叠源码（源码收成一行摘要条，点它展开）">
      结果
      <select :value="store.renderMode" @change="store.setRenderMode($event.target.value)">
        <option value="below">下方</option>
        <option value="inplace">原地</option>
        <option value="folded">折叠源码</option>
      </select>
    </label>
    <label class="render-mode" title="纸张底色：格下预览与右侧纸面同时生效，只影响屏幕显示，不影响导出的 PDF">
      纸张
      <select :value="props.paperTone" @change="emit('set-paper-tone', $event.target.value)">
        <option v-for="t in paperTones" :key="t.id" :value="t.id">{{ t.label }}</option>
      </select>
    </label>
    <button title="导出 .lanb（JSON，对齐 .ipynb，含附件与渲染位置）" @click="store.exportLanb()">导出 .lanb</button>
    <button v-if="!embedded" title="导入 .lanb 快照，或 .ipynb（Jupyter Notebook，自动转成 Laup 格）" @click="fileInput.click()">导入</button>
    <button title="导出 Laup v2 文档（保留声明，附件内联）" @click="store.exportLaup()">导出 .laup</button>
    <button title="功能与语法手册（代码/输出对照）" @click="emit('toggle-help')">📖 使用手册</button>
    <button v-if="!embedded" class="submit-btn" title="把这篇 Notebook 提交为站内文章（wiki-detail 样式展示）" @click="emit('submit')">⬆ 提交文章</button>
    <button title="清空为单个空 laup 格" @click="store.clearAll()">清空</button>
    <RouterLink v-if="!embedded" class="drafts-link" to="/drafts" title="本机草稿箱（IndexedDB）">📂 草稿箱</RouterLink>
    <span v-if="!embedded && store.storageEnabled" class="saved" :title="store.draftStatus">{{ store.draftStatus || `已自动保存 ${store.savedAt || '—'}` }}</span>
    <input v-if="!embedded" ref="fileInput" type="file" accept=".lanb,.ipynb,application/json,application/x-ipynb+json" style="display:none" @change="onImportFile" />
  </div>
</template>

<style scoped>
#menubar .submit-btn { border-color: #e25303; color: #e25303; font-weight: bold; }
#menubar .kernel-tag {
  margin-left: 6px; padding: 1px 7px; border-radius: 999px;
  background: #e8f3ff; border: 1px solid #b6dbff; color: #1a6fc4;
  font-size: 11.5px; line-height: 1.6; white-space: nowrap;
}
#menubar .submit-btn:hover { background: #fdf1e8; }
#menubar .project-name {
  width: 190px; border: 1px solid #d8d8d8; border-radius: 4px;
  padding: 3px 8px; font-size: 12.5px; color: #333;
}
#menubar .project-name:focus { outline: none; border-color: #2f806a; }
#menubar .render-mode {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12.5px; color: #666; margin: 0 2px;
}
#menubar .render-mode select {
  border: 1px solid #ccc; background: #f7f7f7; border-radius: 3px;
  padding: 3px 4px; font-size: 12.5px; color: #333; cursor: pointer;
}
#menubar .drafts-link {
  color: #555; text-decoration: none; font-size: 12.5px;
  border: 1px solid #d8d8d8; border-radius: 4px; padding: 3px 9px;
}
#menubar .drafts-link:hover { border-color: #2f806a; color: #2f806a; }
/* 本机内核状态：灰点未连、绿点已连、红点失败（颜色写在点里，按钮本身保持原样） */
#menubar .kernel-btn { display: inline-flex; align-items: center; gap: 4px; }
#menubar .kernel-btn .kernel-dot { color: #b8b8b8; font-size: 10px; line-height: 1; }
#menubar .kernel-btn.is-ready .kernel-dot { color: #1a7f37; }
#menubar .kernel-btn.is-error .kernel-dot { color: #c62828; }
</style>
