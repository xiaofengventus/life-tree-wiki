import { ApiError } from "./http.js";
import { mediaUrl } from "./media.js";
import { formatPublicId } from "./publicIds.js";
import { postSummary } from "./posts.js";
import { treeSummary } from "./trees.js";

export const COLLECTION_TARGET_TYPES = Object.freeze(["POST", "TREE"]);
export const PUBLIC_VISIBILITY = "PUBLIC";
export const PRIVATE_VISIBILITY = "PRIVATE";
export const COLLECTION_TITLE_MAX = 80;
export const COLLECTION_DESCRIPTION_MAX = 500;
/** 单个合集最多收录多少条；同时也是后端按顺序写回时的安全上限 */
export const COLLECTION_ITEM_LIMIT = 200;
/** 每个用户最多建多少个合集，同时用作列表接口的返回上限 */
export const COLLECTION_LIMIT = 50;

export function normalizeCollectionVisibility(value, fallback = PUBLIC_VISIBILITY) {
  const visibility = String(value ?? fallback).toUpperCase();
  if (visibility !== PUBLIC_VISIBILITY && visibility !== PRIVATE_VISIBILITY) {
    throw new ApiError(400, "合集的可见范围无效", "INVALID_VISIBILITY");
  }
  return visibility;
}

export function normalizeCollectionTargetType(value) {
  const targetType = String(value || "").trim().toUpperCase();
  if (!COLLECTION_TARGET_TYPES.includes(targetType)) {
    throw new ApiError(400, "合集条目类型无效", "INVALID_COLLECTION_TARGET");
  }
  return targetType;
}

// 展示时按可见性过滤：站内访客只看到公开作品，作者本人看到全部。
// 条目本身始终保留，作品转为私密或删除都不会连带删掉条目。
const POST_ITEM_SELECT = `SELECT posts.id, posts.public_id, posts.creator_id, posts.title,
    posts.author, posts.cover_media_hash, posts.type, posts.visibility,
    substr(posts.content_text, 1, 240) AS excerpt, posts.tags_json,
    posts.classification_card_json, posts.license, posts.revision_count,
    posts.change_note, posts.version, posts.created_at, posts.updated_at,
    users.display_name AS creator_name, users.public_id AS creator_public_id,
    users.avatar_media_hash AS creator_avatar_hash,
    collection_items.sort_order AS collection_sort_order
   FROM collection_items
   JOIN posts ON posts.id = collection_items.target_id
   JOIN users ON users.id = posts.creator_id`;

const TREE_ITEM_SELECT = `SELECT published_trees.*, users.display_name AS creator_name,
    users.public_id AS creator_public_id, users.role AS creator_role,
    users.avatar_media_hash AS creator_avatar_hash,
    source_tree.public_id AS source_public_id, source_tree.title AS source_title,
    source_user.display_name AS source_creator_name,
    source_user.public_id AS source_creator_public_id,
    (SELECT COUNT(*) FROM tree_forks
      WHERE tree_forks.source_tree_id = published_trees.id) AS fork_count,
    (SELECT COUNT(*) FROM tree_contributions
      WHERE tree_contributions.target_tree_id = published_trees.id
        AND tree_contributions.status = 'APPROVED') AS approved_contribution_count,
    collection_items.sort_order AS collection_sort_order
   FROM collection_items
   JOIN published_trees ON published_trees.id = collection_items.target_id
   JOIN users ON users.id = published_trees.creator_id
   LEFT JOIN published_trees AS source_tree
     ON source_tree.id = published_trees.forked_from_tree_id
   LEFT JOIN users AS source_user ON source_user.id = source_tree.creator_id`;

/**
 * 列表用的条目计数与封面：都按「访客是否就是作者」决定要不要算上私密作品。
 * `itemCountFlagBind` 会出现在 SELECT 里，绑定时必须排在其它参数前面。
 */
const COLLECTION_LIST_SELECT = `SELECT collections.*, users.display_name AS owner_name,
    users.public_id AS owner_public_id,
    users.avatar_media_hash AS owner_avatar_hash,
    (SELECT COUNT(*)
       FROM collection_items
       LEFT JOIN posts
         ON collection_items.target_type = 'POST' AND posts.id = collection_items.target_id
       LEFT JOIN published_trees
         ON collection_items.target_type = 'TREE'
        AND published_trees.id = collection_items.target_id
      WHERE collection_items.collection_id = collections.id
        AND COALESCE(posts.deleted_at, published_trees.deleted_at) IS NULL
        AND (? = 1 OR COALESCE(posts.visibility, published_trees.visibility) = 'PUBLIC')
    ) AS item_count,
    (SELECT posts.cover_media_hash
       FROM collection_items
       JOIN posts ON posts.id = collection_items.target_id
      WHERE collection_items.collection_id = collections.id
        AND collection_items.target_type = 'POST'
        AND posts.deleted_at IS NULL
        AND posts.cover_media_hash IS NOT NULL
        AND (? = 1 OR posts.visibility = 'PUBLIC')
      ORDER BY collection_items.sort_order ASC, collection_items.added_at ASC
      LIMIT 1
    ) AS cover_media_hash
   FROM collections
   JOIN users ON users.id = collections.owner_id`;

export function collectionListStatement(DB, { ownerPublicId, includePrivate }) {
  const flag = includePrivate ? 1 : 0;
  return DB.prepare(
    `${COLLECTION_LIST_SELECT}
      WHERE users.public_id = ? AND collections.deleted_at IS NULL
        ${includePrivate ? "" : "AND collections.visibility = 'PUBLIC'"}
      ORDER BY collections.updated_at DESC, collections.id DESC
      LIMIT ?`,
  ).bind(flag, flag, ownerPublicId, COLLECTION_LIMIT);
}

export function collectionSummary(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    visibility: row.visibility || PUBLIC_VISIBILITY,
    isPrivate: row.visibility === PRIVATE_VISIBILITY,
    itemCount: Number(row.item_count || 0),
    coverUrl: row.cover_media_hash ? mediaUrl(row.cover_media_hash) : "",
    ownerUid: formatPublicId("user", row.owner_public_id),
    ownerName: row.owner_name || "",
    ownerAvatarUrl: row.owner_avatar_hash ? mediaUrl(row.owner_avatar_hash) : "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadCollectionRow(DB, id) {
  return DB.prepare(
    `SELECT collections.*, users.display_name AS owner_name,
            users.public_id AS owner_public_id,
            users.avatar_media_hash AS owner_avatar_hash
       FROM collections
       JOIN users ON users.id = collections.owner_id
      WHERE collections.id = ? AND collections.deleted_at IS NULL`,
  )
    .bind(id)
    .first();
}

/** 合集必须存在且属于该用户，否则抛错。管理类接口统一走这里。 */
export async function requireCollectionOwner(DB, userId, collectionId) {
  const row = await loadCollectionRow(DB, collectionId);
  if (!row) throw new ApiError(404, "合集不存在", "COLLECTION_NOT_FOUND");
  if (row.owner_id !== userId) {
    throw new ApiError(403, "只能管理自己的合集", "COLLECTION_NOT_OWNED");
  }
  return row;
}

/**
 * 读取合集条目，按 sort_order 合并成一条有序列表。
 * 每条形如 { targetType, targetId, sortOrder, post | tree }。
 */
export async function loadCollectionItems(DB, collectionId, { includePrivate = false } = {}) {
  const privacyClause = includePrivate
    ? ""
    : "AND posts.visibility = 'PUBLIC'";
  const treePrivacyClause = includePrivate
    ? ""
    : "AND published_trees.visibility = 'PUBLIC'";
  const [postResult, treeResult] = await DB.batch([
    DB.prepare(
      `${POST_ITEM_SELECT}
        WHERE collection_items.collection_id = ?
          AND collection_items.target_type = 'POST'
          AND posts.deleted_at IS NULL
          ${privacyClause}
        ORDER BY collection_items.sort_order ASC, collection_items.added_at ASC`,
    ).bind(collectionId),
    DB.prepare(
      `${TREE_ITEM_SELECT}
        WHERE collection_items.collection_id = ?
          AND collection_items.target_type = 'TREE'
          AND published_trees.deleted_at IS NULL
          ${treePrivacyClause}
        ORDER BY collection_items.sort_order ASC, collection_items.added_at ASC`,
    ).bind(collectionId),
  ]);
  const entries = [
    ...(postResult.results || []).map((row) => ({
      targetType: "POST",
      targetId: row.id,
      sortOrder: Number(row.collection_sort_order || 0),
      post: postSummary(row),
    })),
    ...(treeResult.results || []).map((row) => ({
      targetType: "TREE",
      targetId: row.id,
      sortOrder: Number(row.collection_sort_order || 0),
      tree: treeSummary(row),
    })),
  ];
  return entries.sort((first, second) => first.sortOrder - second.sortOrder);
}

/**
 * 校验一组工作品确实是该用户创建的（合集只收录作者自己的作品）。
 * 返回规范化后的 [{ targetType, targetId }]，重复项已去掉。
 */
export async function requireOwnedTargets(DB, ownerId, targets) {
  const normalized = [];
  const seen = new Set();
  for (const target of targets) {
    const targetType = normalizeCollectionTargetType(target?.targetType);
    const targetId = String(target?.targetId || "").trim();
    if (!targetId) {
      throw new ApiError(400, "合集条目缺少作品标识", "INVALID_COLLECTION_TARGET");
    }
    const key = `${targetType}:${targetId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({ targetType, targetId });
  }
  if (!normalized.length) return [];
  if (normalized.length > COLLECTION_ITEM_LIMIT) {
    throw new ApiError(409, `单个合集最多收录 ${COLLECTION_ITEM_LIMIT} 条`, "COLLECTION_ITEM_LIMIT");
  }

  const postIds = normalized.filter((item) => item.targetType === "POST").map((item) => item.targetId);
  const treeIds = normalized.filter((item) => item.targetType === "TREE").map((item) => item.targetId);
  const owned = new Set();
  const statements = [];
  if (postIds.length) {
    statements.push(
      DB.prepare(
        `SELECT id FROM posts
          WHERE creator_id = ? AND deleted_at IS NULL
            AND id IN (${postIds.map(() => "?").join(", ")})`,
      ).bind(ownerId, ...postIds),
    );
  }
  if (treeIds.length) {
    statements.push(
      DB.prepare(
        `SELECT id FROM published_trees
          WHERE creator_id = ? AND deleted_at IS NULL
            AND id IN (${treeIds.map(() => "?").join(", ")})`,
      ).bind(ownerId, ...treeIds),
    );
  }
  const results = await DB.batch(statements);
  for (const result of results) {
    for (const row of result.results || []) owned.add(row.id);
  }
  const rejected = normalized.filter((item) => !owned.has(item.targetId));
  if (rejected.length) {
    throw new ApiError(403, "只能把你自己创建的作品加入合集", "COLLECTION_TARGET_NOT_OWNED");
  }
  return normalized;
}

/** 按给定顺序重写 sort_order，未出现在列表里的条目顺序保持不变（排在末尾）。 */
export function reorderStatements(DB, collectionId, orderedKeys, remainingKeys) {
  const statements = [];
  [...orderedKeys, ...remainingKeys].forEach((key, index) => {
    const [targetType, targetId] = key.split("\u0000");
    statements.push(
      DB.prepare(
        `UPDATE collection_items SET sort_order = ?
          WHERE collection_id = ? AND target_type = ? AND target_id = ?`,
      ).bind(index, collectionId, targetType, targetId),
    );
  });
  return statements;
}
