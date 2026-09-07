<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import navBar from "@/components/navBar.vue";
import { searchKnowledge } from "@/services/search";

const route = useRoute();
const router = useRouter();
const query = ref("");
const results = ref({ posts: [], trees: [], nodes: [] });
const loading = ref(false);
const errorMessage = ref("");

// 搜索栏下方的词条联想
const suggestions = ref({ posts: [], trees: [], nodes: [] });
const suggestOpen = ref(false);
const suggesting = ref(false);
let suggestTimer = 0;
let suggestRequestId = 0;

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
    const requestId = ++suggestRequestId;
    try {
      const payload = await searchKnowledge(keyword, 3);
      if (requestId !== suggestRequestId) return;
      suggestions.value = payload;
      suggestOpen.value = true;
    } catch {
      if (requestId === suggestRequestId) {
        suggestions.value = { posts: [], trees: [], nodes: [] };
        suggestOpen.value = false;
      }
    } finally {
      if (requestId === suggestRequestId) suggesting.value = false;
    }
  }, 250);
});

async function runSearch(keyword) {
  if (!keyword) {
    results.value = { posts: [], trees: [], nodes: [] };
    return;
  }
  loading.value = true;
  errorMessage.value = "";
  try {
    results.value = await searchKnowledge(keyword, 20);
  } catch (error) {
    results.value = { posts: [], trees: [], nodes: [] };
    errorMessage.value = error.message || "搜索失败";
  } finally {
    loading.value = false;
  }
}

function submitSearch() {
  const keyword = query.value.trim();
  suggestOpen.value = false;
  router.replace({ path: "/search", query: keyword ? { q: keyword } : {} });
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

watch(
  () => route.query.q,
  (value) => {
    query.value = String(value || "");
    runSearch(query.value.trim());
  },
  { immediate: true },
);

onBeforeUnmount(() => window.clearTimeout(suggestTimer));
</script>

<template>
  <navBar />
  <main class="search-page">
    <div class="search-area">
      <form class="search-form" role="search" @submit.prevent="submitSearch">
        <label class="sr-only" for="search-page-input">搜索知识库</label>
        <input
          id="search-page-input"
          v-model="query"
          type="search"
          placeholder="搜索文章、树与生命树节点"
          autocomplete="off"
          @focus="hasSuggestions && (suggestOpen = true)"
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
                <small>{{ typeLabel(post.type) || (post.tags?.length ? `#${post.tags[0]}` : "") }}</small>
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
    </div>

    <p v-if="!query.trim()" class="state">输入关键词搜索文章、树与生命树节点。</p>
    <p v-else-if="loading" class="state">正在搜索「{{ query.trim() }}」...</p>
    <p v-else-if="errorMessage" class="state error">{{ errorMessage }}</p>
    <template v-else>
      <section class="result-group" aria-label="文章">
        <h1>文章 <small>{{ results.posts.length }}</small></h1>
        <article v-for="post in results.posts" :key="post.id" class="result-row">
          <RouterLink :to="{ name: 'wiki-post', params: { title: post.title } }">{{ post.title || "未命名文章" }}</RouterLink>
          <p>{{ post.excerpt || "暂无摘要" }}</p>
          <small v-if="post.tags?.length">{{ post.tags.map((tag) => `#${tag}`).join(" ") }}</small>
        </article>
        <p v-if="!results.posts.length" class="empty">没有匹配的文章。</p>
      </section>

      <section class="result-group" aria-label="树">
        <h1>树 <small>{{ results.trees.length }}</small></h1>
        <article v-for="tree in results.trees" :key="tree.id" class="result-row">
          <RouterLink :to="`/life-tree/${tree.uid || tree.id}`">{{ tree.title || "未命名树" }}</RouterLink>
          <p>{{ tree.description || "暂无说明" }}</p>
          <small v-if="tree.tags?.length">{{ tree.tags.map((tag) => `#${tag}`).join(" ") }}</small>
        </article>
        <p v-if="!results.trees.length" class="empty">没有匹配的树。</p>
      </section>

      <section class="result-group" aria-label="生命树节点">
        <h1>生命树节点 <small>{{ results.nodes.length }}</small></h1>
        <article v-for="node in results.nodes" :key="`${node.treeUid}:${node.nodeId}`" class="result-row">
          <RouterLink :to="`/life-tree/${node.treeUid}?node=${encodeURIComponent(node.nodeId)}`">
            {{ node.nodeText }}
          </RouterLink>
          <p>
            位于「{{ node.treeTitle }}」
            <template v-if="node.path?.length">
              · 路径：{{ node.path.join(" → ") }}
            </template>
          </p>
        </article>
        <p v-if="!results.nodes.length" class="empty">没有匹配的生命树节点。</p>
      </section>
    </template>
  </main>
</template>

<style scoped>
.search-page { width: min(100% - 48px, 920px); min-height: calc(100vh - 65px); margin: 0 auto; padding: 42px 0 80px; background: #fff; }
.search-area { position: relative; margin-bottom: 42px; }
.search-form input { box-sizing: border-box; width: 100%; height: 50px; padding: 0 16px; border: 1px solid #cfd4dc; border-radius: 4px; outline: 0; color: #111827; font: inherit; }
.search-form input:focus { border-color: #111827; box-shadow: 0 0 0 3px #e5e7eb; }
.suggest-panel { position: absolute; z-index: 30; top: calc(100% + 6px); left: 0; right: 0; margin: 0; padding: 6px 0; list-style: none; border: 1px solid #dfe3e8; border-radius: 8px; background: #fff; box-shadow: 0 12px 34px rgba(17, 24, 39, 0.14); }
.suggest-panel > li + li { border-top: 1px solid #eef0f3; }
.suggest-group { display: block; padding: 8px 16px 2px; color: #9ca3af; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; }
.suggest-panel ul { margin: 0; padding: 0; list-style: none; }
.suggest-panel ul a { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 9px 16px; color: #111827; font-size: 14px; text-decoration: none; }
.suggest-panel ul a:hover { background: #f5f7fa; color: #3366cc; }
.suggest-panel small { flex: none; max-width: 45%; overflow: hidden; color: #9ca3af; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.result-group + .result-group { margin-top: 50px; }
.result-group h1 { margin: 0; padding-bottom: 12px; border-bottom: 1px solid #111827; color: #111827; font-family: Georgia, "Noto Serif SC", serif; font-size: 20px; }
.result-group h1 small { color: #9ca3af; font-family: inherit; font-size: 13px; }
.result-row { padding: 20px 0; border-bottom: 1px solid #e5e7eb; }
.result-row > a { color: #111827; font-family: Georgia, "Noto Serif SC", serif; font-size: 18px; font-weight: 700; text-decoration: none; }
.result-row > a:hover { text-decoration: underline; }
.result-row p { margin: 8px 0 0; color: #6b7280; font-size: 14px; line-height: 1.65; }
.result-row small { display: block; margin-top: 6px; color: #3366cc; font-size: 12px; }
.empty, .state { color: #9ca3af; font-size: 13px; }
.state { padding: 50px 0; text-align: center; }
.state.error { color: #b42318; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
@media (max-width: 640px) { .search-page { width: min(100% - 32px, 920px); padding-top: 26px; } }
</style>
