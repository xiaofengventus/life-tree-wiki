import { requireUser } from "../../../server/auth.js";
import { randomToken, sha256 } from "../../../server/crypto.js";
import { ApiError, json, readJson, withApi } from "../../../server/http.js";
import { enforceRateLimit } from "../../../server/rateLimit.js";

export const onRequestPost = withApi(async ({ request, env }) => {
  const user = await requireUser(env.DB, request);
  await readJson(request, 4 * 1024);
  await enforceRateLimit(env.DB, `mobile-handoff:${user.id}`, 20, 10 * 60);

  const code = randomToken(32);
  const codeHash = await sha256(code);
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 60 * 1000).toISOString();

  await env.DB.batch([
    env.DB.prepare("DELETE FROM mobile_auth_handoffs WHERE expires_at <= ? OR used_at IS NOT NULL")
      .bind(createdAt.toISOString()),
    env.DB.prepare(
      `INSERT INTO mobile_auth_handoffs (code_hash, user_id, expires_at, created_at)
       VALUES (?, ?, ?, ?)`,
    ).bind(codeHash, user.id, expiresAt, createdAt.toISOString()),
  ]);

  return json({ success: true, code, expiresAt });
});
