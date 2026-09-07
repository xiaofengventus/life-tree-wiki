<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import navBar from "@/components/navBar.vue";
import ArtTreeVisualization from "@/components/ArtTreeVisualization.vue";
import HierarchicalNebulaVisualization from "@/components/HierarchicalNebulaVisualization.vue";
import HtmlTreeRenderer from "@/components/HtmlTreeRenderer.vue";
import { fetchTree } from "@/services/trees";
import { normalizeMindMapDocument } from "@/utils/evolutionMindMapModel";

const route = useRoute();
const router = useRouter();
const stage = ref(null);
const visualization = ref(null);
const tree = ref(null);
const loading = ref(true);
const errorMessage = ref("");
const selectedNode = ref(null);
const replayKey = ref(0);
const paused = ref(false);
const showLabels = ref(false);
const spacing = ref(1.3);

// 渲染模式：'art' = 艺术展示, 'html' = 真实HTML渲染
const renderMode = ref("art");
const availableModes = [
  { value: "art", label: "艺术展示" },
  { value: "html", label: "真实HTML渲染" },
];

const artStyle = computed(() => {
  if (route.query.style === "crystal") return "crystal";
  if (route.query.style === "lineage") return "lineage";
  if (route.query.style === "nebula") return "nebula";
  return "botanical";
});
const artStyleName = computed(() => {
  if (artStyle.value === "crystal") return "CRYSTAL GROWTH";
  if (artStyle.value === "lineage") return "TREE OF LIFE";
  if (artStyle.value === "nebula") return "HIERARCHICAL NEBULA";
  return "BOTANICAL BLOOM";
});
const treeDocument = computed(() =>
  tree.value?.document ? normalizeMindMapDocument(tree.value.document) : null,
);
const citations = computed(
  () =>
    new Map(
      (treeDocument.value?.citations || []).map((citation) => [
        Number(citation.number),
        citation.text,
      ]),
    ),
);
const selectedCitations = computed(() =>
  (selectedNode.value?.citationNumbers || [])
    .map((number) => ({
      number,
      text: citations.value.get(Number(number)) || "",
    }))
    .filter((citation) => citation.text),
);

function setStyle(style) {
  selectedNode.value = null;
  paused.value = false;
  router.replace({
    path: route.path,
    query: { ...route.query, style },
  });
  replayKey.value += 1;
}

function restartGrowth() {
  paused.value = false;
  replayKey.value += 1;
}

function zoomIn() {
  visualization.value?.zoomIn();
}

function zoomOut() {
  visualization.value?.zoomOut();
}

function resetViewport() {
  visualization.value?.resetView();
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await stage.value?.requestFullscreen?.();
  } else {
    await document.exitFullscreen?.();
  }
}

function internalLinkLocation(link) {
  if (link?.type === "ARTICLE" && link.targetId)
    return `/view-post/${link.targetId}`;
  if (link?.type === "TREE" && link.targetId)
    return `/life-tree/${link.targetId}`;
  return "";
}

async function loadTree() {
  loading.value = true;
  errorMessage.value = "";
  selectedNode.value = null;
  try {
    tree.value = await fetchTree(String(route.params.id || ""));
  } catch (error) {
    tree.value = null;
    errorMessage.value = error.message || "艺术树相加载失败";
  } finally {
    loading.value = false;
  }
}

watch(() => route.params.id, loadTree, { immediate: true });
</script>

<template>
  <navBar />
  <main class="art-viewer-page">
    <section v-if="tree" class="art-viewer-heading">
      <div>
        <RouterLink to="/art-trees">← 艺术树相画廊</RouterLink>
        <span>{{ artStyleName }}</span>
        <h1>{{ tree.title }}</h1>
        <p>{{ tree.creator }} · {{ tree.nodeCount }} 个节点</p>
      </div>
      <div class="view-links">
        <RouterLink :to="`/life-tree/${tree.uid || tree.id}`"
          >标准树视图</RouterLink
        >
      </div>
    </section>

    <!-- 渲染模式切换 -->
    <div v-if="tree && treeDocument" class="render-mode-switch">
      <span class="render-mode-label">渲染模式：</span>
      <div class="render-mode-options">
        <label
          v-for="mode in availableModes"
          :key="mode.value"
          class="render-mode-option"
          :class="{ active: renderMode === mode.value }"
        >
          <input type="radio" :value="mode.value" v-model="renderMode" />
          <span>{{ mode.label }}</span>
        </label>
      </div>
    </div>

    <p v-if="loading" class="viewer-state">正在生成艺术结构……</p>
    <section v-else-if="errorMessage" class="viewer-state error">
      <strong>无法打开艺术树相</strong>
      <p>{{ errorMessage }}</p>
      <RouterLink to="/art-trees">返回画廊</RouterLink>
    </section>

    <!-- 艺术展示模式 -->
    <section
      v-else-if="tree && treeDocument && renderMode === 'art'"
      ref="stage"
      class="art-stage"
      :class="artStyle"
    >
      <header class="art-controls">
        <div class="style-switcher" aria-label="艺术风格">
          <button
            type="button"
            :class="{ active: artStyle === 'botanical' }"
            @click="setStyle('botanical')"
          >
            植物花开
          </button>
          <button
            type="button"
            :class="{ active: artStyle === 'crystal' }"
            @click="setStyle('crystal')"
          >
            晶体生长
          </button>
          <button
            type="button"
            :class="{ active: artStyle === 'lineage' }"
            @click="setStyle('lineage')"
          >
            生命谱系
          </button>
          <button
            type="button"
            :class="{ active: artStyle === 'nebula' }"
            @click="setStyle('nebula')"
          >
            层级星云
          </button>
        </div>
        <div class="playback-controls">
          <div class="zoom-controls" aria-label="画布缩放">
            <button
              type="button"
              title="缩小"
              aria-label="缩小"
              @click="zoomOut"
            >
              −
            </button>
            <button type="button" title="适应画布" @click="resetViewport">
              适应
            </button>
            <button
              type="button"
              title="放大"
              aria-label="放大"
              @click="zoomIn"
            >
              ＋
            </button>
          </div>
          <label class="spacing-control">
            <span>节点间距</span>
            <input
              v-model.number="spacing"
              type="range"
              min=".9"
              max="2"
              step=".1"
              aria-label="节点间距"
            />
          </label>
          <button type="button" @click="restartGrowth">重新生长</button>
          <button type="button" @click="paused = !paused">
            {{ paused ? "继续" : "暂停" }}
          </button>
          <button
            type="button"
            :class="{ active: showLabels }"
            @click="showLabels = !showLabels"
          >
            {{ showLabels ? "隐藏文字" : "显示文字" }}
          </button>
          <button type="button" @click="toggleFullscreen">全屏</button>
        </div>
      </header>

      <div class="visualization-shell">
        <HierarchicalNebulaVisualization
          v-if="artStyle === 'nebula'"
          ref="visualization"
          :document="treeDocument"
          :seed="tree.uid || tree.id"
          :replay-key="replayKey"
          :paused="paused"
          :show-labels="showLabels"
          :selected-id="selectedNode?.id || ''"
          :spacing="spacing"
          @select="selectedNode = $event"
        />
        <ArtTreeVisualization
          v-else
          ref="visualization"
          :document="treeDocument"
          :style="artStyle"
          :seed="tree.uid || tree.id"
          :replay-key="replayKey"
          :paused="paused"
          :show-labels="showLabels"
          :selected-id="selectedNode?.id || ''"
          :spacing="spacing"
          @select="selectedNode = $event"
        />
        <p v-if="!selectedNode" class="interaction-hint">
          {{
            artStyle === "nebula"
              ? "拖拽旋转 · 滚轮缩放 · 悬停查看路径 · 点击节点聚焦"
              : "滚轮缩放 · 拖动画布 · 悬停查看路径 · 点击节点聚焦"
          }}
        </p>
      </div>

      <aside v-if="selectedNode" class="node-drawer">
        <header>
          <div>
            <span>NODE {{ selectedNode.depth + 1 }}</span>
            <h2>{{ selectedNode.label }}</h2>
          </div>
          <button
            type="button"
            aria-label="关闭节点详情"
            @click="selectedNode = null"
          >
            ×
          </button>
        </header>
        <img
          v-if="selectedNode.image"
          :src="selectedNode.image"
          :alt="selectedNode.imageTitle || selectedNode.label"
        />
        <p v-if="selectedNode.imageTitle" class="image-title">
          {{ selectedNode.imageTitle }}
        </p>

        <section v-if="selectedNode.contentLinks.length" class="node-resources">
          <h3>关联内容</h3>
          <template
            v-for="link in selectedNode.contentLinks"
            :key="`${link.type}:${link.targetId || link.url}`"
          >
            <RouterLink
              v-if="internalLinkLocation(link)"
              :to="internalLinkLocation(link)"
            >
              <span>{{ link.type === "TREE" ? "进化树" : "文章" }}</span>
              {{ link.title }}
            </RouterLink>
            <a
              v-else
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>外部</span>{{ link.title }}
            </a>
          </template>
        </section>

        <section v-if="selectedCitations.length" class="node-citations">
          <h3>节点引用</h3>
          <p v-for="citation in selectedCitations" :key="citation.number">
            <strong>[{{ citation.number }}]</strong>{{ citation.text }}
          </p>
        </section>

        <p
          v-if="
            !selectedNode.image &&
            !selectedNode.contentLinks.length &&
            !selectedCitations.length
          "
          class="empty-node"
        >
          这个节点目前只有名称，没有附加图片、引用或关联内容。
        </p>
      </aside>
    </section>

    <!-- 真实HTML渲染模式 -->
    <section
      v-else-if="tree && treeDocument && renderMode === 'html'"
      class="html-tree-section"
    >
      <HtmlTreeRenderer
        :key="`html-${tree.id}:${tree.version || 1}`"
        :model-value="treeDocument"
        :file-owner="tree.title"
        :current-tree-id="tree.uid || tree.id"
        class="html-renderer"
      />
    </section>
  </main>
</template>

<style scoped>
.art-viewer-page {
  min-height: 100vh;
  padding: 82px 18px 30px;
  background: #edf1ed;
  color: #213b32;
}
.art-viewer-heading {
  display: flex;
  width: min(100%, 1480px);
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin: 0 auto 12px;
}
.art-viewer-heading > div:first-child {
  display: grid;
  gap: 4px;
}
.art-viewer-heading a {
  color: #52756a;
  font-size: 0.78rem;
  font-weight: 700;
  text-decoration: none;
}
.art-viewer-heading span {
  color: #689989;
  font-size: 0.65rem;
  font-weight: 850;
  letter-spacing: 0.18em;
}
.art-viewer-heading h1 {
  margin: 0;
  color: #1e382f;
  font-size: 1.55rem;
}
.art-viewer-heading p {
  margin: 0;
  color: #7b8b85;
  font-size: 0.78rem;
}
.view-links a {
  display: inline-flex;
  padding: 8px 12px;
  border: 1px solid #a9bdb5;
  border-radius: 8px;
  background: #fff;
  color: #315f50;
}
.art-stage {
  position: relative;
  display: grid;
  width: min(100%, 1480px);
  height: calc(100vh - 145px);
  min-height: 620px;
  margin: auto;
  overflow: hidden;
  grid-template-rows: auto minmax(0, 1fr);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 20px;
  background: #071a15;
  box-shadow: 0 22px 60px rgba(18, 45, 37, 0.18);
}
.art-stage.crystal {
  background: #090d22;
}
.art-stage.lineage {
  background: #fbfcfd;
  border-color: #dce2e6;
}
.art-stage:fullscreen {
  width: 100vw;
  height: 100vh;
  min-height: 0;
  border: 0;
  border-radius: 0;
}
.art-controls {
  position: relative;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 11px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(6, 18, 15, 0.68);
  backdrop-filter: blur(15px);
}
.lineage .art-controls {
  background: rgba(44, 54, 63, 0.92);
}
.style-switcher,
.playback-controls,
.zoom-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.playback-controls {
  align-items: center;
  justify-content: flex-end;
}
.zoom-controls {
  gap: 2px;
}
.zoom-controls button {
  min-width: 32px;
  padding-inline: 8px;
}
.spacing-control {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 9px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 7px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.7rem;
  font-weight: 700;
}
.spacing-control input {
  width: 82px;
  accent-color: #9bd9bd;
  cursor: pointer;
}
.crystal .spacing-control input {
  accent-color: #aebaff;
}
.lineage .spacing-control input {
  accent-color: #55a9dc;
}
.art-controls button {
  padding: 7px 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.76);
  font: inherit;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
}
.art-controls button:hover,
.art-controls button.active {
  border-color: rgba(176, 236, 209, 0.72);
  background: rgba(149, 216, 185, 0.2);
  color: #fff;
}
.crystal .art-controls button:hover,
.crystal .art-controls button.active {
  border-color: rgba(177, 190, 255, 0.72);
  background: rgba(125, 123, 220, 0.25);
}
.lineage .art-controls button:hover,
.lineage .art-controls button.active {
  border-color: rgba(116, 191, 232, 0.78);
  background: rgba(85, 169, 220, 0.24);
}
.visualization-shell {
  position: relative;
  min-height: 0;
}
.interaction-hint {
  position: absolute;
  bottom: 13px;
  left: 50%;
  z-index: 3;
  margin: 0;
  padding: 7px 11px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: rgba(4, 13, 11, 0.55);
  color: rgba(255, 255, 255, 0.66);
  font-size: 0.72rem;
  transform: translateX(-50%);
  backdrop-filter: blur(8px);
  pointer-events: none;
}
.node-drawer {
  position: absolute;
  z-index: 8;
  top: 68px;
  right: 14px;
  bottom: 14px;
  width: min(360px, calc(100% - 28px));
  overflow: auto;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.19);
  border-radius: 15px;
  background: rgba(247, 251, 249, 0.94);
  color: #273f37;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(18px);
}
.node-drawer > header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.node-drawer > header span {
  color: #6d9889;
  font-size: 0.62rem;
  font-weight: 850;
  letter-spacing: 0.15em;
}
.node-drawer h2 {
  margin: 4px 0 0;
  font-size: 1.25rem;
}
.node-drawer > header button {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: #e7efeb;
  color: #49645b;
  font-size: 1.3rem;
  cursor: pointer;
}
.node-drawer > img {
  width: 100%;
  max-height: 230px;
  margin-top: 16px;
  border-radius: 10px;
  object-fit: cover;
}
.image-title {
  margin: 6px 0 0;
  color: #71817b;
  font-size: 0.74rem;
}
.node-resources,
.node-citations {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #dde7e2;
}
.node-drawer h3 {
  margin: 0 0 9px;
  color: #516c62;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
}
.node-resources a {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 8px;
  margin-top: 7px;
  padding: 9px;
  border: 1px solid #d7e2dd;
  border-radius: 8px;
  background: #fff;
  color: #315f50;
  font-size: 0.78rem;
  text-decoration: none;
}
.node-resources a span {
  padding: 3px 6px;
  border-radius: 999px;
  background: #e7f1ed;
  color: #52766a;
  font-size: 0.62rem;
}
.node-citations p {
  display: flex;
  gap: 7px;
  margin: 8px 0;
  color: #53665f;
  font-size: 0.76rem;
  line-height: 1.55;
}
.node-citations strong {
  color: #315f50;
}
.empty-node {
  margin-top: 20px;
  padding: 13px;
  border-radius: 9px;
  background: #edf3f0;
  color: #71817b;
  font-size: 0.78rem;
  line-height: 1.6;
}
.viewer-state {
  display: grid;
  min-height: 65vh;
  place-content: center;
  color: #6f817a;
  text-align: center;
}
.viewer-state.error strong {
  color: #9b3935;
}
.viewer-state.error p {
  margin: 8px 0;
}
.viewer-state.error a {
  color: #2c6b57;
}
@media (max-width: 720px) {
  .art-viewer-page {
    padding: 72px 7px 12px;
  }
  .art-viewer-heading {
    padding: 0 7px;
  }
  .art-viewer-heading h1 {
    font-size: 1.15rem;
  }
  .art-stage {
    height: calc(100vh - 128px);
    min-height: 540px;
    border-radius: 12px;
  }
  .art-controls {
    align-items: flex-start;
  }
  .spacing-control {
    display: none;
  }
  .playback-controls button:last-child {
    display: none;
  }
  .node-drawer {
    top: 132px;
  }
  .interaction-hint {
    max-width: calc(100% - 18px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
.art-stage.nebula {
  background: #050817;
  border-color: rgba(111, 157, 207, 0.22);
}
.nebula .art-controls {
  background: rgba(5, 9, 24, 0.86);
}
.nebula .spacing-control input {
  accent-color: #63d9ff;
}
.nebula .art-controls button:hover,
.nebula .art-controls button.active {
  border-color: rgba(99, 217, 255, 0.72);
  background: rgba(99, 217, 255, 0.18);
}
@media (max-width: 720px) {
  .nebula .node-drawer {
    top: 158px;
  }
}

/* 渲染模式切换 */
.render-mode-switch {
  display: flex;
  align-items: center;
  gap: 12px;
  width: min(100%, 1480px);
  margin: 0 auto 16px;
  padding: 8px 14px;
  background: #fff;
  border: 1px solid #d5dfd8;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.render-mode-label {
  font-size: 13px;
  font-weight: 600;
  color: #607068;
}

.render-mode-options {
  display: flex;
  gap: 8px;
}

.render-mode-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border: 1.5px solid #d5dfd8;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #607068;
  background: #fff;
  transition: all 0.2s;
}

.render-mode-option:hover {
  border-color: #2f806a;
  color: #2f806a;
}

.render-mode-option.active {
  border-color: #2f806a;
  background: #e8f3ee;
  color: #2b6b57;
}

.render-mode-option input {
  display: none;
}

.render-mode-option span {
  font-weight: 500;
}

/* HTML 树区域 */
.html-tree-section {
  width: min(100%, 1480px);
  min-height: 600px;
  margin: 0 auto;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #d5dfd8;
  padding: 20px;
  box-sizing: border-box;
}

.html-renderer {
  width: 100%;
  height: auto;
  display: block;
}
</style>
