<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { artTreePalette, buildNebulaArtLayout } from "@/utils/artTreeLayout";

const props = defineProps({
  document: { type: Object, required: true },
  seed: { type: String, default: "" },
  replayKey: { type: Number, default: 0 },
  paused: { type: Boolean, default: false },
  showLabels: { type: Boolean, default: false },
  selectedId: { type: String, default: "" },
  spacing: { type: Number, default: 1 },
});
const emit = defineEmits(["select"]);

const container = ref(null);
const canvas = ref(null);
const hoveredId = ref("");
const tooltip = ref({ visible: false, x: 0, y: 0, label: "", depth: 0 });
const layout = computed(() =>
  buildNebulaArtLayout(props.document, { spacing: props.spacing }),
);
const palette = computed(() => artTreePalette("nebula", props.seed));

let context;
let resizeObserver;
let animationFrame;
let width = 1;
let height = 1;
let pixelRatio = 1;
let rotationX = -0.24;
let rotationY = 0.48;
let zoom = 1;
let panX = 0;
let panY = 0;
let dragging = false;
let dragMoved = false;
let pointerX = 0;
let pointerY = 0;
let lastFrameTime = 0;
let growthTime = 0;
let manualUntil = 0;
let projectedNodes = [];
let reducedMotion = false;

const prefersReducedMotion = () => reducedMotion;

function cladeColor(index) {
  const colors = [
    "#5bc8ff",
    "#ac8cff",
    "#ff8ec8",
    "#62e1af",
    "#ffc76c",
    "#789dff",
    "#ef7a78",
  ];
  return index < 0 ? palette.value.accent : colors[index % colors.length];
}

function activePathIds() {
  const ids = new Set();
  const activeId = hoveredId.value || props.selectedId;
  let node = layout.value.nodes.find((candidate) => candidate.id === activeId);
  while (node) {
    ids.add(node.id);
    node = node.parent;
  }
  return ids;
}

function resizeCanvas() {
  if (!canvas.value || !container.value) return;
  const bounds = container.value.getBoundingClientRect();
  width = Math.max(1, bounds.width);
  height = Math.max(1, bounds.height);
  pixelRatio = Math.min(2, window.devicePixelRatio || 1);
  canvas.value.width = Math.round(width * pixelRatio);
  canvas.value.height = Math.round(height * pixelRatio);
  canvas.value.style.width = `${width}px`;
  canvas.value.style.height = `${height}px`;
  context = canvas.value.getContext("2d");
}

function projectPoint(point) {
  const cosineY = Math.cos(rotationY);
  const sineY = Math.sin(rotationY);
  const cosineX = Math.cos(rotationX);
  const sineX = Math.sin(rotationX);
  const rotatedX = point.x * cosineY - point.z * sineY;
  const firstZ = point.x * sineY + point.z * cosineY;
  const rotatedY = point.y * cosineX - firstZ * sineX;
  const rotatedZ = point.y * sineX + firstZ * cosineX;
  const extent = Math.max(1, layout.value.extent);
  const cameraDistance = extent * 3.4;
  const perspective = cameraDistance / Math.max(extent * 0.8, cameraDistance - rotatedZ);
  const fitScale =
    (Math.min(width, height) / (extent * 2.45)) *
    Math.sqrt(Math.max(0.8, Math.min(2.2, Number(props.spacing) || 1)));
  const scale = fitScale * zoom * perspective;
  return {
    x: width / 2 + panX + rotatedX * scale,
    y: height / 2 + panY - rotatedY * scale,
    z: rotatedZ,
    perspective,
    scale,
  };
}

function nodeVisibility(node) {
  if (prefersReducedMotion()) return 1;
  const delay = node.delay * 170;
  return Math.max(0, Math.min(1, (growthTime - delay) / 420));
}

function drawBackground(ctx) {
  const gradient = ctx.createRadialGradient(
    width * 0.52,
    height * 0.48,
    0,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.72,
  );
  gradient.addColorStop(0, "#101d3c");
  gradient.addColorStop(0.48, palette.value.background);
  gradient.addColorStop(1, "#02040b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  for (let index = 0; index < 150; index += 1) {
    const starX = ((index * 89 + 31) % 997) / 997;
    const starY = ((index * 193 + 71) % 991) / 991;
    const radius = index % 13 === 0 ? 1.25 : index % 5 === 0 ? 0.8 : 0.45;
    ctx.globalAlpha = 0.16 + ((index * 37) % 60) / 100;
    ctx.fillStyle = index % 9 === 0 ? palette.value.glow : "#ffffff";
    ctx.beginPath();
    ctx.arc(starX * width, starY * height, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawAxes(ctx) {
  const origin = projectPoint({ x: 0, y: 0, z: 0 });
  const length = layout.value.extent * 1.08;
  const axes = [
    { point: { x: length, y: 0, z: 0 }, color: "#ef7185" },
    { point: { x: 0, y: length, z: 0 }, color: "#68d8ad" },
    { point: { x: 0, y: 0, z: length }, color: "#66a8f5" },
  ];
  ctx.save();
  ctx.setLineDash([3, 7]);
  ctx.lineWidth = 0.8;
  axes.forEach((axis) => {
    const target = projectPoint(axis.point);
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = axis.color;
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
  });
  ctx.restore();
}

function drawEdges(ctx, projectedById, pathIds) {
  const hasPath = pathIds.size > 0;
  const edges = [...layout.value.edges].sort((left, right) => {
    const leftDepth = projectedById.get(left.to.id)?.z || 0;
    const rightDepth = projectedById.get(right.to.id)?.z || 0;
    return leftDepth - rightDepth;
  });

  edges.forEach((edge) => {
    const from = projectedById.get(edge.from.id);
    const to = projectedById.get(edge.to.id);
    const visibility = nodeVisibility(edge.to);
    if (!from || !to || visibility <= 0) return;
    const active = pathIds.has(edge.from.id) && pathIds.has(edge.to.id);
    ctx.save();
    ctx.globalAlpha = visibility * (hasPath ? active ? 0.96 : 0.065 : 0.34);
    ctx.strokeStyle = active ? cladeColor(edge.lineageIndex) : palette.value.branch;
    ctx.lineWidth = active ? 2.5 : Math.max(0.55, to.perspective * 0.9);
    if (active) {
      ctx.shadowColor = cladeColor(edge.lineageIndex);
      ctx.shadowBlur = 8;
    }
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  });
}

function drawNode(ctx, projected, pathIds) {
  const { node } = projected;
  const visibility = nodeVisibility(node);
  if (visibility <= 0) return;
  const selected = props.selectedId === node.id;
  const hovered = hoveredId.value === node.id;
  const onPath = pathIds.has(node.id);
  const hasPath = pathIds.size > 0;
  const baseRadius = node.depth === 0 ? 8 : node.isLeaf ? 4.3 : 3.2;
  const radius = Math.max(1.8, baseRadius * node.scale * Math.sqrt(projected.perspective));
  const color = cladeColor(node.lineageIndex);

  ctx.save();
  ctx.globalAlpha = visibility * (hasPath && !onPath ? 0.13 : 0.92);
  ctx.fillStyle = node.depth === 0 ? palette.value.accent : color;
  ctx.shadowColor = selected || hovered || onPath ? color : palette.value.glow;
  ctx.shadowBlur = selected || hovered ? 20 : onPath ? 12 : 6;
  ctx.beginPath();
  ctx.arc(projected.x, projected.y, selected || hovered ? radius * 1.45 : radius, 0, Math.PI * 2);
  ctx.fill();
  if (selected || hovered) {
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(projected.x, projected.y, radius * 2.15, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  const showLabel =
    node.depth === 0 ||
    selected ||
    hovered ||
    (props.showLabels && (node.isLeaf || node.depth <= 2));
  if (!showLabel || (hasPath && !onPath)) return;
  const label = node.label.slice(0, 22);
  ctx.save();
  ctx.font = selected || hovered
    ? "700 13px system-ui, sans-serif"
    : "600 11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  const textWidth = ctx.measureText(label).width;
  const labelY = projected.y - radius - 7;
  ctx.globalAlpha = visibility * 0.94;
  ctx.fillStyle = "rgba(3, 7, 18, .7)";
  ctx.fillRect(projected.x - textWidth / 2 - 5, labelY - 15, textWidth + 10, 18);
  ctx.fillStyle = "#f5f8ff";
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 4;
  ctx.fillText(label, projected.x, labelY);
  ctx.restore();
}

function draw() {
  if (!context) return;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);
  drawBackground(context);
  drawAxes(context);

  projectedNodes = layout.value.nodes.map((node) => ({ node, ...projectPoint(node) }));
  const projectedById = new Map(projectedNodes.map((projected) => [projected.node.id, projected]));
  const pathIds = activePathIds();
  drawEdges(context, projectedById, pathIds);
  [...projectedNodes]
    .sort((left, right) => left.z - right.z)
    .forEach((projected) => drawNode(context, projected, pathIds));
}

function animate(time) {
  const delta = lastFrameTime ? Math.min(40, time - lastFrameTime) : 16;
  lastFrameTime = time;
  if (!props.paused) {
    growthTime += delta;
    if (!dragging && !prefersReducedMotion() && time > manualUntil) {
      rotationY += delta * 0.000025;
    }
  }
  draw();
  animationFrame = window.requestAnimationFrame(animate);
}

function localPoint(event) {
  const bounds = canvas.value.getBoundingClientRect();
  return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
}

function nearestNode(point) {
  let nearest = null;
  let nearestDistance = 17 * 17;
  projectedNodes.forEach((projected) => {
    if (nodeVisibility(projected.node) <= 0) return;
    const distance =
      (projected.x - point.x) ** 2 +
      (projected.y - point.y) ** 2;
    if (distance < nearestDistance) {
      nearest = projected;
      nearestDistance = distance;
    }
  });
  return nearest;
}

function updateHover(event) {
  const point = localPoint(event);
  const nearest = nearestNode(point);
  hoveredId.value = nearest?.node.id || "";
  canvas.value.style.cursor = nearest ? "pointer" : dragging ? "grabbing" : "grab";
  tooltip.value = nearest
    ? {
        visible: true,
        x: Math.min(width - 130, Math.max(12, point.x + 14)),
        y: Math.min(height - 62, Math.max(12, point.y + 14)),
        label: nearest.node.label,
        depth: nearest.node.depth,
      }
    : { ...tooltip.value, visible: false };
}

function onPointerDown(event) {
  if (event.button !== 0) return;
  const point = localPoint(event);
  dragging = true;
  dragMoved = false;
  pointerX = point.x;
  pointerY = point.y;
  manualUntil = performance.now() + 5000;
  canvas.value.setPointerCapture?.(event.pointerId);
}

function onPointerMove(event) {
  const point = localPoint(event);
  if (!dragging) {
    updateHover(event);
    return;
  }
  const deltaX = point.x - pointerX;
  const deltaY = point.y - pointerY;
  if (Math.abs(deltaX) + Math.abs(deltaY) > 1) dragMoved = true;
  rotationY += deltaX * 0.006;
  rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationX + deltaY * 0.006));
  pointerX = point.x;
  pointerY = point.y;
  tooltip.value = { ...tooltip.value, visible: false };
  canvas.value.style.cursor = "grabbing";
}

function onPointerUp(event) {
  const point = localPoint(event);
  dragging = false;
  canvas.value.releasePointerCapture?.(event.pointerId);
  canvas.value.style.cursor = "grab";
  if (!dragMoved) {
    const nearest = nearestNode(point);
    if (nearest) {
      emit("select", nearest.node);
      focusNode(nearest.node);
    }
  }
}

function onPointerCancel(event) {
  dragging = false;
  dragMoved = false;
  tooltip.value = { ...tooltip.value, visible: false };
  canvas.value.releasePointerCapture?.(event.pointerId);
  canvas.value.style.cursor = "grab";
}

function onPointerLeave() {
  if (!dragging) {
    hoveredId.value = "";
    tooltip.value = { ...tooltip.value, visible: false };
  }
}

function onWheel(event) {
  zoom = Math.max(0.55, Math.min(5, zoom * Math.exp(-event.deltaY * 0.0014)));
  manualUntil = performance.now() + 5000;
}

function focusNode(node) {
  zoom = Math.max(1.55, zoom);
  const projected = projectPoint(node);
  panX += width * 0.43 - projected.x;
  panY += height * 0.5 - projected.y;
  manualUntil = performance.now() + 7000;
}

function zoomIn() {
  zoom = Math.min(5, zoom * 1.28);
  manualUntil = performance.now() + 5000;
}

function zoomOut() {
  zoom = Math.max(0.55, zoom / 1.28);
  manualUntil = performance.now() + 5000;
}

function resetView() {
  rotationX = -0.24;
  rotationY = 0.48;
  zoom = 1;
  panX = 0;
  panY = 0;
  manualUntil = performance.now() + 2500;
}

function onKeydown(event) {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    rotationY += event.key === "ArrowLeft" ? -0.12 : 0.12;
  } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    event.preventDefault();
    rotationX = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, rotationX + (event.key === "ArrowUp" ? -0.12 : 0.12)),
    );
  } else if (event.key === "+" || event.key === "=") {
    zoomIn();
  } else if (event.key === "-") {
    zoomOut();
  } else if (event.key === "Home") {
    resetView();
  }
  manualUntil = performance.now() + 5000;
}

watch(
  [layout, () => props.replayKey],
  () => {
    growthTime = 0;
    hoveredId.value = "";
    resetView();
  },
);

onMounted(() => {
  reducedMotion = Boolean(
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
  resizeObserver = new ResizeObserver(resizeCanvas);
  resizeObserver.observe(container.value);
  resizeCanvas();
  animationFrame = window.requestAnimationFrame(animate);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  window.cancelAnimationFrame(animationFrame);
});

defineExpose({ zoomIn, zoomOut, resetView });
</script>

<template>
  <div ref="container" class="hierarchical-nebula">
    <canvas
      ref="canvas"
      tabindex="0"
      role="img"
      aria-label="三维层级星云进化树；拖拽旋转，滚轮缩放，点击节点查看内容"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
      @pointerleave="onPointerLeave"
      @wheel.prevent="onWheel"
      @dblclick.prevent="resetView"
      @keydown="onKeydown"
    ></canvas>

    <div
      v-if="tooltip.visible"
      class="nebula-tooltip"
      :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
    >
      <strong>{{ tooltip.label }}</strong>
      <span>层级 {{ tooltip.depth + 1 }}</span>
    </div>

    <p v-if="layout.truncated" class="limit-note">
      为保持三维浏览流畅，当前显示前 {{ layout.nodes.length }} 个节点。
    </p>
  </div>
</template>

<style scoped>
.hierarchical-nebula {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 420px;
  overflow: hidden;
  background: #050817;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  outline: none;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

canvas:focus-visible {
  box-shadow: inset 0 0 0 2px rgba(99, 217, 255, 0.72);
}

.nebula-tooltip {
  position: absolute;
  z-index: 4;
  display: grid;
  max-width: 210px;
  gap: 2px;
  padding: 8px 10px;
  border: 1px solid rgba(167, 211, 255, 0.24);
  border-radius: 8px;
  background: rgba(5, 9, 24, 0.82);
  color: #f3f7ff;
  font-size: 0.74rem;
  pointer-events: none;
  backdrop-filter: blur(10px);
}

.nebula-tooltip strong {
  overflow: hidden;
  font-size: 0.8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nebula-tooltip span {
  color: #98aacb;
  font-size: 0.66rem;
}

.limit-note {
  position: absolute;
  right: 14px;
  bottom: 10px;
  margin: 0;
  padding: 6px 9px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: rgba(3, 6, 17, 0.66);
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.7rem;
  backdrop-filter: blur(8px);
}
</style>
