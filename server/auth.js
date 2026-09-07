import { ApiError } from "./http.js";
import { randomToken, sha256 } from "./crypto.js";
import { formatPublicId } from "./publicIds.js";
import { experienceProgress } from "./experience.js";
import { mediaUrl } from "./media.js";

export const SESSION_COOKIE = "life_session";
export const DEVICE_COOKIE = "life_device";
export const AUTH_HINT_COOKIE = "life_auth_hint";
export const SITE_OWNER_PUBLIC_ID = 1;
export const NATIVE_CLIENT_ID = "life-sequence-android";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;
const DEVICE_MAX_AGE = 365 * 24 * 60 * 60;

export function parseCookies(request) {
  const result = {};
  for (const part of (request.headers.get("cookie") || "").split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key) result[key] = decodeURIComponent(value);
  }
  return result;
}

function nativeSessionToken(request) {
  if (request.headers.get("x-life-client") !== NATIVE_CLIENT_ID) return "";
  return request.headers.get("authorization")
    ?.match(/^Bearer ([A-Za-z0-9_-]{20,100})$/)?.[1] || "";
}

function cookie(name, value, maxAge, secure = true) {
  const secureAttribute = secure ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly${secureAttribute}; SameSite=Lax; Max-Age=${maxAge}`;
}

function publicCookie(name, value, maxAge, secure = true) {
  const secureAttribute = secure ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; Path=/${secureAttribute}; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie(secure = true) {
  return cookie(SESSION_COOKIE, "", 0, secure);
}

export function createAuthHintCookie(secure = true) {
  return publicCookie(AUTH_HINT_COOKIE, "1", SESSION_MAX_AGE, secure);
}

export function clearAuthHintCookie(secure = true) {
  return publicCookie(AUTH_HINT_COOKIE, "", 0, secure);
}

export function createDeviceCookie(value, secure = true) {
  return cookie(DEVICE_COOKIE, value, DEVICE_MAX_AGE, secure);
}

export function getOrCreateDevice(request, { secure = true } = {}) {
  const existing = parseCookies(request)[DEVICE_COOKIE];
  if (existing && /^[A-Za-z0-9_-]{20,100}$/.test(existing)) {
    return { id: existing, setCookie: null };
  }
  const id = randomToken(24);
  return { id, setCookie: createDeviceCookie(id, secure) };
}

export function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    uid: formatPublicId("user", row.public_id),
    username: row.username,
    name: row.display_name,
    introduce: row.bio || "",
    role: row.role,
    isSiteOwner: isSiteOwner(row),
    ...experienceProgress(row.experience),
    avatarUrl: row.avatar_media_hash ? mediaUrl(row.avatar_media_hash) : "",
    signup_data: row.created_at,
  };
}

export async function createSession(DB, userId, request, { secure = true } = {}) {
  const rawToken = randomToken(32);
  const tokenHash = await sha256(rawToken);
  const userAgentHash = await sha256(request.headers.get("user-agent") || "unknown");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE * 1000).toISOString();

  await DB.prepare(
    `INSERT INTO sessions (id_hash, user_id, expires_at, created_at, user_agent_hash)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(tokenHash, userId, expiresAt, now.toISOString(), userAgentHash)
    .run();

  return {
    rawToken,
    setCookie: cookie(SESSION_COOKIE, rawToken, SESSION_MAX_AGE, secure),
    expiresAt,
  };
}

export async function getCurrentUser(DB, request) {
  const rawToken = parseCookies(request)[SESSION_COOKIE] || nativeSessionToken(request);
  if (!rawToken) return null;

  const tokenHash = await sha256(rawToken);
  const row = await DB.prepare(
    `SELECT users.*
       FROM sessions
       JOIN users ON users.id = sessions.user_id
      WHERE sessions.id_hash = ? AND sessions.expires_at > ?
        AND users.status = 'ACTIVE'`,
  )
    .bind(tokenHash, new Date().toISOString())
    .first();
  return row || null;
}

export async function requireUser(DB, request) {
  const user = await getCurrentUser(DB, request);
  if (!user) throw new ApiError(401, "请先登录", "AUTH_REQUIRED");
  return user;
}

export function requireRole(user, roles) {
  if (!isSiteOwner(user) && !roles.includes(user.role)) {
    throw new ApiError(403, "没有执行此操作的权限", "FORBIDDEN");
  }
}

export function isSiteOwner(user) {
  return Number(user?.public_id) === SITE_OWNER_PUBLIC_ID;
}

export function requireSiteOwner(user) {
  if (!isSiteOwner(user)) {
    throw new ApiError(403, "只有站点所有者可以执行该操作", "SITE_OWNER_REQUIRED");
  }
}

export function canDeleteOwnedContent(user, creatorId) {
  return Boolean(user && (user.id === creatorId || isSiteOwner(user)));
}

export async function revokeSession(DB, request) {
  const rawToken = parseCookies(request)[SESSION_COOKIE];
  if (!rawToken) return;
  await DB.prepare("DELETE FROM sessions WHERE id_hash = ?")
    .bind(await sha256(rawToken))
    .run();
}
