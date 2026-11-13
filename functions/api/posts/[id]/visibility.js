import { requireUser } from "../../../../server/auth.js";
import { ApiError, json, readJson, withApi } from "../../../../server/http.js";
import { enforceRateLimit } from "../../../../server/rateLimit.js";
import { loadPost } from "../../../../server/posts.js";
import { parsePublicId } from "../../../../server/publicIds.js";
import {
  PRIVATE_VISIBILITY,
  PUBLIC_VISIBILITY,
  normalizeVisibility,
} from "../../../../server/privateWorks.js";

// PUT /api/posts/:id/visibility —— 只切可见性，不动内容（阅读页「改私有 / 转公开」用）。
// 仅文章作者可操作；私密作品不设槽位上限（2026-10-12 起），转私有无需占位。
export const onRequestPut = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  await enforceRateLimit(env.DB, `post-visibility:${user.id}`, 20, 60);
  const publicId = parsePublicId("post", String(params.id || ""));
  const existing = await env.DB.prepare(
    `SELECT id, public_id, visibility, version, deleted_at
       FROM posts WHERE ${publicId ? "public_id = ?" : "id = ?"} AND deleted_at IS NULL`,
  )
    .bind(publicId || String(params.id || ""))
    .first();
  if (!existing) throw new ApiError(404, "文章不存在", "POST_NOT_FOUND");
  if (existing.creator_id !== user.id) {
    throw new ApiError(403, "只能修改自己文章的可见范围", "FORBIDDEN");
  }

  const body = await readJson(request);
  const visibility = normalizeVisibility(body.visibility, existing.visibility);
  const nextVersion = Number(existing.version || 1) + 1;
  const now = new Date().toISOString();
  const statements = [
    env.DB.prepare(
      `UPDATE posts SET visibility = ?, version = ?, updated_at = ?
        WHERE id = ? AND deleted_at IS NULL`,
    ).bind(visibility, nextVersion, now, existing.id),
  ];
  if (visibility !== (existing.visibility || PUBLIC_VISIBILITY)) {
    // 公开镜像同步：转公开补 UPSERT，转私有发 DELETE 撤下。
    statements.push(
      env.DB.prepare(
        `INSERT INTO sync_events (entity_type, entity_id, operation, version, occurred_at)
         VALUES ('post', ?, ?, ?, ?)`,
      ).bind(
        existing.id,
        visibility === PRIVATE_VISIBILITY ? "DELETE" : "UPSERT",
        nextVersion,
        now,
      ),
    );
  }
  await env.DB.batch(statements);
  return json({
    success: true,
    post: await loadPost(env.DB, existing.id, { viewerId: user.id }),
  });
});
