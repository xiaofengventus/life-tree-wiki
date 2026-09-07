import { requireUser } from "../../../server/auth.js";
import { ApiError, json, withApi } from "../../../server/http.js";
import {
  MAX_MEDIA_UPLOAD_BYTES,
  globalMediaLimit,
  mediaUrl,
  parseImageDimension,
  sha256Hex,
  sniffImage,
} from "../../../server/media.js";
import { enforceRateLimit } from "../../../server/rateLimit.js";

export const onRequestGet = withApi(async ({ request, env }) => {
  const user = await requireUser(env.DB, request);
  const url = new URL(request.url);
  const requestedPage = Number(url.searchParams.get("page") || 1);
  const page = Number.isInteger(requestedPage) ? Math.max(1, requestedPage) : 1;
  const limit = 60;
  const offset = (page - 1) * limit;
  const [assetsResult, countResult, usageResult] = await env.DB.batch([
    env.DB.prepare(
      `SELECT media_assets.content_hash, media_assets.mime_type, media_assets.byte_size,
              media_assets.width, media_assets.height, media_assets.created_at,
              (SELECT COUNT(*) FROM media_references
                WHERE media_references.content_hash = media_assets.content_hash) AS reference_count,
              EXISTS(SELECT 1 FROM home_gallery_images
                WHERE home_gallery_images.content_hash = media_assets.content_hash) AS home_gallery
         FROM media_owners
         JOIN media_assets ON media_assets.content_hash = media_owners.content_hash
        WHERE media_owners.user_id = ?
        ORDER BY media_owners.created_at DESC LIMIT ? OFFSET ?`,
    ).bind(user.id, limit, offset),
    env.DB.prepare("SELECT COUNT(*) AS count FROM media_owners WHERE user_id = ?").bind(user.id),
    env.DB.prepare(
      `SELECT COALESCE(media_user_usage.used_bytes, 0) AS used_bytes, users.media_quota_bytes
         FROM users LEFT JOIN media_user_usage ON media_user_usage.user_id = users.id
        WHERE users.id = ?`,
    ).bind(user.id),
  ]);
  const total = Number(countResult.results?.[0]?.count || 0);
  return json({
    success: true,
    images: (assetsResult.results || []).map((asset) => ({
      hash: asset.content_hash,
      url: mediaUrl(asset.content_hash),
      mimeType: asset.mime_type,
      bytes: Number(asset.byte_size),
      width: Number(asset.width),
      height: Number(asset.height),
      referenceCount: Number(asset.reference_count || 0),
      homeGallery: Boolean(asset.home_gallery),
      createdAt: asset.created_at,
    })),
    page,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    usage: {
      usedBytes: Number(usageResult.results?.[0]?.used_bytes || 0),
      quotaBytes: Number(usageResult.results?.[0]?.media_quota_bytes || 0),
    },
  });
});

export const onRequestPost = withApi(async ({ request, env }) => {
  const user = await requireUser(env.DB, request);
  if (!env.MEDIA) throw new ApiError(503, "R2 图片存储尚未绑定", "MEDIA_NOT_CONFIGURED");
  await enforceRateLimit(env.DB, `media-upload:${user.id}`, 600, 60 * 60);

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_MEDIA_UPLOAD_BYTES) {
    throw new ApiError(413, "压缩后的单张图片不能超过 2MB", "IMAGE_TOO_LARGE");
  }
  const width = parseImageDimension(request.headers.get("x-image-width"), "图片宽度");
  const height = parseImageDimension(request.headers.get("x-image-height"), "图片高度");
  const buffer = await request.arrayBuffer();
  if (!buffer.byteLength || buffer.byteLength > MAX_MEDIA_UPLOAD_BYTES) {
    throw new ApiError(413, "压缩后的单张图片不能超过 2MB", "IMAGE_TOO_LARGE");
  }
  const bytes = new Uint8Array(buffer);
  const detected = sniffImage(bytes);
  if (detected.width !== width || detected.height !== height) {
    throw new ApiError(400, "图片实际尺寸与上传信息不一致", "IMAGE_DIMENSION_MISMATCH");
  }
  const hash = await sha256Hex(buffer);
  const now = new Date().toISOString();

  const [asset, ownership, usage, globalUsage] = await Promise.all([
    env.DB.prepare("SELECT * FROM media_assets WHERE content_hash = ?").bind(hash).first(),
    env.DB.prepare(
      "SELECT 1 AS owned FROM media_owners WHERE content_hash = ? AND user_id = ?",
    ).bind(hash, user.id).first(),
    env.DB.prepare(
      `SELECT users.media_quota_bytes, COALESCE(media_user_usage.used_bytes, 0) AS used_bytes
         FROM users LEFT JOIN media_user_usage ON media_user_usage.user_id = users.id
        WHERE users.id = ?`,
    ).bind(user.id).first(),
    env.DB.prepare("SELECT used_bytes FROM media_global_usage WHERE id = 1").first(),
  ]);

  const bytesChargedToUser = ownership ? 0 : Number(asset?.byte_size || buffer.byteLength);
  if (Number(usage?.used_bytes || 0) + bytesChargedToUser > Number(usage?.media_quota_bytes || 0)) {
    throw new ApiError(413, "个人图片空间不足，请联系管理员提高配额", "MEDIA_QUOTA_EXCEEDED");
  }
  if (!asset && Number(globalUsage?.used_bytes || 0) + buffer.byteLength > globalMediaLimit(env)) {
    throw new ApiError(507, "全站图片空间已达到安全上限", "GLOBAL_MEDIA_LIMIT_REACHED");
  }

  const objectKey = asset?.object_key || `images/${hash}.${detected.extension}`;
  if (!asset) {
    await env.MEDIA.put(objectKey, buffer, {
      httpMetadata: {
        contentType: detected.mimeType,
        cacheControl: "public, max-age=31536000, immutable",
      },
      customMetadata: { hash, width: String(width), height: String(height) },
    });
  }

  try {
    await env.DB.batch([
      env.DB.prepare(
        `INSERT OR IGNORE INTO media_assets
          (content_hash, object_key, mime_type, byte_size, width, height, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(hash, objectKey, detected.mimeType, buffer.byteLength, width, height, user.id, now),
      env.DB.prepare(
        `INSERT OR IGNORE INTO media_owners (content_hash, user_id, created_at)
         VALUES (?, ?, ?)`,
      ).bind(hash, user.id, now),
    ]);
  } catch (error) {
    if (!asset) {
      const persisted = await env.DB.prepare(
        "SELECT 1 AS present FROM media_assets WHERE content_hash = ?",
      ).bind(hash).first();
      if (!persisted) await env.MEDIA.delete(objectKey);
    }
    throw error;
  }

  const updatedUsage = await env.DB.prepare(
    `SELECT media_user_usage.used_bytes, users.media_quota_bytes
       FROM users JOIN media_user_usage ON media_user_usage.user_id = users.id
      WHERE users.id = ?`,
  ).bind(user.id).first();
  return json({
    success: true,
    image: {
      hash,
      url: mediaUrl(hash),
      mimeType: detected.mimeType,
      bytes: Number(asset?.byte_size || buffer.byteLength),
      width,
      height,
    },
    usage: {
      usedBytes: Number(updatedUsage?.used_bytes || 0),
      quotaBytes: Number(updatedUsage?.media_quota_bytes || 0),
    },
  }, { status: asset && ownership ? 200 : 201 });
});
