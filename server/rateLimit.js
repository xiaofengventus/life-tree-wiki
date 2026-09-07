import { ApiError } from "./http.js";
import { sha256 } from "./crypto.js";

export async function enforceRateLimit(DB, key, limit, windowSeconds) {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const cutoffIso = new Date(now - windowSeconds * 1000).toISOString();
  const keyHash = await sha256(key);
  const row = await DB.prepare(
    `INSERT INTO request_limits (key_hash, window_started_at, attempts, updated_at)
     VALUES (?, ?, 1, ?)
     ON CONFLICT(key_hash) DO UPDATE SET
       attempts = CASE
         WHEN request_limits.window_started_at < ? THEN 1
         ELSE request_limits.attempts + 1
       END,
       window_started_at = CASE
         WHEN request_limits.window_started_at < ? THEN excluded.window_started_at
         ELSE request_limits.window_started_at
       END,
       updated_at = excluded.updated_at
     RETURNING attempts`,
  )
    .bind(keyHash, nowIso, nowIso, cutoffIso, cutoffIso)
    .first();

  if ((row?.attempts || 1) > limit) {
    throw new ApiError(429, "请求过于频繁，请稍后再试", "RATE_LIMITED");
  }
}

export function requestIp(request) {
  return request.headers.get("cf-connecting-ip") || "local-development";
}
