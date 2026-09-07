import { ApiError, withApi } from "../../server/http.js";
import { validMediaHash } from "../../server/media.js";
import { getCurrentUser } from "../../server/auth.js";

export const onRequestGet = withApi(async ({ request, params, env }) => {
  if (!env.DB || !env.MEDIA) throw new ApiError(503, "图片存储尚未配置", "MEDIA_NOT_CONFIGURED");
  const hash = validMediaHash(params.hash);
  if (!hash) throw new ApiError(404, "图片不存在", "MEDIA_NOT_FOUND");
  const asset = await env.DB.prepare(
    `SELECT media_assets.object_key, media_assets.mime_type,
            EXISTS (
              SELECT 1 FROM media_references
              JOIN posts ON posts.id = media_references.entity_id
              WHERE media_references.content_hash = media_assets.content_hash
                AND media_references.entity_type = 'POST'
                AND posts.visibility = 'PUBLIC' AND posts.deleted_at IS NULL
            ) AS has_public_post,
            EXISTS (
              SELECT 1 FROM media_references
              JOIN published_trees ON published_trees.id = media_references.entity_id
              WHERE media_references.content_hash = media_assets.content_hash
                AND media_references.entity_type = 'TREE'
                AND published_trees.visibility = 'PUBLIC'
                AND published_trees.deleted_at IS NULL
            ) AS has_public_tree,
            EXISTS (
              SELECT 1 FROM users
              WHERE users.avatar_media_hash = media_assets.content_hash
                AND users.status = 'ACTIVE'
            ) AS is_public_avatar,
            EXISTS (
              SELECT 1 FROM home_gallery_images
              WHERE home_gallery_images.content_hash = media_assets.content_hash
            ) AS is_home_gallery
       FROM media_assets
      WHERE media_assets.content_hash = ?`,
  ).bind(hash).first();
  if (!asset) throw new ApiError(404, "图片不存在", "MEDIA_NOT_FOUND");
  const isPublic = Boolean(
    asset.has_public_post ||
    asset.has_public_tree ||
    asset.is_public_avatar ||
    asset.is_home_gallery,
  );
  if (!isPublic) {
    const viewer = await getCurrentUser(env.DB, request);
    if (!viewer) throw new ApiError(404, "图片不存在", "MEDIA_NOT_FOUND");
    const access = await env.DB.prepare(
      `SELECT
        EXISTS (
          SELECT 1 FROM media_owners
          WHERE media_owners.content_hash = ? AND media_owners.user_id = ?
        )
        OR EXISTS (
          SELECT 1 FROM media_references
          JOIN posts ON posts.id = media_references.entity_id
          WHERE media_references.content_hash = ?
            AND media_references.entity_type = 'POST'
            AND posts.creator_id = ? AND posts.visibility = 'PRIVATE'
            AND posts.deleted_at IS NULL
        )
        OR EXISTS (
          SELECT 1 FROM media_references
          JOIN published_trees ON published_trees.id = media_references.entity_id
          WHERE media_references.content_hash = ?
            AND media_references.entity_type = 'TREE'
            AND published_trees.creator_id = ?
            AND published_trees.visibility = 'PRIVATE'
            AND published_trees.deleted_at IS NULL
        ) AS allowed`,
    ).bind(hash, viewer.id, hash, viewer.id, hash, viewer.id).first();
    if (!access?.allowed) throw new ApiError(404, "图片不存在", "MEDIA_NOT_FOUND");
  }

  const object = await env.MEDIA.get(asset.object_key);
  if (!object) throw new ApiError(404, "图片文件不存在", "MEDIA_OBJECT_NOT_FOUND");
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", asset.mime_type);
  headers.set(
    "Cache-Control",
    isPublic ? "public, max-age=31536000, immutable" : "private, no-store",
  );
  headers.set("ETag", object.httpEtag);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
  if (request.headers.get("if-none-match") === object.httpEtag) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(object.body, { headers });
});
