import { getCurrentUser, requireUser } from "../../../server/auth.js";
import { ApiError, json, readJson, withApi } from "../../../server/http.js";
import { parsePublicId } from "../../../server/publicIds.js";
import { enforceRateLimit } from "../../../server/rateLimit.js";
import { cleanText } from "../../../server/validation.js";
import {
  COLLECTION_DESCRIPTION_MAX,
  COLLECTION_LIMIT,
  COLLECTION_TITLE_MAX,
  collectionListStatement,
  collectionSummary,
  loadCollectionRow,
  normalizeCollectionVisibility,
} from "../../../server/collections.js";

export const onRequestGet = withApi(async ({ request, env }) => {
  const url = new URL(request.url);
  const viewer = await getCurrentUser(env.DB, request);
  const requestedUid = url.searchParams.get("uid");

  let ownerPublicId;
  if (requestedUid) {
    ownerPublicId = parsePublicId("user", requestedUid);
    if (!ownerPublicId) throw new ApiError(404, "用户不存在", "USER_NOT_FOUND");
  } else {
    const me = await requireUser(env.DB, request);
    ownerPublicId = Number(me.public_id);
  }
  // 只有作者本人能看到自己的私密合集和私密条目
  const includePrivate = Boolean(viewer && Number(viewer.public_id) === ownerPublicId);
  const result = await collectionListStatement(env.DB, {
    ownerPublicId,
    includePrivate,
  }).all();
  return json({
    success: true,
    collections: (result.results || []).map(collectionSummary),
  });
});

export const onRequestPost = withApi(async ({ request, env }) => {
  const user = await requireUser(env.DB, request);
  await enforceRateLimit(env.DB, `collection-create:${user.id}`, 10, 60);
  const body = await readJson(request, 16 * 1024);
  const title = cleanText(body.title, "合集名称", {
    minimum: 1,
    maximum: COLLECTION_TITLE_MAX,
  });
  const description = cleanText(body.description ?? "", "合集简介", {
    maximum: COLLECTION_DESCRIPTION_MAX,
  });
  const visibility = normalizeCollectionVisibility(body.visibility);

  const existing = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM collections WHERE owner_id = ? AND deleted_at IS NULL",
  )
    .bind(user.id)
    .first();
  if (Number(existing?.count || 0) >= COLLECTION_LIMIT) {
    throw new ApiError(
      409,
      `最多只能创建 ${COLLECTION_LIMIT} 个合集`,
      "COLLECTION_LIMIT_REACHED",
    );
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO collections (id, owner_id, title, description, visibility, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, user.id, title, description, visibility, now, now)
    .run();

  const row = await loadCollectionRow(env.DB, id);
  return json(
    { success: true, collection: collectionSummary({ ...row, item_count: 0 }) },
    { status: 201 },
  );
});
