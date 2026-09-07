<script setup>
/**
 * HtmlTreeRenderer - 基于真实 HTML DOM 的进化树渲染组件
 * 参考维基百科分类树样式：固定布局、文字链接、无缩放无拖拽
 */

import { computed } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
  fileOwner: { type: String, default: "生命时序" },
});

const emit = defineEmits(["content-links"]);

// 布局常量
const NODE_FONT_SIZE = 14;
const NODE_LINE_HEIGHT = 22;
const NODE_VERTICAL_GAP = 8;
const LEVEL_HORIZONTAL_GAP = 160;
const TEXT_IMAGE_GAP = 6;
const THUMB_SIZE = 50;

// 计算整个树的布局
const layout = computed(() => {
  if (!props.modelValue?.root) {
    return { nodes: [], edges: [], width: 600, height: 400 };
  }

  const nodes = [];
  const edges = [];

  // 计算子树的高度
  function getSubtreeHeight(node) {
    const nodeHeight = NODE_LINE_HEIGHT + NODE_VERTICAL_GAP;
    if (!node.children || node.children.length === 0) {
      return nodeHeight;
    }
    const childrenHeights = node.children.map(getSubtreeHeight);
    return Math.max(
      nodeHeight,
      childrenHeights.reduce((sum, h) => sum + h, 0),
    );
  }

  // 递归布局
  function layoutNode(node, depth, yStart) {
    const nodeId =
      node.data?.uid ||
      node.data?.id ||
      Math.random().toString(36).substr(2, 9);
    const hasImage = getImageUrl(node.data?.image);
    const subtreeHeight = getSubtreeHeight(node);
    const x = depth * LEVEL_HORIZONTAL_GAP;
    const y = yStart + (subtreeHeight - NODE_LINE_HEIGHT) / 2;

    const nodeInfo = {
      id: nodeId,
      x,
      y,
      text: node.data?.text || "未命名",
      hasImage: !!hasImage,
      imageUrl: hasImage,
      contentLinks: node.data?.contentLinks || node.data?.articleLinks || [],
      citationNumbers: node.data?.citationNumbers || [],
      isRoot: depth === 0,
    };
    nodes.push(nodeInfo);

    // 处理子节点
    if (node.children && node.children.length > 0) {
      let currentY = yStart;
      node.children.forEach((child) => {
        const childHeight = getSubtreeHeight(child);
        const childInfo = layoutNode(child, depth + 1, currentY);

        // 连接线：从父节点右边到子节点左边
        edges.push({
          id: `${nodeId}-${childInfo.id}`,
          fromX: x + 60, // 父节点右边
          fromY: y + NODE_LINE_HEIGHT / 2,
          toX: (depth + 1) * LEVEL_HORIZONTAL_GAP - 10, // 子节点左边
          toY: childInfo.y + NODE_LINE_HEIGHT / 2,
        });

        currentY += childHeight;
      });
    }

    return nodeInfo;
  }

  layoutNode(props.modelValue.root, 0, 0);

  // 计算整体尺寸
  const maxX = Math.max(
    ...nodes.map((n) => n.x + NODE_FONT_SIZE * n.text.length * 0.8 + 50),
    600,
  );
  const maxY = Math.max(...nodes.map((n) => n.y + NODE_LINE_HEIGHT + 20), 400);

  // 直角折线路径
  const edgePaths = edges.map((edge) => {
    const midX = (edge.fromX + edge.toX) / 2;
    return {
      ...edge,
      path: `M ${edge.fromX},${edge.fromY} L ${midX},${edge.fromY} L ${midX},${edge.toY} L ${edge.toX},${edge.toY}`,
    };
  });

  return { nodes, edges: edgePaths, width: maxX, height: maxY };
});

function getImageUrl(image) {
  if (!image) return "";
  if (typeof image === "string") return image;
  if (image.url) return image.url;
  return "";
}

function getNodeStyle(node) {
  return {
    left: node.x + "px",
    top: node.y + "px",
  };
}

function getImageStyle(node) {
  return {
    left: node.x + THUMB_SIZE + TEXT_IMAGE_GAP + "px",
    top: node.y - 10 + "px",
    width: THUMB_SIZE + "px",
    height: THUMB_SIZE + "px",
  };
}

function getContentLinkUrl(links) {
  if (!links || links.length === 0) return null;
  const firstLink = links[0];
  if (firstLink.url) return firstLink.url;
  if (firstLink.targetId && firstLink.type === "ARTICLE") {
    return `/post/${firstLink.targetId}`;
  }
  if (firstLink.targetId && firstLink.type === "TREE") {
    return `/life-tree/${firstLink.targetId}`;
  }
  return null;
}

function handleNodeClick(node, event) {
  const url = getContentLinkUrl(node.contentLinks);
  if (url) {
    emit("content-links", {
      nodeUid: node.id,
      nodeTitle: node.text,
      links: node.contentLinks,
    });
  }
}
</script>

<template>
  <div class="html-tree-wrapper">
    <!-- SVG 连接线层 -->
    <svg class="tree-connectors" :width="layout.width" :height="layout.height">
      <g class="connectors-group">
        <path
          v-for="edge in layout.edges"
          :key="edge.id"
          :d="edge.path"
          class="connector-line"
          fill="none"
          stroke="#555"
          stroke-width="1.2"
        />
      </g>
    </svg>

    <!-- 节点文字层 -->
    <span
      v-for="node in layout.nodes"
      :key="node.id"
      class="tree-node-text"
      :class="{ 'is-root': node.isRoot }"
      :style="getNodeStyle(node)"
    >
      <a
        v-if="getContentLinkUrl(node.contentLinks)"
        :href="getContentLinkUrl(node.contentLinks)"
        class="node-link"
        @click.prevent="handleNodeClick(node, $event)"
      >
        {{ node.text }}
      </a>
      <span v-else class="node-plain">{{ node.text }}</span>
      <sup v-if="node.citationNumbers?.length" class="citation">
        [{{ node.citationNumbers.join(",") }}]
      </sup>
    </span>

    <!-- 节点图片层（如果有图片） -->
    <img
      v-for="node in layout.nodes.filter((n) => n.hasImage)"
      :key="'img-' + node.id"
      :src="node.imageUrl"
      :alt="node.text"
      class="tree-node-thumb"
      :style="getImageStyle(node)"
      @error="node.hasImage = false"
    />
  </div>
</template>

<style scoped>
.html-tree-wrapper {
  position: relative;
  width: 100%;
  height: auto;
  overflow: visible;
  padding: 20px;
  box-sizing: border-box;
}

.tree-connectors {
  position: absolute;
  top: 20px;
  left: 20px;
  pointer-events: none;
  overflow: visible;
}

.connector-line {
  stroke-linecap: butt;
}

/* 节点文字 */
.tree-node-text {
  position: absolute;
  height: 22px;
  line-height: 22px;
  font-size: 14px;
  white-space: nowrap;
}

/* 链接样式 - 像维基百科 */
.node-link {
  color: #0645ad;
  text-decoration: none;
  cursor: pointer;
}

.node-link:hover {
  color: #0b0080;
  text-decoration: underline;
}

.node-plain {
  color: #333;
}

.is-root {
  font-weight: 700;
  font-size: 16px;
}

.is-root .node-link {
  font-size: 16px;
}

/* 缩略图 */
.tree-node-thumb {
  position: absolute;
  border: 1px solid #ccc;
  border-radius: 4px;
  object-fit: cover;
}

/* 引用 */
.citation {
  font-size: 10px;
  font-weight: 700;
  color: #1683d8;
  vertical-align: super;
  margin-left: 2px;
}
</style>
