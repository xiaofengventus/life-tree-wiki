import { getCurrentUser, requireUser } from "../../../server/auth.js";
import { ApiError, json, readJson, withApi } from "../../../server/http.js";
import { cleanText } from "../../../server/validation.js";
import {
  COLLECTION_DESCRIPTION_MAX,
  COLLECTION_TITLE_MAX,
  PRIVATE_VISIBILITY,
  collectionSummary,
  loadCollectionItems,
  loadCollectionRow,
  normalizeCollectionVisibility,
  requireCollectionOwner,
} from "../../../server/collections.js";

async function requireOwnedCollection(env, request, id) {
  const user = await requireUser(env.DB, request);
  return { row: await requireCollectionOwner(env.DB, user.id, id), user };
}

export const onRequestGet = withApi(async ({ request, params, env }) => {
  const row = await loadCollectionRow(env.DB, params.id);
  if (!row) throw new ApiError(404, "合集不存在", "COLLECTION_NOT_FOUND");
  const viewer = await getCurrentUser(env.DB, request);
  const isOwner = Boolean(viewer && viewer.id === row.owner_id);
  // 私密合集对外一律装作不存在，避免泄露存在性
  if (row.visibility === PRIVATE_VISIBILITY && !isOwner) {
    throw new ApiError(404, "合集不存在", "COLLECTION_NOT_FOUND");
  }
  const items = await loadCollectionItems(env.DB, row.id, { includePrivate: isOwner });
  return json({
    success: true,
    collection: {
      ...collectionSummary({ ...row, item_count: items.length }),
      isOwner,
    },
    items,
  });
});

export const onRequestPatch = withApi(async ({ request, params, env }) => {
  const { row } = await requireOwnedCollection(env, request, params.id);
  const body = await readJson(request, 16 * 1024);
  const title = Object.hasOwn(body, "title")
    ? cleanText(body.title, "合集名称", { minimum: 1, maximum: COLLECTION_TITLE_MAX })
    : row.title;
  const description = Object.hasOwn(body, "description")
    ? cleanText(body.description ?? "", "合集简介", { maximum: COLLECTION_DESCRIPTION_MAX })
    : row.description;
  const visibility = Object.hasOwn(body, "visibility")
    ? normalizeCollectionVisibility(body.visibility)
    : row.visibility;
  const now = new Date().toISOString();
  await env.DB.prepare(
    `UPDATE collections
        SET title = ?, description = ?, visibility = ?, updated_at = ?
      WHERE id = ?`,
  )
    .bind(title, description, visibility, now, row.id)
    .run();
  const updated = await loadCollectionRow(env.DB, row.id);
  const items = await loadCollectionItems(env.DB, row.id, { includePrivate: true });
  return json({
    success: true,
    collection: { ...collectionSummary({ ...updated, item_count: items.length }), isOwner: true },
    items,
  });
});

export const onRequestDelete = withApi(async ({ request, params, env }) => {
  const { row } = await requireOwnedCollection(env, request, params.id);
  const now = new Date().toISOString();
  await env.DB.prepare(
    "UPDATE collections SET deleted_at = ?, updated_at = ? WHERE id = ?",
  )
    .bind(now, now, row.id)
    .run();
  return json({ success: true });
});
