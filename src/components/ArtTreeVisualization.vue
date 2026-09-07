<script setup>
import { computed, onBeforeUnmount, ref, useId, watch } from "vue";
import {
  artTreePalette,
  buildBotanicalArtLayout,
  buildCrystalArtLayout,
  buildLineageArtLayout,
} from "@/utils/artTreeLayout";

const props = defineProps({
  document: { type: Object, required: true },
  style: { type: String, default: "botanical" },
  seed: { type: String, default: "" },
  replayKey: { type: Number, default: 0 },
  paused: { type: Boolean, default: false },
  showLabels: { type: Boolean, default: false },
  selectedId: { type: String, default: "" },
  spacing: { type: Number, default: 1 },
});
const emit = defineEmits(["select"]);

const svg = ref(null);
const zoom = ref(1);
const pan = ref({ x: 0, y: 0 });
const dragging = ref(false);
const dragMoved = ref(false);
const lastPointer = ref(null);
const smoothViewport = ref(false);
const hoveredId = ref("");
let smoothTimer;

const instanceId = useId().replace(/[^A-Za-z0-9_-]/g, "");
const normalizedStyle = computed(() => {
  if (props.style === "crystal") return "crystal";
  if (props.style === "lineage") return "lineage";
  return "botanical";
});
const layout = computed(() => {
  const options = { spacing: props.spacing };
  if (normalizedStyle.value === "crystal") {
    return buildCrystalArtLayout(props.document, options);
  }
  if (normalizedStyle.value === "lineage") {
    return buildLineageArtLayout(props.document, options);
  }
  return buildBotanicalArtLayout(props.document, options);
});
const palette = computed(() => artTreePalette(normalizedStyle.value, props.seed));
const gradientId = computed(() => `art-gradient-${instanceId}`);
const glowId = computed(() => `art-glow-${instanceId}`);
const backgroundStyle = computed(() => ({
  "--art-background": palette.value.background,
  "--art-branch": palette.value.branch,
  "--art-accent": palette.value.accent,
  "--art-bloom": palette.value.bloom,
  "--art-glow": palette.value.glow,
}));
const viewportTransform = computed(
  () => `translate(${pan.value.x} ${pan.value.y}) scale(${zoom.value})`,
);
const zoomPercent = computed(() => Math.round(zoom.value * 100));
const artTitle = computed(() => {
  if (normalizedStyle.value === "crystal") return "晶体生长艺术进化树";
  if (normalizedStyle.value === "lineage") return "生命谱系艺术进化树";
  return "植物花开艺术进化树";
});
const activePathIds = computed(() => {
  const ids = new Set();
  const activeId = hoveredId.value || props.selectedId;
  let node = layout.value.nodes.find((candidate) => candidate.id === activeId);
  while (node) {
    ids.add(node.id);
    node = node.parent;
  }
  return ids;
});
const hasActivePath = computed(() => activePathIds.value.size > 0);

function svgPoint(event) {
  const element = svg.value;
  const matrix = element?.getScreenCTM?.();
  if (!element || !matrix) return null;
  const point = element.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(matrix.inverse());
}

function finishSmoothViewport() {
  window.clearTimeout(smoothTimer);
  smoothTimer = window.setTimeout(() => {
    smoothViewport.value = false;
  }, 460);
}

function setZoom(nextZoom, anchor, smooth = false) {
  const next = Math.max(0.55, Math.min(6, nextZoom));
  if (Math.abs(next - zoom.value) < 0.001) return;
  const focus = anchor || {
    x: layout.value.width / 2,
    y: layout.value.height / 2,
  };
  const contentX = (focus.x - pan.value.x) / zoom.value;
  const contentY = (focus.y - pan.value.y) / zoom.value;
  smoothViewport.value = smooth;
  pan.value = {
    x: focus.x - contentX * next,
    y: focus.y - contentY * next,
  };
  zoom.value = next;
  if (smooth) finishSmoothViewport();
}

function zoomIn() {
  setZoom(zoom.value * 1.28, null, true);
}

function zoomOut() {
  setZoom(zoom.value / 1.28, null, true);
}

function resetView() {
  smoothViewport.value = true;
  zoom.value = 1;
  pan.value = { x: 0, y: 0 };
  finishSmoothViewport();
}

function focusNode(node) {
  const fitScale = Math.max(
    1.65,
    Math.min(4.5, (layout.value.width / 1200) * 1.25),
  );
  const nextZoom = Math.max(zoom.value, fitScale);
  smoothViewport.value = true;
  zoom.value = nextZoom;
  pan.value = {
    x: layout.value.width * 0.44 - node.x * nextZoom,
    y: layout.value.height * 0.5 - node.y * nextZoom,
  };
  finishSmoothViewport();
}

function onWheel(event) {
  const point = svgPoint(event);
  if (!point) return;
  smoothViewport.value = false;
  setZoom(zoom.value * Math.exp(-event.deltaY * 0.0015), point);
}

function onPointerDown(event) {
  if (event.button !== 0) return;
  const point = svgPoint(event);
  if (!point) return;
  dragging.value = true;
  dragMoved.value = false;
  lastPointer.value = point;
  event.currentTarget.setPointerCapture?.(event.pointerId);
}

function onPointerMove(event) {
  if (!dragging.value || !lastPointer.value) return;
  const point = svgPoint(event);
  if (!point) return;
  const deltaX = point.x - lastPointer.value.x;
  const deltaY = point.y - lastPointer.value.y;
  if (Math.abs(deltaX) + Math.abs(deltaY) > 0.8) dragMoved.value = true;
  pan.value = {
    x: pan.value.x + deltaX,
    y: pan.value.y + deltaY,
  };
  lastPointer.value = point;
}

function onPointerUp(event) {
  dragging.value = false;
  lastPointer.value = null;
  event.currentTarget.releasePointerCapture?.(event.pointerId);
}

function edgeIsActive(edge) {
  return activePathIds.value.has(edge.from.id) && activePathIds.value.has(edge.to.id);
}

function lineageColor(index) {
  const childCount = layout.value.nodes[0]?.children.length || 0;
  const colors = childCount === 2
    ? ["#55a9dc", "#ef5350"]
    : ["#55a9dc", "#aeb2b5", "#ef5350", "#8b78cf", "#36a88c", "#e59a45"];
  return index < 0 ? palette.value.branch : colors[index % colors.length];
}

function selectNode(node) {
  if (dragMoved.value) {
    dragMoved.value = false;
    return;
  }
  emit("select", node);
  focusNode(node);
}

function selectNodeFromKeyboard(node) {
  dragMoved.value = false;
  emit("select", node);
  focusNode(node);
}

watch([normalizedStyle, () => props.spacing], resetView);
onBeforeUnmount(() => window.clearTimeout(smoothTimer));
defineExpose({ zoomIn, zoomOut, resetView, zoomPercent });
</script>

<template>
  <div
    class="art-tree-visualization"
    :class="[normalizedStyle, { paused }]"
    :style="backgroundStyle"
  >
    <svg
      ref="svg"
      :class="{ dragging }"
      :viewBox="`0 0 ${layout.width} ${layout.height}`"
      role="img"
      :aria-label="artTitle"
      preserveAspectRatio="xMidYMid meet"
      @wheel.prevent="onWheel"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @dblclick.prevent="resetView"
    >
      <title>{{ artTitle }}</title>
      <defs>
        <radialGradient :id="gradientId">
          <stop offset="0%" :stop-color="palette.glow" stop-opacity=".82" />
          <stop offset="48%" :stop-color="palette.bloom" stop-opacity=".28" />
          <stop offset="100%" :stop-color="palette.background" stop-opacity="0" />
        </radialGradient>
        <filter :id="glowId" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect class="art-background" width="100%" height="100%" rx="24" />
      <g
        class="art-viewport"
        :class="{ smooth: smoothViewport }"
        :transform="viewportTransform"
      >
        <circle
          v-if="normalizedStyle === 'crystal'"
          class="crystal-atmosphere"
          :fill="`url(#${gradientId})`"
          :cx="layout.width / 2"
          :cy="layout.height / 2"
          :r="Math.min(layout.width, layout.height) * 0.46"
        />
        <ellipse
          v-else-if="normalizedStyle === 'botanical'"
          class="botanical-ground"
          :fill="`url(#${gradientId})`"
          :cx="layout.width / 2"
          :cy="layout.height - 46"
          :rx="Math.min(layout.width * 0.38, 720)"
          ry="76"
        />

        <g :key="`${normalizedStyle}-${replayKey}`" class="animated-art">
        <g class="art-edges">
          <path
            v-for="edge in layout.edges"
            :key="edge.id"
            class="art-edge"
            :class="{
              terminal: edge.to.isLeaf,
              active: edgeIsActive(edge),
              dimmed: hasActivePath && !edgeIsActive(edge),
            }"
            :d="edge.path"
            :style="{
              '--delay': `${edge.delay}s`,
              '--lineage-color': normalizedStyle === 'lineage'
                ? lineageColor(edge.lineageIndex)
                : palette.branch,
            }"
          />
        </g>

        <g v-if="normalizedStyle === 'botanical'" class="botanical-nodes">
          <g
            v-for="node in layout.nodes"
            :key="node.id"
            class="art-node botanical-node"
            :class="{
              selected: selectedId === node.id,
              leaf: node.isLeaf,
              root: node.depth === 0,
              'path-active': activePathIds.has(node.id),
              dimmed: hasActivePath && !activePathIds.has(node.id),
            }"
            :transform="`translate(${node.x} ${node.y}) scale(${node.scale})`"
            :style="{ '--delay': `${node.delay}s` }"
            role="button"
            tabindex="0"
            :aria-label="node.label"
            @click="selectNode(node)"
            @mouseenter="hoveredId = node.id"
            @mouseleave="hoveredId = ''"
            @keydown.enter.prevent="selectNodeFromKeyboard(node)"
            @keydown.space.prevent="selectNodeFromKeyboard(node)"
          >
            <template v-if="node.isLeaf">
              <ellipse
                v-for="petal in 6"
                :key="petal"
                class="flower-petal"
                cx="0"
                cy="-13"
                rx="7"
                ry="16"
                :transform="`rotate(${petal * 60})`"
              />
              <circle class="flower-heart" r="8" />
            </template>
            <template v-else>
              <path class="leaf-shape left" d="M 0 0 C -24 -24 -40 0 -10 14 C -3 12 0 7 0 0 Z" />
              <path v-if="node.depth" class="leaf-shape right" d="M 0 0 C 24 -24 40 0 10 14 C 3 12 0 7 0 0 Z" />
              <circle class="branch-joint" :r="node.depth ? 5 : 9" />
            </template>
            <text
              v-if="showLabels || selectedId === node.id"
              class="node-label"
              y="-29"
              text-anchor="middle"
            >
              {{ node.label.slice(0, 18) }}
            </text>
          </g>
        </g>

        <g v-else-if="normalizedStyle === 'crystal'" class="crystal-nodes">
          <g
            v-for="node in layout.nodes"
            :key="node.id"
            class="art-node crystal-node"
            :class="{
              selected: selectedId === node.id,
              leaf: node.isLeaf,
              root: node.depth === 0,
              'path-active': activePathIds.has(node.id),
              dimmed: hasActivePath && !activePathIds.has(node.id),
            }"
            :transform="`translate(${node.x} ${node.y}) rotate(${node.rotation}) scale(${node.scale})`"
            :style="{ '--delay': `${node.delay}s` }"
            role="button"
            tabindex="0"
            :aria-label="node.label"
            @click="selectNode(node)"
            @mouseenter="hoveredId = node.id"
            @mouseleave="hoveredId = ''"
            @keydown.enter.prevent="selectNodeFromKeyboard(node)"
            @keydown.space.prevent="selectNodeFromKeyboard(node)"
          >
            <polygon class="crystal-halo" points="0,-26 22,-13 22,13 0,26 -22,13 -22,-13" />
            <polygon class="crystal-facet" points="0,-18 15,-8 12,14 -12,14 -15,-8" />
            <path class="crystal-shine" d="M 0 -17 L 0 13 M -14 -8 L 0 0 L 14 -8" />
            <circle v-if="node.depth === 0" class="crystal-core" r="7" :filter="`url(#${glowId})`" />
            <text
              v-if="showLabels || selectedId === node.id"
              class="node-label"
              :transform="`rotate(${-node.rotation})`"
              y="-31"
              text-anchor="middle"
            >
              {{ node.label.slice(0, 18) }}
            </text>
          </g>
        </g>

        <g v-else class="lineage-nodes">
          <g
            v-for="node in layout.nodes"
            :key="node.id"
            class="art-node lineage-node"
            :class="{
              selected: selectedId === node.id,
              leaf: node.isLeaf,
              root: node.depth === 0,
              'path-active': activePathIds.has(node.id),
              dimmed: hasActivePath && !activePathIds.has(node.id),
            }"
            :transform="`translate(${node.x} ${node.y})`"
            :style="{
              '--delay': `${node.delay}s`,
              '--lineage-color': lineageColor(node.lineageIndex),
            }"
            role="button"
            tabindex="0"
            :aria-label="node.label"
            @click="selectNode(node)"
            @mouseenter="hoveredId = node.id"
            @mouseleave="hoveredId = ''"
            @keydown.enter.prevent="selectNodeFromKeyboard(node)"
            @keydown.space.prevent="selectNodeFromKeyboard(node)"
          >
            <circle v-if="node.depth === 0" class="lineage-root-ring" r="29" />
            <circle
              class="lineage-node-core"
              :r="node.depth === 0 ? 24 : node.isLeaf ? 7 : 5"
            />
            <text
              v-if="node.depth === 0 || node.isLeaf || showLabels || selectedId === node.id"
              class="node-label lineage-label"
              :class="{ 'root-label': node.depth === 0 }"
              :y="node.depth === 0 ? 4 : -17"
              text-anchor="middle"
            >
              {{ node.label.slice(0, node.depth === 0 ? 12 : 18) }}
            </text>
          </g>
        </g>
        </g>
      </g>
    </svg>

    <p v-if="layout.truncated" class="limit-note">
      为保持动画流畅，艺术视图展示前 {{ layout.nodes.length }} 个节点。
    </p>
  </div>
</template>

<style scoped>
.art-tree-visualization {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 420px;
  overflow: hidden;
  border-radius: inherit;
  background: var(--art-background);
}

svg {
  display:block;
  width:100%;
  height:100%;
  cursor:grab;
  touch-action:none;
  user-select:none;
}
svg.dragging { cursor:grabbing; }
.art-viewport.smooth { transition:transform .44s cubic-bezier(.22,.72,.22,1); }
.art-background { fill:var(--art-background); }
.lineage .art-background { fill:#fbfcfd; }
.crystal-atmosphere { opacity:.78; }
.botanical-ground { opacity:.62; }

.art-edge {
  fill: none;
  stroke: var(--art-branch);
  stroke-linecap: round;
  stroke-width: 4;
  stroke-dasharray: 12000;
  stroke-dashoffset: 12000;
  opacity: .76;
  animation: draw-edge 1.15s cubic-bezier(.22,.72,.22,1) forwards;
  animation-delay: var(--delay);
  transition:opacity .24s ease, stroke-width .24s ease, filter .24s ease;
}

.botanical .art-edge {
  stroke-width: 7;
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--art-glow) 40%, transparent));
}

.botanical .art-edge.terminal { stroke-width:4; }
.crystal .art-edge { stroke-width:2.3; opacity:.58; }
.lineage .art-edge {
  stroke:var(--lineage-color);
  stroke-width:5;
  opacity:.9;
}
.art-edge.active {
  stroke-width:9;
  opacity:1;
  filter:drop-shadow(0 0 7px var(--art-glow));
}
.crystal .art-edge.active { stroke-width:4.5; }
.lineage .art-edge.active { stroke-width:7; filter:drop-shadow(0 0 4px var(--lineage-color)); }
.art-edge.dimmed { opacity:.12 !important; }

.art-node {
  opacity: 0;
  outline: none;
  cursor: pointer;
  transform-box: fill-box;
  transform-origin: center;
  animation: reveal-node .62s cubic-bezier(.22,.9,.34,1.2) forwards;
  animation-delay: calc(var(--delay) + .26s);
  transition:opacity .24s ease, filter .24s ease;
}
.art-node.path-active { filter:drop-shadow(0 0 9px var(--art-glow)); }
.art-node.dimmed { opacity:.15 !important; }

.animated-art :is(.art-edge,.art-node) { animation-play-state:running; }
.paused .animated-art :is(.art-edge,.art-node) { animation-play-state:paused; }

.flower-petal {
  fill: var(--art-bloom);
  stroke: color-mix(in srgb, var(--art-accent) 70%, white);
  stroke-width: 1.2;
  transition: .25s ease;
}

.flower-heart { fill:var(--art-accent); filter:drop-shadow(0 0 7px var(--art-glow)); }
.leaf-shape { fill:color-mix(in srgb, var(--art-branch) 78%, var(--art-glow)); opacity:.88; }
.leaf-shape.left { transform:rotate(-12deg); }
.leaf-shape.right { transform:rotate(12deg); }
.branch-joint { fill:var(--art-accent); }

.botanical-node:hover .flower-petal,
.botanical-node.selected .flower-petal {
  fill:color-mix(in srgb, var(--art-bloom) 64%, white);
  filter:drop-shadow(0 0 6px var(--art-bloom));
}

.crystal-halo {
  fill: color-mix(in srgb, var(--art-glow) 14%, transparent);
  stroke: color-mix(in srgb, var(--art-bloom) 48%, transparent);
  stroke-width: 1;
}

.crystal-facet {
  fill: color-mix(in srgb, var(--art-branch) 36%, transparent);
  stroke:var(--art-accent);
  stroke-width:1.5;
  filter:drop-shadow(0 0 5px color-mix(in srgb, var(--art-glow) 65%, transparent));
}

.crystal-shine { fill:none; stroke:color-mix(in srgb, white 74%, var(--art-accent)); stroke-width:.8; opacity:.78; }
.crystal-core { fill:white; }
.crystal-node:hover .crystal-facet,
.crystal-node.selected .crystal-facet { fill:color-mix(in srgb, var(--art-bloom) 54%, transparent); stroke:white; }

.lineage-node-core {
  fill:var(--lineage-color);
  stroke:#fff;
  stroke-width:3;
  transition:r .22s ease, filter .22s ease;
}
.lineage-node:not(.root):hover .lineage-node-core,
.lineage-node:not(.root).selected .lineage-node-core {
  filter:drop-shadow(0 0 7px var(--lineage-color));
  stroke:var(--lineage-color);
  stroke-width:5;
}
.lineage-root-ring {
  fill:#fff;
  stroke:#7d8993;
  stroke-width:3;
  filter:drop-shadow(0 4px 9px rgba(61,73,82,.16));
}
.lineage-node.root .lineage-node-core {
  fill:#fff;
  stroke:#fff;
}

.art-node.selected :is(.branch-joint,.flower-heart) { stroke:white; stroke-width:3; }
.node-label {
  fill:#fff;
  paint-order:stroke;
  stroke:color-mix(in srgb, var(--art-background) 88%, transparent);
  stroke-width:5px;
  stroke-linejoin:round;
  font-size:13px;
  font-weight:700;
  pointer-events:none;
}
.lineage-label {
  fill:#48535b;
  stroke:#fbfcfd;
  stroke-width:7px;
  font-size:14px;
}
.lineage-label.root-label {
  fill:#4d565d;
  stroke:none;
  font-size:11px;
  letter-spacing:.02em;
}

.limit-note {
  position:absolute;
  right:14px;
  bottom:10px;
  margin:0;
  padding:6px 9px;
  border:1px solid rgba(255,255,255,.14);
  border-radius:999px;
  background:rgba(4,12,12,.56);
  color:rgba(255,255,255,.7);
  font-size:.7rem;
  backdrop-filter:blur(8px);
}

@keyframes draw-edge { to { stroke-dashoffset:0; } }
@keyframes reveal-node {
  from { opacity:0; }
  to { opacity:1; }
}

@media (prefers-reduced-motion: reduce) {
  .art-edge,.art-node { animation-duration:.001ms; animation-delay:0s; }
}
</style>
