import { getCurrentUser, requireUser } from "../../../../server/auth.js";
import { ApiError, json, readJson, withApi } from "../../../../server/http.js";
import { resolveContentTarget } from "../../../../server/social.js";
import { enforceRateLimit, requestIp } from "../../../../server/rateLimit.js";

async function interactionState(DB, target, userId = null) {
  const [likes, favorites, comments, stats, viewerLike, viewerFavorite] = await Promise.all([
    DB.prepare("SELECT COUNT(*) AS count FROM content_likes WHERE target_type = ? AND target_id = ?")
      .bind(target.type, target.id).first(),
    DB.prepare("SELECT COUNT(*) AS count FROM content_favorites WHERE target_type = ? AND target_id = ?")
      .bind(target.type, target.id).first(),
    DB.prepare("SELECT COUNT(*) AS count FROM content_comments WHERE target_type = ? AND target_id = ? AND deleted_at IS NULL")
      .bind(target.type, target.id).first(),
    DB.prepare("SELECT view_count FROM content_stats WHERE target_type = ? AND target_id = ?")
      .bind(target.type, target.id).first(),
    userId
      ? DB.prepare("SELECT 1 AS active FROM content_likes WHERE target_type = ? AND target_id = ? AND user_id = ?")
          .bind(target.type, target.id, userId).first()
      : null,
    userId
      ? DB.prepare("SELECT 1 AS active FROM content_favorites WHERE target_type = ? AND target_id = ? AND user_id = ?")
          .bind(target.type, target.id, userId).first()
      : null,
  ]);
  return {
    likes: Number(likes?.count || 0),
    favorites: Number(favorites?.count || 0),
    comments: Number(comments?.count || 0),
    views: Number(stats?.view_count || 0),
    liked: Boolean(viewerLike),
    favorited: Boolean(viewerFavorite),
  };
}

export const onRequestGet = withApi(async ({ request, params, env }) => {
  const target = await resolveContentTarget(env.DB, params.type, params.id);
  const user = await getCurrentUser(env.DB, request);
  return json({ success: true, state: await interactionState(env.DB, target, user?.id) });
});

export const onRequestPost = withApi(async ({ request, params, env }) => {
  const target = await resolveContentTarget(env.DB, params.type, params.id);
  const body = await readJson(request, 4 * 1024);
  const action = String(body.action || "").toUpperCase();
  const now = new Date().toISOString();

  if (action === "VIEW") {
    await enforceRateLimit(env.DB, `content-view:${requestIp(request)}`, 120, 60 * 60);
    await env.DB.prepare(
      `INSERT INTO content_stats (target_type, target_id, view_count, updated_at)
       VALUES (?, ?, 1, ?)
       ON CONFLICT(target_type, target_id) DO UPDATE SET
         view_count = content_stats.view_count + 1,
         updated_at = excluded.updated_at`,
    ).bind(target.type, target.id, now).run();
    return json({ success: true, state: await interactionState(env.DB, target) });
  }

  if (!["LIKE", "FAVORITE"].includes(action)) {
    throw new ApiError(400, "互动操作无效", "INVALID_INTERACTION");
  }
  const user = await requireUser(env.DB, request);
  await enforceRateLimit(env.DB, `content-interaction:${user.id}`, 120, 60 * 60);
  const active = body.active === true;
  const table = action === "LIKE" ? "content_likes" : "content_favorites";
  if (active) {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO ${table}
        (target_type, target_id, user_id, created_at) VALUES (?, ?, ?, ?)`,
    ).bind(target.type, target.id, user.id, now).run();
  } else {
    await env.DB.prepare(
      `DELETE FROM ${table} WHERE target_type = ? AND target_id = ? AND user_id = ?`,
    ).bind(target.type, target.id, user.id).run();
  }
  return json({ success: true, state: await interactionState(env.DB, target, user.id) });
});
