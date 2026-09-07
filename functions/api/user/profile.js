import { publicUser, requireUser } from "../../../server/auth.js";
import { ApiError, json, readJson, withApi } from "../../../server/http.js";
import { cleanText } from "../../../server/validation.js";
import { validMediaHash } from "../../../server/media.js";

export const onRequestPut = withApi(async ({ request, env }) => {
  const user = await requireUser(env.DB, request);
  const body = await readJson(request, 16 * 1024);
  const displayName = cleanText(body.name, "昵称", { minimum: 1, maximum: 40 });
  const bio = cleanText(body.introduce, "个人简介", { maximum: 500 });
  let avatarHash = user.avatar_media_hash || null;
  if (Object.hasOwn(body, "avatarHash")) {
    avatarHash = body.avatarHash ? validMediaHash(body.avatarHash) : null;
    if (body.avatarHash && !avatarHash) {
      throw new ApiError(400, "头像图片无效", "INVALID_AVATAR");
    }
    if (avatarHash) {
      const owned = await env.DB.prepare(
        "SELECT 1 AS owned FROM media_owners WHERE content_hash = ? AND user_id = ?",
      ).bind(avatarHash, user.id).first();
      if (!owned) throw new ApiError(403, "只能使用自己上传的图片作为头像", "AVATAR_NOT_OWNED");
    }
  }
  const now = new Date().toISOString();
  await env.DB.prepare(
    "UPDATE users SET display_name = ?, bio = ?, avatar_media_hash = ?, updated_at = ? WHERE id = ?",
  )
    .bind(displayName, bio, avatarHash, now, user.id)
    .run();
  const updated = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(user.id).first();
  return json({ success: true, user: publicUser(updated) });
});
