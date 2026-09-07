<script setup>
import { computed, ref, watch } from "vue";
import {
  normalizeContentLinks,
  normalizeMindMapDocument,
} from "@/utils/evolutionMindMapModel";
import {
  internalPostIdFromUrl,
  internalTreeIdFromUrl,
} from "@/utils/articleLinks";
import { fetchPost } from "@/services/posts";
import { fetchTree } from "@/services/trees";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { renderFormulaNodes } from "@/utils/formula";
import { formatDateTime } from "@/utils/date";
import ContentSourcesDisplay from "@/components/ContentSourcesDisplay.vue";
import evolution_mind_map from "@/components/evolution_mind_map.vue";

const props = defineProps({
  selection: { type: Object, default: null },
});

const emit = defineEmits(["close"]);
const activeIndex = ref(-1);
const internalPost = ref(null);
const internalPostLoading = ref(false);
const internalPostError = ref("");
const internalTree = ref(null);
const internalTreeLoading = ref(false);
const internalTreeError = ref("");
let internalPostRequest = 0;
let internalTreeRequest = 0;

const links = computed(() => normalizeContentLinks(props.selection?.links));
const activeLink = computed(() => links.value[activeIndex.value] || null);
const internalPostId = computed(() =>
  activeLink.value?.type === "ARTICLE"
    ? activeLink.value.targetId || internalPostIdFromUrl(activeLink.value.url)
    : "",
);
const internalTreeId = computed(() =>
  activeLink.value?.type === "TREE"
    ? activeLink.value.targetId || internalTreeIdFromUrl(activeLink.value.url)
    : "",
);
const internalPostContent = computed(() =>
  renderFormulaNodes(sanitizeHtml(internalPost.value?.content || "")),
);
const internalTreeDocument = computed(() =>
  internalTree.value?.document
    ? normalizeMindMapDocument(internalTree.value.document)
    : null,
);
const isSelfTree = computed(() =>
  Boolean(
    internalTreeId.value &&
    String(internalTreeId.value).toLowerCase() ===
      String(props.selection?.currentTreeId || "").toLowerCase(),
  ),
);

function destinationUrl(link) {
  if (link?.type === "ARTICLE" && link.title) {
    return `/wiki/${encodeURIComponent(link.title)}`;
  }
  return link?.url || "#";
}

function hostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "无效地址";
  }
}

function chooseContent(index) {
  activeIndex.value = index;
}

watch(
  () => props.selection,
  () => {
    activeIndex.value = -1;
  },
);

watch(
  internalPostId,
  async (postId) => {
    const requestId = ++internalPostRequest;
    internalPost.value = null;
    internalPostError.value = "";
    internalPostLoading.value = Boolean(postId);
    if (!postId) return;
    try {
      const post = await fetchPost(postId);
      if (requestId === internalPostRequest) internalPost.value = post;
    } catch (error) {
      if (requestId === internalPostRequest) {
        internalPostError.value = error?.message || "本站文章加载失败";
      }
    } finally {
      if (requestId === internalPostRequest) internalPostLoading.value = false;
    }
  },
  { immediate: true },
);

watch(
  internalTreeId,
  async (treeId) => {
    const requestId = ++internalTreeRequest;
    internalTree.value = null;
    internalTreeError.value = "";
    internalTreeLoading.value = Boolean(treeId);
    if (!treeId) return;
    if (isSelfTree.value) {
      internalTreeLoading.value = false;
      internalTreeError.value = "不能在当前树的节点中预览当前树自身";
      return;
    }
    try {
      const tree = await fetchTree(treeId);
      if (requestId === internalTreeRequest) internalTree.value = tree;
    } catch (error) {
      if (requestId === internalTreeRequest) {
        internalTreeError.value = error?.message || "本站进化树加载失败";
      }
    } finally {
      if (requestId === internalTreeRequest) internalTreeLoading.value = false;
    }
  },
  { immediate: true },
);
</script>

<template>
  <aside v-if="selection && links.length" class="article-reader" aria-label="节点关联内容阅读器">
    <header class="reader-heading">
      <div>
        <span>节点关联内容</span>
        <strong>{{ selection.nodeTitle || "未命名节点" }}</strong>
      </div>
      <button type="button" aria-label="关闭关联内容阅读器" @click="emit('close')">关闭</button>
    </header>

    <div v-if="!activeLink" class="article-list">
      <p>
        请选择关联内容。本站文章和进化树由站内接口读取；外部网页不会被解析、改写或代理。
      </p>
      <button
        v-for="(link, index) in links"
        :key="`${link.type}:${link.targetId || link.url}`"
        class="article-list-item"
        type="button"
        @click="chooseContent(index)"
      >
        <strong>{{ link.title }}</strong>
        <span>
          {{
            link.type === "ARTICLE"
              ? `站内文章 · ${link.targetId}`
              : link.type === "TREE"
                ? `站内进化树 · ${link.targetId}`
                : hostname(link.url)
          }}
        </span>
      </button>
    </div>

    <section v-else class="embedded-article">
      <div class="reader-address">
        <button type="button" @click="activeIndex = -1">返回列表</button>
        <div>
          <strong>{{ activeLink.title }}</strong>
          <span>
            {{
              internalPostId
                ? `站内文章 · ${internalPostId}`
                : internalTreeId
                  ? `站内进化树 · ${internalTreeId}`
                  : hostname(activeLink.url)
            }}
          </span>
        </div>
        <a
          :href="destinationUrl(activeLink)"
          target="_blank"
          rel="noopener noreferrer"
          referrerpolicy="no-referrer"
        >
          新窗口打开
        </a>
      </div>
      <p class="embed-warning">
        {{
          internalPostId
            ? "这是生命时序站内文章，正文由本站文章接口读取并安全渲染。"
            : internalTreeId
              ? "这是生命时序站内进化树。此处只读预览一层，关联树中的链接不会继续嵌套展开。"
              : "当前页面由外部网站直接提供。若对方禁止嵌入，请使用“新窗口打开”。"
        }}
      </p>
      <div v-if="internalPostId" class="internal-post-reader">
        <div v-if="internalPostLoading" class="internal-post-state">正在读取本站文章……</div>
        <div v-else-if="internalPostError" class="internal-post-state error">
          {{ internalPostError }}
        </div>
        <article v-else-if="internalPost" class="internal-post">
          <img
            v-if="internalPost.coverUrl"
            class="internal-post-cover"
            :src="internalPost.coverUrl"
            :alt="`${internalPost.title}封面`"
            loading="lazy"
          />
          <header>
            <span>生命时序 · {{ internalPost.uid }}</span>
            <h1>{{ internalPost.title }}</h1>
            <p>
              {{ internalPost.author || internalPost.creator || "未署名作者" }}
              · {{ formatDateTime(internalPost.submittedAt) }}
            </p>
          </header>
          <div v-if="internalPost.tags?.length" class="internal-post-tags">
            <span v-for="tag in internalPost.tags" :key="tag"># {{ tag }}</span>
          </div>
          <section class="internal-post-content" v-html="internalPostContent"></section>
          <ContentSourcesDisplay :citations="internalPost.citations" />
        </article>
      </div>
      <div v-else-if="internalTreeId" class="internal-tree-reader">
        <div v-if="internalTreeLoading" class="internal-post-state">
          正在读取本站进化树……
        </div>
        <div v-else-if="internalTreeError" class="internal-post-state error">
          {{ internalTreeError }}
        </div>
        <template v-else-if="internalTreeDocument">
          <header class="internal-tree-heading">
            <div>
              <span>生命时序 · {{ internalTree.uid }}</span>
              <strong>{{ internalTree.title }}</strong>
            </div>
            <small>
              {{ internalTree.creator || "未署名作者" }} ·
              {{ formatDateTime(internalTree.updatedAt) }}
            </small>
          </header>
          <div class="internal-tree-canvas">
            <evolution_mind_map
              :key="`${internalTree.id}:${internalTree.version || 1}`"
              :model-value="internalTreeDocument"
              :file-owner="internalTree.title"
              :current-tree-id="internalTree.uid || internalTree.id"
              read-only
            />
          </div>
        </template>
      </div>
      <iframe
        v-else-if="activeLink.type === 'EXTERNAL'"
        :key="activeLink.url"
        :src="activeLink.url"
        :title="activeLink.title"
        sandbox="allow-scripts allow-forms"
        referrerpolicy="no-referrer"
        loading="lazy"
      ></iframe>
    </section>
  </aside>
</template>

<style scoped>
.article-reader {
  position: fixed;
  z-index: 70;
  top: 74px;
  right: 18px;
  bottom: 18px;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  width: min(680px, 48vw);
  overflow: hidden;
  border: 1px solid #cfdad3;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 18px 60px rgba(23, 48, 34, 0.22);
}

.reader-heading,
.reader-address {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.reader-heading {
  padding: 14px 16px;
  border-bottom: 1px solid #dce5df;
}

.reader-heading > div,
.reader-address > div {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.reader-heading span,
.reader-address span {
  color: #687a70;
  font-size: 11px;
}

.reader-heading strong,
.reader-address strong {
  overflow: hidden;
  color: #183c29;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reader-heading button,
.reader-address button,
.reader-address a {
  flex: none;
  padding: 7px 10px;
  border: 1px solid #c6d3ca;
  border-radius: 7px;
  background: #fff;
  color: #245d43;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  text-decoration: none;
}

.article-list {
  overflow-y: auto;
  padding: 18px;
}

.article-list > p {
  margin: 0 0 14px;
  color: #687a70;
  font-size: 12px;
  line-height: 1.6;
}

.article-list-item {
  display: grid;
  width: 100%;
  gap: 6px;
  margin-bottom: 10px;
  padding: 14px;
  border: 1px solid #d7e1da;
  border-radius: 10px;
  background: #fbfdfb;
  color: #183c29;
  cursor: pointer;
  text-align: left;
}

.article-list-item:hover {
  border-color: #6e9b81;
  background: #f1f7f3;
}

.article-list-item span {
  color: #0969da;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.embedded-article {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  min-height: 0;
}

.reader-address {
  padding: 10px 12px;
  border-bottom: 1px solid #e0e7e2;
}

.reader-address > div {
  flex: 1;
}

.reader-address span {
  color: #0969da;
  overflow-wrap: anywhere;
}

.embed-warning {
  margin: 0;
  padding: 7px 12px;
  background: #fff8e8;
  color: #775a21;
  font-size: 11px;
}

.internal-post-reader {
  min-height: 0;
  overflow-y: auto;
  background: #f4f8f6;
}

.internal-post-state {
  display: grid;
  min-height: 220px;
  place-items: center;
  padding: 24px;
  color: #61756b;
}

.internal-post-state.error {
  color: #a44840;
}

.internal-tree-reader {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
  background: #f4f8f6;
}

.internal-tree-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 11px 14px;
  border-bottom: 1px solid #dbe5df;
  background: #fff;
}

.internal-tree-heading > div {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.internal-tree-heading span,
.internal-tree-heading small {
  color: #687a70;
  font-size: 11px;
}

.internal-tree-heading strong {
  overflow: hidden;
  color: #183c29;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.internal-tree-canvas {
  min-height: 0;
  overflow: hidden;
  background: #fff;
}

.internal-post {
  width: min(100% - 28px, 760px);
  box-sizing: border-box;
  margin: 14px auto;
  overflow: hidden;
  padding: 0 28px 32px;
  border: 1px solid #dbe5df;
  border-radius: 12px;
  background: #fff;
}

.internal-post-cover {
  display: block;
  width: calc(100% + 56px);
  max-height: 300px;
  margin: 0 -28px 28px;
  object-fit: cover;
}

.internal-post header {
  padding: 28px 0 20px;
  border-bottom: 1px solid #e3ebe6;
}

.internal-post-cover + header {
  padding-top: 0;
}

.internal-post header > span {
  color: #568c78;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.08em;
}

.internal-post h1 {
  margin: 7px 0 10px;
  color: #1f352b;
  font-size: clamp(24px, 4vw, 36px);
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.internal-post header p {
  margin: 0;
  color: #76867e;
  font-size: 12px;
}

.internal-post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 18px;
}

.internal-post-tags span {
  padding: 4px 8px;
  border-radius: 99px;
  background: #edf5f1;
  color: #4f7969;
  font-size: 11px;
}

.internal-post-content {
  padding: 28px 0;
  color: #34463f;
  font-family: "Noto Serif SC", "Songti SC", "STSong", Georgia, serif;
  font-size: 16px;
  line-height: 1.9;
  overflow-wrap: anywhere;
}

.internal-post-content :deep(img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 20px auto;
  border-radius: 9px;
}

.internal-post-content :deep(a) {
  color: #0969da;
}

.internal-post-content :deep(table) {
  display: block;
  max-width: 100%;
  overflow-x: auto;
  border-collapse: collapse;
}

.internal-post-content :deep(th),
.internal-post-content :deep(td) {
  padding: 7px 9px;
  border: 1px solid #d7e0da;
}

iframe {
  width: 100%;
  height: 100%;
  border: 0;
  background: #fff;
}

@media (max-width: 760px) {
  .article-reader {
    top: 62px;
    right: 0;
    bottom: 0;
    left: 0;
    width: auto;
    border-radius: 0;
  }

  .reader-address {
    flex-wrap: wrap;
  }

  .reader-address > div {
    order: -1;
    flex-basis: 100%;
  }

  .internal-post {
    width: 100%;
    margin: 0;
    padding: 0 18px 26px;
    border: 0;
    border-radius: 0;
  }

  .internal-post-cover {
    width: calc(100% + 36px);
    margin-right: -18px;
    margin-left: -18px;
  }
}
</style>
