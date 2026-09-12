import { requireUser } from "../../../../server/auth.js";
import { ApiError, json, readJson, withApi } from "../../../../server/http.js";
import { enforceRateLimit } from "../../../../server/rateLimit.js";
import {
  COLLECTION_ITEM_LIMIT,
  loadCollectionItems,
  normalizeCollectionTargetType,
  reorderStatements,
  requireCollectionOwner,
  requireOwnedTargets,
} from "../../../../server/collections.js";

function itemKey(targetType, targetId) {
  return `${targetType}\u0000${targetId}`;
}

async function respondWithItems(env, collectionId) {
  const items = await loadCollectionItems(env.DB, collectionId, { includePrivate: true });
  return json({ success: true, items });
}

function touchStatement(env, collectionId, now) {
  return env.DB.prepare("UPDATE collections SET updated_at = ? WHERE id = ?").bind(
    now,
    collectionId,
  );
}

export const onRequestPost = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  const collection = await requireCollectionOwner(env.DB, user.id, params.id);
  await enforceRateLimit(env.DB, `collection-item:${user.id}`, 60, 60);
  const body = await readJson(request, 32 * 1024);
  const rawItems = Array.isArray(body.items) ? body.items : [body];
  const targets = await requireOwnedTargets(env.DB, user.id, rawItems);

  const countRow = await env.DB.prepare(
    `SELECT COUNT(*) AS count, COALESCE(MAX(sort_order), -1) AS max_order
       FROM collection_items WHERE collection_id = ?`,
  )
    .bind(collection.id)
    .first();
  const existingCount = Number(countRow?.count || 0);
  if (existingCount + targets.length > COLLECTION_ITEM_LIMIT) {
    throw new ApiError(
      409,
      `单个合集最多收录 ${COLLECTION_ITEM_LIMIT} 条`,
      "COLLECTION_ITEM_LIMIT",
    );
  }

  const now = new Date().toISOString();
  const firstOrder = Number(countRow?.max_order ?? -1) + 1;
  const statements = targets.map((target, index) =>
    env.DB.prepare(
      `INSERT INTO collection_items (collection_id, target_type, target_id, sort_order, added_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(collection_id, target_type, target_id) DO NOTHING`,
    ).bind(collection.id, target.targetType, target.targetId, firstOrder + index, now),
  );
  statements.push(touchStatement(env, collection.id, now));
  await env.DB.batch(statements);
  return respondWithItems(env, collection.id);
});

export const onRequestPatch = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  const collection = await requireCollectionOwner(env.DB, user.id, params.id);
  const body = await readJson(request, 64 * 1024);
  const order = Array.isArray(body.order) ? body.order : [];
  const wantedKeys = order
    .map((entry) => ({
      targetType: normalizeCollectionTargetType(entry?.targetType),
      targetId: String(entry?.targetId || "").trim(),
    }))
    .filter((entry) => entry.targetId)
    .map((entry) => itemKey(entry.targetType, entry.targetId));

  const current = await env.DB.prepare(
    `SELECT target_type, target_id FROM collection_items
      WHERE collection_id = ?
      ORDER BY sort_order ASC, added_at ASC`,
  )
    .bind(collection.id)
    .all();
  const currentKeys = (current.results || []).map((row) =>
    itemKey(row.target_type, row.target_id),
  );
  const currentSet = new Set(currentKeys);
  if (wantedKeys.some((key) => !currentSet.has(key))) {
    throw new ApiError(400, "排序列表里有不属于该合集的条目", "INVALID_COLLECTION_ORDER");
  }

  const now = new Date().toISOString();
  const remainingKeys = currentKeys.filter((key) => !wantedKeys.includes(key));
  const statements = reorderStatements(env.DB, collection.id, wantedKeys, remainingKeys);
  statements.push(touchStatement(env, collection.id, now));
  await env.DB.batch(statements);
  return respondWithItems(env, collection.id);
});

export const onRequestDelete = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  const collection = await requireCollectionOwner(env.DB, user.id, params.id);
  const url = new URL(request.url);
  const targetType = normalizeCollectionTargetType(url.searchParams.get("type"));
  const targetId = String(url.searchParams.get("id") || "").trim();
  if (!targetId) throw new ApiError(400, "缺少作品标识", "INVALID_COLLECTION_TARGET");

  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(
      "DELETE FROM collection_items WHERE collection_id = ? AND target_type = ? AND target_id = ?",
    ).bind(collection.id, targetType, targetId),
    touchStatement(env, collection.id, now),
  ]);
  return respondWithItems(env, collection.id);
});
