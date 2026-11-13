// 宿主功能的界面层：草稿箱面板 + 发布表单 + 自动保存。
// 纯逻辑在 host.js，这里只管 DOM 与时机。
//
// ⚠️ 开关是 `detectHost()`，不是"当前端口是不是 5300"：Laup 自己的服务器上
//    没有 /api/*，这三个按钮就一直不出现，编辑器照常能写。

import {
  buildPublishRequest,
  currentUser,
  detectHost,
  draftAfterPublish,
  formFromDraft,
  getDraft,
  guessTitle,
  listLaupDrafts,
  ownerKeyFor,
  publish,
  removeDraft,
  saveDraft,
} from "./host.js";

const el = (id) => document.getElementById(id);
const SAVE_DELAY = 900;

let ctx = null;             // { getSource, adoptSource } —— editor.js 给的
let enabled = false;
let ownerKey = "";
let draftId = "";
let currentDraft = null;
let form = formFromDraft(null, "");
let lastSaved = null;
let timer = null;

function setStatus(text) {
  const node = el("host-status");
  if (!node) return;
  node.hidden = !text;
  node.textContent = text || "";
}

function withDraftQuery(id) {
  const params = new URLSearchParams(location.search);
  if (id) params.set("draft", id);
  else params.delete("draft");
  const query = params.toString();
  return `${location.pathname}${query ? `?${query}` : ""}`;
}

// ── 自动保存

export function hostTouched() {
  if (!enabled) return;
  clearTimeout(timer);
  timer = setTimeout(saveNow, SAVE_DELAY);
}

export async function saveNow() {
  if (!enabled || !ctx) return null;
  const source = ctx.getSource();
  // 一个字都没写就不建草稿 —— 否则打开一次就往别人的草稿箱里塞一条空的
  if (!draftId && !source.trim()) return null;
  if (source === lastSaved) return currentDraft;
  setStatus("保存中…");
  try {
    const saved = await saveDraft({
      id: draftId || undefined,
      ownerKey,
      mode: currentDraft?.mode || "CREATE",
      targetId: currentDraft?.targetId || "",
      baseVersion: currentDraft?.baseVersion || 0,
      title: String(form.title || guessTitle(source) || "").slice(0, 120),
      payload: { ...form, source },
    });
    draftId = saved.id;
    lastSaved = source;
    currentDraft = saved;
    if (new URLSearchParams(location.search).get("draft") !== saved.id) {
      history.replaceState(null, "", withDraftQuery(saved.id));
    }
    setStatus(`已保存 ${new Date().toLocaleTimeString("zh-CN", { hour12: false })}`);
    return saved;
  } catch (error) {
    setStatus(`草稿保存失败：${error.message}`);
    return currentDraft;
  }
}

// ── 草稿面板

async function openDrafts() {
  el("drafts-overlay").hidden = false;
  const list = el("drafts-list");
  list.innerHTML = '<p class="host-empty">读取中…</p>';
  let drafts;
  try {
    drafts = await listLaupDrafts();
  } catch (error) {
    list.innerHTML = "";
    const p = document.createElement("p");
    p.className = "host-empty";
    p.textContent = `草稿读取失败：${error.message}`;
    list.appendChild(p);
    return;
  }
  list.innerHTML = "";
  if (!drafts.length) {
    const p = document.createElement("p");
    p.className = "host-empty";
    p.textContent = "还没有 Laup 草稿。开始写就会自动存一份到这里。";
    list.appendChild(p);
    return;
  }
  for (const draft of drafts) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "host-item";
    const title = document.createElement("span");
    title.className = "hi-title";
    title.textContent = draft.title || "未命名草稿";
    const meta = document.createElement("span");
    meta.className = "hi-meta";
    const parts = [
      draft.mode === "EDIT" ? "编辑已发布内容" : "新建",
      new Date(draft.updatedAt).toLocaleString("zh-CN", { hour12: false }),
    ];
    if (draft.id === draftId) parts.push("（当前）");
    meta.textContent = parts.join(" · ");
    item.append(title, meta);

    const del = document.createElement("span");
    del.className = "hi-del";
    del.textContent = "删除";
    del.addEventListener("click", async (event) => {
      event.stopPropagation();
      if (!window.confirm(`删除草稿「${draft.title || "未命名草稿"}」？`)) return;
      await removeDraft(draft.id);
      if (draft.id === draftId) {
        draftId = "";
        currentDraft = null;
        lastSaved = null;
        history.replaceState(null, "", withDraftQuery(""));
      }
      await openDrafts();
    });
    item.appendChild(del);

    item.addEventListener("click", () => {
      // 整页跳：换源码要重建撤销栈与渲染状态，就地替换不如重新加载干净
      window.location.href = `${location.pathname}?draft=${encodeURIComponent(draft.id)}`;
    });
    list.appendChild(item);
  }
}

// ── 发布表单

function readForm() {
  return {
    title: el("pf-title").value,
    author: el("pf-author").value,
    type: el("pf-type").value,
    tags: el("pf-tags").value,
    license: el("pf-license").value,
    changeNote: el("pf-note").value,
    visibility: el("pf-visibility").value,
    isMinorChange: el("pf-minor").checked,
  };
}

function fillForm(values) {
  el("pf-title").value = values.title || "";
  el("pf-author").value = values.author || "";
  el("pf-type").value = values.type || "";
  el("pf-tags").value = Array.isArray(values.tags) ? values.tags.join(" ") : "";
  el("pf-license").value = values.license || "支持闭源";
  el("pf-note").value = values.changeNote || "";
  el("pf-visibility").value = values.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC";
  el("pf-minor").checked = values.isMinorChange === true;
}

function openPublish() {
  const isUpdate = Boolean(currentDraft?.targetId) && Number(currentDraft?.baseVersion) > 0;
  el("publish-title").textContent = isUpdate ? "更新这篇文章" : "发布 Laup 文章";
  el("btn-publish-go").textContent = isUpdate ? "提交更新" : "发布";
  el("pf-minor-wrap").hidden = !isUpdate;
  // 标题没手动填过就退回正文里的一级标题 —— 标题只在打开表单时补，
  // 不写回 form（否则用户清空标题想重写时会被我们一直填回来）。
  fillForm({ ...form, title: form.title || guessTitle(ctx.getSource()) });
  el("pf-error").hidden = true;
  el("pf-ok").hidden = true;
  el("publish-overlay").hidden = false;
  el("pf-title").focus();
}

async function submitPublish(event) {
  event.preventDefault();
  const errorNode = el("pf-error");
  const okNode = el("pf-ok");
  errorNode.hidden = true;
  okNode.hidden = true;
  if (!el("pf-title").value.trim()) {
    errorNode.hidden = false;
    errorNode.textContent = "标题必填";
    el("pf-title").focus();
    return;
  }
  form = readForm();
  const go = el("btn-publish-go");
  go.disabled = true;
  const label = go.textContent;
  go.textContent = "提交中…";
  try {
    await saveNow();
    const request = buildPublishRequest({
      source: ctx.getSource(),
      form,
      targetId: currentDraft?.targetId || "",
      version: currentDraft?.baseVersion || 0,
    });
    const post = await publish(request);
    currentDraft = draftAfterPublish(currentDraft || {}, post);
    draftId = currentDraft.id || draftId;
    // 更新成功后重新存一次：草稿现在是"编辑已发布内容"，再点发布才是 PUT
    await saveNow();
    okNode.hidden = false;
    okNode.innerHTML = "";
    okNode.append("发布成功 —— ");
    const link = document.createElement("a");
    link.href = `/view-post/${encodeURIComponent(post.id)}`;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "查看文章";
    okNode.appendChild(link);
  } catch (error) {
    errorNode.hidden = false;
    // 后端已经带了原因与行号（语法错 / \raw / 标题重复…），原样给用户看
    errorNode.textContent = error.message || "发布失败";
  } finally {
    go.disabled = false;
    go.textContent = label;
  }
}

// ── 启动

export async function initHost(context) {
  ctx = context;
  enabled = await detectHost();
  if (!enabled) return false;

  el("btn-drafts").hidden = false;
  el("btn-publish").hidden = false;
  setStatus("");

  const user = await currentUser();
  ownerKey = ownerKeyFor(user);
  if (!user) setStatus("未登录 —— 草稿只存这台设备，发布前需要先登录");

  draftId = new URLSearchParams(location.search).get("draft") || "";
  if (draftId) {
    const draft = await getDraft(draftId);
    if (draft) {
      currentDraft = draft;
      const source = String(draft.payload?.source ?? "");
      form = formFromDraft(draft, source);
      ctx.adoptSource(source);
      lastSaved = ctx.getSource();
      setStatus(
        draft.mode === "EDIT" && draft.targetId
          ? `正在编辑已发布文章（基于 v${draft.baseVersion || 1}）`
          : `已载入草稿`,
      );
    } else {
      draftId = "";
      setStatus("这份草稿不在这台设备上，已从新的一篇开始");
    }
  }

  el("btn-drafts").addEventListener("click", openDrafts);
  el("btn-publish").addEventListener("click", openPublish);
  el("btn-drafts-close").addEventListener("click", () => { el("drafts-overlay").hidden = true; });
  el("btn-draft-new").addEventListener("click", () => { window.location.href = location.pathname; });
  el("btn-publish-close").addEventListener("click", () => { el("publish-overlay").hidden = true; });
  el("btn-publish-cancel").addEventListener("click", () => { el("publish-overlay").hidden = true; });
  el("publish-form").addEventListener("submit", submitPublish);
  // 关页面前补存一次，别丢了最后 900ms
  window.addEventListener("beforeunload", () => { clearTimeout(timer); saveNow(); });
  return true;
}
