<script setup>
// 一个单元格。三种「渲染结果画在哪」共用这一个组件（工具条上的开关切换）：
//   below   源码在上、结果在下（默认，Jupyter 的样子）
//   inplace 结果占住整格，双击/回车才回到源码
//   folded  结果在上，源码收成一行摘要条（点它展开）
// 双模式（命令 / 编辑）仍然照旧：命令模式选中、编辑模式打字。
import { computed } from 'vue'
import { useNotebook } from '../store.js'
import CellToolbar from './CellToolbar.vue'
import InputArea from './InputArea.vue'
import OutputArea from './OutputArea.vue'

const props = defineProps({ cell: { type: Object, required: true } })
const store = useNotebook()

// 「这一格现在是不是正在编辑」—— 渲染位置与双模式共用这一个判据
const editing = computed(() => store.mode === 'edit' && store.selectedId === props.cell.id)
const rm = computed(() => store.renderMode)

// 什么时候还看得见源码：
//   below            永远看得见（源码在上、结果在下）
//   inplace / folded 只在编辑时；不编辑时整格只剩结果
//   ⚠️ 例外：**没有结果**的格（空格、还没写东西、渲染为空）必须继续显示源码 ——
//      否则结果区是空的、整格什么都不剩，连点都点不到，等于把格子弄丢了。
const showSource = computed(() => rm.value === 'below' || editing.value || !props.cell.outputHtml)

// 折叠模式那条「源码摘要」：只在**源码真的被收起来**时才出现。
// 条件里必须带上 !showSource —— 否则没有结果的格会一边显示编辑区、一边多挂一条摘要条。
const folded = computed(() => rm.value === 'folded' && !editing.value && !showSource.value)

// 摘要取第一条非空行（标题行优先），外加总行数 —— 折叠了也要能认出是哪一格
const summary = computed(() => {
  const lines = props.cell.source.split('\n')
  const first = lines.find((l) => l.trim())
  const count = lines.filter((l) => l.trim()).length
  return { text: String(first || '').trim().slice(0, 72) || '（空）', count }
})

function enterEdit() {
  store.select(props.cell.id)
  store.setMode('edit')
}
</script>

<template>
  <div
    class="cell"
    :class="{ selected: store.selectedId === cell.id, inplace: rm === 'inplace', folded: rm === 'folded', 'src-hidden': !showSource }"
  >
    <div class="prompt" title="单击选中（命令模式）" @click="store.select(cell.id)">
      [{{ cell.execCount ?? ' ' }}]:
    </div>
    <div class="body">
      <!-- 壳子只为「工具栏永远挂得住」而存在：inplace 档下编辑区会被结果替换掉，
           工具栏若还挂在 .input-area 里就会跟着消失（删格/上移就点不到了）。 -->
      <div class="cell-shell">
        <CellToolbar :cell="cell" />
        <div v-if="showSource" class="input-area" @dblclick="enterEdit">
          <InputArea :cell="cell" />
        </div>
        <!-- 折叠档的源码摘要条：**必须在结果之上**。
             理由不是审美 —— 点开它，展开的是编辑区，而编辑区在 DOM 里排在结果之前；
             摘条若放在结果下方，点开的瞬间那一行会从下跳到上（位置不一致，很晃）。
             放在上面，它就正好长在「展开后编辑区出现的地方」，原地展开。 -->
        <div
          v-if="folded"
          class="source-fold"
          title="展开源码（也可以先按 Enter 选中再按 Enter 进编辑）"
          @click="enterEdit"
        >
          <span class="source-fold-type">{{ cell.type }}</span>
          <code class="source-fold-text">{{ summary.text }}</code>
          <span class="source-fold-meta">{{ summary.count }} 行 · 点击展开</span>
        </div>
        <!-- 结果区什么时候在场：
               below            一直在（源码在上、结果在下）
               folded           一直在（源码折成一行在最上面，结果在它下面）
               inplace          **只有不在编辑时**（结果就是这一格的本体；
                                一回到编辑就得让位，否则源码和结果会同时堆在格子里）
             ⚠️ 原地档这条 v-if 是必须的，漏掉的话"再次编辑时渲染结果不消失"。 -->
        <OutputArea
          v-if="rm !== 'inplace' || !editing"
          :cell="cell"
          @dblclick="rm === 'inplace' && enterEdit()"
        />
      </div>
    </div>
  </div>
</template>
