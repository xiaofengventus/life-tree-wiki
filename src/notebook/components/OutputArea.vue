<script setup>
import { watch, nextTick, ref } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { translate } from '../../utils/mathKit.js'

const props = defineProps({ cell: { type: Object, required: true } })
const root = ref(null)

// Laup 编译器把公式输出为 <span/div class="laup-math*" data-tex="…">，
// 排版由宿主负责：每次输出更新后用 KaTeX 渲染这些节点
function renderMath() {
  if (!root.value) return
  for (const el of root.value.querySelectorAll('[data-tex]')) {
    if (el.dataset.texDone) continue
    try {
      katex.render(translate(el.dataset.tex) ?? el.dataset.tex, el, { throwOnError: false, displayMode: el.classList.contains('laup-math-display') })
      el.dataset.texDone = '1'
    } catch { /* 公式非法时保留原文 */ }
  }
}

watch(() => props.cell.outputHtml, () => nextTick(renderMath), { immediate: true, flush: 'post' })
</script>

<template>
  <div ref="root" class="output" v-html="cell.outputHtml"></div>
</template>
