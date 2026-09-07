import { requireSiteOwner, requireUser } from "../../../server/auth.js";
import { randomToken, sha256 } from "../../../server/crypto.js";
import { ApiError, json, readJson, withApi } from "../../../server/http.js";
import { enforceRateLimit } from "../../../server/rateLimit.js";

export const onRequestGet = withApi(async ({ request, env }) => {
  const user = await requireUser(env.DB, request);
  requireSiteOwner(user);
  const result = await env.DB.prepare(
    `SELECT id, created_at, expires_at, used_at, used_by
       FROM registration_invites ORDER BY created_at DESC LIMIT 100`,
  ).all();
  return json({ success: true, invitations: result.results || [] });
});

export const onRequestPost = withApi(async ({ request, env }) => {
  const user = await requireUser(env.DB, request);
  requireSiteOwner(user);
  await enforceRateLimit(env.DB, `invite-create:${user.id}`, 10, 60);
  const body = await readJson(request, 8 * 1024);
  const count = Number(body.count || 1);
  const expiresInDays = Number(body.expiresInDays || 30);
  if (!Number.isInteger(count) || count < 1 || count > 50) {
    throw new ApiError(400, "一次只能生成 1 到 50 个邀请码", "INVALID_COUNT");
  }
  if (!Number.isFinite(expiresInDays) || expiresInDays < 1 || expiresInDays > 365) {
    throw new ApiError(400, "邀请码有效期必须为 1 到 365 天", "INVALID_EXPIRY");
  }

  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + expiresInDays * 86400000).toISOString();
  const codes = [];
  const statements = [];
  for (let index = 0; index < count; index += 1) {
    const code = `LIFE-${randomToken(18)}`;
    codes.push(code);
    statements.push(
      env.DB.prepare(
        `INSERT INTO registration_invites
          (id, code_hash, created_by, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        await sha256(`${env.INVITE_PEPPER || ""}:${code.toUpperCase()}`),
        user.id,
        createdAt,
        expiresAt,
      ),
    );
  }
  await env.DB.batch(statements);
  return json({ success: true, codes, expiresAt });
});
