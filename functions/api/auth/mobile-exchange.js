import { createSession, publicUser } from "../../../server/auth.js";
import { sha256 } from "../../../server/crypto.js";
import { ApiError, json, readJson, withApi } from "../../../server/http.js";

export const onRequestPost = withApi(async ({ request, env }) => {
  const body = await readJson(request, 4 * 1024);
  const code = String(body.code || "");
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(code)) {
    throw new ApiError(400, "移动端登录凭据无效", "INVALID_MOBILE_HANDOFF");
  }

  const now = new Date().toISOString();
  const codeHash = await sha256(code);
  const handoff = await env.DB.prepare(
    `SELECT user_id FROM mobile_auth_handoffs
      WHERE code_hash = ? AND used_at IS NULL AND expires_at > ?`,
  ).bind(codeHash, now).first();
  if (!handoff) {
    throw new ApiError(401, "移动端登录凭据已失效，请重新登录", "MOBILE_HANDOFF_EXPIRED");
  }

  const consumed = await env.DB.prepare(
    `UPDATE mobile_auth_handoffs SET used_at = ?
      WHERE code_hash = ? AND used_at IS NULL AND expires_at > ?`,
  ).bind(now, codeHash, now).run();
  if (Number(consumed.meta?.changes || 0) !== 1) {
    throw new ApiError(401, "移动端登录凭据已失效，请重新登录", "MOBILE_HANDOFF_EXPIRED");
  }

  const user = await env.DB.prepare(
    "SELECT * FROM users WHERE id = ? AND status = 'ACTIVE'",
  ).bind(handoff.user_id).first();
  if (!user) throw new ApiError(401, "账号不可用", "AUTH_REQUIRED");

  const session = await createSession(env.DB, user.id, request, {
    secure: env.ALLOW_INSECURE_DEV !== "true",
  });
  return json({
    success: true,
    user: publicUser(user),
    sessionToken: session.rawToken,
    expiresAt: session.expiresAt,
  });
});
