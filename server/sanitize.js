import { ApiError } from "./http.js";

const ALLOWED_TAGS = new Set([
  "p", "br", "h1", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s",
  "ul", "ol", "li", "blockquote", "code", "pre", "a", "img", "span", "sup", "hr",
  "figure", "figcaption", "div",
  "table", "thead", "tbody", "tr", "th", "td",
]);
const DROP_WITH_CONTENT = new Set([
  "script", "style", "iframe", "object", "embed", "svg", "math", "link", "meta",
  "base", "form", "input", "button", "textarea", "select", "option", "canvas",
  "video", "audio", "source",
]);
const STYLE_TAGS = new Set([
  "p", "h1", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s",
  "li", "blockquote", "code", "span", "th", "td",
]);
const NAMED_COLORS = new Set([
  "black", "silver", "gray", "white", "maroon", "red", "purple", "fuchsia",
  "green", "lime", "olive", "yellow", "navy", "blue", "teal", "aqua",
  "orange", "transparent",
]);
const MAX_FORMULA_LENGTH = 4_000;

function safeFormula(tag, attributes) {
  const mode = String(attributes["data-life-math"] || "");
  const validTag =
    (tag === "span" && mode === "inline") ||
    ((tag === "div" || tag === "p") && mode === "block");
  const latex = String(attributes["data-latex"] || "").trim();
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
    } else if (
      property === "font-weight" &&
      /^(?:normal|bold|[1-9]00)$/i.test(rawValue)
    ) {
      safe.push(`font-weight: ${rawValue.toLowerCase()}`);
    } else if (property === "font-size") {
      const size = safeFontSize(rawValue);
      if (size) safe.push(`font-size: ${size}`);
    }
  }
  return safe.join("; ");
}

function safeUrl(value, { image = false } = {}) {
  const candidate = String(value || "").trim();
  if (
    !image &&
    (
      /^#post-citation-(?:[1-9]\d{0,3})$/.test(candidate) ||
      /^#post-card-[A-Za-z0-9_-]{1,80}$/.test(candidate)
    )
  ) return candidate;
  if (candidate.startsWith("/") && !candidate.startsWith("//")) return candidate;
  try {
    const url = new URL(candidate);
    if (url.protocol === "https:" || (!image && url.protocol === "http:")) return url.href;
  } catch {
    return "";
  }
  return "";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sanitizePostHtml(rawHtml) {
  const html = String(rawHtml || "");
  if (new TextEncoder().encode(html).byteLength > 256 * 1024) {
    throw new ApiError(413, "文章正文过大", "CONTENT_TOO_LARGE");
  }
  if (typeof HTMLRewriter === "undefined") {
    return escapeHtml(html).replace(/\r?\n/g, "<br>");
  }

  const startMarker = "<!--life-sanitize-start-->";
  const endMarker = "<!--life-sanitize-end-->";
  const response = new HTMLRewriter()
    .on("*", {
      element(element) {
        const tag = element.tagName.toLowerCase();
        if (DROP_WITH_CONTENT.has(tag)) {
          element.remove();
          return;
        }
        if (!ALLOWED_TAGS.has(tag)) {
          element.removeAndKeepContent();
          return;
        }

        const attributes = Array.from(element.attributes);
        const original = Object.fromEntries(attributes);
        for (const [name] of attributes) element.removeAttribute(name);

        const formula = safeFormula(tag, original);
        if (formula) {
          element.setAttribute("data-life-math", formula.mode);
          element.setAttribute("data-latex", formula.latex);
          element.setInnerContent(formula.latex);
          return;
        }
        if (
          tag === "figure" &&
          /^[A-Za-z0-9_-]{1,80}$/.test(original["data-life-post-card"] || "")
        ) {
          element.setAttribute("data-life-post-card", original["data-life-post-card"]);
          element.setAttribute("class", "life-post-card classification-card-preview");
          if (
            original["data-life-card"] &&
            original["data-life-card"].length <= 20_000
          ) {
            element.setAttribute("data-life-card", original["data-life-card"]);
          }
        }
        if (tag === "div") {
          element.removeAndKeepContent();
          return;
        }

        if (STYLE_TAGS.has(tag)) {
          const style = safeInlineStyle(original.style);
          if (style) element.setAttribute("style", style);
        }
        if (
          (tag === "th" || tag === "td") &&
          /^(?:[1-9]|10)$/.test(original.colspan || "")
        ) {
          element.setAttribute("colspan", original.colspan);
        }

        if (tag === "a") {
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
        } else if (tag === "img") {
          const src = safeUrl(original.src, { image: true });
          if (!src) {
            element.remove();
            return;
          }
          element.setAttribute("src", src);
          element.setAttribute("alt", String(original.alt || "").slice(0, 200));
          element.setAttribute("loading", "lazy");
          element.setAttribute("referrerpolicy", "no-referrer");
        }
      },
    })
    .transform(
      new Response(`${startMarker}${html}${endMarker}`, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }),
    );
  const transformed = await response.text();
  const start = transformed.indexOf(startMarker);
  const end = transformed.lastIndexOf(endMarker);
  if (start < 0 || end < start) return "";
  return transformed.slice(start + startMarker.length, end);
}

export function htmlToPlainText(html) {
  return String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}
