import { formatPublicId, parsePublicId } from "./publicIds.js";
import { mediaUrl } from "./media.js";
import { parseClassificationCards } from "./classificationCards.js";
import { parseCitations } from "./citations.js";

export function parseTags(value) {
  try {
    const tags = JSON.parse(value || "[]");
    return Array.isArray(tags) ? tags : [];
  } catch {
    return [];
  }
}

// 专栏文章类型：news 新闻 / science 科普；空字符串表示未分类
export const POST_TYPES = new Set(["", "news", "science"]);

export function normalizePostType(value) {
  const candidate = String(value || "").trim().toLowerCase();
  return POST_TYPES.has(candidate) ? candidate : "";
}

// 正文体裁：html = 富文本编辑器（既有文章）；laup = Laup 源码（服务端重渲）。
export const CONTENT_FORMATS = new Set(["html", "laup"]);

export function normalizeContentFormat(value, fallback = "html") {
  const candidate = String(value || "").trim().toLowerCase();
  if (candidate === "laup") return "laup";
  return CONTENT_FORMATS.has(candidate) ? candidate : fallback;
}

export async function ensurePublicPostTitleAvailable(DB, title, excludeId = "") {
  const existing = await DB.prepare(
    `SELECT 1 FROM posts
      WHERE title = ? AND visibility = 'PUBLIC' AND deleted_at IS NULL
        AND id <> ? LIMIT 1`,
  ).bind(title, excludeId).first();
  if (existing) throw new Error("PUBLIC_POST_TITLE_EXISTS");
}

export function postSummary(row) {
  const classificationCards = parseClassificationCards(row.classification_card_json);
  return {
    id: row.id,
    uid: formatPublicId("post", row.public_id),
    title: row.title,
    coverUrl: row.cover_media_hash ? mediaUrl(row.cover_media_hash) : "",
    author: row.author,
    creator: row.creator_name,
    creatorUid: formatPublicId("user", row.creator_public_id),
    creatorAvatarUrl: row.creator_avatar_hash ? mediaUrl(row.creator_avatar_hash) : "",
    excerpt: row.excerpt || "",
    tags: parseTags(row.tags_json),
    type: row.type || "",
    license: row.license,
    submittedAt: row.created_at,
    updatedAt: row.updated_at,
    revisionCount: row.revision_count,
    changeNote: row.change_note,
    visibility: row.visibility || "PUBLIC",
    isPrivate: row.visibility === "PRIVATE",
    classificationCards,
    classificationCard: classificationCards[0] || null,
    version: row.version,
    deletedAt: row.deleted_at || "",
  };
}

export function postDetail(row, revisionRows = []) {
  // content_laup 有值 = 这篇是 Laup 正文（源码是真相）；没有 = 富文本正文。
  const contentType = row.content_laup ? "laup" : "html";
  return {
    ...postSummary({ ...row, excerpt: row.content_text }),
    // 阅读页用的**永远是渲染后的 HTML** —— Laup 正文也已经在服务端重渲过了，
    // 这里不会把源码塞给阅读页。
    content: row.content_html,
    contentType,
    // 只有 Laup 正文才带源码：编辑器靠它回填（Html→Laup 没有反解，不存源码就再也编不回来）。
    contentSource: contentType === "laup" ? row.content_laup : "",
    citations: parseCitations(row.citations_json),
    history: revisionRows.map((revision) => ({
      revisionCount: revision.revision_number,
      submittedAt: revision.created_at,
      title: revision.title,
      note: revision.change_note,
      // 谁改的：贡献者栏与历史列表靠它展示（协作痕迹的核心字段）
      editor: revision.editor_name || "",
      editorUid: revision.editor_public_id
        ? formatPublicId("user", revision.editor_public_id)
        : "",
      editorAvatarUrl: revision.editor_avatar_hash ? mediaUrl(revision.editor_avatar_hash) : "",
    })),
  };
}

export async function loadPost(
  DB,
  id,
  { includeDeleted = false, viewerId = null } = {},
) {
  const publicId = parsePublicId("post", id);
  const selector = publicId ? "posts.public_id = ?" : "posts.id = ?";
  const row = await DB.prepare(
    `SELECT posts.*, users.display_name AS creator_name,
            users.public_id AS creator_public_id,
            users.avatar_media_hash AS creator_avatar_hash
       FROM posts JOIN users ON users.id = posts.creator_id
      WHERE ${selector}
        ${includeDeleted ? "" : "AND posts.deleted_at IS NULL"}
        ${includeDeleted ? "" : "AND (posts.visibility = 'PUBLIC' OR posts.creator_id = ?)"}`,
  )
    .bind(...(includeDeleted ? [publicId || id] : [publicId || id, viewerId || ""]))
    .first();
  if (!row) return null;
  const revisions = await DB.prepare(
    `SELECT r.revision_number, r.title, r.change_note, r.created_at,
            u.display_name AS editor_name, u.public_id AS editor_public_id,
            u.avatar_media_hash AS editor_avatar_hash
       FROM post_revisions r LEFT JOIN users u ON u.id = r.created_by
      WHERE r.post_id = ? ORDER BY r.revision_number ASC`,
  )
    .bind(row.id)
    .all();
  return postDetail(row, revisions.results || []);
}
