<script setup>
import { computed, ref } from 'vue'
import { useNotebook } from '../store.js'

const props = defineProps({ cell: { type: Object, required: true } })
const store = useNotebook()
const fileInput = ref(null)

// 格型选择器：laup（文档排版格）/ code（原生代码格，语言由项目设置决定，连上内核就真的执行）。
// 以前这里只是个只读徽标，切换只能靠命令模式的 y / m 快捷键 —— 太隐蔽了，改成显式下拉。
const typeTitle = computed(() =>
  props.cell.type === 'code'
    ? `格型：原生代码格（语言 ${store.codeLang} 由项目统一设置；Shift+Enter 交给本机内核执行）`
    : '格型：Laup 文档格（正文排版，不执行代码）。要跑代码就在这个下拉里切到 code（命令模式也能按 y / m）',
)

function onTypeChange(value) {
  if (value === props.cell.type) return
  store.setType(props.cell.id, value)
}

// 上传图片 → 校验后存为格附件，源码末尾追加引用并重跑
async function onPickFiles(ev) {
  const files = [...(ev.target.files || [])]
  ev.target.value = ''
  for (const f of files) {
    const name = await store.addImageFile(props.cell.id, f)
    if (name) {
      const md = `![${name.replace(/\.[^.]+$/, '')}](attachment:${name})`
      const source = props.cell.source.trimEnd()
      const cardEnd = /(^|\n)[ \t]*\\end\{card\}$/.exec(source)
      const next = cardEnd && /(^|\n)[ \t]*\\begin\{card\}[ \t]*\r?\n/.test(source)
        ? `${source.slice(0, cardEnd.index + cardEnd[1].length)}${md}\n${source.slice(cardEnd.index + cardEnd[1].length)}\n`
        : `${source}\n${md}\n`
      store.setSource(props.cell.id, next)
      store.runCell(props.cell.id, false)
    }
  }
}

// 工具条图标（格型下拉在模板里，见上）
const icons = {
  run: '<svg viewBox="0 0 16 16" width="13" height="13"><path d="M4 2l9 6-9 6z" fill="currentColor"/></svg>',
  dup: '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="5" y="5" width="8" height="9" rx="1"/><path d="M11 5V3a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h1"/></svg>',
  up: '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 13V3M4 7l4-4 4 4"/></svg>',
  down: '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 3v10M4 9l4 4 4-4"/></svg>',
  add: '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 3v10M3 8h10"/></svg>',
  del: '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M5 4.5l.7 9h4.6l.7-9M6.8 7v4.5M9.2 7v4.5"/></svg>',
  img: '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="3" width="12" height="10" rx="1"/><circle cx="5.5" cy="6.5" r="1.2"/><path d="M2.5 12l3.5-3.5 2.5 2.5 3-3 2.5 2.5"/></svg>',
}
</script>

<template>
  <div class="toolbar" @dblclick.stop>
    <select
      class="type-switch"
      :value="cell.type"
      :title="typeTitle"
      @change="onTypeChange($event.target.value)"
    >
      <option value="laup">laup</option>
      <option value="code">code · {{ store.codeLang }}</option>
    </select>
    <button title="重新渲染本格（Shift+Enter）" @click="store.runCell(cell.id, true)" v-html="icons.run" />
    <button title="上传图片（存为本格附件，也可直接拖拽/粘贴进输入区）" @click="fileInput.click()" v-html="icons.img" />
    <button title="复制本格" @click="store.dupCell(cell.id)" v-html="icons.dup" />
    <button title="上移" @click="store.moveCell(cell.id, -1)" v-html="icons.up" />
    <button title="下移" @click="store.moveCell(cell.id, 1)" v-html="icons.down" />
    <button title="在下方插入" @click="store.insertCell(store.cells.findIndex(c => c.id === cell.id))" v-html="icons.add" />
    <button title="删除（D D）" @click="store.delCell(cell.id)" v-html="icons.del" />
    <input ref="fileInput" type="file" accept="image/*" multiple style="display:none" @change="onPickFiles" />
  </div>
</template>
