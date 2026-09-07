<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import navBar from "@/components/navBar.vue";
import { formatDateTime } from "@/utils/date";
import { platformTreeLabel } from "@/utils/treeLabels";
import { fetchPostList } from "@/services/posts";
import { fetchTreeList } from "@/services/trees";

const route = useRoute();
const router = useRouter();
const activeTab = ref("article");
const postSearchQuery = ref("");
const treeSearchQuery = ref("");
const posts = ref([]);
const trees = ref([]);
const postsLoaded = ref(false);
const treesLoaded = ref(false);
const postsLoading = ref(false);
const treesLoading = ref(false);
const postMessage = ref("");
const treeMessage = ref("");
const treeKind = ref("ALL");

const visiblePosts = computed(() => {
  const keyword = postSearchQuery.value.trim().toLowerCase();
  return [...posts.value]
    .sort((a, b) => Date.parse(b.updatedAt || b.submittedAt || "") - Date.parse(a.updatedAt || a.submittedAt || ""))
    .filter((post) => {
      if (!keyword) return true;
      return [post.title, post.author, post.creator, post.excerpt, ...(post.tags || [])]
        .filter(Boolean).join(" ").toLowerCase().includes(keyword);
    });
});
const visibleTrees = computed(() => {
  const keyword = treeSearchQuery.value.trim().toLowerCase();
  return [...trees.value]
    .sort((a, b) => Date.parse(b.updatedAt || "") - Date.parse(a.updatedAt || ""))
    .filter((tree) => {
      if (treeKind.value === "ALL") return true;
      if (treeKind.value === "OFFICIAL") return tree.platformRecommended;
      return !tree.platformRecommended;
    })
    .filter((tree) => !keyword || [
      tree.title,
      tree.description,
      tree.creator,
      tree.license,
      ...(tree.tags || []),
    ].filter(Boolean).join(" ").toLowerCase().includes(keyword));
});
const activeSearchQuery = computed({
  get: () => activeTab.value === "tree"
    ? treeSearchQuery.value
    : postSearchQuery.value,
  set: (value) => {
    if (activeTab.value === "tree") treeSearchQuery.value = value;
    else postSearchQuery.value = value;
  },
});
const activeLoading = computed(() =>
  activeTab.value === "tree" ? treesLoading.value : postsLoading.value);
const activeMessage = computed(() =>
  activeTab.value === "tree" ? treeMessage.value : postMessage.value);
const activeSearchPlaceholder = computed(() =>
  activeTab.value === "tree" ? "搜索进化树" : "搜索研究文章");

async function loadPosts() {
  if (postsLoading.value || postsLoaded.value) return;
  postsLoading.value = true;
  postMessage.value = "";
  try {
    const payload = await fetchPostList();
    posts.value = payload.posts || [];
    postsLoaded.value = true;
  } catch (error) {
    posts.value = [];
    postMessage.value = error.message || "文章列表加载失败";
  } finally {
    postsLoading.value = false;
  }
}

async function loadTrees() {
  if (treesLoading.value || treesLoaded.value) return;
  treesLoading.value = true;
  treeMessage.value = "";
  try {
    trees.value = await fetchTreeList("ALL");
    treesLoaded.value = true;
  } catch (error) {
    trees.value = [];
    treeMessage.value = error.message || "进化树列表加载失败";
  } finally {
    treesLoading.value = false;
  }
}

function normalizedTab(value) {
  return value === "tree" ? "tree" : "article";
}

function normalizedTreeKind(value) {
  if (String(value).toLowerCase() === "official") return "OFFICIAL";
  if (String(value).toLowerCase() === "user") return "USER";
  return "ALL";
}

async function selectTreeKind(kind) {
  await router.replace({
    query: {
      ...route.query,
      type: "tree",
      kind: kind === "ALL" ? undefined : kind.toLowerCase(),
    },
  });
}

function loadActiveTab() {
  return activeTab.value === "tree" ? loadTrees() : loadPosts();
}

async function activateTab(tab) {
  const nextTab = normalizedTab(tab);
  if (nextTab === activeTab.value) {
    await loadActiveTab();
    return;
  }
  await router.replace({
    query: {
      ...route.query,
      type: nextTab,
    },
  });
}

watch(
  () => route.query.q,
  (value) => {
    const keyword = String(value || "");
    postSearchQuery.value = keyword;
    treeSearchQuery.value = keyword;
  },
  { immediate: true },
);

watch(
  () => route.query.type,
  (value) => {
    const nextTab = normalizedTab(value);
    activeTab.value = nextTab;
    if (value !== nextTab) {
      void router.replace({
        query: {
          ...route.query,
          type: nextTab,
        },
      });
    }
    void loadActiveTab();
  },
  { immediate: true },
);

watch(
  () => route.query.kind,
  (value) => {
    treeKind.value = normalizedTreeKind(value);
  },
  { immediate: true },
);
</script>

<template>
  <navBar />
  <main class="research-page">
    <section class="research-header">
      <h1>{{ route.query.q ? `搜索：${route.query.q}` : "知识库" }}</h1>
      <nav class="research-tabs" role="tablist" aria-label="Research 内容类型">
        <button
          id="research-article-tab"
          type="button"
          role="tab"
          :aria-selected="activeTab === 'article'"
          aria-controls="research-article-panel"
          :class="{ active: activeTab === 'article' }"
          @click="activateTab('article')"
        >
          研究文章
          <span>{{ postsLoaded ? visiblePosts.length : "—" }}</span>
        </button>
        <button
          id="research-tree-tab"
          type="button"
          role="tab"
          :aria-selected="activeTab === 'tree'"
          aria-controls="research-tree-panel"
          :class="{ active: activeTab === 'tree' }"
          @click="activateTab('tree')"
        >
          进化树
          <span>{{ treesLoaded ? visibleTrees.length : "—" }}</span>
        </button>
      </nav>
      <div class="research-actions">
        <input
          v-model="activeSearchQuery"
          class="research-search"
          type="search"
          :placeholder="activeSearchPlaceholder"
        />
        <RouterLink v-if="activeTab === 'article'" to="/create-post">创建文章</RouterLink>
        <RouterLink v-else to="/evolution-tree">制作并投稿进化树</RouterLink>
      </div>
      <p v-if="activeMessage" class="refresh-message">{{ activeMessage }}</p>
    </section>
    <section
      v-if="activeTab === 'tree'"
      id="research-tree-panel"
      class="tree-list"
      role="tabpanel"
      aria-labelledby="research-tree-tab"
    >
      <div class="section-title">
        <h2>进化树</h2>
        <span>{{ visibleTrees.length }} 棵</span>
      </div>
      <nav class="tree-kind-filter" aria-label="进化树类型筛选">
        <button
          v-for="option in [
            { value: 'ALL', label: '全部' },
            { value: 'OFFICIAL', label: '平台树' },
            { value: 'USER', label: '其他用户树' },
          ]"
          :key="option.value"
          type="button"
          :class="{ active: treeKind === option.value }"
          :aria-pressed="treeKind === option.value"
          @click="selectTreeKind(option.value)"
        >
          {{ option.label }}
        </button>
      </nav>
      <p v-if="activeLoading" class="loading-state">正在加载进化树……</p>
      <div class="tree-card-grid">
        <article v-for="tree in visibleTrees" :key="tree.id" class="tree-card">
          <div class="tree-card-mark">TREE</div>
          <div>
            <div class="tree-card-heading">
              <h3><RouterLink :to="`/life-tree/${tree.uid || tree.id}`">{{ tree.title }}</RouterLink></h3>
              <span v-if="platformTreeLabel(tree)" class="official-tree-badge">
                {{ platformTreeLabel(tree) }}
              </span>
            </div>
            <p>{{ tree.description || "作者暂未填写简介" }}</p>
            <div class="tree-meta">
              <span>{{ tree.uid }}</span>
              <span>作者：<RouterLink :to="`/users/${tree.creatorUid}`">{{ tree.creator }}</RouterLink></span>
              <span>节点：{{ tree.nodeCount }}</span>
              <span>{{ tree.license }}</span>
              <time :datetime="tree.updatedAt">{{ formatDateTime(tree.updatedAt) }}</time>
            </div>
          </div>
        </article>
      </div>
      <p v-if="!activeLoading && treesLoaded && !visibleTrees.length" class="empty-posts">
        {{ treeSearchQuery.trim() ? "没有符合搜索条件的进化树。" : "当前筛选下暂无进化树。" }}
      </p>
    </section>
    <section
      v-else
      id="research-article-panel"
      class="post-list"
      role="tabpanel"
      aria-labelledby="research-article-tab"
    >
      <div class="section-title"><h2>研究文章</h2><span>{{ visiblePosts.length }} 篇</span></div>
      <p v-if="activeLoading" class="loading-state">正在从服务器加载文章……</p>
      <article v-for="post in visiblePosts" :key="post.id" class="post-card">
        <div class="post-cover">
          <img v-if="post.coverUrl" :src="post.coverUrl" :alt="`${post.title}封面`" loading="lazy" />
          <span v-else>文章</span>
        </div>
        <div class="post-information">
          <div class="post-heading">
            <h2><RouterLink :to="`/view-post/${post.uid || post.id}`">{{ post.title || "未命名帖子" }}</RouterLink></h2>
            <span>{{ post.uid }} · 作者：<RouterLink :to="`/users/${post.creatorUid}`">{{ post.author || post.creator || "未署名作者" }}</RouterLink></span>
          </div>
          <p class="post-excerpt">{{ post.excerpt || "暂无文章摘要" }}</p>
          <div class="post-meta">
            <time :datetime="post.updatedAt || post.submittedAt">最新提交：{{ formatDateTime(post.updatedAt || post.submittedAt) }}</time>
            <span v-if="post.tags?.length">标签：{{ post.tags.join("、") }}</span>
          </div>
        </div>
      </article>
      <p v-if="!activeLoading && postsLoaded && !visiblePosts.length" class="empty-posts">
        {{ postSearchQuery.trim() ? "没有符合搜索条件的研究文章。" : "暂无文章，登录后可以创建第一篇研究文章。" }}
      </p>
    </section>
  </main>
</template>

<style scoped>
.research-page { min-height: calc(100vh - 65px); padding: 42px 20px 60px; background: #fff; }
.research-header,.tree-list,.post-list { width: min(100%,1180px); margin: 0 auto; }
.research-header { margin-bottom: 22px; }
.research-header h1 { margin: 0 0 18px; color: #1e293b; font-size: 2rem; }
.research-tabs { display:flex; width:fit-content; max-width:100%; gap:4px; margin-bottom:16px; padding:4px; overflow-x:auto; border:1px solid #cbd5e1; border-radius:10px; background:#eef2f6; scrollbar-width:none; }
.research-tabs::-webkit-scrollbar { display:none; }
.research-tabs button { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-width:150px; padding:10px 16px; border:0; border-radius:7px; background:transparent; color:#536274; font:inherit; font-size:.92rem; font-weight:750; white-space:nowrap; cursor:pointer; }
.research-tabs button span { min-width:24px; padding:2px 7px; border-radius:999px; background:#dce4eb; color:#64748b; font-size:.74rem; }
.research-tabs button.active { background:#fff; color:#176b43; box-shadow:0 1px 5px rgba(15,23,42,.12); }
.research-tabs button.active span { background:#e3f2e9; color:#176b43; }
.research-tabs button:focus-visible { outline:3px solid rgba(37,99,235,.25); outline-offset:2px; }
.research-search { width: min(100%,600px); padding: 12px 16px; border: 1px solid #cbd5e1; border-radius: 7px; font: inherit; }
.research-actions { display:flex; flex-wrap:wrap; align-items:center; gap:10px; }
.research-actions a { padding:10px 14px; border-radius:7px; background:#176b43; color:#fff; text-decoration:none; font-size:.9rem; }
.refresh-message { color: #92400e; }
.tree-list { margin-bottom:0; }
.section-title { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; color:#334155; }
.section-title h2 { margin:0; }
.section-title span { color:#64748b; font-size:.9rem; }
.tree-kind-filter{display:flex;flex-wrap:wrap;gap:7px;margin:-2px 0 16px}.tree-kind-filter button{padding:7px 12px;border:1px solid #cbd5e1;border-radius:999px;background:#fff;color:#64748b;font:inherit;font-size:.8rem;font-weight:700;cursor:pointer}.tree-kind-filter button.active{border-color:#315f9c;background:#edf5ff;color:#315f9c}
.tree-card-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
.tree-card { display:grid; grid-template-columns:74px minmax(0,1fr); gap:16px; min-height:150px; padding:20px; border:1px solid #cbd5e1; border-radius:10px; background:#fff; }
.tree-card-mark { display:grid; height:74px; place-items:center; border-radius:50%; background:#e6f0e9; color:#176b43; font-size:.75rem; font-weight:800; letter-spacing:.1em; }
.tree-card-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px}.tree-card h3 { margin:0; }
.tree-card h3 a { color:#2563eb; text-decoration:none; }
.tree-card h3 a:hover { color:#1d4ed8; text-decoration:underline; }
.official-tree-badge{flex:0 0 auto;padding:4px 8px;border-radius:999px;background:#e5f0ff;color:#315f9c;font-size:.68rem;font-weight:800;letter-spacing:.03em}
.tree-card p { min-height:44px; margin:0 0 12px; color:#475569; line-height:1.6; }
.tree-meta { display:flex; flex-wrap:wrap; gap:6px 14px; color:#64748b; font-size:.8rem; }
.post-list { display: flex; flex-direction: column; gap: 28px; }
.post-card { display: grid; grid-template-columns: minmax(220px,35%) minmax(0,1fr); min-height: 220px; overflow: hidden; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; }
.post-cover { display: grid; place-items: center; overflow:hidden; background: #e2e8f0; color: #64748b; font-size: 1.2rem; }
.post-cover img{width:100%;height:100%;object-fit:cover;transition:transform .25s}.post-card:hover .post-cover img{transform:scale(1.025)}
.post-information { display: flex; flex-direction: column; min-width: 0; padding: 32px; }
.post-heading { display: flex; justify-content: space-between; gap: 16px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; }
.post-heading h2 { margin: 0; font-size: 1.35rem; overflow-wrap: anywhere; }
.post-heading a { color: #2563eb; text-decoration: none; }
.post-heading a:hover { color: #2563eb; text-decoration: underline; }
.post-heading span,.post-meta { color: #64748b; font-size: .9rem; }
.post-excerpt { margin: 28px 0; color: #475569; line-height: 1.8; }
.post-meta { display: flex; flex-wrap: wrap; gap: 12px 24px; margin-top: auto; }
.empty-posts { margin: 40px 0; color: #64748b; text-align: center; }
.loading-state { margin:36px 0; color:#64748b; text-align:center; }
@media (max-width:720px) { .research-page{padding:76px 12px 40px}.research-tabs{position:sticky;z-index:4;top:64px;width:100%;box-sizing:border-box}.research-tabs button{min-width:calc(50% - 2px);padding:9px 11px}.research-actions{align-items:stretch}.research-search{width:100%}.research-actions a{flex:1;text-align:center}.tree-card-grid{grid-template-columns:1fr}.tree-card{grid-template-columns:56px minmax(0,1fr);padding:16px}.tree-card-mark{height:56px}.post-card{grid-template-columns:1fr}.post-cover{min-height:120px}.post-information{padding:22px}.post-heading{flex-direction:column} }
</style>
