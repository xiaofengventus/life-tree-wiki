// 宿主对接层：草稿箱 + 发布。
//
// ── 这个文件为什么单独存在
//   Laup 自己是"一篇文档的编辑器"，它不该知道站点有没有登录、文章存在哪、
//   许可协议有几档。这些只有宿主知道，所以集中放在这一层 ——
//   核心（src/）与编辑器主体（editor.js）都不碰它们。
//
// ── 在 Laup 自己的服务器上（:5300）这里全是空操作
//   那里没有 `/api/*`，也读不到站点的 IndexedDB（不同源，是另一份）。
//   所以每个入口都写成了"取不到就当作没有"：草稿与发布不可用，编辑器照常能写。
//   判断有没有宿主，靠 `detectHost()`，不靠"当前是不是 5300"这种写死的端口号。

// ── 纯逻辑（不碰浏览器，可单测）

export const LAUP_CONTENT_TYPE = "LAUP";
export const LICENSES = ["支持闭源", "CC BY-NC-SA 4.0", "CC BY 4.0"];
export const POST_TYPES = ["", "news", "science"];
const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;

/** 标题猜测：取正文里第一个一级标题，没有就空着（发布时要求必填）。 */
export function guessTitle(source) {
  for (const line of String(source ?? "").split(/\r?\n/)) {
    const match = /^\s*#\s+(.+?)\s*$/.exec(line);
    if (match) return match[1].slice(0, 120);
  }
  return "";
}

/** 标签：数组或"逗号 / 顿号 / 空格"分隔的字符串都收，去重、截断到站点那套口径。 */
export function normalizeTags(value) {
  const raw = Array.isArray(value)
    ? value
    : String(value ?? "").split(/[,，、\s]+/);
  const tags = [];
  for (const item of raw) {
    const tag = String(item ?? "").trim().slice(0, MAX_TAG_LENGTH);
    if (tag && !tags.includes(tag)) tags.push(tag);
    if (tags.length >= MAX_TAGS) break;
  }
  return tags;
}

/**
 * 拼发布请求。`targetId` + `version` 都在（说明这篇已经发过）→ 改，否则新建。
 * 返回的 `body.contentFormat` 是这套后端的约定：**发的是 Laup 源码**，
 * HTML 由服务端用 Laup 自己的渲染器重渲，不在这里拼。
 */
export function buildPublishRequest({ source, form = {}, targetId = "", version = 0 }) {
  const isUpdate = Boolean(targetId) && Number(version) > 0;
  const body = {
    contentFormat: "laup",
    content: String(source ?? ""),
    title: String(form.title || "").trim().slice(0, 150),
    author: String(form.author || "").trim().slice(0, 120),
    type: POST_TYPES.includes(form.type) ? form.type : "",
    tags: normalizeTags(form.tags),
    license: LICENSES.includes(form.license) ? form.license : LICENSES[0],
    changeNote: String(form.changeNote || "").trim().slice(0, 300),
    visibility: form.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
    // Laup 正文自带 \references，不喂站点那套 citations —— 两套机制不混
    citations: [],
    classificationCards: [],
  };
  if (isUpdate) {
    body.version = Number(version);
    body.isMinorChange = form.isMinorChange === true;
  }
  return {
    method: isUpdate ? "PUT" : "POST",
    url: isUpdate ? `/api/posts/${encodeURIComponent(targetId)}` : "/api/posts",
    body,
  };
}

/** 发布成功后草稿要变成"编辑已发布内容"，否则再点发布会又建一篇。 */
export function draftAfterPublish(draft, post) {
  return {
    ...draft,
    mode: "EDIT",
    targetId: String(post?.id || ""),
    baseVersion: Number(post?.version || 1),
    title: draft?.title || String(post?.title || ""),
  };
}

/** 把表单填回草稿里存着（下次打开发布框还是这些值）。 */
export function formFromDraft(draft, source) {
  const payload = draft?.payload && typeof draft.payload === "object" ? draft.payload : {};
  return {
    title: payload.title || draft?.title || guessTitle(source),
    author: payload.author || "",
    type: POST_TYPES.includes(payload.type) ? payload.type : "",
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    license: LICENSES.includes(payload.license) ? payload.license : LICENSES[0],
    changeNote: payload.changeNote || "",
    visibility: payload.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
    isMinorChange: payload.isMinorChange === true,
  };
}

// ── 浏览器侧：当前用户

let cachedUser = null;
let userChecked = false;

/** 拿登录用户。取不到（Laup 自己的服务器 / 没登录 / 接口挂了）一律当"未登录"。 */
export async function currentUser() {
  if (userChecked) return cachedUser;
  userChecked = true;
  try {
    const res = await fetch("/api/auth/me", { credentials: "same-origin" });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "";
    if (!type.includes("application/json")) return null;   // 静态服务器会回 HTML
    const payload = await res.json();
    cachedUser = payload?.user || null;
  } catch {
    cachedUser = null;
  }
  return cachedUser;
}

/** 有没有宿主：只要 `/api/auth/me` 能给出合法 JSON 就算有（哪怕当前未登录）。 */
export async function detectHost() {
  try {
    const res = await fetch("/api/auth/me", { credentials: "same-origin" });
    const type = res.headers.get("content-type") || "";
    return res.ok && type.includes("application/json");
  } catch {
    return false;
  }
}

// ── 浏览器侧：草稿箱（与站点 /drafts 共用一张表）

const DB_NAME = "life-sequence-workspace";
const DB_VERSION = 1;
const STORE = "drafts";
const GUEST_KEY = "life_draft_guest_installation";

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("浏览器草稿存储失败"));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () =>
      reject(transaction.error || new Error("浏览器草稿事务失败"));
    transaction.onabort = () =>
      reject(transaction.error || new Error("浏览器草稿事务已取消"));
  });
}

let dbPromise;

function openDbOnce() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    // ⚠️ 建表语句必须与站点 src/services/drafts.js **逐字一致**，且**不许**升版本号。
    //   原因：这张表是站点的，Laup 只是复用。谁先打开谁建，两边建出来的结构必须相同，
    //   否则后开的那一方会因为版本号没变而**拿不到 onupgradeneeded**，直接撞上缺索引。
    request.onupgradeneeded = () => {
      const db = request.result;
      if (db.objectStoreNames.contains(STORE)) return;
      const store = db.createObjectStore(STORE, { keyPath: "id" });
      store.createIndex("owner_updated", ["ownerKey", "updatedAt"]);
      store.createIndex("content_type", "contentType");
      store.createIndex("target_id", "targetId");
      store.createIndex("updated_at", "updatedAt");
    };
    request.onsuccess = () => {
      const db = request.result;
      // 「库在、表不在」：库已经建好了（版本号 1），onupgradeneeded 不会再触发，
      // 于是这张表永远补不上。这是**早期版本** Laup 留下的库（那时 openDb 没建表）。
      // 这种库里存不了任何东西 —— 没有表就没有行 —— 所以删掉重建是安全的。
      if (!db.objectStoreNames.contains(STORE)) {
        db.close();
        const error = new Error(`草稿库里没有 ${STORE} 表`);
        error.noStore = true;
        reject(error);
        return;
      }
      db.onversionchange = () => { db.close(); dbPromise = null; };
      resolve(db);
    };
    request.onerror = () => reject(request.error || new Error("无法打开本地草稿箱"));
    request.onblocked = () => reject(new Error("草稿箱被其他页面占用，请关闭其他页面后重试"));
  });
}

function openDb() {
  if (!globalThis.indexedDB) return Promise.reject(new Error("当前浏览器不支持本地草稿箱"));
  if (dbPromise) return dbPromise;
  dbPromise = openDbOnce().catch(async (error) => {
    if (!error?.noStore) {
      dbPromise = null;
      throw error;
    }
    await new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = resolve;
      request.onerror = () => reject(request.error || error);
      request.onblocked = () => reject(new Error("草稿箱被其他页面占用，请关闭其他页面后重试"));
    });
    try {
      return await openDbOnce();
    } catch (again) {
      dbPromise = null;
      throw again;
    }
  });
  return dbPromise;
}

export function guestOwnerKey() {
  if (!globalThis.localStorage) return "guest:temporary";
  let id = localStorage.getItem(GUEST_KEY);
  if (!id) {
    id = globalThis.crypto?.randomUUID ? crypto.randomUUID() : String(Date.now());
    localStorage.setItem(GUEST_KEY, id);
  }
  return `guest:${id}`;
}

export function ownerKeyFor(user) {
  const uid = String(user?.uid || user?.id || "").trim();
  return uid ? `user:${uid}` : guestOwnerKey();
}

export async function visibleOwnerKeys() {
  const user = await currentUser();
  const guest = guestOwnerKey();
  const mine = ownerKeyFor(user);
  return mine === guest ? [guest] : [mine, guest];
}

export function newDraftId() {
  return `draft-${globalThis.crypto?.randomUUID ? crypto.randomUUID() : Date.now()}`;
}

export async function saveDraft(input) {
  const db = await openDb();
  const id = String(input?.id || newDraftId());
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  const existing = await requestResult(store.get(id));
  const now = new Date().toISOString();
  const draft = {
    ...existing,
    ...input,
    id,
    ownerKey: String(input.ownerKey || existing?.ownerKey || guestOwnerKey()),
    contentType: LAUP_CONTENT_TYPE,
    mode: String(input.mode || existing?.mode || "CREATE").toUpperCase(),
    title: String(input.title || "").trim().slice(0, 120),
    targetId: String(input.targetId || ""),
    baseVersion: Number(input.baseVersion || 0),
    payload: input.payload && typeof input.payload === "object" ? input.payload : {},
    schemaVersion: 1,
    createdAt: existing?.createdAt || input.createdAt || now,
    updatedAt: now,
  };
  store.put(draft);
  await transactionDone(tx);
  return draft;
}

export async function getDraft(id) {
  if (!id) return null;
  const db = await openDb();
  const tx = db.transaction(STORE, "readonly");
  const found = await requestResult(tx.objectStore(STORE).get(String(id)));
  await transactionDone(tx);
  return found || null;
}

/** 只列 Laup 的草稿 —— 这张表里还有文章与进化树的，混着显示没意义。 */
export async function listLaupDrafts() {
  const owners = new Set((await visibleOwnerKeys()).map(String));
  const db = await openDb();
  const tx = db.transaction(STORE, "readonly");
  const all = await requestResult(tx.objectStore(STORE).getAll());
  await transactionDone(tx);
  return (all || [])
    .filter((d) => d.contentType === LAUP_CONTENT_TYPE)
    .filter((d) => !owners.size || owners.has(d.ownerKey))
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export async function removeDraft(id) {
  if (!id) return false;
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(String(id));
  await transactionDone(tx);
  return true;
}

// ── 浏览器侧：发布

/** 发一次。失败时把服务端给的错误码/文案原样抛出去（后端已经带了行号与原因）。 */
export async function publish(request) {
  const res = await fetch(request.url, {
    method: request.method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request.body),
  });
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  if (!res.ok || !payload?.success) {
    const message = payload?.message || payload?.error || `发布失败（HTTP ${res.status}）`;
    const error = new Error(message);
    error.code = payload?.code || "";
    throw error;
  }
  return payload.post || null;
}
