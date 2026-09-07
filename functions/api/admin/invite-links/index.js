import { requireSiteOwner, requireUser } from "../../../../server/auth.js";
import { randomToken, sha256 } from "../../../../server/crypto.js";
import { ApiError, json, readJson, withApi } from "../../../../server/http.js";
import { enforceRateLimit } from "../../../../server/rateLimit.js";
import { cleanText } from "../../../../server/validation.js";

function linkStatus(link, now) {
  if (link.revoked_at) return "REVOKED";
  if (link.expires_at <= now) return "EXPIRED";
  if (Number(link.use_count) >= Number(link.max_uses)) return "FULL";
  return "ACTIVE";
}

function publicLink(link, now) {
  return {
    id: link.id,
    label: link.label,
    createdAt: link.created_at,
    expiresAt: link.expires_at,
    maxUses: Number(link.max_uses),
    useCount: Number(link.use_count),
    remainingUses: Math.max(0, Number(link.max_uses) - Number(link.use_count)),
    lastUsedAt: link.last_used_at,
    revokedAt: link.revoked_at,
    status: linkStatus(link, now),
  };
}

export const onRequestGet = withApi(async ({ request, env }) => {
  const user = await requireUser(env.DB, request);
  requireSiteOwner(user);
  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `SELECT id, label, created_at, expires_at, max_uses, use_count, last_used_at, revoked_at
       FROM registration_invite_links ORDER BY created_at DESC LIMIT 100`,
  ).all();
  return json({
    success: true,
    links: (result.results || []).map((link) => publicLink(link, now)),
  });
});

export const onRequestPost = withApi(async ({ request, env }) => {
  const user = await requireUser(env.DB, request);
  requireSiteOwner(user);
  await enforceRateLimit(env.DB, `invite-link-create:${user.id}`, 10, 60 * 60);
  const body = await readJson(request, 8 * 1024);
  const label = cleanText(body.label || "批量注册链接", "链接名称", {
    minimum: 1,
    maximum: 80,
  });
  const maxUses = Number(body.maxUses ?? 100);
  const expiresInDays = Number(body.expiresInDays ?? 365);
  if (!Number.isInteger(maxUses) || maxUses < 2 || maxUses > 5000) {
    throw new ApiError(400, "注册链接人数上限必须为 2 到 5000", "INVALID_MAX_USES");
  }
  if (!Number.isInteger(expiresInDays) || expiresInDays < 1 || expiresInDays > 3650) {
    throw new ApiError(400, "注册链接有效期必须为 1 到 3650 天", "INVALID_EXPIRY");
  }

  const id = crypto.randomUUID();
  const token = `LIFE-GROUP-${randomToken(24)}`;
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + expiresInDays * 86400000).toISOString();
  const tokenHash = await sha256(`${env.INVITE_PEPPER || ""}:${token.toUpperCase()}`);
  await env.DB.prepare(
    `INSERT INTO registration_invite_links
      (id, token_hash, label, created_by, created_at, expires_at, max_uses)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).bind(id, tokenHash, label, user.id, createdAt, expiresAt, maxUses).run();
  return json({
    success: true,
    token,
    link: publicLink({
      id,
      label,
      created_at: createdAt,
      expires_at: expiresAt,
      max_uses: maxUses,
      use_count: 0,
      last_used_at: null,
      revoked_at: null,
    }, createdAt),
  }, { status: 201 });
});
