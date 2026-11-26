const DATABASE_NAME = "life-sequence-workspace";
const DATABASE_VERSION = 1;
const DRAFT_STORE = "drafts";
const GUEST_INSTALLATION_KEY = "life_draft_guest_installation";

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("浏览器草稿存储失败"));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onabort = () =>
      reject(transaction.error || new Error("浏览器草稿事务已取消"));
    transaction.onerror = () =>
      reject(transaction.error || new Error("浏览器草稿事务失败"));
  });
}

let databasePromise;

function openDraftDatabase() {
  if (!globalThis.indexedDB) {
    return Promise.reject(new Error("当前浏览器不支持本地草稿箱"));
  }
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (database.objectStoreNames.contains(DRAFT_STORE)) return;
      const store = database.createObjectStore(DRAFT_STORE, { keyPath: "id" });
      store.createIndex("owner_updated", ["ownerKey", "updatedAt"]);
      store.createIndex("content_type", "contentType");
      store.createIndex("target_id", "targetId");
      store.createIndex("updated_at", "updatedAt");
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => {
        database.close();
        databasePromise = null;
      };
      resolve(database);
    };
    request.onerror = () => {
      databasePromise = null;
      reject(request.error || new Error("无法打开本地草稿箱"));
    };
    request.onblocked = () => {
      databasePromise = null;
      reject(new Error("草稿箱升级被其他页面阻止，请关闭其他页面后重试"));
    };
  });
  return databasePromise;
}

function createId() {
  return `draft-${crypto.randomUUID()}`;
}

// 体裁：Laup 正文由站内路由 `/laup` 写；NOTEBOOK 正文由 `/notebook` 写（同一 Laup 渲染内核）。
const DRAFT_CONTENT_TYPES = new Set(["ARTICLE", "TREE", "LAUP", "NOTEBOOK"]);

function normalizeContentType(value) {
  const candidate = String(value || "").trim().toUpperCase();
  return DRAFT_CONTENT_TYPES.has(candidate) ? candidate : "ARTICLE";
}

export function guestDraftOwnerKey() {
  if (!globalThis.localStorage) return "guest:temporary";
  let installationId = localStorage.getItem(GUEST_INSTALLATION_KEY);
  if (!installationId) {
    installationId = crypto.randomUUID();
    localStorage.setItem(GUEST_INSTALLATION_KEY, installationId);
  }
  return `guest:${installationId}`;
}

export function userDraftOwnerKey(user) {
  const uid = String(user?.uid || user?.id || "").trim();
  return uid ? `user:${uid}` : guestDraftOwnerKey();
}

export function visibleDraftOwnerKeys(user) {
  const guestKey = guestDraftOwnerKey();
  const userKey = userDraftOwnerKey(user);
  return userKey === guestKey ? [guestKey] : [userKey, guestKey];
}

export async function saveDraft(input) {
  const database = await openDraftDatabase();
  const id = String(input?.id || createId());
  const transaction = database.transaction(DRAFT_STORE, "readwrite");
  const store = transaction.objectStore(DRAFT_STORE);
  const existing = await requestResult(store.get(id));
  const now = new Date().toISOString();
  const draft = {
    ...existing,
    ...input,
    id,
    ownerKey: String(input.ownerKey || existing?.ownerKey || guestDraftOwnerKey()),
    contentType: normalizeContentType(input.contentType ?? existing?.contentType),
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
  await transactionDone(transaction);
  return draft;
}

export async function getDraft(id) {
  if (!id) return null;
  const database = await openDraftDatabase();
  const transaction = database.transaction(DRAFT_STORE, "readonly");
  const result = await requestResult(
    transaction.objectStore(DRAFT_STORE).get(String(id)),
  );
  await transactionDone(transaction);
  return result || null;
}

export async function listDrafts({ ownerKeys = [] } = {}) {
  const allowedOwners = new Set(ownerKeys.map(String));
  const database = await openDraftDatabase();
  const transaction = database.transaction(DRAFT_STORE, "readonly");
  const drafts = await requestResult(
    transaction.objectStore(DRAFT_STORE).getAll(),
  );
  await transactionDone(transaction);
  return (drafts || [])
    .filter((draft) => !allowedOwners.size || allowedOwners.has(draft.ownerKey))
    .sort((first, second) =>
      String(second.updatedAt).localeCompare(String(first.updatedAt)));
}

export async function deleteDraft(id) {
  if (!id) return false;
  const database = await openDraftDatabase();
  const transaction = database.transaction(DRAFT_STORE, "readwrite");
  transaction.objectStore(DRAFT_STORE).delete(String(id));
  await transactionDone(transaction);
  return true;
}

/**
 * 清空指定归属的草稿。`ownerKeys` 为空数组时清空整库。
 * 只删命中归属的条目，同一浏览器里其他账号的草稿不受影响。
 */
export async function clearDrafts({ ownerKeys = [] } = {}) {
  const allowedOwners = new Set(ownerKeys.map(String));
  const database = await openDraftDatabase();
  const readTransaction = database.transaction(DRAFT_STORE, "readonly");
  const all = await requestResult(
    readTransaction.objectStore(DRAFT_STORE).getAll(),
  );
  await transactionDone(readTransaction);
  const targets = (all || []).filter(
    (draft) => !allowedOwners.size || allowedOwners.has(draft.ownerKey),
  );
  if (!targets.length) return 0;
  const writeTransaction = database.transaction(DRAFT_STORE, "readwrite");
  const store = writeTransaction.objectStore(DRAFT_STORE);
  for (const draft of targets) store.delete(draft.id);
  await transactionDone(writeTransaction);
  return targets.length;
}

export async function duplicateDraft(id, ownerKey) {
  const source = await getDraft(id);
  if (!source) throw new Error("草稿不存在或已被删除");
  return saveDraft({
    ...source,
    id: createId(),
    ownerKey: ownerKey || source.ownerKey,
    mode: "CREATE",
    targetId: "",
    baseVersion: 0,
    title: source.title ? `${source.title}（副本）` : "未命名草稿（副本）",
    createdAt: undefined,
    updatedAt: undefined,
  });
}

export function draftEditorLocation(draft) {
  const query = { draft: draft.id };
  if (draft.mode === "EDIT" && draft.targetId) query.edit = draft.targetId;
  if (draft.mode === "FORK" && draft.targetId) query.fork = draft.targetId;
  if (draft.mode === "CONTRIBUTION" && draft.targetId) {
    query.contribute = draft.targetId;
  }
  // 三种体裁现在**都在 Vue 路由表里**：Laup 已从 `public/laup/` 的静态页
  // 改成站内路由 `/laup`，所以统一返回路由地址，调用方一律 `router.push` 客户端跳转。
  if (draft.contentType === "LAUP") return { path: "/workbench", query };
  // Notebook 稿带内核标记（payload.kernel）：v2 公测页另存一份渲染管线，
  // 「继续编辑」必须回到它写的那一页，否则 v2 稿子会在 v1 内核下重渲。
  if (draft.contentType === "NOTEBOOK") {
    return { path: draft.payload?.kernel === "v2" ? "/laup-v2" : "/notebook", query };
  }
  // 纠偏：早期版本曾把 Notebook 草稿误归为 ARTICLE（payload.cells 是 Notebook 的指纹），
  // 不兜住的话「继续编辑」会落到 create-post 的文章编辑器里。
  if (
    draft.contentType === "ARTICLE" &&
    Array.isArray(draft.payload?.cells)
  ) {
    return { path: draft.payload?.kernel === "v2" ? "/laup-v2" : "/notebook", query };
  }
  return {
    path: draft.contentType === "TREE" ? "/evolution-tree" : "/create-post",
    query,
  };
}
