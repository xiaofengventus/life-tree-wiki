import { requireUser } from "../../../server/auth.js";
import { ApiError, json, withApi } from "../../../server/http.js";
import { enforceRateLimit } from "../../../server/rateLimit.js";
import { validMediaHash } from "../../../server/media.js";

export const onRequestDelete = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  if (!env.MEDIA) throw new ApiError(503, "R2 图片存储尚未绑定", "MEDIA_NOT_CONFIGURED");
  await enforceRateLimit(env.DB, `media-delete:${user.id}`, 120, 60 * 60);
  const hash = validMediaHash(params.hash);
  if (!hash) throw new ApiError(404, "图片不存在", "MEDIA_NOT_FOUND");

  const asset = await env.DB.prepare(
    `SELECT media_assets.*,
            EXISTS(SELECT 1 FROM media_owners
              WHERE content_hash = media_assets.content_hash AND user_id = ?) AS owned,
            (SELECT COUNT(*) FROM media_owners
              WHERE content_hash = media_assets.content_hash) AS owner_count,
            (SELECT COUNT(*) FROM media_references
              WHERE content_hash = media_assets.content_hash) AS reference_count
       FROM media_assets WHERE content_hash = ?`,
  ).bind(user.id, hash).first();
  if (!asset || !asset.owned) throw new ApiError(404, "图片不存在", "MEDIA_NOT_FOUND");
  if (Number(asset.reference_count || 0) > 0) {
    throw new ApiError(409, "图片仍被文章或进化树使用，不能删除", "MEDIA_IN_USE");
  }
  const selectedForHome = await env.DB.prepare(
    "SELECT 1 AS selected FROM home_gallery_images WHERE content_hash = ?",
  ).bind(hash).first();
  if (selectedForHome) {
    throw new ApiError(409, "图片正在首页画册中使用，请先从画册移除", "MEDIA_IN_HOME_GALLERY");
  }

  const deleteObject = Number(asset.owner_count || 0) <= 1;
  const statements = [
    env.DB.prepare("DELETE FROM media_owners WHERE content_hash = ? AND user_id = ?")
      .bind(hash, user.id),
  ];
  if (deleteObject) {
    statements.push(env.DB.prepare("DELETE FROM media_assets WHERE content_hash = ?").bind(hash));
  }
  await env.DB.batch(statements);
  if (deleteObject) await env.MEDIA.delete(asset.object_key);
  return json({ success: true });
});
