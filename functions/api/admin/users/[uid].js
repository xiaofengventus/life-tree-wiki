import { requireSiteOwner, requireUser } from "../../../../server/auth.js";
import { ApiError, json, readJson, withApi } from "../../../../server/http.js";
import { parsePublicId } from "../../../../server/publicIds.js";
import { enforceRateLimit } from "../../../../server/rateLimit.js";
import { adminUser } from "../../../../server/users.js";

const ROLES = new Set(["USER", "ADMIN", "COOPERATOR"]);
const STATUSES = new Set(["ACTIVE", "SUSPENDED"]);

export const onRequestPatch = withApi(async ({ request, params, env }) => {
  const administrator = await requireUser(env.DB, request);
  requireSiteOwner(administrator);
  await enforceRateLimit(env.DB, `admin-user-update:${administrator.id}`, 60, 60);

  const publicId = parsePublicId("user", params.uid);
  if (!publicId) throw new ApiError(404, "用户不存在", "USER_NOT_FOUND");
  const target = await env.DB.prepare("SELECT * FROM users WHERE public_id = ?")
    .bind(publicId).first();
  if (!target) throw new ApiError(404, "用户不存在", "USER_NOT_FOUND");

  const body = await readJson(request, 8 * 1024);
  const role = String(body.role || target.role).toUpperCase();
  const status = String(body.status || target.status).toUpperCase();
  const mediaQuotaBytes = body.mediaQuotaMb === undefined
    ? Number(target.media_quota_bytes || 20 * 1024 * 1024)
    : Math.round(Number(body.mediaQuotaMb) * 1024 * 1024);
  if (!ROLES.has(role)) throw new ApiError(400, "用户角色无效", "INVALID_ROLE");
  if (!STATUSES.has(status)) throw new ApiError(400, "账号状态无效", "INVALID_STATUS");
  if (!Number.isSafeInteger(mediaQuotaBytes) || mediaQuotaBytes < 1024 * 1024 || mediaQuotaBytes > 8 * 1024 * 1024 * 1024) {
    throw new ApiError(400, "图片配额必须在 1MB 到 8192MB 之间", "INVALID_MEDIA_QUOTA");
  }
  if (target.id === administrator.id && (role !== target.role || status !== target.status)) {
    throw new ApiError(400, "不能修改自己的管理员角色或账号状态", "SELF_LOCKOUT_BLOCKED");
  }
  if (Number(target.public_id) === 1 && (role !== "ADMIN" || status !== "ACTIVE")) {
    throw new ApiError(
      400,
      "站点所有者必须保持为启用状态的管理员",
      "SITE_OWNER_ROLE_LOCKED",
    );
  }
  const removesActiveAdministrator = target.role === "ADMIN" && target.status === "ACTIVE" &&
    (role !== "ADMIN" || status !== "ACTIVE");

  const now = new Date().toISOString();
  const statements = [
    removesActiveAdministrator
      ? env.DB.prepare(
          `UPDATE users SET role = ?, status = ?, media_quota_bytes = ?, updated_at = ?
            WHERE id = ? AND EXISTS (
              SELECT 1 FROM users AS remaining_admin
               WHERE remaining_admin.id <> ?
                 AND remaining_admin.role = 'ADMIN'
                 AND remaining_admin.status = 'ACTIVE'
            )`,
        ).bind(role, status, mediaQuotaBytes, now, target.id, target.id)
      : env.DB.prepare(
          "UPDATE users SET role = ?, status = ?, media_quota_bytes = ?, updated_at = ? WHERE id = ?",
        ).bind(role, status, mediaQuotaBytes, now, target.id),
  ];
  if (status === "SUSPENDED") {
    statements.push(
      env.DB.prepare(
        `DELETE FROM sessions WHERE user_id = ?
          AND EXISTS (SELECT 1 FROM users WHERE id = ? AND status = 'SUSPENDED')`,
      ).bind(target.id, target.id),
    );
  }
  const results = await env.DB.batch(statements);
  if (Number(results[0]?.meta?.changes || 0) !== 1) {
    throw new ApiError(409, "必须至少保留一名可用管理员", "LAST_ADMIN_REQUIRED");
  }

  const updated = await env.DB.prepare(
    `SELECT users.*,
            (SELECT COUNT(*) FROM posts
              WHERE creator_id = users.id AND deleted_at IS NULL
                AND visibility = 'PUBLIC') AS post_count,
            (SELECT COUNT(*) FROM published_trees
              WHERE creator_id = users.id AND deleted_at IS NULL
                AND visibility = 'PUBLIC') AS tree_count,
            COALESCE((SELECT used_bytes FROM media_user_usage WHERE user_id = users.id), 0) AS media_used_bytes
       FROM users WHERE users.id = ?`,
  ).bind(target.id).first();
  return json({ success: true, user: adminUser(updated) });
});
