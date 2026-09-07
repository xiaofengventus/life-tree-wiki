/**
 * UI-PDF v2 Document 数据模型
 * ------------------------------------------------------------------
 * 结构：Document → Page → Region(Layout) → Component → Style + Content
 *
 * 每个组件的基本 shape：
 *   {
 *     id:        "comp-xxx",                  // 全局唯一 ID
 *     type:      "heading",                   // 组件类型：heading/paragraph/image/...
 *     content:   { /* 每种类型自定义字段 *\/ },// 内容（用户编辑的部分）
 *     level:     2,                           // 可选，例如 heading 的 h1~h6
 *     style:     {},                          // 用户覆盖的 Style JSON（可以为空）
 *     styleOverridden: false,                 // 是否手动改过 style（决定切主题时是否整体替换）
 *   }
 *
 * 每页的基本 shape：
 *   {
 *     id: "page-xxx",
 *     type: "cover" | "toc" | "content" | "media" | "data" | "quote" | "blank" | "home",
 *     pageSize: { name: "A4", width: 210, height: 297 }, // 单位 mm
 *     orientation: "portrait" | "landscape",
 *     margin:     { top, right, bottom, left },          // 单位 mm
 *     background: { type: "solid" | "image" | "gradient", value: "#fff" | url | {...} },
 *     header: { enabled, content: "" },  // 页眉
 *     footer: { enabled, left: "", center: "", right: "{page} / {total}" },  // 页脚（支持变量 {page} {total}）
 *     showPageNumber: true,
 *     layout:     "single" | "two-column" | "left-sidebar" | "right-sidebar" | "three-column" | "full-width" | "custom",
 *     regions:    { main: [compId], sidebar: [compId], header: [compId], footer: [compId] }
 *   }
 */

import { DEFAULT_THEME_ID, buildTheme, getComponentDefaultStyle } from "./themes.js";

export const SPEC = "ui-pdf-layout/2";

const PAGE_SIZES_MM = {
  A4:     { width: 210, height: 297 },
  A5:     { width: 148, height: 210 },
  Letter: { width: 215.9, height: 279.4 },
};

export function getPageSize(name) {
  return PAGE_SIZES_MM[name] || PAGE_SIZES_MM.A4;
}

function uuid(prefix = "id") {
  const rand = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${String(rand).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

// ---------- 默认页面配置 ----------
function defaultPageOptions(overrides = {}) {
  const sizeName = overrides.pageSizeName || "A4";
  const size = getPageSize(sizeName);
  return {
    type: overrides.type || "content",
    pageSize: { name: sizeName, width: size.width, height: size.height },
    orientation: overrides.orientation || "portrait",
    margin: { top: 18, right: 16, bottom: 18, left: 16, ...(overrides.margin || {}) },
    background: overrides.background || { type: "solid", value: "#FFFFFF" },
    header: overrides.header || { enabled: true, content: "" },
    footer: overrides.footer || {
      enabled: true,
      left: "",
      center: "",
      right: "{page} / {total}",
    },
    showPageNumber: overrides.showPageNumber !== false,
    layout: overrides.layout || "single",
  };
}

// ---------- 创建空文档 ----------
export function createDocument(seedTitle = "", themeId = DEFAULT_THEME_ID) {
  const theme = buildTheme(themeId);
  const doc = {
    spec: SPEC,
    meta: {
      title: String(seedTitle || "未命名文档"),
      author: "",
      subject: "",
      language: "zh-CN",
      revision: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    theme: {
      id: theme.id,
      // 如果用户选择了 custom，可以在这里存 overrides
      customVariables: null,
      customComponentDefaults: null,
    },
    // 扁平化组件库，按 id 索引（避免 Page/Region 里有深层嵌套时查找困难）
    components: {},
    // 所有页面的有序列表
    pages: [],
  };

  // 默认创建一张封面 + 一张正文页
  addPage(doc, { type: "cover", layout: "full-width", header: { enabled: false }, footer: { enabled: false, left:"", center:"", right:"" }, showPageNumber: false });
  addPage(doc, { type: "content", layout: "single" });

  // 封面默认放标题+副标题+作者+日期
  const coverPage = doc.pages[0];
  insertComponent(doc, coverPage.id, "main", createComponent("articleTitle", {
    content: { text: doc.meta.title },
  }), 0);
  insertComponent(doc, coverPage.id, "main", createComponent("subtitle", {
    content: { text: "副标题 / Subtitle" },
  }), 1);
  insertComponent(doc, coverPage.id, "main", createComponent("author", {
    content: { text: "作者署名" },
  }), 2);
  insertComponent(doc, coverPage.id, "main", createComponent("date", {
    content: { text: new Date().toISOString().slice(0, 10) },
  }), 3);

  // 正文页默认放一个标题 + 一段占位文字
  const contentPage = doc.pages[1];
  insertComponent(doc, contentPage.id, "main", createComponent("heading", {
    level: 2,
    content: { text: "第一章 · 开始写作" },
  }), 0);
  insertComponent(doc, contentPage.id, "main", createComponent("paragraph", {
    content: { html: "<p>在这里开始你的正文。选中任意组件后，可以在右侧面板调整样式。</p>" },
  }), 1);

  return doc;
}

// ---------- 创建 Component ----------
export function createComponent(type, extras = {}) {
  const comp = {
    id: uuid(type),
    type,
    content: defaultContentFor(type, extras.level),
    level: extras.level || undefined,
    style: {},
    styleOverridden: false,
  };
  if (extras.content && typeof extras.content === "object") {
    comp.content = { ...comp.content, ...extras.content };
  }
  return comp;
}

function defaultContentFor(type, level) {
  switch (type) {
    // ---- 基础组件 ----
    case "text":      return { text: "一段文字" };
    case "heading":   return { text: `第 ${level || 2} 级标题` };
    case "image":     return {
      src: "", alt: "", caption: "", credit: "",
      widthPercent: 100, objectFit: "contain", align: "center",
    };
    case "divider":   return {};
    case "spacer":    return { height: 18 }; // px

    // ---- 内容组件 ----
    case "paragraph": return { html: "<p>在这里输入段落……</p>" };
    case "quote":     return { html: "<p>这是一段引用文字。</p>", cite: "" };
    case "list":      return { ordered: false, items: ["列表项一", "列表项二", "列表项三"] };
    case "table":     return {
      headerRow: true,
      rows: [
        ["指标", "数值", "说明"],
        ["示例 A", "1.23", "双击单元格后直接编辑"],
        ["示例 B", "4.56", "支持换行与多行内容"],
      ],
    };
    case "code":      return { language: "javascript", source: "// 在这里写代码\nconsole.log('Hello, PDF!');" };
    case "link":      return { href: "https://example.com", text: "链接文字" };

    // ---- 文章组件 ----
    case "articleTitle": return { text: "文档大标题" };
    case "subtitle":     return { text: "副标题" };
    case "author":       return { text: "作者" };
    case "date":         return { text: new Date().toISOString().slice(0, 10) };
    case "toc":          return { levels: [2, 3], autoGenerate: true, items: [] };
    case "footnote":     return { id: "fn-1", text: "脚注内容" };
    case "pageNumber":   return { pattern: "{page} / {total}" };

    // ---- 信息组件 ----
    case "callout": return { title: "提示", body: "<p>通用提示框内容。</p>" };
    case "warning": return { title: "⚠️ 警告", body: "<p>这里写需要注意的警告内容。</p>" };
    case "tip":     return { title: "💡 小贴士", body: "<p>这里写一个小技巧或便捷说明。</p>" };
    case "info":    return { title: "ℹ️ 信息", body: "<p>补充说明信息。</p>" };
    case "notice":  return { title: "❗ 重要公告", body: "<p>请仔细阅读这段内容。</p>" };

    // ---- 布局组件 ----
    case "container": return { childIds: [], tag: "div" };
    case "columns":   return { columns: 2, childIds: [[], []] };
    case "sidebar":   return { side: "left", childIds: { sidebar: [], main: [] } };
    case "card":      return { title: "卡片标题", bodyHtml: "<p>卡片内容……</p>" };
    case "grid":      return { columns: 3, rows: 2, cells: [] };

    // ---- 图片组件 ----
    case "picture": return {
      src: "", alt: "", caption: "", credit: "",
      width: "100%", height: "auto",
      objectFit: "contain",
      borderRadius: 4,
      shadow: "none",
      border: { enabled: true, width: 1, color: "#D8DFD8" },
      align: "center",
    };

    default:
      return {};
  }
}

// ---------- Page 增删 ----------
export function addPage(doc, pageOptions = {}, index = null) {
  const opts = defaultPageOptions(pageOptions);
  const page = {
    id: uuid("page"),
    ...opts,
    regions: {
      header:  opts.layout === "full-width" || pageOptions.headerPlacement ? [] : null,
      sidebar: (opts.layout === "left-sidebar" || opts.layout === "right-sidebar") ? [] : null,
      main:    [],
      footer:  opts.layout === "full-width" || pageOptions.footerPlacement ? [] : null,
    },
  };
  if (pageOptions.type === "cover") {
    page.header.enabled = false;
    page.footer.enabled = false;
    page.showPageNumber = false;
  }
  if (index === null || index >= doc.pages.length) {
    doc.pages.push(page);
  } else {
    doc.pages.splice(Math.max(0, index), 0, page);
  }
  return page;
}

export function removePage(doc, pageId) {
  if (doc.pages.length <= 1) return false; // 至少保留一页
  const page = doc.pages.find((p) => p.id === pageId);
  if (!page) return false;
  // 先把该页里的组件全部从 components 索引中移除
  for (const regionName of Object.keys(page.regions)) {
    const ids = page.regions[regionName];
    if (Array.isArray(ids)) {
      for (const id of ids) delete doc.components[id];
    }
  }
  doc.pages = doc.pages.filter((p) => p.id !== pageId);
  return true;
}

export function movePage(doc, pageId, toIndex) {
  const from = doc.pages.findIndex((p) => p.id === pageId);
  if (from < 0) return false;
  const [page] = doc.pages.splice(from, 1);
  const target = Math.max(0, Math.min(toIndex, doc.pages.length));
  doc.pages.splice(target, 0, page);
  return true;
}

// ---------- Component 增删改 ----------
export function insertComponent(doc, pageId, regionName, component, index = null) {
  const page = doc.pages.find((p) => p.id === pageId);
  if (!page) return false;
  if (!page.regions[regionName]) page.regions[regionName] = [];
  doc.components[component.id] = component;
  const arr = page.regions[regionName];
  if (index === null || index >= arr.length) arr.push(component.id);
  else arr.splice(Math.max(0, index), 0, component.id);
  return true;
}

export function removeComponent(doc, pageId, regionName, componentId) {
  const page = doc.pages.find((p) => p.id === pageId);
  if (!page) return false;
  const arr = page.regions[regionName];
  if (!Array.isArray(arr)) return false;
  const idx = arr.indexOf(componentId);
  if (idx < 0) return false;
  arr.splice(idx, 1);
  delete doc.components[componentId];
  return true;
}

export function moveComponent(doc, fromPageId, fromRegion, fromIndex, toPageId, toRegion, toIndex) {
  const fromPage = doc.pages.find((p) => p.id === fromPageId);
  const toPage = doc.pages.find((p) => p.id === toPageId);
  if (!fromPage || !toPage) return false;
  const fromArr = fromPage.regions[fromRegion];
  if (!Array.isArray(fromArr)) return false;
  const componentId = fromArr[fromIndex];
  if (!componentId) return false;
  fromArr.splice(fromIndex, 1);
  if (!toPage.regions[toRegion]) toPage.regions[toRegion] = [];
  const toArr = toPage.regions[toRegion];
  const target = Math.max(0, Math.min(toIndex, toArr.length));
  toArr.splice(target, 0, componentId);
  return true;
}

export function updateComponentContent(doc, componentId, newContent) {
  const comp = doc.components[componentId];
  if (!comp) return false;
  comp.content = { ...(comp.content || {}), ...newContent };
  return true;
}

export function updateComponentStyle(doc, componentId, stylePatch) {
  const comp = doc.components[componentId];
  if (!comp) return false;
  comp.style = { ...(comp.style || {}), ...stylePatch };
  comp.styleOverridden = true;
  return true;
}

export function resetComponentStyle(doc, componentId, themeInput) {
  const comp = doc.components[componentId];
  if (!comp) return false;
  comp.style = {};
  comp.styleOverridden = false;
  return true;
}

// ---------- 辅助：根据 componentId 反向查找它在哪个 page 的哪个 region 的哪个 index ----------
export function findComponentLocation(doc, componentId) {
  for (const page of doc.pages) {
    for (const regionName of Object.keys(page.regions)) {
      const arr = page.regions[regionName];
      if (!Array.isArray(arr)) continue;
      const idx = arr.indexOf(componentId);
      if (idx >= 0) return { pageId: page.id, regionName, index: idx, page };
    }
  }
  return null;
}

// ---------- 序列化 / 反序列化（JSON round-trip 安全） ----------
export function serializeDocument(doc) {
  return JSON.stringify(clone(doc), null, 2);
}

export function parseDocument(jsonText) {
  const parsed = JSON.parse(String(jsonText || ""));
  return normalizeDocument(parsed);
}

export function normalizeDocument(input) {
  const source = input && typeof input === "object" ? clone(input) : {};
  if (!source.pages || !Array.isArray(source.pages)) {
    // 如果没有 v2 pages，尝试从旧版 uiPdf v1 兼容加载
    return createDocument(source.meta?.title || source.title || "");
  }
  const doc = {
    spec: source.spec || SPEC,
    meta: {
      title: "", author: "", subject: "", language: "zh-CN", revision: "",
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      ...(source.meta || {}),
    },
    theme: {
      id: source.theme?.id || DEFAULT_THEME_ID,
      customVariables: source.theme?.customVariables || null,
      customComponentDefaults: source.theme?.customComponentDefaults || null,
    },
    components: {},
    pages: [],
  };
  // 规范化组件
  const all = source.components || {};
  for (const id of Object.keys(all)) {
    const raw = all[id] || {};
    const c = {
      id: raw.id || id,
      type: raw.type || "paragraph",
      level: raw.level || undefined,
      content: raw.content && typeof raw.content === "object" ? raw.content : defaultContentFor(raw.type || "paragraph", raw.level),
      style: raw.style && typeof raw.style === "object" ? raw.style : {},
      styleOverridden: Boolean(raw.styleOverridden),
    };
    doc.components[c.id] = c;
  }
  // 规范化页面
  doc.pages = source.pages.map((rawPage) => {
    const opts = defaultPageOptions({
      type: rawPage.type,
      pageSizeName: rawPage.pageSize?.name || "A4",
      orientation: rawPage.orientation,
      margin: rawPage.margin,
      background: rawPage.background,
      header: rawPage.header,
      footer: rawPage.footer,
      layout: rawPage.layout,
    });
    const page = {
      id: rawPage.id || uuid("page"),
      ...opts,
      showPageNumber: rawPage.showPageNumber !== false,
      regions: {
        header:  Array.isArray(rawPage.regions?.header)  ? rawPage.regions.header.filter((id) => doc.components[id]) : null,
        sidebar: Array.isArray(rawPage.regions?.sidebar) ? rawPage.regions.sidebar.filter((id) => doc.components[id]) : null,
        main:    Array.isArray(rawPage.regions?.main)    ? rawPage.regions.main.filter((id) => doc.components[id]) : [],
        footer:  Array.isArray(rawPage.regions?.footer)  ? rawPage.regions.footer.filter((id) => doc.components[id]) : null,
      },
    };
    return page;
  });
  if (!doc.pages.length) addPage(doc);
  return doc;
}

// ---------- 页面尺寸（px，用于编辑器画布和 PDF 导出） ----------
const DPI = 96; // 浏览器 1in = 96 CSS px
const MM_PER_INCH = 25.4;
export function mmToPx(mm) { return Number(mm) * (DPI / MM_PER_INCH); }

export function pageMetricsPx(page) {
  const size = page?.pageSize || getPageSize("A4");
  const w = Number(size.width);
  const h = Number(size.height);
  const portrait = page?.orientation !== "landscape";
  const widthMM  = portrait ? w : h;
  const heightMM = portrait ? h : w;
  const margin = page?.margin || { top: 18, right: 16, bottom: 18, left: 16 };
  return {
    widthMM, heightMM,
    width:  mmToPx(widthMM),
    height: mmToPx(heightMM),
    marginMM: margin,
    margin: {
      top:    mmToPx(margin.top),
      right:  mmToPx(margin.right),
      bottom: mmToPx(margin.bottom),
      left:   mmToPx(margin.left),
    },
  };
}

// 给 SharedRenderer / Playwright 用的：把每页中用到的组件按顺序拿出
export function collectPageComponents(doc, pageId) {
  const page = doc.pages.find((p) => p.id === pageId);
  if (!page) return null;
  const result = { page, regions: {} };
  for (const region of Object.keys(page.regions)) {
    const arr = page.regions[region];
    if (Array.isArray(arr)) {
      result.regions[region] = arr.map((id) => doc.components[id]).filter(Boolean);
    } else {
      result.regions[region] = null;
    }
  }
  return result;
}

// 兼容旧版 uiPdf.js 的 BLOCK_TYPES：生成一组 v2 Component 列表
export function legacyBlocksToComponents(blocks) {
  if (!Array.isArray(blocks)) return [];
  return blocks.map((b) => {
    switch (b.type) {
      case "heading":   return createComponent("heading",   { level: b.level, content: { text: b.text || "" } });
      case "paragraph": return createComponent("paragraph", { content: { html: b.html || "" } });
      case "image":     return createComponent("picture",   {
        content: { src: b.src || "", alt: b.alt || "", caption: b.caption || "", credit: b.credit || "", widthPercent: b.widthPercent ?? 100, objectFit: b.objectFit || "contain", align: b.align || "center" },
      });
      case "divider":   return createComponent("divider", {});
      case "formula":   return createComponent("code", {
        content: { language: "latex", source: b.latex || "" },
      });
      case "card":      return createComponent("card", {
        content: { title: b.title || "卡片", bodyHtml: (b.rows || []).map((r) => `<tr><th>${r.label || ""}</th><td>${r.value || ""}</td></tr>`).join("") },
      });
      case "tree":      return createComponent("card", {
        content: { title: b.title || "进化树", bodyHtml: `<p>进化树 ID：<code>${b.treeId || ""}</code></p>` },
      });
      case "gallery":   return createComponent("grid", {
        content: { columns: b.columns || 2, cells: (b.images || []).map((img) => ({ kind: "image", src: img.src, alt: img.alt, caption: img.caption })) },
      });
      case "pageBreak": return createComponent("spacer", { content: { height: 0 } });
      default:          return createComponent("paragraph", { content: { html: "" } });
    }
  });
}
