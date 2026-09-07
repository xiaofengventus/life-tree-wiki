import { requireSiteOwner, requireUser } from "../../../../server/auth.js";
import { ApiError, json, withApi } from "../../../../server/http.js";
import { enforceRateLimit } from "../../../../server/rateLimit.js";

export const onRequestDelete = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  requireSiteOwner(user);
  await enforceRateLimit(env.DB, `invite-link-revoke:${user.id}`, 100, 60 * 60);
  const id = String(params.id || "");
  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `UPDATE registration_invite_links SET revoked_at = ?
      WHERE id = ? AND revoked_at IS NULL`,
  ).bind(now, id).run();
  if (Number(result.meta?.changes || 0) !== 1) {
    throw new ApiError(404, "注册链接不存在或已经停用", "INVITE_LINK_NOT_FOUND");
  }
  return json({ success: true, revokedAt: now });
});
