<!--
  ============================================================================
  原方案 (Original Implementation) - 保留此文件作为回退参考
  ============================================================================
  
  此组件是 evolution_mind_map.vue 的只读包装组件，
  使用 simple-mind-map 库渲染进化树，节点内容为 SVG 元素。
  
  如需切换到真实 HTML DOM 渲染方案，请使用 HtmlTreeRenderer.vue
  
  切换方式：在 view_research_tree.vue 中使用 renderMode 切换
  ============================================================================
-->
<script setup>
import { computed, ref, watch } from "vue";
import evolution_mind_map from "@/components/evolution_mind_map.vue";
import NodeContentReader from "@/components/NodeContentReader.vue";
import { getTreeKindMeta, normalizeTreeScience } from "../../shared/treeScience.js";

const props = defineProps({
  modelValue: { type: Object, required: true },
  fileOwner: { type: String, default: "生命时序" },
  currentTreeId: { type: String, default: "" },
});

const contentSelection = ref(null);
const treeScience = computed(() => normalizeTreeScience(props.modelValue?.scientific));
const treeKindMeta = computed(() => getTreeKindMeta(treeScience.value.kind));

watch(
  () => props.modelValue,
  () => {
    contentSelection.value = null;
  },
);
</script>

<template>
  <div
    v-if="treeScience.kind !== 'unspecified' || treeScience.description"
    class="tree-science-banner"
  >
    <strong>{{ treeKindMeta.label }}</strong>
    <span v-if="treeScience.description"> · {{ treeScience.description }}</span>
    <span class="tree-science-note">（当前画布布局不按枝长或年代比例绘制）</span>
  </div>
  <evolution_mind_map
    :model-value="modelValue"
    read-only
    :file-owner="fileOwner"
    :current-tree-id="currentTreeId"
    @content-links="contentSelection = { ...$event, currentTreeId }"
  />
  <NodeContentReader
    :selection="contentSelection"
    @close="contentSelection = null"
  />
</template>

<style scoped>
.tree-science-banner {
  padding: 8px 14px;
  border-bottom: 1px solid #d5dfd8;
  background: #f7faf6;
  color: #3d5748;
  font-size: 12px;
  line-height: 1.6;
}
.tree-science-note { color: #6b7c71; }
</style>
