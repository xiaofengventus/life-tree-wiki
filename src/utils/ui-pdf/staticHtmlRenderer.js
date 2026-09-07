/**
 * staticHtmlRenderer.js —— 把 v2 Document JSON 渲染成静态 HTML 字符串
 * ------------------------------------------------------------------
 * 用途：供 Node.js 端的 Playwright PDF 导出脚本直接 import 使用。
 * 它不依赖 Vue / 浏览器 API，就是纯字符串拼接。
 *
 * 生成的 DOM 结构 + 每个组件的 inline CSS 与 SharedRenderer.vue 完全一致，
 * 所以 PDF 输出和编辑器所见 100% 对齐。
 */

import { styleToCssString } from "./styleGenerator.js";
import { buildTheme, resolveComponentStyle, themeToCssVariables } from "./themes.js";
import { collectPageComponents, pageMetricsPx, mmToPx } from "./documentModel.js";

const ESC_MAP = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" };
function esc(s) { return String(s ?? "").replace(/[<>&"]/g, (c) => ESC_MAP[c] ?? c); }

function inlineStyle(styleObj) {
  if (!styleObj || typeof styleObj !== "object") return "";
  const pairs = [];
  for (const key of Object.keys(styleObj)) {
    if (styleObj[key] === undefined || styleObj[key] === null || styleObj[key] === "") continue;
    const cssKey = key.replace(/([A-Z])/g, (_, ch) => `-${ch.toLowerCase()}`);
    pairs.push(`${cssKey}:${styleObj[key]}`);
  }
  return pairs.join(";");
}

function rs(comp, theme) {
  const json = resolveComponentStyle(theme, comp);
  return styleToCssString(json);
}

function pageVarsCss(theme) {
  return themeToCssVariables(theme);
}

function metrics(page) { return pageMetricsPx(page); }

function layoutVars(page) {
  switch (page.layout) {
    case "two-column":    return `--body-cols:minmax(0,1fr) minmax(0,1fr);--body-gap:${mmToPx(7)}px`;
    case "three-column":  return `--body-cols:repeat(3, minmax(0,1fr));--body-gap:${mmToPx(5)}px`;
    case "left-sidebar":  return `--body-cols:${mmToPx(38)}px minmax(0,1fr);--body-gap:${mmToPx(7)}px`;
    case "right-sidebar": return `--body-cols:minmax(0,1fr) ${mmToPx(38)}px;--body-gap:${mmToPx(7)}px`;
    case "full-width":    return `--body-cols:minmax(0,1fr)`;
    default:              return `--body-cols:minmax(0,1fr)`;
  }
}

function backgroundStyle(page) {
  const bg = page.background || { type: "solid", value: "#FFFFFF" };
  if (bg.type === "image")    return `background:url(${esc(bg.value)}) center/cover no-repeat`;
  if (bg.type === "gradient") return `background:${esc(bg.value || bg.css || "linear-gradient(180deg,#fff,#f6f8f6)")}`;
  return `background-color:${esc(bg.value || "#FFFFFF")}`;
}

function replacePageVars(value, pageIndex, totalPages) {
  return String(value || "")
    .replace(/\{page\}/g,  String(pageIndex + 1))
    .replace(/\{total\}/g, String(totalPages));
}

// ---- 单个组件的静态 HTML（与 ComponentRenderer.vue 的 v-if 分支严格对齐） ----
function renderComponent(comp, theme, doc) {
  if (!comp) return "";
  const styleStr = rs(comp, theme);
  const c = comp;
  switch (c.type) {

    // ---- ① 基础 ----
    case "text":
      return `<span style="${styleStr}">${esc(c.content?.text || "")}</span>`;
    case "heading": {
      const lv = Math.min(6, Math.max(1, c.level || 2));
      return `<h${lv} style="${styleStr}">${esc(c.content?.text || "")}</h${lv}>`;
    }
    case "image": {
      const img = c.content?.src
        ? `<img src="${esc(c.content.src)}" alt="${esc(c.content.alt || "")}" style="width:100%;height:auto;object-fit:${c.content.objectFit || "contain"};display:block">`
        : `<div style="width:100%;height:120px;display:flex;align-items:center;justify-content:center;background:#f3f7f3;color:#9caa9f;font-size:9.5pt;border:1px dashed #cdd6cf;border-radius:4px">图片占位</div>`;
      const cap = c.content?.caption ? `<figcaption style="margin-top:4px;color:var(--sr-muted,#6b7c74);font-size:8pt;line-height:1.4">${esc(c.content.caption)}</figcaption>` : "";
      const cr  = c.content?.credit  ? `<small style="display:block;margin-top:2px;color:#97a59c;font-size:7pt">${esc(c.content.credit)}</small>` : "";
      return `<figure style="${styleStr}">${img}${cap}${cr}</figure>`;
    }
    case "divider": return `<hr style="${styleStr};border:none">`;
    case "spacer":  return `<div style="height:${Number(c.content?.height || 18)}px;${styleStr}"></div>`;

    // ---- ② 内容 ----
    case "paragraph": return `<div style="${styleStr}" class="sr-paragraph">${c.content?.html || "<p></p>"}</div>`;
    case "quote": {
      const cite = c.content?.cite ? `<small style="display:block;margin-top:6px;color:var(--sr-muted,#5d6d64);font-size:8.5pt">—— ${esc(c.content.cite)}</small>` : "";
      return `<blockquote style="${styleStr}"><div>${c.content?.html || ""}</div>${cite}</blockquote>`;
    }
    case "list": {
      const tag = c.content?.ordered ? "ol" : "ul";
      const inner = (c.content?.items || []).map((it) => `<li>${esc(it ?? "")}</li>`).join("");
      return `<div style="${styleStr}"><${tag} style="margin:0;padding-left:1.4em">${inner}</${tag}></div>`;
    }
    case "table": {
      const rows = c.content?.rows || [];
      const headStr = c.content?.headerRow && rows[0]
        ? `<thead><tr>${rows[0].map((cell) => `<th style="vertical-align:top;background:#f3f7f3;font-weight:750;${styleStr.replace(/"/g, "'")}">${esc(cell)}</th>`).join("")}</tr></thead>`
        : "";
      const bodyRows = c.content?.headerRow ? rows.slice(1) : rows;
      const bodyStr = `<tbody>${bodyRows.map((row) =>
        `<tr>${(row || []).map((cell) => `<td style="vertical-align:top;overflow-wrap:anywhere;${styleStr.replace(/"/g, "'")}">${esc(cell)}</td>`).join("")}</tr>`
      ).join("")}</tbody>`;
      return `<table style="${styleStr};border-collapse:collapse;table-layout:fixed;width:100%">${headStr}${bodyStr}</table>`;
    }
    case "code": {
      return `<pre style="${styleStr};white-space:pre-wrap;word-break:break-word;margin:0"><code>${esc(c.content?.source || "")}</code></pre>`;
    }
    case "link": {
      const href = c.content?.href || "#";
      const isExt = /^https?:/i.test(href);
      return `<a href="${esc(href)}" ${isExt ? "target=\"_blank\" rel=\"noopener\"" : ""} style="${styleStr}">${esc(c.content?.text || href || "")}</a>`;
    }

    // ---- ③ 文章 ----
    case "articleTitle": return `<h1 style="${styleStr}">${esc(c.content?.text || "")}</h1>`;
    case "subtitle":     return `<p  style="${styleStr}">${esc(c.content?.text || "")}</p>`;
    case "author":       return `<p  style="${styleStr}">${esc(c.content?.text || "")}</p>`;
    case "date":         return `<p  style="${styleStr}">${esc(c.content?.text || "")}</p>`;
    case "toc": {
      const levels = c.content?.levels || [2, 3];
      const items = [];
      if (doc) {
        for (const page of doc.pages || []) {
          const ids = page.regions?.main || [];
          for (const id of ids) {
            const comp = doc.components?.[id];
            if (comp && comp.type === "heading" && levels.includes(comp.level || 2)) {
              items.push({ text: comp.content?.text || "", level: comp.level || 2 });
            }
          }
        }
      }
      const lis = items.map((it) =>
        `<li style="padding-left:${(it.level - 1) * 14}px;margin-bottom:4px;line-height:1.55;font-size:${Math.max(9, 12 - (it.level - 2))}pt">${esc(it.text)}</li>`
      ).join("");
      return `<nav style="${styleStr}"><ul style="list-style:none;margin:0;padding:0">${lis}</ul></nav>`;
    }
    case "footnote":   return `<p style="${styleStr};margin:0"><sup>${esc(c.content?.id || "")}</sup> ${esc(c.content?.text || "")}</p>`;
    case "pageNumber": return `<span style="${styleStr}">${esc(c.content?.pattern || "{page} / {total}")}</span>`;

    // ---- ④ 信息 ----
    case "callout":
    case "warning":
    case "tip":
    case "info":
    case "notice": {
      const title = `<div style="font-weight:750;margin-bottom:6px;font-size:10.5pt">${esc(c.content?.title || "")}</div>`;
      const body  = `<div>${c.content?.body || ""}</div>`;
      return `<div style="${styleStr}">${title}${body}</div>`;
    }

    // ---- ⑤ 布局 ----
    case "container": {
      const children = (c.content?.childIds || []).map((id) => doc?.components?.[id]).filter(Boolean);
      const rendered = children.map((ch) => renderComponent(ch, theme, doc)).join("");
      return `<div style="${styleStr}">${rendered}</div>`;
    }
    case "columns": {
      const cols = c.content?.columns || 2;
      const groups = c.content?.childIds || [];
      const renderedCols = groups.map((arr) => {
        const inner = Array.isArray(arr)
          ? arr.map((id) => doc?.components?.[id]).filter(Boolean).map((ch) => renderComponent(ch, theme, doc)).join("")
          : "";
        return `<div style="min-width:0">${inner}</div>`;
      }).join("");
      const wrapStyle = `display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:14px;${styleStr}`;
      return `<div style="${wrapStyle}">${renderedCols}</div>`;
    }
    case "sidebar": {
      const side = c.content?.side === "right" ? "right" : "left";
      const tmpl = side === "right" ? "1fr 38mm" : "38mm 1fr";
      const sideChildren = (c.content?.childIds?.sidebar || []).map((id) => doc?.components?.[id]).filter(Boolean).map((ch) => renderComponent(ch, theme, doc)).join("");
      const mainChildren = (c.content?.childIds?.main    || []).map((id) => doc?.components?.[id]).filter(Boolean).map((ch) => renderComponent(ch, theme, doc)).join("");
      const sideHtml = `<div style="min-width:0;overflow:hidden">${sideChildren}</div>`;
      const mainHtml = `<div style="min-width:0">${mainChildren}</div>`;
      return `<div style="display:grid;grid-template-columns:${tmpl};gap:7mm;${styleStr}">${side === "left" ? sideHtml + mainHtml : mainHtml + sideHtml}</div>`;
    }
    case "card": {
      const title = `<div style="font-weight:800;margin-bottom:8px;font-size:11pt">${esc(c.content?.title || "")}</div>`;
      const body  = `<div>${c.content?.bodyHtml || ""}</div>`;
      return `<div style="${styleStr}">${title}${body}</div>`;
    }
    case "grid": {
      const cols = c.content?.columns || 3;
      const cells = (c.content?.cells || []).map((cell) => {
        if (cell.kind === "image") {
          const img = cell.src ? `<img src="${esc(cell.src)}" alt="${esc(cell.alt || "")}" style="width:100%;height:100%;object-fit:cover;display:block">` : "";
          const cap = cell.caption ? `<div style="padding:4px;color:var(--sr-muted,#6b7c74);font-size:7.4pt;text-align:center">${esc(cell.caption)}</div>` : "";
          return `<div style="min-height:80px;border:1px solid #d8dfd8;border-radius:4px;overflow:hidden;background:#fff">${img}${cap}</div>`;
        }
        if (cell.componentId && doc?.components?.[cell.componentId]) {
          return `<div>${renderComponent(doc.components[cell.componentId], theme, doc)}</div>`;
        }
        return `<div></div>`;
      }).join("");
      return `<div style="display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));grid-auto-rows:1fr;gap:10px;${styleStr}">${cells}</div>`;
    }

    // ---- ⑥ Picture ----
    case "picture": {
      const border = c.content?.border?.enabled
        ? `border:${c.content.border.width || 1}px ${c.content.border.color || "#d8dfd8"} solid`
        : "border:none";
      const shadow = !c.content?.shadow || c.content.shadow === "none" ? "box-shadow:none"
        : c.content.shadow === "small" ? "box-shadow:0 1px 2px rgba(0,0,0,.08)"
        : c.content.shadow === "large" ? "box-shadow:0 12px 24px rgba(0,0,0,.15)"
        : "box-shadow:0 2px 8px rgba(0,0,0,.10)";
      const align = c.content?.align === "center" ? "margin-left:auto;margin-right:auto;display:block"
        : c.content?.align === "right"  ? "margin-left:auto;margin-right:0"
        : "margin-left:0;margin-right:auto";
      const height = c.content?.height === "auto" ? "height:auto" : `height:${esc(c.content?.height || "auto")}`;
      const imgWrapStyle = [
        `width:${esc(c.content?.width || "100%")}`,
        height,
        align,
        border,
        `border-radius:${Number(c.content?.borderRadius ?? 4)}px`,
        shadow,
        "overflow:hidden",
      ].join(";");
      const img = c.content?.src
        ? `<img src="${esc(c.content.src)}" alt="${esc(c.content.alt || "")}" style="width:100%;height:${c.content?.height === "auto" ? "auto" : "100%"};object-fit:${c.content?.objectFit || "contain"};display:block">`
        : `<div style="width:100%;height:120px;display:flex;align-items:center;justify-content:center;background:#f3f7f3;color:#9caa9f;font-size:9.5pt;border:1px dashed #cdd6cf;border-radius:4px">图片占位 · Picture 组件</div>`;
      const cap = c.content?.caption ? `<figcaption style="margin-top:4px;color:var(--sr-muted,#6b7c74);font-size:8pt;line-height:1.4">${esc(c.content.caption)}</figcaption>` : "";
      const cr  = c.content?.credit  ? `<small style="display:block;margin-top:2px;color:#97a59c;font-size:7pt">${esc(c.content.credit)}</small>` : "";
      return `<figure style="${styleStr}"><div style="${imgWrapStyle}">${img}</div>${cap}${cr}</figure>`;
    }

    default:
      return `<div style="${styleStr}"><span style="color:var(--sr-muted,#6b7c74);font-size:9pt">未知组件：<code>${esc(c.type)}</code></span></div>`;
  }
}

// ---- 整页渲染（严格对齐 SharedRenderer.vue 的结构） ----
function renderPage(page, pageIndex, totalPages, doc, theme) {
  const m = metrics(page);
  const pageStyle = [
    `width:${m.width}px`,
    `height:${m.height}px`,
    `padding-top:${m.margin.top}px`,
    `padding-right:${m.margin.right}px`,
    `padding-bottom:${m.margin.bottom}px`,
    `padding-left:${m.margin.left}px`,
    "box-sizing:border-box",
    "position:relative",
    "display:grid",
    "grid-template-rows:auto minmax(0,1fr) auto",
    "overflow:hidden",
    "break-after:page",
    "page-break-after:always",
    backgroundStyle(page),
    layoutVars(page),
  ].join(";");

  // header
  let headerHtml = "";
  if (page.header.enabled) {
    const pageData = collectPageComponents(doc, page.id);
    const customHeader = pageData?.regions?.header?.length;
    if (customHeader) {
      const inner = pageData.regions.header.map((cc) => renderComponent(cc, theme, doc)).join("");
      headerHtml = `<header class="sr-header ${page.header.style || "hairline"}" style="display:flex;align-items:center;justify-content:space-between;min-height:28px;margin-bottom:10px;${page.header.style === "hairline" ? "border-bottom:1px solid var(--sr-rule)" : page.header.style === "band" ? "background:color-mix(in srgb,var(--sr-primary) 8%,transparent);padding:4px 8px;border-radius:3px" : ""}">${inner}</header>`;
    } else {
      headerHtml = `<header class="sr-header ${page.header.style || "hairline"}" style="display:flex;align-items:center;justify-content:space-between;min-height:28px;margin-bottom:10px;${page.header.style === "hairline" ? "border-bottom:1px solid var(--sr-rule)" : page.header.style === "band" ? "background:color-mix(in srgb,var(--sr-primary) 8%,transparent);padding:4px 8px;border-radius:3px" : ""}">
        <span style="color:var(--sr-primary);font-size:8pt;font-weight:750;letter-spacing:0.08em;text-transform:uppercase">${esc(doc.meta?.title || "")}</span>
        ${page.header.content ? `<small>${esc(page.header.content)}</small>` : ""}
      </header>`;
    }
  }

  // body (sidebar + main)
  const bodyGridCss = "display:grid;grid-template-columns:var(--body-cols,minmax(0,1fr));gap:var(--body-gap,0);min-height:0";
  const pageData = collectPageComponents(doc, page.id);
  const hasSidebar = (page.layout === "left-sidebar" || page.layout === "right-sidebar") && Array.isArray(pageData?.regions?.sidebar);
  const sidebarHtml = hasSidebar
    ? `<aside class="sr-sidebar" style="min-width:0;overflow:hidden">${pageData.regions.sidebar.map((cc) => renderComponent(cc, theme, doc)).join("")}</aside>`
    : "";
  const columnClassCss =
    page.layout === "two-column"   ? "column-count:2;column-gap:30px" :
    page.layout === "three-column" ? "column-count:3;column-gap:22px" : "";
  const mainHtml = `<main class="sr-main" style="min-width:0;${columnClassCss}">${(pageData?.regions?.main || []).map((cc) => renderComponent(cc, theme, doc)).join("")}</main>`;
  const sidesHtml = page.layout === "right-sidebar"
    ? mainHtml + sidebarHtml
    : (page.layout === "left-sidebar" ? sidebarHtml + mainHtml : mainHtml);
  const bodyHtml = `<div class="sr-body" style="${bodyGridCss}">${sidesHtml}</div>`;

  // footer
  let footerHtml = "";
  if (page.footer.enabled) {
    const customFooter = pageData?.regions?.footer?.length;
    if (customFooter) {
      const inner = pageData.regions.footer.map((cc) => renderComponent(cc, theme, doc)).join("");
      footerHtml = `<footer class="sr-footer" style="display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;min-height:26px;padding-top:6px;border-top:1px solid var(--sr-rule);color:var(--sr-muted);font-size:7.5pt">${inner}</footer>`;
    } else {
      const left   = replacePageVars(page.footer.left,   pageIndex, totalPages);
      const center = replacePageVars(page.footer.center, pageIndex, totalPages);
      const right  = replacePageVars(page.footer.right,  pageIndex, totalPages);
      footerHtml = `<footer class="sr-footer" style="display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;min-height:26px;padding-top:6px;border-top:1px solid var(--sr-rule);color:var(--sr-muted);font-size:7.5pt">
        <span>${esc(left)}</span>
        <span style="text-align:center">${esc(center)}</span>
        <span style="text-align:right">${esc(right)}</span>
      </footer>`;
    }
  }

  const coverClass = page.type === "cover" ? " sr-page-cover" : "";
  return `<section class="sr-page sr-layout-${page.layout}${coverClass}" style="${pageStyle}">${headerHtml}${bodyHtml}${footerHtml}</section>`;
}

/**
 * 主入口：把 v2 doc 渲染成一份可直接丢给 Playwright 的完整 HTML 文档。
 * 返回 { html, title }
 */
export function renderDocumentToHtml(docInput, options = {}) {
  const theme = buildTheme(docInput?.theme?.id || options.themeId || "academic");
  const doc   = docInput && typeof docInput === "object" ? docInput : { pages: [], components: {}, meta: { title: "" } };
  const total = doc.pages?.length || 0;
  const pages = (doc.pages || []).map((p, idx) => renderPage(p, idx, total, doc, theme)).join("");

  const rootVarsStyle = pageVarsCss(theme);
  const globalFontFamily = (theme.variables.bodyFont || []).join(", ");
  const title = doc.meta?.title || "UI-PDF 文档";

  // 结构 CSS（与 SharedRenderer.vue 的 <style> 保持一致）
  const structuralCss = `
    html,body{margin:0;padding:0;background:#eef0ee;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .shared-renderer{display:grid;justify-items:center;gap:28px;color:var(--sr-ink);font-family:${globalFontFamily}}
    @media print{html,body{background:#fff}.shared-renderer{gap:0}.sr-page{box-shadow:none}}
    .sr-paragraph p{margin:0}
    .sr-paragraph p + p{margin-top:0.5em}
    .sr-paragraph ul,.sr-paragraph ol{padding-left:1.4em;margin:0 0 0.8em}
    .sr-paragraph blockquote{margin:0;padding:0.2em 0 0.2em 1em;border-left:2px solid var(--sr-primary);color:var(--sr-muted)}
    .sr-paragraph a{color:var(--sr-primary)}
    .sr-paragraph img{max-width:100%;height:auto}
  `;

  const html = `<!DOCTYPE html>
<html lang="${doc.meta?.language || "zh-CN"}">
<head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<style>${rootVarsStyle}
${structuralCss}
</style>
</head>
<body>
<div class="shared-renderer">
${pages}
</div>
</body>
</html>`;
  return { html, title, pageCount: total };
}

export default { renderDocumentToHtml };
