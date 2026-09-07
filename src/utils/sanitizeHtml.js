const ALLOWED_TAGS = new Set([
  "P", "BR", "H1", "H2", "H3", "H4", "STRONG", "B", "EM", "I", "U", "S", "DEL",
  "UL", "OL", "LI", "BLOCKQUOTE", "CODE", "PRE", "A", "IMG", "SPAN", "SUP", "HR",
  "FIGURE", "FIGCAPTION", "DIV", "INPUT",
  "TABLE", "THEAD", "TBODY", "TR", "TH", "TD",
]);
const DROP_WITH_CONTENT = new Set([
  "SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "SVG", "MATH", "LINK", "META",
  "BASE", "FORM", "BUTTON", "TEXTAREA", "SELECT", "OPTION", "CANVAS",
  "VIDEO", "AUDIO", "SOURCE",
]);
const STYLE_TAGS = new Set([
  "P", "H1", "H2", "H3", "H4", "STRONG", "B", "EM", "I", "U", "S", "DEL",
  "LI", "BLOCKQUOTE", "CODE", "SPAN", "TH", "TD",
]);
const NAMED_COLORS = new Set([
  "black", "silver", "gray", "white", "maroon", "red", "purple", "fuchsia",
  "green", "lime", "olive", "yellow", "navy", "blue", "teal", "aqua",
  "orange", "transparent",
]);
const MAX_FORMULA_LENGTH = 4_000;

function safeFormula(tagName, attributes, textContent) {
  const mode = String(attributes["data-life-math"] || "");
  const validTag =
    (tagName === "SPAN" && mode === "inline") ||
    ((tagName === "DIV" || tagName === "P") && mode === "block");
  const latex = String(attributes["data-latex"] || textContent || "").trim();
  if (!validTag || !latex || latex.length > MAX_FORMULA_LENGTH) return null;
  return { mode, latex };
}

function safeColor(value) {
  const color = String(value || "").trim().toLowerCase();
  if (NAMED_COLORS.has(color)) return color;
  if (/^#(?:[a-f0-9]{3}|[a-f0-9]{4}|[a-f0-9]{6}|[a-f0-9]{8})$/i.test(color)) return color;
  if (/^rgba?\(\s*\d{1,3}(?:\.\d+)?%?\s*,\s*\d{1,3}(?:\.\d+)?%?\s*,\s*\d{1,3}(?:\.\d+)?%?(?:\s*,\s*(?:0|1|0?\.\d+|\d{1,3}%))?\s*\)$/i.test(color)) return color;
  return "";
}

function safeFontSize(value) {
  const match = String(value || "").trim().match(/^(\d+(?:\.\d+)?)px$/i);
  if (!match) return "";
  const size = Number(match[1]);
  return size >= 8 && size <= 72 ? `${size}px` : "";
}

function safeInlineStyle(value) {
  const safe = [];
  for (const declaration of String(value || "").split(";")) {
    const separator = declaration.indexOf(":");
    if (separator < 0) continue;
    const property = declaration.slice(0, separator).trim().toLowerCase();
    const rawValue = declaration.slice(separator + 1).trim();
    if (property === "color" || property === "background-color") {
      const color = safeColor(rawValue);
      if (color) safe.push(`${property}: ${color}`);
    } else if (property === "font-weight" && /^(?:normal|bold|[1-9]00)$/i.test(rawValue)) {
      safe.push(`font-weight: ${rawValue.toLowerCase()}`);
    } else if (property === "font-size") {
      const size = safeFontSize(rawValue);
      if (size) safe.push(`font-size: ${size}`);
    }
  }
  return safe.join("; ");
}

function escapeHtml(value) {
  if (typeof document === "undefined") {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  const container = document.createElement("div");
  container.textContent = String(value || "");
  return container.innerHTML;
}

function safeUrl(value, image = false) {
  const candidate = String(value || "").trim();
  if (
    !image &&
    (
      /^#post-citation-(?:[1-9]\d{0,3})$/.test(candidate) ||
      /^#post-card-[A-Za-z0-9_-]{1,80}$/.test(candidate)
    )
  ) return candidate;
  if (candidate.startsWith("/") && !candidate.startsWith("//")) return candidate;
  if (!image && /^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(candidate)) return candidate;
  try {
    const url = new URL(candidate);
    if (url.protocol === "https:" || (!image && url.protocol === "http:")) return url.href;
  } catch {
    return "";
  }
  return "";
}

export function sanitizeHtml(rawHtml) {
  if (typeof DOMParser === "undefined") return escapeHtml(rawHtml);
  const documentNode = new DOMParser().parseFromString(`<body>${rawHtml || ""}</body>`, "text/html");
  const elements = [...documentNode.body.querySelectorAll("*")];
  for (const element of elements) {
    if (DROP_WITH_CONTENT.has(element.tagName)) {
      element.remove();
      continue;
    }
    if (!ALLOWED_TAGS.has(element.tagName)) {
      element.replaceWith(...element.childNodes);
      continue;
    }

    const original = Object.fromEntries(Array.from(element.attributes, (attribute) => [attribute.name, attribute.value]));
    for (const attribute of Array.from(element.attributes)) element.removeAttribute(attribute.name);
    const formula = safeFormula(element.tagName, original, element.textContent);
    if (formula) {
      element.setAttribute("data-life-math", formula.mode);
      element.setAttribute("data-latex", formula.latex);
      element.textContent = formula.latex;
      continue;
    }
    if (element.tagName === "FIGURE" && /^[A-Za-z0-9_-]{1,80}$/.test(original["data-life-post-card"] || "")) {
      element.setAttribute("data-life-post-card", original["data-life-post-card"]);
      element.setAttribute("class", "life-post-card classification-card-preview");
      if (original["data-life-card"] && original["data-life-card"].length <= 20000) {
        element.setAttribute("data-life-card", original["data-life-card"]);
      }
    }
    if (element.tagName === "DIV") {
      if (original["data-w-e-type"] === "todo") {
        element.setAttribute("data-w-e-type", "todo");
      } else {
        element.replaceWith(...element.childNodes);
        continue;
      }
    }
    if (STYLE_TAGS.has(element.tagName)) {
      const style = safeInlineStyle(original.style);
      if (style) element.setAttribute("style", style);
    }
    if (
      (element.tagName === "TH" || element.tagName === "TD") &&
      /^(?:[1-9]|10)$/.test(original.colspan || "")
    ) {
      element.setAttribute("colspan", original.colspan);
    }
    if (
      (element.tagName === "TH" || element.tagName === "TD") &&
      /^(?:left|center|right)$/i.test(original.align || "")
    ) {
      const currentStyle = element.getAttribute("style");
      const alignment = `text-align: ${original.align.toLowerCase()}`;
      element.setAttribute("style", currentStyle ? `${currentStyle}; ${alignment}` : alignment);
    }
    if (element.tagName === "CODE") {
      const classLanguage = String(original.class || "")
        .match(/(?:^|\s)language-([a-z0-9_+#-]{1,32})(?:\s|$)/i)?.[1];
      const language = String(original["data-code-language"] || classLanguage || "")
        .trim()
        .toLowerCase();
      if (/^[a-z0-9_+#-]{1,32}$/.test(language)) {
        element.setAttribute("class", `language-${language}`);
        element.setAttribute("data-code-language", language);
      }
    }
    if (element.tagName === "A") {
      const href = safeUrl(original.href);
      if (href) element.setAttribute("href", href);
      if (original.title) element.setAttribute("title", original.title.slice(0, 200));
      if (
        !href.startsWith("#post-citation-") &&
        !href.startsWith("#post-card-")
      ) {
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noopener noreferrer nofollow");
      }
    } else if (element.tagName === "IMG") {
      const src = safeUrl(original.src, true);
      if (!src) {
        element.remove();
        continue;
      }
      element.setAttribute("src", src);
      element.setAttribute("alt", String(original.alt || "").slice(0, 200));
      element.setAttribute("loading", "lazy");
      element.setAttribute("referrerpolicy", "no-referrer");
    } else if (element.tagName === "INPUT") {
      if (String(original.type || "").toLowerCase() !== "checkbox") {
        element.remove();
        continue;
      }
      element.setAttribute("type", "checkbox");
      element.setAttribute("disabled", "");
      if (Object.prototype.hasOwnProperty.call(original, "checked")) {
        element.setAttribute("checked", "");
      }
      element.setAttribute("tabindex", "-1");
    }
  }
  return documentNode.body.innerHTML;
}
