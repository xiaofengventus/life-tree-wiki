<template>
  <div
    ref="barRef"
    class="editor-toolbar-fixed"
    @mouseover="handleBarOver"
    @mouseleave="handleBarLeave"
  >
    <!-- 整条工具栏里只有这一个元素：左侧的参考文献开关、中间的编辑按钮、右侧的
         浮动工具栏开关与导入导出，全都是它的菜单项（见 utils/wangEditorToolbarMenus.js）。 -->
    <Toolbar :editor="editor" :default-config="toolbarConfig" mode="default" />
  </div>
</template>

<script setup>
/**
 * 编辑器顶部工具栏。
 *
 * 之前这块 DOM 直接写在 create_post.vue 里，和页面逻辑混在一起，还额外拼了两组
 * 工具栏之外的按钮。现在：
 * - 所有入口都是 wangEditor 菜单 → 这里只剩 `<Toolbar>` 一个元素，天然是一条；
 * - 工具栏自己的杂活（提示气泡、下拉面板不被滚动容器裁掉、开关按钮的 active 类）
 *   都收在这个文件里，create_post.vue 只负责给状态、接事件。
 *
 * 与父组件的数据流：
 * - props.editor            —— wangEditor 实例（父组件 `handleCreated` 里拿到后传入）；
 * - props.citationPanelOpen —— 参考文献面板是否展开，用于点亮按钮；
 * - props.floatingToolsEnabled —— 浮动工具栏开关是否打开，用于点亮按钮。
 * 点击产生的动作一律通过 `TOOLBAR_MENU_EVENT` 派发回父组件处理（见 wangEditorToolbarMenus.js）。
 */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Toolbar } from "@wangeditor/editor-for-vue";
import {
  CITATION_PANEL_MENU_KEY,
  EXPORT_DOC_MENU_KEY,
  FLOATING_TOOLS_MENU_KEY,
  IMPORT_DOC_MENU_KEY,
  IMPORT_MARKDOWN_MENU_KEY,
  INSERT_CARD_MENU_KEY,
  INSERT_TREE_MENU_KEY,
  setToolbarMenuState,
} from "@/utils/wangEditorToolbarMenus";
import { CODE_SAMPLE_MENU_KEY } from "@/utils/wangEditorCodeSample";
import { CITATION_MENU_KEY } from "@/utils/wangEditorCitation";
import { FORMULA_MENU_KEY } from "@/utils/wangEditorFormula";
import { INSERT_MENU_KEY } from "@/utils/wangEditorInsertMenu";
import { formatToolbarShortcut } from "@/utils/toolbarTooltips";

const props = defineProps({
  editor: { type: Object, default: null },
  citationPanelOpen: { type: Boolean, default: false },
  floatingToolsEnabled: { type: Boolean, default: true },
});

const barRef = ref(null);

/**
 * 按钮顺序即 toolbarKeys 的顺序：
 * 「参考文献 │ 正文与行内样式 … 插入类 … │ 浮动开关 导入 导出 │ 撤销 重做」
 */
const toolbarConfig = {
  toolbarKeys: [
    CITATION_PANEL_MENU_KEY,
    "|",
    "headerSelect",
    "bold",
    "italic",
    "underline",
    "through",
    "fontSize",
    "color",
    "bgColor",
    "bulletedList",
    "numberedList",
    "todo",
    "blockquote",
    "codeBlock",
    "codeSelectLang",
    CODE_SAMPLE_MENU_KEY,
    "insertLink",
    "uploadImage",
    INSERT_CARD_MENU_KEY,
    INSERT_TREE_MENU_KEY,
    IMPORT_MARKDOWN_MENU_KEY,
    CITATION_MENU_KEY,
    FORMULA_MENU_KEY,
    "|",
    FLOATING_TOOLS_MENU_KEY,
    IMPORT_DOC_MENU_KEY,
    EXPORT_DOC_MENU_KEY,
    "|",
    "undo",
    "redo",
  ],
};

/** wangEditor 的按钮没有可读的 title，这里按菜单 key 补一套中文提示 */
const toolbarTooltipDefinitions = {
  fontSize: { label: "Font size" },
  headerSelect: { label: "正文与标题" },
  bold: { label: "加粗", shortcut: "mod+B" },
  italic: { label: "斜体", shortcut: "mod+I" },
  underline: { label: "下划线", shortcut: "mod+U" },
  through: { label: "删除线", shortcut: "mod+Shift+X" },
  color: { label: "文字颜色" },
  bgColor: { label: "背景色" },
  clearStyle: { label: "清除格式" },
  bulletedList: { label: "无序列表" },
  numberedList: { label: "有序列表" },
  todo: { label: "待办事项" },
  blockquote: { label: "引用" },
  codeBlock: { label: "代码块" },
  codeSelectLang: { label: "代码语言" },
  [CODE_SAMPLE_MENU_KEY]: { label: "代码块案例（输入 / 输出对照）" },
  insertLink: { label: "插入链接" },
  uploadImage: { label: "上传图片" },
  [INSERT_CARD_MENU_KEY]: { label: "配置文章卡片（生物卡片 / 自定义卡片）" },
  [INSERT_TREE_MENU_KEY]: { label: "插入 Research 进化树块" },
  [IMPORT_MARKDOWN_MENU_KEY]: { label: "从 Markdown 导入正文" },
  [CITATION_PANEL_MENU_KEY]: { label: "打开 / 收起参考文献面板" },
  [FLOATING_TOOLS_MENU_KEY]: { label: "浮动工具栏开关" },
  [IMPORT_DOC_MENU_KEY]: { label: "导入文档（Word / Markdown / HTML）" },
  [EXPORT_DOC_MENU_KEY]: { label: "导出文档（Word / Markdown / HTML）" },
  [INSERT_MENU_KEY]: { label: "插入内容", shortcut: "mod+Shift+I" },
  [CITATION_MENU_KEY]: { label: "插入正文引用", shortcut: "mod+Alt+K" },
  [FORMULA_MENU_KEY]: { label: "插入数学公式", shortcut: "mod+Alt+M" },
  undo: { label: "撤销", shortcut: "mod+Z" },
  redo: { label: "重做", shortcut: "mod+Shift+Z" },
};

/** 把状态读函数注入给菜单（`isActive()` 用），按钮由 wangEditor 渲染 */
setToolbarMenuState({
  citationPanelOpen: () => props.citationPanelOpen,
  floatingToolsEnabled: () => props.floatingToolsEnabled,
});

function applyToolbarShortcutTooltips() {
  const bar = barRef.value;
  if (!bar) return;
  bar.querySelectorAll("[data-menu-key]").forEach((button) => {
    const key = button.getAttribute("data-menu-key");
    const definition = toolbarTooltipDefinitions[key];
    if (!definition) return;
    const shortcut = formatToolbarShortcut(definition.shortcut);
    const tooltip = shortcut
      ? `${definition.label}\n${shortcut}`
      : definition.label;
    button.setAttribute("data-tooltip", tooltip);
    button.setAttribute(
      "aria-label",
      shortcut ? `${definition.label}，快捷键 ${shortcut}` : definition.label,
    );
    button.classList.add("w-e-menu-tooltip-v5");
  });
}

/**
 * 把开关状态补到 wangEditor 渲染出的按钮上 —— 菜单是命令式的，不会因 Vue 状态变化
 * 自动重渲染，所以状态改动后要手动同步一次（`button.active` 正是它 `setActive()` 用的类名）。
 */
function syncToolbarToggleButtons() {
  const bar = barRef.value;
  if (!bar) return;
  const apply = (key, active) => {
    const button = bar.querySelector(`button[data-menu-key="${key}"]`);
    button?.classList.toggle("active", Boolean(active));
  };
  apply(CITATION_PANEL_MENU_KEY, props.citationPanelOpen);
  apply(FLOATING_TOOLS_MENU_KEY, props.floatingToolsEnabled);
}

/**
 * 竖屏情况下整条工具栏共用一条横向滚动条（同导航栏），而 wangEditor 的下拉面板是
 * 绝对定位在按钮内部的 —— 滚动容器会把它裁掉。所以面板可见期间，临时给工具栏放开 overflow。
 */
const TOOLBAR_PANEL_SELECTOR =
  ".w-e-select-list,.w-e-drop-panel,.w-e-bar-item-menus-container,.w-e-modal";

let toolbarObserver;
let toolbarPanelObserver;
/** 加 `.is-panel-open` 前的横向滚动量，关面板时还原（见 syncToolbarPanelOverflow） */
let savedScrollLeft = 0;

function isToolbarPanelVisible(el) {
  const style = window.getComputedStyle(el);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0"
  ) {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/**
 * 开关 `.is-panel-open`（放开 overflow，让下拉面板不被滚动容器裁掉）。
 *
 * ⚠️ 这里藏着一个必须小心处理的副作用：`overflow` 一从 `auto` 变成 `visible`，这个元素就
 * 不再是滚动容器了，浏览器会把 `scrollLeft` 丢掉（实测 416 → 0）。表现是窄屏下点开导入/导出时
 * 整条工具栏「唰」地跳回未滚动的样子，按钮跑到视口右侧之外，面板也跟着开在视口外看不见。
 *
 * 所以切换时不能只改 overflow：
 * - 打开时先记下 scrollLeft，改成用 `transform: translateX(-scrollLeft)` 做等价位移
 *   （视觉位置完全不变，面板绝对定位在按钮内部，会跟着一起走）；
 * - 关闭时移掉 transform 并把 scrollLeft 放回去。
 */
/**
 * 提示气泡（`data-tooltip` 的 `::after` 伪元素）画在按钮外面，同样会被滚动容器裁掉。
 * 伪元素不进 DOM，MutationObserver 抓不到，只能靠悬停事件：鼠标停在带提示的按钮上时
 * 也算「需要放开 overflow」。两个状态（面板开着 / 悬停中）走同一条释放与补偿逻辑。
 */
let tooltipHover = false;

function handleBarOver(event) {
  const hovered = Boolean(event.target?.closest?.("[data-tooltip]"));
  if (hovered === tooltipHover) return;
  tooltipHover = hovered;
  syncToolbarPanelOverflow();
}

function handleBarLeave() {
  if (!tooltipHover) return;
  tooltipHover = false;
  syncToolbarPanelOverflow();
}

function syncToolbarPanelOverflow() {
  const bar = barRef.value;
  if (!bar) return;
  const hasOpenPanel =
    tooltipHover ||
    [...bar.querySelectorAll(TOOLBAR_PANEL_SELECTOR)].some(isToolbarPanelVisible);
  // 状态没变就别动 DOM：本函数挂在 MutationObserver 上，改 class / style 会再触发一次
  if (hasOpenPanel === bar.classList.contains("is-panel-open")) return;

  if (hasOpenPanel) {
    savedScrollLeft = bar.scrollLeft;
    bar.style.setProperty("--life-toolbar-scroll-x", `-${savedScrollLeft}px`);
    bar.classList.add("is-panel-open");
  } else {
    bar.classList.remove("is-panel-open");
    bar.style.removeProperty("--life-toolbar-scroll-x");
    bar.scrollLeft = savedScrollLeft;
  }
}

function watchToolbarPanels() {
  const bar = barRef.value;
  if (!bar || typeof window.MutationObserver === "undefined") return;
  toolbarPanelObserver?.disconnect();
  // 直接在回调里同步（不经 requestAnimationFrame）：无头浏览器 / 页面没有新帧时
  // rAF 会迟迟不触发，表现为「面板明明开着，overflow 却没被放开，面板被裁掉」。
  // MutationObserver 本身已经是微任务批量回调，开销足够低。
  toolbarPanelObserver = new window.MutationObserver(syncToolbarPanelOverflow);
  // 观察工具栏根元素（而不是 wangEditor 后渲染出来的 .w-e-toolbar —— 那个时有时无，
  // 一旦在它出现前挂载就会永远失效）。
  toolbarPanelObserver.observe(bar, {
    attributeFilter: ["style", "class"],
    attributes: true,
    childList: true,
    subtree: true,
  });
}

/** 工具栏 DOM 变化后统一刷新：提示气泡 + 开关点亮 + 面板裁切状态 */
function refreshToolbarDecorations() {
  applyToolbarShortcutTooltips();
  syncToolbarToggleButtons();
  syncToolbarPanelOverflow();
}

/** 挂上两个观察器：一个盯 toolbar 结构变化补提示，一个盯下拉面板显隐放开 overflow */
function setupToolbar() {
  if (!barRef.value) return;
  refreshToolbarDecorations();
  toolbarObserver?.disconnect();
  toolbarObserver = new MutationObserver(refreshToolbarDecorations);
  toolbarObserver.observe(barRef.value, { childList: true, subtree: true });
  watchToolbarPanels();
}

watch(
  () => props.editor,
  async (editor) => {
    if (!editor) return;
    await nextTick();
    setupToolbar();
  },
  { immediate: true },
);

// 根元素挂载后立刻挂上观察器：wangEditor 稍后把 `.w-e-toolbar` 插进来时，
// childList 观察会自行触发一次刷新，不依赖「编辑器实例何时到」的时序。
onMounted(setupToolbar);

watch(
  () => [props.citationPanelOpen, props.floatingToolsEnabled],
  () => syncToolbarToggleButtons(),
);

onBeforeUnmount(() => {
  toolbarObserver?.disconnect();
  toolbarPanelObserver?.disconnect();
});
</script>

<style scoped>
.editor-toolbar-fixed {
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  z-index: 100;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
  height: 56px;
  padding: 0 14px;
  box-sizing: border-box;
  /* 窄屏时整条工具栏横向滚动（同导航栏）。容器里只有 wangEditor 的 `<Toolbar>` 一个元素，
     所有按钮都是它的菜单项，所以滚起来天然是"一条"。 */
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.editor-toolbar-fixed::-webkit-scrollbar {
  display: none;
}

/* 下拉面板绝对定位在按钮内部，会被滚动容器裁掉 —— 面板打开期间由 JS 加这个类放开。
   注意：overflow 一改成 visible，这个元素就不再是滚动容器，scrollLeft 会被浏览器丢成 0
   （整条工具栏跳回未滚动状态）。所以 JS 会同时写入 --life-toolbar-scroll-x，
   用位移把内容摆回原来的视觉位置（见 syncToolbarPanelOverflow）。 */
.editor-toolbar-fixed.is-panel-open {
  overflow: visible;
}

.editor-toolbar-fixed.is-panel-open > div {
  transform: translateX(var(--life-toolbar-scroll-x, 0px));
}

/* 主工具栏自身不滚动，交给 .editor-toolbar-fixed 统一滚；
   min-width: fit-content 保证窄屏时按内容撑开，而不是被压扁后折行。 */
.editor-toolbar-fixed :deep(.w-e-toolbar) {
  flex: 1 1 auto;
  min-width: fit-content;
  position: static;
  border: none;
  box-shadow: none;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

/* <Toolbar> 组件渲染出的那个无名 wrapper 才是本行的 flex 项 */
.editor-toolbar-fixed > div {
  flex: 1 1 auto;
  min-width: fit-content;
}

.editor-toolbar-fixed :deep(.w-e-bar) {
  padding: 0;
  background: transparent;
}

.editor-toolbar-fixed :deep(.w-e-bar-item) {
  flex: none;
  height: 32px;
  padding: 0 1px;
}

.editor-toolbar-fixed :deep(.w-e-bar-item button) {
  height: 30px;
  padding: 0 8px;
  border-radius: 6px;
}

.editor-toolbar-fixed :deep(.w-e-bar-divider) {
  height: 20px;
  margin: 0 6px;
}

/* 开关型菜单按钮点亮的样式（wangEditor 通过 button.active 表示"已激活"） */
.editor-toolbar-fixed :deep(.w-e-bar-item button.active) {
  background: #e8f3ee;
  color: #2b6b57;
}

/* 「浮动工具栏」这个开关按并入工具栏之前的样子单独还原。
   它的图标是细长条（26:14）而非方形符号，所以要显式给尺寸 —— 按钮宽度随内容
   （26 + 左右各 8px 内边距 = 42px），与原来那个 .floating-tools-toggle 一致。
   轨道 / 拨钮的颜色只能按标签命中：wangEditor 渲染图标前会递归剥掉 svg 子元素上的
   `class` 与 `fill`（core 的 `pd()`），写在子元素属性上的样式一个都留不下。
   造型对应原来那个开关：灰轨道 + 白钮 → 开启时蓝轨道 + 白钮、拨钮滑到右边。 */
.editor-toolbar-fixed :deep(.w-e-bar-item button[data-menu-key="lifeFloatingTools"] svg) {
  width: 26px;
  height: 14px;
}

.editor-toolbar-fixed :deep(.w-e-bar-item button[data-menu-key="lifeFloatingTools"] svg path) {
  fill: #a8b4bf;
}

.editor-toolbar-fixed :deep(.w-e-bar-item button[data-menu-key="lifeFloatingTools"] svg circle) {
  fill: #fff;
}

/* 开启态：底色与轨道都回到原来的蓝色（并入工具栏后曾被上面那条通用规则染成绿色），
   并把拨钮翻到右边 —— 对应原来那个开关里滑块的位移。 */
.editor-toolbar-fixed :deep(.w-e-bar-item button[data-menu-key="lifeFloatingTools"].active) {
  background: #eff8fe;
  color: #176fa9;
}

.editor-toolbar-fixed :deep(.w-e-bar-item button[data-menu-key="lifeFloatingTools"].active svg path) {
  fill: #2486ce;
}

.editor-toolbar-fixed :deep(.w-e-bar-item button[data-menu-key="lifeFloatingTools"].active svg) {
  transform: scaleX(-1);
}

/* 导入 / 导出的下拉面板。面板节点由 wangEditor 的 DropPanel 渲染在按钮内部，
   不是 Vue 模板产出的，所以用 :deep() 穿透；根元素 .editor-toolbar-fixed 带 scope 属性，
   作用域仍然成立。 */
.editor-toolbar-fixed :deep(.w-e-drop-panel) {
  padding: 0;
}

.editor-toolbar-fixed :deep(.life-toolbar-drop-panel) {
  display: flex;
  flex-direction: column;
  min-width: 176px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
  overflow: hidden;
}

.editor-toolbar-fixed :deep(.life-toolbar-drop-panel button) {
  display: block;
  width: 100%;
  padding: 8px 14px;
  border: none;
  background: #fff;
  color: #334155;
  font-size: 0.82rem;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.editor-toolbar-fixed :deep(.life-toolbar-drop-panel button:hover) {
  background: #f1f5f9;
  color: #2f806a;
}

@media (max-width: 640px) {
  .editor-toolbar-fixed {
    padding: 0 8px;
    gap: 2px;
  }
  .editor-toolbar-fixed :deep(.w-e-bar-divider) {
    margin: 0 4px;
  }
}
</style>
