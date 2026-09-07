<script setup>
import { computed, onMounted, ref } from "vue";
import navBar from "@/components/navBar.vue";
import { fetchTreePage } from "@/services/trees";
import { formatDateTime } from "@/utils/date";

const trees = ref([]);
const nextCursor = ref(null);
const loading = ref(true);
const loadingMore = ref(false);
const errorMessage = ref("");

const platformTrees = computed(() =>
  [...trees.value]
    .filter((tree) => tree.platformRecommended || tree.kind === "OFFICIAL")
    .sort((a, b) => Date.parse(b.updatedAt || "") - Date.parse(a.updatedAt || "")),
);

async function loadTrees() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const payload = await fetchTreePage("OFFICIAL", { limit: 8 });
    trees.value = payload.trees;
    nextCursor.value = payload.nextCursor;
  } catch (error) {
    trees.value = [];
    nextCursor.value = null;
    errorMessage.value = error.message || "平台树加载失败";
  } finally {
    loading.value = false;
  }
}

async function loadMore() {
  if (!nextCursor.value || loadingMore.value) return;
  loadingMore.value = true;
  try {
    const payload = await fetchTreePage("OFFICIAL", {
      limit: 8,
      cursor: nextCursor.value,
    });
    trees.value = [...trees.value, ...payload.trees];
    nextCursor.value = payload.nextCursor;
  } catch (error) {
    errorMessage.value = error.message || "加载更多失败";
  } finally {
    loadingMore.value = false;
  }
}

onMounted(loadTrees);
</script>

<template>
  <navBar />
  <main class="platform-page">
    <section class="platform-list" aria-label="平台树">
      <p v-if="loading" class="state">正在加载平台树...</p>
      <p v-else-if="errorMessage" class="state error">{{ errorMessage }}</p>
      <p v-else-if="!platformTrees.length" class="state">暂无平台树。</p>
      <article v-for="tree in platformTrees" :key="tree.id" class="tree-row">
        <div>
          <RouterLink class="tree-title" :to="`/life-tree/${tree.uid || tree.id}`">
            {{ tree.title }}
          </RouterLink>
          <p>{{ tree.description || "暂无说明" }}</p>
          <small>{{ tree.creator || "未署名" }} · {{ formatDateTime(tree.updatedAt) }}</small>
        </div>
        <RouterLink class="open-tree" :to="`/life-tree/${tree.uid || tree.id}`">查看树</RouterLink>
      </article>
      <div v-if="nextCursor && !loading" class="load-more">
        <button type="button" :disabled="loadingMore" @click="loadMore">
          {{ loadingMore ? "正在加载..." : "加载更多" }}
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.platform-page { min-height: calc(100vh - 65px); background: #fff; padding: 54px 24px; }
.platform-list { width: min(100%, 980px); margin: 0 auto; }
.tree-row { display: flex; align-items: center; justify-content: space-between; gap: 30px; padding: 24px 0; border-bottom: 1px solid #e5e7eb; }
.tree-title { color: #111827; font-family: Georgia, "Noto Serif SC", serif; font-size: 22px; font-weight: 700; text-decoration: none; }
.tree-title:hover { text-decoration: underline; }
.tree-row p { margin: 9px 0; color: #6b7280; font-size: 14px; line-height: 1.65; }
.tree-row small { color: #9ca3af; font-size: 12px; }
.open-tree { flex: none; color: #374151; font-size: 14px; font-weight: 600; text-decoration: none; }
.open-tree:hover { color: #111827; text-decoration: underline; }
.state { padding: 48px 0; color: #6b7280; text-align: center; }
.state.error { color: #b42318; }
.load-more { display: grid; place-items: center; padding: 30px 0 0; }
.load-more button { padding: 9px 26px; border: 1px solid #c8ccd1; border-radius: 999px; background: #fff; color: #374151; font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
.load-more button:hover { border-color: #111827; color: #111827; }
.load-more button:disabled { opacity: 0.6; cursor: default; }
@media (max-width: 640px) { .platform-page { padding: 28px 18px; } .tree-row { align-items: flex-start; flex-direction: column; gap: 12px; } }
</style>
