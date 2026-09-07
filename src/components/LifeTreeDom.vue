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
  // 需要定位高亮的节点 uid（如从搜索结果跳转进来）
  highlightNodeId: { type: String, default: "" },
});

const emit = defineEmits(["content-links"]);

const layout = computed(() => computeLifeTreeLayout(props.document?.root));
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
      height: "1.5px",
    };
  }
  return {
    left: `${branch.x - 0.75}px`,
    top: `${branch.y}px`,
    width: "1.5px",
    height: `${branch.length}px`,
  };
}

function labelStyle(node) {
  return {
    left: `${node.labelLeft}px`,
    top: `${node.labelTop}px`,
  };
}

function imageStyle(node) {
  return {
    left: `${node.imageBox.left}px`,
    top: `${node.imageBox.top}px`,
    width: "72px",
    height: "56px",
  };
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
        v-if="node.segments.length || node.age || node.citationNumbers.length"
        class="tree-label"
        :class="{ 'is-root': node.isRoot, 'is-highlight': node.id === highlightedId }"
        :data-node-id="node.id"
        :style="labelStyle(node)"
      >
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
      </span>

      <img
        v-if="node.hasImage && node.imageBox && !brokenImages.has(node.id)"
        class="tree-thumb"
        :src="node.imageUrl"
        :alt="node.segments.map((segment) => segment.text).join(' ')"
        :style="imageStyle(node)"
        loading="lazy"
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

.tree-thumb {
  position: absolute;
  border: 1px solid #d0d3d8;
  border-radius: 4px;
  background: #fff;
  object-fit: cover;
}
</style>
