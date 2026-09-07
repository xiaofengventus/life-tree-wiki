<script setup>
/**
 * Columns 专栏页 - 导航栏 "专栏" 入口。
 * 按类型（全部 / 新闻 / 科普 / 未分类）浏览专栏文章，每页 8 条分页加载。
 * 文章的讨论区在阅读页（/wiki/:title）内以悬浮按钮 + 侧栏卡片打开。
 */
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import navBar from "@/components/navBar.vue";
import { fetchPostPage } from "@/services/posts";
import { formatDateTime } from "@/utils/date";

const TYPE_TABS = [
  { value: "", label: "全部" },
  { value: "news", label: "新闻" },
  { value: "science", label: "科普" },
  { value: "none", label: "未分类" },
];

const TYPE_LABELS = { news: "新闻", science: "科普" };

const route = useRoute();
const router = useRouter();

const activeType = ref("");
const posts = ref([]);
const nextCursor = ref(null);
const loading = ref(true);
const loadingMore = ref(false);
const errorMessage = ref("");

function typeFromRoute() {
  const value = String(route.query.type || "");
  return TYPE_TABS.some((tab) => tab.value === value) ? value : "";
}

// "全部" 不传 type；"未分类" 传空串；其余传具体类型
function typeParam() {
  if (activeType.value === "") return undefined;
  if (activeType.value === "none") return "";
  return activeType.value;
}

async function loadPage() {
  loading.value = true;
  errorMessage.value = "";
  posts.value = [];
  nextCursor.value = null;
  try {
    const payload = await fetchPostPage({ limit: 8, type: typeParam() });
    posts.value = payload.posts;
    nextCursor.value = payload.nextCursor;
  } catch (error) {
    errorMessage.value = error.message || "专栏加载失败";
  } finally {
    loading.value = false;
  }
}

async function loadMore() {
  if (!nextCursor.value || loadingMore.value) return;
  loadingMore.value = true;
  try {
    const payload = await fetchPostPage({
      limit: 8,
      cursor: nextCursor.value,
      type: typeParam(),
    });
    posts.value = [...posts.value, ...payload.posts];
    nextCursor.value = payload.nextCursor;
  } catch (error) {
    errorMessage.value = error.message || "加载更多失败";
  } finally {
    loadingMore.value = false;
  }
}

function chooseType(value) {
  if (value === activeType.value) return;
  router.replace({ path: "/columns", query: value ? { type: value } : {} });
}

watch(
  () => route.query.type,
  () => {
    activeType.value = typeFromRoute();
    loadPage();
  },
  { immediate: true },
);
</script>

<template>
  <navBar />
  <main class="columns-page">
    <header class="columns-heading">
      <h1>专栏</h1>
      <nav class="type-tabs" aria-label="文章类型筛选">
        <button
          v-for="tab in TYPE_TABS"
          :key="tab.value || 'all'"
          type="button"
          :class="{ active: activeType === tab.value }"
          @click="chooseType(tab.value)"
        >
          {{ tab.label }}
        </button>
      </nav>
    </header>

    <p v-if="loading" class="state">正在加载专栏...</p>
    <p v-else-if="errorMessage" class="state error">{{ errorMessage }}</p>
    <p v-else-if="!posts.length" class="state">这个分类下还没有文章。</p>
    <template v-else>
      <article v-for="post in posts" :key="post.id" class="post-row">
        <img
          v-if="post.coverUrl"
          class="post-cover"
          :src="post.coverUrl"
          :alt="`${post.title}封面`"
          loading="lazy"
        />
        <div class="post-body">
          <div class="post-title-line">
            <span v-if="post.type" class="post-type" :class="`is-${post.type}`">
              {{ TYPE_LABELS[post.type] || "专栏" }}
            </span>
            <RouterLink
              class="post-title"
              :to="{ name: 'wiki-post', params: { title: post.title } }"
            >
              {{ post.title || "未命名文章" }}
            </RouterLink>
          </div>
          <p>{{ post.excerpt || "暂无摘要" }}</p>
          <small>
            {{ post.author || post.creator || "未署名" }}
            · {{ formatDateTime(post.updatedAt || post.submittedAt) }}
            <template v-if="post.tags?.length">· {{ post.tags.map((tag) => `#${tag}`).join(" ") }}</template>
          </small>
        </div>
      </article>

      <div v-if="nextCursor" class="load-more">
        <button type="button" :disabled="loadingMore" @click="loadMore">
          {{ loadingMore ? "正在加载..." : "加载更多" }}
        </button>
      </div>
    </template>
  </main>
</template>

<style scoped>
.columns-page { width: min(100% - 48px, 980px); min-height: calc(100vh - 65px); margin: 0 auto; padding: 42px 0 80px; background: #fff; }
.columns-heading { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 26px; border-bottom: 1px solid #a2a9b1; padding-bottom: 14px; }
.columns-heading h1 { margin: 0; color: #202122; font-family: Georgia, "Noto Serif SC", serif; font-size: 30px; font-weight: 400; }
.type-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.type-tabs button { padding: 7px 14px; border: 1px solid #c8ccd1; border-radius: 999px; background: #fff; color: #54595d; font: inherit; font-size: 13px; cursor: pointer; }
.type-tabs button:hover { border-color: #3366cc; color: #3366cc; }
.type-tabs button.active { border-color: #3366cc; background: #eaf3ff; color: #3366cc; font-weight: 700; }
.post-row { display: flex; gap: 18px; padding: 20px 0; border-bottom: 1px solid #e5e7eb; }
.post-cover { flex: none; width: 140px; height: 92px; border-radius: 8px; object-fit: cover; border: 1px solid #e5e7eb; }
.post-body { min-width: 0; }
.post-title-line { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.post-type { flex: none; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; }
.post-type.is-news { background: #fdeaea; color: #a13f39; }
.post-type.is-science { background: #e7f2ec; color: #2b6b57; }
.post-title { color: #111827; font-family: Georgia, "Noto Serif SC", serif; font-size: 20px; font-weight: 700; text-decoration: none; }
.post-title:hover { text-decoration: underline; }
.post-body p { margin: 8px 0; color: #6b7280; font-size: 14px; line-height: 1.65; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.post-body small { color: #9ca3af; font-size: 12px; }
.load-more { display: grid; place-items: center; padding: 26px 0 0; }
.load-more button { padding: 9px 26px; border: 1px solid #c8ccd1; border-radius: 999px; background: #fff; color: #3366cc; font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
.load-more button:hover { border-color: #3366cc; }
.load-more button:disabled { opacity: 0.6; cursor: default; }
.state { padding: 60px 0; color: #9ca3af; text-align: center; }
.state.error { color: #b42318; }
@media (max-width: 640px) { .columns-page { width: min(100% - 32px, 980px); padding-top: 26px; } .post-row { gap: 12px; } .post-cover { width: 100px; height: 72px; } }
</style>
