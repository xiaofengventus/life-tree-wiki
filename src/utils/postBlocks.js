import { sanitizeHtml } from "./sanitizeHtml";
import { normalizeLegacyImageCaptionHtml } from "./imageCaptionHtml";
import { normalizeCitationLinks } from "./citationHtml";
import { renderFormulaNodes } from "./formula";
import { decorateRichHtml } from "./richHtml";
import { postCardIdFromHref } from "./postCardMarkers.js";

function embeddedTreeFromNode(node) {
  if (!(node instanceof Element)) return null;
  const anchor = node.matches("a")
    ? node
    : node.matches("p") && node.children.length === 1
      ? node.firstElementChild
      : null;
  if (!anchor?.matches("a")) return null;
  if (node.textContent.trim() !== anchor.textContent.trim()) return null;
  try {
    const url = new URL(anchor.getAttribute("href") || "", window.location.origin);
    // 兼容存量 view-tree 链接与新 life-tree 链接
    const match = url.origin === window.location.origin
      ? url.pathname.match(/^\/(?:view|life)-tree\/([A-Za-z0-9_-]{1,100})\/?$/)
      : null;
    if (!match) return null;
    return {
      id: match[1],
      title: anchor.textContent.replace(/^\s*🌳\s*进化树[：:]?\s*/, "").trim() || "进化树",
    };
  } catch {
    return null;
  }
}

function embeddedCardFromNode(node) {
  if (!(node instanceof Element)) return null;
  if (node.matches("figure[data-life-post-card]")) {
    return {
      id: node.getAttribute("data-life-post-card"),
      config: node.getAttribute("data-life-card") || "",
    };
  }
  // 容错：figure 被包在 <p> 里（粘贴/旧数据），且该段落只含这一张卡
  if (node.matches("p") && node.children.length === 1) {
    const wrapped = node.firstElementChild;
    if (
      wrapped instanceof Element &&
      wrapped.matches("figure[data-life-post-card]") &&
      node.textContent.trim() === wrapped.textContent.trim()
    ) {
      return {
        id: wrapped.getAttribute("data-life-post-card"),
        config: wrapped.getAttribute("data-life-card") || "",
      };
    }
  }
  const anchor = node.matches("a")
    ? node
    : node.matches("p") && node.children.length === 1
      ? node.firstElementChild
      : null;
  if (!anchor?.matches("a")) return null;
  if (node.textContent.trim() !== anchor.textContent.trim()) return null;
  const id = postCardIdFromHref(anchor.getAttribute("href"));
  return id ? { id } : null;
}

export function parsePostBlocks(rawHtml, { citations = [] } = {}) {
  const safeHtml = decorateRichHtml(renderFormulaNodes(normalizeCitationLinks(
    normalizeLegacyImageCaptionHtml(sanitizeHtml(rawHtml)),
    citations,
  )));
  if (typeof DOMParser === "undefined") return [{ type: "html", html: safeHtml }];
  const parsed = new DOMParser().parseFromString(`<body>${safeHtml}</body>`, "text/html");
  const blocks = [];
  let html = "";
  const flushHtml = () => {
    if (!html.trim()) return;
    blocks.push({ type: "html", html });
    html = "";
  };
  for (const node of parsed.body.childNodes) {
    const tree = embeddedTreeFromNode(node);
    const card = embeddedCardFromNode(node);
    if (card) {
      flushHtml();
      blocks.push({ type: "card", ...card });
    } else if (tree) {
      flushHtml();
      blocks.push({ type: "tree", ...tree });
    } else {
      html += node.nodeType === Node.ELEMENT_NODE ? node.outerHTML : node.textContent;
    }
  }
  flushHtml();
  return blocks.length ? blocks : [{ type: "html", html: "" }];
}
