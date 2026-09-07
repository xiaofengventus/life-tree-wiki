import { getOrCreateDevice } from "../../../server/auth.js";
import { constantTimeStringEqual, hashPassword, sha256 } from "../../../server/crypto.js";
import { ApiError, json, readJson, withApi } from "../../../server/http.js";
import { enforceRateLimit, requestIp } from "../../../server/rateLimit.js";
import { verifyTurnstile } from "../../../server/turnstile.js";
import { cleanText, validatePassword, validateUsername } from "../../../server/validation.js";

export const onRequestPost = withApi(async ({ request, env }) => {
  const body = await readJson(request, 32 * 1024);
  const username = validateUsername(body.username);
  const password = validatePassword(body.password);
  const displayName = cleanText(body.name, "昵称", { minimum: 1, maximum: 40 });
  const bio = cleanText(body.introduce, "个人简介", { maximum: 500 });
  const inviteCode = cleanText(body.inviteCode, "邀请码", { minimum: 8, maximum: 100 });
  const device = getOrCreateDevice(request, { secure: env.ALLOW_INSECURE_DEV !== "true" });

  await verifyTurnstile(env, request, body.turnstileToken);
  await enforceRateLimit(env.DB, `register:${requestIp(request)}`, 5, 24 * 60 * 60);

  const statistics = await env.DB.prepare("SELECT COUNT(*) AS count FROM users").first();
  const userCount = Number(statistics?.count || 0);
  const maximumUsers = Math.max(1, Number(env.MAX_USERS || 500));
  if (userCount >= maximumUsers) {
    throw new ApiError(403, "注册名额已满", "REGISTRATION_FULL");
  }

  const isBootstrap =
    userCount === 0 &&
    env.BOOTSTRAP_INVITE_CODE &&
    (await constantTimeStringEqual(inviteCode, env.BOOTSTRAP_INVITE_CODE));
  const inviteHash = await sha256(`${env.INVITE_PEPPER || ""}:${inviteCode.toUpperCase()}`);
  let inviteType = null;
  if (!isBootstrap) {
    const checkedAt = new Date().toISOString();
    const [singleInvitation, sharedLink] = await Promise.all([
      env.DB.prepare(
        `SELECT id FROM registration_invites
          WHERE code_hash = ? AND used_at IS NULL
            AND (expires_at IS NULL OR expires_at > ?)`,
      ).bind(inviteHash, checkedAt).first(),
      env.DB.prepare(
        `SELECT id FROM registration_invite_links
          WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ?
            AND use_count < max_uses`,
      ).bind(inviteHash, checkedAt).first(),
    ]);
    inviteType = singleInvitation ? "SINGLE" : sharedLink ? "SHARED" : null;
    if (!inviteType) {
      throw new ApiError(403, "邀请码无效、已使用或已过期", "INVALID_INVITE");
    }
  }

  const now = new Date().toISOString();
  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  const deviceHash = await sha256(`${env.DEVICE_PEPPER || ""}:${device.id}`);
  const role = isBootstrap ? "ADMIN" : "USER";

  const knownDevice = await env.DB.prepare(
    "SELECT user_id FROM user_devices WHERE device_hash = ?",
  )
    .bind(deviceHash)
    .first();
  if (knownDevice) {
    throw new ApiError(409, "这台浏览器设备已经关联过账户", "DEVICE_ALREADY_REGISTERED");
  }

  try {
    if (isBootstrap) {
      await env.DB.batch([
        env.DB.prepare(
          `INSERT INTO users
            (id, username, password_hash, display_name, bio, role, level, device_hash, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(userId, username, passwordHash, displayName, bio, role, 0, deviceHash, now, now),
        env.DB.prepare(
          `INSERT INTO user_devices (device_hash, user_id, first_seen_at, last_seen_at)
           VALUES (?, ?, ?, ?)`,
        ).bind(deviceHash, userId, now, now),
      ]);
    } else if (inviteType === "SINGLE") {
      await env.DB.batch([
        env.DB.prepare(
          `INSERT INTO users
            (id, username, password_hash, display_name, bio, role, level, device_hash, created_at, updated_at)
           SELECT ?, ?, ?, ?, ?, 'USER', 0, ?, ?, ?
            WHERE EXISTS (
              SELECT 1 FROM registration_invites
               WHERE code_hash = ? AND used_at IS NULL
                 AND (expires_at IS NULL OR expires_at > ?)
            )`,
        ).bind(
          userId, username, passwordHash, displayName, bio, deviceHash, now, now,
          inviteHash, now,
        ),
        env.DB.prepare(
          `UPDATE registration_invites
              SET used_at = ?, used_by = ?
            WHERE code_hash = ? AND used_at IS NULL
              AND EXISTS (SELECT 1 FROM users WHERE id = ?)`,
        ).bind(now, userId, inviteHash, userId),
        env.DB.prepare(
          `INSERT INTO user_devices (device_hash, user_id, first_seen_at, last_seen_at)
           SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM users WHERE id = ?)`,
        ).bind(deviceHash, userId, now, now, userId),
      ]);
      const createdUser = await env.DB.prepare("SELECT 1 AS created FROM users WHERE id = ?")
        .bind(userId)
        .first();
      if (!createdUser) {
        throw new ApiError(409, "邀请码刚刚已被使用", "INVITE_ALREADY_USED");
      }
    } else {
      await env.DB.batch([
        env.DB.prepare(
          `INSERT INTO users
            (id, username, password_hash, display_name, bio, role, level, device_hash, created_at, updated_at)
           SELECT ?, ?, ?, ?, ?, 'USER', 0, ?, ?, ?
             FROM registration_invite_links
            WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ?
              AND use_count < max_uses`,
        ).bind(
          userId, username, passwordHash, displayName, bio, deviceHash, now, now,
          inviteHash, now,
        ),
        env.DB.prepare(
          `UPDATE registration_invite_links
              SET use_count = use_count + 1, last_used_at = ?
            WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ?
              AND use_count < max_uses
              AND EXISTS (SELECT 1 FROM users WHERE id = ?)`,
        ).bind(now, inviteHash, now, userId),
        env.DB.prepare(
          `INSERT INTO registration_invite_link_uses (link_id, user_id, used_at)
           SELECT id, ?, ? FROM registration_invite_links
            WHERE token_hash = ? AND EXISTS (SELECT 1 FROM users WHERE id = ?)`,
        ).bind(userId, now, inviteHash, userId),
        env.DB.prepare(
          `INSERT INTO user_devices (device_hash, user_id, first_seen_at, last_seen_at)
           SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM users WHERE id = ?)`,
        ).bind(deviceHash, userId, now, now, userId),
      ]);
      const registration = await env.DB.prepare(
        `SELECT 1 AS created
           FROM users JOIN registration_invite_link_uses
             ON registration_invite_link_uses.user_id = users.id
          WHERE users.id = ?`,
      ).bind(userId).first();
      if (!registration) {
        throw new ApiError(409, "注册链接名额刚刚已用完或链接已经停用", "INVITE_LINK_UNAVAILABLE");
      }
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const message = String(error?.message || error);
    if (/users\.username|UNIQUE constraint failed: users\.username/i.test(message)) {
      throw new ApiError(409, "用户名已存在", "USERNAME_TAKEN");
    }
    if (/users\.device_hash|UNIQUE constraint failed: users\.device_hash/i.test(message)) {
      throw new ApiError(409, "这台设备已经注册过账号", "DEVICE_ALREADY_REGISTERED");
    }
    throw error;
  }

  const headers = new Headers();
  if (device.setCookie) headers.append("Set-Cookie", device.setCookie);
  return json({ success: true }, { headers });
});
