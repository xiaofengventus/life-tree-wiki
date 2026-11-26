// Notebook 补全源（宿主层，@codemirror/autocomplete）
//
// laup 格：
//   \         → laup 扩展命令模板（snippet，Tab 跳占位符）
//   {{        → var 格里定义的变量名（实时读 store.scope）
//   attachment: → 本格附件名（粘贴的图片）
//   \textcolor{ / \colorbox{ → 常用颜色名
//   src="     → 附件名 + {{var}} 两种形态
// code 格：
//   原生代码，不写声明；语言取项目设置（python 时带 lang-python 自带补全）

import { snippetCompletion } from '@codemirror/autocomplete'
import { globalCompletion, localCompletionSource } from '@codemirror/lang-python'
import { languageOptions, PANE_INPUT, PANE_OUTPUT } from '@/utils/codeLang.js'

// from 必须包含反斜杠本身（cmdM[0] 而非 cmdM[1]）：否则只输入 \ 就确认时，
// 原反斜杠不被替换，snippet 又以 \ 开头 → 出现 \\textcolor 重复。
// 配套约束：CM 从 from 到光标取文本做过滤，因此 label 也必须以 \ 开头。
export const laupCommandOptions = [
  // 行内样式
  snippetCompletion('\\textcolor{${color}}{${text}}', {
    label: 'textcolor', detail: '行内文字颜色', type: 'function',
    info: '\\textcolor{red}{文字} —— color 支持颜色名或 #hex',
  }),
  snippetCompletion('\\fontcolor{${color}}{${text}}', {
    label: 'fontcolor', detail: '行内文字颜色（textcolor 别名）', type: 'function',
  }),
  snippetCompletion('\\colorbox{${color}}{${text}}', {
    label: 'colorbox', detail: '背景色盒子', type: 'function',
    info: '\\colorbox{yellow}{文字}',
  }),
  snippetCompletion('\\fontsize{${size}}{${text}}', {
    label: 'fontsize', detail: '字号（8–72 整数）', type: 'function',
  }),
  snippetCompletion('\\textbf{${text}}', {
    label: 'textbf', detail: '显式粗体（可嵌套 \\textit）', type: 'function',
  }),
  snippetCompletion('\\textit{${text}}', {
    label: 'textit', detail: '显式斜体', type: 'function',
  }),
  snippetCompletion('\\underline{${text}}', {
    label: 'underline', detail: '下划线', type: 'function',
  }),
  snippetCompletion('\\sout{${text}}', {
    label: 'sout', detail: '删除线', type: 'function',
  }),
  snippetCompletion('\\code{${代码}}', {
    label: 'code', detail: '行内代码（显式）', type: 'function',
  }),
  snippetCompletion('\\math{${公式}}', {
    label: 'math', detail: '行内公式（显式）', type: 'function',
  }),
  // 链接
  snippetCompletion('\\href{${url}}{${文字}}', {
    label: 'href', detail: '超链接', type: 'function',
  }),
  snippetCompletion('\\url{${url}}', {
    label: 'url', detail: '裸链接（url 即文字）', type: 'function',
  }),
  // 标题 / 版面
  snippetCompletion('\\h1{${标题}}', {
    label: 'h1', detail: '一级标题（另有 h2–h6）', type: 'function',
  }),
  snippetCompletion('\\hr', { label: 'hr', detail: '水平分隔线', type: 'function' }),
  snippetCompletion('\\linebreak', { label: 'linebreak', detail: '强制换行', type: 'function' }),
  snippetCompletion('\\tableofcontents', {
    label: 'tableofcontents', detail: '自动目录（按标题生成）', type: 'function',
  }),
  snippetCompletion('\\footnote{${内容}}', {
    label: 'footnote', detail: '脚注（渲染进页脚）', type: 'function',
  }),
  snippetCompletion('\\cite{${1}}', {
    label: 'cite', detail: '正文引用上标（如 \\cite{1,3}）', type: 'function',
    info: '序号 = 全局文献数组编号；数组在 var 格声明（reference refs + refs[N]="…"），任何格的 \\cite 跨格解析',
  }),
  snippetCompletion('\\references=[\n    "${文献条目1，一行一条}"\n    "${Darwin C. 1859}"\n]', {
    label: 'references', detail: '（不建议使用，推荐 var 格数组声明）', type: 'function',
    info: '旧版位置型语法，仍兼容：条目按出现顺序填入全局数组。推荐在 var 格用 reference refs + refs[N]="…" 显式编号',
  }),
  snippetCompletion('\\tree=[\n    id="${T-001}"\n]', {
    label: 'tree', detail: '研究树占位骨架（跳转 /life-tree/:id）', type: 'function',
    info: '只有引用没有数据 —— 树数据在后端独立演进',
  }),
  snippetCompletion('\\raw{${html}}', {
    label: 'raw', detail: 'HTML 逃生舱（唯一 HTML 通道）', type: 'function',
  }),
  // 块级数据 / 图片
  snippetCompletion('\\image=[\n    src="${src}",\n    alt="${alt}",\n    caption="${caption}",\n]', {
    label: 'image', detail: '带图注的图片块（简写 \\image![alt](src){图注}）', type: 'function',
    info: 'src 支持 URL / {{var}} / attachment:名称；caption 是图注，支持行内语法与 \\cite',
  }),
  snippetCompletion('\\table=[\n    caption="${caption}"\n    align="${lcr}"\n    column=[\n        "${列1}"\n        "${列2}"\n    ]\n    row=[\n        "${…}"\n        "${…}"\n    ]\n]', {
    label: 'table', detail: '块级数据表格（别名为 \\excel）', type: 'function',
    info: '与管道表格编译到同一节点；单元格可换行、| 不用转义、列数不齐报行号。注意：row=[ 必须换行多行写',
  }),
  // \begin 环境
  snippetCompletion('\\begin{quote}\n${内容}\n\\end{quote}', {
    label: 'begin quote', detail: '引用环境（内可写 md/laup）', type: 'function',
  }),
  snippetCompletion('\\begin{itemize}\n\\item ${第一项}\n\\item ${第二项}\n\\end{itemize}', {
    label: 'begin itemize', detail: '多段列表（\\item 后可多段）', type: 'function',
  }),
  snippetCompletion('\\begin{center}\n${内容}\n\\end{center}', {
    label: 'begin center', detail: '居中环境', type: 'function',
  }),
  snippetCompletion('\\begin{stay}\n${原样内容}\n\\end{stay}', {
    label: 'begin stay', detail: '原样块：不解析、保留换行与缩进', type: 'function',
  }),
  snippetCompletion('\\begin{stay-line}\n${第一句}\n${第二句}\n\\end{stay-line}', {
    label: 'begin stay-line', detail: '每行换行，行内语法与公式照常解析', type: 'function',
  }),
  snippetCompletion('\\begin{equation}{eq:${id}}\n${公式}\n\\end{equation}\n\n见式 \\eqref{eq:${id}}。', {
    label: 'begin equation', detail: '带编号公式 + \\eqref 引用', type: 'function',
    info: '编号按出现顺序自动生成 (1)(2)…；{eq:id} 可省略',
  }),
].map((o) => ({ ...o, label: '\\' + o.label }))

// ---------- 常用颜色 ----------
const COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'gray', 'black', 'white',
  '#e25303', '#2b6cb0', '#2f855a', '#c53030', '#fff3cd', '#eef4fa']
const COLOR_OPTIONS = COLORS.map((c) => ({ label: c, type: 'constant', detail: '颜色' }))

// ---------- Python 固定导入 / 常用片段 ----------
export const pythonSnippetOptions = [
  snippetCompletion('import pandas as pd', { label: 'import pandas', detail: 'pandas 标准导入', type: 'keyword' }),
  snippetCompletion('import numpy as np', { label: 'import numpy', detail: 'numpy 标准导入', type: 'keyword' }),
  snippetCompletion('import matplotlib.pyplot as plt', { label: 'import matplotlib', detail: 'matplotlib 标准导入', type: 'keyword' }),
  snippetCompletion('import json', { label: 'import json', detail: 'json', type: 'keyword' }),
  snippetCompletion('import os', { label: 'import os', detail: 'os', type: 'keyword' }),
  snippetCompletion('import sys', { label: 'import sys', detail: 'sys', type: 'keyword' }),
  snippetCompletion('from pathlib import Path', { label: 'from pathlib', detail: 'Path', type: 'keyword' }),
  snippetCompletion('df = pd.read_csv("${file}")', { label: 'pd.read_csv', detail: '读 CSV → DataFrame', type: 'function' }),
  snippetCompletion('df.head(${n})', { label: 'df.head', detail: '预览前 n 行', type: 'function' }),
  snippetCompletion('df.describe()', { label: 'df.describe', detail: '统计摘要', type: 'function' }),
  snippetCompletion('print(${value})', { label: 'print', detail: '输出', type: 'function' }),
  snippetCompletion('for ${x} in ${iter}:\n    ${pass}', { label: 'for', detail: '循环模板', type: 'keyword' }),
  snippetCompletion('if ${cond}:\n    ${pass}', { label: 'if', detail: '条件模板', type: 'keyword' }),
  snippetCompletion('def ${name}(${args}):\n    ${pass}', { label: 'def', detail: '函数模板', type: 'keyword' }),
]

// ---------- \begin{ 环境名 ----------
// 单独一条：`\begin{` 之后不再匹配 `\\(\w*)$`，没有这段就只能在 `\` 后面看到
// 「\begin stay」整条片段，打了一半的环境名没有任何提示。
const ENV_OPTIONS = [
  ['quote', '引用环境（内可写 md/laup）'],
  ['center', '居中环境'],
  ['itemize', '多段列表（\\item 起项）'],
  ['enumerate', '有序多段列表'],
  ['equation', '带编号公式（可写 {eq:id}）'],
  ['stay', '原样块：不解析、保留换行与缩进'],
  ['stay-line', '每行换行，行内语法与公式照常解析'],
].map(([name, detail]) =>
  // from 已经吃掉了 `\begin{`，所以模板从名字开始，并顺手补上结束标记
  snippetCompletion(`${name}}\n\${内容}\n\\end{${name}}`, {
    label: name,
    detail,
    type: 'keyword',
  }),
)

// ---------- laup 格补全源 ----------
// store / cell 是响应式引用，每次补全时实时读取
export function laupCompletionSource(store, cell) {
  return (context) => {
    const line = context.state.doc.lineAt(context.pos)
    const before = line.text.slice(0, context.pos - line.from)

    // {{var}} —— 变量名
    const varM = /\{\{(\w*)$/.exec(before)
    if (varM) {
      const options = Object.keys(store.scope || {}).map((name) => ({
        label: name, type: 'variable', detail: 'var 变量',
      }))
      return { from: context.pos - varM[1].length, options, validFor: /^\w*$/ }
    }

    // attachment: —— 本格附件
    const attM = /attachment:([\w.\-\u4e00-\u9fa5]*)$/.exec(before)
    if (attM) {
      const options = Object.keys(cell?.attachments || {}).map((name) => ({
        label: name, type: 'file', detail: '格附件（粘贴图片）',
      }))
      return { from: context.pos - attM[1].length, options, validFor: /^[\w.\-\u4e00-\u9fa5]*$/ }
    }

    // \textcolor{ / \colorbox{ —— 颜色名
    const colM = /\\(?:textcolor|colorbox)\{(\w*)$/.exec(before)
    if (colM) {
      return { from: context.pos - colM[1].length, options: COLOR_OPTIONS, validFor: /^[\w#]*$/ }
    }

    // src=" / caption=" 等 —— key=" 之后提示附件与 {{var}} 两种写法
    const srcM = /(\w+)="(\w*)$/.exec(before)
    if (srcM && ['src', 'alt', 'caption'].includes(srcM[1])) {
      const atts = Object.keys(cell?.attachments || {}).map((name) => ({
        label: name, type: 'file', detail: 'attachment 附件',
        apply: `attachment:${name}`,
      }))
      const vars = Object.keys(store.scope || {}).map((name) => ({
        label: name, type: 'variable', detail: '{{var}} 插值',
        apply: `{{${name}}}`,
      }))
      return { from: context.pos - srcM[2].length, options: [...atts, ...vars], validFor: /^\w*$/ }
    }

    // ``` —— 代码围栏模板（反引号键在 Esc 下方；中文输入法下需切回英文）
    const fenceM = /`{2,3}(\w*)$/.exec(before)
    if (fenceM) {
      const options = [
        snippetCompletion('```sample\n${代码}\n---\n${输出}\n```', {
          label: '```sample', detail: '输入/输出对照块（= [input] + [output] 两格）', type: 'function',
        }),
        ...languageOptions().filter((o) => o.name !== 'lifetree').map(({ name, label }) => snippetCompletion('```' + name + '\n${代码}\n```', {
          label: '```' + name, detail: label + ' 代码块', type: 'function',
        })),
        snippetCompletion('```\n${文本}\n```', {
          label: '```', detail: '不写语言的代码块（首行可写 [cpp] 指定语言）', type: 'function',
        }),
      ]
      return { from: context.pos - fenceM[0].length, options, validFor: /^`{2,3}\w*$/ }
    }

    // \begin{ —— 环境名（含 stay / stay-line）
    const envM = /\\begin\{([\w-]*)$/.exec(before)
    if (envM) {
      return { from: context.pos - envM[1].length, options: ENV_OPTIONS, validFor: /^[\w-]*$/ }
    }

    // \ —— 扩展命令
    // from 必须包含反斜杠本身（cmdM[0] 而非 cmdM[1]）：否则只输入 \ 就确认时，
    // 原反斜杠不被替换，snippet 又以 \ 开头 → 出现 \\textcolor 重复
    const cmdM = /\\(\w*)$/.exec(before)
    if (cmdM) {
      return { from: context.pos - cmdM[0].length, options: laupCommandOptions, validFor: /^\\[\w ]*$/ }
    }

    return null
  }
}

// ---------- var 格补全源：文献数组声明（推荐写法） ----------
export function varCompletionSource(context) {
  const word = context.matchBefore(/[A-Za-z_\\]*/)
  if (!word || (word.from === word.to && !context.explicit)) return null
  const options = [
    snippetCompletion('reference ${refs}\n${refs}[1] = "${nature, 2024}"\n${refs}[2] = "${Darwin C. 1859}"', {
      label: 'reference', detail: '文献数组声明（推荐写法）', type: 'keyword',
      info: 'refs[N]="…" 显式钉死第 N 号槽位，可跳号；任何 laup 格 \\cite{N} 按全局编号解析',
    }),
    snippetCompletion('reference::${refs}\n${refs}[1] = "${nature, 2024}"', {
      label: 'reference::', detail: '文献数组声明（:: 形式，等价）', type: 'keyword',
    }),
    snippetCompletion('var ${name} = "${value}"', {
      label: 'var', detail: '普通变量声明', type: 'keyword',
    }),
    snippetCompletion('var ${name} = """\n${多行内容，可含 " 与空行}\n"""', {
      label: 'var 多行', detail: '三引号多行字符串（存代码 / 长文本）', type: 'keyword',
      info: '也可以只写一个 " 开头，延续到出现闭合引号的那一行；含引号的代码推荐用 """',
    }),
    snippetCompletion('var ${name} = [\n    ${第一项},\n    ${第二项}\n]', {
      label: 'var 数组', detail: 'JSON 数组（可跨行）', type: 'keyword',
      info: '以 [ 开头自动吞行到括号配平，元素用 JSON 形态（字符串带引号）',
    }),
  ]
  return { from: word.from, options, validFor: /^[A-Za-z_\\]*$/ }
}

// ---------- code 格补全源：固定片段，叠加 lang-python 自带补全 ----------
export function pythonSnippetSource(context) {
  const word = context.matchBefore(/[\w.]*/)
  if (!word || (word.from === word.to && !context.explicit)) return null
  return { from: word.from, options: pythonSnippetOptions, validFor: /^[\w.]*$/ }
}

// code 格最终 override 组合
export function pythonCompletionSources() {
  return [pythonSnippetSource, localCompletionSource, globalCompletion]
}

// ---------- Laup 格首行声明：展示型代码 / 输入输出 / 文献 ----------
// 只在第一行生效：打出 `[` 就把全部可用的 Laup 标记摆出来。
// 这些是 Laup 标记语言，不是原生代码格的语言声明（原生代码格写在项目设置里）。
export function codeDeclCompletionSource(context) {
  const line = context.state.doc.lineAt(context.pos)
  if (line.number !== 1) return null
  const before = line.text.slice(0, context.pos - line.from)
  const m = /^\[[A-Za-z0-9_+#-]*$/.exec(before)
  if (!m) return null
  const options = [
    ...languageOptions().filter((o) => o.name !== 'lifetree').map(({ name, label }) => ({
      label: `[${name}]`, type: 'keyword', detail: label, apply: `[${name}]`,
      info: `首行写 [${name}] —— 一段只排版、不执行的 ${label} 代码展示块`,
    })),
    {
      label: `[${PANE_INPUT}]`, type: 'class', detail: '输入栏', apply: `[${PANE_INPUT}]`,
      info: `输入栏：紧接着写一格 [${PANE_OUTPUT}]，两格并成一张左右对照的样例卡`,
    },
    {
      label: `[${PANE_OUTPUT}]`, type: 'class', detail: '输出栏', apply: `[${PANE_OUTPUT}]`,
      info: `输出栏：写在 [${PANE_INPUT}] 格的下一格，两格并成一张样例卡`,
    },
    {
      label: '[references]', type: 'class', detail: '文献格', apply: '[references]',
      info: '文献声明：一行一条，按顺序编号；正文用 \\cite{1} 引用',
    },
  ]
  // from 要含掉那个 `[`（标签本身也带 `[`）：CM 用 from→光标之间的文字做前缀过滤，
  // 两边都带括号才过滤得动 —— 只带一边的话一敲字就一条选项都不剩。
  return { from: context.pos - m[0].length, options, validFor: /^\[[A-Za-z0-9_+#-]*$/ }
}
