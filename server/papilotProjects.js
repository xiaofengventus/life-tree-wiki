import { ApiError } from "./http.js";

const MiB = 1024 * 1024;
const BODY_LIMIT = 16 * MiB;
const utf8 = new TextEncoder();
const unsafeChars = /[\p{Cc}\p{Cs}]/u;

const invalid = (message) => new ApiError(400, message, "INVALID_PROJECT");
const tooLarge = () => new ApiError(413, "项目内容超出尺寸限制", "PAYLOAD_TOO_LARGE");
const notFound = () => new ApiError(404, "项目不存在", "PROJECT_NOT_FOUND");
const conflict = () => new ApiError(409, "项目版本已更新，请重新读取后再保存", "VERSION_CONFLICT");

const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
function fields(value, allowed) {
  if (!record(value) || Object.keys(value).some((key) => !allowed.includes(key))) {
    throw invalid("项目字段无效");
  }
}

async function readBody(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") || "")) {
    throw new ApiError(415, "请求必须使用 application/json", "INVALID_CONTENT_TYPE");
  }
  if (Number(request.headers.get("content-length")) > BODY_LIMIT) throw tooLarge();
  const reader = request.body?.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const parts = [];
  let size = 0;
  try {
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > BODY_LIMIT) throw tooLarge();
        parts.push(decoder.decode(value, { stream: true }));
      }
    }
    parts.push(decoder.decode());
    return JSON.parse(parts.join(""));
  } catch (error) {
    await reader?.cancel().catch(() => {});
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "JSON 格式无效", "INVALID_JSON");
  } finally {
    reader?.releaseLock();
  }
}

function label(value, field) {
  if (typeof value !== "string" || unsafeChars.test(value)) throw invalid(`${field}无效`);
  const text = value.trim();
  if (!text || text.length > 240 || [...text].length > 120) throw invalid(`${field}无效`);
  return text;
}

function locationLabel(value) {
  const text = label(value, "保存位置");
  if (/[\\/:]/.test(text) || text === "." || text === "..") throw invalid("保存位置不是站内集合名");
  return text;
}

function pathParts(path) {
  if (typeof path !== "string" || !path || path.length > 240 || utf8.encode(path).length > 240 ||
      unsafeChars.test(path) || /[\\:<>"|?*]/.test(path)) {
    throw invalid("TeX 文件路径无效");
  }
  const parts = path.split("/");
  if (parts.some((part) => !part || part === "." || part === ".." || part !== part.trim() ||
      part.endsWith(".") || /^(?:con|prn|aux|nul|com[0-9¹²³]|lpt[0-9¹²³])(?:\.|$)/i.test(part))) {
    throw invalid("TeX 文件路径必须为安全的相对路径");
  }
  return parts;
}

const base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function decodedSize(content) {
  if (typeof content !== "string") throw invalid("TeX 文件必须使用 base64");
  if (content.length > Math.ceil(5 * MiB / 3) * 4) throw tooLarge();
  const padding = content.endsWith("==") ? 2 : content.endsWith("=") ? 1 : 0;
  if (content.length % 4 || /[^A-Za-z0-9+/]/.test(padding ? content.slice(0, -padding) : content) ||
      (padding && base64.indexOf(content.at(-padding - 1)) % (padding === 2 ? 16 : 4))) {
    throw invalid("TeX 文件必须使用标准 base64");
  }
  const size = content.length / 4 * 3 - padding;
  if (size > 5 * MiB) throw tooLarge();
  return size;
}

function validateTex(document) {
  fields(document, ["files", "entry"]);
  if (!Array.isArray(document.files) || !document.files.length) throw invalid("TeX 项目至少需要一个文件");
  if (document.files.length > 256) throw tooLarge();
  pathParts(document.entry);
  const paths = new Map();
  let totalSize = 0;
  let hasEntry = false;
  for (const file of document.files) {
    fields(file, ["path", "content"]);
    const parts = pathParts(file.path);
    let prefix = "";
    for (const [index, part] of parts.entries()) {
      prefix += (index ? "/" : "") + part;
      const key = prefix.normalize("NFC").toLowerCase();
      const isFile = index === parts.length - 1;
      const existing = paths.get(key);
      if (existing && (isFile || existing.isFile || existing.prefix !== prefix)) {
        throw invalid("TeX 文件路径重复或冲突");
      }
      paths.set(key, { prefix, isFile });
    }
    hasEntry ||= file.path === document.entry;
    totalSize += decodedSize(file.content);
    if (totalSize > 10 * MiB) throw tooLarge();
  }
  if (!hasEntry) throw invalid("TeX 入口文件不存在");
}

function validateDocument(kind, document) {
  if (kind === "tex") {
    validateTex(document);
    return JSON.stringify(document);
  }
  fields(document, ["cells", "renderMode"]);
  if (!Array.isArray(document.cells) || !["below", "inplace", "folded"].includes(document.renderMode)) {
    throw invalid("Laup 单元格或渲染模式无效");
  }
  if (document.cells.length > 500) throw tooLarge();
  for (const cell of document.cells) {
    fields(cell, ["type", "source", "attachments"]);
    if (!["laup", "code"].includes(cell.type) || typeof cell.source !== "string") {
      throw invalid("Laup 单元格无效");
    }
    if (cell.attachments !== undefined && (!record(cell.attachments) ||
        Object.entries(cell.attachments).some(([key, value]) =>
          ["__proto__", "constructor", "prototype"].includes(key) || typeof value !== "string"))) {
      throw invalid("Laup 附件无效");
    }
  }
  const serialized = JSON.stringify(document);
  if (utf8.encode(serialized).length > 4 * MiB) throw tooLarge();
  return serialized;
}

function summary(row) {
  return {
    id: row.id, name: row.name, kind: row.kind, location: row.location,
    version: row.version, updatedAt: row.updated_at,
  };
}

async function ownedProject(db, ownerId, id) {
  if (typeof id !== "string" || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(id)) throw notFound();
  const row = await db.prepare(
    "SELECT * FROM papilot_projects WHERE id = ? AND owner_id = ? AND archived_at IS NULL",
  ).bind(id, ownerId).first();
  if (!row) throw notFound();
  return row;
}

function storage(env) {
  if (!env.PAPILOT_SNAPSHOTS) {
    throw new ApiError(503, "项目快照存储尚未绑定", "PROJECT_STORAGE_NOT_CONFIGURED");
  }
  return env.PAPILOT_SNAPSHOTS;
}

async function readSnapshot(env, key) {
  const object = await storage(env).get(key);
  if (!object) throw new ApiError(503, "项目快照暂不可用", "PROJECT_SNAPSHOT_MISSING");
  return object.json();
}

async function writeSnapshot(env, id, version, serialized) {
  // 每次写入使用独立 key，避免相同基线版本的并发请求覆盖彼此的内容。
  const key = `papilot/projects/${id}/${version}-${crypto.randomUUID()}.json`;
  await storage(env).put(key, serialized, {
    httpMetadata: { contentType: "application/json", cacheControl: "private, no-store" },
  });
  return key;
}

export async function listProjects(db, ownerId) {
  const [projects, preferences] = await db.batch([
    db.prepare(`SELECT id, name, kind, location, version, updated_at FROM papilot_projects
                WHERE owner_id = ? AND archived_at IS NULL ORDER BY updated_at DESC, id DESC`).bind(ownerId),
    db.prepare("SELECT default_location FROM papilot_preferences WHERE owner_id = ?").bind(ownerId),
  ]);
  return { projects: projects.results.map(summary), defaultLocation: preferences.results[0]?.default_location ?? null };
}

export async function createProject(env, ownerId, request) {
  const body = await readBody(request);
  fields(body, ["name", "kind", "document", "location"]);
  const name = label(body.name, "项目名称");
  const { kind, document } = body;
  if (kind !== "laup" && kind !== "tex") throw invalid("项目类型无效");
  const location = body.location === undefined || body.location === "" ? null : locationLabel(body.location);
  const serialized = validateDocument(kind, document);
  const id = crypto.randomUUID();
  const key = await writeSnapshot(env, id, 1, serialized);
  const now = new Date().toISOString();
  const [created] = await env.DB.batch([
    env.DB.prepare(`INSERT INTO papilot_projects
      (id, owner_id, name, kind, location, version, snapshot_key, updated_at)
      VALUES (?, ?, ?, ?, COALESCE(?, (SELECT default_location FROM papilot_preferences WHERE owner_id = ?)), 1, ?, ?)
      RETURNING id, name, kind, location, version, updated_at`)
      .bind(id, ownerId, name, kind, location, ownerId, key, now),
    env.DB.prepare(`INSERT INTO papilot_preferences (owner_id, default_location)
      SELECT owner_id, location FROM papilot_projects WHERE id = ? AND owner_id = ?
      ON CONFLICT (owner_id) DO UPDATE SET default_location = excluded.default_location`).bind(id, ownerId),
  ]);
  return { ...summary(created.results[0]), document };
}

export async function getProject(env, ownerId, id) {
  const row = await ownedProject(env.DB, ownerId, id);
  return { ...summary(row), document: await readSnapshot(env, row.snapshot_key) };
}

export async function saveProject(env, ownerId, id, request) {
  const row = await ownedProject(env.DB, ownerId, id);
  const body = await readBody(request);
  fields(body, ["version", "document"]);
  if (!Number.isSafeInteger(body.version) || body.version < 1) throw invalid("项目版本无效");
  if (body.version !== row.version) throw conflict();
  const serialized = validateDocument(row.kind, body.document);
  const version = row.version + 1;
  const key = await writeSnapshot(env, id, version, serialized);
  const now = new Date().toISOString();
  const saved = await env.DB.prepare(`UPDATE papilot_projects SET snapshot_key = ?, version = ?, updated_at = ?
    WHERE id = ? AND owner_id = ? AND version = ? AND archived_at IS NULL
    RETURNING id, name, kind, location, version, updated_at`).bind(key, version, now, id, ownerId, row.version).first();
  if (!saved) {
    await storage(env).delete(key).catch(() => {});
    throw conflict();
  }
  return { ...summary(saved), document: body.document };
}

export async function archiveProject(env, ownerId, id, request) {
  const row = await ownedProject(env.DB, ownerId, id);
  const body = await readBody(request);
  fields(body, ["version"]);
  if (!Number.isSafeInteger(body.version) || body.version < 1) throw invalid("项目版本无效");
  if (body.version !== row.version) throw conflict();
  const document = await readSnapshot(env, row.snapshot_key);
  const now = new Date().toISOString();
  const archived = await env.DB.prepare(`UPDATE papilot_projects SET archived_at = ?, updated_at = ?
    WHERE id = ? AND owner_id = ? AND version = ? AND archived_at IS NULL
    RETURNING id, name, kind, location, version, updated_at`).bind(now, now, id, ownerId, body.version).first();
  if (!archived) throw conflict();
  return { ...summary(archived), document };
}
