import { ApiError, json, withApi } from "../../../../server/http.js";
import { parsePublicId } from "../../../../server/publicIds.js";
import { publicConnection } from "../../../../server/social.js";

export const onRequestGet = withApi(async ({ params, env }) => {
  const publicId = parsePublicId("user", params.uid);
  if (!publicId) throw new ApiError(404, "用户不存在", "USER_NOT_FOUND");
  const user = await env.DB.prepare(
    "SELECT id FROM users WHERE public_id = ? AND status = 'ACTIVE'",
  ).bind(publicId).first();
  if (!user) throw new ApiError(404, "用户不存在", "USER_NOT_FOUND");
  const [followersResult, followingResult] = await env.DB.batch([
    env.DB.prepare(
      `SELECT users.public_id, users.display_name, users.level, users.avatar_media_hash
         FROM user_follows JOIN users ON users.id = user_follows.follower_id
        WHERE user_follows.followed_id = ? AND users.status = 'ACTIVE'
        ORDER BY user_follows.created_at DESC LIMIT 100`,
    ).bind(user.id),
    env.DB.prepare(
      `SELECT users.public_id, users.display_name, users.level, users.avatar_media_hash
         FROM user_follows JOIN users ON users.id = user_follows.followed_id
        WHERE user_follows.follower_id = ? AND users.status = 'ACTIVE'
        ORDER BY user_follows.created_at DESC LIMIT 100`,
    ).bind(user.id),
  ]);
  return json({
    success: true,
    followers: (followersResult.results || []).map(publicConnection),
    following: (followingResult.results || []).map(publicConnection),
  });
});
