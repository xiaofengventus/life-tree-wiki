import {
  NATIVE_CLIENT_ID,
  createSession,
  publicUser,
} from "../../../server/auth.js";
import { verifyPassword } from "../../../server/crypto.js";
import { ApiError, json, readJson, withApi } from "../../../server/http.js";
import { enforceRateLimit, requestIp } from "../../../server/rateLimit.js";
import { validateUsername } from "../../../server/validation.js";

const DUMMY_PASSWORD_HASH =
  "pbkdf2_sha256$600000$xr930r_QercHwquqazz7Iw$L1nR1JpEPDHYFmTcD5PzcHuR6YtYieum-KDu2vtQz6M";

// 原生客户端（App）专用密码登录：
// - 仅接受 x-life-client 原生通道，网页端仍走带 Turnstile 的 /api/auth/login；
// - 无法做人机验证，因此用双维严格限流兜底（按 IP + 按用户名）；
// - 与 /api/auth/mobile-exchange 同构：直接返回 sessionToken，不下发 cookie。
export const onRequestPost = withApi(async ({ request, env }) => {
  if (request.headers.get("x-life-client") !== NATIVE_CLIENT_ID) {
    throw new ApiError(403, "此接口仅供原生客户端使用", "NATIVE_CLIENT_ONLY");
  }

  const body = await readJson(request, 4 * 1024);
  const username = validateUsername(body.username);
  const password = String(body.password || "");
  if (!password || password.length > 128) {
    throw new ApiError(401, "用户名或密码错误", "INVALID_CREDENTIALS");
  }

  await enforceRateLimit(env.DB, `mobile-login:${requestIp(request)}`, 10, 15 * 60);
  await enforceRateLimit(env.DB, `mobile-login-u:${username.toLowerCase()}`, 10, 15 * 60);

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
