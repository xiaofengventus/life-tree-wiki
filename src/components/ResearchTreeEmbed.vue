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

// GET /api/trees/:id returns the current published tree, not a revision snapshot.
// Its version belongs to the returned document; article history cannot pin it.
watch(() => props.treeId, async (treeId, _previousId, onCleanup) => {
  let isCurrent = true;
  onCleanup(() => { isCurrent = false; });
  tree.value = null;
  errorMessage.value = "";
  try {
    const loadedTree = await fetchTree(treeId);
    if (isCurrent) tree.value = loadedTree;
  } catch (error) {
    if (isCurrent) {
      errorMessage.value = error.message || "进化树加载失败";
    }
  }
}, { immediate: true });
</script>

<template>
  <section class="research-tree-embed">
    <header>
      <div>
        <span>RESEARCH TREE</span>
        <strong>{{ tree?.title || fallbackTitle }}</strong>
        <small v-if="platformTreeLabel(tree)">{{ platformTreeLabel(tree) }}</small>
        <p class="embed-version" aria-live="polite">
          当前版本引用（非固定快照） ·
          <template v-if="tree?.version">本次加载：v{{ tree.version }}</template>
          <template v-else-if="tree">本次加载：版本号未提供</template>
          <template v-else-if="errorMessage">本次加载：未能读取版本</template>
          <template v-else>本次加载：版本待确认</template>
        </p>
      </div>
      <RouterLink :to="`/life-tree/${treeId}`">打开完整页面</RouterLink>
    </header>
    <div class="embed-canvas">
      <p v-if="!document && !errorMessage">正在加载进化树……</p>
      <p v-else-if="errorMessage" class="error">{{ errorMessage }}</p>
      <EvolutionTreeViewer
        v-else
        :key="`${tree.id}:${tree.version}`"
        :model-value="document"
        :file-owner="tree?.title || fallbackTitle"
        :current-tree-id="tree?.uid || treeId"
      />
    </div>
    <footer class="embed-notes">
      <p>此嵌入每次加载读取树的当前版本（可能受缓存影响），不固定文章发表时的树快照。打开文章历史版本也可能显示更新后的树；上方版本号仅代表本次实际加载的数据。</p>
      <p>科学阅读提示：此布局仅展示节点关系，不按分支长度或年代比例绘制，不能据图推断演化时间或遗传距离。</p>
    </footer>
  </section>
</template>

<style scoped>
.research-tree-embed { margin:24px 0; overflow:hidden; border:1px solid #b9cbbf; border-radius:12px; background:#f8faf7; }
.research-tree-embed header { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:12px 16px; border-bottom:1px solid #d5dfd8; background:#eef5f0; }
.research-tree-embed header div { display:grid; gap:2px; }
.research-tree-embed header span { color:#65806e; font-size:10px; font-weight:800; letter-spacing:.14em; }
.research-tree-embed header strong { color:#153727; }
.research-tree-embed header small{width:max-content;margin-top:3px;padding:3px 7px;border-radius:999px;background:#e5f0ff;color:#315f9c;font-size:10px;font-weight:800}
.research-tree-embed header .embed-version { margin:4px 0 0; color:#486452; font-size:12px; line-height:1.6; }
.research-tree-embed header a { color:#2563eb; font-size:13px; font-weight:700; }
.research-tree-embed header a:hover { color:#1d4ed8; }
.embed-canvas { height:500px; overflow:hidden; background:#fff; }
.embed-canvas>p { display:grid; height:100%; margin:0; place-items:center; color:#607068; }
.embed-canvas>p.error { color:#b04840; }
.embed-notes { padding:10px 16px; border-top:1px solid #d5dfd8; color:#52665b; font-size:12px; line-height:1.7; }
.embed-notes p { margin:0; }
.embed-notes p + p { margin-top:4px; }
@media(max-width:720px){.embed-canvas{height:420px}.research-tree-embed header{align-items:flex-start}}
</style>
