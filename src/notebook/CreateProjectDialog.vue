<script setup>
// 新建项目：先问基本信息（项目名称 + 原生代码语言），再决定怎么开始。
// 三个入口页签：空白 / 导入或打开 / 模板 —— 对齐 Papilot 的「新建论文」版式。
import { computed, ref } from 'vue'
import { useNotebook } from './store.js'
import { languageOptions } from '@/utils/codeLang.js'
import { ipynbToCells } from './ipynb.js'
import { importNotebookV2 } from './kernelV2.js'

const props = defineProps({
  // 已有项目在编辑时（菜单点「新建」）可以取消；首次进入必须建一个
  dismissible: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])
const store = useNotebook()

const tab = ref('blank')
const name = ref(store.projectName || '')
const codeLang = ref(store.codeLang || 'python')
const error = ref('')
const fileInput = ref(null)
const codeLangs = languageOptions().filter((o) => o.name !== 'lifetree')

const tabList = [
  { id: 'blank', label: '空白' },
  { id: 'import', label: '导入或打开' },
  { id: 'template', label: '模板' },
]

// 模板：每条 = { id, name, desc, lang, cells: [{ type, source }] }
const templates = [
  {
    id: 'paper',
    name: '论文 / 笔记',
    desc: '标题、摘要、分节正文与参考文献格',
    lang: 'python',
    cells: [
      { type: 'laup', source: '# 标题\n\n摘要：一句话说明这篇在讲什么。\n' },
      { type: 'laup', source: '## 正文\n\n在这里写正文，公式写 $E=mc^2$，引用写 \\cite{1}。\n' },
      { type: 'laup', source: '[references]\n第一条参考文献\n' },
    ],
  },
  {
    id: 'code',
    name: '代码讲义',
    desc: '原生代码格 + Laup 格的输入 / 输出对照卡',
    lang: 'cpp',
    cells: [
      { type: 'laup', source: '# 代码讲义\n\n先说明这段代码在做什么。\n' },
      { type: 'code', source: '#include <iostream>\n\nint main() {\n    int a, b;\n    std::cin >> a >> b;\n    std::cout << a + b;\n    return 0;\n}\n' },
      { type: 'laup', source: '[input]\n2 3\n' },
      { type: 'laup', source: '[output]\n5\n' },
    ],
  },
  {
    id: 'showcase',
    name: '展示型代码块',
    desc: '只用 Laup 标记语言的 [cpp] 代码块，不带原生代码格',
    lang: 'cpp',
    cells: [
      { type: 'laup', source: '# 代码片段\n\n[cpp]\nfor (int i = 0; i < n; i += 1) {\n    sum += a[i];\n}\n' },
    ],
  },
]

const selectedTemplate = ref(templates[0].id)
const template = computed(() => templates.find((t) => t.id === selectedTemplate.value) || templates[0])

function create(cells = null) {
  if (!name.value.trim()) {
    error.value = '请先填写项目名称'
    return
  }
  store.newProject({ name: name.value, codeLang: codeLang.value, cells })
  emit('close')
}

function createBlank() {
  create(null)
}

function useTemplate() {
  const t = template.value
  codeLang.value = t.lang
  create(t.cells)
}

function pickFile() {
  fileInput.value?.click()
}

function onFile(ev) {
  const f = ev.target.files?.[0]
  ev.target.value = ''
  if (!f) return
  error.value = ''
  const rd = new FileReader()
  rd.onload = () => {
    try {
      if (/\.ipynb$/i.test(f.name)) {
        const { cells, lang } = ipynbToCells(rd.result)
        if (!name.value.trim()) name.value = f.name.replace(/\.ipynb$/i, '')
        codeLang.value = lang || codeLang.value
        create(cells)
        return
      }
      if (/\.lanb$/i.test(f.name)) {
        store.importLanb(rd.result)
        if (name.value.trim()) store.setProjectName(name.value)
        emit('close')
        return
      }
      // .laup 文档：按文档里的标记拆格（`%%语言` 还原成原生代码格）
      const { cells, codeLang: lang } = importNotebookV2(String(rd.result))
      if (!name.value.trim()) name.value = f.name.replace(/\.laup$/i, '')
      if (lang) codeLang.value = lang
      create(cells)
    } catch (e) {
      error.value = `导入失败：${e?.message || e}`
    }
  }
  rd.readAsText(f)
}
</script>

<template>
  <div class="cp-mask" @click.self="props.dismissible && emit('close')">
    <div class="cp" role="dialog" aria-label="新建项目">
      <header>
        <b>新建项目</b>
        <button v-if="props.dismissible" type="button" class="cp-close" @click="emit('close')">✕</button>
      </header>

      <nav class="cp-tabs">
        <button
          v-for="t in tabList"
          :key="t.id"
          type="button"
          :class="{ 'is-active': tab === t.id }"
          @click="tab = t.id; error = ''"
        >{{ t.label }}</button>
      </nav>

      <div class="cp-body">
        <label class="cp-row">
          <span>项目名称</span>
          <input v-model.trim="name" maxlength="120" placeholder="例如：某某研究笔记" @keydown.enter.prevent="tab === 'blank' ? createBlank() : null" />
        </label>
        <label class="cp-row">
          <span>代码语言</span>
          <select v-model="codeLang" title="原生代码格的全局语言：所有 code 格按它高亮与发布">
            <option v-for="o in codeLangs" :key="o.name" :value="o.name">{{ o.label }}</option>
          </select>
        </label>

        <div v-if="tab === 'blank'" class="cp-pane">
          <p class="cp-hint">从一格空白 Laup 开始写。</p>
        </div>

        <div v-else-if="tab === 'import'" class="cp-pane">
          <p class="cp-hint">支持 .ipynb（Jupyter）、.lanb（本编辑器快照）、.laup（Laup 文档）。</p>
          <button type="button" class="cp-file" @click="pickFile">选择文件…</button>
          <RouterLink class="cp-link" to="/drafts">或从草稿箱继续 →</RouterLink>
        </div>

        <div v-else class="cp-pane">
          <div class="cp-tpl-grid">
            <button
              v-for="t in templates"
              :key="t.id"
              type="button"
              class="cp-tpl"
              :class="{ 'is-active': selectedTemplate === t.id }"
              @click="selectedTemplate = t.id"
            >
              <b>{{ t.name }}</b>
              <small>{{ t.desc }}</small>
            </button>
          </div>
        </div>

        <p v-if="error" class="cp-error">{{ error }}</p>
      </div>

      <footer>
        <button v-if="props.dismissible" type="button" @click="emit('close')">取消</button>
        <button v-if="tab === 'import'" type="button" class="primary" @click="pickFile">选择文件</button>
        <button v-else-if="tab === 'template'" type="button" class="primary" @click="useTemplate">用这个模板</button>
        <button v-else type="button" class="primary" @click="createBlank">创建</button>
      </footer>

      <input ref="fileInput" type="file" accept=".ipynb,.lanb,.laup,application/json" style="display:none" @change="onFile" />
    </div>
  </div>
</template>

<style scoped>
.cp-mask {
  position: fixed; inset: 0; z-index: 320;
  background: rgba(0, 0, 0, .28);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 10vh 16px 16px;
}
.cp {
  width: 560px; max-width: 100%;
  background: #fff; border-radius: 8px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, .22);
  font: 13.5px/1.6 system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #1f2328;
}
.cp header {
  display: flex; align-items: center;
  padding: 14px 18px; border-bottom: 1px solid #ececec;
}
.cp header b { font-size: 15px; }
.cp-close { margin-left: auto; border: none; background: none; color: #999; cursor: pointer; font-size: 14px; }
.cp-tabs {
  display: flex; gap: 18px;
  padding: 10px 18px 0; border-bottom: 1px solid #ececec;
}
.cp-tabs button {
  border: none; background: none; cursor: pointer;
  padding: 4px 0 9px; font-size: 13.5px; color: #6b7280;
  border-bottom: 2px solid transparent;
}
.cp-tabs button.is-active { color: #1f2328; font-weight: 600; border-bottom-color: #1f6feb; }
.cp-body { padding: 16px 18px 4px; }
.cp-row { display: flex; align-items: center; gap: 10px; margin: 0 0 10px; }
.cp-row > span { flex: 0 0 64px; color: #6b7280; font-size: 12.5px; }
.cp-row input, .cp-row select {
  flex: 1; min-width: 0;
  border: 1px solid #d5d5d5; border-radius: 4px;
  padding: 6px 9px; font-size: 13px;
}
.cp-row select { flex: 0 0 180px; }
.cp-row input:focus, .cp-row select:focus { outline: none; border-color: #1f6feb; }
.cp-pane { min-height: 92px; padding: 6px 0 10px; }
.cp-hint { margin: 0 0 10px; color: #6b7280; font-size: 12.5px; }
.cp-file {
  border: 1px dashed #b9c4d0; background: #f8fafc; border-radius: 6px;
  padding: 8px 14px; cursor: pointer; color: #1f6feb; font-size: 13px;
}
.cp-file:hover { border-color: #1f6feb; }
.cp-link { margin-left: 12px; color: #1f6feb; font-size: 12.5px; text-decoration: none; }
.cp-tpl-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.cp-tpl {
  display: grid; gap: 4px; text-align: left; cursor: pointer;
  border: 1px solid #e2e6ea; border-radius: 7px; background: #fff;
  padding: 10px 12px; color: inherit; font-size: 12.5px;
}
.cp-tpl b { font-size: 13px; }
.cp-tpl small { color: #6b7280; line-height: 1.5; }
.cp-tpl.is-active { border-color: #1f6feb; box-shadow: 0 0 0 2px rgba(31, 111, 235, .12); }
.cp-error { margin: 4px 0 8px; color: #c00; background: #fdf3f3; border: 1px solid #eec7c7; border-radius: 4px; padding: 5px 9px; font-size: 12.5px; }
.cp footer { display: flex; justify-content: flex-end; gap: 8px; padding: 10px 18px 16px; }
.cp footer button {
  border: 1px solid #ccc; background: #f7f7f7; border-radius: 4px;
  padding: 5px 16px; font-size: 13px; cursor: pointer; color: #333;
}
.cp footer button.primary { border-color: #1f6feb; background: #1f6feb; color: #fff; font-weight: 600; }
.cp footer button.primary:hover { background: #1a5fd0; }
@media (max-width: 520px) {
  .cp-tpl-grid { grid-template-columns: 1fr; }
  .cp-row select { flex: 1; }
}
</style>
