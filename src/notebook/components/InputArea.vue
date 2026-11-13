<script setup>
import { ref, onMounted, onBeforeUnmount, watchEffect, watch } from 'vue'
import { EditorState, Compartment, Prec } from '@codemirror/state'
import { EditorView, keymap, drawSelection } from '@codemirror/view'
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands'
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap, acceptCompletion } from '@codemirror/autocomplete'
import { syntaxHighlighting, HighlightStyle, LanguageDescription } from '@codemirror/language'
import { markdown } from '@codemirror/lang-markdown'
import { python } from '@codemirror/lang-python'
import { tags as t } from '@lezer/highlight'
import { useNotebook } from '../store.js'
import { parseCodeDecl } from '@/utils/codeLang.js'
import {
  codeDeclCompletionSource, laupCompletionSource, pythonCompletionSources, varCompletionSource,
} from '../completions.js'

const props = defineProps({ cell: { type: Object, required: true } })
const store = useNotebook()
const rootEl = ref(null)

// 附件名 → 图片 alt 文案（去掉扩展名）
const f2name = (n) => n.replace(/\.[^.]+$/, '')

// 在光标处插入块级语法（\image 简写等）：光标前同行还有非空白字符时先换行再插。
// 块级语法必须独占一行，直接插会粘成 ]\image=[、#\image=[（移动端实测的坏源码形态）。
function insertAtCursor(v, text, pos = v.state.selection.main.to) {
  const line = v.state.doc.lineAt(pos)
  const before = line.text.slice(0, pos - line.from)
  v.dispatch({ changes: { from: pos, insert: (before.trim() ? '\n' : '') + text }, scrollIntoView: true })
}

// ipython 浅色风高亮：关键字加粗、字符串红、注释绿斜体（对照 Jupyter 截图）
const highlight = syntaxHighlighting(HighlightStyle.define([
  { tag: t.keyword, color: '#333', fontWeight: 'bold' },
  { tag: [t.string, t.special(t.string)], color: '#BA2121' },
  { tag: [t.comment, t.lineComment], color: '#408080', fontStyle: 'italic' },
  { tag: t.number, color: '#008000' },
  { tag: t.bool, color: '#008000', fontWeight: 'bold' },
  { tag: t.heading, fontWeight: 'bold' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: '#0645ad' },
  { tag: t.monospace, color: '#BA2121' },
  { tag: [t.meta, t.processingInstruction], color: '#708090' },
]))

const theme = EditorView.theme({
  '&': { fontSize: '13.5px', backgroundColor: '#fff' },
  '.cm-scroller': {
    fontFamily: "'Consolas','Menlo','Courier New',monospace",
    lineHeight: '1.55',
    padding: '7px 46px 7px 10px',
  },
  '.cm-content': { caretColor: '#333', padding: '0' },
  '.cm-line': { padding: '0' },
  '&.cm-focused': { outline: 'none' },
  '.cm-cursor': { borderLeftColor: '#333' },
})

const roComp = new Compartment()
const edComp = new Compartment()
const langComp = new Compartment()
const acComp = new Compartment()

// 代码格的源码就是它自己（首行声明 + 代码），不再从中间切一半 ——
// 「输入 / 输出」现在是两个独立格（[input] / [output]），不靠 `---` 分割
function docFor(cell) {
  return cell.source
}
// 代码格的语言：CodeMirror 这边只装了 python 一个语法包，其余语言退回纯文本 ——
// 颜色由格下方的 Prism 预览出（与阅读页同一套），这里不假装能上色
function langFor(cell) {
  if (cell.type !== 'code') return markdown({ codeLanguages: [PY_MD] })
  return parseCodeDecl(cell.source).lang === 'python' ? python() : []
}
// 补全配置：laup 格 = laup 语法源；var 格 = 文献数组声明模板；
// code 格 = 首行类型声明清单 +（声明 python 时）lang-python 自带的局部/全局补全
function acFor(cell) {
  if (cell.type === 'var') return autocompletion({ override: [varCompletionSource] })
  if (cell.type !== 'code') return autocompletion({ override: [laupCompletionSource(store, cell)] })
  const sources = [codeDeclCompletionSource]
  if (parseCodeDecl(cell.source).lang === 'python') sources.push(...pythonCompletionSources())
  return autocompletion({ override: sources })
}

// markdown 围栏里的 python 高亮：必须包成 LanguageDescription，
// 直接传 pythonLanguage（LRLanguage）会在解析器构造时抛 TypeError，整个编辑器挂掉
const PY_MD = LanguageDescription.of({
  name: 'python',
  alias: ['py'],
  load: () => python(),
})

function isEditing() {
  return store.mode === 'edit' && store.selectedId === props.cell.id
}

let view = null

onMounted(() => {
  const cell = props.cell
  view = new EditorView({
    doc: docFor(cell),
    extensions: [
      roComp.of(EditorState.readOnly.of(!isEditing())),
      edComp.of(EditorView.editable.of(isEditing())),
      langComp.of(langFor(cell)),
      acComp.of(acFor(cell)),
      closeBrackets(), // 引号/括号自动配对（输入 " 自动补 "）
      theme,
      highlight,
      EditorView.lineWrapping,
      history(),
      drawSelection(),
      Prec.highest(keymap.of([
        { key: 'Shift-Enter', run: () => { store.runCell(cell.id, true); return true } },
        { key: 'Escape', run: () => { store.setMode('command'); return true } },
      ])),
      // Tab 优先用于接受补全（未激活时 acceptCompletion 返回 false，落到缩进）
      keymap.of([{ key: 'Tab', run: acceptCompletion }, ...closeBracketsKeymap, ...completionKeymap, ...defaultKeymap, ...historyKeymap]),
      EditorView.updateListener.of((u) => {
        if (!u.docChanged) return
        store.setSource(cell.id, u.state.doc.toString())
      }),
      EditorView.domEventHandlers({
        mousedown(ev) {
          // 单击即编辑（JupyterLab 习惯）：第一次点进输入区就直接得到光标。
          // 不 preventDefault —— 已处于编辑态时让 CM 正常放置光标
          if (!isEditing()) {
            store.select(cell.id)
            store.setMode('edit')
          }
          return false
        },
        paste(ev, v) {
          const items = ev.clipboardData?.items || []
          for (const it of items) {
            if (!it.type?.startsWith('image/')) continue
            const f = it.getAsFile()
            if (!f) continue
            ev.preventDefault()
            store.addImageFile(cell.id, f).then((name) => {
              if (!name) return
              // laup 图片简写：{ } 里填图注，可写 \cite{N}（宿主层展开成 \image=[…] 块）
              const md = `\\image![图片](attachment:${name}){}\n`
              insertAtCursor(v, md)
            })
            return true
          }
          return false
        },
        // 拖拽图片文件入格 → 存附件 + 插入引用
        drop(ev, v) {
          const files = [...(ev.dataTransfer?.files || [])].filter((f) => f.type.startsWith('image/'))
          if (!files.length) return false
          ev.preventDefault()
          const pos = v.posAtCoords({ x: ev.clientX, y: ev.clientY }) ?? v.state.selection.main.to
          Promise.all(files.map((f) => store.addImageFile(cell.id, f))).then((names) => {
            const md = names.filter(Boolean).map((n) => `\\image![${f2name(n)}](attachment:${n}){}\n`).join('')
            if (md) insertAtCursor(v, md, pos)
          })
          return true
        },
      }),
    ],
    parent: rootEl.value,
  })

  // 外部改源码（工具栏上传图片、载入示例等）→ 同步进 CodeMirror。
  // 没有这一步，CM 拿着旧文档，下一次键入会把旧文档写回 store —— 工具栏连续
  // 上传图片时第二张起就"消失"（移动端实测）。
  // 代码格以前要跳过这里（那时 source 含输出段、与文档不一致）；现在 doc 就是
  // source，守卫天然成立，所以不再需要例外。
  watch(() => cell.source, (src) => {
    if (!view) return
    if (view.state.doc.toString() === src) return
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: src ?? '' } })
  })

  // 双模式：编辑态解除只读并聚焦；命令态只读
  watchEffect(() => {
    if (!view) return
    const editing = isEditing()
    view.dispatch({
      effects: [
        roComp.reconfigure(EditorState.readOnly.of(!editing)),
        edComp.reconfigure(EditorView.editable.of(editing)),
      ],
    })
    if (editing) view.focus()
  })

  // 切换格型：替换文档内容、语言与补全配置
  watch(() => cell.type, () => {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: docFor(cell) },
      effects: [langComp.reconfigure(langFor(cell)), acComp.reconfigure(acFor(cell))],
    })
  })

  // 首行声明改了（cpp→python、或写成 input）→ 只换 compartment，不碰文档，
  // 免得把正在打的字冲掉
  watch(() => parseCodeDecl(cell.source).lang, () => {
    if (!view || cell.type !== 'code') return
    view.dispatch({
      effects: [langComp.reconfigure(langFor(cell)), acComp.reconfigure(acFor(cell))],
    })
  })
})

onBeforeUnmount(() => view?.destroy())
</script>

<template>
  <div ref="rootEl" class="cm-host"></div>
</template>

<style scoped>
.cm-host :deep(.cm-editor) { border-radius: 2px; }
</style>
