/**
 * 编辑器内的 **Markdown 单元格显示层**：单元格右上角挂「代码 / 预览」两个标签，
 * `Shift + Enter` 切到预览，双击预览回到代码。
 *
 * ## 为什么是「浮层」而不是自定义节点
 *
 * wangEditor 的 `registerRenderElemConf` 能注册自定义元素，但 `renderElem` 返回的是
 * snabbdom 的 VNode（不是 DOM、也不是 Vue 组件），想在单元格里挂一个可编辑的 Vue 组件
 * 需要自己接管光标、选区、撤销、粘贴 —— 收益远小于代价。
 *
 * 所以沿用了「代码块案例」那套思路：**载体就是普通代码块**（`language: md`），
 * 编辑态和预览态只是**显示层**的差别，文档数据一个字节都不改。
 * 浮层是挂在 `.editor-wrapper` 里的绝对定位元素，**完全不碰 slate 渲染出来的 DOM**
 * （碰了会被 slate 的重渲染冲掉，也会把选区搞乱）。
 *
 * ## 两条实测确认过的关键事实（`.local-3d/probe-md-cell*.mjs`）
 *
 * 1. 编辑器 DOM 里 `<code>` 上**没有任何语言标记**（只有 `id="w-e-element-N"`），
 *    所以识别单元格只能走 slate 数据：`editor.children[i].children[0].language`。
 * 2. `[data-slate-editor]` 的直接子元素与 `editor.children` **按索引一一对应**，
 *    所以拿到下标就能定位到对应的块 DOM。
 *
 * 另外实测 `editor.getHtml()` 会序列化成 `<pre><code class="language-md">`，
 * 语言标记是保留的，因此阅读页那条路（richHtml.js 的 upgradeMarkdownCells）能正常识别。
 */
import { isMarkdownCellLanguage, MARKDOWN_CELL_BODY_CLASS, MARKDOWN_CELL_LANGUAGE } from "./markdownCell.js";
import { renderMarkdownCellSource } from "./markdownCellRender.js";
import { decorateRichHtml } from "./richHtml.js";

export const MD_CELL_LAYER_CLASS = "life-md-cell-layer";
export const MD_CELL_BAR_CLASS = "life-md-cell-bar";
export const MD_CELL_PANEL_CLASS = "life-md-cell-panel";

/** 代码态 / 预览态 */
const STATE_CODE = "code";
const STATE_PREVIEW = "preview";

/** 每格浮层距单元格边缘的留白 */
const INSET = 8;

/**
 * 预览内容渲染：走和阅读页同一条装饰管线（Prism 高亮、表格包裹、代码块案例），
 * 但不挂复制按钮 —— 按钮会挡住预览里的交互。
 */
function renderPreviewBody(source) {
  const html = renderMarkdownCellSource(source);
  if (!html.trim()) return "";
  return decorateRichHtml(html, { codeCopy: false });
}

/**
 * 建立显示层。
 *
 * @param {object} options
 * @param {object} options.editor  wangEditor 实例（IDomEditor）
 * @param {HTMLElement} options.wrapper `.editor-wrapper` 元素，浮层挂在它里面
 * @returns {{ refresh: Function, destroy: Function, stateOf: Function }}
 */
export function createMarkdownCellView({ editor, wrapper }) {
  if (!editor || !wrapper) {
    return { refresh() {}, destroy() {}, stateOf: () => null };
  }

  const layer = document.createElement("div");
  layer.className = MD_CELL_LAYER_CLASS;
  layer.setAttribute("aria-hidden", "false");
  wrapper.appendChild(layer);

  /** @type {Map<HTMLElement, { pre: HTMLElement, bar: HTMLElement, panel: HTMLElement, state: string, renderedSource: string|null, error: string|null }>} */
  const items = new Map();

  const editorRoot = () => wrapper.querySelector("[data-slate-editor]");

  /* ---------------- 定位 ---------------- */

  /**
   * 用 getBoundingClientRect 的差值算位置，而不是 offsetTop。
   * 因为 `.w-e-text-container` 自己也是 position:relative，offsetParent 未必是 wrapper；
   * 而 rect 差值天然把所有中间容器的滚动、边距、边框都算进去了。
   */
  function measure(element) {
    const wrapRect = wrapper.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left - wrapRect.left - wrapper.clientLeft,
      top: rect.top - wrapRect.top - wrapper.clientTop,
      width: rect.width,
      height: rect.height,
    };
  }

  function placeItem(item) {
    const { left, top, width, height } = measure(item.pre);

    item.bar.style.left = `${Math.round(left + width - item.bar.offsetWidth - INSET)}px`;
    item.bar.style.top = `${Math.round(top + INSET)}px`;

    item.panel.style.left = `${Math.round(left)}px`;
    item.panel.style.top = `${Math.round(top)}px`;
    item.panel.style.width = `${Math.round(width)}px`;
    item.panel.style.height = `${Math.round(height)}px`;
  }

  /* ---------------- 状态 ---------------- */

  function applyState(item) {
    const isPreview = item.state === STATE_PREVIEW;
    item.bar.dataset.state = item.state;
    for (const tab of item.bar.querySelectorAll("[data-tab]")) {
      const active = tab.dataset.tab === item.state;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    }
    item.panel.hidden = !isPreview;
    if (isPreview) renderPanel(item);
  }

  function renderPanel(item) {
    if (item.renderedSource === item.source && item.error === null) return;

    let body = "";
    let error = null;
    try {
      body = renderPreviewBody(item.source);
    } catch (cause) {
      error = cause?.message || "Markdown 渲染失败";
    }

    item.renderedSource = item.source;
    item.error = error;

    if (error) {
      item.panelBody.innerHTML = "";
      const tip = document.createElement("p");
      tip.className = "life-md-cell-error";
      tip.textContent = `预览失败：${error}`;
      item.panelBody.appendChild(tip);
      return;
    }
    if (!body) {
      item.panelBody.innerHTML = "";
      const tip = document.createElement("p");
      tip.className = "life-md-cell-empty";
      tip.textContent = "这个单元格还没有内容，双击回到编辑。";
      item.panelBody.appendChild(tip);
      return;
    }
    item.panelBody.innerHTML = body;
  }

  function setState(item, state) {
    if (item.state === state) return;
    item.state = state;
    if (state === STATE_PREVIEW) {
      // 进预览前先重新量一次：源码编辑期间单元格高度可能已经变了
      placeItem(item);
    }
    applyState(item);
  }

  /* ---------------- Markdown 单元格的收集 ---------------- */

  /**
   * 扫一遍所有顶层块，挑出 Markdown 单元格（`pre` + `language: md|markdown`）。
   *
   * 事实 2：直接子元素与顶层节点按索引一一对应，所以能用下标取到对应的 DOM。
   */
  function collectCells() {
    const root = editorRoot();
    if (!root) return [];
    const nodes = editor.children || [];
    const elements = [...root.children];
    const cells = [];

    nodes.forEach((node, index) => {
      if (node?.type !== "pre") return;
      const code = node.children?.[0];
      if (!isMarkdownCellLanguage(code?.language)) return;
      const element = elements[index];
      if (!element) return;
      cells.push({
        element,
        source: (code.children || []).map((child) => child.text || "").join(""),
      });
    });

    return cells;
  }

  /* ---------------- Markdown 单元格：建/拆 ---------------- */

  function createItem(pre, source) {
    const item = {
      pre,
      source,
      state: STATE_CODE,
      renderedSource: null,
      error: null,
    };

    const bar = document.createElement("div");
    bar.className = MD_CELL_BAR_CLASS;
    bar.dataset.state = STATE_CODE;
    bar.setAttribute("role", "tablist");
    bar.setAttribute("aria-label", "Markdown 单元格显示方式");

    for (const [tab, label, hint] of [
      [STATE_CODE, "代码", "编辑 Markdown 源码"],
      [STATE_PREVIEW, "预览", "渲染后的效果（Shift + Enter）"],
    ]) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.tab = tab;
      button.textContent = label;
      button.title = hint;
      button.setAttribute("role", "tab");
      // 别让点击把编辑器选区弄没、也别冒泡给 slate
      button.addEventListener("mousedown", (event) => event.preventDefault());
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        setState(item, tab);
      });
      bar.appendChild(button);
    }

    const panel = document.createElement("div");
    panel.className = MD_CELL_PANEL_CLASS;
    panel.hidden = true;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Markdown 预览");

    const panelBody = document.createElement("div");
    panelBody.className = `life-md-cell-panel-body ${MARKDOWN_CELL_BODY_CLASS}`;
    panel.appendChild(panelBody);

    // 双击预览回到代码态
    panel.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setState(item, STATE_CODE);
    });

    item.bar = bar;
    item.panel = panel;
    item.panelBody = panelBody;

    layer.appendChild(bar);
    layer.appendChild(panel);
    return item;
  }

  /** Markdown 单元格的对齐：新增的建浮层、消失的拆掉、都在的更新源码并重新定位 */
  function syncCells(cells) {
    const seen = new Set();

    for (const { element, source } of cells) {
      seen.add(element);
      let item = items.get(element);
      if (!item) {
        item = createItem(element, source);
        items.set(element, item);
      } else if (item.source !== source) {
        item.source = source;
        // 源码变了：预览内容作废，下次进预览时重渲染
        item.renderedSource = null;
      }
      placeItem(item);
      applyState(item);
    }

    for (const [element, item] of items) {
      if (seen.has(element)) continue;
      item.bar.remove();
      item.panel.remove();
      items.delete(element);
    }
  }

  /* ---------------- 交互 ---------------- */

  /** 光标所在的 md 单元格（用于 Shift + Enter / Esc） */
  function itemAtSelection() {
    const selection = window.getSelection?.();
    const anchor = selection?.anchorNode;
    if (!anchor) return null;
    const node = anchor.nodeType === 1 ? anchor : anchor.parentElement;
    if (!node) return null;
    for (const [element, item] of items) {
      if (element.contains(node)) return item;
    }
    return null;
  }

  /**
   * Shift + Enter：把光标所在的单元格切到预览态。
   *
   * 用捕获阶段监听，抢在 wangEditor 自己的 keydown 处理之前 ——
   * 否则它会先插入换行，单元格高度一变，浮层位置就对不上了。
   */
  function onKeydown(event) {
    if (event.key === "Escape") {
      const item = itemAtSelection();
      if (item && item.state === STATE_PREVIEW) {
        event.preventDefault();
        event.stopPropagation();
        setState(item, STATE_CODE);
      }
      return;
    }

    if (event.key !== "Enter" || !event.shiftKey) return;
    const item = itemAtSelection();
    if (!item) return;
    if (item.state === STATE_PREVIEW) return;

    event.preventDefault();
    event.stopPropagation();
    setState(item, STATE_PREVIEW);
  }

  /* ---------------- 观察与清理 ---------------- */

  let syncTimer = null;
  /** 合并同一轮里的多次 DOM 变更，避免连续打字时反复重建浮层 */
  function scheduleSync() {
    if (syncTimer !== null) return;
    syncTimer = window.setTimeout(() => {
      syncTimer = null;
      sync();
    }, 60);
  }

  const observer =
    typeof MutationObserver === "undefined"
      ? null
      : new MutationObserver(() => {
          // 注意：观察的是编辑器根元素，浮层挂在 layer 里，不会被自己触发
          const root = editorRoot();
          if (!root) return;
          scheduleSync();
        });

  function observeRoot() {
    if (!observer) return;
    const root = editorRoot();
    if (!root) return;
    observer.disconnect();
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  // 页面滚动 / 窗口尺寸变化时重新定位。这里直接同步执行，不塞进 rAF ——
  // 页面静止或跑在无头浏览器里时可能迟迟没有新帧，浮层就会错位。
  let lastPositionTick = 0;
  function onViewportChange() {
    const now = Date.now();
    if (now - lastPositionTick < 16) return;
    lastPositionTick = now;
    for (const item of items.values()) placeItem(item);
  }

  /** 全量对齐：md 单元格浮层 */
  function sync() {
    syncCells(collectCells());
  }

  wrapper.addEventListener("keydown", onKeydown, true);
  window.addEventListener("scroll", onViewportChange, true);
  window.addEventListener("resize", onViewportChange);

  // 编辑器实例就绪后再观察一次（首次 refresh 时 DOM 可能还没渲染完）
  window.setTimeout(() => {
    observeRoot();
    sync();
  }, 0);
  observeRoot();
  sync();

  return {
    refresh: sync,
    stateOf: (element) => items.get(element)?.state ?? null,
    destroy() {
      if (syncTimer !== null) window.clearTimeout(syncTimer);
      observer?.disconnect();
      wrapper.removeEventListener("keydown", onKeydown, true);
      window.removeEventListener("scroll", onViewportChange, true);
      window.removeEventListener("resize", onViewportChange);
      for (const item of items.values()) {
        item.bar.remove();
        item.panel.remove();
      }
      items.clear();
      // 标签条 / 预览面板都挂在 layer 里，layer 一走它们跟着走
      layer.remove();
    },
  };
}

/** 编辑器里插入空单元格时用的默认语言标记（供外部引用，避免各处硬编码） */
export { MARKDOWN_CELL_LANGUAGE };
