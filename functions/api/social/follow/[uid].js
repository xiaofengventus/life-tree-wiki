import { requireUser } from "../../../../server/auth.js";
import { ApiError, json, readJson, withApi } from "../../../../server/http.js";
import { parsePublicId } from "../../../../server/publicIds.js";
import { enforceRateLimit } from "../../../../server/rateLimit.js";

async function followState(DB, viewerId, targetId) {
  const [followers, following, relation] = await Promise.all([
    DB.prepare("SELECT COUNT(*) AS count FROM user_follows WHERE followed_id = ?").bind(targetId).first(),
    DB.prepare("SELECT COUNT(*) AS count FROM user_follows WHERE follower_id = ?").bind(targetId).first(),
    DB.prepare("SELECT 1 AS active FROM user_follows WHERE follower_id = ? AND followed_id = ?")
      .bind(viewerId, targetId).first(),
  ]);
  return {
    followers: Number(followers?.count || 0),
    following: Number(following?.count || 0),
    isFollowing: Boolean(relation),
  };
}

export const onRequestPost = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  await enforceRateLimit(env.DB, `user-follow:${user.id}`, 120, 60 * 60);
  const publicId = parsePublicId("user", params.uid);
  if (!publicId) throw new ApiError(404, "用户不存在", "USER_NOT_FOUND");
  const target = await env.DB.prepare(
    "SELECT id FROM users WHERE public_id = ? AND status = 'ACTIVE'",
  ).bind(publicId).first();
  if (!target) throw new ApiError(404, "用户不存在", "USER_NOT_FOUND");
  if (target.id === user.id) throw new ApiError(400, "不能关注自己", "CANNOT_FOLLOW_SELF");
  const body = await readJson(request, 2 * 1024);
  if (body.following === true) {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO user_follows (follower_id, followed_id, created_at) VALUES (?, ?, ?)",
    ).bind(user.id, target.id, new Date().toISOString()).run();
  } else {
    await env.DB.prepare("DELETE FROM user_follows WHERE follower_id = ? AND followed_id = ?")
      .bind(user.id, target.id).run();
  }
  return json({ success: true, state: await followState(env.DB, user.id, target.id) });
});
