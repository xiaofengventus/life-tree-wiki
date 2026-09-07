import TurndownService from "turndown";
import { micromark } from "micromark";
import { gfm, gfmHtml } from "micromark-extension-gfm";
import { math } from "micromark-extension-math";
import { mathSourceHtml } from "./micromarkMathSourceHtml";
import { renderFormulaNodes } from "./formula";
import { sanitizeHtml } from "./sanitizeHtml";

const SPEC = "life-pdf-layout/1";
const MAX_SOURCE_LENGTH = 500_000;
const BLOCK_TYPES = new Set([
  "paragraph",
  "heading",
  "image",
  "gallery",
  "formula",
  "tree",
  "card",
  "divider",
  "pageBreak",
]);

let markdownExporter;

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function createId(prefix = "block") {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  return `${prefix}-${String(random).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24)}`;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepAssign(target, source) {
  Object.entries(source || {}).forEach(([key, value]) => {
    if (isPlainObject(value)) {
      target[key] = deepAssign(isPlainObject(target[key]) ? target[key] : {}, value);
    } else {
      target[key] = value;
    }
  });
  return target;
}

export function createUiPdfDocument(seedTitle = "") {
  return normalizeUiPdfDocument({
    title: String(seedTitle || ""),
    blocks: [],
  });
}

export function safeRichHtml(html) {
  return sanitizeHtml(String(html || ""));
}

export function richPreviewHtml(markdownOrHtml) {
  const raw = String(markdownOrHtml || "");
  if (/^\s*</.test(raw)) return renderFormulaNodes(safeRichHtml(raw));
  try {
    return renderFormulaNodes(uiMarkdownToSafeHtml(raw));
  } catch {
    return safeRichHtml(`<p>${raw.replace(/[<>&]/g, "")}</p>`);
  }
}

function uiMarkdownToSafeHtml(markdown) {
  return sanitizeHtml(micromark(expandHighlightSyntax(markdown), {
    allowDangerousHtml: true,
    allowDangerousProtocol: false,
    extensions: [gfm(), math()],
    htmlExtensions: [gfmHtml(), mathSourceHtml()],
  }));
}

function expandHighlightSyntax(source) {
  return source.replace(
    /(^|[^\w=])==([^=\n]+?)==(?=$|[^\w=])/g,
    (_match, lead, content) => `${lead}<span style="background-color:#FFF3C4">${content}</span>`,
  );
}

function markdownToRichHtml(markdown) {
  return richPreviewHtml(markdown);
}

function getTurndown() {
  if (!markdownExporter) {
    markdownExporter = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
      emDelimiter: "*",
      hr: "---",
    });
    markdownExporter.addRule("highlight", {
      filter: (node) =>
        node.nodeName === "SPAN" &&
        /background-color/i.test(node.getAttribute("style") || ""),
      replacement: (content) => (content.trim() ? `==${content}==` : content),
    });
    markdownExporter.addRule("underline", {
      filter: ["u"],
      replacement: (content) => `<u>${content}</u>`,
    });
    markdownExporter.addRule("formula", {
      filter: (node) => node.hasAttribute?.("data-life-math"),
      replacement: (_content, node) => {
        const latex = node.getAttribute("data-latex") || node.textContent || "";
        return node.getAttribute("data-life-math") === "block" ? `$$${latex}$$` : `$${latex}$`;
      },
    });
  }
  return markdownExporter;
}

export function richHtmlToMarkdown(html) {
  return String(getTurndown().turndown(safeRichHtml(html || "")) || "").trim();
}

function escapeMarkdownLineStart(line) {
  return String(line || "").replace(/^(\s*)([#>+]|::|(?:[-*+]|\d+\.)\s)/, "$1\\$2");
}

function normalizeHeadingAnchor(value) {
  const anchor = String(value || "").trim().replace(/^[^a-zA-Z]+/, "");
  return /^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(anchor) ? anchor : "";
}

export function normalizeUiPdfDocument(input) {
  const source = isPlainObject(input) ? clone(input) : {};
  const documentModel = deepAssign(
    {
      spec: SPEC,
      meta: {
        title: "",
        author: "",
        subject: "",
        language: "zh-CN",
        revision: "",
      },
      page: {
        pageSize: "A4",
        orientation: "portrait",
        marginMM: [18, 16],
      },
      theme: {
        ink: "#22302A",
        paper: "#FFFFFF",
        accent: "#33691E",
        muted: "#6B7C74",
        rule: "#D8DFD8",
        fontFamily: ['"Noto Sans SC"', '"Source Han Sans SC"', sans()],
      },
      layout: {
        template: "sidebar-flow",
        asideWidthMM: 38,
        columnGapMM: 7,
        showAside: true,
      },
      header: {
        enabled: true,
        label: "",
        subtitle: "",
        badge: "",
        align: "between",
        style: "band",
        rule: "hairline",
      },
      aside: {
        selectedElement: "",
        marker: "bar",
        dense: true,
        maxVisible: 12,
      },
      footer: {
        left: "",
        right: "{page} / {total}",
        center: "",
        rule: "hairline",
        excludePages: ["cover"],
      },
      blocks: [],
    },
    source,
  );

  documentModel.meta.title = String(documentModel.meta.title || "").slice(0, 160);
  documentModel.meta.author = String(documentModel.meta.author || "").slice(0, 120);
  documentModel.meta.subject = String(documentModel.meta.subject || "").slice(0, 240);
  documentModel.page.marginMM = coerceNumberArray(documentModel.page.marginMM, [18, 16], 4);
  documentModel.layout.asideWidthMM = clampNumber(documentModel.layout.asideWidthMM, 18, 72);
  documentModel.layout.columnGapMM = clampNumber(documentModel.layout.columnGapMM, 2, 28);
  documentModel.aside.items = Array.isArray(documentModel.aside.items)
    ? documentModel.aside.items.map((item) => normalizeAsideItem(item)).filter(Boolean)
    : [];
  documentModel.footer.excludePages = Array.isArray(documentModel.footer.excludePages)
    ? documentModel.footer.excludePages.map((value) => String(value)).filter(Boolean)
    : [];

  const usedIds = new Set();
  documentModel.blocks = (Array.isArray(source.blocks) ? source.blocks : [])
    .map((block, index) => normalizeBlock(block, index))
    .filter(Boolean);
  documentModel.blocks.forEach((block) => {
    while (!block.id || usedIds.has(block.id)) block.id = createId(block.type);
    usedIds.add(block.id);
  });
  documentModel.spec = SPEC;
  return documentModel;
}

function sans() {
  return "sans-serif";
}

function normalizeAsideItem(item) {
  if (typeof item === "string") item = { label: item };
  if (!isPlainObject(item)) return null;
  const label = String(item.label || "").trim().slice(0, 80);
  if (!label) return null;
  return {
    id: normalizeHeadingAnchor(item.id) || createId("aside"),
    label,
    symbol: String(item.symbol || "").trim().slice(0, 5),
    pages: String(item.pages || "").trim().slice(0, 40),
  };
}

function normalizeBlock(block, index) {
  if (!isPlainObject(block)) return null;
  let type = BLOCK_TYPES.has(block.type) ? block.type : "paragraph";
  if (type === "paragraph") {
    const richHtml = block.html || markdownToRichHtml(block.markdown || block.text || "");
    return {
      type,
      id: String(block.id || "").trim() || createId(type),
      html: block.html ? safeRichHtml(block.html) : richPreviewHtml(block.markdown || block.text || richHtml),
    };
  }
  if (type === "heading") {
    return {
      type,
      id: String(block.id || "").trim() || createId(type),
      level: Math.min(6, Math.max(2, Number(block.level || 2))),
      text: String(block.text || "").trim().slice(0, 300),
      anchorId: normalizeHeadingAnchor(block.anchorId),
    };
  }
  if (type === "image") {
    const source = String(block.src || block.url || "").trim();
    return {
      type,
      id: String(block.id || "").trim() || createId(type),
      src: source,
      alt: String(block.alt || "").trim().slice(0, 200),
      caption: String(block.caption || "").trim().slice(0, 320),
      credit: String(block.credit || "").trim().slice(0, 160),
      widthPercent: clampNumber(Number(block.widthPercent || 100), 20, 100),
      objectFit: ["cover", "contain"].includes(block.objectFit) ? block.objectFit : "contain",
      align: ["start", "center", "end"].includes(block.align) ? block.align : "center",
      frame: ["none", "hairline", "boxed"].includes(block.frame) ? block.frame : "hairline",
    };
  }
  if (type === "gallery") {
    const images = (Array.isArray(block.images) ? block.images : []).map((item) => ({
      src: String(item.src || item.url || "").trim(),
      alt: String(item.alt || "").trim().slice(0, 200),
      caption: String(item.caption || "").trim().slice(0, 320),
      spanColumns: Math.min(12, Math.max(1, Number(item.spanColumns || 3))),
      spanRows: Math.min(3, Math.max(1, Number(item.spanRows || 1))),
    })).filter((item) => item.src);
    return {
      type,
      id: String(block.id || "").trim() || createId(type),
      images,
      columns: Math.min(4, Math.max(1, Number(block.columns || 2))),
      gapMM: clampNumber(Number(block.gapMM || 6), 0, 16),
      rowHeightMM: clampNumber(Number(block.rowHeightMM || 32), 14, 96),
      objectFit: ["cover", "contain"].includes(block.objectFit) ? block.objectFit : "cover",
      overflow: ["move", "repaginate"].includes(block.overflow) ? block.overflow : "move",
    };
  }
  if (type === "formula") {
    return {
      type,
      id: String(block.id || "").trim() || createId(type),
      latex: String(block.latex || block.source || "").trim().slice(0, 4000),
      displayMode: Boolean(block.displayMode ?? true),
    };
  }
  if (type === "tree") {
    return {
      type,
      id: String(block.id || "").trim() || createId(type),
      treeId: String(block.treeId || block.idValue || block.id || "").trim().replace(/^\/view-tree\//, ""),
      title: String(block.title || block.fallbackTitle || "进化树").trim().slice(0, 120),
      heightMM: clampNumber(Number(block.heightMM || 82), 34, 220),
      collapseDepth: ["all", "none"].includes(block.collapseDepth)
        ? block.collapseDepth
        : Math.min(8, Math.max(0, Number(block.collapseDepth || 2))),
      render: ["vector-snapshot", "raster-snapshot"].includes(block.render)
        ? block.render
        : "vector-snapshot",
    };
  }
  if (type === "card") {
    return {
      type,
      id: String(block.id || "").trim() || createId(type),
      cardId: normalizeHeadingAnchor(block.cardId || block.refId || block.id || ""),
      title: String(block.title || "").trim().slice(0, 80) || "卡片",
      color: /^#[0-9a-f]{6}$/i.test(block.color) ? block.color : "#94A187",
      imageHash: String(block.imageHash || "").trim(),
      imageUrl: String(block.imageUrl || "").trim(),
      imageCaption: String(block.imageCaption || "").trim().slice(0, 120),
      placement: ["inline", "sidebar"].includes(block.placement) ? block.placement : "inline",
      breakable: Boolean(block.breakable ?? true),
      rows: (Array.isArray(block.rows) ? block.rows : []).map((row) => ({
        label: String(row.label || "").trim().slice(0, 60),
        value: String(row.value || "").trim().slice(0, 240),
      })).filter((row) => row.label || row.value),
    };
  }
  return {
    type,
    id: String(block.id || "").trim() || createId(type),
  };
}

function coerceNumberArray(value, fallback, limit = 4) {
  const list = Array.isArray(value) ? value : String(value || "").split(/[\s,]+/);
  const result = list.map(Number).filter((item) => Number.isFinite(item) && item >= 0);
  return result.slice(0, limit).length === list.length && result.length
    ? result.slice(0, limit)
    : clone(fallback);
}

function clampNumber(value, min, max) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : min;
}

function yamlScalar(value) {
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  const text = String(value ?? "");
  return /^[-#&*!|>%@`{}[\]]/.test(text) || text.includes(": ") ? JSON.stringify(text) : text;
}

function writeYamlMap(value, depth = 0) {
  if (!isPlainObject(value)) return "";
  const pad = "  ".repeat(depth);
  return Object.entries(value)
    .flatMap(([key, child]) => {
      if (isPlainObject(child)) {
        const nested = writeYamlMap(child, depth + 1);
        return nested ? [`${pad}${key}:`, nested] : [`${pad}${key}: {}`];
      }
      if (Array.isArray(child)) {
        return [`${pad}${key}: ${JSON.stringify(child)}`];
      }
      if (child === "" || child === undefined || child === null) return [];
      return [`${pad}${key}: ${yamlScalar(child)}`];
    })
    .join("\n");
}

function parseScalar(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  if (/^(true|false)$/i.test(value)) return /^true$/i.test(value);
  if (value.startsWith("[") && value.endsWith("]")) {
    try {
      return JSON.parse(value.replace(/'/g, '"'));
    } catch {
      return value.split(",").map((part) => part.trim()).filter(Boolean);
    }
  }
  if ((value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))) {
    try {
      return JSON.parse(value.replace(/^'(.*)'$/, '"$1"'));
    } catch {
      return value.slice(1, -1);
    }
  }
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
  return value;
}

function parseYamlMap(lines, startIndex, baseIndent) {
  const result = {};
  let index = startIndex;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    const indent = line.length - line.trimStart().length;
    if (indent < baseIndent) break;
    if (indent > baseIndent) {
      index += 1;
      continue;
    }
    const separator = line.indexOf(":");
    if (separator < 0) break;
    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    index += 1;
    if (rawValue) {
      result[key] = parseScalar(rawValue);
    } else {
      const child = parseYamlMap(lines, index, indent + 1);
      result[key] = child.value;
      index = child.index;
    }
  }
  return { value: result, index };
}

function splitFirst(line, delimiter = ":") {
  const index = line.indexOf(delimiter);
  if (index < 0) return ["", ""];
  return [line.slice(0, index).trim(), line.slice(index + delimiter.length).trim()];
}

function directiveData(lines) {
  const data = {};
  let listKey = "";
  let currentItem = null;
  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;
    if (line.startsWith("- ")) {
      const [key, value] = splitFirst(line.slice(1));
      if (listKey) {
        currentItem = { [key]: parseScalar(value) };
        data[listKey] = data[listKey] || [];
        data[listKey].push(currentItem);
      }
      return;
    }
    const [key, value] = splitFirst(line);
    if (key === "images" || key === "rows") {
      listKey = key;
      data[key] = Array.isArray(data[key]) ? data[key] : [];
      currentItem = null;
      return;
    }
    listKey = "";
    currentItem = null;
    if (key === "row") {
      data.rows = Array.isArray(data.rows) ? data.rows : [];
      const parts = value.split("|").map((part) => part.trim());
      data.rows.push({ label: parts[0] || "", value: parts[1] || "" });
      return;
    }
    if (key === "item") {
      data.images = Array.isArray(data.images) ? data.images : [];
      const parts = value.split("|").map((part) => part.trim());
      data.images.push({ src: parts[0] || "", alt: parts[1] || "", caption: parts[2] || "" });
      return;
    }
    data[key] = parseScalar(value);
  });
  return data;
}

function directiveLines(values, entries = []) {
  const lines = [...entries];
  values.forEach((value) => {
    const text = [
      value.label ?? value.alt ?? "",
      value.value ?? value.caption ?? "",
    ].map((part) => String(part || "").replace(/\|/g, "/"));
    lines.push(`item: ${text.join(" | ")}`);
  });
  return lines;
}

export function serializeUiPdfDocument(documentModel) {
  const documentData = normalizeUiPdfDocument(documentModel);
  const frontmatter = {
    pdf: SPEC,
    ...documentData.meta,
    page: {
      pageSize: documentData.page.pageSize,
      orientation: documentData.page.orientation,
      marginMM: documentData.page.marginMM,
    },
    theme: documentData.theme,
    layout: documentData.layout,
    header: documentData.header,
    aside: {
      selectedElement: documentData.aside.selectedElement,
      marker: documentData.aside.marker,
      maxVisible: documentData.aside.maxVisible,
      items: documentData.aside.items.map(({ id, label, symbol, pages }) => ({
        id,
        label,
        symbol,
        pages,
      })),
    },
    footer: documentData.footer,
  };
  const output = [`---ui-pdf`, writeYamlMap(frontmatter), `---`, ""];
  documentData.blocks.forEach((block) => {
    switch (block.type) {
      case "heading": {
        output.push(`${"#".repeat(block.level)} ${block.text}`);
        break;
      }
      case "paragraph": {
        const markdown = richHtmlToMarkdown(block.html);
        if (markdown) output.push(markdown.split(/\n\s*\n/).map((group) =>
          group.split("\n").map(escapeMarkdownLineStart).join("\n")).join("\n\n"));
        break;
      }
      case "image":
        output.push("::image", `src: ${block.src}`, `alt: ${block.alt}`);
        if (block.caption) output.push(`caption: ${block.caption}`);
        if (block.credit) output.push(`credit: ${block.credit}`);
        output.push(`widthPercent: ${block.widthPercent}`, `objectFit: ${block.objectFit}`,
          `align: ${block.align}`, `frame: ${block.frame}`, "::");
        break;
      case "gallery":
        output.push(`::gallery ${block.columns}`, `columns: ${block.columns}`,
          `gapMM: ${block.gapMM}`, `rowHeightMM: ${block.rowHeightMM}`,
          `objectFit: ${block.objectFit}`, ...directiveLines(block.images), "::");
        break;
      case "formula":
        output.push(block.displayMode ? "::formula display" : "::formula inline",
          block.latex, "::");
        break;
      case "tree":
        output.push("::tree", `id: ${block.treeId}`, `title: ${block.title}`,
          `heightMM: ${block.heightMM}`, `collapseDepth: ${block.collapseDepth}`,
          `render: ${block.render}`, "::");
        break;
      case "card":
        output.push(`::card ${block.placement}`, `id: ${block.cardId}`,
          `title: ${block.title}`, `color: ${block.color}`);
        if (block.imageHash) output.push(`imageHash: ${block.imageHash}`);
        if (block.imageCaption) output.push(`imageCaption: ${block.imageCaption}`);
        block.rows.forEach((row) => output.push(`row: ${row.label} | ${row.value}`));
        output.push(`breakable: ${block.breakable}`, "::");
        break;
      case "divider":
        output.push("---");
        break;
      case "pageBreak":
        output.push("::pageBreak", "::");
        break;
    }
    output.push("");
  });
  return output.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

function frontmatterFromSource(lines) {
  const [, body = ""] = lines;
  const sourceLines = String(body || "").split(/\r?\n/);
  const parsed = parseYamlMap(sourceLines, 0, 0).value;
  if (!isPlainObject(parsed)) return {};
  if (parsed.header && !("enabled" in parsed.header)) parsed.header.enabled = true;
  if (parsed.layout && !("showAside" in parsed.layout)) parsed.layout.showAside = true;
  ["title", "author", "subject", "language", "revision"].forEach((key) => {
    if (parsed[key] !== undefined && parsed[key] !== "") {
      parsed.meta = { ...(isPlainObject(parsed.meta) ? parsed.meta : {}), [key]: parsed[key] };
    }
    delete parsed[key];
  });
  return parsed;
}

function markdownGroupToBlocks(groups) {
  const blocks = [];
  groups.forEach((group) => {
    const text = group.trim();
    if (!text) return;
    const headingMatch = text.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch && !text.includes("\n")) {
      blocks.push({
        type: "heading",
        level: Math.min(6, Math.max(2, headingMatch[1].length)),
        text: headingMatch[2].trim(),
      });
      return;
    }
    blocks.push({
      type: "paragraph",
      markdown: text,
    });
  });
  return blocks;
}

export function parseUiPdfSource(sourceText) {
  const source = String(sourceText || "");
  if (source.length > MAX_SOURCE_LENGTH) throw new Error("UI-PDF 源码不能超过 50 万个字符。");
  const match = source.match(/^\s*---(?:ui-pdf)?\r?\n([\s\S]*?)\r?\n---(?:\s*\n|$)/);
  const frontmatter = match ? frontmatterFromSource(match) : {};
  let body = match ? source.slice(match.index + match[0].length) : source;
  const blocks = [];
  let paragraphLines = [];
  let fence = null;
  let directive = null;

  const flushParagraph = () => {
    const groups = paragraphLines.join("\n").split(/\n\s*\n+/);
    blocks.push(...markdownGroupToBlocks(groups));
    paragraphLines = [];
  };

  body.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (directive) {
      if (line === "::") {
        const settings = directive.settings.join(" ").split(/\s+/).filter(Boolean);
        if (directive.type === "formula") {
          blocks.push(normalizeBlock({
            type: "formula",
            latex: directive.body.join("\n"),
            displayMode: settings.includes("display") || !settings.includes("inline"),
          }, blocks.length));
        } else if (directive.type === "pageBreak") {
          blocks.push(normalizeBlock({ type: "pageBreak" }, blocks.length));
        } else {
          const data = directiveData(directive.body);
          if (settings[0]) data.__modifier = settings[0];
          if (directive.type === "gallery" && settings[0] && !data.columns) data.columns = Number(settings[0]);
          if (directive.type === "card" && settings[0]) data.placement = settings[0];
          blocks.push(normalizeBlock({ type: directive.type, ...data }, blocks.length));
        }
        directive = null;
      } else {
        directive.body.push(rawLine);
      }
      return;
    }
    if (fence) {
      if (fence.type === "code" && line === "::") {
        paragraphLines.push(`<pre><code class="language-${fence.language}">${escapeMarkup(fence.body.join("\n"))}</code></pre>`);
        flushParagraph();
        fence = null;
      } else if (fence.type === "quote" && line === "::") {
        paragraphLines.push(fence.body.join("\n"));
        flushParagraph();
        fence = null;
      } else {
        fence.body.push(rawLine);
      }
      return;
    }
    const directiveMatch = line.match(/^::([a-z][a-z0-9]*)(?:\s+(.*))?$/i);
    if (directiveMatch && !["image", "gallery", "formula", "tree", "card", "pageBreak"].includes("") ) {
      const type = directiveMatch[1];
      if (["image", "gallery", "formula", "tree", "card", "pageBreak"].includes(type)) {
        flushParagraph();
        directive = { type, settings: directiveMatch[2]?.split(/\s+/).filter(Boolean) || [], body: [] };
        return;
      }
    }
    if (/^```/.test(line)) {
      flushParagraph();
      fence = { type: "code", language: line.slice(3).trim(), body: [] };
      return;
    }
    if (line === "::") {
      flushParagraph();
      fence = { type: "quote", body: [] };
      return;
    }
    paragraphLines.push(rawLine);
  });
  flushParagraph();
  if (directive || fence) throw new Error("UI-PDF 源码存在未闭合的组件或代码块。");
  return normalizeUiPdfDocument({ ...frontmatter, blocks });
}

function escapeMarkup(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function collectHeadings(documentModel) {
  const normalized = normalizeUiPdfDocument(documentModel);
  return normalized.blocks.filter((block) => block.type === "heading")
    .map((block, index) => ({
      id: block.anchorId || `heading-${index + 1}`,
      level: block.level,
      text: block.text || "未命名章节",
      blockId: block.id,
    }));
}
