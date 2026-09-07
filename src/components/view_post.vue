<template>
  <main v-if="post" class="view-post-page">
    <div class="background-orbit orbit-one"></div>
    <div class="background-orbit orbit-two"></div>

    <div class="reading-layout">
      <aside class="outline-column" aria-label="文章目录">
        <nav class="post-outline">
          <div class="outline-heading">
            <span>目录</span>
            <small>{{ articleStructure.outline.length }} 节</small>
          </div>
          <a href="#post-title" class="outline-title">{{ post.title || "未命名文章" }}</a>
          <div v-if="articleStructure.outline.length" class="outline-links">
            <a
              v-for="item in articleStructure.outline"
              :key="item.id"
              :href="`#${item.id}`"
              :class="`depth-${item.level}`"
            >
              {{ item.text }}
            </a>
          </div>
          <p v-else>正文暂未设置分节标题</p>
        </nav>
        <PostClassificationCard
          v-for="card in outlineCards"
          :key="card.id"
          :card="card"
        />
      </aside>

      <article class="article-paper">
        <figure v-if="post.coverUrl" class="post-cover-hero">
          <img :src="post.coverUrl" :alt="`${post.title}封面`" />
          <span>生命时序 · 文章</span>
        </figure>

        <div class="paper-content">
          <header class="post-header">
            <span class="article-kicker">LIFE SEQUENCE JOURNAL</span>
            <h1 id="post-title">{{ post.title || "未命名帖子" }}</h1>
            <div class="author-row">
              <RouterLink v-if="post.creatorUid" class="author-avatar" :to="`/users/${post.creatorUid}`">
                <img
                  v-if="post.creatorAvatarUrl"
                  :src="post.creatorAvatarUrl"
                  :alt="`${post.creator || post.author || '作者'}的头像`"
                  loading="lazy"
                  decoding="async"
                />
                <span v-else>{{ (post.creator || post.author || "时").slice(0, 1) }}</span>
              </RouterLink>
              <span v-else class="author-avatar">{{ (post.creator || post.author || "时").slice(0, 1) }}</span>
              <div>
                <RouterLink v-if="post.creatorUid" :to="`/users/${post.creatorUid}`">{{ post.author || post.creator || "未署名作者" }}</RouterLink>
                <strong v-else>{{ post.author || post.creator || "未署名作者" }}</strong>
                <p>{{ formatSubmittedTime(post.submittedAt) }} · {{ post.uid }}</p>
              </div>
              <span class="revision-badge">第 {{ post.revisionCount || 1 }} 次提交</span>
            </div>
            <div v-if="isCreator || canDelete" class="mobile-owner-actions">
              <button v-if="isCreator" type="button" @click="updatePost">编辑文章</button>
              <button v-if="canDelete" type="button" class="delete" :disabled="deleting" @click="removePost">
                {{ deleting ? "删除中…" : "删除文章" }}
              </button>
            </div>
          </header>

          <div v-if="post.tags?.length" class="post-tags">
            <span v-for="tag in post.tags" :key="tag"># {{ tag }}</span>
          </div>
          <PostClassificationCard
            v-for="card in outlineCards"
            :key="`mobile-${card.id}`"
            class="mobile-classification-card"
            :card="card"
          />

          <section class="post-content" @click="handlePostContentClick">
            <template v-for="(block, index) in articleStructure.blocks" :key="`${block.type}-${block.id || index}`">
              <div v-if="block.type === 'html'" class="post-html-block" v-html="block.html"></div>
              <ResearchTreeEmbed
                v-else-if="block.type === 'tree'"
                :tree-id="block.id"
                :fallback-title="block.title"
              />
              <PostClassificationCard
                v-else-if="block.type === 'card' && cardForContentBlock(block)"
                class="inline-post-card"
                :card="cardForContentBlock(block)"
              />
            </template>
          </section>

          <ContentSourcesDisplay
            :citations="inlineCitations"
          />

          <section id="post-discussion" class="discussion-section">
            <ContentInteractions :content-id="post.uid || post.id" type="post" />
          </section>

          <details v-if="historyRecords.length" class="submission-history">
            <summary>查看提交历史 <span>{{ historyRecords.length }} 条记录</span></summary>
            <ol>
              <li v-for="record in historyRecords" :key="`${record.submittedAt}-${record.revisionCount}`">
                <time :datetime="record.submittedAt">{{ formatSubmittedTime(record.submittedAt) }}</time>
                <strong>第{{ record.revisionCount }}次提交</strong>
                <span>{{ record.note }}</span>
              </li>
            </ol>
          </details>

          <footer class="post-footer">
            <p>{{ post.changeNote || "暂无提交说明" }}</p>
            <RouterLink to="/research">返回研究广场 →</RouterLink>
          </footer>
        </div>
      </article>

      <aside class="action-column" aria-label="文章快捷操作">
        <div class="action-rail">
          <a href="#post-title"><strong>文</strong><span>正文</span></a>
          <a href="#post-discussion"><strong>评</strong><span>评论</span></a>
          <button v-if="isCreator" type="button" @click="updatePost"><strong>编</strong><span>编辑</span></button>
          <button v-if="canDelete" type="button" :disabled="deleting" @click="removePost"><strong>删</strong><span>{{ deleting ? "处理中" : "删除" }}</span></button>
          <RouterLink to="/research"><strong>返</strong><span>广场</span></RouterLink>
        </div>
      </aside>
    </div>
  </main>

  <main v-else-if="loading" class="loading-post">
    <span></span>
    <p>正在展开文章……</p>
  </main>

  <main v-else class="missing-post">
    <div>
      <span>404</span>
      <h1>文章不存在</h1>
      <p>这篇文章可能已被删除，或暂时无法从服务器读取。</p>
      <RouterLink to="/research">返回研究广场</RouterLink>
    </div>
  </main>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { formatDateTime } from "@/utils/date";
import { deletePost, fetchPost } from "@/services/posts";
import { parsePostBlocks } from "@/utils/postBlocks";
import { normalizePostCard } from "@/utils/wangEditorPostCard";
import ResearchTreeEmbed from "@/components/ResearchTreeEmbed.vue";
import ContentInteractions from "@/components/ContentInteractions.vue";
import PostClassificationCard from "@/components/PostClassificationCard.vue";
import ContentSourcesDisplay from "@/components/ContentSourcesDisplay.vue";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const post = ref(null);
const loading = ref(true);
const deleting = ref(false);
const contentBlocks = computed(() => parsePostBlocks(post.value?.content || "", {
  citations: post.value?.citations || [],
}));
const classificationCards = computed(() => {
  if (Array.isArray(post.value?.classificationCards)) return post.value.classificationCards;
  return post.value?.classificationCard ? [post.value.classificationCard] : [];
});
const outlineCards = computed(() =>
  classificationCards.value.filter((card) =>
    !Array.isArray(card.placements) || card.placements.includes("outline")),
);
const cardsById = computed(() =>
  Object.fromEntries(classificationCards.value.map((card) => [card.id, card])),
);

function cardForContentBlock(block) {
  const stored = cardsById.value[block.id];
  if (stored) return stored;
  if (!block.config) return null;
  try {
    return normalizePostCard({
      ...JSON.parse(decodeURIComponent(block.config)),
      id: block.id,
    });
  } catch {
    return null;
  }
}
const inlineCitations = computed(() =>
  (Array.isArray(post.value?.citations) ? post.value.citations : [])
    .map((citation) => ({
      number: Number(citation.number),
      text: String(citation.text || ""),
    }))
    .filter((citation) => Number.isSafeInteger(citation.number) && citation.number > 0 && citation.text)
    .sort((first, second) => first.number - second.number),
);

function citationTargetId(href) {
  const source = String(href || "").trim();
  const directMatch = source.match(/^#(post-citation-[1-9]\d{0,3})$/);
  if (directMatch) return directMatch[1];
  if (typeof window === "undefined") return "";
  try {
    const url = new URL(source, window.location.href);
    if (url.origin !== window.location.origin) return "";
    return url.hash.match(/^#(post-citation-[1-9]\d{0,3})$/)?.[1] || "";
  } catch {
    return "";
  }
}

const articleStructure = computed(() => {
  let headingIndex = 0;
  const outline = [];
  const blocks = contentBlocks.value.map((block) => {
    if (block.type !== "html" || typeof DOMParser === "undefined") return block;
    const parsed = new DOMParser().parseFromString(`<body>${block.html}</body>`, "text/html");
    parsed.body.querySelectorAll("h1, h2, h3").forEach((heading) => {
      const text = heading.textContent?.trim();
      if (!text) return;
      const id = `article-section-${headingIndex}`;
      headingIndex += 1;
      heading.id = id;
      outline.push({ id, text, level: Number(heading.tagName.slice(1)) });
    });
    parsed.body.querySelectorAll("a[href]").forEach((anchor) => {
      const targetId = citationTargetId(anchor.getAttribute("href"));
      if (!targetId) return;
      anchor.setAttribute("href", `#${targetId}`);
      anchor.removeAttribute("target");
      anchor.removeAttribute("rel");
      anchor.classList.add("inline-citation-link");
      anchor.setAttribute("aria-label", `跳转到参考文献 ${anchor.textContent?.trim() || ""}`);
    });
    return { ...block, html: parsed.body.innerHTML };
  });
  return { blocks, outline };
});

function handlePostContentClick(event) {
  const anchor = event.target?.closest?.("a.inline-citation-link");
  if (!anchor) return;
  const targetId = citationTargetId(anchor.getAttribute("href"));
  const target = targetId ? document.getElementById(targetId) : null;
  if (!target) return;

  event.preventDefault();
  const hash = `#${targetId}`;
  if (window.location.hash === hash) {
    window.history.replaceState(null, "", hash);
  } else {
    window.history.pushState(null, "", hash);
  }
  target.scrollIntoView({
    behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start",
  });
  target.focus({ preventScroll: true });
}

const historyRecords = computed(() => {
  if (!post.value) return [];

  if (Array.isArray(post.value.history) && post.value.history.length) {
    return [...post.value.history].sort(
      (first, second) =>
        Date.parse(first.submittedAt || "") -
        Date.parse(second.submittedAt || ""),
    );
  }

  return [
    {
      revisionCount: post.value.revisionCount || 1,
      submittedAt: post.value.submittedAt,
      note: post.value.changeNote || "提交文章",
    },
  ];
});

const isCreator = computed(() => {
  if (!post.value || !userStore.user) return false;

  if (post.value.creatorUid && userStore.user.uid) {
    return post.value.creatorUid === userStore.user.uid;
  }

  return post.value.creator === userStore.user.name;
});
const canDelete = computed(() => isCreator.value || userStore.isSiteOwner);

async function loadPost() {
  loading.value = true;
  post.value = null;
  try {
    const id = String(route.params.id || "");
    post.value = await fetchPost(id);
  } catch (error) {
    post.value = null;
    console.warn("文章加载失败", error);
  } finally {
    loading.value = false;
  }
}

function formatSubmittedTime(value) {
  return value ? formatDateTime(value) : "提交时间未知";
}

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
    await router.push("/user-space");
  } catch (error) {
    window.alert(`删除文章失败：${error.message || "未知错误"}`);
  } finally {
    deleting.value = false;
  }
}

watch(() => route.params.id, loadPost, { immediate: true });
</script>

<style scoped>
.view-post-page {
  position: relative;
  min-height: 100vh;
  overflow: clip;
  padding: 92px 24px 72px;
  background:
    radial-gradient(circle at 8% 22%, rgba(255, 255, 255, 0.82), transparent 22rem),
    radial-gradient(circle at 92% 8%, rgba(174, 216, 204, 0.34), transparent 27rem),
    linear-gradient(145deg, #dcece8 0%, #e8f2ef 48%, #d8e9e5 100%);
}

.view-post-page::before {
  position: fixed;
  inset: 64px 0 0;
  pointer-events: none;
  background-image:
    radial-gradient(rgba(39, 111, 91, 0.12) 0.7px, transparent 0.7px),
    linear-gradient(115deg, transparent 48%, rgba(255, 255, 255, 0.18) 49%, transparent 50%);
  background-size: 16px 16px, 120px 120px;
  content: "";
  opacity: 0.28;
}

.background-orbit {
  position: fixed;
  z-index: 0;
  width: 320px;
  height: 320px;
  border: 1px solid rgba(67, 137, 117, 0.14);
  border-radius: 48% 52% 58% 42%;
  pointer-events: none;
}

.orbit-one { top: 18%; left: -180px; transform: rotate(25deg); }
.orbit-two { right: -220px; bottom: 8%; width: 420px; height: 420px; transform: rotate(-35deg); }

.reading-layout {
  position: relative;
  z-index: 1;
  display: grid;
  width: min(100%, 1440px);
  margin: 0 auto;
  grid-template-columns: 230px minmax(0, 900px) 76px;
  align-items: start;
  justify-content: center;
  gap: 18px;
}

.outline-column,
.action-column {
  position: sticky;
  top: 86px;
}

.outline-column {
  display: grid;
  max-height: calc(100vh - 112px);
  gap: 10px;
  overflow-y: auto;
  padding-right: 3px;
  scrollbar-width: thin;
}

.post-outline,
.action-rail {
  border: 1px solid rgba(206, 224, 218, 0.9);
  background: rgba(255, 255, 255, 0.88);
  box-shadow:
    0 18px 45px rgba(49, 91, 79, 0.12),
    0 2px 8px rgba(49, 91, 79, 0.05);
  backdrop-filter: blur(16px);
}

.post-outline {
  overflow: visible;
  padding: 18px;
  border-radius: 14px;
}

.outline-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid #e7eeeb;
}

.outline-heading span {
  color: #304b42;
  font-size: 0.9rem;
  font-weight: 780;
}

.outline-heading small {
  color: #99aaa4;
  font-size: 0.66rem;
}

.outline-title {
  display: -webkit-box;
  margin: 13px 0 9px;
  overflow: hidden;
  padding: 0;
  color: #2b433b;
  font-size: 0.82rem;
  font-weight: 730;
  line-height: 1.55;
  text-decoration: none;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.outline-links {
  display: grid;
}

.outline-links a {
  overflow: hidden;
  padding: 6px 0;
  color: #71837d;
  font-size: 0.75rem;
  line-height: 1.45;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.outline-links a:hover {
  color: #26765f;
  text-decoration: none;
}

.outline-links .depth-2 { padding-left: 9px; }
.outline-links .depth-3 { padding-left: 21px; color: #94a39e; font-size: 0.71rem; }
.post-outline > p { margin: 16px 0 2px; color: #9aa8a4; font-size: 0.72rem; line-height: 1.6; }
.mobile-classification-card{display:none}

.article-paper {
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgba(216, 227, 223, 0.95);
  border-radius: 17px;
  background: #fff;
  box-shadow:
    0 32px 80px rgba(46, 89, 77, 0.15),
    0 8px 24px rgba(46, 89, 77, 0.08);
}

.post-cover-hero {
  position: relative;
  aspect-ratio: 16 / 7.8;
  margin: 0;
  overflow: hidden;
  background: #dce8e4;
}

.post-cover-hero::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(20, 50, 42, 0.26), transparent 45%);
  content: "";
}

.post-cover-hero img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-cover-hero > span {
  position: absolute;
  z-index: 1;
  right: 20px;
  bottom: 16px;
  padding: 5px 9px;
  border: 1px solid rgba(255, 255, 255, 0.36);
  border-radius: 999px;
  background: rgba(27, 72, 60, 0.28);
  color: rgba(255, 255, 255, 0.88);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  backdrop-filter: blur(9px);
}

.paper-content {
  padding: 42px clamp(28px, 6vw, 68px) 34px;
}

.post-header {
  padding-bottom: 24px;
  border-bottom: 1px solid #e7eeeb;
}

.article-kicker,
.inner-section-title > span {
  display: block;
  margin-bottom: 8px;
  color: #67a18f;
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.15em;
}

.post-header h1,
.missing-post h1 {
  margin: 0;
  color: #20242a;
  font-size: clamp(1.75rem, 4vw, 2.45rem);
  font-weight: 790;
  line-height: 1.28;
  letter-spacing: -0.035em;
  overflow-wrap: anywhere;
}

.author-row {
  display: flex;
  margin-top: 20px;
  align-items: center;
  gap: 11px;
}

.author-avatar {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  place-items: center;
  padding: 0;
  border-radius: 50%;
  background: linear-gradient(145deg, #dbeee7, #bcd9cf);
  color: #286d59;
  font-size: 0.9rem;
  font-weight: 800;
  text-decoration: none;
  overflow: hidden;
}

.author-avatar img { width: 100%; height: 100%; object-fit: cover; }

.author-row > div {
  display: grid;
  gap: 1px;
}

.author-row > div a,
.author-row > div strong {
  padding: 0;
  color: #2c413a;
  font-size: 0.85rem;
  font-weight: 740;
  text-decoration: none;
}

.author-row p {
  margin: 0;
  color: #95a39f;
  font-size: 0.69rem;
}

.revision-badge {
  margin-left: auto;
  padding: 5px 9px;
  border-radius: 999px;
  background: #eef6f3;
  color: #5d8478;
  font-size: 0.68rem;
}

.mobile-owner-actions { display: none; }

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 18px 0 0;
}

.post-tags span {
  padding: 4px 9px;
  border-radius: 999px;
  background: #f1f6f4;
  color: #5c8074;
  font-size: 0.72rem;
}

.post-content {
  min-height: 360px;
  padding: 42px 0 52px;
  color: var(--rich-content-color);
  font-family: var(--rich-content-font-family);
  font-size: var(--rich-content-font-size);
  line-height: var(--rich-content-line-height);
  overflow-wrap: anywhere;
}

.inline-post-card {
  width: min(100%, 560px);
  margin: 2em auto;
}

.post-content :deep(img) {
  max-width: 100%;
}

.post-content :deep(p) {
  margin: 0 0 1.25em;
}

.post-content :deep(h1),
.post-content :deep(h2),
.post-content :deep(h3) {
  scroll-margin-top: 94px;
  color: #20242a;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-weight: 760;
  line-height: 1.45;
}

.post-content :deep(h1) { margin: 2.2em 0 0.85em; font-size: 1.7rem; }
.post-content :deep(h2) {
  margin: 2.1em 0 0.8em;
  padding-bottom: 10px;
  border-bottom: 1px solid #e7eeeb;
  font-size: 1.38rem;
}
.post-content :deep(h3) { margin: 1.8em 0 0.7em; font-size: 1.13rem; }
.post-content :deep(blockquote) {
  margin: 1.7em 0;
  padding: 13px 18px;
  border-left: 4px solid var(--rich-content-quote-border);
  border-radius: 0 9px 9px 0;
  background: var(--rich-content-quote-background);
  color: var(--rich-content-quote-color);
}

.post-content :deep(img) {
  display: block;
  height: auto;
  margin: 24px auto;
  border-radius: 10px;
  box-shadow: 0 12px 30px rgba(43, 76, 66, 0.11);
}

.post-content :deep(figure) {
  box-sizing: border-box;
  width: fit-content;
  max-width: 100%;
  margin: 2em auto;
  padding: 0;
  text-align: center;
}

.post-content :deep(figure > img) {
  max-width: 100%;
  margin: 0 auto;
}

.post-content :deep(figcaption) {
  margin-top: 10px;
  color: #8b98a8;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 0.88rem;
  line-height: 1.65;
  text-align: center;
}

.post-content :deep(strong),
.post-content :deep(b) {
  font-weight: 700;
}

.post-content :deep(a),
.post-content :deep(a *) {
  color: #2563eb !important;
  text-decoration-color: currentColor;
  text-underline-offset: 0.16em;
}

.post-content :deep(a:hover),
.post-content :deep(a:hover *) {
  color: #1d4ed8 !important;
}

.post-content :deep(sup) {
  position: relative;
  top: -.42em;
  vertical-align: baseline;
  font-size: .68em;
  line-height: 0;
}

.post-content :deep(a.inline-citation-link),
.post-content :deep(a.inline-citation-link *) {
  padding: 0 .12em;
  border-radius: .22em;
  background: var(--rich-content-citation-background);
  color: var(--rich-content-citation-color) !important;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-weight: 850 !important;
  text-decoration: none;
  cursor: pointer;
}

.post-content :deep(a.inline-citation-link:hover),
.post-content :deep(a.inline-citation-link:focus-visible) {
  background: rgba(22, 131, 216, .2);
  color: #0068b7 !important;
  outline: 2px solid rgba(22, 131, 216, .26);
  outline-offset: 2px;
}

.post-content :deep(table) {
  width: min(100%, 460px);
  margin: 1.7em auto;
  overflow: hidden;
  border: 1px solid #d8dee4;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 8px;
  background: #f8fafc;
  box-shadow: 0 10px 24px rgba(44, 54, 64, 0.08);
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: .96rem;
  line-height: 1.45;
}

.post-content :deep(th),
.post-content :deep(td) {
  padding: 8px 11px;
  border-right: 1px solid rgba(148, 163, 184, .24);
  border-bottom: 1px solid rgba(148, 163, 184, .24);
  text-align: left;
  vertical-align: top;
}

.post-content :deep(th:first-child) { width: 39%; }
.post-content :deep(tr > :last-child) { border-right: 0; }
.post-content :deep(tbody tr:last-child > *) { border-bottom: 0; }
.post-content :deep(thead th) { text-align: center; }

.discussion-section {
  padding-top: 30px;
  border-top: 1px solid #e6eeeb;
  scroll-margin-top: 90px;
}

.inner-section-title h2 {
  margin: 0;
  color: #263d35;
  font-size: 1.18rem;
  font-weight: 760;
}

#post-discussion :deep(.content-interactions) {
  margin: 18px 0 30px;
  border-color: #dfe9e5;
  background: #f7faf8;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

#post-discussion :deep(.interaction-bar button.active),
#post-discussion :deep(.comment-form button) {
  border-color: #2f806a;
  background: #2f806a;
  color: #fff;
}

.submission-history {
  margin-top: 24px;
  padding: 15px 0;
  border-top: 1px solid #e5ece9;
  border-bottom: 1px solid #e5ece9;
}

.submission-history summary {
  display: flex;
  justify-content: space-between;
  color: #4b635b;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  list-style: none;
}

.submission-history summary span {
  color: #96a49f;
  font-size: 0.7rem;
  font-weight: 500;
}

.submission-history ol {
  display: grid;
  gap: 9px;
  margin: 15px 0 0;
  padding-left: 22px;
  color: #7c8d87;
  font-size: 0.75rem;
}

.submission-history li {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 13px;
}

.submission-history strong { color: #456057; }

.post-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  padding-top: 23px;
  color: #8b9a95;
  font-size: 0.75rem;
}

.post-footer p {
  margin: 0;
}

.post-footer a {
  padding: 0;
  color: #2f7c67;
  font-weight: 700;
  text-decoration: none;
}

.action-rail {
  display: grid;
  overflow: hidden;
  border-radius: 13px;
}

.action-rail a,
.action-rail button {
  display: grid;
  min-height: 68px;
  place-items: center;
  align-content: center;
  gap: 2px;
  padding: 8px 4px;
  border: 0;
  border-bottom: 1px solid #e7eeeb;
  background: transparent;
  color: #74847f;
  font: inherit;
  text-decoration: none;
  cursor: pointer;
}

.action-rail > :last-child { border-bottom: 0; }
.action-rail strong {
  display: grid;
  width: 27px;
  height: 27px;
  place-items: center;
  border-radius: 9px;
  background: #edf5f2;
  color: #3f7968;
  font-size: 0.72rem;
  font-weight: 800;
}
.action-rail span { font-size: 0.65rem; }
.action-rail a:hover,
.action-rail button:hover { background: #f3f8f6; color: #28715d; text-decoration: none; }

.loading-post,
.missing-post {
  display: grid;
  min-height: 100vh;
  padding: 100px 20px;
  place-items: center;
  background: #e4efeb;
  text-align: center;
}

.loading-post {
  align-content: center;
  gap: 13px;
  color: #71827c;
}

.loading-post > span {
  width: 38px;
  height: 38px;
  border: 3px solid #cbded7;
  border-top-color: #2f806a;
  border-radius: 50%;
  animation: article-loading 0.75s linear infinite;
}

.loading-post p { margin: 0; }

@keyframes article-loading { to { transform: rotate(360deg); } }

.missing-post > div {
  padding: 42px;
  border: 1px solid #d8e6e1;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 24px 60px rgba(46, 89, 77, 0.12);
}

.missing-post > div > span {
  color: #77a697;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.18em;
}

.missing-post p { color: #71827c; }
.missing-post a { color: #2c765f; font-weight: 700; }

@media (max-width: 1180px) {
  .reading-layout {
    grid-template-columns: minmax(0, 900px) 72px;
  }
  .outline-column { display: none; }
  .mobile-classification-card{display:block;width:min(100%,360px);margin:20px auto 0}
}

@media (max-width: 760px) {
  .view-post-page {
    padding: 76px 0 40px;
    background: #e7efec;
  }
  .reading-layout {
    display: block;
  }
  .action-column { display: none; }
  .article-paper {
    border-right: 0;
    border-left: 0;
    border-radius: 0;
    box-shadow: 0 12px 35px rgba(46, 89, 77, 0.1);
  }
  .paper-content { padding: 30px 20px; }
  .post-cover-hero { aspect-ratio: 16 / 9; }
  .author-row { flex-wrap: wrap; }
  .revision-badge { width: max-content; margin-left: 53px; }
  .mobile-owner-actions { display: flex; gap: 8px; margin-top: 14px; }
  .mobile-owner-actions button { padding: 7px 11px; border: 1px solid #bfd4cc; border-radius: 7px; background: #fff; color: #2f715e; font: inherit; font-size: .78rem; font-weight: 700; }
  .mobile-owner-actions button.delete { border-color: #e0b9b6; color: #a13f39; }
  .post-content {
    padding: 30px 0 42px;
    font-size: var(--rich-content-font-size);
  }
  .post-header h1,
  .missing-post h1 {
    font-size: 1.65rem;
  }
}
</style>
