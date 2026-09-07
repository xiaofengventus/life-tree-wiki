<script setup>
/**
 * UI-PDF v2 主编辑器壳子
 * ------------------------------------------------------------------
 * 三栏布局 + 顶部工具栏：
 *   ┌──────────────────────── 顶部 Toolbar（主题/页面/导出）───────────────────────────┐
 *   │ 组件调色板 (240px)  │    画布 (SharedRenderer 自适应)   │  属性面板 (360px)       │
 *   │  6 大类 30 组件     │   每页 = A4 画布, 支持选中高亮    │  Content + Style 七维度 │
 *   └─────────────────────────────────────────────────────────────────────────────────┘
 *
 * Editor 和 Playwright 两端的视觉一致性：
 *   两者都把相同的 Style JSON → 同一套 CSS Generator → inline style。
 *   本文件只负责编辑器的交互壳子，不负责组件实际渲染逻辑。
 */
import {
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  onUnmounted,
  nextTick,
  h,
} from "vue";
import SharedRenderer from "./SharedRenderer.vue";
import {
  createDocument,
  createComponent,
  addPage,
  removePage,
  movePage,
  insertComponent,
  removeComponent,
  updateComponentContent,
  updateComponentStyle,
  resetComponentStyle,
  findComponentLocation,
  serializeDocument,
  normalizeDocument,
  mmToPx,
  legacyBlocksToComponents,
} from "@/utils/ui-pdf/documentModel.js";
import {
  listThemePresets,
  buildTheme,
  getComponentDefaultStyle,
  resolveComponentStyle,
  themeToCssVariables,
} from "@/utils/ui-pdf/themes.js";
import { styleToCssMap, mergeStyles } from "@/utils/ui-pdf/styleGenerator.js";

/* =========================================================
 *  基础 reactive 状态
 * =======================================================*/
const THEME_PRESETS = listThemePresets();
const PAGE_TYPES = [
  { id: "cover", label: "封面" },
  { id: "home", label: "首页" },
  { id: "toc", label: "目录" },
  { id: "content", label: "正文" },
  { id: "media", label: "图文页" },
  { id: "data", label: "数据页" },
  { id: "quote", label: "引用页" },
  { id: "blank", label: "空白页" },
];
const LAYOUTS = [
  { id: "single", label: "单栏" },
  { id: "two-column", label: "双栏" },
  { id: "left-sidebar", label: "左栏+主栏" },
  { id: "right-sidebar", label: "主栏+右栏" },
  { id: "three-column", label: "三栏" },
  { id: "full-width", label: "全宽" },
  { id: "custom", label: "自定义" },
];
const PAGE_SIZE_NAMES = ["A4", "A5", "Letter"];
const COMPONENT_PALETTE_GROUPS = [
  {
    groupKey: "basic",
    name: "基础组件",
    items: [
      { type: "text", label: "Text", icon: "T" },
      { type: "heading", label: "Heading", icon: "H", level: 2 },
      { type: "image", label: "Image", icon: "🖼" },
      { type: "divider", label: "Divider", icon: "―" },
      { type: "spacer", label: "Spacer", icon: "↕" },
    ],
  },
  {
    groupKey: "content",
    name: "内容组件",
    items: [
      { type: "paragraph", label: "Paragraph", icon: "¶" },
      { type: "quote", label: "Quote", icon: "❝" },
      { type: "list", label: "List", icon: "☰" },
      { type: "table", label: "Table", icon: "▦" },
      { type: "code", label: "Code", icon: "{ }" },
      { type: "link", label: "Link", icon: "🔗" },
    ],
  },
  {
    groupKey: "article",
    name: "文章组件",
    items: [
      { type: "articleTitle", label: "Article Title", icon: "A" },
      { type: "subtitle", label: "Subtitle", icon: "S" },
      { type: "author", label: "Author", icon: "✍" },
      { type: "date", label: "Date", icon: "📅" },
      { type: "toc", label: "TOC", icon: "≡" },
      { type: "footnote", label: "Footnote", icon: "⁎" },
      { type: "pageNumber", label: "Page No.", icon: "#" },
    ],
  },
  {
    groupKey: "info",
    name: "信息组件",
    items: [
      { type: "callout", label: "Callout", icon: "💬" },
      { type: "warning", label: "Warning", icon: "⚠" },
      { type: "tip", label: "Tip", icon: "💡" },
      { type: "info", label: "Info", icon: "ℹ" },
      { type: "notice", label: "Notice", icon: "❗" },
    ],
  },
  {
    groupKey: "layout",
    name: "布局组件",
    items: [
      { type: "container", label: "Container", icon: "▢" },
      { type: "columns", label: "Columns", icon: "⊟" },
      { type: "sidebar", label: "Sidebar", icon: "◧" },
      { type: "card", label: "Card", icon: "▣" },
      { type: "grid", label: "Grid", icon: "▦" },
    ],
  },
  {
    groupKey: "picture",
    name: "图片增强",
    items: [{ type: "picture", label: "Picture", icon: "🖼" }],
  },
];
/* Style 七个维度在属性面板里展示的常见字段（精简覆盖高频，不做全字段 form） */
const STYLE_DIMENSIONS = [
  {
    key: "typography",
    name: "排版",
    fields: [
      {
        k: "fontFamily",
        label: "字体",
        type: "text",
        placeholder: 'e.g. "PingFang SC", sans-serif',
      },
      { k: "fontSize", label: "字号 px", type: "number" },
      {
        k: "fontWeight",
        label: "粗细",
        type: "number",
        min: 100,
        max: 900,
        step: 100,
      },
      {
        k: "lineHeight",
        label: "行高",
        type: "text",
        placeholder: "1.6 / 24px",
      },
      {
        k: "letterSpacing",
        label: "字间距",
        type: "text",
        placeholder: "0 / 0.5px",
      },
      {
        k: "textAlign",
        label: "对齐",
        type: "select",
        options: ["(继承)", "left", "center", "right", "justify"],
      },
    ],
  },
  {
    key: "color",
    name: "颜色",
    fields: [
      { k: "textColor", label: "文字色", type: "color" },
      { k: "backgroundColor", label: "背景", type: "color" },
      { k: "accentColor", label: "强调色", type: "color" },
      { k: "mutedColor", label: "次要色", type: "color" },
    ],
  },
  {
    key: "border",
    name: "边框",
    fields: [
      {
        k: "type",
        label: "线型",
        type: "select",
        options: ["(继承)", "solid", "dashed", "dotted", "none"],
      },
      { k: "width", label: "宽度 px", type: "number", min: 0 },
      { k: "color", label: "颜色", type: "color" },
      { k: "borderRadius", label: "圆角 px", type: "number", min: 0 },
    ],
  },
  {
    key: "shadow",
    name: "阴影",
    fields: [
      {
        k: "boxShadow",
        label: "box-shadow",
        type: "text",
        placeholder: "0 1px 4px rgba(0,0,0,.08)",
      },
      {
        k: "textShadow",
        label: "text-shadow",
        type: "text",
        placeholder: "0 1px 0 rgba(0,0,0,.1)",
      },
    ],
  },
  {
    key: "spacing",
    name: "间距",
    fields: [
      { k: "marginTop", label: "margin-top", type: "number" },
      { k: "marginRight", label: "margin-right", type: "number" },
      { k: "marginBottom", label: "margin-bottom", type: "number" },
      { k: "marginLeft", label: "margin-left", type: "number" },
      { k: "paddingTop", label: "padding-top", type: "number" },
      { k: "paddingRight", label: "padding-right", type: "number" },
      { k: "paddingBottom", label: "padding-bottom", type: "number" },
      { k: "paddingLeft", label: "padding-left", type: "number" },
    ],
  },
  {
    key: "shape",
    name: "形状",
    fields: [
      {
        k: "display",
        label: "display",
        type: "select",
        options: [
          "(继承)",
          "block",
          "inline-block",
          "flex",
          "inline-flex",
          "grid",
          "none",
        ],
      },
      {
        k: "overflow",
        label: "overflow",
        type: "select",
        options: ["(继承)", "visible", "hidden", "scroll", "auto"],
      },
      {
        k: "opacity",
        label: "opacity 0~1",
        type: "number",
        min: 0,
        max: 1,
        step: 0.05,
      },
    ],
  },
  {
    key: "position",
    name: "定位/尺寸",
    fields: [
      {
        k: "position",
        label: "position",
        type: "select",
        options: [
          "(继承)",
          "static",
          "relative",
          "absolute",
          "fixed",
          "sticky",
        ],
      },
      {
        k: "width",
        label: "宽",
        type: "text",
        placeholder: "100% / 240px / auto",
      },
      { k: "height", label: "高", type: "text", placeholder: "auto / 120px" },
      { k: "top", label: "top", type: "text", placeholder: "0 / 12px" },
      { k: "right", label: "right", type: "text" },
      { k: "bottom", label: "bottom", type: "text" },
      { k: "left", label: "left", type: "text" },
      { k: "zIndex", label: "z-index", type: "number" },
    ],
  },
];

/* ---------- 文档状态 ---------- */
const doc = reactive(
  normalizeDocument(createDocument("我的第一篇排版文档", "academic")),
);
const themeId = ref(doc.theme.id || "academic");
const selectedBlockId = ref("");
const currentPageId = computed(() => doc.pages[0]?.id || "");
const currentRegionName = ref("main"); // 调色板点击插入时默认插到哪个 region
const theme = computed(() => buildTheme(themeId.value));
const showExportPanel = ref(false);
const rawStyleJsonText = ref(""); // 高级：用户手动编辑 style JSON
const rawStyleJsonError = ref("");
const importJsonText = ref("");
const showImportPanel = ref(false);

/* ---------- 选中组件的 computed ---------- */
const selectedComponent = computed(() =>
  selectedBlockId.value ? doc.components[selectedBlockId.value] : null,
);
const selectedLocation = computed(() =>
  selectedBlockId.value
    ? findComponentLocation(doc, selectedBlockId.value)
    : null,
);
const selectedResolvedStyle = computed(() =>
  selectedComponent.value
    ? resolveComponentStyle(theme.value, selectedComponent.value)
    : {},
);

/* =========================================================
 *  Watch：doc.theme.id <-> themeId 双向同步（手动切换主题）
 * =======================================================*/
watch(themeId, (val) => {
  if (doc.theme?.id !== val) doc.theme.id = val;
  // 主题切换后，标记了 styleOverridden=false 的组件会自动由 SharedRenderer / Renderer
  // 在 resolveComponentStyle 时跟随新主题的 componentDefaults，不用改数据本身。
});

/* =========================================================
 *  顶部工具栏 —— 页面级操作
 * =======================================================*/
function doAddPage(type = "content") {
  addPage(doc, { type });
}
function doRemovePage(pageId) {
  if (!confirm("确定要删除这一页吗？该页内所有组件会一并删除。")) return;
  const wasCurrent = pageId === currentPageId.value;
  removePage(doc, pageId);
  if (wasCurrent) selectedBlockId.value = "";
}
function doMovePage(pageId, dir) {
  const idx = doc.pages.findIndex((p) => p.id === pageId);
  if (idx < 0) return;
  movePage(doc, pageId, idx + dir);
}
function doChangePageType(page, newType) {
  page.type = newType;
  if (newType === "cover") {
    page.header.enabled = false;
    page.footer.enabled = false;
    page.showPageNumber = false;
  }
}
function doChangePageSize(page, sizeName) {
  const size = PAGE_SIZES_MM()[sizeName] || { width: 210, height: 297 };
  page.pageSize = { name: sizeName, width: size.width, height: size.height };
}
function PAGE_SIZES_MM() {
  return {
    A4: { width: 210, height: 297 },
    A5: { width: 148, height: 210 },
    Letter: { width: 215.9, height: 279.4 },
  };
}
function doToggleOrientation(page) {
  const was = page.orientation;
  page.orientation = was === "landscape" ? "portrait" : "landscape";
  const w = page.pageSize.width;
  page.pageSize.width = page.pageSize.height;
  page.pageSize.height = w;
}

/* =========================================================
 *  组件调色板 —— 点击后插入到当前页 currentRegionName
 * =======================================================*/
function onPaletteClick(item) {
  const pageId = currentPageId.value;
  if (!pageId) {
    doAddPage("content");
  }
  const targetPageId = currentPageId.value;
  const extras = {};
  if (item.level) extras.level = item.level;
  const comp = createComponent(item.type, extras);
  insertComponent(doc, targetPageId, currentRegionName.value, comp);
  // 插入后自动选中，让用户在右侧面板立即编辑
  selectedBlockId.value = comp.id;
}

/* =========================================================
 *  Canvas 交互
 * =======================================================*/
function onBlockClick(componentId) {
  selectedBlockId.value = componentId;
  nextTick(() => {
    rawStyleJsonText.value = "";
    rawStyleJsonError.value = "";
  });
}
function onDeleteSelected() {
  if (!selectedComponent.value || !selectedLocation.value) return;
  const { pageId, regionName } = selectedLocation.value;
  removeComponent(doc, pageId, regionName, selectedComponent.value.id);
  selectedBlockId.value = "";
}

/* =========================================================
 *  画布内直接编辑（所见即所得）
 *  ComponentRenderer 的 v-edit 指令在用户输入时发 content-patch，
 *  经 SharedRenderer 冒泡到这里，直接回写文档数据。
 * =======================================================*/
function onCanvasContentPatch({ id, patch }) {
  updateComponentContent(doc, id, patch);
}

/* 全局快捷键：选中组件后按 Delete / Backspace 删除（正在输入文字时不触发） */
function onGlobalKeydown(e) {
  if (!selectedBlockId.value) return;
  if (e.key !== "Delete" && e.key !== "Backspace") return;
  const t = e.target;
  if (
    t &&
    (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))
  )
    return;
  e.preventDefault();
  onDeleteSelected();
}
onMounted(() => window.addEventListener("keydown", onGlobalKeydown));
onUnmounted(() => window.removeEventListener("keydown", onGlobalKeydown));

/* =========================================================
 *  右侧属性面板 —— Content 编辑（按组件类型分发）
 * =======================================================*/
/* 通用：更新组件 content 的某字段 */
function patchContent(key, value) {
  if (!selectedComponent.value) return;
  updateComponentContent(doc, selectedComponent.value.id, { [key]: value });
}
/* HTML 类组件用 contenteditable：同步 innerHTML 到 .html 字段 */
function syncContenteditable(evt, key = "html") {
  patchContent(key, evt.currentTarget.innerHTML);
}
/* Table：动态增删行列 */
function tblAddRow(before = -1) {
  if (!selectedComponent.value) return;
  const t = selectedComponent.value.content;
  const cols = (t.rows?.[0] || []).length || 1;
  const row = Array.from({ length: cols }, () => "");
  if (before < 0) t.rows.push(row);
  else t.rows.splice(before, 0, row);
  updateComponentContent(doc, selectedComponent.value.id, { rows: t.rows });
}
function tblAddCol(before = -1) {
  if (!selectedComponent.value) return;
  const t = selectedComponent.value.content;
  for (let i = 0; i < t.rows.length; i++) {
    if (before < 0) t.rows[i].push("");
    else t.rows[i].splice(before, 0, "");
  }
  updateComponentContent(doc, selectedComponent.value.id, { rows: t.rows });
}
function tblRemoveRow(idx) {
  if (!selectedComponent.value) return;
  const t = selectedComponent.value.content;
  if (t.rows.length <= 1) return;
  t.rows.splice(idx, 1);
  updateComponentContent(doc, selectedComponent.value.id, { rows: t.rows });
}
function tblRemoveCol(idx) {
  if (!selectedComponent.value) return;
  const t = selectedComponent.value.content;
  if ((t.rows[0]?.length || 0) <= 1) return;
  for (let i = 0; i < t.rows.length; i++) t.rows[i].splice(idx, 1);
  updateComponentContent(doc, selectedComponent.value.id, { rows: t.rows });
}
function tblPatchCell(r, c, value) {
  if (!selectedComponent.value) return;
  const t = selectedComponent.value.content;
  t.rows[r][c] = value;
  updateComponentContent(doc, selectedComponent.value.id, { rows: t.rows });
}

/* =========================================================
 *  右侧属性面板 —— Style 编辑
 * =======================================================*/
/**
 * 把 {typography:{fontSize:18}, color:{textColor:"#F00"}} 形式的 stylePatch
 * 合并到选中组件的 style 对象，并触发 updateComponentStyle（会把 styleOverridden=true）。
 */
function patchStyleDimension(dimKey, fieldKey, value) {
  if (!selectedComponent.value) return;
  // "(继承)" 选择 → 删除这个字段
  const shouldClear =
    value === "(继承)" ||
    value === "" ||
    value === null ||
    value === undefined ||
    (typeof value === "number" && Number.isNaN(value));
  const dim = selectedComponent.value.style?.[dimKey]
    ? { ...selectedComponent.value.style[dimKey] }
    : {};
  if (shouldClear) delete dim[fieldKey];
  else dim[fieldKey] = value;
  const patch = {};
  // 如果整个 dim 都空了，就把 dimKey 删掉
  if (Object.keys(dim).length === 0) patch[dimKey] = undefined;
  else patch[dimKey] = dim;
  updateComponentStyle(doc, selectedComponent.value.id, patch);
}
/* 读取某个字段当前的 "手动值"（取不到说明未手动覆盖，让 input 空着，表示跟随主题） */
function manualStyleValue(dimKey, fieldKey) {
  if (!selectedComponent.value) return undefined;
  return selectedComponent.value.style?.[dimKey]?.[fieldKey];
}
/* 读取某个字段当前的 "实际值"（合并了主题），用于展示提示 / color picker 默认色 */
function effectiveStyleCss(cssKey) {
  const map = styleToCssMap(selectedResolvedStyle.value);
  return map[cssKey] || "";
}
/* 重置 style 回主题默认 */
function doResetStyle() {
  if (!selectedComponent.value) return;
  resetComponentStyle(doc, selectedComponent.value.id, theme.value);
  rawStyleJsonText.value = "";
  rawStyleJsonError.value = "";
}
/* 高级：raw JSON 粘贴 style */
function applyRawStyleJson() {
  rawStyleJsonError.value = "";
  if (!selectedComponent.value) return;
  try {
    const parsed = JSON.parse(rawStyleJsonText.value || "{}");
    if (!parsed || typeof parsed !== "object")
      throw new Error("style 必须是对象");
    // 整体替换（merge 也可以，但用户手动粘贴 JSON 通常想整体覆盖）
    selectedComponent.value.style = parsed;
    selectedComponent.value.styleOverridden = true;
  } catch (e) {
    rawStyleJsonError.value = e.message;
  }
}
function dumpStyleToRawEditor() {
  rawStyleJsonText.value = JSON.stringify(
    selectedComponent.value?.style || {},
    null,
    2,
  );
  rawStyleJsonError.value = "";
}

/* =========================================================
 *  导入 / 导出
 * =======================================================*/
function downloadText(filename, text, mime = "application/json") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportJson() {
  doc.meta.updatedAt = new Date().toISOString();
  const text = serializeDocument(doc);
  const safe = (doc.meta.title || "document").replace(/[\\/:*?"<>|]/g, "_");
  downloadText(`${safe}.ui-pdf.json`, text, "application/json");
}
function showCliHint() {
  return `node scripts/export-pdf.mjs -i 你的文件.ui-pdf.json -o output.pdf --theme ${themeId.value}`;
}
function importFromJsonText() {
  try {
    const parsed = JSON.parse(String(importJsonText.value || ""));
    const norm = normalizeDocument(parsed);
    // 覆盖当前 reactive doc：清空 pages / components / meta / theme，再塞新值
    doc.spec = norm.spec;
    doc.meta = norm.meta;
    doc.theme = norm.theme;
    doc.components = norm.components;
    doc.pages = norm.pages;
    themeId.value = doc.theme.id;
    selectedBlockId.value = "";
    showImportPanel.value = false;
  } catch (e) {
    alert("导入失败：" + e.message);
  }
}
function doPrintPreview() {
  // 快速用浏览器打印预览 SharedRenderer 的 DOM（不一定 100% 和 Playwright 导出一致，但能直观看到分页）
  window.print();
}

/* =========================================================
 *  v1 旧文档兼容：用户把 uiPdf v1 的 document.blocks JSON 粘进来，一键升级到 v2 components
 *  （放这里主要是调试 / 验收用，不是新手向导功能）
 * =======================================================*/
const legacyBlocksText = ref("");
const legacyBlocksMsg = ref("");
function doUpgradeLegacyBlocks() {
  legacyBlocksMsg.value = "";
  try {
    const arr = JSON.parse(legacyBlocksText.value || "[]");
    if (!Array.isArray(arr)) throw new Error("blocks 必须是数组");
    const comps = legacyBlocksToComponents(arr);
    // 塞到当前最后一页的 main region
    const pageId = doc.pages[doc.pages.length - 1].id;
    comps.forEach((c, i) => insertComponent(doc, pageId, "main", c));
    legacyBlocksMsg.value = `已成功迁移 ${comps.length} 个组件到最后一页的主区域。`;
  } catch (e) {
    legacyBlocksMsg.value = "迁移失败：" + e.message;
  }
}

/* =========================================================
 *  onMounted —— 把主题 CSS 变量以 :root 注入，确保整个编辑器的页面背景等默认色随主题
 * =======================================================*/
const themeStyleEl = ref(null);
function injectThemeCssVars() {
  const css = themeToCssVariables(theme.value, ":root");
  if (!themeStyleEl.value) {
    themeStyleEl.value = document.createElement("style");
    themeStyleEl.value.setAttribute("data-ui-pdf-theme", "");
    document.head.appendChild(themeStyleEl.value);
  }
  themeStyleEl.value.textContent = css;
}
watch(themeId, injectThemeCssVars);
onMounted(injectThemeCssVars);
</script>

<template>
  <div class="ui-pdf-editor-v2">
    <!-- =====================================================
          顶部 Toolbar（固定，像 navBar 那样）
    =======================================================-->
    <header class="uip-toolbar">
      <div class="uip-tb-left">
        <span class="uip-brand">✦ UI-PDF v2 · 可视化排版编辑器</span>
        <span class="uip-sub">Page → Layout → Component → Style → Content</span>
      </div>
      <div class="uip-tb-mid">
        <label class="uip-field">
          <span>主题 Theme</span>
          <select v-model="themeId">
            <option v-for="t in THEME_PRESETS" :key="t.id" :value="t.id">
              {{ t.name }} — {{ t.description }}
            </option>
          </select>
        </label>
        <label class="uip-field">
          <span>文档标题</span>
          <input type="text" v-model="doc.meta.title" class="uip-text-input" />
        </label>
        <div class="uip-btn-group">
          <button @click="doAddPage('content')" class="uip-btn uip-btn-primary">
            + 新增正文页
          </button>
          <button @click="doAddPage('cover')" class="uip-btn">+ 封面</button>
          <button @click="doAddPage('toc')" class="uip-btn">+ 目录</button>
          <button @click="showImportPanel = !showImportPanel" class="uip-btn">
            导入 JSON
          </button>
          <button
            @click="showExportPanel = !showExportPanel"
            class="uip-btn uip-btn-accent"
          >
            📤 导出
          </button>
        </div>
      </div>
    </header>

    <!-- =====================================================
          三栏主体
    =======================================================-->
    <div class="uip-body">
      <!-- ─── 左栏：组件调色板 ──────────────────────────── -->
      <aside class="uip-palette">
        <div class="uip-pane-hd">组件调色板 · Palette</div>
        <div class="uip-pane-tip">
          点击插入到当前页的 <b>{{ currentRegionName }}</b> 区域。<br />
          ✏️
          <b>画布里点击任意文字即可直接输入</b
          >（所见即所得）：回车分段、列表回车新增项、表格单元格直接编辑。
        </div>
        <div class="uip-region-switch">
          <span>目标 Region：</span>
          <select v-model="currentRegionName">
            <option value="main">main（主栏）</option>
            <option value="sidebar">sidebar（侧栏，仅左右栏布局生效）</option>
            <option value="header">header（页眉）</option>
            <option value="footer">footer（页脚）</option>
          </select>
        </div>
        <section
          v-for="grp in COMPONENT_PALETTE_GROUPS"
          :key="grp.groupKey"
          class="uip-palette-grp"
        >
          <div class="uip-palette-grp-title">{{ grp.name }}</div>
          <div class="uip-palette-grid">
            <button
              v-for="item in grp.items"
              :key="`${grp.groupKey}-${item.type}-${item.level || 0}`"
              class="uip-palette-item"
              :title="item.label"
              @click="onPaletteClick(item)"
            >
              <span class="uip-pi-icon">{{ item.icon }}</span>
              <span class="uip-pi-label">{{ item.label }}</span>
            </button>
          </div>
        </section>

        <!-- 底部：工具区（v1 兼容 + raw 导入） -->
        <div class="uip-palette-grp" style="margin-top: 28px">
          <div class="uip-palette-grp-title">🛠 工具 · v1→v2 兼容</div>
          <div class="uip-pane-tip">
            把旧版 <code>document.blocks</code> JSON 数组粘到下面，一键转换为 v2
            组件，附到最后一页：
          </div>
          <textarea
            v-model="legacyBlocksText"
            placeholder='[{"type":"heading","text":"标题"},...]'
            rows="4"
          ></textarea>
          <button
            class="uip-btn"
            style="margin-top: 6px"
            @click="doUpgradeLegacyBlocks"
          >
            转换并插入
          </button>
          <div v-if="legacyBlocksMsg" class="uip-pane-msg">
            {{ legacyBlocksMsg }}
          </div>
        </div>
      </aside>

      <!-- ─── 中栏：页面画布（SharedRenderer 自适应滚动） ─ -->
      <main class="uip-canvas">
        <!-- 导入弹层（简易） -->
        <section v-if="showImportPanel" class="uip-floating-panel">
          <div class="uip-fp-hd">
            导入 UI-PDF v2 JSON 文档<button
              class="uip-close"
              @click="showImportPanel = false"
            >
              ✕
            </button>
          </div>
          <textarea
            v-model="importJsonText"
            rows="10"
            placeholder='{ "spec":"ui-pdf-layout/2", "pages":[...], "components":{...} }'
          ></textarea>
          <div class="uip-fp-btns">
            <button class="uip-btn uip-btn-primary" @click="importFromJsonText">
              导入并覆盖当前文档
            </button>
          </div>
        </section>

        <!-- 导出弹层 -->
        <section v-if="showExportPanel" class="uip-floating-panel">
          <div class="uip-fp-hd">
            导出文档<button class="uip-close" @click="showExportPanel = false">
              ✕
            </button>
          </div>
          <div class="uip-export-grid">
            <div class="uip-export-card">
              <div class="uip-ec-title">① 导出 JSON（源文件）</div>
              <div class="uip-ec-desc">
                所有组件 / 样式 / 主题的完整快照，可以再打开继续编辑。
              </div>
              <button class="uip-btn uip-btn-primary" @click="exportJson">
                下载 .ui-pdf.json
              </button>
            </div>
            <div class="uip-export-card">
              <div class="uip-ec-title">② 快速打印预览（浏览器打印）</div>
              <div class="uip-ec-desc">
                直接用 <code>window.print()</code> 预览，适合快速检查排版。正式
                PDF 请用下面 Playwright 链路以保证 100% 一致。
              </div>
              <button class="uip-btn" @click="doPrintPreview">
                打印预览 / 另存 PDF
              </button>
            </div>
            <div class="uip-export-card">
              <div class="uip-ec-title">
                ③ 正式导出：Playwright → Chromium → PDF
              </div>
              <div class="uip-ec-desc">
                先完成步骤①把 JSON 下载下来，在项目根目录运行：
                <pre class="uip-cli">{{ showCliHint() }}</pre>
                第一次运行请安装：
                <pre class="uip-cli">
npm i playwright
npx playwright install chromium</pre
                >
                还支持 <code>--format png|html</code>。
              </div>
            </div>
          </div>
        </section>

        <!-- 每个 Page 加一个操作条（上移 / 下移 / 删除 / 改类型 / 改尺寸 / 切换方向） -->
        <section
          v-for="(page, pidx) in doc.pages"
          :key="page.id"
          class="uip-page-wrapper"
        >
          <div class="uip-page-toolbar">
            <div class="uip-pt-left">
              <span class="uip-pt-idx"
                >Page {{ pidx + 1 }} / {{ doc.pages.length }}</span
              >
              <label
                >类型
                <select
                  :value="page.type"
                  @change="(e) => doChangePageType(page, e.target.value)"
                >
                  <option v-for="pt in PAGE_TYPES" :key="pt.id" :value="pt.id">
                    {{ pt.label }}
                  </option>
                </select>
              </label>
              <label
                >布局
                <select v-model="page.layout">
                  <option v-for="l in LAYOUTS" :key="l.id" :value="l.id">
                    {{ l.label }}
                  </option>
                </select>
              </label>
              <label
                >尺寸
                <select
                  :value="page.pageSize.name"
                  @change="(e) => doChangePageSize(page, e.target.value)"
                >
                  <option v-for="s in PAGE_SIZE_NAMES" :key="s" :value="s">
                    {{ s }}
                  </option>
                </select>
              </label>
              <label class="uip-pt-margin">
                边距(mm)：
                <input
                  type="number"
                  :value="page.margin.top"
                  @input="
                    (e) => {
                      page.margin.top = Number(e.target.value);
                    }
                  "
                  title="上"
                />
                <input
                  type="number"
                  :value="page.margin.right"
                  @input="
                    (e) => {
                      page.margin.right = Number(e.target.value);
                    }
                  "
                  title="右"
                />
                <input
                  type="number"
                  :value="page.margin.bottom"
                  @input="
                    (e) => {
                      page.margin.bottom = Number(e.target.value);
                    }
                  "
                  title="下"
                />
                <input
                  type="number"
                  :value="page.margin.left"
                  @input="
                    (e) => {
                      page.margin.left = Number(e.target.value);
                    }
                  "
                  title="左"
                />
              </label>
              <button class="uip-btn-tiny" @click="doToggleOrientation(page)">
                ↻ 方向：{{ page.orientation === "landscape" ? "横" : "纵" }}
              </button>
            </div>
            <div class="uip-pt-right">
              <button
                class="uip-btn-tiny"
                :disabled="pidx === 0"
                @click="doMovePage(page.id, -1)"
              >
                ↑ 上移
              </button>
              <button
                class="uip-btn-tiny"
                :disabled="pidx === doc.pages.length - 1"
                @click="doMovePage(page.id, +1)"
              >
                ↓ 下移
              </button>
              <button
                class="uip-btn-tiny uip-danger"
                :disabled="doc.pages.length <= 1"
                @click="doRemovePage(page.id)"
              >
                🗑 删除
              </button>
            </div>
          </div>

          <!-- SharedRenderer 画这一页 -->
          <SharedRenderer
            :doc="doc"
            :theme-id="themeId"
            :interactive="true"
            :selected-block-id="selectedBlockId"
            :page-filter="[page.id]"
            @block-click="onBlockClick"
            @content-patch="onCanvasContentPatch"
          />
        </section>

        <div class="uip-canvas-footer">
          <button class="uip-btn uip-btn-primary" @click="doAddPage('content')">
            + 在末尾新增一页
          </button>
        </div>
      </main>

      <!-- ─── 右栏：属性面板（Content + Style 七维度） ─── -->
      <aside class="uip-inspector">
        <div class="uip-pane-hd">属性面板 · Inspector</div>
        <div v-if="!selectedComponent" class="uip-empty-hint">
          在画布中点击任意文字即可直接输入（所见即所得）。<br />
          <small
            >选中组件后，可在下方调整样式与补充字段（图片地址、行列增删等）。</small
          >
        </div>

        <template v-else>
          <!-- Component Header -->
          <div class="uip-comp-header">
            <div>
              <b>{{ selectedComponent.type }}</b>
              <small v-if="selectedComponent.level" class="uip-chip"
                >level {{ selectedComponent.level }}</small
              >
              <small
                v-if="selectedComponent.styleOverridden"
                class="uip-chip uip-chip-warn"
                >样式已手动覆盖（切换主题时保留）</small
              >
            </div>
            <button class="uip-btn-tiny uip-danger" @click="onDeleteSelected">
              删除
            </button>
          </div>

          <!-- ─── Content：按组件类型分发 ───────────── -->
          <div class="uip-sec">
            <div class="uip-sec-title">📝 Content · 内容</div>
            <div class="uip-pane-tip">
              文字请直接在画布里点击编辑（所见即所得）；此面板仅用于补充字段（图片地址、目标链接、列表/表格结构等）。
            </div>

            <!-- 纯文本类 -->
            <template
              v-if="
                [
                  'text',
                  'heading',
                  'articleTitle',
                  'subtitle',
                  'author',
                  'date',
                  'link',
                  'footnote',
                  'pageNumber',
                ].includes(selectedComponent.type)
              "
            >
              <label class="uip-field uip-f-full">
                <span>text</span>
                <input
                  type="text"
                  class="uip-text-input"
                  :value="selectedComponent.content.text"
                  @input="(e) => patchContent('text', e.target.value)"
                />
              </label>
              <label
                v-if="selectedComponent.type === 'heading'"
                class="uip-field uip-f-full"
              >
                <span>level</span>
                <select
                  :value="selectedComponent.level || 2"
                  @change="
                    (e) => {
                      selectedComponent.level = Number(e.target.value);
                    }
                  "
                >
                  <option v-for="l in [1, 2, 3, 4, 5, 6]" :key="l" :value="l">
                    H{{ l }}
                  </option>
                </select>
              </label>
              <label
                v-if="selectedComponent.type === 'link'"
                class="uip-field uip-f-full"
              >
                <span>href</span>
                <input
                  type="text"
                  class="uip-text-input"
                  :value="selectedComponent.content.href"
                  @input="(e) => patchContent('href', e.target.value)"
                />
              </label>
              <label
                v-if="selectedComponent.type === 'footnote'"
                class="uip-field uip-f-full"
              >
                <span>footnote id</span>
                <input
                  type="text"
                  class="uip-text-input"
                  :value="selectedComponent.content.id"
                  @input="(e) => patchContent('id', e.target.value)"
                />
              </label>
              <label
                v-if="selectedComponent.type === 'pageNumber'"
                class="uip-field uip-f-full"
              >
                <span>pattern</span>
                <input
                  type="text"
                  class="uip-text-input"
                  :value="selectedComponent.content.pattern"
                  @input="(e) => patchContent('pattern', e.target.value)"
                />
                <small>变量：{page} 当前页 / {total} 总页数</small>
              </label>
            </template>

            <!-- HTML 富文本类（paragraph/quote/callout/warning/tip/info/notice） -->
            <template
              v-else-if="
                ['paragraph', 'quote'].includes(selectedComponent.type)
              "
            >
              <label class="uip-field uip-f-full"
                ><span>HTML（所见即所得，直接编辑）</span></label
              >
              <div
                class="uip-contenteditable"
                contenteditable="true"
                :innerHTML="selectedComponent.content.html"
                @blur="syncContenteditable($event, 'html')"
              />
              <label
                v-if="selectedComponent.type === 'quote'"
                class="uip-field uip-f-full"
              >
                <span>cite 来源</span>
                <input
                  type="text"
                  class="uip-text-input"
                  :value="selectedComponent.content.cite"
                  @input="(e) => patchContent('cite', e.target.value)"
                />
              </label>
            </template>
            <template
              v-else-if="
                ['callout', 'warning', 'tip', 'info', 'notice'].includes(
                  selectedComponent.type,
                )
              "
            >
              <label class="uip-field uip-f-full">
                <span>title</span>
                <input
                  type="text"
                  class="uip-text-input"
                  :value="selectedComponent.content.title"
                  @input="(e) => patchContent('title', e.target.value)"
                />
              </label>
              <label class="uip-field uip-f-full"><span>body HTML</span></label>
              <div
                class="uip-contenteditable"
                contenteditable="true"
                :innerHTML="selectedComponent.content.body"
                @blur="syncContenteditable($event, 'body')"
              />
            </template>
            <template v-else-if="selectedComponent.type === 'card'">
              <label class="uip-field uip-f-full">
                <span>title</span>
                <input
                  type="text"
                  class="uip-text-input"
                  :value="selectedComponent.content.title"
                  @input="(e) => patchContent('title', e.target.value)"
                />
              </label>
              <label class="uip-field uip-f-full"><span>body HTML</span></label>
              <div
                class="uip-contenteditable"
                contenteditable="true"
                :innerHTML="selectedComponent.content.bodyHtml"
                @blur="syncContenteditable($event, 'bodyHtml')"
              />
            </template>

            <!-- List -->
            <template v-else-if="selectedComponent.type === 'list'">
              <label class="uip-field">
                <span>类型</span>
                <select
                  :value="selectedComponent.content.ordered"
                  @change="
                    (e) => patchContent('ordered', e.target.value === 'true')
                  "
                >
                  <option :value="false">• 无序列表</option>
                  <option :value="true">1. 有序列表</option>
                </select>
              </label>
              <div class="uip-list-editor">
                <div
                  v-for="(it, i) in selectedComponent.content.items"
                  :key="i"
                  class="uip-le-row"
                >
                  <span class="uip-le-idx">{{
                    selectedComponent.content.ordered ? i + 1 + "." : "•"
                  }}</span>
                  <input
                    type="text"
                    :value="it"
                    @input="
                      (e) => {
                        const arr = [...selectedComponent.content.items];
                        arr[i] = e.target.value;
                        patchContent('items', arr);
                      }
                    "
                  />
                  <button
                    class="uip-btn-tiny uip-danger"
                    @click="
                      () => {
                        const arr = [...selectedComponent.content.items];
                        arr.splice(i, 1);
                        patchContent('items', arr);
                      }
                    "
                  >
                    ✕
                  </button>
                </div>
                <button
                  class="uip-btn-tiny"
                  @click="
                    () =>
                      patchContent('items', [
                        ...selectedComponent.content.items,
                        '新列表项',
                      ])
                  "
                >
                  + 新增一项
                </button>
              </div>
            </template>

            <!-- Table -->
            <template v-else-if="selectedComponent.type === 'table'">
              <label class="uip-field">
                <span>首行为表头</span>
                <select
                  :value="selectedComponent.content.headerRow"
                  @change="
                    (e) => patchContent('headerRow', e.target.value === 'true')
                  "
                >
                  <option :value="true">是</option>
                  <option :value="false">否</option>
                </select>
              </label>
              <div class="uip-table-ops">
                <button class="uip-btn-tiny" @click="tblAddRow(-1)">
                  + 行末追加
                </button>
                <button class="uip-btn-tiny" @click="tblAddCol(-1)">
                  + 列末追加
                </button>
              </div>
              <table
                class="uip-table-editor"
                border="1"
                cellpadding="4"
                cellspacing="0"
              >
                <tbody>
                  <tr
                    v-for="(row, r) in selectedComponent.content.rows"
                    :key="r"
                  >
                    <th
                      v-if="r === 0 && selectedComponent.content.headerRow"
                      class="uip-table-idx"
                    >
                      #
                    </th>
                    <td v-else class="uip-table-idx">
                      <button
                        class="uip-btn-tiny uip-danger"
                        @click="tblRemoveRow(r)"
                      >
                        -行
                      </button>
                    </td>
                    <template v-for="(cell, c) in row" :key="c">
                      <td
                        :class="{
                          'uip-th':
                            r === 0 && selectedComponent.content.headerRow,
                        }"
                      >
                        <input
                          type="text"
                          :value="cell"
                          @input="(e) => tblPatchCell(r, c, e.target.value)"
                        />
                      </td>
                      <td v-if="r === 0" class="uip-table-colctrl">
                        <button
                          class="uip-btn-tiny uip-danger"
                          @click="tblRemoveCol(c)"
                        >
                          -列
                        </button>
                      </td>
                    </template>
                  </tr>
                </tbody>
              </table>
            </template>

            <!-- Code -->
            <template v-else-if="selectedComponent.type === 'code'">
              <label class="uip-field uip-f-full">
                <span>language</span>
                <input
                  type="text"
                  class="uip-text-input"
                  :value="selectedComponent.content.language"
                  @input="(e) => patchContent('language', e.target.value)"
                />
              </label>
              <label class="uip-field uip-f-full"><span>source</span></label>
              <textarea
                rows="10"
                spellcheck="false"
                class="uip-code-editor"
                :value="selectedComponent.content.source"
                @input="(e) => patchContent('source', e.target.value)"
              />
            </template>

            <!-- TOC -->
            <template v-else-if="selectedComponent.type === 'toc'">
              <div class="uip-pane-tip">
                TOC 会自动扫描文档里所有 heading 组件生成目录。levels
                控制收集哪些级别的标题。
              </div>
              <label class="uip-field uip-f-full">
                <span>levels（逗号分隔，例：2,3）</span>
                <input
                  type="text"
                  class="uip-text-input"
                  :value="(selectedComponent.content.levels || []).join(',')"
                  @input="
                    (e) => {
                      const arr = String(e.target.value)
                        .split(',')
                        .map((s) => parseInt(s.trim(), 10))
                        .filter((n) => !isNaN(n));
                      patchContent('levels', arr);
                    }
                  "
                />
              </label>
              <label class="uip-field">
                <span>autoGenerate</span>
                <select
                  :value="selectedComponent.content.autoGenerate"
                  @change="
                    (e) =>
                      patchContent('autoGenerate', e.target.value === 'true')
                  "
                >
                  <option :value="true">自动生成</option>
                  <option :value="false">使用 items</option>
                </select>
              </label>
            </template>

            <!-- Spacer -->
            <template v-else-if="selectedComponent.type === 'spacer'">
              <label class="uip-field uip-f-full">
                <span>高度 (px)</span>
                <input
                  type="number"
                  min="0"
                  class="uip-text-input"
                  :value="selectedComponent.content.height"
                  @input="(e) => patchContent('height', Number(e.target.value))"
                />
              </label>
            </template>

            <!-- Image / Picture -->
            <template
              v-else-if="['image', 'picture'].includes(selectedComponent.type)"
            >
              <label class="uip-field uip-f-full">
                <span>src 图片 URL</span>
                <input
                  type="text"
                  class="uip-text-input"
                  :value="selectedComponent.content.src"
                  @input="(e) => patchContent('src', e.target.value)"
                />
              </label>
              <div class="uip-field-row">
                <label class="uip-field uip-f-half">
                  <span>alt</span>
                  <input
                    type="text"
                    class="uip-text-input"
                    :value="selectedComponent.content.alt"
                    @input="(e) => patchContent('alt', e.target.value)"
                  />
                </label>
                <label class="uip-field uip-f-half">
                  <span>caption 图注</span>
                  <input
                    type="text"
                    class="uip-text-input"
                    :value="selectedComponent.content.caption"
                    @input="(e) => patchContent('caption', e.target.value)"
                  />
                </label>
              </div>
              <label class="uip-field uip-f-full">
                <span>credit 版权</span>
                <input
                  type="text"
                  class="uip-text-input"
                  :value="selectedComponent.content.credit"
                  @input="(e) => patchContent('credit', e.target.value)"
                />
              </label>
              <div class="uip-field-row">
                <label
                  v-if="selectedComponent.type === 'image'"
                  class="uip-field uip-f-half"
                >
                  <span>宽度 %</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    class="uip-text-input"
                    :value="selectedComponent.content.widthPercent"
                    @input="
                      (e) =>
                        patchContent('widthPercent', Number(e.target.value))
                    "
                  />
                </label>
                <label
                  v-if="selectedComponent.type === 'picture'"
                  class="uip-field uip-f-half"
                >
                  <span>width</span>
                  <input
                    type="text"
                    class="uip-text-input"
                    :value="selectedComponent.content.width"
                    @input="(e) => patchContent('width', e.target.value)"
                  />
                </label>
                <label
                  v-if="selectedComponent.type === 'picture'"
                  class="uip-field uip-f-half"
                >
                  <span>height</span>
                  <input
                    type="text"
                    class="uip-text-input"
                    :value="selectedComponent.content.height"
                    @input="(e) => patchContent('height', e.target.value)"
                  />
                </label>
              </div>
              <div class="uip-field-row">
                <label class="uip-field uip-f-half">
                  <span>objectFit</span>
                  <select
                    :value="selectedComponent.content.objectFit"
                    @change="(e) => patchContent('objectFit', e.target.value)"
                  >
                    <option value="contain">contain（完整显示）</option>
                    <option value="cover">cover（裁剪铺满）</option>
                    <option value="fill">fill（拉伸填满）</option>
                    <option value="none">none（原始尺寸）</option>
                    <option value="scale-down">scale-down</option>
                  </select>
                </label>
                <label class="uip-field uip-f-half">
                  <span>align</span>
                  <select
                    :value="selectedComponent.content.align"
                    @change="(e) => patchContent('align', e.target.value)"
                  >
                    <option value="left">左</option>
                    <option value="center">中</option>
                    <option value="right">右</option>
                  </select>
                </label>
              </div>
              <template v-if="selectedComponent.type === 'picture'">
                <div class="uip-field-row">
                  <label class="uip-field uip-f-half">
                    <span>borderRadius px</span>
                    <input
                      type="number"
                      min="0"
                      class="uip-text-input"
                      :value="selectedComponent.content.borderRadius"
                      @input="
                        (e) =>
                          patchContent('borderRadius', Number(e.target.value))
                      "
                    />
                  </label>
                  <label class="uip-field uip-f-half">
                    <span>boxShadow</span>
                    <select
                      :value="selectedComponent.content.shadow"
                      @change="(e) => patchContent('shadow', e.target.value)"
                    >
                      <option value="none">无</option>
                      <option value="sm">小</option>
                      <option value="md">中</option>
                      <option value="lg">大</option>
                    </select>
                  </label>
                </div>
                <div class="uip-field-row">
                  <label class="uip-field uip-f-half">
                    <span>边框</span>
                    <select
                      :value="selectedComponent.content.border?.enabled"
                      @change="
                        (e) =>
                          patchContent('border', {
                            ...(selectedComponent.content.border || {}),
                            enabled: e.target.value === 'true',
                          })
                      "
                    >
                      <option :value="true">开启</option>
                      <option :value="false">关闭</option>
                    </select>
                  </label>
                  <label class="uip-field uip-f-half">
                    <span>边框宽度 px / 颜色</span>
                    <div class="uip-2col">
                      <input
                        type="number"
                        min="0"
                        :value="selectedComponent.content.border?.width"
                        @input="
                          (e) =>
                            patchContent('border', {
                              ...(selectedComponent.content.border || {}),
                              width: Number(e.target.value),
                            })
                        "
                      />
                      <input
                        type="color"
                        :value="
                          selectedComponent.content.border?.color || '#cccccc'
                        "
                        @input="
                          (e) =>
                            patchContent('border', {
                              ...(selectedComponent.content.border || {}),
                              color: e.target.value,
                            })
                        "
                      />
                    </div>
                  </label>
                </div>
              </template>
            </template>

            <!-- Container / Columns / Sidebar / Grid（布局组件：子组件管理） -->
            <template
              v-else-if="
                ['container', 'columns', 'sidebar', 'card', 'grid'].includes(
                  selectedComponent.type,
                )
              "
            >
              <div class="uip-pane-tip">
                布局组件内部的子组件管理请先通过调色板添加到页面主区域，再切换到
                Raw JSON 模式，手动把组件 id 搬移到 childIds。<br />
                <small>（完整的拖拽嵌套编辑器属于下一阶段迭代）</small>
              </div>
              <label
                v-if="selectedComponent.type === 'container'"
                class="uip-field uip-f-full"
              >
                <span>tag</span>
                <input
                  type="text"
                  class="uip-text-input"
                  :value="selectedComponent.content.tag"
                  @input="(e) => patchContent('tag', e.target.value)"
                />
              </label>
              <label
                v-if="selectedComponent.type === 'columns'"
                class="uip-field uip-f-half"
              >
                <span>columns 列数</span>
                <input
                  type="number"
                  min="2"
                  class="uip-text-input"
                  :value="selectedComponent.content.columns"
                  @input="
                    (e) => patchContent('columns', Number(e.target.value))
                  "
                />
              </label>
              <label
                v-if="selectedComponent.type === 'sidebar'"
                class="uip-field uip-f-half"
              >
                <span>side</span>
                <select
                  :value="selectedComponent.content.side"
                  @change="(e) => patchContent('side', e.target.value)"
                >
                  <option value="left">左栏</option>
                  <option value="right">右栏</option>
                </select>
              </label>
              <div
                class="uip-field-row"
                v-if="selectedComponent.type === 'grid'"
              >
                <label class="uip-field uip-f-half">
                  <span>columns</span>
                  <input
                    type="number"
                    min="1"
                    class="uip-text-input"
                    :value="selectedComponent.content.columns"
                    @input="
                      (e) => patchContent('columns', Number(e.target.value))
                    "
                  />
                </label>
                <label class="uip-field uip-f-half">
                  <span>rows</span>
                  <input
                    type="number"
                    min="1"
                    class="uip-text-input"
                    :value="selectedComponent.content.rows"
                    @input="(e) => patchContent('rows', Number(e.target.value))"
                  />
                </label>
              </div>
            </template>

            <!-- Divider / 其他 -->
            <template v-else>
              <div class="uip-pane-tip">
                该组件没有可编辑的 content 字段，可在下方 Style 面板调样式。
              </div>
            </template>
          </div>

          <!-- ─── Style：七维度（精简版高频字段）───────── -->
          <div class="uip-sec">
            <div class="uip-sec-title">
              🎨 Style · 样式
              <button class="uip-btn-tiny uip-right" @click="doResetStyle">
                ↺ 重置为主题默认
              </button>
            </div>

            <details v-for="dim in STYLE_DIMENSIONS" :key="dim.key" open>
              <summary>
                <b>{{ dim.name }}</b> · {{ dim.key }}
              </summary>
              <div class="uip-style-grid">
                <template v-for="f in dim.fields" :key="f.k">
                  <label
                    class="uip-field"
                    :class="{
                      'uip-f-full':
                        f.type === 'color' || f.type === 'select'
                          ? false
                          : f.k.length > 8,
                    }"
                  >
                    <span>
                      {{ f.label }}
                      <em
                        v-if="manualStyleValue(dim.key, f.k) === undefined"
                        class="uip-theme-default"
                        :title="
                          '跟随主题 · 实际值: ' +
                          String(
                            effectiveStyleCss(f.k) ||
                              effectiveStyleCss(
                                f.k.replace(/([A-Z])/g, '-$1').toLowerCase(),
                              ) ||
                              '',
                          ).slice(0, 80)
                        "
                      >
                        🎨主题
                      </em>
                    </span>
                    <!-- select -->
                    <select
                      v-if="f.type === 'select'"
                      :value="
                        manualStyleValue(dim.key, f.k) === undefined
                          ? '(继承)'
                          : manualStyleValue(dim.key, f.k)
                      "
                      @change="
                        (e) =>
                          patchStyleDimension(
                            dim.key,
                            f.k,
                            e.target.value === '(继承)'
                              ? '(继承)'
                              : e.target.value,
                          )
                      "
                    >
                      <option v-for="o in f.options" :key="o" :value="o">
                        {{ o }}
                      </option>
                    </select>
                    <!-- color -->
                    <div v-else-if="f.type === 'color'" class="uip-color-row">
                      <input
                        type="color"
                        :value="
                          manualStyleValue(dim.key, f.k) ||
                          effectiveStyleCss(f.k) ||
                          '#ffffff'
                        "
                        @input="
                          (e) =>
                            patchStyleDimension(dim.key, f.k, e.target.value)
                        "
                      />
                      <input
                        type="text"
                        class="uip-text-input"
                        :value="
                          manualStyleValue(dim.key, f.k) === undefined
                            ? ''
                            : manualStyleValue(dim.key, f.k)
                        "
                        :placeholder="effectiveStyleCss(f.k) || '#xxxxxx'"
                        @input="
                          (e) =>
                            patchStyleDimension(dim.key, f.k, e.target.value)
                        "
                      />
                      <button
                        v-if="manualStyleValue(dim.key, f.k) !== undefined"
                        class="uip-btn-tiny"
                        @click="patchStyleDimension(dim.key, f.k, '(继承)')"
                      >
                        回主题
                      </button>
                    </div>
                    <!-- number -->
                    <input
                      v-else-if="f.type === 'number'"
                      type="number"
                      :min="f.min"
                      :max="f.max"
                      :step="f.step ?? 1"
                      :value="
                        manualStyleValue(dim.key, f.k) === undefined
                          ? ''
                          : manualStyleValue(dim.key, f.k)
                      "
                      :placeholder="
                        String(
                          effectiveStyleCss(
                            f.k.replace(/([A-Z])/g, '-$1').toLowerCase(),
                          ) || '',
                        )
                      "
                      @input="
                        (e) => {
                          const raw = e.target.value;
                          if (raw === '') patchStyleDimension(dim.key, f.k, '');
                          else patchStyleDimension(dim.key, f.k, Number(raw));
                        }
                      "
                    />
                    <!-- text -->
                    <input
                      v-else
                      type="text"
                      :placeholder="
                        f.placeholder ||
                        String(
                          effectiveStyleCss(
                            f.k.replace(/([A-Z])/g, '-$1').toLowerCase(),
                          ) || '',
                        )
                      "
                      :value="
                        manualStyleValue(dim.key, f.k) === undefined
                          ? ''
                          : manualStyleValue(dim.key, f.k)
                      "
                      @input="
                        (e) => patchStyleDimension(dim.key, f.k, e.target.value)
                      "
                    />
                  </label>
                </template>
              </div>
            </details>
          </div>

          <!-- ─── 高级：Raw Style JSON ─────────────────── -->
          <div class="uip-sec">
            <div class="uip-sec-title">
              ⚙ Raw Style JSON · 高级（粘贴/整体覆盖）
            </div>
            <textarea
              rows="8"
              spellcheck="false"
              v-model="rawStyleJsonText"
              placeholder='{"typography":{"fontSize":22,"fontWeight":700},"color":{"textColor":"#c0392b"}}'
            />
            <div class="uip-sec-actions">
              <button class="uip-btn-tiny" @click="dumpStyleToRawEditor">
                ↑ 把当前 style 拉到编辑器
              </button>
              <button
                class="uip-btn-tiny uip-btn-primary"
                @click="applyRawStyleJson"
              >
                ✓ 应用 JSON
              </button>
            </div>
            <div v-if="rawStyleJsonError" class="uip-error">
              {{ rawStyleJsonError }}
            </div>
          </div>
        </template>
      </aside>
    </div>
  </div>
</template>

<style>
/* 编辑器打印媒体：只显示画布部分 */
@media print {
  .uip-toolbar,
  .uip-palette,
  .uip-inspector,
  .uip-page-toolbar,
  .uip-floating-panel,
  .uip-canvas-footer {
    display: none !important;
  }
  .uip-body,
  .uip-canvas,
  .ui-pdf-editor-v2 {
    padding: 0 !important;
    margin: 0 !important;
    background: #fff !important;
  }
  .uip-page-wrapper {
    page-break-after: always;
  }
}
</style>

<style scoped>
/* =========================================================
 *  整体三栏布局（仅结构 CSS，视觉走主题 variable + inline）
 * =======================================================*/
.ui-pdf-editor-v2 {
  --uip-bg: #f4f6f4;
  --uip-panel: #ffffff;
  --uip-border: #e5e9e5;
  --uip-text: #242a24;
  --uip-muted: #6a746a;
  --uip-accent: #2f7a4c;
  --uip-accent-weak: #e7f1ea;
  --uip-danger: #c0392b;
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-rows: 56px 1fr;
  background: var(--uip-bg);
  color: var(--uip-text);
  font-size: 13px;
  font-family:
    system-ui,
    -apple-system,
    "PingFang SC",
    "Microsoft YaHei",
    sans-serif;
}
.uip-toolbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 16px;
  background: var(--uip-panel);
  border-bottom: 1px solid var(--uip-border);
}
.uip-tb-left {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.uip-brand {
  font-weight: 700;
  font-size: 14px;
}
.uip-sub {
  font-size: 11px;
  color: var(--uip-muted);
  letter-spacing: 0.5px;
}
.uip-tb-mid {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.uip-field {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: var(--uip-muted);
}
.uip-field > span {
  font-weight: 600;
  padding-left: 2px;
}
.uip-field select,
.uip-field input[type="text"],
.uip-field input[type="number"],
.uip-text-input {
  min-height: 26px;
  padding: 2px 6px;
  border: 1px solid var(--uip-border);
  border-radius: 4px;
  background: #fff;
  color: var(--uip-text);
  font-size: 12px;
}
.uip-field select {
  min-width: 110px;
}
.uip-btn-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.uip-btn,
.uip-btn-tiny {
  cursor: pointer;
  border: 1px solid var(--uip-border);
  background: #fff;
  color: var(--uip-text);
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 12px;
  transition: all 0.15s;
}
.uip-btn:hover,
.uip-btn-tiny:hover {
  background: var(--uip-accent-weak);
  border-color: var(--uip-accent);
  color: var(--uip-accent);
}
.uip-btn-primary {
  background: var(--uip-accent);
  color: #fff;
  border-color: var(--uip-accent);
}
.uip-btn-primary:hover {
  background: #276a42;
  color: #fff;
}
.uip-btn-accent {
  background: #fff;
  color: var(--uip-accent);
  border-color: var(--uip-accent);
  font-weight: 600;
}
.uip-btn-tiny {
  padding: 2px 7px;
  font-size: 11px;
}
.uip-btn-tiny.uip-danger:hover,
.uip-btn.uip-danger:hover {
  background: var(--uip-danger);
  color: #fff;
  border-color: var(--uip-danger);
}
.uip-btn:disabled,
.uip-btn-tiny:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.uip-body {
  display: grid;
  grid-template-columns: 240px 1fr 360px;
  overflow: hidden;
}
.uip-palette,
.uip-inspector {
  overflow: auto;
  background: var(--uip-panel);
  border-right: 1px solid var(--uip-border);
  padding: 12px 12px 24px;
}
.uip-inspector {
  border-right: none;
  border-left: 1px solid var(--uip-border);
  padding-right: 14px;
}
.uip-pane-hd {
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 6px;
}
.uip-pane-tip {
  font-size: 11px;
  color: var(--uip-muted);
  line-height: 1.55;
  padding: 6px 8px;
  background: #f8faf8;
  border: 1px dashed var(--uip-border);
  border-radius: 4px;
  margin-bottom: 10px;
}
.uip-pane-msg {
  margin-top: 6px;
  font-size: 11px;
  color: var(--uip-accent);
}
.uip-region-switch {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 6px 0 14px;
  font-size: 12px;
}
.uip-region-switch select {
  border: 1px solid var(--uip-border);
  border-radius: 4px;
  padding: 2px 6px;
}

.uip-palette-grp {
  margin-top: 14px;
}
.uip-palette-grp-title {
  font-weight: 700;
  font-size: 11px;
  color: var(--uip-muted);
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.uip-palette-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}
.uip-palette-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 8px 2px;
  background: #fff;
  border: 1px solid var(--uip-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}
.uip-palette-item:hover {
  background: var(--uip-accent-weak);
  border-color: var(--uip-accent);
  transform: translateY(-1px);
}
.uip-pi-icon {
  font-size: 16px;
  line-height: 1;
}
.uip-pi-label {
  font-size: 10px;
  color: var(--uip-text);
}

.uip-palette textarea,
.uip-inspector textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: 60px;
  resize: vertical;
  border: 1px solid var(--uip-border);
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 12px;
  font-family: inherit;
}

/* 画布 */
.uip-canvas {
  position: relative;
  overflow: auto;
  padding: 24px 32px 120px;
  background: #ecefec;
}
.uip-page-wrapper {
  margin-bottom: 32px;
}
.uip-page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: var(--uip-panel);
  border: 1px solid var(--uip-border);
  border-bottom: none;
  padding: 6px 10px;
  border-radius: 8px 8px 0 0;
  position: sticky;
  top: 0;
  z-index: 5;
}
.uip-pt-left,
.uip-pt-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.uip-pt-left label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--uip-muted);
}
.uip-pt-left select {
  border: 1px solid var(--uip-border);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
}
.uip-pt-left input[type="number"] {
  width: 44px;
  border: 1px solid var(--uip-border);
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 11px;
}
.uip-pt-idx {
  font-weight: 700;
  font-size: 12px;
  color: var(--uip-accent);
}
.uip-pt-margin input + input {
  margin-left: 2px;
}
.uip-canvas-footer {
  text-align: center;
  margin-top: 12px;
}

/* 浮动弹层 */
.uip-floating-panel {
  position: sticky;
  top: 4px;
  z-index: 10;
  background: #fff;
  border: 1px solid var(--uip-accent);
  border-radius: 10px;
  padding: 14px 16px;
  box-shadow: 0 10px 30px rgba(47, 122, 76, 0.12);
  margin-bottom: 20px;
}
.uip-fp-hd {
  font-weight: 700;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.uip-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--uip-muted);
  font-size: 16px;
}
.uip-fp-btns {
  margin-top: 8px;
}
.uip-export-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.uip-export-card {
  border: 1px solid var(--uip-border);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.uip-ec-title {
  font-weight: 700;
  font-size: 13px;
}
.uip-ec-desc {
  font-size: 11px;
  color: var(--uip-muted);
  line-height: 1.6;
}
.uip-cli {
  background: #242a24;
  color: #e7f1ea;
  padding: 6px 8px;
  border-radius: 4px;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  margin: 6px 0;
}

/* 属性面板 */
.uip-empty-hint {
  padding: 40px 16px;
  text-align: center;
  color: var(--uip-muted);
  line-height: 1.8;
}
.uip-comp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: var(--uip-accent-weak);
  border-radius: 6px;
  margin-bottom: 10px;
}
.uip-chip {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid var(--uip-border);
  color: var(--uip-muted);
  font-size: 10px;
}
.uip-chip-warn {
  border-color: var(--uip-accent);
  color: var(--uip-accent);
  background: #fff;
}
.uip-sec {
  margin-top: 18px;
  padding-top: 12px;
  border-top: 1px dashed var(--uip-border);
}
.uip-sec-title {
  font-weight: 700;
  font-size: 12px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.uip-sec-actions {
  margin-top: 6px;
  display: flex;
  gap: 6px;
}
.uip-right {
  margin-left: auto;
}
.uip-error {
  color: var(--uip-danger);
  font-size: 11px;
  margin-top: 6px;
}

.uip-f-full {
  width: 100%;
  margin-bottom: 8px;
}
.uip-f-half {
  width: calc(50% - 4px);
  margin-bottom: 8px;
}
.uip-field-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.uip-style-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 8px;
  padding: 6px 0 12px;
}
.uip-style-grid > .uip-field {
  width: calc(50% - 4px);
}
.uip-style-grid > .uip-f-full {
  width: 100%;
}
.uip-color-row {
  display: flex;
  align-items: center;
  gap: 4px;
}
.uip-color-row input[type="color"] {
  width: 30px;
  height: 26px;
  border: 1px solid var(--uip-border);
  border-radius: 4px;
  padding: 0;
  background: none;
}
.uip-color-row input[type="text"] {
  flex: 1;
}
.uip-theme-default {
  font-style: normal;
  font-size: 10px;
  padding: 0 4px;
  border-radius: 3px;
  background: var(--uip-accent-weak);
  color: var(--uip-accent);
  margin-left: 4px;
  cursor: help;
}

.uip-contenteditable {
  min-height: 60px;
  padding: 8px 10px;
  border: 1px solid var(--uip-border);
  border-radius: 4px;
  font-size: 12px;
  background: #fff;
  line-height: 1.6;
  outline: none;
  margin-bottom: 8px;
}
.uip-contenteditable:focus {
  border-color: var(--uip-accent);
  box-shadow: 0 0 0 2px var(--uip-accent-weak);
}

.uip-list-editor {
  border: 1px solid var(--uip-border);
  border-radius: 4px;
  padding: 6px;
}
.uip-le-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0;
}
.uip-le-idx {
  width: 22px;
  color: var(--uip-muted);
  font-size: 12px;
}
.uip-le-row input {
  flex: 1;
  border: 1px solid var(--uip-border);
  border-radius: 4px;
  padding: 3px 6px;
  font-size: 12px;
}

.uip-table-ops {
  margin: 4px 0 6px;
  display: flex;
  gap: 4px;
}
.uip-table-editor {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.uip-table-editor td,
.uip-table-editor th {
  padding: 2px;
  vertical-align: middle;
}
.uip-table-editor input {
  width: 100%;
  box-sizing: border-box;
  border: none;
  padding: 3px 5px;
  font-size: 11px;
  background: transparent;
}
.uip-table-editor input:focus {
  background: var(--uip-accent-weak);
  outline: 1px solid var(--uip-accent);
}
.uip-table-editor .uip-th {
  background: #f0f4f0;
  font-weight: 700;
}
.uip-table-idx,
.uip-table-colctrl {
  width: 40px;
  text-align: center;
  border: 1px solid var(--uip-border);
}

.uip-code-editor {
  width: 100%;
  font-family: ui-monospace, Consolas, "JetBrains Mono", monospace;
  font-size: 11px;
}
.uip-2col {
  display: flex;
  gap: 4px;
  flex: 1;
}
.uip-2col input[type="number"] {
  width: 48px;
  border: 1px solid var(--uip-border);
  border-radius: 4px;
  padding: 2px 4px;
}
.uip-2col input[type="color"] {
  width: 30px;
  height: 26px;
  border: 1px solid var(--uip-border);
  border-radius: 4px;
}

details {
  border: 1px solid var(--uip-border);
  border-radius: 6px;
  margin-bottom: 8px;
}
details summary {
  cursor: pointer;
  padding: 6px 10px;
  background: #fafcfa;
  border-radius: 6px;
  list-style: none;
  font-size: 12px;
}
details summary::-webkit-details-marker {
  display: none;
}
details[open] summary {
  border-bottom: 1px dashed var(--uip-border);
}
details > div {
  padding: 6px 10px 12px;
}
</style>
