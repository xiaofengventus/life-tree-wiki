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
import { ref, watch } from "vue";
import evolution_mind_map from "@/components/evolution_mind_map.vue";
import NodeContentReader from "@/components/NodeContentReader.vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
  fileOwner: { type: String, default: "生命时序" },
  currentTreeId: { type: String, default: "" },
});

const contentSelection = ref(null);

watch(
  () => props.modelValue,
  () => {
    contentSelection.value = null;
  },
);
</script>

<template>
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
