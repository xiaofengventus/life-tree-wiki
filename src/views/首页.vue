<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import navBar from "@/components/navBar.vue";
import user_show from "@/components/user_show.vue";
import { useUserStore } from "@/stores/user";
import { searchKnowledge } from "@/services/search";

const router = useRouter();
const userStore = useUserStore();
const query = ref("");
const suggestions = ref({ posts: [], trees: [], nodes: [] });
const suggestOpen = ref(false);
const suggesting = ref(false);
let suggestTimer = 0;
let searchRequestId = 0;

const hasSuggestions = computed(
  () =>
    suggestions.value.posts.length ||
    suggestions.value.trees.length ||
    suggestions.value.nodes.length,
);

watch(query, (value) => {
  window.clearTimeout(suggestTimer);
  const keyword = value.trim();
  if (!keyword) {
    suggestions.value = { posts: [], trees: [], nodes: [] };
    suggestOpen.value = false;
    suggesting.value = false;
    return;
  }
  suggesting.value = true;
  suggestTimer = window.setTimeout(async () => {
    const requestId = ++searchRequestId;
    try {
      const payload = await searchKnowledge(keyword, 3);
      if (requestId !== searchRequestId) return;
      suggestions.value = payload;
      suggestOpen.value = true;
    } catch {
      if (requestId === searchRequestId) {
        suggestions.value = { posts: [], trees: [], nodes: [] };
        suggestOpen.value = false;
      }
    } finally {
      if (requestId === searchRequestId) suggesting.value = false;
    }
  }, 250);
});

function search() {
  const keyword = query.value.trim();
  suggestOpen.value = false;
  router.push({ path: "/search", query: keyword ? { q: keyword } : {} });
}

function postTarget(post) {
  return { name: "wiki-post", params: { title: post.title } };
}

function treeTarget(tree) {
  return `/life-tree/${tree.uid || tree.id}`;
}

function nodeTarget(node) {
  return `/life-tree/${node.treeUid}?node=${encodeURIComponent(node.nodeId)}`;
}

function typeLabel(type) {
  return type === "news" ? "新闻" : type === "science" ? "科普" : "";
}

function onSuggestKeydown(event) {
  if (event.key === "Escape") suggestOpen.value = false;
}

onMounted(() => userStore.initialize());
onBeforeUnmount(() => window.clearTimeout(suggestTimer));
</script>

<template>
  <navBar />
  <!-- 右下角圆形悬浮用户卡片（含退出登录） -->
  <user_show />
  <main class="wiki-home">
    <div class="search-area">
      <form class="search-form" role="search" @submit.prevent="search">
        <label class="sr-only" for="wiki-search">搜索知识库</label>
        <input
          id="wiki-search"
          v-model="query"
          type="search"
          placeholder="搜索文章、树与生命树节点"
          autocomplete="off"
          @focus="hasSuggestions && (suggestOpen = true)"
          @keydown="onSuggestKeydown"
          @blur="suggestOpen = false"
        />
      </form>

      <!-- 搜索栏下方词条联想 -->
      <ul
        v-if="suggestOpen && hasSuggestions"
        class="suggest-panel"
        aria-label="搜索联想"
      >
        <li v-if="suggestions.posts.length">
          <span class="suggest-group">文章</span>
          <ul>
            <li v-for="post in suggestions.posts" :key="post.id">
              <RouterLink :to="postTarget(post)" @mousedown.prevent>
                {{ post.title }}
                <small v-if="typeLabel(post.type)">{{ typeLabel(post.type) }}</small>
              </RouterLink>
            </li>
          </ul>
        </li>
        <li v-if="suggestions.trees.length">
          <span class="suggest-group">树</span>
          <ul>
            <li v-for="tree in suggestions.trees" :key="tree.id">
              <RouterLink :to="treeTarget(tree)" @mousedown.prevent>
                {{ tree.title }}
                <small>{{ tree.nodeCount }} 节点</small>
              </RouterLink>
            </li>
          </ul>
        </li>
        <li v-if="suggestions.nodes.length">
          <span class="suggest-group">生命树节点</span>
          <ul>
            <li v-for="node in suggestions.nodes" :key="`${node.treeUid}:${node.nodeId}`">
              <RouterLink :to="nodeTarget(node)" @mousedown.prevent>
                {{ node.nodeText }}
                <small>{{ node.treeTitle }}</small>
              </RouterLink>
            </li>
          </ul>
        </li>
      </ul>
      <p v-else-if="suggestOpen && suggesting" class="suggest-state">正在搜索词条...</p>
    </div>
  </main>
</template>

<style scoped>
.wiki-home { display: grid; min-height: calc(100vh - 65px); place-items: center; background: #fff; }
.search-area { position: relative; width: min(680px, calc(100% - 40px)); }
.search-form input { box-sizing: border-box; width: 100%; height: 56px; padding: 0 20px; border: 1px solid #cfd4dc; border-radius: 4px; outline: 0; background: #fff; color: #111827; font: 16px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", sans-serif; }
.search-form input:focus { border-color: #111827; box-shadow: 0 0 0 3px #e5e7eb; }
.search-form input::placeholder { color: #9ca3af; }
.suggest-panel { position: absolute; z-index: 30; top: calc(100% + 6px); left: 0; right: 0; margin: 0; padding: 6px 0; list-style: none; border: 1px solid #dfe3e8; border-radius: 8px; background: #fff; box-shadow: 0 12px 34px rgba(17, 24, 39, 0.14); }
.suggest-panel > li + li { border-top: 1px solid #eef0f3; }
.suggest-group { display: block; padding: 8px 16px 2px; color: #9ca3af; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; }
.suggest-panel ul { margin: 0; padding: 0; list-style: none; }
.suggest-panel ul a { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 9px 16px; color: #111827; font-size: 14px; text-decoration: none; }
.suggest-panel ul a:hover { background: #f5f7fa; color: #3366cc; }
.suggest-panel small { flex: none; max-width: 45%; overflow: hidden; color: #9ca3af; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.suggest-state { position: absolute; z-index: 30; top: calc(100% + 6px); left: 0; right: 0; margin: 0; padding: 12px 16px; border: 1px solid #dfe3e8; border-radius: 8px; background: #fff; color: #9ca3af; font-size: 13px; box-shadow: 0 12px 34px rgba(17, 24, 39, 0.14); }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
</style>
