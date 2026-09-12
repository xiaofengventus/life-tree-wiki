/**
 * 粘贴内容的字号归一化。
 *
 * 从网页 / Word / 公众号复制过来的富文本会带上来源的字号、字体、行高、
 * 缩进，粘进正文后大小不一。这里统一剥掉这些「尺寸类」声明，只保留
 * 语义标签（标题、加粗、斜体、列表、引用、代码、表格、链接）与颜色、对齐。
 *
 * 两个刻意的取舍：
 *   - 标题 h1–h6 保留标签本身（字号交给编辑器样式控制），只剥掉它们
 *     从来源带来的 font-size 等尺寸声明，所以标题可以手动设置、也能沿用。
 *   - 编辑器自身的节点（data-* 标记）原样跳过，避免破坏公式、卡片等。
 */

const DROP_WITH_CONTENT =
  "script,style,meta,link,title,base,noscript,iframe,object,embed";
/** 这些标签只保留内容，丢掉标签本身 */
const UNWRAP_TAGS = new Set(["FONT", "CENTER", "O:P", "O:SMARTTAG", "ST1:*"]);
/** 尺寸类声明：整条丢弃 */
const SIZE_STYLE_PROPERTIES = new Set([
  "font",
  "font-size",
  "font-family",
  "line-height",
  "letter-spacing",
  "word-spacing",
  "text-indent",
  "text-size-adjust",
  "white-space",
]);
const EDITOR_OWNED_ATTRIBUTES = [
  "data-w-e-type",
  "data-life-math",
  "data-life-post-card",
  "data-life-card",
  "data-slate",
];

function stripSizeStyles(styleValue) {
  return String(styleValue || "")
    .split(";")
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .filter((declaration) => {
      const separator = declaration.indexOf(":");
      if (separator < 0) return false;
      const property = declaration.slice(0, separator).trim().toLowerCase();
      if (!property) return false;
      if (property.startsWith("mso-")) return false;
      return !SIZE_STYLE_PROPERTIES.has(property);
    })
    .join("; ");
}

function isEditorOwned(element) {
  return EDITOR_OWNED_ATTRIBUTES.some((name) => element.hasAttribute(name));
}

/** 判断一段粘贴的 HTML 是否来自编辑器自身（含自定义节点） */
export function isEditorOwnedPaste(rawHtml) {
  return EDITOR_OWNED_ATTRIBUTES.some((name) =>
    String(rawHtml || "").includes(name),
  );
}

/**
 * 把粘贴的 HTML 归一化为正文大小。返回处理后的 HTML；无法处理时返回空串。
 */
export function normalizePastedHtml(rawHtml) {
  const html = String(rawHtml || "").trim();
  if (!html || typeof DOMParser === "undefined") return "";

  const parsed = new DOMParser().parseFromString(
    `<body>${html}</body>`,
    "text/html",
  );
  const body = parsed.body;
  body.querySelectorAll(DROP_WITH_CONTENT).forEach((node) => node.remove());

  for (const element of [...body.querySelectorAll("*")]) {
    if (!element.isConnected) continue;
    if (isEditorOwned(element)) continue;

    if (UNWRAP_TAGS.has(element.tagName)) {
      element.replaceWith(...element.childNodes);
      continue;
    }

    const style = stripSizeStyles(element.getAttribute("style"));

    // 无样式的 span 只是外部编辑器留下的包裹层，直接拆掉
    if (element.tagName === "SPAN" && !style) {
      element.replaceWith(...element.childNodes);
      continue;
    }

    if (style) element.setAttribute("style", style);
    else element.removeAttribute("style");
    element.removeAttribute("class");
    element.removeAttribute("id");
    element.removeAttribute("dir");
    element.removeAttribute("lang");
  }

  return body.innerHTML.trim();
}
