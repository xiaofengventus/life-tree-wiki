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
  return {
    ...postSummary({ ...row, excerpt: row.content_text }),
    content: row.content_html,
    contentType: "html",
    citations: parseCitations(row.citations_json),
    history: revisionRows.map((revision) => ({
      revisionCount: revision.revision_number,
      submittedAt: revision.created_at,
      title: revision.title,
      note: revision.change_note,
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
    `SELECT revision_number, title, change_note, created_at
       FROM post_revisions WHERE post_id = ? ORDER BY revision_number ASC`,
  )
    .bind(row.id)
    .all();
  return postDetail(row, revisions.results || []);
}
