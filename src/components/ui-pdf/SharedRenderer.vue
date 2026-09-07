<script setup>
/**
 * SharedRenderer —— 编辑器 + PDF 导出共用的渲染器
 * ------------------------------------------------------------------
 * 职责：
 *   1. 接收 doc（v2 Document 对象）和 themeId
 *   2. 按 Page → Layout/Region → Component 顺序渲染
 *   3. 把每个组件都交给 ComponentRenderer 子组件去渲染
 *
 * Editor Renderer 和 Playwright PDF Renderer 共用这一个文件。
 * 两端输出的 DOM 结构、inline style 完全一致，因此视觉效果 100% 对齐。
 */
import { computed } from "vue";
import ComponentRenderer from "./ComponentRenderer.vue";
import { buildTheme } from "@/utils/ui-pdf/themes.js";
import {
  collectPageComponents,
  pageMetricsPx,
  mmToPx,
} from "@/utils/ui-pdf/documentModel.js";

const props = defineProps({
  doc: { type: Object, required: true },
  themeId: { type: String, default: "academic" },
  themeOverrides: { type: Object, default: null },
  interactive: { type: Boolean, default: false },
  selectedBlockId: { type: String, default: "" },
  pageFilter: { type: Array, default: null }, // [pageId...] 只渲染某几页；null=全部
});
const emit = defineEmits(["block-click", "content-patch"]);

const theme = computed(() => {
  let t = buildTheme(props.themeId || "academic");
  if (props.themeOverrides && typeof props.themeOverrides === "object") {
    t = { ...t, ...props.themeOverrides };
  }
  return t;
});
const pagesToRender = computed(() => {
  return Array.isArray(props.pageFilter) && props.pageFilter.length
    ? props.doc.pages.filter((p) => props.pageFilter.includes(p.id))
    : props.doc.pages;
});

function metrics(page) {
  return pageMetricsPx(page);
}
function pageData(pageId) {
  return collectPageComponents(props.doc, pageId);
}

function backgroundStyle(page) {
  const bg = page.background || { type: "solid", value: "#FFFFFF" };
  if (bg.type === "image")
    return { background: `url(${bg.value}) center/cover no-repeat` };
  if (bg.type === "gradient")
    return {
      background: bg.value || bg.css || "linear-gradient(180deg,#fff,#f6f8f6)",
    };
  return { backgroundColor: bg.value || "#FFFFFF" };
}
function layoutVars(page) {
  switch (page.layout) {
    case "two-column":
      return {
        "--body-cols": "minmax(0,1fr) minmax(0,1fr)",
        "--body-gap": `${mmToPx(7)}px`,
      };
    case "three-column":
      return {
        "--body-cols": "repeat(3, minmax(0,1fr))",
        "--body-gap": `${mmToPx(5)}px`,
      };
    case "left-sidebar":
      return {
        "--body-cols": `${mmToPx(38)}px minmax(0,1fr)`,
        "--body-gap": `${mmToPx(7)}px`,
      };
    case "right-sidebar":
      return {
        "--body-cols": `minmax(0,1fr) ${mmToPx(38)}px`,
        "--body-gap": `${mmToPx(7)}px`,
      };
    case "full-width":
      return { "--body-cols": "minmax(0,1fr)" };
    case "single":
    default:
      return { "--body-cols": "minmax(0,1fr)" };
  }
}

function onBlockClick(componentId, event) {
  if (!props.interactive) return;
  if (event && event.stopPropagation) event.stopPropagation();
  emit("block-click", componentId);
}
function onContentPatch(e) {
  emit("content-patch", e);
}
function replacePageVars(value, pageIndex, totalPages) {
  return String(value || "")
    .replace(/\{page\}/g, String(pageIndex + 1))
    .replace(/\{total\}/g, String(totalPages));
}

const rootCssVars = computed(() => ({
  "--sr-primary": theme.value.variables.primaryColor,
  "--sr-secondary": theme.value.variables.secondaryColor,
  "--sr-paper": theme.value.variables.paperColor,
  "--sr-ink": theme.value.variables.inkColor,
  "--sr-muted": theme.value.variables.mutedColor,
  "--sr-rule": theme.value.variables.ruleColor,
  "--sr-font": (theme.value.variables.font || []).join(", "),
  "--sr-heading-font": (theme.value.variables.headingFont || []).join(", "),
  "--sr-body-font": (theme.value.variables.bodyFont || []).join(", "),
}));
</script>

<template>
  <div
    class="shared-renderer"
    :class="{ 'is-editable': interactive }"
    :style="rootCssVars"
  >
    <section
      v-for="(page, pageIndex) in pagesToRender"
      :key="page.id"
      class="sr-page"
      :class="[
        `sr-layout-${page.layout}`,
        { 'sr-page-cover': page.type === 'cover' },
      ]"
      :style="{
        width: `${metrics(page).width}px`,
        height: `${metrics(page).height}px`,
        paddingTop: `${metrics(page).margin.top}px`,
        paddingRight: `${metrics(page).margin.right}px`,
        paddingBottom: `${metrics(page).margin.bottom}px`,
        paddingLeft: `${metrics(page).margin.left}px`,
        boxSizing: 'border-box',
        ...backgroundStyle(page),
        ...layoutVars(page),
      }"
    >
      <!-- ===== 页眉 ===== -->
      <header
        v-if="page.header.enabled"
        class="sr-header"
        :class="page.header.style || 'hairline'"
      >
        <template v-if="pageData(page.id)?.regions?.header?.length">
          <ComponentRenderer
            v-for="c in pageData(page.id).regions.header"
            :key="c.id"
            :component="c"
            :theme="theme"
            :interactive="interactive"
            :editable="interactive"
            :selected="selectedBlockId === c.id"
            @block-click="(id) => onBlockClick(id, $event)"
            @content-patch="onContentPatch"
          />
        </template>
        <template v-else>
          <span class="sr-header-label">{{ doc.meta.title || "" }}</span>
          <small v-if="page.header.content">{{ page.header.content }}</small>
        </template>
      </header>

      <!-- ===== 主体 Body ===== -->
      <div class="sr-body">
        <aside
          v-if="
            (page.layout === 'left-sidebar' ||
              page.layout === 'right-sidebar') &&
            pageData(page.id)?.regions?.sidebar
          "
          class="sr-sidebar"
        >
          <ComponentRenderer
            v-for="c in pageData(page.id).regions.sidebar"
            :key="c.id"
            :component="c"
            :theme="theme"
            :interactive="interactive"
            :editable="interactive"
            :selected="selectedBlockId === c.id"
            @block-click="(id) => onBlockClick(id, $event)"
            @content-patch="onContentPatch"
          />
        </aside>
        <main
          class="sr-main"
          :class="[
            page.layout === 'two-column' ? 'sr-cols-2' : '',
            page.layout === 'three-column' ? 'sr-cols-3' : '',
          ]"
        >
          <ComponentRenderer
            v-for="c in pageData(page.id)?.regions?.main || []"
            :key="c.id"
            :component="c"
            :theme="theme"
            :interactive="interactive"
            :editable="interactive"
            :selected="selectedBlockId === c.id"
            @block-click="(id) => onBlockClick(id, $event)"
            @content-patch="onContentPatch"
          />
        </main>
      </div>

      <!-- ===== 页脚 ===== -->
      <footer
        v-if="page.footer.enabled"
        class="sr-footer"
        :class="page.footer.rule || 'hairline'"
      >
        <template v-if="pageData(page.id)?.regions?.footer?.length">
          <ComponentRenderer
            v-for="c in pageData(page.id).regions.footer"
            :key="c.id"
            :component="c"
            :theme="theme"
            :interactive="interactive"
            :editable="interactive"
            :selected="selectedBlockId === c.id"
            @block-click="(id) => onBlockClick(id, $event)"
            @content-patch="onContentPatch"
          />
        </template>
        <template v-else>
          <span class="sr-footer-left">{{
            replacePageVars(page.footer.left, pageIndex, pagesToRender.length)
          }}</span>
          <span class="sr-footer-center">{{
            replacePageVars(page.footer.center, pageIndex, pagesToRender.length)
          }}</span>
          <span class="sr-footer-right">{{
            replacePageVars(page.footer.right, pageIndex, pagesToRender.length)
          }}</span>
        </template>
      </footer>
    </section>
  </div>
</template>

<style>
/* 纯结构样式；视觉决策全部来自组件 inline style */
.shared-renderer {
  display: grid;
  justify-items: center;
  gap: 28px;
  color: var(--sr-ink);
  font-family: var(--sr-body-font);
}

.sr-page {
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  break-after: page;
  page-break-after: always;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.02);
}
.sr-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 28px;
  margin-bottom: 10px;
}
.sr-header.hairline {
  border-bottom: 1px solid var(--sr-rule);
}
.sr-header.band {
  background: color-mix(in srgb, var(--sr-primary) 8%, transparent);
  padding: 4px 8px;
  border-radius: 3px;
}
.sr-header-label {
  color: var(--sr-primary);
  font-size: 8pt;
  font-weight: 750;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sr-body {
  display: grid;
  grid-template-columns: var(--body-cols, minmax(0, 1fr));
  gap: var(--body-gap, 0);
  min-height: 0;
}
.sr-sidebar {
  min-width: 0;
  overflow: hidden;
}
.sr-main {
  min-width: 0;
}
.sr-main.sr-cols-2 {
  column-count: 2;
  column-gap: 30px;
}
.sr-main.sr-cols-3 {
  column-count: 3;
  column-gap: 22px;
}

.sr-footer {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 10px;
  align-items: center;
  min-height: 26px;
  padding-top: 6px;
  border-top: 1px solid var(--sr-rule);
  color: var(--sr-muted);
  font-size: 7.5pt;
}
.sr-footer-right {
  text-align: right;
}
.sr-footer-center {
  text-align: center;
}

.sr-comp-selected {
  outline: 1px dashed color-mix(in srgb, var(--sr-primary) 70%, transparent);
  outline-offset: 2px;
  border-radius: 2px;
  cursor: pointer;
}
.sr-comp {
  break-inside: avoid-page;
}

/* =========================================================
 * 编辑态（is-editable）专用 CSS —— 仅编辑器存在，PDF/打印路径没有这些类
 * =======================================================*/
.shared-renderer.is-editable .sr-comp:hover {
  outline: 1px dashed color-mix(in srgb, var(--sr-primary) 35%, transparent);
  outline-offset: 2px;
  border-radius: 2px;
}
.shared-renderer.is-editable .sr-editable {
  cursor: text;
}
.shared-renderer.is-editable .sr-editable:focus {
  outline: 2px solid color-mix(in srgb, var(--sr-primary) 55%, transparent);
  outline-offset: 2px;
  border-radius: 2px;
}
/* 空内容占位提示（仅编辑态显示，内容非空自动消失） */
.shared-renderer.is-editable .sr-editable:empty::before {
  content: attr(data-ph);
  opacity: 0.35;
  pointer-events: none;
}
.shared-renderer.is-editable .sr-editable-rich:empty {
  min-height: 1.4em;
}
.shared-renderer.is-editable .sr-editable-rich:focus {
  min-height: 1.4em;
}

@media print {
  .shared-renderer {
    gap: 0;
  }
  .sr-page {
    box-shadow: none;
  }
}
</style>
