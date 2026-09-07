<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import navBar from "@/components/navBar.vue";
import ContentSourcesDisplay from "@/components/ContentSourcesDisplay.vue";
import ResearchTreeEmbed from "@/components/ResearchTreeEmbed.vue";
import PostClassificationCard from "@/components/PostClassificationCard.vue";
import ContentInteractions from "@/components/ContentInteractions.vue";
import { deletePost, fetchPost, fetchPostByTitle } from "@/services/posts";
import { parsePostBlocks } from "@/utils/postBlocks";
import { normalizePostCard } from "@/utils/wangEditorPostCard";
import { formatDateTime } from "@/utils/date";
import { useUserStore } from "@/stores/user";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const post = ref(null);
const loading = ref(true);
const errorMessage = ref("");
const deleting = ref(false);

// 讨论区：右下角圆形悬浮按钮打开的侧栏小卡片（与 life-tree.vue 同款）
const commentsPanelOpen = ref(false);

// 作者本人可编辑；作者或站点所有者可删除（与 view_post 的判定一致）
const isCreator = computed(() => {
  if (!post.value || !userStore.user) return false;
  if (post.value.creatorUid && userStore.user.uid) {
    return post.value.creatorUid === userStore.user.uid;
  }
  return post.value.creator === userStore.user.name;
});
const canDelete = computed(() => isCreator.value || userStore.isSiteOwner);

function updatePost() {
  if (!isCreator.value || !post.value) return;
  router.push(`/create-post?edit=${encodeURIComponent(post.value.id)}`);
}

async function removePost() {
  if (!canDelete.value || !post.value || deleting.value) return;
  const confirmed = window.confirm(
    `确定删除文章“${post.value.title}”吗？\n\n文章 UID ${post.value.uid || ""} 会永久保留，删除后仅站点所有者可见。`,
  );
  if (!confirmed) return;
  deleting.value = true;
  try {
    await deletePost(post.value.id);
    await router.push("/columns");
  } catch (error) {
    window.alert(`删除文章失败：${error.message || "未知错误"}`);
  } finally {
    deleting.value = false;
  }
}

const sourceBlocks = computed(() => parsePostBlocks(post.value?.content || "", {
  citations: post.value?.citations || [],
}));

const article = computed(() => {
  let sectionIndex = 0;
  const outline = [];
  const blocks = sourceBlocks.value.map((block) => {
    if (block.type !== "html" || typeof DOMParser === "undefined") return block;
    const parsed = new DOMParser().parseFromString(`<body>${block.html}</body>`, "text/html");
    parsed.body.querySelectorAll("h1, h2, h3").forEach((heading) => {
      const text = heading.textContent?.trim();
      if (!text) return;
      const id = `section-${sectionIndex}`;
      sectionIndex += 1;
      heading.id = id;
      outline.push({ id, text, level: Number(heading.tagName.slice(1)) });
    });
    return { ...block, html: parsed.body.innerHTML };
  });
  return { blocks, outline };
});

const cardsById = computed(() => Object.fromEntries(
  (post.value?.classificationCards || []).map((card) => [card.id, card]),
));

const POST_TYPE_LABELS = { news: "新闻", science: "科普" };
const typeLabel = computed(() => POST_TYPE_LABELS[post.value?.type] || "未分类");

function cardFor(block) {
  const stored = cardsById.value[block.id];
  if (stored) return stored;
  if (!block.config) return null;
  try {
    return normalizePostCard({ ...JSON.parse(decodeURIComponent(block.config)), id: block.id });
  } catch {
    // config 损坏时仍渲染基础卡片结构，避免整卡消失
    return normalizePostCard({ id: block.id, title: "卡片内容无法解析" });
  }
}

async function loadPost() {
  loading.value = true;
  errorMessage.value = "";
  post.value = null;
  commentsPanelOpen.value = false;
  try {
    post.value = route.name === "wiki-post"
      ? await fetchPostByTitle(route.params.title)
      : await fetchPost(route.params.id);
  } catch (error) {
    errorMessage.value = error.message || "文章加载失败";
  } finally {
    loading.value = false;
  }
}

// 只关注路由参数：点击页内锚点（#section-3 / #post-citation-1）只改变 hash，
// 不应触发文章重新加载（否则滚动位置被重置，表现为"跳转失灵要点多次"）
watch(
  () => [route.name, route.params.title, route.params.id],
  loadPost,
  { immediate: true },
);

// 页内锚点统一平滑滚动（目录、正文引用标记、参考文献回链），
// 不走 vue-router 导航，也就不会触发任何请求
function handleAnchorClick(event) {
  const anchor = event.target.closest?.('a[href^="#"]');
  if (!anchor) return;
  const sectionId = anchor.getAttribute("href").slice(1);
  if (!sectionId) return;
  const target = document.getElementById(sectionId);
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  const hash = `#${sectionId}`;
  if (window.location.hash !== hash) {
    history.replaceState(history.state, "", hash);
  }
}
</script>

<template>
  <navBar />
  <main class="article-page" @click="handleAnchorClick">
    <p v-if="loading" class="state">正在加载文章...</p>
    <p v-else-if="errorMessage" class="state error">{{ errorMessage }}</p>
    <div v-else-if="post" class="article-layout">
      <aside class="outline" aria-label="目录">
        <strong>目录</strong>
        <a
          v-for="item in article.outline"
          :key="item.id"
          :class="`level-${item.level}`"
          :href="`#${item.id}`"
        >
          {{ item.text }}
        </a>
      </aside>

      <article class="article-paper">
        <header class="article-header">
          <h1>{{ post.title || "未命名文章" }}</h1>
          <div class="article-tabs">
            <span>条目</span><span>阅读</span>
            <template v-if="isCreator || canDelete">
              <span class="tabs-separator" aria-hidden="true">|</span>
              <button v-if="isCreator" type="button" class="tab-action" @click="updatePost">编辑</button>
              <button
                v-if="canDelete"
                type="button"
                class="tab-action danger"
                :disabled="deleting"
                @click="removePost"
              >
                {{ deleting ? "删除中…" : "删除" }}
              </button>
            </template>
          </div>
          <p>{{ post.author || post.creator || "未署名" }} · {{ formatDateTime(post.updatedAt || post.submittedAt) }}</p>
        </header>

        <section class="article-content">
          <template v-for="(block, index) in article.blocks" :key="`${block.type}-${block.id || index}`">
            <div v-if="block.type === 'html'" v-html="block.html"></div>
            <ResearchTreeEmbed v-else-if="block.type === 'tree'" :tree-id="block.id" :fallback-title="block.title" />
            <PostClassificationCard v-else-if="block.type === 'card' && cardFor(block)" :card="cardFor(block)" />
          </template>
        </section>
        <ContentSourcesDisplay :citations="post.citations" />
      </article>

      <aside class="infobox" aria-label="文章信息">
        <div class="infobox-heading">{{ post.title || "文章" }}</div>
        <img v-if="post.coverUrl" :src="post.coverUrl" :alt="post.title" />
        <dl>
          <div><dt>类型</dt><dd>{{ typeLabel }}</dd></div>
          <div><dt>作者</dt><dd>{{ post.author || post.creator || "未署名" }}</dd></div>
          <div><dt>发布时间</dt><dd>{{ formatDateTime(post.submittedAt) }}</dd></div>
          <div v-if="post.tags?.length"><dt>标签</dt><dd>{{ post.tags.join("、") }}</dd></div>
          <div><dt>许可</dt><dd>{{ post.license || "未说明" }}</dd></div>
        </dl>
      </aside>
    </div>
    <p v-else class="state">文章不存在。</p>

    <!-- 讨论区：右下角圆形悬浮按钮 + 侧栏小卡片（与 life-tree.vue 同款） -->
    <template v-if="post">
      <div class="float-actions">
        <button
          type="button"
          class="float-button"
          :class="{ active: commentsPanelOpen }"
          aria-label="讨论区"
          title="讨论区"
          @click="commentsPanelOpen = !commentsPanelOpen"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              d="M4 4h16a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 20 17h-9.6L6 20.7a.9.9 0 0 1-1.5-.7V17H4a1.5 1.5 0 0 1-1.5-1.5v-10A1.5 1.5 0 0 1 4 4z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <transition name="panel-slide">
        <aside v-if="commentsPanelOpen" class="comments-side-panel" aria-label="文章讨论区">
          <header class="panel-heading">
            <div>
              <span>DISCUSSION</span>
              <strong>{{ post.title || "未命名文章" }}</strong>
            </div>
            <button type="button" aria-label="关闭讨论区" @click="commentsPanelOpen = false">关闭</button>
          </header>
          <div class="panel-body comments-body">
            <ContentInteractions :content-id="post.uid || post.id" type="post" />
          </div>
        </aside>
      </transition>
    </template>
  </main>
</template>

<style scoped>
.article-page { min-height: calc(100vh - 65px); padding: 42px 32px 90px; background: #fff; }
.article-layout { display: grid; width: min(100%, 1400px); margin: 0 auto; grid-template-columns: 180px minmax(0, 780px) 250px; gap: 34px; align-items: start; }
.outline { position: sticky; top: 86px; display: grid; gap: 7px; padding-top: 12px; border-top: 1px solid #a2a9b1; }
.outline strong { margin-bottom: 7px; color: #202122; font-size: 14px; }
.outline a { color: #3366cc; font-size: 13px; line-height: 1.4; text-decoration: none; }
.outline a:hover { text-decoration: underline; }
.outline .level-2 { padding-left: 12px; }.outline .level-3 { padding-left: 24px; }
.article-paper { min-width: 0; color: #202122; }
.article-header { border-bottom: 1px solid #a2a9b1; }
.article-header h1 { margin: 0; color: #202122; font-family: Georgia, "Noto Serif SC", "Songti SC", serif; font-size: clamp(30px, 4vw, 42px); font-weight: 400; line-height: 1.25; }
.article-tabs { display: flex; gap: 18px; margin-top: 15px; padding-bottom: 8px; border-bottom: 1px solid #eaecf0; color: #3366cc; font-size: 14px; }.article-tabs span:first-child { color: #202122; font-weight: 700; }
.article-tabs .tabs-separator { color: #c8ccd1; font-weight: 400; }
.tab-action { padding: 0; border: 0; background: none; color: #3366cc; font: inherit; font-size: 14px; cursor: pointer; }
.tab-action:hover { text-decoration: underline; }
.tab-action.danger { color: #b32424; }
.tab-action:disabled { color: #9ca3af; cursor: default; text-decoration: none; }
.article-header p { margin: 13px 0; color: #54595d; font-size: 13px; }
.article-content { padding-top: 20px; font-family: Georgia, "Noto Serif SC", "Songti SC", serif; font-size: 16px; line-height: 1.9; overflow-wrap: anywhere; }
.article-content :deep([id^="section-"]) { scroll-margin-top: 84px; }
.article-content :deep(h1), .article-content :deep(h2), .article-content :deep(h3) { margin: 1.8em 0 .7em; padding-bottom: .25em; border-bottom: 1px solid #eaecf0; color: #202122; font-family: Georgia, "Noto Serif SC", serif; font-weight: 400; line-height: 1.35; }
.article-content :deep(h2) { font-size: 28px; }.article-content :deep(h3) { font-size: 22px; }
.article-content :deep(p), .article-content :deep(ul), .article-content :deep(ol) { margin: 0 0 1.2em; }
.article-content :deep(a) { color: #3366cc; }.article-content :deep(a:hover) { text-decoration: underline; }
.article-content :deep(img) { display: block; max-width: 100%; height: auto; margin: 24px auto; }
/* blockquote / pre / 代码高亮 / 待办事项样式统一走全局 rich-content.css（与编辑器一致） */
.article-content :deep(table) { max-width: 100%; border-collapse: collapse; }.article-content :deep(th), .article-content :deep(td) { padding: 8px; border: 1px solid #a2a9b1; }
.infobox { border: 1px solid #a2a9b1; background: #f8f9fa; font-size: 13px; line-height: 1.55; }.infobox-heading { padding: 8px; background: #eaecf0; color: #202122; font-weight: 700; text-align: center; }.infobox img { display: block; width: calc(100% - 20px); max-height: 210px; margin: 10px; object-fit: cover; }.infobox dl { margin: 0; padding: 0 10px 12px; }.infobox dl div { display: grid; grid-template-columns: 68px minmax(0, 1fr); gap: 8px; padding: 6px 0; border-top: 1px solid #eaecf0; }.infobox dt { font-weight: 700; }.infobox dd { margin: 0; color: #3366cc; overflow-wrap: anywhere; }
.state { display: grid; min-height: 360px; place-items: center; color: #54595d; }.state.error { color: #b32424; }
/* 讨论区：圆形悬浮按钮 + 侧栏小卡片（与 life-tree.vue 同款），顶部避开固定导航栏 */
.float-actions { position: fixed; z-index: 25; right: 18px; bottom: 18px; display: grid; gap: 10px; }
.float-button { display: grid; width: 46px; height: 46px; place-items: center; border: 1px solid #cfdad3; border-radius: 50%; background: rgba(255, 255, 255, 0.96); color: #245d43; cursor: pointer; box-shadow: 0 8px 24px rgba(23, 48, 34, 0.18); transition: transform 0.15s ease, background 0.15s ease; }
.float-button:hover { transform: translateY(-2px); background: #f1f7f3; }
.float-button.active { background: #245d43; border-color: #245d43; color: #fff; }
.comments-side-panel { position: fixed; z-index: 70; top: 78px; right: 18px; bottom: 18px; display: grid; grid-template-rows: auto minmax(0, 1fr); width: min(460px, 92vw); overflow: hidden; border: 1px solid #cfdad3; border-radius: 14px; background: #fff; box-shadow: 0 18px 60px rgba(23, 48, 34, 0.22); }
.panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border-bottom: 1px solid #dce5df; }
.panel-heading > div { display: grid; min-width: 0; gap: 3px; }
.panel-heading span { color: #687a70; font-size: 11px; }
.panel-heading strong { overflow: hidden; color: #183c29; text-overflow: ellipsis; white-space: nowrap; }
.panel-heading button { flex: none; padding: 7px 10px; border: 1px solid #c6d3ca; border-radius: 7px; background: #fff; color: #245d43; cursor: pointer; font: inherit; font-size: 12px; }
.panel-body { overflow-y: auto; padding: 18px 16px; background: #f4f8f6; }
.comments-body { display: block; background: #fff; }
.panel-slide-enter-active, .panel-slide-leave-active { transition: transform 0.22s ease, opacity 0.22s ease; }
.panel-slide-enter-from, .panel-slide-leave-to { transform: translateX(24px); opacity: 0; }
@media (max-width: 1100px) { .article-layout { grid-template-columns: 155px minmax(0, 1fr); }.infobox { display: none; } }
@media (max-width: 760px) { .article-page { padding: 24px 16px 60px; }.article-layout { display: block; }.outline { position: static; margin-bottom: 24px; }.article-header h1 { font-size: 30px; }.article-content { font-size: 16px; } .comments-side-panel { top: 64px; right: 0; bottom: 0; left: 0; width: auto; border-radius: 0; } }
</style>
