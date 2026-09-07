import {
  createAuthHintCookie,
  createSession,
  getOrCreateDevice,
  publicUser,
} from "../../../server/auth.js";
import { sha256, verifyPassword } from "../../../server/crypto.js";
import { ApiError, json, readJson, withApi } from "../../../server/http.js";
import { enforceRateLimit, requestIp } from "../../../server/rateLimit.js";
import { verifyTurnstile } from "../../../server/turnstile.js";
import { validateUsername } from "../../../server/validation.js";
import { dailyLoginExperienceStatement } from "../../../server/experience.js";

const DUMMY_PASSWORD_HASH =
  "pbkdf2_sha256$600000$xr930r_QercHwquqazz7Iw$L1nR1JpEPDHYFmTcD5PzcHuR6YtYieum-KDu2vtQz6M";

export const onRequestPost = withApi(async ({ request, env }) => {
  const body = await readJson(request, 16 * 1024);
  const username = validateUsername(body.username);
  const password = String(body.password || "");
  if (!password || password.length > 128) {
    throw new ApiError(401, "用户名或密码错误", "INVALID_CREDENTIALS");
  }

  await verifyTurnstile(env, request, body.turnstileToken);
  await enforceRateLimit(env.DB, `login:${requestIp(request)}`, 30, 10 * 60);

  const user = await env.DB.prepare("SELECT * FROM users WHERE username = ? COLLATE NOCASE")
    .bind(username)
    .first();
  const valid = await verifyPassword(password, user?.password_hash || DUMMY_PASSWORD_HASH);
  if (!user || !valid) {
    throw new ApiError(401, "用户名或密码错误", "INVALID_CREDENTIALS");
  }
  if (user.status === "SUSPENDED") {
    throw new ApiError(403, "账号已被管理员停用", "ACCOUNT_SUSPENDED");
  }

  const device = getOrCreateDevice(request, { secure: env.ALLOW_INSECURE_DEV !== "true" });
  const deviceHash = await sha256(`${env.DEVICE_PEPPER || ""}:${device.id}`);
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO user_devices (device_hash, user_id, first_seen_at, last_seen_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(device_hash) DO UPDATE SET last_seen_at = excluded.last_seen_at`,
  )
    .bind(deviceHash, user.id, now, now)
    .run();
  const session = await createSession(env.DB, user.id, request, {
    secure: env.ALLOW_INSECURE_DEV !== "true",
  });
  await dailyLoginExperienceStatement(env.DB, user.id, now).run();
  const updatedUser = await env.DB.prepare("SELECT * FROM users WHERE id = ?")
    .bind(user.id).first();
  const headers = new Headers();
  headers.append("Set-Cookie", session.setCookie);
  headers.append("Set-Cookie", createAuthHintCookie(env.ALLOW_INSECURE_DEV !== "true"));
  if (device.setCookie) headers.append("Set-Cookie", device.setCookie);
  return json(
    { success: true, user: publicUser(updatedUser), expiresAt: session.expiresAt },
    { headers },
  );
});
