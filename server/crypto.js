// Cloudflare Workers Web Crypto rejects PBKDF2 iteration counts above 100,000.
// Use the platform maximum and reject unexpected stored values before invoking
// Web Crypto so a malformed database row cannot turn login into a 500 error.
const PASSWORD_ITERATIONS = 100_000;

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function randomToken(byteLength = 32) {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

export async function sha256(value) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(String(value)),
  );
  return bytesToBase64Url(new Uint8Array(digest));
}

async function derivePassword(password, salt, iterations = PASSWORD_ITERATIONS) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    keyMaterial,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassword(password, salt);
  return `pbkdf2_sha256$${PASSWORD_ITERATIONS}$${bytesToBase64Url(salt)}$${bytesToBase64Url(hash)}`;
}

export async function verifyPassword(password, encodedHash) {
  const [algorithm, rawIterations, rawSalt, rawHash] = String(encodedHash).split("$");
  const iterations = Number(rawIterations);
  if (
    algorithm !== "pbkdf2_sha256" ||
    !Number.isSafeInteger(iterations) ||
    iterations !== PASSWORD_ITERATIONS ||
    !rawSalt ||
    !rawHash
  ) {
    return false;
  }

  const expected = base64UrlToBytes(rawHash);
  const actual = await derivePassword(password, base64UrlToBytes(rawSalt), iterations);
  if (actual.length !== expected.length) return false;

  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) {
    difference |= actual[index] ^ expected[index];
  }
  return difference === 0;
}

export async function constantTimeStringEqual(left, right) {
  const [leftHash, rightHash] = await Promise.all([sha256(left), sha256(right)]);
  if (leftHash.length !== rightHash.length) return false;
  let difference = 0;
  for (let index = 0; index < leftHash.length; index += 1) {
    difference |= leftHash.charCodeAt(index) ^ rightHash.charCodeAt(index);
  }
  return difference === 0;
}
