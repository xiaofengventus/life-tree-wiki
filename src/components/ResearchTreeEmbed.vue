<script setup>
import { computed, ref, watch } from "vue";
import EvolutionTreeViewer from "@/components/EvolutionTreeViewer.vue";
import { fetchTree } from "@/services/trees";
import { normalizeMindMapDocument } from "@/utils/evolutionMindMapModel";
import { platformTreeLabel } from "@/utils/treeLabels";

const props = defineProps({
  treeId: { type: String, required: true },
  fallbackTitle: { type: String, default: "进化树" },
});
const tree = ref(null);
const errorMessage = ref("");
const document = computed(() => tree.value?.document ? normalizeMindMapDocument(tree.value.document) : null);

async function loadTree() {
  tree.value = null;
  errorMessage.value = "";
  try {
    tree.value = await fetchTree(props.treeId);
  } catch (error) {
    tree.value = null;
    errorMessage.value = error.message || "进化树加载失败";
  }
}

watch(() => props.treeId, loadTree, { immediate: true });
</script>

<template>
  <section class="research-tree-embed">
    <header>
      <div>
        <span>RESEARCH TREE</span>
        <strong>{{ tree?.title || fallbackTitle }}</strong>
        <small v-if="platformTreeLabel(tree)">{{ platformTreeLabel(tree) }}</small>
      </div>
      <RouterLink :to="`/life-tree/${treeId}`">打开完整页面</RouterLink>
    </header>
    <div class="embed-canvas">
      <p v-if="!document && !errorMessage">正在加载进化树……</p>
      <p v-else-if="errorMessage" class="error">{{ errorMessage }}</p>
      <EvolutionTreeViewer
        v-else
        :key="`${tree.id}:${tree.version || 1}`"
        :model-value="document"
        :file-owner="tree?.title || fallbackTitle"
        :current-tree-id="tree?.uid || treeId"
      />
    </div>
  </section>
</template>

<style scoped>
.research-tree-embed { margin:24px 0; overflow:hidden; border:1px solid #b9cbbf; border-radius:12px; background:#f8faf7; }
.research-tree-embed header { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:12px 16px; border-bottom:1px solid #d5dfd8; background:#eef5f0; }
.research-tree-embed header div { display:grid; gap:2px; }
.research-tree-embed header span { color:#65806e; font-size:10px; font-weight:800; letter-spacing:.14em; }
.research-tree-embed header strong { color:#153727; }
.research-tree-embed header small{width:max-content;margin-top:3px;padding:3px 7px;border-radius:999px;background:#e5f0ff;color:#315f9c;font-size:10px;font-weight:800}
.research-tree-embed header a { color:#2563eb; font-size:13px; font-weight:700; }
.research-tree-embed header a:hover { color:#1d4ed8; }
.embed-canvas { height:500px; overflow:hidden; background:#fff; }
.embed-canvas>p { display:grid; height:100%; margin:0; place-items:center; color:#607068; }
.embed-canvas>p.error { color:#b04840; }
@media(max-width:720px){.embed-canvas{height:420px}.research-tree-embed header{align-items:flex-start}}
</style>
