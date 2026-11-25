<script setup>
import { computed } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useNotebook } from '../store.js'
import { codePreviewHtml, renderLaupHtml } from '../renderer.js'
import { importNotebookV2 } from '../kernelV2.js'
import { typesetCells } from '../../laup2/index.js'
import { parseCodeDecl } from '@/utils/codeLang.js'

const store = useNotebook()

// 每一节 = { title, desc, code(laup 源码), scope? } —— 输出用同一渲染器实时生成
const sections = [
  {
    title: '1. 写作基础（完整 Markdown）',
    desc: 'laup 格是 Markdown 超集：标题、粗体/斜体/删除线、列表、引用、行内代码、围栏代码、分隔线全部可用。',
    code: [
      '# 一级标题',
      '## 二级标题',
      '',
      '这是 **粗体**、*斜体*、~~删除线~~、`行内代码`，还有 [链接](https://vuejs.org)。',
      '',
      '- 无序列表项',
      '- 另一项',
      '  1. 嵌套有序项',
      '',
      '> 引用块：laup = Markdown + 少量扩展',
      '',
      '```',
      '围栏代码块（纯展示）',
      '```',
    ].join('\n'),
  },
  {
    title: '2. 行内扩展（laup 特有）',
    desc: '输入 \\ 会自动弹出命令补全，Tab 接受后可在占位符间跳转。数学公式由 Notebook 内置的 KaTeX 排版（\\math{} / $$…$$ 显式写法，或 $…$ 行内）。注意：$…$ 内侧不能有空格（$ a^2 $ 会被当普通文字，这是防止价格 "$5.00" 被误判成公式），要写 $a^2$。',
    code: [
      '\\textcolor{#e25303}{橙色文字}、\\colorbox{#fff3cd}{高亮背景}、',
      '\\underline{下划线}、\\sout{删除线}，行内公式 $E = mc^2$。',
    ].join('\n'),
  },
  {
    title: '3. 更多行内命令',
    desc: '显式命令可以和 md 写法混用；\\textbf 里能嵌套 \\textit。颜色名受白名单约束（red/orange/yellow/green/blue/purple/gray/black/white 及 #hex），不合法会被忽略并给警告。',
    code: [
      '链接：\\href{https://vuejs.org}{Vue 官网}、\\url{https://vite.dev}',
      '',
      '显式样式：\\textbf{粗体里嵌 \\textit{斜体}}、\\code{const x = 1}、',
      '\\math{a^2+b^2=c^2}、\\fontsize{18}{大号字}。',
      '',
      '脚注：这里有一条脚注\\footnote{脚注内容渲染到页脚}。',
    ].join('\n'),
  },
  {
    title: '4. 块级环境 \\begin{ … }',
    desc: '环境内部可以继续写 Markdown / Laup（递归解析）。equation 的编号按出现顺序自动生成，{eq:id} 可选，正文用 \\eqref 引用。',
    code: [
      '\\begin{quote}',
      '引用环境：内部 **Markdown 照常解析**。',
      '\\end{quote}',
      '',
      '\\begin{itemize}',
      '\\item 第一项的第一段',
      '',
      '  同一项的第二段（不用管 md 的缩进规则）',
      '\\item 第二项',
      '\\end{itemize}',
      '',
      '\\begin{center}',
      '居中的一行字',
      '\\end{center}',
      '',
      '\\begin{equation}{eq:mass}',
      'E = mc^2',
      '\\end{equation}',
      '',
      '质量能量见式 \\eqref{eq:mass}。',
    ].join('\n'),
  },
  {
    title: '5. 变量与插值（var 格）',
    desc: '格类型切成 var（点击右上角 laup 徽标循环切换 laup→code→var），自上而下求值；laup 格里用 {{名字}} 插值。支持：字符串（单引号行内未闭合会自动延续到闭合行；""" 三引号多行字符串推荐给代码）、数字、true/false、跨行 JSON；整行 // 或 # 开头是注释；行尾分号可省；var 前缀可省（裸赋值）。注意：含引号的代码请用 """，单引号写法会在第一个同引号处闭合。含 < > 的代码插值进正文会被当 HTML 吞掉——放进 ``` 围栏展示。',
    scope: { title: 'laup × Notebook', year: 2026 },
    code: [
      '// 下面写在 var 格里（本页为演示，实际输出见注释）：',
      '//   var title = "laup × Notebook"',
      '//   var year  = 2026',
      '//   var tags  = [ "notebook", "laup" ]   ← 可跨行',
      '//   var cpp_code = """',
      '//   #include<iostream>',
      '//   """',
      '',
      '标题来源：{{title}}，年份 {{year}}。',
    ].join('\n'),
  },
  {
    title: '6. 图片：\\image 简写 / \\image 块 / 粘贴拖拽',
    desc: '五种方式：① 简写 \\image![alt](src){图注} —— 独占一行，图注支持行内语法（\\textcolor、公式等；\\cite 也能写，序号按全局文献数组解析，见 10b；本 Notebook 特有糖，编译前展开成 ② 的规范块）；② \\image=[...] 规范块（键值是 key="value"）；③ 剪贴板 Ctrl+V 直接粘贴（自动存附件并插入简写，把 { } 补上图注即可）；④ 拖拽图片文件进输入区；⑤ 工具栏 📷 上传（≤8MB，仅 image/*）。注意：C:\\ 本地磁盘路径在网页里禁止加载，r"" 原样字符串也救不了 —— 必须用附件 / 相对路径 / http URL。',
    code: [
      '\\image![银白狐耳](images/fox.jpg){图 1：示例配图}',
      '',
      '\\image=[',
      '    src="images/fox.jpg"',
      '    alt="银白狐耳少女"',
      '    caption="来自 public/images/fox.jpg"',
      ']',
    ].join('\n'),
  },
  {
    title: '7. 表格（管道语法）',
    desc: '标准 GFM 管道表格。',
    code: [
      '| 球员 | 球队 | 年薪 |',
      '|---|---|---|',
      '| Stephen Curry | Warriors | $51,915,615 |',
      '| LeBron James | Lakers | $48,724,414 |',
    ].join('\n'),
  },
  {
    title: '8. 块级数据表格 \\table=[ … ]（第②档）',
    desc: '与上面的管道表格编译到同一个 Table 节点，但更强：单元格可含 \\n 换行、放 | 不用转义、align="lcr" 控制对齐、caption 加表注、列数不齐会报准确行号（管道式只会静默渲染成错表）。\\excel=[ … ] 是它的别名。规则：命令名带 \\，字段名（column/row/caption/align）不带；[ 后紧跟换行就是数据块。',
    code: [
      '\\table=[',
      '    caption="表 1 人员名单"',
      '    align="lcr"',
      '    column=[',
      '        "姓名"',
      '        "年龄"',
      '        "备注"',
      '    ]',
      '    row=[',
      '        "张三"',
      '        "20"',
      '        "无"',
      '    ]',
      '    row=[',
      '        "李四"',
      '        "21"',
      '        "**重点**，公式 $x^2$"',
      '    ]',
      ']',
    ].join('\n'),
  },
  {
    title: '9. 版面命令：目录 / 分隔线 / 换行 / \\raw',
    desc: '\\tableofcontents 按标题自动生成目录 —— 注意 Notebook 里每个格独立编译，目录只收集**当前格**内的标题；\\hr 是分隔线、\\linebreak 强制换行；\\raw 是唯一允许 HTML 的通道。（规范里还定义了行首 % 注释，编译器尚未实现。）',
    code: [
      '## 第一章',
      '正文……',
      '## 第二章',
      '正文……',
      '',
      '\\tableofcontents',
      '',
      '上一段',
      '\\hr',
      '下一段（\\hr 是分隔线，\\linebreak 是段内强制换行）',
      '',
      '\\raw{<span style="border:1px solid #e25303;border-radius:3px;padding:1px 6px">原生 HTML</span>}',
    ].join('\n'),
  },
  {
    title: '10. 代码格：首行写类型声明',
    desc: '格类型切成 code（点右上角徽标循环 laup→code→var，或按 Y）。第一行写类型声明，形如 [cpp]：它只决定按什么语言上色（预览和阅读页都会把这行藏起来），但它会**原样留在 .laup 源码里** —— 导出不做任何转换，所以「导出 → 导入」后这行还在。打一个 [ 就会列出全部可用类型 —— 目前是 [cpp] [c] [python] [javascript] [json] [bash] [html] [css] [text]，另有 [input] / [output]（见 10a）。代码格只负责「写代码」：不执行任何东西，预览随打字实时更新（不上编译 Laup，很便宜）；没写声明时格下方会把可选类型列出来。',
    asCell: true,
    code: [
      '[cpp]',
      '#include <iostream>',
      '',
      'int main() {',
      '    std::cout << "hello world" << std::endl;',
      '    return 0;',
      '}',
    ].join('\n'),
  },
  {
    title: '10a. 代码格：输入 / 输出对照卡',
    desc: '要放「输入—输出」对照（读代码猜结果、贴运行结果）就用两个代码格：上一格首行 [input]，紧跟的下一格首行 [output]，相邻两格会自动并成一张左右对照的样例卡；只有一侧时显示单栏。输入栏想上色就写 [input:python]（冒号后跟语言名）。导出 .laup / 发布文章时，这一对格会合回一个 ```sample 围栏 —— 所以阅读页看到的还是同一张卡。',
    code: [
      '```sample',
      'import pandas as pd',
      'df = pd.read_csv("ABN.csv")',
      'print(df.head())',
      '---',
      '      姓名  年龄  城市',
      '0  Alice  24  北京',
      '1    Bob  31  上海',
      '```',
    ].join('\n'),
  },
  {
    title: '10b. 参考文献数组（推荐：var 格声明）',
    desc: '在 var 格里声明文献数组（各写法等价：reference refs / reference::refs / reference::var refs），然后每行 refs[N]="条目" 显式钉死第 N 号槽位——可跳号、可覆盖。任何 laup 格的 \\cite{N} 都按**全局编号**跨格解析；文献列表显示在第一个声明文献的格（只出现一次），其他格只有上标。跳号产生的空槽显示"（未定义的文献条目 N）"占位。注意：这些声明写在 **var 格**里，写进 laup 格不会生效。',
    code: [
      'reference refs',
      'refs[1] = "Darwin C. On the Origin of Species. 1859"',
      'refs[2] = "Margulis L. Symbiosis in Cell Evolution. 1981"',
      'refs[4] = "Huxley J. Evolution: The Modern Synthesis. 1942"',
    ].join('\n'),
    plain: [
      '<p>声明后，正文里任意 laup 格写：</p>',
      '<pre style="margin:6px 0">现代综合演化的奠基\\cite{1,4}，内共生学说\\cite{2}。</pre>',
      '<p>运行后上标 <b>[1,4]</b>、<b>[2]</b> 自动解析并锚跳到文献列表；',
      '本例的 3 号槽位空着，列表里会显示占位行"（未定义的文献条目 3）"，',
      '补一条 <code>refs[3] = "…"</code> 即可。声明格本身不显示任何内容（文献列表在第一个声明格渲染）。</p>',
    ].join(''),
  },
  {
    title: '10c. 旧版块语法 \\references=[ … ]（不建议使用）',
    desc: '仍兼容：写在 laup 格里，条目按出现顺序填入同一个全局数组（var 格显式编号优先占位）。但编号隐式靠位置，跨格维护容易错位，且每条引号必须闭合、收尾 ] 必须独立成行——所以标注为不建议使用，新文档请用 10b 的 var 数组声明。',
    code: [
      '\\references=[',
      '    "Darwin C. On the Origin of Species. 1859"',
      '    "Margulis L. Symbiosis in Cell Evolution. 1981"',
      ']',
      '',
      '现代综合演化的奠基\\cite{1,2}。',
    ].join('\n'),
  },
  {
    title: '11. 快捷键（对齐 Jupyter 双模式）',
    desc: 'Esc 进命令模式，Enter 进编辑模式；编辑模式下 Shift+Enter 渲染本格并跳到下一格（代码格只是重画预览，不执行任何东西）。',
    code: [
      '| 按键 | 作用 |',
      '|---|---|',
      '| 单击输入区 | 进入编辑（得到光标） |',
      '| Esc / Enter | 命令模式 / 编辑模式 |',
      '| Shift+Enter | 渲染本格并选中下一格 |',
      '| j / k 或 ↓ / ↑ | 命令模式下移动选中 |',
      '| a / b | 在上方 / 下方新建格 |',
      '| d d | 删除当前格（连按两次） |',
      '| m / y / v | 切换 laup / code / var 格 |',
    ].join('\n'),
  },
  {
    title: '11b. 渲染结果显示在哪（工具条开关）',
    desc: '菜单栏「结果」下拉有三档，默认**下方**。它只改「结果画在哪」，一格数据都不动，也不改变导出/发布的结果。',
    code: [
      '| 档位 | 长什么样 |',
      '|---|---|',
      '| 下方 | 源码在上、结果在下（默认，Jupyter 的样子） |',
      '| 原地 | 结果占住整格；**双击结果**（或 Enter）回到源码编辑 |',
      '| 折叠源码 | 源码收成一行摘要条（在结果**之上**），点摘要条展开 |',
      '',
      '> 原地与折叠档下，没有结果的格（空格、还没写东西）仍会显示源码 —— 否则整格什么都不剩，连点都点不到。',
      '> 选择记在本机（localStorage），并随草稿与 .lanb 一起走。',
    ].join('\n'),
  },
  {
    title: '12. 保存与文件格式',
    desc: '内容实时自动保存到浏览器 localStorage。两种手动导出：',
    code: [
      '- **.lanb**（导出 .lanb / 导入）：Notebook 全量 JSON，对齐 .ipynb 的定位 —— 格结构、执行序号、**粘贴的图片附件**都存进去，用于换机器/换浏览器迁移和备份。',
      '- **.laup**（导出 .laup）：纯文本文档，附件内联 base64、**代码格原样进 ```code 围栏**（首行的 `[cpp]` 声明照写、正文一字不改；阅读页认首行来上色并把这行藏起来），[input] + [output] 沿旧例并成一个 ```sample 对照卡。**变量定义以零输出的 `\\varcell=[ … ]` 块随文档走，正文里保留 `{{name}}`** —— 所以「导出 → 导入」往返无损，专栏「编辑」也能把 var 格原样拿回来。变量在**发布时**由服务端解析成字面值，读者看到的仍是内联好的正文。',
      '',
      '> 简单说：.lanb 存「工程」，.laup 存「文章」。',
    ].join('\n'),
  },
]

const v2Sections = [
  {
    title: '1. Laup 格：写作与引用',
    desc: '用 Laup 格写正文、Markdown 与公式。用 \\cite{1} 按 1 起始的编号引用文献；引用号显示为下标。旧 var 格原文保留为 Laup 格，不再执行变量定义。',
    code: ['# Laup v2 示例', '', '这是 **正文**，也可以写公式 $E=mc^2$，或引用文献 \\cite{1}。', '\\cellbreak', '[references]', '第 1 条参考文献'].join('\n'),
  },
  {
    title: '2. Code 格：展示代码与输入输出',
    desc: '首行用 [cpp]、[python] 等声明展示语言，不执行代码。相邻的 [input] 和 [output] 会合并成一张对照卡，且不声明语言。[references] 是文献声明，一行一条，不是第三种编辑格。',
    code: ['[cpp]', 'int main() { return 0; }', '\\cellbreak', '[input]', '2 3', '\\cellbreak', '[output]', '5'].join('\n'),
  },
]

// asCell: true 的段落按「代码格源码」渲染（走代码格那条预览路线），
// 这样手册里看到的就是代码格真实的产物；其余段落按 laup 源码渲染。
const rendered = computed(() =>
  store.kernel === 'v2'
    ? v2Sections.map((s) => ({ ...s, html: typesetCells(s.code).html }))
    : sections.map((s) => ({
      ...s,
      html: s.asCell ? codePreviewHtml(parseCodeDecl(s.code)) : renderLaupHtml(s.code, s.scope || {}),
    }))
)

const emit = defineEmits(['close'])

async function openInNotebook() {
  if (store.kernel === 'v2') {
    store.applyDraft({ cells: importNotebookV2(v2Sections.map((s) => s.code).join('\n\\cellbreak\n')) })
  } else {
    await store.loadExample()
  }
  emit('close')
}

function goBack() {
  emit('close')
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
</script>

<template>
  <div id="help">
    <header id="help-head">
      <span class="brand">laup</span><span class="brand-sub">Notebook 使用手册</span>
      <button @click="openInNotebook">▶ 把示例载入 Notebook</button>
      <a class="back" href="#" @click.prevent="goBack">← 返回 Notebook</a>
    </header>

    <p id="help-intro">
      本页每一段「源码」都是真实的 laup 语法，「输出」由页面内嵌的 laup 渲染器实时生成 ——
      手册本身就是 laup 能力的演示。
    </p>

    <section v-for="s in rendered" :key="s.title" class="doc-item">
      <h2>{{ s.title }}</h2>
      <p class="doc-desc">{{ s.desc }}</p>
      <pre class="doc-code">{{ s.code }}</pre>
      <div class="doc-label">{{ s.plain ? '说明' : '输出' }}</div>
      <div class="output doc-out" v-html="s.plain ? s.plain : s.html"></div>
    </section>

    <footer v-if="store.kernel === 'v2'" id="help-foot">Laup v2 · Laup / Code</footer>
    <footer v-else id="help-foot">
      laup 核心规范 v0.5 ·
      完整示例文档 <code>public/notebook-example.laup</code>
    </footer>
  </div>
</template>

<style scoped>
#help { max-width: 860px; margin: 0 auto; padding: 24px 16px 120px; }
#help-head { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #e3e3e3; padding-bottom: 12px; }
#help-head .brand { font-weight: bold; color: #e25303; font-size: 17px; }
#help-head .brand-sub { color: #666; margin-right: 14px; }
#help-head button {
  border: 1px solid #ccc; background: #f7f7f7; border-radius: 3px;
  padding: 4px 12px; font-size: 13px; cursor: pointer; color: #333;
}
#help-head button:hover { background: #ececec; }
#help-head .back { margin-left: auto; color: #2b6cb0; font-size: 13px; text-decoration: none; }
#help-intro { color: #666; font-size: 13.5px; background: #f6f9fc; border: 1px solid #dce8f2; border-radius: 4px; padding: 10px 14px; margin: 16px 0; }

.doc-item { margin: 34px 0; }
.doc-item h2 { font-size: 19px; margin: 0 0 6px; }
.doc-desc { color: #555; font-size: 13.5px; line-height: 1.65; margin: 0 0 10px; }

.doc-code {
  background: #f7f7f7; border: 1px solid #e5e5e5; border-left: 3px solid #c9d8e6;
  border-radius: 3px; padding: 10px 12px; font-family: Consolas, Menlo, monospace;
  font-size: 12.8px; line-height: 1.55; overflow-x: auto; margin: 0 0 8px; white-space: pre-wrap;
}
.doc-label { font-size: 11.5px; color: #999; letter-spacing: 2px; margin-bottom: 2px; }
.doc-out { border: 1px dashed #e0e6ec; border-radius: 3px; padding: 10px 14px; background: #fff; }

#help-foot { color: #999; font-size: 12.5px; border-top: 1px solid #e3e3e3; padding-top: 14px; margin-top: 40px; }
#help-foot code { background: #f4f4f4; padding: 1px 5px; border-radius: 2px; }
</style>
