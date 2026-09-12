/**
 * 编辑器工具栏的「自定义菜单」。
 *
 * 这些入口原本挂在工具栏**外**的独立按钮组里（左侧引用按钮 / 右侧开关与导入导出下拉，
 * 自带描边圆角），和 wangEditor 原生按钮在视觉与滚动行为上分成几块。现在**全部**按项目
 * 既有的菜单注册模式（见 wangEditorCitation.js / wangEditorInsertMenu.js）注册成
 * wangEditor 菜单，由 `toolbarKeys` 决定位置 —— 于是整条工具栏里只剩 `<Toolbar>` 一个
 * 元素，天然就是一条，不再需要靠外层容器拼接。
 *
 * 两类菜单：
 * 1. **插入类**（卡片 / 进化树 / Markdown 导入）：`exec` 派发事件，由 create_post.vue 打开
 *    插入面板对应分区。
 * 2. **工具类**：
 *    - 参考文献开关、浮动工具栏开关 —— 状态型，`isActive()` 读注入的状态，`exec` 派发切换事件；
 *    - 导入 / 导出 —— 下拉型，用 wangEditor 官方的 `showDropPanel + getPanelContentElem`
 *      渲染下拉面板（和「正文」「字号」那些原生下拉同一套容器与定位逻辑），
 *      点条目后派发事件交给 create_post.vue 执行。
 *
 * 菜单本身不碰业务状态，只派发 `TOOLBAR_MENU_EVENT`；状态回写后由 create_post.vue
 * 调用 `syncToolbarToggleButtons()` 把 active 类补到按钮上
 * （wangEditor 的菜单按钮不会因 Vue 状态变化自动重渲染）。
 */
import { Boot } from "@wangeditor/editor";

export const TOOLBAR_MENU_EVENT = "life-open-tool-section";

/* ---------- 插入类 ---------- */
export const INSERT_CARD_MENU_KEY = "lifeInsertCard";
export const INSERT_TREE_MENU_KEY = "lifeInsertTree";
export const IMPORT_MARKDOWN_MENU_KEY = "lifeImportMarkdown";

/* ---------- 工具类 ---------- */
export const CITATION_PANEL_MENU_KEY = "lifeCitationPanel";
export const FLOATING_TOOLS_MENU_KEY = "lifeFloatingTools";
export const IMPORT_DOC_MENU_KEY = "lifeImportDoc";
export const EXPORT_DOC_MENU_KEY = "lifeExportDoc";

/** 下拉型工具菜单的条目（与原「导入 ▾ / 导出 ▾」下拉完全一致） */
const IO_ITEMS = [
  { format: "docx", label: "Word 文档（.docx）" },
  { format: "md", label: "Markdown（.md）" },
  { format: "html", label: "富文本 HTML（.html）" },
];

/* ---------------- 图标 ---------------- */

/** 四宫格：对应原来的「▦ 配置文章卡片」 */
const cardIcon = `
  <svg viewBox="0 0 1024 1024" aria-hidden="true">
    <path d="M152 152h320v320H152V152zm400 0h320v320H552V152zM152 552h320v320H152V552zm400 0h320v320H552V552z"></path>
  </svg>`;

/** 分叉树：对应原来的「🌳 进化树块」 */
const treeIcon = `
  <svg viewBox="0 0 1024 1024" aria-hidden="true">
    <path d="M468 80h88v264h204v80H556v136h148v80H556v304h-88V640H316v-80h152V424H264v-80h204V80z"></path>
  </svg>`;

/** 下箭头落入文档：对应原来的「M↓ 从 Markdown 导入」 */
const markdownImportIcon = `
  <svg viewBox="0 0 1024 1024" aria-hidden="true">
    <path d="M480 72h64v328h160L512 632 320 400h160V72z"></path>
    <path d="M176 680h672v272H176V680zm80 72v128h512V752H256z"></path>
  </svg>`;

/** 实心双页书：参考文献面板开关 */
const citationIcon = `
  <svg viewBox="0 0 1024 1024" aria-hidden="true">
    <path d="M528 288c-104-52-216-78-336-78v576c120 0 232 26 336 78 104-52 216-78 336-78V210c-120 0-232 26-336 78z"></path>
  </svg>`;

/**
 * 拨动开关：浮动工具栏开关。
 *
 * 尺寸与配色按并入工具栏之前那个独立开关来做：轨道 26×14、拨钮直径 10、距边 2px。
 * 其余菜单图标都是 1024 方阵的实心符号，只有这个是细长条 —— 用 `viewBox="0 0 26 14"`
 * 保持 26:14 的宽高比，再由 EditorToolbar.vue 把这个按钮的 svg 设成 26×14
 * （按钮宽度随之变回 26 + 左右各 8px 内边距 = 42px，与原来那个开关一致）。
 *
 * ⚠️ 这里**不能**用 `class` 或 `fill` 属性来区分轨道和拨钮，也不能用 `<rect>`：
 * wangEditor 渲染色图标前会递归执行 `removeAttr("width"/"height"/"fill"/"class")`
 * （core 里的 `pd()`），`<rect>` 一旦丢了 width/height 就什么都画不出来。
 * 所以轨道用「带弧线的实心 path」，颜色由 CSS 按标签命中 `svg path` / `svg circle`。
 */
const floatingToolsIcon = `
  <svg viewBox="0 0 26 14" aria-hidden="true">
    <path d="M7 0h12a7 7 0 0 1 0 14H7A7 7 0 0 1 7 0z"></path>
    <circle cx="7" cy="7" r="5"></circle>
  </svg>`;

/** 箭头落入托盘：导入 */
const importDocIcon = `
  <svg viewBox="0 0 1024 1024" aria-hidden="true">
    <path d="M472 120h80v292h132L512 592 340 412h132V120z"></path>
    <path d="M152 616h720v288H152V616zm80 72v144h560V688H232z"></path>
  </svg>`;

/** 箭头托出托盘：导出 */
const exportDocIcon = `
  <svg viewBox="0 0 1024 1024" aria-hidden="true">
    <path d="M512 96l172 180H552v268h-80V276H340L512 96z"></path>
    <path d="M152 616h720v288H152V616zm80 72v144h560V688H232z"></path>
  </svg>`;

/* ---------------- 状态注入 ---------------- */

let toolbarState = {
  citationPanelOpen: () => false,
  floatingToolsEnabled: () => false,
};

/**
 * 由 create_post.vue 注入状态读取器，供状态型菜单的 `isActive()` 使用。
 * wangEditor 会在编辑器渲染 / 选区变化时调用 `isActive()`，从而点亮按钮。
 */
export function setToolbarMenuState(next = {}) {
  toolbarState = { ...toolbarState, ...next };
}

/* ---------------- 菜单基类 ---------------- */

/** 事件型菜单：点击后派发事件，不显示下拉面板 */
function createActionMenuClass({ title, iconSvg, action, getActive }) {
  return class ToolbarActionMenu {
    title = title;

    iconSvg = iconSvg;

    tag = "button";

    // 面板开关 / 状态切换与编辑器选区无关，任何时候都可点
    alwaysEnable = true;

    getValue() {
      return "";
    }

    isActive() {
      return getActive ? Boolean(getActive()) : false;
    }

    isDisabled() {
      return false;
    }

    exec(editor) {
      editor.hidePanelOrModal();
      window.dispatchEvent(
        new CustomEvent(TOOLBAR_MENU_EVENT, { detail: { editor, action } }),
      );
    }
  };
}

/** 插入类菜单：点击后派发事件，由宿主打开插入面板的指定分区 */
function createSectionMenuClass({ title, iconSvg, section }) {
  return class ToolbarSectionMenu {
    title = title;

    iconSvg = iconSvg;

    tag = "button";

    alwaysEnable = true;

    getValue() {
      return "";
    }

    isActive() {
      return false;
    }

    isDisabled() {
      return false;
    }

    exec(editor) {
      editor.hidePanelOrModal();
      window.dispatchEvent(
        new CustomEvent(TOOLBAR_MENU_EVENT, {
          detail: { editor, action: "open-section", section },
        }),
      );
    }
  };
}

/** 下拉型菜单：点击按钮展开面板，面板里是几个可点条目 */
function createDropPanelMenuClass({ title, iconSvg, action, items }) {
  return class ToolbarDropPanelMenu {
    title = title;

    iconSvg = iconSvg;

    tag = "button";

    alwaysEnable = true;

    // 置 true 后 wangEditor 走下拉面板分支（`handleDropPanel`），不再调用 exec
    showDropPanel = true;

    getValue() {
      return "";
    }

    isActive() {
      return false;
    }

    isDisabled() {
      return false;
    }

    exec() {}

    getPanelContentElem(editor) {
      const list = document.createElement("div");
      list.className = "life-toolbar-drop-panel";
      for (const item of items) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = item.label;
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          editor.hidePanelOrModal();
          window.dispatchEvent(
            new CustomEvent(TOOLBAR_MENU_EVENT, {
              detail: { editor, action, format: item.format },
            }),
          );
        });
        list.appendChild(button);
      }
      return list;
    }
  };
}

/* ---------------- 注册 ---------------- */

const TOOLBAR_MENUS = [
  {
    key: CITATION_PANEL_MENU_KEY,
    title: "打开 / 收起参考文献面板",
    create: () =>
      new (createActionMenuClass({
        title: "打开 / 收起参考文献面板",
        iconSvg: citationIcon,
        action: "toggle-citation",
        getActive: () => toolbarState.citationPanelOpen(),
      }))(),
  },
  {
    key: INSERT_CARD_MENU_KEY,
    title: "配置文章卡片（生物卡片 / 自定义卡片）",
    create: () =>
      new (createSectionMenuClass({
        title: "配置文章卡片（生物卡片 / 自定义卡片）",
        iconSvg: cardIcon,
        section: "sidebar",
      }))(),
  },
  {
    key: INSERT_TREE_MENU_KEY,
    title: "插入 Research 进化树块",
    create: () =>
      new (createSectionMenuClass({
        title: "插入 Research 进化树块",
        iconSvg: treeIcon,
        section: "tree",
      }))(),
  },
  {
    key: IMPORT_MARKDOWN_MENU_KEY,
    title: "从 Markdown 导入正文",
    create: () =>
      new (createSectionMenuClass({
        title: "从 Markdown 导入正文",
        iconSvg: markdownImportIcon,
        section: "markdown",
      }))(),
  },
  {
    key: FLOATING_TOOLS_MENU_KEY,
    title: "浮动工具栏开关",
    create: () =>
      new (createActionMenuClass({
        title: "浮动工具栏开关",
        iconSvg: floatingToolsIcon,
        action: "toggle-floating-tools",
        getActive: () => toolbarState.floatingToolsEnabled(),
      }))(),
  },
  {
    key: IMPORT_DOC_MENU_KEY,
    title: "导入文档",
    create: () =>
      new (createDropPanelMenuClass({
        title: "导入文档",
        iconSvg: importDocIcon,
        action: "import",
        items: IO_ITEMS,
      }))(),
  },
  {
    key: EXPORT_DOC_MENU_KEY,
    title: "导出文档",
    create: () =>
      new (createDropPanelMenuClass({
        title: "导出文档",
        iconSvg: exportDocIcon,
        action: "export",
        items: IO_ITEMS,
      }))(),
  },
];

let registered = false;

export function registerToolbarMenus() {
  if (registered) return;
  for (const item of TOOLBAR_MENUS) {
    try {
      Boot.registerMenu({ key: item.key, factory: () => item.create() });
    } catch (error) {
      // 热更新时重复注册会抛错，键名相同即可忽略（与其它 register* 的写法一致）
      if (!String(error?.message || error).includes(item.key)) throw error;
    }
  }
  registered = true;
}

export function toolbarMenuLabel(key) {
  return TOOLBAR_MENUS.find((item) => item.key === key)?.title || "";
}
