<script setup>
/**
 * LifeTree 页面 - 首页导航 "生命树" 入口。
 * /life-tree          识别服务器上的全部进化树（每页 8 条，加载更多）；
 * /life-tree/:id      点进去后，用真实 DOM 元素（LifeTreeDom）解析渲染该树，
 *                     此时页面里只有树本身：没有导航栏、页头等其他组件。
 * /life-tree/:id?node=:uid  定位并高亮指定节点（来自搜索结果跳转）。
 * 右下角两个圆形悬浮按钮：
 *   - 进化树信息卡片：沿用 view-tree 的信息格式（UID/作者/节点/协议/Fork 等，
 *     保留编辑、Fork、参与完善、贡献审查等入口）
 *   - 评论区：沿用 ContentInteractions（type="tree"）
 * 均以侧栏（生物卡片阅读器同款方式）打开。
 * 点击节点名上关联的本站文章/树时，复用原有的文章卡片阅读器（NodeContentReader）。
 * 树不可拖拽缩放，通过上下左右滚动查看；Ctrl +/− 缩放容器（不是页面缩放）。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import navBar from "@/components/navBar.vue";
import LifeTreeDom from "@/components/LifeTreeDom.vue";
import NodeContentReader from "@/components/NodeContentReader.vue";
import ContentInteractions from "@/components/ContentInteractions.vue";
import { fetchTree, fetchTreePage } from "@/services/trees";
import { normalizeMindMapDocument } from "@/utils/evolutionMindMapModel";
import { formatDateTime } from "@/utils/date";
import { platformTreeLabel } from "@/utils/treeLabels";
import { useUserStore } from "@/stores/user";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// 列表状态（分页）
const treeList = ref([]);
const listNextCursor = ref(null);
const listLoading = ref(true);
const listLoadingMore = ref(false);
const listError = ref("");

// 树渲染状态
const tree = ref(null);
const treeLoading = ref(false);
const treeError = ref("");
const contentSelection = ref(null);
const pageRef = ref(null);
const zoom = ref(1);

// 悬浮面板
const infoPanelOpen = ref(false);
const commentsPanelOpen = ref(false);

const currentTreeId = computed(() => String(route.params.id || ""));
const highlightNodeId = computed(() => String(route.query.node || ""));
const document = computed(() => {
  if (!tree.value?.document) return null;
  try {
    return normalizeMindMapDocument(tree.value.document);
  } catch {
    return tree.value.document;
  }
});

const platformBadge = computed(() => platformTreeLabel(tree.value));
const isCreator = computed(() =>
  Boolean(userStore.user && tree.value?.creatorUid === userStore.user.uid),
);
const canEdit = computed(() =>
  Boolean(
    tree.value &&
    userStore.user &&
    (tree.value.creatorUid === userStore.user.uid ||
      (tree.value.kind === "OFFICIAL" && userStore.isSiteOwner)),
  ),
);
const editTarget = computed(() => ({
  path: "/evolution-tree",
  query: { edit: tree.value?.uid || tree.value?.id },
}));
const canFork = computed(() =>
  Boolean(tree.value?.forkEnabled && userStore.user && !isCreator.value),
);
const canContribute = computed(() =>
  Boolean(tree.value?.contributionEnabled && userStore.user && !isCreator.value),
);
const canReviewContributions = computed(() =>
  Boolean(tree.value && userStore.user && isCreator.value),
);

async function loadTreeList() {
  listLoading.value = true;
  listError.value = "";
  try {
    const payload = await fetchTreePage("ALL", { limit: 8 });
    treeList.value = payload.trees;
    listNextCursor.value = payload.nextCursor;
  } catch (error) {
    treeList.value = [];
    listNextCursor.value = null;
    listError.value = error.message || "树列表加载失败";
  } finally {
    listLoading.value = false;
  }
}

async function loadMoreTrees() {
  if (!listNextCursor.value || listLoadingMore.value) return;
  listLoadingMore.value = true;
  try {
    const payload = await fetchTreePage("ALL", {
      limit: 8,
      cursor: listNextCursor.value,
    });
    treeList.value = [...treeList.value, ...payload.trees];
    listNextCursor.value = payload.nextCursor;
  } catch (error) {
    listError.value = error.message || "加载更多失败";
  } finally {
    listLoadingMore.value = false;
  }
}

async function loadTree(id) {
  treeLoading.value = true;
  treeError.value = "";
  tree.value = null;
  contentSelection.value = null;
  infoPanelOpen.value = false;
  commentsPanelOpen.value = false;
  try {
    tree.value = await fetchTree(id);
  } catch (error) {
    treeError.value = error.message || "树加载失败";
  } finally {
    treeLoading.value = false;
  }
}

watch(
  () => route.params.id,
  (id) => {
    if (id) loadTree(id);
  },
  { immediate: true },
);

function backToList() {
  router.push("/life-tree");
}

function setZoom(value) {
  zoom.value = Math.min(3, Math.max(0.4, value));
}

function zoomIn() {
  setZoom(zoom.value * 1.15);
}

function zoomOut() {
  setZoom(zoom.value / 1.15);
}

function handleKeydown(event) {
  if (!event.ctrlKey || event.altKey || event.metaKey) return;
  if (event.key === "=" || event.key === "+") {
    event.preventDefault();
    zoomIn();
  } else if (event.key === "-") {
    event.preventDefault();
    zoomOut();
  } else if (event.key === "0") {
    event.preventDefault();
    setZoom(1);
  }
}

function handleWheel(event) {
  if (!event.ctrlKey) return;
  event.preventDefault();
  setZoom(zoom.value * (event.deltaY < 0 ? 1.1 : 1 / 1.1));
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
  pageRef.value?.addEventListener("wheel", handleWheel, { passive: false });
  userStore.initialize();
  if (!route.params.id) loadTreeList();
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
  pageRef.value?.removeEventListener("wheel", handleWheel);
});
</script>

<template>
  <navBar />
  <main ref="pageRef" class="life-tree-page" aria-label="生命树">
    <!-- 列表状态：识别服务器上的全部树（分页） -->
    <section v-if="!currentTreeId" class="tree-list" aria-label="进化树列表">
      <p v-if="listLoading" class="state">正在加载树列表...</p>
      <p v-else-if="listError" class="state error">{{ listError }}</p>
      <p v-else-if="!treeList.length" class="state">暂无进化树。</p>
      <template v-else>
        <article v-for="item in treeList" :key="item.uid || item.id" class="tree-row">
          <div>
            <RouterLink
              class="tree-title"
              :to="`/life-tree/${item.uid || item.id}`"
            >
              {{ item.title || "未命名树" }}
            </RouterLink>
            <p>{{ item.description || "暂无说明" }}</p>
            <small>{{ item.creator || "未署名" }} · {{ formatDateTime(item.updatedAt) }}</small>
          </div>
          <RouterLink class="open-tree" :to="`/life-tree/${item.uid || item.id}`">
            解析树
          </RouterLink>
        </article>
        <div v-if="listNextCursor" class="load-more">
          <button type="button" :disabled="listLoadingMore" @click="loadMoreTrees">
            {{ listLoadingMore ? "正在加载..." : "加载更多" }}
          </button>
        </div>
      </template>
    </section>

    <!-- 树状态：只有树 -->
    <template v-else>
      <p v-if="treeLoading" class="state">正在解析树...</p>
      <p v-else-if="treeError" class="state error">{{ treeError }}</p>
      <p v-else-if="!document" class="state">没有可显示的树内容。</p>
      <div v-else class="life-tree-scroll">
        <div class="life-tree-stage" :style="{ zoom }">
          <LifeTreeDom
            :key="currentTreeId"
            :document="document"
            :highlight-node-id="highlightNodeId"
            @content-links="contentSelection = { ...$event, currentTreeId }"
          />
        </div>
      </div>

      <div class="page-controls">
        <button type="button" class="back-button" @click="backToList">← 树列表</button>
        <div class="zoom-controls" role="group" aria-label="画布缩放">
          <button type="button" aria-label="缩小" @click="zoomOut">−</button>
          <span class="zoom-value">{{ Math.round(zoom * 100) }}%</span>
          <button type="button" aria-label="放大" @click="zoomIn">＋</button>
          <button type="button" aria-label="重置缩放" @click="setZoom(1)">⟲</button>
        </div>
      </div>

      <!-- 圆形悬浮入口：树信息卡片 / 评论区 -->
      <div v-if="tree" class="float-actions">
        <button
          type="button"
          class="float-button"
          :class="{ active: infoPanelOpen }"
          aria-label="进化树信息卡片"
          title="进化树信息卡片"
          @click="infoPanelOpen = !infoPanelOpen; commentsPanelOpen = false"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              d="M4 4h10a2 2 0 0 1 2 2v2h-2V6H6v12h6v-2h2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
              fill="currentColor"
            />
            <path
              d="M13 12V9.5A1.5 1.5 0 0 1 14.5 8h4L21 10.5V19a1.5 1.5 0 0 1-1.5 1.5H14.5A1.5 1.5 0 0 1 13 19v-7zm1.5-2.5v2h2.5l-2.5-2z"
              fill="currentColor"
            />
          </svg>
        </button>
        <button
          type="button"
          class="float-button"
          :class="{ active: commentsPanelOpen }"
          aria-label="评论区"
          title="评论区"
          @click="commentsPanelOpen = !commentsPanelOpen; infoPanelOpen = false"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              d="M4 4h16a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 20 17h-9.6L6 20.7a.9.9 0 0 1-1.5-.7V17H4a1.5 1.5 0 0 1-1.5-1.5v-10A1.5 1.5 0 0 1 4 4z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <!-- 树信息卡片侧栏（生物卡片同款打开方式） -->
      <transition name="panel-slide">
        <aside v-if="infoPanelOpen && tree" class="tree-side-panel" aria-label="进化树信息卡片">
          <header class="panel-heading">
            <div>
              <span>进化树信息卡片</span>
              <strong>{{ tree.title }}</strong>
            </div>
            <button type="button" aria-label="关闭信息卡片" @click="infoPanelOpen = false">关闭</button>
          </header>
          <div class="panel-body">
            <p class="panel-description">{{ tree.description || "暂无简介" }}</p>
            <span v-if="platformBadge" class="platform-badge">{{ platformBadge }}</span>
            <dl class="info-grid">
              <div><dt>UID</dt><dd>{{ tree.uid }}</dd></div>
              <div>
                <dt>创作者</dt>
                <dd><RouterLink :to="`/users/${tree.creatorUid}`">{{ tree.creator }}</RouterLink></dd>
              </div>
              <div><dt>节点</dt><dd>{{ tree.nodeCount }}</dd></div>
              <div><dt>协议</dt><dd>{{ tree.license }}</dd></div>
              <div><dt>更新</dt><dd>{{ formatDateTime(tree.updatedAt) }}</dd></div>
              <div><dt>Fork</dt><dd>{{ tree.forkCount }} · {{ tree.forkEnabled ? "开放" : "关闭" }}</dd></div>
              <div>
                <dt>Contribution</dt>
                <dd>{{ tree.contributionCount }} · {{ tree.contributionEnabled ? "开放" : "关闭" }}</dd>
              </div>
            </dl>

            <div v-if="tree.forkedFrom" class="provenance-row">
              <span>{{ tree.kind === "OFFICIAL" ? "来源" : "Forked from" }}</span>
              <RouterLink :to="`/life-tree/${tree.forkedFrom.uid || tree.forkedFrom.id}`">
                {{ tree.forkedFrom.creator }} / {{ tree.forkedFrom.title }}
              </RouterLink>
            </div>
            <div v-if="tree.contributors?.length" class="provenance-row">
              <span>Contributors</span>
              <p>
                <RouterLink
                  v-for="contributor in tree.contributors"
                  :key="contributor.uid"
                  :to="`/users/${contributor.uid}`"
                >
                  {{ contributor.name }}
                </RouterLink>
              </p>
            </div>
            <div v-if="tree.tags?.length" class="provenance-row">
              <span>关键词 / 标签</span>
              <p><i v-for="tag in tree.tags" :key="tag">#{{ tag }}</i></p>
            </div>
            <div v-if="tree.changeNote" class="provenance-row">
              <span>最近提交说明</span>
              <p>{{ tree.changeNote }}</p>
            </div>

            <div class="panel-actions">
              <RouterLink v-if="canEdit" class="panel-action primary" :to="editTarget">编辑树相</RouterLink>
              <RouterLink
                v-if="canFork"
                class="panel-action"
                :to="{ path: '/evolution-tree', query: { fork: tree.uid || tree.id } }"
              >
                Fork 到工作台
              </RouterLink>
              <RouterLink
                v-if="canContribute"
                class="panel-action"
                :to="{ path: '/evolution-tree', query: { contribute: tree.uid || tree.id } }"
              >
                参与完善
              </RouterLink>
              <RouterLink
                v-if="canReviewContributions"
                class="panel-action"
                :to="{ path: '/tree-contributions', query: { tree: tree.uid || tree.id } }"
              >
                贡献审查
              </RouterLink>
              <RouterLink
                class="panel-action"
                :to="`/life-tree/${tree.uid || tree.id}`"
              >
                在 life-tree 中打开
              </RouterLink>
            </div>
          </div>
        </aside>
      </transition>

      <!-- 评论区侧栏 -->
      <transition name="panel-slide">
        <aside v-if="commentsPanelOpen && tree" class="tree-side-panel" aria-label="评论区">
          <header class="panel-heading">
            <div>
              <span>DISCUSSION</span>
              <strong>评论区</strong>
            </div>
            <button type="button" aria-label="关闭评论区" @click="commentsPanelOpen = false">关闭</button>
          </header>
          <div class="panel-body comments-body">
            <ContentInteractions :content-id="tree.uid || tree.id" type="tree" />
          </div>
        </aside>
      </transition>

      <NodeContentReader
        :selection="contentSelection"
        @close="contentSelection = null"
      />
    </template>
  </main>
</template>

<style scoped>
.life-tree-page {
  position: fixed;
  top: 64px;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  overflow: auto;
  background: #fff;
}

@media (max-width: 760px) {
  .life-tree-page { top: 62px; }
}

.state {
  display: grid;
  min-height: 100vh;
  place-items: center;
  color: #6b7280;
}

.state.error {
  color: #b42318;
}

/* 列表状态 */
.tree-list {
  width: min(100% - 48px, 980px);
  min-height: 100vh;
  margin: 0 auto;
  padding: 54px 0;
}

.tree-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
  padding: 24px 0;
  border-bottom: 1px solid #e5e7eb;
}

.tree-title {
  color: #111827;
  font-family: Georgia, "Noto Serif SC", serif;
  font-size: 22px;
  font-weight: 700;
  text-decoration: none;
}

.tree-title:hover {
  text-decoration: underline;
}

.tree-row p {
  margin: 9px 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.65;
}

.tree-row small {
  color: #9ca3af;
  font-size: 12px;
}

.open-tree {
  flex: none;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

.open-tree:hover {
  color: #111827;
  text-decoration: underline;
}

.load-more {
  display: grid;
  place-items: center;
  padding: 30px 0 0;
}

.load-more button {
  padding: 9px 26px;
  border: 1px solid #c8ccd1;
  border-radius: 999px;
  background: #fff;
  color: #374151;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.load-more button:hover {
  border-color: #111827;
  color: #111827;
}

.load-more button:disabled {
  opacity: 0.6;
  cursor: default;
}

/* 树状态 */
.life-tree-scroll {
  min-height: 100%;
  display: flex;
  align-items: center;
}

.life-tree-stage {
  flex: none;
  min-width: 100%;
}

.page-controls {
  position: fixed;
  z-index: 20;
  left: 14px;
  bottom: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.back-button,
.zoom-controls button {
  padding: 5px 10px;
  border: 1px solid #d7dbe0;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.94);
  color: #374151;
  font-size: 12px;
  line-height: 1.4;
  cursor: pointer;
}

.back-button:hover,
.zoom-controls button:hover {
  border-color: #9ca3af;
  color: #111827;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border: 1px solid #dfe3e8;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 4px 18px rgba(17, 24, 39, 0.1);
}

.zoom-controls button {
  width: 26px;
  height: 26px;
  padding: 0;
  font-size: 14px;
  line-height: 1;
}

.zoom-value {
  min-width: 44px;
  color: #6b7280;
  font-size: 12px;
  text-align: center;
  user-select: none;
}

/* 圆形悬浮入口 */
.float-actions {
  position: fixed;
  z-index: 25;
  right: 18px;
  bottom: 18px;
  display: grid;
  gap: 10px;
}

.float-button {
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  border: 1px solid #cfdad3;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.96);
  color: #245d43;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(23, 48, 34, 0.18);
  transition: transform 0.15s ease, background 0.15s ease;
}

.float-button:hover {
  transform: translateY(-2px);
  background: #f1f7f3;
}

.float-button.active {
  background: #245d43;
  border-color: #245d43;
  color: #fff;
}

/* 侧栏面板（与 NodeContentReader 同款打开方式），顶部避开固定导航栏 */
.tree-side-panel {
  position: fixed;
  z-index: 70;
  top: 78px;
  right: 18px;
  bottom: 18px;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  width: min(460px, 92vw);
  overflow: hidden;
  border: 1px solid #cfdad3;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 18px 60px rgba(23, 48, 34, 0.22);
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #dce5df;
}

.panel-heading > div {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.panel-heading span {
  color: #687a70;
  font-size: 11px;
}

.panel-heading strong {
  overflow: hidden;
  color: #183c29;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-heading button {
  flex: none;
  padding: 7px 10px;
  border: 1px solid #c6d3ca;
  border-radius: 7px;
  background: #fff;
  color: #245d43;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}

.panel-body {
  overflow-y: auto;
  padding: 18px 16px;
  background: #f4f8f6;
}

.comments-body {
  display: block;
  background: #fff;
}

.panel-description {
  margin: 0 0 12px;
  color: #4b5f55;
  font-size: 13px;
  line-height: 1.7;
}

.platform-badge {
  display: inline-block;
  margin-bottom: 12px;
  padding: 4px 9px;
  border-radius: 999px;
  background: #e5f0ff;
  color: #315f9c;
  font-size: 11px;
  font-weight: 700;
}

.info-grid {
  display: grid;
  gap: 0;
  margin: 0 0 14px;
  border: 1px solid #d7e1da;
  border-radius: 10px;
  background: #fff;
  overflow: hidden;
}

.info-grid div {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid #e3ebe6;
}

.info-grid div:first-child {
  border-top: 0;
}

.info-grid dt {
  color: #687a70;
  font-size: 12px;
}

.info-grid dd {
  margin: 0;
  color: #183c29;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.info-grid dd a {
  color: #2f6f5d;
}

.provenance-row {
  display: grid;
  gap: 4px;
  margin-bottom: 12px;
}

.provenance-row span {
  color: #687a70;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.provenance-row p {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  color: #34463f;
  font-size: 12px;
}

.provenance-row a {
  color: #2f6f5d;
}

.provenance-row i {
  padding: 3px 7px;
  border-radius: 99px;
  background: #e8f3ee;
  color: #2b6b57;
  font-size: 11px;
  font-style: normal;
}

.panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.panel-action {
  padding: 7px 12px;
  border: 1px solid #6e5aa5;
  border-radius: 7px;
  background: #fff;
  color: #604b98;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}

.panel-action.primary {
  border-color: #2f806a;
  background: #2f806a;
  color: #fff;
}

.panel-action:hover {
  opacity: 0.85;
}

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  transform: translateX(24px);
  opacity: 0;
}

@media (max-width: 640px) {
  .tree-list {
    width: min(100% - 32px, 980px);
    padding: 28px 0;
  }

  .tree-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .tree-side-panel {
    top: 62px;
    right: 0;
    bottom: 0;
    left: 0;
    width: auto;
    border-radius: 0;
  }
}
</style>
