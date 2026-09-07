import { ApiError } from "./http.js";
import { mediaUrl } from "./media.js";
import { formatPublicId, parsePublicId } from "./publicIds.js";

export function normalizeTargetType(value) {
  const type = String(value || "").toUpperCase();
  if (!new Set(["POST", "TREE"]).has(type)) {
    throw new ApiError(400, "互动对象类型无效", "INVALID_TARGET_TYPE");
  }
  return type;
}

export async function resolveContentTarget(DB, typeValue, identifier) {
  const type = normalizeTargetType(typeValue);
  const id = String(identifier || "");
  const publicId = parsePublicId(type === "POST" ? "post" : "tree", id);
  const table = type === "POST" ? "posts" : "published_trees";
  const row = await DB.prepare(
    `SELECT id, creator_id, title FROM ${table}
      WHERE ${publicId ? "public_id = ?" : "id = ?"}
        AND deleted_at IS NULL
        AND visibility = 'PUBLIC'`,
  ).bind(publicId || id).first();
  if (!row) throw new ApiError(404, type === "POST" ? "文章不存在" : "进化树不存在", "CONTENT_NOT_FOUND");
  return { type, id: row.id, creatorId: row.creator_id, title: row.title };
}

export function publicComment(row) {
  const comment = {
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
    rootId: row.root_id || null,
    replyToId: row.reply_to_id || null,
    creator: {
      uid: formatPublicId("user", row.creator_public_id),
      name: row.creator_name,
      level: Number(row.creator_level || 0),
      avatarUrl: row.avatar_media_hash ? mediaUrl(row.avatar_media_hash) : "",
    },
  };
  if (row.reply_to_public_id) {
    comment.replyTo = {
      uid: formatPublicId("user", row.reply_to_public_id),
      name: row.reply_to_name || "",
    };
  }
  return comment;
}

export function publicConnection(row) {
  return {
    uid: formatPublicId("user", row.public_id),
    name: row.display_name,
    level: Number(row.level || 0),
    avatarUrl: row.avatar_media_hash ? mediaUrl(row.avatar_media_hash) : "",
  };
}
