<script setup>
// Notebook 菜单栏（生命时序站内版）。
// 与 laup_vue 独立版的差异：使用手册改为页面内整页切换（emit），新增「提交文章」。
import { ref } from 'vue'
import { useNotebook } from '../store.js'

const emit = defineEmits(['toggle-help', 'submit'])
const store = useNotebook()
const fileInput = ref(null)

function onImportFile(ev) {
  const f = ev.target.files?.[0]
  if (!f) return
  const rd = new FileReader()
  rd.onload = () => {
    try {
      store.importLanb(rd.result)
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
    <button title="作用域重置并自上而下运行全部单元格" @click="store.runAll()">▶ 运行全部</button>
    <label class="render-mode" title="渲染结果画在哪里 —— 下方（Jupyter 的样子）／原地（结果盖住源码，双击回到源码）／折叠源码（源码收成一行摘要条，点它展开）">
      结果
      <select :value="store.renderMode" @change="store.setRenderMode($event.target.value)">
        <option value="below">下方</option>
        <option value="inplace">原地</option>
        <option value="folded">折叠源码</option>
      </select>
    </label>
    <button title="导出 .lanb（JSON，对齐 .ipynb，含附件与渲染位置）" @click="store.exportLanb()">导出 .lanb</button>
    <button title="导入 .lanb" @click="fileInput.click()">导入</button>
    <button title="导出标准 .laup 文档（变量内联、附件内联）" @click="store.exportLaup()">导出 .laup</button>
    <button title="功能与语法手册（代码/输出对照）" @click="emit('toggle-help')">📖 使用手册</button>
    <button class="submit-btn" title="把这篇 Notebook 提交为站内文章（wiki-detail 样式展示）" @click="emit('submit')">⬆ 提交文章</button>
    <button title="清空为单个空 laup 格" @click="store.clearAll()">清空</button>
    <RouterLink class="drafts-link" to="/drafts" title="本机草稿箱（IndexedDB）">📂 草稿箱</RouterLink>
    <span class="saved" :title="store.draftStatus">{{ store.draftStatus || `已自动保存 ${store.savedAt || '—'}` }}</span>
    <input ref="fileInput" type="file" accept=".lanb,application/json" style="display:none" @change="onImportFile" />
  </div>
</template>

<style scoped>
#menubar .submit-btn { border-color: #e25303; color: #e25303; font-weight: bold; }
#menubar .submit-btn:hover { background: #fdf1e8; }
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
</style>
