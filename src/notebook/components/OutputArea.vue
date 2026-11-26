<script setup>
import { watch, nextTick, ref } from 'vue'
import { renderMathIn } from '../mathRender.js'

const props = defineProps({ cell: { type: Object, required: true } })
const root = ref(null)

// 公式与纸面走同一个排版入口（mathRender.js），保证左右两边排出来一致
watch(() => props.cell.outputHtml, () => nextTick(() => renderMathIn(root.value)), { immediate: true, flush: 'post' })
</script>

<template>
  <div ref="root" class="output" v-html="cell.outputHtml"></div>
</template>
