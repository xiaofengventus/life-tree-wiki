// [lifetree] 格的编辑器辅助（宿主层，@codemirror）：
//   ① VSCode 风格「缩进参考线」：按每行的缩进级别，在每一级缩进列画一条竖直虚线。
//      纯粹标示对齐层级，与树的分叉结构无关。画在渲染层（行背景），不进文档，
//      不污染要落库/导出的 lifetree 源码。
//   ② VS 式缩进键：Enter 继承当前行缩进（平级，深入靠 Tab）；Tab/Shift-Tab 整行 ±2 空格。
//
// 对齐口径：不用 ch 单位（字体回退/缩放/DPI 会让它与真实缩进错开），改用
// view.defaultCharacterWidth（CodeMirror 实测的默认字符宽）换算成像素。
// CodeMirror 6 没有官方 indentGuides，这里自己实现，仅挂在 [lifetree] 格。
import { ViewPlugin, Decoration, keymap } from '@codemirror/view'
import { completionStatus } from '@codemirror/autocomplete'

const DECL_RE = /^\[lifetree\][ \t]*(?:\r?\n|$)/
const IMPORT_RE = /^[ \t]*import(?:\s+["'][^"']+["']|\s+[A-Za-z][\w-]*)[ \t]*$/
const VAR_RE = /^var\s+\S+/

const UNIT = 2          // lifetree 每级缩进 = 2 空格（与 extensions/lifetree.js 一致）
const GUIDE = '#d7d7d7' // 参考线颜色：VSCode light 风格的淡灰虚线

// ---------- 缩进参考线 ----------
// 对每一行：数出前导空格数 n，则在第 0,2,4,… (< n) 列各画一条竖直虚线。
// 连续多行的同一列会自然连成一条贯穿的竖线 —— 正是 VSCode 的效果。
function buildGuides(view) {
  const state = view.state
  const doc = state.doc
  const charW = Number(view.defaultCharacterWidth) > 0 ? view.defaultCharacterWidth : 7
  const skipDecl = DECL_RE.test(doc.toString())
  const decos = []
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i)
    const raw = line.text
    if (!raw.trim()) continue
    if (skipDecl && i === 1) continue
    if (IMPORT_RE.test(raw)) continue
    if (VAR_RE.test(raw.trim())) continue
    // Tab 缩进的行跳过（lifetree 约定空格缩进；保持宽容，不拦输入，只是不画线）
    const lead = /^( *)/.exec(raw)[1].length
    const levels = Math.floor(lead / UNIT)
    if (!levels) continue
    const cols = []
    for (let k = 0; k < levels; k++) cols.push(k * UNIT)
    const style = [
      `background-image:${cols.map(() => `repeating-linear-gradient(to bottom,${GUIDE} 0 3px,transparent 3px 6px)`).join(',')}`,
      `background-size:${cols.map(() => '1px 100%').join(',')}`,
      `background-position:${cols.map((c) => `${c * charW}px 0`).join(',')}`,
      `background-repeat:${cols.map(() => 'no-repeat').join(',')}`,
    ].join(';')
    decos.push(Decoration.line({ class: 'lt-guide', attributes: { style } }).range(line.from))
  }
  return Decoration.set(decos, true)
}

const guidePlugin = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.deco = buildGuides(view)
    }
    update(u) {
      if (u.docChanged || u.viewportChanged || u.geometryChanged) this.deco = buildGuides(u.view)
    }
  },
  { decorations: (v) => v.deco },
)

// ---------- VS 式缩进键 ----------

function enterRun(v) {
  const state = v.state
  if (completionStatus(state) === 'active') return false // 补全开着 → 让给接受键
  const sel = state.selection.main
  const line = state.doc.lineAt(sel.head)
  if (line.number === 1 && DECL_RE.test(line.text + '\n')) return false // 声明行照常换行
  // 继承【当前行】的缩进（Tab 归一成两空格，防止混用）。
  // 旧实现取上一行缩进 —— 在已有内容的行中间回车会掉一级，VSCode 是取当前行。
  const indent = /^([ \t]*)/.exec(line.text)[1].replace(/\t/g, '  ')
  v.dispatch({
    changes: { from: sel.from, to: sel.to, insert: `\n${indent}` },
    selection: { anchor: sel.from + 1 + indent.length },
    scrollIntoView: true,
  })
  return true
}

function changeIndent(v, delta) {
  const state = v.state
  const sel = state.selection.main
  const l1 = state.doc.lineAt(sel.from).number
  const l2 = state.doc.lineAt(sel.to).number
  const changes = []
  for (let i = l1; i <= l2; i++) {
    const line = state.doc.line(i)
    if (!line.text.trim()) continue
    const m = /^([ \t]*)/.exec(line.text)[1]
    let ind = m.replace(/\t/g, '  ')
    if (delta > 0) ind += '  '
    else ind = ind.length >= 2 ? ind.slice(0, ind.length - 2) : ''
    if (ind !== m) changes.push({ from: line.from, to: line.from + m.length, insert: ind })
  }
  if (changes.length) v.dispatch({ changes, scrollIntoView: true })
  return true
}

function tabRun(v) {
  if (completionStatus(v.state) === 'active') return false
  return changeIndent(v, +2)
}

function shiftTabRun(v) {
  return changeIndent(v, -2)
}

const lifetreeKeys = keymap.of([
  { key: 'Enter', run: enterRun },
  { key: 'Tab', run: tabRun },
  { key: 'Shift-Tab', run: shiftTabRun },
])

/** [lifetree] 格挂这套；其他格型不挂（InputArea 按声明分发）。 */
export function lifetreeEditorExtensions() {
  return [guidePlugin, lifetreeKeys]
}
