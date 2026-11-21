<script setup>
// 站内的 Laup 写作页（路由 /laup）。
//
// ── 与 /create-post 的关系
//   版式与流程照发文页来：顶部导航 → 标题 → 正文编辑区 → 文章信息 / 标签 →
//   提交声明 → 提交按钮。差别只在编辑区与"正文怎么存"：
//     · 富文本页交 HTML，由站点的清洗白名单过一遍；
//     · 这一页交 **Laup 源码**（contentFormat: 'laup'），
//       服务端用 Laup 自己的渲染器重渲 + Laup 自己的产物白名单自检。
//   所以这里刻意**不**复用 create_post.vue —— 那个组件的五千行里绝大多数是
//   wangEditor 的适配（公式节点、md 单元格、代码案例、粘贴清洗…），
//   搬进来只会让两边都难以维护。复用发生在更下面一层：
//   同一个草稿服务（IndexedDB）、同一个发布接口、同一套自动保存 composable。
//
// ── 草稿
//   与站点共用一张 IndexedDB 表，contentType: 'LAUP'；
//   草稿箱（/drafts）能列出这一页存下的草稿并跳回来。

import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import navBar from "@/components/navBar.vue";
import LaupEditor from "@/components/laup/LaupEditor.vue";
import { createPost, fetchPost, updatePost } from "@/services/posts";
import {
  deleteDraft,
  getDraft,
  guestDraftOwnerKey,
  userDraftOwnerKey,
} from "@/services/drafts";
import { useDraftAutosave } from "@/composables/useDraftAutosave";
import { useUserStore } from "@/stores/user";
import { formatDateTime } from "@/utils/date";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const editorRef = ref(null);
const source = ref("");
const title = ref("");
const author = ref("");
const tagInput = ref("");
const tags = ref([]);
const postType = ref("");
const license = ref("支持闭源");
const visibility = ref("PUBLIC");
const changeNote = ref("");
const agreementAccepted = ref(false);
const isMinorChange = ref(false);
const submitting = ref(false);
const errorMessage = ref("");
const notice = ref("");
const loading = ref(true);
const editUid = ref("");
const editVersion = ref(1);
const editSubmittedAt = ref("");
const editRevisionCount = ref(1);

const isPrivate = computed(() => visibility.value === "PRIVATE");
const isEditing = computed(() => Boolean(editUid.value));

const draftStatusText = computed(() => {
  if (draftAutosave.errorMessage.value) return `草稿保存失败：${draftAutosave.errorMessage.value}`;
  const map = {
    idle: "还没有草稿",
    saved: draftAutosave.lastSavedAt.value
      ? `草稿已保存 · ${formatDateTime(draftAutosave.lastSavedAt.value)}`
      : "草稿已保存",
    pending: "有改动，稍后自动保存",
    saving: "正在保存草稿……",
    dirty: "有改动未保存（手动模式）",
    error: "草稿保存失败",
  };
  return map[draftAutosave.status.value] || "还没有草稿";
});

const submittedAtText = computed(() =>
  editSubmittedAt.value ? formatDateTime(editSubmittedAt.value) : "提交时生成");

const draftAutosave = useDraftAutosave({
  // 快照源：标题 / 正文 / 标签 / 可见性变了就算脏
  source: () => ({
    title: title.value,
    content: source.value,
    tags: tags.value,
    visibility: visibility.value,
  }),
  buildDraft: async (draftId) => {
    const ownerKey = userStore.user
      ? userDraftOwnerKey(userStore.user)
      : guestDraftOwnerKey();
    return {
      id: draftId,
      ownerKey,
      contentType: "LAUP",
      mode: isEditing.value ? "EDIT" : "CREATE",
      targetId: editUid.value || "",
      baseVersion: editVersion.value,
      title: title.value.trim() || "未命名 Laup 草稿",
      payload: {
        title: title.value,
        author: author.value,
        tags: tagInput.value ? [...tags.value, tagInput.value.trim()].filter(Boolean) : [...tags.value],
        type: postType.value,
        license: license.value,
        visibility: visibility.value,
        source: source.value,
      },
    };
  },
  delay: 1500,
});

function onEditorChange(value) {
  source.value = value;
}

function addTag() {
  const value = tagInput.value.trim();
  if (!value || tags.value.length >= 10) return;
  if (!tags.value.includes(value)) tags.value.push(value);
  tagInput.value = "";
}

function removeTag(tag) {
  tags.value = tags.value.filter((item) => item !== tag);
}

async function loadArticle() {
  const draftId = String(route.query.draft || "");
  const editId = String(route.query.edit || "");
  if (draftId) {
    const draft = await getDraft(draftId);
    if (draft) {
      draftAutosave.setDraft(draft);
      const payload = draft.payload || {};
      title.value = payload.title || draft.title || "";
      author.value = payload.author || "";
      tags.value = Array.isArray(payload.tags) ? payload.tags.slice(0, 10) : [];
      postType.value = payload.type || "";
      license.value = payload.license || "支持闭源";
      visibility.value = payload.visibility || "PUBLIC";
      source.value = payload.source || "";
      if (draft.mode === "EDIT" && draft.targetId) {
        editUid.value = draft.targetId;
        editVersion.value = Number(draft.baseVersion || 1);
      }
      editorRef.value?.setSource(source.value);
      notice.value = "已载入本机草稿。";
    } else {
      notice.value = "没找到这份草稿（可能已被删除或换过浏览器）。";
    }
    return;
  }

  if (editId) {
    const post = await fetchPost(editId);
    if (!post) throw new Error("没找到这篇文章");
    // contentSource 才是 Laup 源码。Html→Laup 没有反解，所以只有 Laup 正文才有它。
    if (!post.contentSource) {
      throw new Error("这篇文章是富文本正文，没有 Laup 源码 —— 请到 /create-post 里改。");
    }
    title.value = post.title || "";
    author.value = post.author || "";
    tags.value = Array.isArray(post.tags) ? post.tags.slice(0, 10) : [];
    postType.value = post.type || "";
    license.value = post.license || "支持闭源";
    visibility.value = post.visibility || "PUBLIC";
    source.value = post.contentSource;
    editUid.value = post.uid || post.id || editId;
    editVersion.value = Number(post.version || 1);
    editSubmittedAt.value = post.submittedAt || "";
    editRevisionCount.value = Number(post.revisionCount || 1);
    editorRef.value?.setSource(source.value);
  }
}

async function submit() {
  if (submitting.value) return;
  errorMessage.value = "";
  // 与 /create-post 一致：发布（含「仅自己可见」这种只存服务器的保存）都要先登录。
  // 这一页原来不校验，未登录点提交只能靠后端挡回来，用户看到的是一句绕的接口错误。
  // 草稿不受影响 —— 未登录时草稿本来就只存这台设备（useDraftAutosave 的 guest key）。
  await userStore.initialize().catch(() => {});
  if (!userStore.isLoggedIn) {
    errorMessage.value = isPrivate.value
      ? "请先登录后再保存为仅自己可见"
      : "制作无需登录；发布文章前请先登录或注册";
    return;
  }
  if (!title.value.trim()) { errorMessage.value = "请填写标题"; return; }
  if (!isPrivate.value && !agreementAccepted.value) { errorMessage.value = "请先确认提交声明"; return; }
  if (!source.value.trim()) { errorMessage.value = "正文不能为空"; return; }

  submitting.value = true;
  try {
    const payload = {
      id: editUid.value || null,
      version: editVersion.value,
      title: title.value.trim(),
      author: author.value.trim() || userStore.user?.display_name || userStore.user?.nickname || "",
      creatorUid: userStore.user?.uid || null,
      content: source.value,
      contentFormat: "laup",
      // 旧版 Laup 编辑器产出的永远是 v1 文档
      contentKernel: "v1",
      tags: [...tags.value],
      type: postType.value,
      license: license.value,
      visibility: visibility.value,
      changeNote: changeNote.value.trim() || (isEditing.value ? "修改" : "创建文章"),
      submittedAt: editSubmittedAt.value || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      revisionCount: editRevisionCount.value,
      isMinorChange: isMinorChange.value,
      minorChangeNote: isMinorChange.value ? changeNote.value.trim() : "",
    };

    const saved = editUid.value
      ? await updatePost(editUid.value, payload)
      : await createPost(payload);

    const savedDraftId = draftAutosave.draftId.value;
    if (savedDraftId) await deleteDraft(savedDraftId).catch(() => {});
    await userStore.initialize({ force: true }).catch(() => {});

    if (saved.visibility === "PRIVATE") {
      await router.replace({ path: "/laup", query: { edit: saved.uid || saved.id } });
      notice.value = "已保存（仅自己可见）。";
    } else {
      await router.push({ name: "wiki-post", params: { title: saved.title } });
    }
  } catch (error) {
    errorMessage.value = error.message || "提交失败，请检查网络后重试";
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  try {
    await userStore.initialize().catch(() => {});
    author.value = userStore.user?.display_name || userStore.user?.nickname || "";
    await loadArticle();
  } catch (error) {
    errorMessage.value = error.message || "载入失败";
  } finally {
    loading.value = false;
    draftAutosave.setReady(true);
  }
});
</script>

<template>
  <navBar />
  <section class="laup-post-page">
    <div class="laup-post-head">
      <!-- 原来左边是 h1「Laup 写作 / 编辑 Laup 文章」+ 单独一行的草稿状态。
           h1 与那行都删了 —— 导航栏已经标明当前位置，再写一遍是重复的；
           草稿状态**保留**，并进这一行左侧（信息不丢，也不再白占一行高度）。 -->
      <p class="draft-state" :class="{ error: draftAutosave.errorMessage.value }">
        {{ loading ? "载入中……" : draftStatusText }}
      </p>
      <div class="head-actions">
        <label class="draft-mode-select">
          <span>草稿</span>
          <select
            :value="draftAutosave.saveMode.value"
            aria-label="草稿保存方式"
            @change="draftAutosave.setSaveMode($event.target.value)"
          >
            <option value="auto">自动保存</option>
            <option value="manual">手动保存</option>
          </select>
        </label>
        <button
          type="button"
          :disabled="!draftAutosave.canSave.value"
          title="保存草稿（Ctrl/⌘ + S）"
          @click="draftAutosave.saveNow()"
        >
          保存草稿
        </button>
        <RouterLink to="/drafts">打开草稿箱</RouterLink>
      </div>
    </div>

    <p v-if="notice" class="notice">{{ notice }}</p>
    <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>

    <form class="laup-post-form" @submit.prevent="submit">
      <div class="content-area">
        <label for="laup-title" class="content-title-label">标题</label>
        <input
          id="laup-title"
          v-model="title"
          class="content-title-input"
          type="text"
          maxlength="150"
          placeholder="请输入标题"
          required
        />
      </div>

      <label class="field-label">内容</label>
      <LaupEditor ref="editorRef" @change="onEditorChange" />

      <section class="metadata-grid">
        <div class="metadata-item">
          <label for="laup-author">作者</label>
          <input
            id="laup-author"
            v-model="author"
            type="text"
            maxlength="120"
            placeholder="可填写多人，用逗号分隔"
          />
          <small>实际文章作者</small>
        </div>
        <div class="metadata-item">
          <label for="laup-time">提交时间</label>
          <input id="laup-time" :value="submittedAtText" type="text" disabled />
          <small>由系统生成</small>
        </div>
      </section>

      <div class="tag-section">
        <label for="laup-tag">关键词 / 标签</label>
        <div class="tag-input-row">
          <input
            id="laup-tag"
            v-model="tagInput"
            type="text"
            maxlength="40"
            placeholder="输入标签后按 Enter 添加"
            @keydown.enter.prevent="addTag"
          />
          <button type="button" class="secondary-button" @click="addTag">
            添加标签
          </button>
        </div>
        <div v-if="tags.length" class="tag-list">
          <span v-for="tag in tags" :key="tag" class="tag-item">
            {{ tag }}
            <button type="button" :aria-label="`删除标签 ${tag}`" @click="removeTag(tag)">
              ×
            </button>
          </span>
        </div>
      </div>

      <div class="submission-section">
        <h2>提交声明</h2>
        <label v-if="!isPrivate" class="agreement-row">
          <input v-model="agreementAccepted" type="checkbox" />
          <span>我确认文章内容符合社区发布规范。</span>
        </label>

        <div class="submission-options">
          <label for="laup-type">文章类型</label>
          <select id="laup-type" v-model="postType">
            <option value="science">科普</option>
            <option value="news">新闻</option>
            <option value="">未分类</option>
          </select>
          <small>类型会显示在专栏列表和文章信息栏中</small>
        </div>

        <div class="submission-options">
          <label for="laup-license">协议选择</label>
          <select id="laup-license" v-model="license">
            <option value="支持闭源">支持闭源</option>
            <option value="CC BY-NC-SA 4.0">CC BY-NC-SA 4.0</option>
            <option value="CC BY 4.0">CC BY 4.0</option>
          </select>
          <small>如果是关联到 Communition 的文件强烈建议选择开源</small>
        </div>

        <div class="submission-options">
          <label for="laup-visibility">可见性</label>
          <select id="laup-visibility" v-model="visibility">
            <option value="PUBLIC">公开</option>
            <option value="PRIVATE">仅自己可见</option>
          </select>
          <small>选「仅自己可见」就只存在服务器上，不进入专栏列表</small>
        </div>

        <label for="laup-note">提交说明</label>
        <textarea
          id="laup-note"
          v-model="changeNote"
          rows="3"
          maxlength="300"
          placeholder="说明本次提交的内容，类似 git commit 的说明"
        ></textarea>

        <label v-if="isEditing" class="minor-change-option">
          <input v-model="isMinorChange" type="checkbox" />
          <span>小型修改（不生成提交记录，提交说明也不能写）</span>
        </label>
      </div>

      <div class="server-save-actions">
        <button type="submit" class="submit-button" :disabled="submitting">
          {{ submitting ? "提交中……" : isPrivate ? "保存" : isEditing ? "提交修改" : "公开发布" }}
        </button>
        <small class="submit-hint">
          正文以 Laup 源码提交，服务端用 Laup 自己的渲染器重渲。
        </small>
      </div>
    </form>
  </section>
</template>

<style scoped>
/* ── 页面外壳照 /create-post（components/create_post.vue）那套抄：
   同一个页面底色、同一张白卡表单、同一口径的输入框与按钮。

   为什么不用 Laup 自己的 --bg / --line / --soft：那套变量在 laup.css 里是给
   **编辑器内部**用的，和阅读端共享同一份规则（「同一视角」靠的就是它），不能动。
   宿主外壳属于站点，跟站点的视觉才是"一致"。 */

.laup-post-page {
  min-height: 100vh;
  padding: 84px 20px 60px;
  background: #f8fafc;
}
/* 顶部那 84px 是给「导航栏 64 + 固定工具栏 56」留的呼吸：
   页面内容在文档流里的起点是 64(导航栏) + 84 = 148，落在工具栏下沿(120)之下，不会互相压住。 */

.laup-post-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: min(100%, 960px);
  margin: 0 auto 22px;
}
/* 草稿状态：原来在 h1 下面单独一行，现在并进操作行左侧 */
.draft-state {
  margin: 0;
  color: #64748b;
  font-size: 0.82rem;
}
.draft-state.error {
  color: #b42318;
}

.head-actions {
  display: flex;
  align-items: stretch;
  gap: 7px;
}
.draft-mode-select {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 9px;
  border: 1px solid #93ac9d;
  border-radius: 7px;
  background: #fff;
  color: #52675e;
  font-size: 0.76rem;
  font-weight: 700;
}
.draft-mode-select select {
  border: 0;
  background: transparent;
  color: #315f4d;
  font: inherit;
  font-weight: 700;
  outline: 0;
}
.head-actions button,
.head-actions a {
  padding: 8px 11px;
  border: 1px solid #93ac9d;
  border-radius: 7px;
  background: #fff;
  color: #315f4d;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}
.head-actions button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.notice,
.error-message {
  width: min(100%, 960px);
  margin: 0 auto 14px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.82rem;
}
.notice {
  background: #f1f6f3;
  color: #25634f;
}
.error-message {
  background: #fdeceb;
  color: #a1433c;
}

/* 表单就是那张白卡（口径同 .create-post-form） */
.laup-post-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(100%, 960px);
  margin: 0 auto;
  padding: 28px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
}

/* ── 通用表单控件（口径同 .create-post-form 的 input / select / textarea） */
.laup-post-form input,
.laup-post-form select,
.laup-post-form textarea {
  width: 100%;
  padding: 11px 13px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  color: #1e293b;
  font: inherit;
}
.laup-post-form textarea {
  resize: vertical;
}
.laup-post-form input:focus,
.laup-post-form select:focus,
.laup-post-form textarea:focus {
  border-color: #4a90e2;
  outline: 2px solid rgba(74, 144, 226, 0.15);
}
.laup-post-form input:disabled {
  background: #f1f5f9;
  color: #64748b;
}

/* 标题那个大输入框。⚠️ 必须写在上面那条通用规则**之后** —— 同优先级下后者会赢，
   反过来的话标题会被压回 11px 的普通输入框字号。 */
.content-area {
  margin-bottom: 6px;
}
.content-title-label {
  display: block;
  margin-bottom: 8px;
  color: #334155;
  font-size: 0.9rem;
  font-weight: 600;
}
.laup-post-form .content-title-input {
  padding: 14px 16px;
  font-size: 1.4rem;
  font-weight: 600;
  border-radius: 10px;
}
.laup-post-form .content-title-input:focus {
  border-color: #2f806a;
  outline: none;
  box-shadow: 0 0 0 3px rgba(47, 128, 106, 0.1);
}

.field-label {
  display: block;
  margin-top: 8px;
  color: #334155;
  font-weight: 600;
}

/* ── 元数据：作者 / 提交时间 两列一格（同 .metadata-grid） */
.metadata-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 6px 0 8px;
  padding: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}
.metadata-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.metadata-item label {
  color: #334155;
  font-size: 0.88rem;
  font-weight: 600;
}
.metadata-item small {
  color: #94a3b8;
  font-size: 0.76rem;
}

/* ── 标签区 / 提交声明区：都是「一条上分隔线 + 竖排」的节，不再各自一张卡
   —— 卡片只该有表单那一层，里面再套卡会把层次搞乱（同 .tag-section / .submission-section） */
.tag-section,
.submission-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
  padding-top: 18px;
  border-top: 1px solid #e2e8f0;
}
.tag-section > label,
.submission-section > label,
.submission-options > label {
  color: #334155;
  font-weight: 600;
}
.submission-section h2 {
  margin: 0;
  color: #1e293b;
  font-size: 1.15rem;
}
.submission-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.submission-options small,
.submit-hint {
  color: #94a3b8;
  font-size: 0.76rem;
}

.tag-input-row {
  display: flex;
  gap: 8px;
}
.tag-input-row input {
  flex: 1;
}
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px 4px 10px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0369a1;
  font-size: 0.9rem;
}
.tag-item button {
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}
.secondary-button {
  flex: 0 0 auto;
  width: auto;
  padding: 10px 14px;
  border: none;
  border-radius: 6px;
  background: #64748b;
  color: #fff;
  cursor: pointer;
  font: inherit;
}
.secondary-button:hover {
  background: #55657a;
}

.agreement-row,
.minor-change-option {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #334155;
  font-size: 0.88rem;
}
/* ⚠️ 复选框不能被上面那条「表单控件 width:100%」拉成满宽的一条 */
.laup-post-form .agreement-row input[type="checkbox"],
.laup-post-form .minor-change-option input[type="checkbox"] {
  width: auto;
  flex: none;
  accent-color: #2f806a;
}

.server-save-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  margin-top: 16px;
}
.submit-button {
  width: auto;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: #4a90e2;
  color: #fff;
  cursor: pointer;
  font: inherit;
}
.submit-button:hover:not(:disabled) {
  background: #3a7bc8;
}
.submit-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .metadata-grid {
    grid-template-columns: 1fr;
  }
  .laup-post-head {
    align-items: flex-start;
  }
  .head-actions {
    flex-wrap: wrap;
  }
}
</style>
