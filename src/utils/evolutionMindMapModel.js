import {
  internalContentUrl,
  internalPostIdFromUrl,
  internalTreeIdFromUrl,
} from "./articleLinks.js";

const SUPPORTED_LAYOUTS = new Set([
  "logicalStructure",
  "logicalStructureLeft",
  "mindMap",
  "organizationStructure",
  "catalogOrganization",
]);

export const XUR_FORMAT = "life-tree.xur";
export const XUR_VERSION = 6;
const MAX_CITATIONS = 200;
const MAX_CITATION_NUMBER = 9_999;
const MAX_NODE_CITATIONS = 20;
const LEGACY_EMPTY_NODE_LABELS = new Set(["未命名分类群", "未命名生物群"]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createUid() {
  return `life-node-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function safeResourceUrl(value, { image = false } = {}) {
  const candidate = String(value || "").trim();
  if (!candidate) return "";
  if (candidate.startsWith("/media/") && !candidate.startsWith("//"))
    return candidate;
  if (
    image &&
    /^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i.test(candidate)
  ) {
    return candidate;
  }
  try {
    const url = new URL(candidate);
    if (url.protocol === "https:" || (!image && url.protocol === "http:"))
      return url.href;
  } catch {
    return "";
  }
  return "";
}

export function normalizeArticleLinks(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const links = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const candidate = String(item.url || "").trim();
    if (!candidate || candidate.length > 2000) continue;
    let parsed;
    try {
      parsed = new URL(candidate);
    } catch {
      continue;
    }
    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      parsed.href.length > 2000 ||
      seen.has(parsed.href)
    )
      continue;
    const url = parsed.href;
    seen.add(url);
    const fallbackTitle = parsed.hostname || "外部文章";
    links.push({
      title:
        String(item.title || fallbackTitle)
          .trim()
          .slice(0, 200) || fallbackTitle,
      url,
    });
    if (links.length >= 20) break;
  }
  return links;
}

export function normalizeContentLinks(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const links = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const candidate = String(item.url || "").trim();
    const declaredType = String(item.type || "").toUpperCase();
    const inferredPostId = candidate
      ? internalPostIdFromUrl(candidate, "")
      : "";
    const inferredTreeId = candidate
      ? internalTreeIdFromUrl(candidate, "")
      : "";
    const type = ["ARTICLE", "TREE", "EXTERNAL"].includes(declaredType)
      ? declaredType
      : inferredPostId
        ? "ARTICLE"
        : inferredTreeId
          ? "TREE"
          : "EXTERNAL";
    const targetId =
      type === "ARTICLE" || type === "TREE"
        ? String(
            item.targetId ||
              (type === "ARTICLE" ? inferredPostId : inferredTreeId),
          ).trim()
        : "";

    let url = candidate;
    if (type !== "EXTERNAL") {
      url = internalContentUrl(type, targetId);
      if (!url) continue;
    } else {
      let parsed;
      try {
        parsed = new URL(candidate);
      } catch {
        continue;
      }
      if (
        parsed.protocol !== "https:" ||
        parsed.username ||
        parsed.password ||
        parsed.href.length > 2000
      )
        continue;
      url = parsed.href;
    }

    const key = type === "EXTERNAL" ? url : `${type}:${targetId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const fallbackTitle =
      type === "ARTICLE"
        ? `文章 ${targetId}`
        : type === "TREE"
          ? `进化树 ${targetId}`
          : new URL(url).hostname || "外部链接";
    links.push({
      type,
      targetId,
      title:
        String(item.title || fallbackTitle)
          .trim()
          .slice(0, 200) || fallbackTitle,
      url,
    });
    if (links.length >= 20) break;
  }
  return links;
}

export function normalizeTreeCitations(value) {
  if (!Array.isArray(value)) return [];
  const numbers = new Set();
  let totalLength = 0;
  return value
    .map((citation) => ({
      number: Number(citation?.number),
      text: String(citation?.text || "")
        .trim()
        .slice(0, 4_000),
    }))
    .filter((citation) => {
      if (
        !Number.isSafeInteger(citation.number) ||
        citation.number < 1 ||
        citation.number > MAX_CITATION_NUMBER ||
        !citation.text ||
        numbers.has(citation.number) ||
        numbers.size >= MAX_CITATIONS ||
        totalLength + citation.text.length > 100_000
      )
        return false;
      numbers.add(citation.number);
      totalLength += citation.text.length;
      return true;
    })
    .sort((first, second) => first.number - second.number);
}

export function normalizeNodeCitationNumbers(value, availableNumbers = null) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value
    .map(Number)
    .filter((number) => {
      if (
        !Number.isSafeInteger(number) ||
        number < 1 ||
        number > MAX_CITATION_NUMBER ||
        seen.has(number) ||
        seen.size >= MAX_NODE_CITATIONS ||
        (availableNumbers && !availableNumbers.has(number))
      )
        return false;
      seen.add(number);
      return true;
    })
    .sort((first, second) => first - second);
}

function sanitizeNodeResources(
  node,
  seenUids = new Set(),
  availableCitations = null,
) {
  const uid = String(node.data.uid || "");
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(uid) || seenUids.has(uid)) {
    node.data.uid = createUid();
  }
  seenUids.add(node.data.uid);
  node.data.contentLinks = normalizeContentLinks(
    node.data.contentLinks ?? node.data.articleLinks,
  );
  delete node.data.articleLinks;
  node.data.citationNumbers = normalizeNodeCitationNumbers(
    node.data.citationNumbers,
    availableCitations,
  );
  delete node.data.hyperlink;
  delete node.data.hyperlinkTitle;
  node.data.image = safeResourceUrl(node.data.image, { image: true });
  if (!node.data.image) node.data.imageSize = undefined;
  node.children.forEach((child) =>
    sanitizeNodeResources(child, seenUids, availableCitations),
  );
}

export function createMindMapNode(text = "", children = [], data = {}) {
  const sourceData = { ...data };
  delete sourceData.hyperlink;
  delete sourceData.hyperlinkTitle;
  delete sourceData.articleLinks;
  delete sourceData.contentLinks;
  return {
    data: {
      ...sourceData,
      uid: data.uid || createUid(),
      text: String(text ?? ""),
      expand: data.expand !== false,
      contentLinks: normalizeContentLinks(
        data.contentLinks ?? data.articleLinks,
      ),
      citationNumbers: normalizeNodeCitationNumbers(data.citationNumbers),
      image: String(data.image || ""),
      imageTitle: String(data.imageTitle || ""),
      imageSize: data.image
        ? data.imageSize || { width: 180, height: 110, custom: false }
        : undefined,
    },
    children: Array.isArray(children) ? children : [],
  };
}

function restoreLegacyEmptyNodeLabels(node) {
  if (LEGACY_EMPTY_NODE_LABELS.has(node.data.text)) node.data.text = "";
  node.children.forEach(restoreLegacyEmptyNodeLabels);
}

export function createInitialMindMapDocument() {
  return {
    citations: [],
    layout: "logicalStructure",
    evolution: {
      nodeLineStyle: true,
      hideInternalNames: false,
      alignLeavesRight: false,
    },
    root: createMindMapNode("生命共同祖先", [], {
      fillColor: "#ffffff",
      color: "#000000",
      borderColor: "#ffffff",
      borderWidth: 0,
      fontSize: 20,
      fontWeight: "bold",
      shape: "roundedRectangle",
    }),
    theme: {
      template: "default",
      config: createEvolutionTheme(),
    },
    view: null,
  };
}

export function createEvolutionTheme() {
  return {
    backgroundColor: "#ffffff",
    lineColor: "#000000",
    lineWidth: 1,
    lineStyle: "straight",
    lineRadius: 0,
    nodeUseLineStyle: true,
    hoverRectColor: "#4b5563",
    root: {
      shape: "rectangle",
      fillColor: "#ffffff",
      color: "#000000",
      borderColor: "#ffffff",
      borderWidth: 0,
      borderRadius: 0,
      fontFamily: '"Noto Sans SC", "Microsoft YaHei", sans-serif',
      fontSize: 20,
      fontWeight: "bold",
      marginX: 90,
      marginY: 28,
      paddingX: 20,
      paddingY: 10,
    },
    second: {
      shape: "rectangle",
      fillColor: "#ffffff",
      color: "#000000",
      borderColor: "#ffffff",
      borderWidth: 0,
      borderRadius: 0,
      fontFamily: '"Noto Sans SC", "Microsoft YaHei", sans-serif',
      fontSize: 17,
      fontWeight: "bold",
      marginX: 86,
      marginY: 22,
      paddingX: 14,
      paddingY: 7,
    },
    node: {
      shape: "rectangle",
      fillColor: "#ffffff",
      color: "#000000",
      borderColor: "#ffffff",
      borderWidth: 0,
      borderRadius: 0,
      fontFamily: '"Noto Sans SC", "Microsoft YaHei", sans-serif',
      fontSize: 15,
      marginX: 62,
      marginY: 12,
      paddingX: 12,
      paddingY: 6,
    },
  };
}

function assertNode(node, path = "root") {
  if (!node || typeof node !== "object" || !node.data) {
    throw new Error(`${path} 不是有效的 mind-map 节点`);
  }
  if (typeof node.data.text !== "string") {
    throw new Error(`${path}.data.text 必须是字符串`);
  }
  if (!Array.isArray(node.children)) {
    throw new Error(`${path}.children 必须是数组`);
  }
  node.children.forEach((child, index) =>
    assertNode(child, `${path}.children[${index}]`),
  );
}

export function normalizeMindMapDocument(value) {
  const source = value?.format === XUR_FORMAT ? value.document : value;
  if (!source?.root || !source.root.data) {
    throw new Error("仅支持新版 life-tree.xur 或 simple-mind-map 完整文档");
  }

  const document = clone(source);
  assertNode(document.root);
  document.citations = normalizeTreeCitations(document.citations);
  const availableCitations = new Set(
    document.citations.map((citation) => citation.number),
  );
  restoreLegacyEmptyNodeLabels(document.root);
  sanitizeNodeResources(document.root, new Set(), availableCitations);
  document.layout = SUPPORTED_LAYOUTS.has(document.layout)
    ? document.layout
    : "logicalStructure";
  const defaultTheme = createEvolutionTheme();
  const savedTheme = document.theme?.config || {};
  document.theme = {
    template: document.theme?.template || "default",
    config: {
      ...defaultTheme,
      ...savedTheme,
      backgroundColor: "#ffffff",
      lineColor: "#000000",
      lineWidth: 1,
      lineStyle: "straight",
      lineRadius: 0,
      root: {
        ...defaultTheme.root,
        ...savedTheme.root,
        shape: "rectangle",
        fillColor: "#ffffff",
        color: "#000000",
        borderColor: "#ffffff",
        borderWidth: 0,
        borderRadius: 0,
      },
      second: {
        ...defaultTheme.second,
        ...savedTheme.second,
        shape: "rectangle",
        fillColor: "#ffffff",
        color: "#000000",
        borderColor: "#ffffff",
        borderWidth: 0,
        borderRadius: 0,
      },
      node: {
        ...defaultTheme.node,
        ...savedTheme.node,
        shape: "rectangle",
        fillColor: "#ffffff",
        color: "#000000",
        borderColor: "#ffffff",
        borderWidth: 0,
        borderRadius: 0,
      },
    },
  };
  document.evolution = {
    nodeLineStyle: document.evolution?.nodeLineStyle !== false,
    hideInternalNames: Boolean(document.evolution?.hideInternalNames),
    alignLeavesRight: Boolean(document.evolution?.alignLeavesRight),
  };
  document.theme.config.nodeUseLineStyle = document.evolution.nodeLineStyle;
  document.view ||= null;
  return document;
}

export function createXurFile(document) {
  return {
    format: XUR_FORMAT,
    version: XUR_VERSION,
    engine: "simple-mind-map",
    exportedAt: new Date().toISOString(),
    document: normalizeMindMapDocument(document),
  };
}

export function countMindMapNodes(root) {
  if (!root) return 0;
  return (
    1 +
    (root.children || []).reduce(
      (sum, child) => sum + countMindMapNodes(child),
      0,
    )
  );
}
