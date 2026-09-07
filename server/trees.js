import { ApiError } from "./http.js";
import { formatPublicId, parsePublicId } from "./publicIds.js";
import { mediaUrl } from "./media.js";
import { sanitizeCitations } from "./citations.js";

const MAX_TREE_BYTES = 4 * 1024 * 1024;
const MAX_NODES = 10_000;
const MAX_DEPTH = 128;
const MAX_NODE_CITATIONS = 20;
const LEGACY_EMPTY_NODE_LABELS = new Set(["未命名分类群", "未命名生物群"]);
const SUPPORTED_LAYOUTS = new Set([
  "logicalStructure",
  "logicalStructureLeft",
  "mindMap",
  "organizationStructure",
  "catalogOrganization",
]);
const SAFE_SHAPES = new Set([
  "rectangle",
  "roundedRectangle",
  "diamond",
  "parallelogram",
  "ellipse",
  "circle",
]);

function parseTags(value) {
  try {
    const tags = JSON.parse(value || "[]");
    return Array.isArray(tags) ? tags : [];
  } catch {
    return [];
  }
}

function limitedString(value, maximum, fallback = "") {
  const text = String(value ?? fallback).trim();
  const clean = Array.from(text)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join("");
  return clean.slice(0, maximum);
}

function safeColor(value, fallback) {
  const color = String(value || "").trim();
  return /^(?:#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\))$/i.test(color) ? color : fallback;
}

function safeNumber(value, fallback, minimum, maximum) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : fallback;
}

function safeDasharray(value) {
  const dasharray = String(value || "").trim();
  return /^(?:\d+(?:\.\d+)?)(?:[\s,]+\d+(?:\.\d+)?){1,5}$/.test(dasharray)
    ? dasharray.slice(0, 80)
    : "";
}

function safeResourceUrl(value, { image = false } = {}) {
  const candidate = String(value || "").trim();
  if (!candidate) return "";
  if (candidate.startsWith("/media/") && !candidate.startsWith("//")) return candidate;
  if (image && /^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i.test(candidate)) {
    return candidate;
  }
  try {
    const url = new URL(candidate);
    if (url.protocol === "https:" || (!image && url.protocol === "http:")) return url.href;
  } catch {
    return "";
  }
  return "";
}

function internalContentUrl(type, targetId) {
  const id = String(targetId || "").trim();
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) return "";
  const path = type === "TREE" ? "view-tree" : type === "ARTICLE" ? "view-post" : "";
  return path ? `https://life-tree.pages.dev/${path}/${encodeURIComponent(id)}` : "";
}

function internalIdFromCanonicalUrl(value, path) {
  try {
    const url = new URL(String(value || ""));
    if (
      url.origin !== "https://life-tree.pages.dev" ||
      url.username ||
      url.password
    ) return "";
    return url.pathname.match(
      new RegExp(`^/${path}/([A-Za-z0-9_-]{1,100})/?$`),
    )?.[1] || "";
  } catch {
    return "";
  }
}

function safeContentLinks(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const links = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const candidate = String(item.url || "").trim();
    const declaredType = String(item.type || "").toUpperCase();
    const inferredPostId = internalIdFromCanonicalUrl(candidate, "view-post");
    const inferredTreeId = internalIdFromCanonicalUrl(candidate, "view-tree");
    const type = ["ARTICLE", "TREE", "EXTERNAL"].includes(declaredType)
      ? declaredType
      : inferredPostId
        ? "ARTICLE"
        : inferredTreeId
          ? "TREE"
          : "EXTERNAL";
    const targetId = type === "ARTICLE" || type === "TREE"
      ? limitedString(
        item.targetId || (type === "ARTICLE" ? inferredPostId : inferredTreeId),
        100,
      )
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
      ) continue;
      url = parsed.href;
    }
    const key = type === "EXTERNAL" ? url : `${type}:${targetId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const fallbackTitle = type === "ARTICLE"
      ? `文章 ${targetId}`
      : type === "TREE"
        ? `进化树 ${targetId}`
        : new URL(url).hostname || "外部链接";
    links.push({
      type,
      targetId,
      title: limitedString(item.title, 200) || fallbackTitle,
      url,
    });
    if (links.length >= 20) break;
  }
  return links;
}

function safeNodeCitationNumbers(value, availableCitations) {
  if (!Array.isArray(value)) return [];
  const numbers = [];
  const seen = new Set();
  for (const candidate of value) {
    const number = Number(candidate);
    if (
      !Number.isSafeInteger(number) ||
      number < 1 ||
      number > 9_999 ||
      seen.has(number)
    ) continue;
    if (!availableCitations.has(number)) {
      throw new ApiError(
        400,
        `节点引用 [${number}] 缺少对应的参考文献`,
        "TREE_CITATION_TEXT_MISSING",
      );
    }
    seen.add(number);
    numbers.push(number);
    if (numbers.length >= MAX_NODE_CITATIONS) break;
  }
  return numbers.sort((first, second) => first - second);
}

function sanitizeNode(source, state, depth) {
  if (!source || typeof source !== "object" || !source.data || !Array.isArray(source.children)) {
    throw new ApiError(400, "进化树包含无效节点", "INVALID_TREE");
  }
  if (depth > MAX_DEPTH) throw new ApiError(400, "进化树层级过深", "TREE_TOO_DEEP");
  state.count += 1;
  if (state.count > MAX_NODES) throw new ApiError(413, "进化树节点数量超过 10000", "TREE_TOO_LARGE");

  let uid = limitedString(source.data.uid, 100);
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(uid) || state.uids.has(uid)) {
    uid = `life-node-${crypto.randomUUID()}`;
  }
  state.uids.add(uid);

  const image = safeResourceUrl(source.data.image, { image: true });
  const shape = SAFE_SHAPES.has(source.data.shape) ? source.data.shape : "rectangle";
  const nodeText = limitedString(source.data.text, 500);
  const data = {
    uid,
    text: LEGACY_EMPTY_NODE_LABELS.has(nodeText) ? "" : nodeText,
    expand: source.data.expand !== false,
    contentLinks: safeContentLinks(
      source.data.contentLinks ?? source.data.articleLinks,
    ),
    citationNumbers: safeNodeCitationNumbers(
      source.data.citationNumbers,
      state.availableCitations,
    ),
    image,
    imageTitle: limitedString(source.data.imageTitle, 200),
    color: safeColor(source.data.color, "#000000"),
    fillColor: safeColor(source.data.fillColor, "#ffffff"),
    borderColor: safeColor(source.data.borderColor, "#ffffff"),
    lineColor: safeColor(source.data.lineColor, "#000000"),
    borderWidth: safeNumber(source.data.borderWidth, 0, 0, 12),
    borderDasharray: safeDasharray(source.data.borderDasharray),
    fontSize: safeNumber(source.data.fontSize, 15, 8, 72),
    fontWeight: source.data.fontWeight === "bold" ? "bold" : "normal",
    shape,
  };
  if (image) {
    data.imageSize = {
      width: safeNumber(source.data.imageSize?.width, 180, 20, 1200),
      height: safeNumber(source.data.imageSize?.height, 110, 20, 1200),
      custom: Boolean(source.data.imageSize?.custom),
    };
  }

  return {
    data,
    children: source.children.map((child) => sanitizeNode(child, state, depth + 1)),
  };
}

function sanitizeThemeLayer(source, defaults) {
  return {
    ...defaults,
    shape: SAFE_SHAPES.has(source?.shape) ? source.shape : defaults.shape,
    fillColor: safeColor(source?.fillColor, defaults.fillColor),
    color: safeColor(source?.color, defaults.color),
    borderColor: safeColor(source?.borderColor, defaults.borderColor),
    borderWidth: safeNumber(source?.borderWidth, defaults.borderWidth, 0, 12),
    borderRadius: safeNumber(source?.borderRadius, 0, 0, 50),
    fontSize: safeNumber(source?.fontSize, defaults.fontSize, 8, 72),
    fontWeight: source?.fontWeight === "bold" ? "bold" : defaults.fontWeight,
    marginX: safeNumber(source?.marginX, defaults.marginX, 10, 240),
    marginY: safeNumber(source?.marginY, defaults.marginY, 4, 120),
    paddingX: safeNumber(source?.paddingX, defaults.paddingX, 0, 80),
    paddingY: safeNumber(source?.paddingY, defaults.paddingY, 0, 80),
  };
}

export function sanitizeTreeDocument(value) {
  const serialized = JSON.stringify(value || {});
  if (new TextEncoder().encode(serialized).byteLength > MAX_TREE_BYTES) {
    throw new ApiError(413, "进化树文件超过 4MB", "TREE_TOO_LARGE");
  }
  const source = value?.format === "life-tree.xur" ? value.document : value;
  if (!source?.root) throw new ApiError(400, "进化树文件格式无效", "INVALID_TREE");

  const citations = sanitizeCitations(source.citations, {
    ownerLabel: "一棵进化树",
  });
  const state = {
    count: 0,
    uids: new Set(),
    availableCitations: new Set(
      citations.map((citation) => citation.number),
    ),
  };
  const root = sanitizeNode(source.root, state, 0);
  const defaults = {
    root: { shape: "rectangle", fillColor: "#ffffff", color: "#000000", borderColor: "#ffffff", borderWidth: 0, fontSize: 20, fontWeight: "bold", marginX: 90, marginY: 28, paddingX: 20, paddingY: 10 },
    second: { shape: "rectangle", fillColor: "#ffffff", color: "#000000", borderColor: "#ffffff", borderWidth: 0, fontSize: 17, fontWeight: "bold", marginX: 86, marginY: 22, paddingX: 14, paddingY: 7 },
    node: { shape: "rectangle", fillColor: "#ffffff", color: "#000000", borderColor: "#ffffff", borderWidth: 0, fontSize: 15, fontWeight: "normal", marginX: 62, marginY: 12, paddingX: 12, paddingY: 6 },
  };
  const config = source.theme?.config || {};
  const document = {
    citations,
    layout: SUPPORTED_LAYOUTS.has(source.layout) ? source.layout : "logicalStructure",
    evolution: {
      nodeLineStyle: source.evolution?.nodeLineStyle !== false,
      hideInternalNames: Boolean(source.evolution?.hideInternalNames),
      alignLeavesRight: Boolean(source.evolution?.alignLeavesRight),
    },
    root,
    theme: {
      template: "default",
      config: {
        backgroundColor: "#ffffff",
        lineColor: safeColor(config.lineColor, "#000000"),
        lineWidth: safeNumber(config.lineWidth, 2, 1, 8),
        lineStyle: "straight",
        lineRadius: 0,
        nodeUseLineStyle: source.evolution?.nodeLineStyle !== false,
        hoverRectColor: safeColor(config.hoverRectColor, "#4b5563"),
        root: sanitizeThemeLayer(config.root, defaults.root),
        second: sanitizeThemeLayer(config.second, defaults.second),
        node: sanitizeThemeLayer(config.node, defaults.node),
      },
    },
    view: null,
  };
  return { document, nodeCount: state.count };
}

export function treeSummary(row) {
  const platformRecommended = Boolean(row.platform_recommended);
  const platformManaged = Boolean(
    (platformRecommended || row.kind === "OFFICIAL") &&
    (
      row.creator_role === "ADMIN" ||
      Number(row.creator_public_id) === 1 ||
      row.kind === "OFFICIAL"
    ),
  );
  return {
    id: row.id,
    uid: formatPublicId("tree", row.public_id),
    kind: row.kind,
    platformRecommended,
    platformManaged,
    platformLabel: platformRecommended || row.kind === "OFFICIAL"
      ? platformManaged ? "平台维护" : "平台推荐"
      : "",
    platformReviewedAt: row.platform_reviewed_at || "",
    title: row.title,
    description: row.description || "",
    creator: row.creator_name,
    creatorUid: formatPublicId("user", row.creator_public_id),
    creatorAvatarUrl: row.creator_avatar_hash ? mediaUrl(row.creator_avatar_hash) : "",
    nodeCount: Number(row.node_count || 0),
    license: row.license,
    tags: parseTags(row.tags_json),
    changeNote: row.change_note || "",
    forkEnabled: Boolean(row.fork_enabled),
    contributionEnabled: Boolean(row.contribution_enabled),
    forkedFrom: row.forked_from_tree_id
      ? {
          id: row.forked_from_tree_id,
          uid: formatPublicId("tree", row.source_public_id),
          title: row.source_title || "",
          creator: row.source_creator_name || "",
          creatorUid: formatPublicId("user", row.source_creator_public_id),
        }
      : null,
    forkCount: Number(row.fork_count || 0),
    contributionCount: Number(row.approved_contribution_count || 0),
    submittedAt: row.created_at,
    updatedAt: row.updated_at,
    version: Number(row.version || 1),
    visibility: row.visibility || "PUBLIC",
    isPrivate: row.visibility === "PRIVATE",
    deletedAt: row.deleted_at || "",
  };
}

export function treeDetail(row, contributors = []) {
  let document;
  try {
    document = JSON.parse(row.document_json);
  } catch {
    throw new ApiError(500, "进化树数据损坏", "TREE_DATA_CORRUPT");
  }
  return {
    ...treeSummary(row),
    document,
    referencesText: row.references_text || "",
    imageCreditsText: row.image_credits_text || "",
    contributors,
  };
}

export async function loadPublishedTree(
  DB,
  id,
  { includeDeleted = false, viewerId = null } = {},
) {
  const publicId = parsePublicId("tree", id);
  const selector = publicId ? "published_trees.public_id = ?" : "published_trees.id = ?";
  const row = await DB.prepare(
    `SELECT published_trees.*, users.display_name AS creator_name,
            users.public_id AS creator_public_id,
            users.role AS creator_role,
            users.avatar_media_hash AS creator_avatar_hash,
            source_tree.public_id AS source_public_id,
            source_tree.title AS source_title,
            source_user.display_name AS source_creator_name,
            source_user.public_id AS source_creator_public_id,
            (SELECT COUNT(*) FROM tree_forks
              WHERE tree_forks.source_tree_id = published_trees.id) AS fork_count,
            (SELECT COUNT(*) FROM tree_contributions
              WHERE tree_contributions.target_tree_id = published_trees.id
                AND tree_contributions.status = 'APPROVED') AS approved_contribution_count
       FROM published_trees
       JOIN users ON users.id = published_trees.creator_id
       LEFT JOIN published_trees AS source_tree
         ON source_tree.id = published_trees.forked_from_tree_id
       LEFT JOIN users AS source_user ON source_user.id = source_tree.creator_id
      WHERE ${selector}
        ${includeDeleted ? "" : "AND published_trees.deleted_at IS NULL"}
        ${includeDeleted ? "" : "AND (published_trees.visibility = 'PUBLIC' OR published_trees.creator_id = ?)"}`,
  ).bind(...(includeDeleted ? [publicId || id] : [publicId || id, viewerId || ""])).first();
  if (!row) return null;
  const contributorRows = await DB.prepare(
    `SELECT DISTINCT users.display_name, users.public_id, users.avatar_media_hash
       FROM tree_contributions
       JOIN users ON users.id = tree_contributions.contributor_id
      WHERE tree_contributions.target_tree_id = ?
        AND tree_contributions.status = 'APPROVED'
      ORDER BY tree_contributions.reviewed_at DESC
      LIMIT 30`,
  ).bind(row.id).all();
  const contributors = (contributorRows.results || []).map((contributor) => ({
    uid: formatPublicId("user", contributor.public_id),
    name: contributor.display_name,
    avatarUrl: contributor.avatar_media_hash ? mediaUrl(contributor.avatar_media_hash) : "",
  }));
  return treeDetail(row, contributors);
}
