import { requireSiteOwner, requireUser } from "../../server/auth.js";
import { ApiError, json, readJson, withApi } from "../../server/http.js";
import { mediaUrl, validMediaHash } from "../../server/media.js";
import { enforceRateLimit } from "../../server/rateLimit.js";

const MAX_HOME_GALLERY_IMAGES = 10;

export const onRequestGet = withApi(async ({ env }) => {
  const result = await env.DB.prepare(
    `SELECT home_gallery_images.slot_number, home_gallery_images.content_hash,
            media_assets.width, media_assets.height
       FROM home_gallery_images
       JOIN media_assets
         ON media_assets.content_hash = home_gallery_images.content_hash
      ORDER BY home_gallery_images.slot_number ASC`,
  ).all();

  return json({
    success: true,
    images: (result.results || []).map((image) => ({
      hash: image.content_hash,
      url: mediaUrl(image.content_hash),
      width: Number(image.width),
      height: Number(image.height),
      position: Number(image.slot_number),
    })),
  });
});

export const onRequestPut = withApi(async ({ request, env }) => {
  const user = await requireUser(env.DB, request);
  requireSiteOwner(user);
  await enforceRateLimit(env.DB, `home-gallery:${user.id}`, 120, 60 * 60);

  const body = await readJson(request, 8 * 1024);
  if (!Array.isArray(body.hashes)) {
    throw new ApiError(400, "首页画册图片格式无效", "INVALID_HOME_GALLERY");
  }
  const hashes = body.hashes.map(validMediaHash);
  if (hashes.some((hash) => !hash) || new Set(hashes).size !== hashes.length) {
    throw new ApiError(400, "首页画册包含无效或重复图片", "INVALID_HOME_GALLERY");
  }
  if (hashes.length > MAX_HOME_GALLERY_IMAGES) {
    throw new ApiError(
      400,
      `首页画册最多选择 ${MAX_HOME_GALLERY_IMAGES} 张图片`,
      "HOME_GALLERY_LIMIT",
    );
  }

  if (hashes.length) {
    const placeholders = hashes.map(() => "?").join(",");
    const owned = await env.DB.prepare(
      `SELECT content_hash
         FROM media_owners
        WHERE user_id = ? AND content_hash IN (${placeholders})`,
    ).bind(user.id, ...hashes).all();
    if ((owned.results || []).length !== hashes.length) {
      throw new ApiError(403, "首页只能使用站点所有者图片库中的图片", "HOME_IMAGE_NOT_OWNED");
    }
  }

  const now = new Date().toISOString();
  const statements = [env.DB.prepare("DELETE FROM home_gallery_images")];
  hashes.forEach((hash, index) => {
    statements.push(
      env.DB.prepare(
        `INSERT INTO home_gallery_images
          (slot_number, content_hash, selected_by, selected_at)
         VALUES (?, ?, ?, ?)`,
      ).bind(index + 1, hash, user.id, now),
    );
  });
  await env.DB.batch(statements);

  return json({ success: true, count: hashes.length });
});
