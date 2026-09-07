import { ApiError } from "./http.js";

export const MAX_MEDIA_UPLOAD_BYTES = 2 * 1024 * 1024;
export const DEFAULT_GLOBAL_MEDIA_LIMIT_BYTES = 8 * 1024 * 1024 * 1024;
const HASH_PATTERN = /^[a-f0-9]{64}$/;

export function validMediaHash(value) {
  const hash = String(value || "").toLowerCase();
  return HASH_PATTERN.test(hash) ? hash : null;
}

export function sniffImage(bytes) {
  if (bytes.length >= 12 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    const dimensions = jpegDimensions(bytes);
    if (!dimensions) throw new ApiError(415, "JPEG 图片结构无效", "INVALID_IMAGE");
    return { mimeType: "image/jpeg", extension: "jpg", ...dimensions };
  }
  if (
    bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e &&
    bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    if (
      bytes.length < 24 || String.fromCharCode(...bytes.slice(12, 16)) !== "IHDR"
    ) throw new ApiError(415, "PNG 图片结构无效", "INVALID_IMAGE");
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const width = view.getUint32(16);
    const height = view.getUint32(20);
    if (!width || !height) throw new ApiError(415, "PNG 图片尺寸无效", "INVALID_IMAGE");
    return { mimeType: "image/png", extension: "png", width, height };
  }
  if (
    bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    const dimensions = webpDimensions(bytes);
    if (!dimensions) throw new ApiError(415, "WebP 图片结构无效", "INVALID_IMAGE");
    return { mimeType: "image/webp", extension: "webp", ...dimensions };
  }
  throw new ApiError(415, "只允许 JPEG、PNG 或 WebP 图片", "UNSUPPORTED_IMAGE");
}

function jpegDimensions(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const startOfFrame = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker >= 0xd0 && marker <= 0xd7) { offset += 1; continue; }
    if (offset + 2 >= bytes.length) return null;
    const length = view.getUint16(offset + 1);
    if (length < 2 || offset + 1 + length > bytes.length) return null;
    if (startOfFrame.has(marker)) {
      const height = view.getUint16(offset + 4);
      const width = view.getUint16(offset + 6);
      return width && height ? { width, height } : null;
    }
    offset += 1 + length;
  }
  return null;
}

function webpDimensions(bytes) {
  if (bytes.length < 25) return null;
  const type = String.fromCharCode(...bytes.slice(12, 16));
  if (type === "VP8X" && bytes.length >= 30) {
    return {
      width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
      height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
    };
  }
  if (type === "VP8 " && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    return {
      width: (bytes[26] | (bytes[27] << 8)) & 0x3fff,
      height: (bytes[28] | (bytes[29] << 8)) & 0x3fff,
    };
  }
  if (type === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
    return {
      width: 1 + bytes[21] + ((bytes[22] & 0x3f) << 8),
      height: 1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10),
    };
  }
  return null;
}

export async function sha256Hex(bytes) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function mediaUrl(hash) {
  return `/media/${hash}`;
}

export function parseImageDimension(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 12_000) {
    throw new ApiError(400, `${label}无效`, "INVALID_IMAGE_DIMENSIONS");
  }
  return number;
}

export function globalMediaLimit(env) {
  const configured = Number(env.MEDIA_GLOBAL_LIMIT_BYTES);
  return Number.isSafeInteger(configured) && configured > 0
    ? configured
    : DEFAULT_GLOBAL_MEDIA_LIMIT_BYTES;
}

export function managedMediaHashesFromHtml(html) {
  const hashes = new Set();
  const pattern = /\/media\/([a-f0-9]{64})(?![a-f0-9])/gi;
  let match;
  while ((match = pattern.exec(String(html || "")))) hashes.add(match[1].toLowerCase());
  return [...hashes];
}

export function managedMediaHashesFromTree(document) {
  const hashes = new Set();
  (function visit(node) {
    if (!node) return;
    const match = String(node.data?.image || "").match(/^\/media\/([a-f0-9]{64})$/i);
    if (match) hashes.add(match[1].toLowerCase());
    (node.children || []).forEach(visit);
  })(document?.root);
  return [...hashes];
}

export async function validateManagedMedia(DB, hashes) {
  for (let offset = 0; offset < hashes.length; offset += 90) {
    const chunk = hashes.slice(offset, offset + 90);
    const placeholders = chunk.map(() => "?").join(",");
    const result = await DB.prepare(
      `SELECT content_hash FROM media_assets WHERE content_hash IN (${placeholders})`,
    ).bind(...chunk).all();
    if ((result.results || []).length !== chunk.length) {
      throw new ApiError(400, "正文引用了不存在的站内图片", "MEDIA_REFERENCE_INVALID");
    }
  }
}

export function mediaReferenceStatements(DB, entityType, entityId, hashes, now, { replace = false } = {}) {
  const statements = [];
  if (replace) {
    statements.push(
      DB.prepare("DELETE FROM media_references WHERE entity_type = ? AND entity_id = ?")
        .bind(entityType, entityId),
    );
  }
  for (let offset = 0; offset < hashes.length; offset += 20) {
    const chunk = hashes.slice(offset, offset + 20);
    const values = chunk.map(() => "(?, ?, ?, ?)").join(",");
    const bindings = chunk.flatMap((hash) => [hash, entityType, entityId, now]);
    statements.push(
      DB.prepare(
        `INSERT OR IGNORE INTO media_references
          (content_hash, entity_type, entity_id, created_at) VALUES ${values}`,
      ).bind(...bindings),
    );
  }
  return statements;
}
