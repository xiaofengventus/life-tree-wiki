<script setup>
import { computed } from 'vue'
import { useNotebook } from '../store.js'
import { importNotebookV2 } from '../kernelV2.js'
import { typesetCells } from '../../laup2/index.js'

const store = useNotebook()

// 每一节 = { title, desc, code(laup 源码) } —— 输出用同一渲染器实时生成
const v2Sections = [
  {
    title: '1. Laup 格：写作与引用',
    desc: '用 Laup 格写正文、Markdown 与公式。用 \\cite{1} 按 1 起始的编号引用文献；引用号显示为下标。首行的 [cpp] / [input] / [output] / [references] 都是 Laup 标记语言（不是代码声明）。',
    code: ['# Laup 示例', '', '这是 **正文**，也可以写公式 $E=mc^2$，或引用文献 \\cite{1}。', '\\cellbreak', '[references]', '第 1 条参考文献'].join('\n'),
  },
  {
    title: '2. Laup 格里的代码展示块',
    desc: '首行写 [cpp]、[python] 等，就是一段只排版、不执行的代码展示块；语言由方括号里的名字决定。相邻的 [input] 与 [output] 会合并成一张对照卡。',
    code: ['[cpp]', 'int main() { return 0; }', '\\cellbreak', '[input]', '2 3', '\\cellbreak', '[output]', '5'].join('\n'),
  },
  {
    title: '3. 原生代码格：不写任何声明',
    desc: '代码格（Code）是真正的代码单元格：正文就是代码本身，首行不写任何标记。语言来自项目设置（菜单里的「代码语言」），全文代码格统一使用；发布 / 导出时自动带上语言标记，作者不用管。',
    plain: true,
    code: ['#include <iostream>', '', 'int main() {', '    std::cout << "hello";', '    return 0;', '}'].join('\n'),
  },
]

const rendered = computed(() =>
  v2Sections.map((s) => (s.plain ? s : { ...s, html: typesetCells(s.code).html }))
)

const emit = defineEmits(['close'])

async function openInNotebook() {
  const { cells, codeLang } = importNotebookV2(v2Sections.map((s) => s.code).join('\n\\cellbreak\n'))
  store.applyDraft({ cells, codeLang })
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
      <template v-if="!s.plain">
        <div class="doc-label">输出</div>
        <div class="output doc-out" v-html="s.html"></div>
      </template>
    </section>

    <footer id="help-foot">Laup v2 · Laup / Code</footer>
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
