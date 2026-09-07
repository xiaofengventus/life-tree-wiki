<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import navBar from "@/components/navBar.vue";
import EvolutionTreeViewer from "@/components/EvolutionTreeViewer.vue";
import { fetchTree } from "@/services/trees";
import { normalizeMindMapDocument } from "@/utils/evolutionMindMapModel";
import { formatDateTime } from "@/utils/date";

const route = useRoute();
const tree = ref(null);
const loading = ref(true);
const errorMessage = ref("");

const document = computed(() =>
  tree.value?.document ? normalizeMindMapDocument(tree.value.document) : null,
);

async function loadTree() {
  loading.value = true;
  errorMessage.value = "";
  tree.value = null;
  try {
    tree.value = await fetchTree(route.params.id);
  } catch (error) {
    errorMessage.value = error.message || "树加载失败";
  } finally {
    loading.value = false;
  }
}

watch(() => route.params.id, loadTree, { immediate: true });
</script>

<template>
  <navBar />
  <main class="tree-page">
    <p v-if="loading" class="state">正在加载树...</p>
    <p v-else-if="errorMessage" class="state error">{{ errorMessage }}</p>
    <template v-else-if="tree && document">
      <header class="tree-header">
        <div>
          <h1>{{ tree.title }}</h1>
          <p>{{ tree.description || "暂无说明" }}</p>
        </div>
        <small>{{ tree.creator || "未署名" }} · {{ formatDateTime(tree.updatedAt) }}</small>
      </header>
      <section class="tree-canvas" aria-label="知识树">
        <EvolutionTreeViewer
          :key="`${tree.id}:${tree.version || 1}`"
          :model-value="document"
          :file-owner="tree.title"
          :current-tree-id="tree.uid || tree.id"
        />
      </section>
    </template>
    <p v-else class="state">没有可显示的树内容。</p>
  </main>
</template>

<style scoped>
.tree-page { min-height: calc(100vh - 65px); padding: 38px 24px; background: #fff; }
.tree-header, .tree-canvas { width: min(100%, 1280px); margin: 0 auto; }
.tree-header { display: flex; align-items: end; justify-content: space-between; gap: 32px; margin-bottom: 22px; }
.tree-header h1 { margin: 0; color: #111827; font-family: Georgia, "Noto Serif SC", serif; font-size: 30px; }
.tree-header p { max-width: 740px; margin: 10px 0 0; color: #6b7280; line-height: 1.7; }
.tree-header small { flex: none; color: #9ca3af; }
.tree-canvas { height: min(680px, calc(100vh - 230px)); min-height: 440px; overflow: hidden; border: 1px solid #dfe3e8; background: #fff; }
.state { display: grid; min-height: 360px; place-items: center; color: #6b7280; }
.state.error { color: #b42318; }
@media (max-width: 700px) { .tree-page { padding: 26px 14px; } .tree-header { align-items: flex-start; flex-direction: column; gap: 10px; } .tree-header h1 { font-size: 25px; } .tree-canvas { height: 560px; min-height: 0; } }
</style>
