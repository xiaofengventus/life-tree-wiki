<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import navBar from "@/components/navBar.vue";
import evolution_mind_map from "@/components/evolution_mind_map.vue";
import { createInitialMindMapDocument, countMindMapNodes, normalizeMindMapDocument } from "@/utils/evolutionMindMapModel";
import { useUserStore } from "@/stores/user";
import {
  createUserTree,
  fetchTree,
  forkTree,
  submitTreeContribution,
  updateTree,
} from "@/services/trees";
import { uploadTreeDataImages } from "@/utils/mediaImages";
import {
  deleteDraft,
  getDraft,
  userDraftOwnerKey,
  visibleDraftOwnerKeys,
} from "@/services/drafts";
import { useDraftAutosave } from "@/composables/useDraftAutosave";
import { clonePlainData } from "@/utils/plainData";
import { formatDateTime } from "@/utils/date";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const document = ref(createInitialMindMapDocument());
// SVG 画布按需挂载：大节点量树直接渲染会卡顿甚至崩溃，
// 超过阈值时先显示占位提示，用户点击后再真正加载画布。
const LARGE_TREE_THRESHOLD = 400;
const canvasUserMounted = ref(false);
const nodeCount = computed(() => countMindMapNodes(document.value?.root));
const canvasDeferred = computed(() => nodeCount.value > LARGE_TREE_THRESHOLD);
const saveState = ref("新建工作台");
const treeTitle = ref("");
const treeDescription = ref("");
const treeLicense = ref("CC BY-NC-SA 4.0");
const treeTags = ref([]);
const referencesText = ref("");
const imageCreditsText = ref("");
const tagInput = ref("");
const changeNote = ref("");
const forkEnabled = ref(false);
const contributionEnabled = ref(false);
const agreementAccepted = ref(false);
const publishedTreeId = ref("");
const publishedVersion = ref(0);
const publishing = ref(false);
const publishMessage = ref("");
const forkSessionId = ref("");
const sourceTree = ref(null);
const contributionTarget = ref(null);
const submissionKind = ref("USER");
const serverVisibility = ref("PUBLIC");
const currentDraftOwnerKey = ref("");
// 悬浮面板开关：发表信息（发布表单）/ 草稿（草稿状态与保存）
const publishPanelOpen = ref(false);
const draftPanelOpen = ref(false);
// 顶部固定工具栏收起状态（由画布组件内的把手控制）
const toolbarCollapsed = ref(false);

function openPublishPanel() {
  publishPanelOpen.value = true;
  draftPanelOpen.value = false;
}

function openDraftPanel() {
  draftPanelOpen.value = true;
  publishPanelOpen.value = false;
}

const editTreeId = computed(() => String(route.query.edit || "").trim());
// 大树占位卡的「DOM 模式浏览」目标：正在编辑/贡献的树才有明确 id
const canvasBrowseTarget = computed(() => {
  const id = editTreeId.value || contributionTreeId.value || publishedTreeId.value;
  return id ? `/life-tree/${id}` : "/life-tree";
});
const forkTreeId = computed(() => String(route.query.fork || "").trim());
const contributionTreeId = computed(() => String(route.query.contribute || "").trim());
const draftQueryId = computed(() => String(route.query.draft || "").trim());
const mode = computed(() => {
  if (contributionTreeId.value) return "CONTRIBUTION";
  if (forkTreeId.value) return "FORK";
  if (editTreeId.value) return "EDIT";
  return "CREATE";
});
const modeLabel = computed(() => serverVisibility.value === "PRIVATE"
  ? "编辑仅自己可见的树相"
  : ({
  CREATE: "新建树相",
  EDIT: "编辑已发布树相",
  FORK: "Fork 到我的工作台",
  CONTRIBUTION: "提交 Contribution",
})[mode.value]);
const isPrivateWork = computed(() => serverVisibility.value === "PRIVATE");
const isOfficialTree = computed(() => submissionKind.value === "OFFICIAL");
const canPublishOfficial = computed(() =>
  userStore.role === "ADMIN" || userStore.isSiteOwner);
const publishHeading = computed(() => {
  if (mode.value === "CONTRIBUTION") return "提交贡献审查";
  if (isPrivateWork.value) return "仅自己可见的进化树";
  if (publishedTreeId.value) return isOfficialTree.value ? "更新平台维护树" : "更新树相";
  return isOfficialTree.value ? "发布平台维护树" : "发布树相";
});
const effectiveDraftMode = computed(() => {
  if (contributionTarget.value) return "CONTRIBUTION";
  if (forkSessionId.value) return "FORK";
  if (publishedTreeId.value) return "EDIT";
  return "CREATE";
});
const treeDraftSource = computed(() => ({
  document: document.value,
  title: treeTitle.value,
  description: treeDescription.value,
  license: treeLicense.value,
  tags: treeTags.value,
  referencesText: referencesText.value,
  imageCreditsText: imageCreditsText.value,
  changeNote: changeNote.value,
  forkEnabled: forkEnabled.value,
  contributionEnabled: contributionEnabled.value,
}));

async function buildTreeDraft(id) {
  const draftMode = effectiveDraftMode.value;
  const targetId = draftMode === "EDIT"
    ? editTreeId.value
    : draftMode === "FORK"
      ? forkTreeId.value
      : draftMode === "CONTRIBUTION"
        ? contributionTreeId.value
        : "";
  return {
    id,
    ownerKey: currentDraftOwnerKey.value || userDraftOwnerKey(userStore.user),
    contentType: "TREE",
    mode: draftMode,
    title: treeTitle.value || "未命名进化树草稿",
    targetId,
    baseVersion: draftMode === "CONTRIBUTION"
      ? Number(contributionTarget.value?.baseVersion || 0)
      : draftMode === "FORK"
        ? Number(sourceTree.value?.baseVersion || 0)
      : Number(publishedVersion.value || 0),
    payload: {
      document: clonePlainData(document.value, "进化树草稿"),
      title: treeTitle.value,
      description: treeDescription.value,
      license: treeLicense.value,
      tags: [...treeTags.value],
      referencesText: referencesText.value,
      imageCreditsText: imageCreditsText.value,
      changeNote: changeNote.value,
      forkEnabled: forkEnabled.value,
      contributionEnabled: contributionEnabled.value,
      sourceTree: clonePlainData(sourceTree.value, "进化树来源"),
    },
  };
}

const draftAutosave = useDraftAutosave({
  source: () => treeDraftSource.value,
  buildDraft: buildTreeDraft,
  delay: 1500,
});

const draftStatusText = computed(() => {
  if (draftAutosave.errorMessage.value) return draftAutosave.errorMessage.value;
  if (draftAutosave.status.value === "saving") return "正在保存草稿……";
  if (draftAutosave.isDirty.value) {
    return draftAutosave.saveMode.value === "auto"
      ? "内容已修改，等待自动保存"
      : "有未保存修改；点击“保存草稿”或按 Ctrl/⌘ + S";
  }
  if (draftAutosave.lastSavedAt.value) {
    return `草稿已保存：${formatDateTime(draftAutosave.lastSavedAt.value)}`;
  }
  return draftAutosave.saveMode.value === "auto"
    ? "未修改；修改后会自动保存到此设备"
    : "未修改；当前使用手动保存";
});
function applyPublishedMetadata(tree) {
  treeTitle.value = tree.title || "";
  treeDescription.value = tree.description || "";
  treeLicense.value = tree.license || "CC BY-NC-SA 4.0";
  treeTags.value = Array.isArray(tree.tags) ? [...tree.tags] : [];
  referencesText.value = tree.referencesText || "";
  imageCreditsText.value = tree.imageCreditsText || "";
  changeNote.value = "";
  forkEnabled.value = Boolean(tree.forkEnabled);
  contributionEnabled.value = Boolean(tree.contributionEnabled);
  serverVisibility.value = tree.visibility || "PUBLIC";
}

function resetEditorState() {
  document.value = createInitialMindMapDocument();
  treeTitle.value = "";
  treeDescription.value = "";
  treeLicense.value = "CC BY-NC-SA 4.0";
  treeTags.value = [];
  referencesText.value = "";
  imageCreditsText.value = "";
  tagInput.value = "";
  changeNote.value = "";
  forkEnabled.value = false;
  contributionEnabled.value = false;
  agreementAccepted.value = false;
  publishedTreeId.value = "";
  publishedVersion.value = 0;
  publishMessage.value = "";
  forkSessionId.value = "";
  sourceTree.value = null;
  contributionTarget.value = null;
  submissionKind.value = "USER";
  serverVisibility.value = "PUBLIC";
}

async function loadEditorDocument() {
  resetEditorState();
  await userStore.initialize();
  if (mode.value !== "CREATE" && !userStore.isLoggedIn) {
    throw new Error("新建制作无需登录；编辑、Fork 和 Contribution 需要先登录");
  }
  if (editTreeId.value) {
    const published = await fetchTree(editTreeId.value);
    const canEdit = published.creatorUid === userStore.user?.uid ||
      (published.kind === "OFFICIAL" && userStore.isSiteOwner);
    if (!canEdit) throw new Error("没有修改这棵树的权限");
    if (published.kind === "OFFICIAL" && !canPublishOfficial.value) {
      throw new Error("只有平台维护树管理员可以修改平台维护树");
    }
    submissionKind.value = published.kind === "OFFICIAL" ? "OFFICIAL" : "USER";
    document.value = normalizeMindMapDocument(published.document);
    applyPublishedMetadata(published);
    publishedTreeId.value = published.id;
    publishedVersion.value = Number(published.version || 1);
    sourceTree.value = published.forkedFrom || null;
    saveState.value = `已载入“${published.title || "未命名树相"}”的已发布版本`;
    return;
  }

  if (forkTreeId.value) {
    const payload = await forkTree(forkTreeId.value);
    const published = payload.tree;
    document.value = normalizeMindMapDocument(published.document);
    applyPublishedMetadata(published);
    treeTitle.value = `${published.title}（Fork）`;
    changeNote.value = `Fork 自 ${published.uid}`;
    publishedTreeId.value = "";
    publishedVersion.value = 0;
    forkSessionId.value = payload.fork.id;
    sourceTree.value = {
      id: published.id,
      uid: published.uid,
      title: published.title,
      creator: published.creator,
      creatorUid: published.creatorUid,
      baseVersion: Number(published.version || 1),
    };
    submissionKind.value = "USER";
    saveState.value = `已将“${published.title}”复用到你的工作台`;
    return;
  }

  if (contributionTreeId.value) {
    const published = await fetchTree(contributionTreeId.value);
    if (!published.contributionEnabled) throw new Error("创作者没有开放这棵树的 Contribution");
    if (published.creatorUid === userStore.user?.uid) throw new Error("创作者可以直接编辑自己的树");
    document.value = normalizeMindMapDocument(published.document);
    applyPublishedMetadata(published);
    publishedTreeId.value = "";
    publishedVersion.value = 0;
    contributionTarget.value = {
      id: published.id,
      uid: published.uid,
      title: published.title,
      creator: published.creator,
      creatorUid: published.creatorUid,
      baseVersion: Number(published.version || 1),
    };
    submissionKind.value = published.kind === "OFFICIAL" ? "OFFICIAL" : "USER";
    saveState.value = `正在基于“${published.title}”v${published.version} 完善`;
    return;
  }

  document.value = createInitialMindMapDocument();
  submissionKind.value = "USER";
  treeTitle.value = `${userStore.user?.name || "我的"}进化树`;
  treeLicense.value = "CC BY-NC-SA 4.0";
  saveState.value = "新建工作台；内容修改后可保存到此设备";
}

async function loadTreeDraft() {
  if (!draftQueryId.value) return null;
  const draft = await getDraft(draftQueryId.value);
  if (!draft || draft.contentType !== "TREE") {
    throw new Error("进化树草稿不存在或已被删除");
  }
  const allowedOwners = new Set(visibleDraftOwnerKeys(userStore.user));
  if (!allowedOwners.has(draft.ownerKey)) {
    throw new Error("这个草稿属于此设备上的其他账号");
  }
  const expectedTarget = {
    EDIT: editTreeId.value,
    FORK: forkTreeId.value,
    CONTRIBUTION: contributionTreeId.value,
  }[draft.mode] || "";
  if (draft.targetId && draft.targetId !== expectedTarget) {
    throw new Error("草稿关联的进化树与当前编辑目标不一致，请从草稿箱重新打开");
  }
  const currentBaseVersion = draft.mode === "CONTRIBUTION"
    ? Number(contributionTarget.value?.baseVersion || 0)
    : draft.mode === "FORK"
      ? Number(sourceTree.value?.baseVersion || 0)
    : Number(publishedVersion.value || 0);
  if (
    draft.baseVersion &&
    currentBaseVersion &&
    Number(draft.baseVersion) !== currentBaseVersion
  ) {
    const keepDraft = window.confirm(
      `服务器进化树已经从 v${draft.baseVersion} 更新到 v${currentBaseVersion}。\n\n继续载入本地草稿可能覆盖新内容。仍要载入吗？`,
    );
    if (!keepDraft) return null;
  }

  const payload = draft.payload || {};
  if (payload.document) {
    document.value = normalizeMindMapDocument(payload.document);
  }
  treeTitle.value = payload.title || "";
  treeDescription.value = payload.description || "";
  treeLicense.value = payload.license || "CC BY-NC-SA 4.0";
  treeTags.value = Array.isArray(payload.tags) ? [...payload.tags] : [];
  referencesText.value = payload.referencesText || "";
  imageCreditsText.value = payload.imageCreditsText || "";
  changeNote.value = payload.changeNote || "";
  forkEnabled.value = Boolean(payload.forkEnabled);
  contributionEnabled.value = Boolean(payload.contributionEnabled);
  agreementAccepted.value = false;
  if (!sourceTree.value && payload.sourceTree) {
    sourceTree.value = clonePlainData(payload.sourceTree, "进化树来源");
  }
  currentDraftOwnerKey.value = draft.ownerKey;
  draftAutosave.setDraft(draft);
  saveState.value = `已恢复本地草稿“${draft.title || "未命名进化树"}”`;
  return draft;
}

async function initializeTreeEditor() {
  draftAutosave.setReady(false);
  draftAutosave.setDraft(null);
  currentDraftOwnerKey.value = "";
  try {
    await loadEditorDocument();
    currentDraftOwnerKey.value = userDraftOwnerKey(userStore.user);
    await loadTreeDraft();
  } catch (error) {
    console.warn("读取进化树或草稿失败", error);
    saveState.value = error.message || "进化树读取失败";
    publishMessage.value = saveState.value;
  } finally {
    draftAutosave.setReady(true);
  }
}

function addTag() {
  const tag = tagInput.value.trim();
  if (!tag || treeTags.value.includes(tag) || treeTags.value.length >= 10) return;
  treeTags.value.push(tag.slice(0, 30));
  tagInput.value = "";
}

function removeTag(index) {
  treeTags.value.splice(index, 1);
}

async function publishTree(targetVisibility = "PUBLIC") {
  publishMessage.value = "";
  const savingPrivate = targetVisibility === "PRIVATE";
  await userStore.initialize();
  if (!userStore.isLoggedIn) {
    publishMessage.value = savingPrivate
      ? "请先登录后再保存为仅自己可见"
      : "制作无需登录；发布进化树前请先登录或注册";
    return;
  }
  if (!savingPrivate && !treeTitle.value.trim()) {
    publishMessage.value = "请先填写进化树名称";
    return;
  }
  if (!savingPrivate && !agreementAccepted.value) {
    publishMessage.value = "请先确认提交声明";
    return;
  }
  if (mode.value === "CONTRIBUTION" && changeNote.value.trim().length < 3) {
    publishMessage.value = "请填写至少 3 个字的贡献说明";
    return;
  }

  if (draftAutosave.saveMode.value === "auto") {
    await draftAutosave.saveNow().catch(() => {});
  }
  draftAutosave.setReady(false);
  publishing.value = true;
  try {
    const creating = !publishedTreeId.value;
    const publishedDocument = await uploadTreeDataImages(document.value, (completed, total) => {
      if (total) publishMessage.value = `正在上传进化树图片 ${completed}/${total}……`;
    });
    const payload = {
      title: treeTitle.value.trim(),
      description: treeDescription.value.trim(),
      license: treeLicense.value,
      tags: [...treeTags.value],
      referencesText: referencesText.value,
      imageCreditsText: imageCreditsText.value,
      changeNote: changeNote.value.trim() || (creating ? "创建进化树" : "更新进化树"),
      forkEnabled: forkEnabled.value,
      contributionEnabled: contributionEnabled.value,
      document: publishedDocument,
      version: publishedVersion.value,
      forkId: forkSessionId.value || undefined,
      visibility: targetVisibility,
    };

    if (mode.value === "CONTRIBUTION") {
      const saved = await submitTreeContribution(contributionTarget.value.uid, {
        ...payload,
        baseVersion: contributionTarget.value.baseVersion,
      });
      if (draftAutosave.draftId.value) {
        await deleteDraft(draftAutosave.draftId.value).catch((error) => {
          console.warn("Contribution 已提交，但本地草稿清理失败", error);
        });
      }
      publishMessage.value = "Contribution 已提交，正在等待原作者审查";
      await router.push(`/tree-contributions/${saved.id}`);
      return;
    }

    const saved = publishedTreeId.value
      ? await updateTree(publishedTreeId.value, payload)
      : await createUserTree(payload);
    publishedTreeId.value = saved.id;
    publishedVersion.value = saved.version;
    serverVisibility.value = saved.visibility || targetVisibility;
    forkSessionId.value = "";
    document.value = normalizeMindMapDocument(saved.document);
    if (creating || targetVisibility === "PUBLIC") {
      await userStore.initialize({ force: true });
    }
    if (draftAutosave.draftId.value) {
      await deleteDraft(draftAutosave.draftId.value).catch((error) => {
        console.warn("进化树已保存，但本地草稿清理失败", error);
      });
    }
    draftAutosave.setDraft(null);
    currentDraftOwnerKey.value = userDraftOwnerKey(userStore.user);
    draftAutosave.setReady(true);
    saveState.value = savingPrivate
      ? "已保存到服务器，仅自己可见"
      : "已提交到服务器；后续修改仍需再次提交";
    publishMessage.value = savingPrivate
      ? "私密进化树已保存，可在其他设备登录后继续编辑"
      : publishedVersion.value > 1
      ? `${isOfficialTree.value ? "平台维护树" : "Research 中的进化树"}已更新`
      : isOfficialTree.value
        ? "平台维护树已发布"
        : "进化树已提交到 Research，经验 +20";
    if (savingPrivate && route.query.edit !== (saved.uid || saved.id)) {
      await router.replace(`/evolution-tree?edit=${encodeURIComponent(saved.uid || saved.id)}`);
    }
  } catch (error) {
    publishMessage.value = error.message || "提交失败，请稍后重试";
    draftAutosave.setReady(true);
  } finally {
    publishing.value = false;
  }
}

function publishAsNewTree() {
  publishedTreeId.value = "";
  publishedVersion.value = 0;
  forkSessionId.value = "";
  submissionKind.value = "USER";
  serverVisibility.value = "PUBLIC";
  publishMessage.value = "下一次提交会创建一棵新的 Research 进化树";
}

watch(
  () => [
    route.query.edit,
    route.query.fork,
    route.query.contribute,
    route.query.kind,
    route.query.draft,
  ].map((value) => String(value || "")).join("|"),
  initializeTreeEditor,
  { immediate: true },
);
</script>

<template>
  <div class="evolution-editor-root">
    <navBar />
    <div class="evolution-editor-page">
    <!-- 顶部固定可收起工具栏（组件内部：command-bar + 把手） -->
    <!-- 大树（节点 > 400）：画布不自动挂载，点击占位卡后再加载，避免打开即卡死 -->
    <div class="editor-toolbar-area">
      <div v-if="canvasDeferred && !canvasUserMounted" class="canvas-deferred-panel">
        <strong>这棵树有 {{ nodeCount }} 个节点</strong>
        <p>大树直接渲染画布可能导致浏览器卡顿。确认需要编辑时再加载；仅想浏览的话，可以去生命树页用 DOM 模式查看。</p>
        <div class="canvas-deferred-actions">
          <button type="button" class="primary" @click="canvasUserMounted = true">加载画布并编辑</button>
          <RouterLink class="ghost" :to="canvasBrowseTarget">用 DOM 模式浏览</RouterLink>
        </div>
      </div>
      <evolution_mind_map
        v-else
        v-model="document"
        :file-owner="userStore.user?.name || '生命时序'"
        :current-tree-id="editTreeId || contributionTreeId || publishedTreeId"
        :toolbar-collapsed="toolbarCollapsed"
        @update:toolbar-collapsed="toolbarCollapsed = $event"
        class="editor-canvas"
      />
    </div>

    <!-- 右下角圆形悬浮按钮：草稿 / 发表信息 -->
    <div class="float-actions">
      <button
        type="button"
        class="float-button"
        :class="{ active: draftPanelOpen }"
        aria-label="保存草稿"
        title="保存草稿"
        @click="openDraftPanel"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm8 1.5V8h4.5L14 3.5zM8 12h8v1.6H8V12zm0 4h8v1.6H8V16z"
            fill="currentColor"
          />
        </svg>
      </button>
      <button
        type="button"
        class="float-button primary"
        :class="{ active: publishPanelOpen }"
        aria-label="发表信息"
        title="发表信息"
        @click="openPublishPanel"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            d="M3 4.5h18a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1h-7v2.2l3.2 1.1-.5 1.4-4.7-1.6-4.7 1.6-.5-1.4 3.2-1.1V16H3a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1zm1 2V14h16V6.5H4zm4 2h8v1.6H8V8.5z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>

    <!-- 草稿面板（侧栏） -->
    <transition name="panel-slide">
      <aside v-if="draftPanelOpen" class="editor-side-panel" aria-label="草稿">
        <header class="panel-heading">
          <div>
            <span>DRAFT</span>
            <strong>保存草稿</strong>
          </div>
          <button type="button" aria-label="关闭草稿面板" @click="draftPanelOpen = false">关闭</button>
        </header>
        <div class="panel-body">
          <p class="panel-description">{{ modeLabel }} · {{ saveState }}</p>
          <p class="panel-description" :class="{ error: draftAutosave.errorMessage.value }">
            {{ draftStatusText }}
          </p>
          <div class="draft-controls">
            <label class="draft-mode-select">
              <span>草稿保存方式</span>
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
              class="draft-save-button"
              :disabled="!draftAutosave.canSave.value"
              @click="draftAutosave.saveNow()"
            >
              保存草稿（Ctrl/⌘ + S）
            </button>
            <RouterLink class="draft-box-link" to="/drafts">打开草稿箱</RouterLink>
          </div>
        </div>
      </aside>
    </transition>

    <!-- 发表信息面板（侧栏） -->
    <transition name="panel-slide">
      <aside v-if="publishPanelOpen" class="editor-side-panel wide" aria-label="进化树发布信息">
        <header class="panel-heading">
          <div>
            <span>PUBLISH</span>
            <strong>{{ publishHeading }}</strong>
          </div>
          <button type="button" aria-label="关闭发表信息面板" @click="publishPanelOpen = false">关闭</button>
        </header>
        <div class="panel-body">
          <p v-if="publishMessage" class="panel-message" aria-live="polite">{{ publishMessage }}</p>

          <div class="publish-grid">
            <label class="wide">
              <span>进化树名称</span>
              <input v-model.trim="treeTitle" maxlength="120" placeholder="简洁、可辨识的名称" />
            </label>
            <label class="wide">
              <span>简介</span>
              <textarea v-model.trim="treeDescription" maxlength="1000" rows="3" placeholder="说明范围、依据与用途"></textarea>
            </label>
            <label>
              <span>协议选择</span>
              <select v-model="treeLicense">
                <option value="支持闭源">支持闭源</option>
                <option value="CC BY-NC-SA 4.0">CC BY-NC-SA 4.0</option>
                <option value="CC BY 4.0">CC BY 4.0</option>
              </select>
            </label>
            <label>
              <span>提交说明</span>
              <input v-model.trim="changeNote" maxlength="300" :placeholder="mode === 'CONTRIBUTION' ? '说明修改内容与依据（必填）' : '本次新增或修改了什么'" />
            </label>

            <div class="tag-editor wide">
              <span>关键词 / 标签</span>
              <div>
                <input v-model.trim="tagInput" maxlength="30" placeholder="最多 10 个标签" @keyup.enter.prevent="addTag" />
                <button type="button" :disabled="!tagInput.trim() || treeTags.length >= 10" @click="addTag">添加</button>
              </div>
              <p v-if="treeTags.length">
                <button v-for="(tag, index) in treeTags" :key="tag" type="button" @click="removeTag(index)">
                  #{{ tag }} ×
                </button>
              </p>
            </div>

            <div class="collaboration-options wide">
              <label>
                <input v-model="forkEnabled" type="checkbox" />
                <span><strong>开放 Fork</strong><small>允许其他用户复制到自己的工作台，并保留来源关系。</small></span>
              </label>
              <label>
                <input v-model="contributionEnabled" type="checkbox" />
                <span><strong>开放 Contribution</strong><small>其他用户可提交修改，由创作者审查后合并为新版本。</small></span>
              </label>
            </div>

            <label class="agreement wide">
              <input v-model="agreementAccepted" type="checkbox" />
              <span>
                我确认拥有提交内容的权利，引用资料与图片来源清晰，并同意按所选协议发布。
                Fork 与 Contribution 会展示创作者、贡献者和来源树信息。
              </span>
            </label>
          </div>

          <footer class="publish-footer">
            <button
              v-if="mode !== 'CONTRIBUTION' && !isOfficialTree && (!publishedTreeId || isPrivateWork)"
              type="button"
              class="private-save"
              :disabled="publishing"
              @click="publishTree('PRIVATE')"
            >
              {{ publishing ? "保存中……" : isPrivateWork ? "更新仅自己可见" : "保存为仅自己可见" }}
            </button>
            <button type="button" :disabled="publishing" @click="publishTree('PUBLIC')">
              {{
                publishing
                  ? "提交中……"
                  : mode === "CONTRIBUTION"
                    ? "提交 Contribution"
                    : isPrivateWork
                      ? "公开发布"
                      : publishedTreeId
                        ? isOfficialTree ? "更新平台维护树" : "更新已发布树相"
                        : isOfficialTree ? "发布平台维护树" : "发布到 Research"
              }}
            </button>
            <button v-if="publishedTreeId && !isPrivateWork && mode !== 'CONTRIBUTION'" type="button" class="secondary" @click="publishAsNewTree">另存为新树</button>
            <RouterLink v-if="publishedTreeId && !isPrivateWork" :to="`/life-tree/${publishedTreeId}`">查看已发布版本</RouterLink>
          </footer>
          <small v-if="mode !== 'CONTRIBUTION' && (!publishedTreeId || isPrivateWork)" class="private-save-hint">
            私密进化树保存在服务器，可跨设备继续编辑；文章和进化树合计最多 5 个。
          </small>
        </div>
      </aside>
    </transition>
    </div>
  </div>
</template>

<style scoped>
.evolution-editor-root {
  min-height: 100vh;
  background: #ffffff;
  color: #243b31;
}

/* 导航栏 + 画板：画板占满导航栏以下的全部空间（白色画板） */
.evolution-editor-page {
  position: fixed;
  top: 64px;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  box-sizing: border-box;
}

.editor-toolbar-area {
  position: relative;
  flex: 1;
  min-height: 0;
}

.editor-canvas {
  width: 100%;
  height: 100%;
}

/* 大树按需加载占位卡 */
.canvas-deferred-panel {
  display: grid;
  width: min(92%, 560px);
  margin: 12vh auto 0;
  padding: 34px 30px;
  border: 1px solid #d5e0d9;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 14px 44px rgba(23, 48, 34, 0.1);
  justify-items: center;
  text-align: center;
  gap: 6px;
}

.canvas-deferred-panel strong {
  color: #183c29;
  font-size: 1.05rem;
}

.canvas-deferred-panel p {
  margin: 4px 0 10px;
  color: #687a70;
  font-size: 0.86rem;
  line-height: 1.7;
}

.canvas-deferred-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.canvas-deferred-actions .primary {
  padding: 9px 18px;
  border: 1px solid #2f806a;
  border-radius: 999px;
  background: #2f806a;
  color: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.canvas-deferred-actions .ghost {
  padding: 9px 18px;
  border: 1px solid #c6d3ca;
  border-radius: 999px;
  background: #fff;
  color: #2f6f5d;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

/* 右下角圆形悬浮按钮 */
.float-actions {
  position: fixed;
  z-index: 40;
  right: 18px;
  bottom: 18px;
  display: grid;
  gap: 10px;
}

.float-button {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border: 1px solid #cfdad3;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.96);
  color: #245d43;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(23, 48, 34, 0.18);
  transition: transform 0.15s ease, background 0.15s ease;
}

.float-button:hover {
  transform: translateY(-2px);
  background: #f1f7f3;
}

.float-button.primary {
  background: #2f806a;
  border-color: #2f806a;
  color: #fff;
}

.float-button.primary:hover { background: #256b58; }

.float-button.active {
  outline: 3px solid rgba(47, 128, 106, 0.3);
}

/* 侧栏面板 */
.editor-side-panel {
  position: fixed;
  z-index: 60;
  top: 78px;
  right: 18px;
  bottom: 18px;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  width: min(430px, 92vw);
  overflow: hidden;
  border: 1px solid #cfdad3;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 18px 60px rgba(23, 48, 34, 0.22);
}

.editor-side-panel.wide { width: min(620px, 94vw); }

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #dce5df;
}

.panel-heading > div { display: grid; min-width: 0; gap: 3px; }
.panel-heading span { color: #1f6b57; font-size: 0.66rem; font-weight: 850; letter-spacing: 0.16em; }
.panel-heading strong { overflow: hidden; color: #193b2e; text-overflow: ellipsis; white-space: nowrap; }

.panel-heading button {
  flex: none;
  padding: 7px 10px;
  border: 1px solid #c6d3ca;
  border-radius: 7px;
  background: #fff;
  color: #245d43;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}

.panel-body {
  overflow-y: auto;
  padding: 18px 16px;
  background: #fbfdfb;
}

.panel-description {
  margin: 0 0 6px;
  color: #52675e;
  font-size: 13px;
  line-height: 1.6;
}

.panel-description.error { color: #b42318; }

.panel-message {
  margin: 0 0 12px;
  padding: 9px 12px;
  border-radius: 8px;
  background: #e8f3ee;
  color: #1f6b57;
  font-size: 13px;
}

.draft-controls { display: grid; gap: 10px; }

.draft-mode-select {
  display: grid;
  gap: 6px;
  padding: 12px;
  border: 1px solid #d4e1d9;
  border-radius: 9px;
  background: #f7faf8;
}

.draft-mode-select span { color: #3b5148; font-size: 0.8rem; font-weight: 750; }
.draft-mode-select select {
  padding: 8px 10px;
  border: 1px solid #cbd7cf;
  border-radius: 7px;
  background: #fff;
  color: #263c33;
  font: inherit;
}

.draft-save-button {
  padding: 10px 14px;
  border: 1px solid #286b49;
  border-radius: 8px;
  background: #286b49;
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.draft-save-button:disabled { opacity: 0.5; cursor: not-allowed; }

.draft-box-link {
  padding: 9px 14px;
  border: 1px solid #9aafa2;
  border-radius: 8px;
  background: #fff;
  color: #315f4d;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
}

/* 发表信息表单 */
.publish-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.publish-grid > label { display: grid; gap: 6px; }

.publish-grid > label > span,
.tag-editor > span {
  color: #3b5148;
  font-size: 0.82rem;
  font-weight: 750;
}

.publish-grid input,
.publish-grid textarea,
.publish-grid select,
.tag-editor input {
  width: 100%;
  padding: 9px 11px;
  border: 1px solid #cbd7cf;
  border-radius: 7px;
  background: #fff;
  color: #263c33;
  font: inherit;
}

.publish-grid textarea { resize: vertical; }

.wide { grid-column: 1 / -1; }

.tag-editor { display: grid; gap: 8px; }
.tag-editor > div { display: flex; }
.tag-editor > div input { border-radius: 7px 0 0 7px; }
.tag-editor > div button {
  padding: 0 18px;
  border: 0;
  border-radius: 0 7px 7px 0;
  background: #2f806a;
  color: #fff;
  cursor: pointer;
}
.tag-editor > div button:disabled { opacity: 0.45; }
.tag-editor p { display: flex; flex-wrap: wrap; gap: 7px; margin: 0; }
.tag-editor p button {
  padding: 5px 9px;
  border: 0;
  border-radius: 999px;
  background: #e6f4ee;
  color: #24634f;
  cursor: pointer;
}

.collaboration-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.collaboration-options label {
  display: flex;
  gap: 10px;
  padding: 13px;
  border: 1px solid #d4e1d9;
  border-radius: 9px;
  background: #f7faf8;
  cursor: pointer;
}

.collaboration-options input,
.agreement input { width: auto; margin-top: 3px; accent-color: #2f806a; }
.collaboration-options span { display: grid; gap: 4px; }
.collaboration-options small { color: #718078; line-height: 1.5; }

.agreement {
  display: flex !important;
  grid-template-columns: auto 1fr;
  align-items: flex-start;
  padding: 14px;
  border-top: 1px solid #e5ebe7;
  color: #576b62;
  font-size: 0.84rem;
  line-height: 1.6;
}

.publish-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
}

.publish-footer button {
  padding: 10px 17px;
  border: 1px solid #286b49;
  border-radius: 8px;
  background: #286b49;
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.publish-footer button.secondary { background: #fff; color: #286b49; }
.publish-footer button:disabled { opacity: 0.5; cursor: not-allowed; }
.publish-footer a { margin-left: auto; color: #0969da; }

.private-save-hint {
  display: block;
  margin-top: 10px;
  color: #718078;
  font-size: 0.74rem;
}

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  transform: translateX(24px);
  opacity: 0;
}

@media (max-width: 720px) {
  .evolution-editor-page { top: 62px; }
  .float-actions { right: 12px; bottom: 12px; }
  .editor-side-panel,
  .editor-side-panel.wide {
    top: 62px;
    right: 0;
    bottom: 0;
    left: 0;
    width: auto;
    border-radius: 0;
  }
  .publish-grid,
  .collaboration-options { grid-template-columns: 1fr; }
  .wide { grid-column: auto; }
  .publish-footer a { width: 100%; margin-left: 0; }
}
</style>
