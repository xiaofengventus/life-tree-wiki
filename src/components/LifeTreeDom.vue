<script setup>
/**
 * LifeTreeDom - 维基百科分类树风格的生命树渲染器。
 * 文字、树枝均为真实 DOM 元素（区别于 SVG 画布方案）；
 * 点击带关联内容的节点名，向父级发出 content-links 事件，
 * 由页面挂载的 NodeContentReader（文章卡片阅读器）承接。
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { computeLifeTreeLayout } from "@/utils/lifeTreeLayout";

const props = defineProps({
  document: { type: Object, required: true },
  layoutOverride: { type: Object, default: null },
  selectable: { type: Boolean, default: false },
  // 需要定位高亮的节点 uid（如从搜索结果跳转进来）
  highlightNodeId: { type: String, default: "" },
  // 已收起的节点 uid 集合（Set 或数组），由页面持有
  collapsedIds: { type: Object, default: null },
});

const emit = defineEmits(["content-links", "toggle-collapse", "preview-image", "node-select"]);

const layout = computed(() =>
  props.layoutOverride || computeLifeTreeLayout(props.document?.root, {
    collapsed: props.collapsedIds,
  }),
);
const brokenImages = ref(new Set());
const rootEl = ref(null);
const highlightedId = ref("");
let highlightTimer = 0;

watch(
  () => props.highlightNodeId,
  async (nodeId) => {
    window.clearTimeout(highlightTimer);
    highlightedId.value = "";
    if (!nodeId) return;
    await nextTick();
    const target = rootEl.value?.querySelector(`[data-node-id="${nodeId}"]`);
    if (!target) return;
    highlightedId.value = nodeId;
    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    highlightTimer = window.setTimeout(() => {
      highlightedId.value = "";
    }, 5000);
  },
  { immediate: true },
);

onBeforeUnmount(() => window.clearTimeout(highlightTimer));

function branchStyle(branch) {
  if (branch.dir === "h") {
    return {
      left: `${branch.x}px`,
      top: `${branch.y - 0.75}px`,
      width: `${branch.length}px`,
      backgroundColor: branch.color || undefined,
      height: "1.5px",
    };
  }
  return {
    left: `${branch.x - 0.75}px`,
    top: `${branch.y}px`,
    width: "1.5px",
    height: `${branch.length}px`,
    backgroundColor: branch.color || undefined,
  };
}

function labelStyle(node) {
  return {
    left: `${node.labelLeft}px`,
    top: `${node.labelTop}px`,
  };
}

function imageStyle(node) {
  const box = node.imageBox;
  if (!box) return {};
  return {
    left: `${box.left}px`,
    top: `${box.top}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
  };
}

function nodeTitle(node) {
  return node.segments.map((segment) => segment.text).join(" ");
}

function toggleCollapse(node) {
  if (!node.hasChildren) return;
  emit("toggle-collapse", node.id);
}

function openImagePreview(node) {
  if (!node.imageUrl) return;
  emit("preview-image", { url: node.imageUrl, title: nodeTitle(node) });
}

function firstLinkUrl(node) {
  const link = node.contentLinks[0];
  if (!link) return "";
  return link.url || "";
}

function handleNodeClick(node) {
  if (!node.contentLinks.length) return;
  emit("content-links", {
    nodeTitle: node.segments.map((segment) => segment.text).join(" "),
    links: node.contentLinks,
  });
}

function markImageBroken(node) {
  brokenImages.value = new Set([...brokenImages.value, node.id]);
}
</script>

<template>
  <div
    ref="rootEl"
    class="life-tree-canvas"
    :style="{ width: `${layout.width}px`, height: `${layout.height}px` }"
  >
    <div
      v-for="branch in layout.branches"
      :key="branch.id"
      class="tree-branch"
      :class="branch.dir === 'h' ? 'is-horizontal' : 'is-vertical'"
      :style="branchStyle(branch)"
      aria-hidden="true"
    ></div>

    <template v-for="node in layout.nodes" :key="node.id">
      <span
        v-if="
          node.segments.length ||
          node.age ||
          node.citationNumbers.length ||
          node.hasChildren
        "
        class="tree-label"
        :class="{ 'is-root': node.isRoot, 'is-highlight': node.id === highlightedId }"
        :data-node-id="node.id"
        @click="props.selectable && emit('node-select', node.id)"
        :style="labelStyle(node)"
      >
        <button
          v-if="node.hasChildren"
          type="button"
          class="fold-toggle"
          :class="{ 'is-collapsed': node.collapsed }"
          :aria-expanded="!node.collapsed"
          :aria-label="node.collapsed ? '展开分支' : '收起分支'"
          :title="node.collapsed ? '展开分支' : '收起分支'"
          @click.stop.prevent="toggleCollapse(node)"
        ></button>
        <a
          v-if="node.contentLinks.length && firstLinkUrl(node)"
          :href="firstLinkUrl(node)"
          class="label-link"
          @click.prevent="handleNodeClick(node)"
        ><span
            v-for="(segment, index) in node.segments"
            :key="index"
            :class="segment.latin ? 'latin' : 'chinese'"
          >{{ segment.text }}</span
          ></a>
        <span v-else class="label-plain"
        ><span
            v-for="(segment, index) in node.segments"
            :key="index"
            :class="segment.latin ? 'latin' : 'chinese'"
          >{{ segment.text }}</span
        ></span>
        <sup v-if="node.citationNumbers.length" class="citation">
          [{{ node.citationNumbers.join(",") }}]
        </sup>
        <small v-if="node.age" class="age">{{ node.age }}</small>
        <span v-if="node.collapsed && node.hiddenCount" class="hidden-count"
          >+{{ node.hiddenCount }}</span
        >
      </span>

      <img
        v-if="node.hasImage && node.imageBox && !brokenImages.has(node.id)"
        class="tree-thumb"
        :src="node.imageUrl"
        :alt="nodeTitle(node)"
        :style="imageStyle(node)"
        loading="lazy"
        @click="openImagePreview(node)"
        @error="markImageBroken(node)"
      />
    </template>
  </div>
</template>

<style scoped>
.life-tree-canvas {
  position: relative;
  flex: none;
}

/* 树枝：真实 DOM 矩形 */
.tree-branch {
  position: absolute;
  background: #555;
}

.tree-branch.is-horizontal {
  height: 1.5px;
}

.tree-branch.is-vertical {
  width: 1.5px;
}

/* 节点文字：真实 DOM，可选中 */
.tree-label {
  position: absolute;
  font-size: 14px;
  line-height: 22px;
  white-space: nowrap;
  color: #1f2328;
}

.tree-label.is-root {
  font-size: 16px;
  font-weight: 700;
}

.tree-label.is-highlight {
  z-index: 2;
  padding: 0 6px;
  border-radius: 5px;
  outline: 2px solid #f0a30a;
  background: #fff3c4;
  box-shadow: 0 0 0 6px rgba(240, 163, 10, 0.18);
  transition: box-shadow 0.6s ease;
}

.label-plain,
.label-link {
  color: inherit;
  text-decoration: none;
}

.label-link {
  color: #0645ad;
  cursor: pointer;
}

.label-link:hover {
  color: #0b0080;
  text-decoration: underline;
}

.label-link .chinese,
.label-plain .chinese {
  font-style: normal;
}

.latin {
  font-family: Georgia, "Times New Roman", serif;
  font-style: italic;
}

.citation {
  margin-left: 2px;
  color: #1683d8;
  font-size: 10px;
  font-weight: 700;
}

.age {
  margin-left: 7px;
  color: #8a919c;
  font-size: 11px;
}

/* 缩略图：白底相框 + 等比完整显示（与编辑器里的观感一致） */
.tree-thumb {
  position: absolute;
  box-sizing: border-box;
  padding: 3px;
  border: 1px solid #ced3d9;
  border-radius: 4px;
  background: #fff;
  object-fit: contain;
  cursor: zoom-in;
}

.tree-thumb:hover {
  border-color: #9aa3ad;
}

/* 收起 / 展开三角：默认朝下，收起后朝右 */
.fold-toggle {
  display: inline-grid;
  width: 14px;
  height: 14px;
  margin-right: 2px;
  padding: 0;
  place-items: center;
  border: 0;
  background: transparent;
  color: #7b838c;
  cursor: pointer;
  vertical-align: -1px;
}

.fold-toggle::before {
  content: "";
  width: 0;
  height: 0;
  border-left: 4px solid currentColor;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  transition: transform 0.15s ease;
}

.fold-toggle:not(.is-collapsed)::before {
  transform: rotate(90deg);
}

.fold-toggle:hover,
.fold-toggle:focus-visible {
  color: #1f2328;
}

/* 收起后提示这一支藏了多少后代 */
.hidden-count {
  margin-left: 4px;
  padding: 0 4px;
  border-radius: 999px;
  background: #eef1f4;
  color: #6b7280;
  font-size: 10px;
  vertical-align: 1px;
}
</style>
