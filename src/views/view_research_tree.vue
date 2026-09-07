<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import navBar from "@/components/navBar.vue";
import EvolutionTreeViewer from "@/components/EvolutionTreeViewer.vue";
import HtmlTreeRenderer from "@/components/HtmlTreeRenderer.vue";
import {
  createOfficialTreeRequest,
  deleteTree,
  fetchOfficialTreeRequest,
  fetchTree,
  reviewOfficialTreeRequest,
  withdrawOfficialTreeRequest,
} from "@/services/trees";
import { normalizeMindMapDocument } from "@/utils/evolutionMindMapModel";
import { formatDateTime } from "@/utils/date";
import { platformTreeLabel } from "@/utils/treeLabels";
import ContentInteractions from "@/components/ContentInteractions.vue";
import ContentSourcesDisplay from "@/components/ContentSourcesDisplay.vue";
import { useUserStore } from "@/stores/user";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const tree = ref(null);
const loading = ref(true);
const errorMessage = ref("");
const deleting = ref(false);
const officialRequest = ref(null);
const officialRequestBusy = ref(false);

// 渲染模式：'original' = 原方案 (simple-mind-map)，'html' = HTML 节点渲染
const renderMode = ref("original");
const availableModes = [
  { value: "original", label: "原方案（SVG渲染）" },
  { value: "html", label: "真实HTML渲染" },
];

const document = computed(() =>
  tree.value?.document ? normalizeMindMapDocument(tree.value.document) : null,
);
const platformBadge = computed(() => platformTreeLabel(tree.value));
const canEdit = computed(() =>
  Boolean(
    tree.value &&
    userStore.user &&
    (tree.value.creatorUid === userStore.user.uid ||
      (tree.value.kind === "OFFICIAL" && userStore.isSiteOwner)),
  ),
);
const editTarget = computed(() => ({
  path: "/evolution-tree",
  query: { edit: tree.value?.uid || tree.value?.id },
}));
const isCreator = computed(() =>
  Boolean(userStore.user && tree.value?.creatorUid === userStore.user.uid),
);
const canFork = computed(() =>
  Boolean(tree.value?.forkEnabled && userStore.user && !isCreator.value),
);
const canContribute = computed(() =>
  Boolean(
    tree.value?.contributionEnabled && userStore.user && !isCreator.value,
  ),
);
const canReviewContributions = computed(() =>
  Boolean(tree.value && userStore.user && isCreator.value),
);
const canDelete = computed(() =>
  Boolean(
    tree.value &&
    userStore.user &&
    (tree.value.creatorUid === userStore.user.uid || userStore.isSiteOwner),
  ),
);
const canApplyForOfficial = computed(() =>
  Boolean(
    tree.value?.kind === "USER" &&
    userStore.user &&
    !tree.value.platformRecommended &&
    (isCreator.value ||
      userStore.user.role === "ADMIN" ||
      userStore.isSiteOwner) &&
    officialRequest.value?.status !== "PENDING",
  ),
);

async function loadOfficialRequest() {
  officialRequest.value = null;
  if (tree.value?.kind !== "USER" || !userStore.isLoggedIn) return;
  try {
    officialRequest.value = await fetchOfficialTreeRequest(
      tree.value.uid || tree.value.id,
    );
  } catch (error) {
    if (error?.status !== 401 && error?.status !== 403) {
      console.warn("平台推荐申请状态加载失败", error);
    }
  }
}

async function applyForOfficial() {
  if (!canApplyForOfficial.value || officialRequestBusy.value) return;
  const message = window.prompt(
    isCreator.value
      ? "填写自荐说明（可留空）：\n提交后由平台管理员审核；通过后直接推荐当前树，不会生成副本。"
      : "给作者的提名说明（可留空）：\n作者同意后直接推荐当前树，不会生成副本。",
    "",
  );
  if (message === null) return;
  officialRequestBusy.value = true;
  try {
    officialRequest.value = await createOfficialTreeRequest(
      tree.value.uid || tree.value.id,
      message,
    );
  } catch (error) {
    window.alert(`提交申请失败：${error.message || "未知错误"}`);
  } finally {
    officialRequestBusy.value = false;
  }
}

async function reviewOfficialRequest(action) {
  if (!officialRequest.value?.canReview || officialRequestBusy.value) return;
  const isReject = action === "REJECT";
  const note = window.prompt(
    isReject ? "可以填写拒绝原因（可留空）：" : "可以填写同意说明（可留空）：",
    "",
  );
  if (note === null) return;
  const confirmed =
    isReject ||
    window.confirm(
      '通过后会直接给原树增加"平台推荐"标识，仍由原作者维护，不会生成副本。确定通过吗？',
    );
  if (!confirmed) return;
  officialRequestBusy.value = true;
  try {
    const payload = await reviewOfficialTreeRequest(
      tree.value.uid || tree.value.id,
      officialRequest.value.id,
      action,
      note,
    );
    officialRequest.value = payload.request;
    if (payload.tree) tree.value = payload.tree;
  } catch (error) {
    window.alert(`处理申请失败：${error.message || "未知错误"}`);
  } finally {
    officialRequestBusy.value = false;
  }
}

async function withdrawOfficialApplication() {
  if (!officialRequest.value?.canWithdraw || officialRequestBusy.value) return;
  if (!window.confirm("确定撤回这项申请吗？")) return;
  officialRequestBusy.value = true;
  try {
    await withdrawOfficialTreeRequest(
      tree.value.uid || tree.value.id,
      officialRequest.value.id,
    );
    officialRequest.value = null;
  } catch (error) {
    window.alert(`撤回申请失败：${error.message || "未知错误"}`);
  } finally {
    officialRequestBusy.value = false;
  }
}

async function removeTree() {
  if (!canDelete.value || !tree.value || deleting.value) return;
  const confirmed = window.confirm(
    `确定删除进化树"${tree.value.title}"吗？\n\n树 UID ${tree.value.uid || ""} 会永久保留，删除后不再公开显示。`,
  );
  if (!confirmed) return;
  deleting.value = true;
  try {
    await deleteTree(tree.value.id);
    await router.push(
      tree.value.kind === "OFFICIAL"
        ? { path: "/research", query: { type: "tree", kind: "official" } }
        : "/user-space",
    );
  } catch (error) {
    window.alert(`删除进化树失败：${error.message || "未知错误"}`);
  } finally {
    deleting.value = false;
  }
}

async function loadTree() {
  await userStore.initialize();
  loading.value = true;
  errorMessage.value = "";
  const id = String(route.params.id || "");
  tree.value = null;
  try {
    tree.value = await fetchTree(id);
    await loadOfficialRequest();
  } catch (error) {
    tree.value = null;
    errorMessage.value = error.message || "进化树加载失败";
  } finally {
    loading.value = false;
  }
}

watch(() => route.params.id, loadTree, { immediate: true });
</script>

<template>
  <navBar />
  <div class="tree-view-layout">
    <!-- 顶部固定区域：作品信息 -->
    <header v-if="tree" class="top-fixed-area">
      <div class="tree-view-heading">
        <div>
          <span v-if="platformBadge" class="official-tree-badge">{{
            platformBadge
          }}</span>
          <h1>{{ tree.title }}</h1>
          <p>{{ tree.description || "暂无简介" }}</p>
          <!-- 作者/管理员快捷操作：编辑 / 删除 -->
          <div v-if="canEdit || canDelete" class="heading-owner-actions">
            <RouterLink v-if="canEdit" class="owner-action edit" :to="editTarget">编辑</RouterLink>
            <button
              v-if="canDelete"
              class="owner-action delete"
              type="button"
              :disabled="deleting"
              @click="removeTree"
            >
              {{ deleting ? "删除中…" : "删除" }}
            </button>
          </div>
        </div>
        <dl>
          <div>
            <dt>UID</dt>
            <dd>{{ tree.uid }}</dd>
          </div>
          <div>
            <dt>作者</dt>
            <dd>
              <RouterLink :to="`/users/${tree.creatorUid}`">{{
                tree.creator
              }}</RouterLink>
            </dd>
          </div>
          <div>
            <dt>节点</dt>
            <dd>{{ tree.nodeCount }}</dd>
          </div>
          <div>
            <dt>协议</dt>
            <dd>{{ tree.license }}</dd>
          </div>
          <div>
            <dt>更新</dt>
            <dd>{{ formatDateTime(tree.updatedAt) }}</dd>
          </div>
          <div>
            <dt>Fork</dt>
            <dd>
              {{ tree.forkCount }} · {{ tree.forkEnabled ? "开放" : "关闭" }}
            </dd>
          </div>
          <div>
            <dt>Contribution</dt>
            <dd>
              {{ tree.contributionCount }} ·
              {{ tree.contributionEnabled ? "开放" : "关闭" }}
            </dd>
          </div>
        </dl>
      </div>
      <div class="tree-actions-bar">
        <RouterLink
          class="tree-art-entry"
          :to="{
            path: `/art-tree/${tree.uid || tree.id}`,
            query: { style: 'botanical' },
          }"
        >
          艺术展示
        </RouterLink>
        <RouterLink v-if="canEdit" class="tree-edit-entry" :to="editTarget">
          编辑树相
        </RouterLink>
        <RouterLink
          v-if="canFork"
          class="tree-collaboration-entry"
          :to="{
            path: '/evolution-tree',
            query: { fork: tree.uid || tree.id },
          }"
        >
          Fork 到工作台
        </RouterLink>
        <RouterLink
          v-if="canContribute"
          class="tree-collaboration-entry contribution"
          :to="{
            path: '/evolution-tree',
            query: { contribute: tree.uid || tree.id },
          }"
        >
          参与完善
        </RouterLink>
        <RouterLink
          v-if="canReviewContributions"
          class="tree-review-entry"
          :to="{
            path: '/tree-contributions',
            query: { tree: tree.uid || tree.id },
          }"
        >
          贡献审查
        </RouterLink>
        <button
          v-if="canApplyForOfficial"
          class="tree-official-entry"
          type="button"
          :disabled="officialRequestBusy"
          @click="applyForOfficial"
        >
          {{
            officialRequestBusy
              ? "提交中…"
              : isCreator
                ? "自荐为平台推荐树"
                : "提名为平台推荐树"
          }}
        </button>
        <div v-if="officialRequest" class="official-request-status">
          <strong>
            平台推荐申请：
            {{
              officialRequest.status === "PENDING"
                ? officialRequest.requestType === "SELF_RECOMMENDATION"
                  ? "等待管理员审核"
                  : "等待作者确认"
                : officialRequest.status === "APPROVED"
                  ? "已通过"
                  : officialRequest.status === "REJECTED"
                    ? "未通过"
                    : "已撤回"
            }}
          </strong>
          <small v-if="officialRequest.message"
            >申请说明：{{ officialRequest.message }}</small
          >
          <small v-if="officialRequest.responseNote"
            >审核说明：{{ officialRequest.responseNote }}</small
          >
          <div v-if="officialRequest.canReview">
            <button
              type="button"
              :disabled="officialRequestBusy"
              @click="reviewOfficialRequest('APPROVE')"
            >
              通过并推荐原树
            </button>
            <button
              class="reject"
              type="button"
              :disabled="officialRequestBusy"
              @click="reviewOfficialRequest('REJECTED')"
            >
              拒绝
            </button>
          </div>
          <button
            v-else-if="officialRequest.canWithdraw"
            class="withdraw"
            type="button"
            :disabled="officialRequestBusy"
            @click="withdrawOfficialApplication"
          >
            撤回申请
          </button>
        </div>
        <button
          v-if="canDelete"
          class="tree-delete-entry"
          type="button"
          :disabled="deleting"
          @click="removeTree"
        >
          {{ deleting ? "删除中…" : "删除树相" }}
        </button>
      </div>
    </header>

    <!-- 主体区域：画布在上，评论在下 -->
    <div class="main-layout">
      <!-- 渲染模式切换 -->
      <div v-if="document" class="render-mode-switch">
        <span class="render-mode-label">渲染模式：</span>
        <div class="render-mode-options">
          <label
            v-for="mode in availableModes"
            :key="mode.value"
            class="render-mode-option"
            :class="{ active: renderMode === mode.value }"
          >
            <input type="radio" :value="mode.value" v-model="renderMode" />
            <span>{{ mode.label }}</span>
          </label>
        </div>
      </div>

      <!-- 作品来源信息 -->
      <section v-if="tree" class="tree-provenance">
        <div v-if="tree.forkedFrom">
          <span>{{ tree.kind === "OFFICIAL" ? "来源" : "Forked from" }}</span>
          <RouterLink
            :to="`/life-tree/${tree.forkedFrom.uid || tree.forkedFrom.id}`"
          >
            {{ tree.forkedFrom.creator }} / {{ tree.forkedFrom.title }}
          </RouterLink>
        </div>
        <div v-if="tree.contributors?.length">
          <span>Contributors</span>
          <p>
            <RouterLink
              v-for="contributor in tree.contributors"
              :key="contributor.uid"
              :to="`/users/${contributor.uid}`"
            >
              {{ contributor.name }}
            </RouterLink>
          </p>
        </div>
        <div v-if="tree.tags?.length">
          <span>关键词 / 标签</span>
          <p>
            <i v-for="tag in tree.tags" :key="tag">#{{ tag }}</i>
          </p>
        </div>
        <div v-if="tree.changeNote">
          <span>最近提交说明</span>
          <p>{{ tree.changeNote }}</p>
        </div>
      </section>

      <!-- 树的主体 -->
      <div class="tree-main-content">
        <!-- 原方案：SVG 渲染 -->
        <div
          v-if="document && renderMode === 'original'"
          class="tree-view-card"
        >
          <p v-if="loading && !tree" class="tree-state">正在加载进化树……</p>
          <p v-else-if="errorMessage && !tree" class="tree-state error">
            {{ errorMessage }}
          </p>
          <EvolutionTreeViewer
            v-if="document"
            :key="`${tree.id}:${tree.version || 1}`"
            :model-value="document"
            :file-owner="tree.title"
            :current-tree-id="tree.uid || tree.id"
          />
        </div>

        <!-- 新方案：HTML 渲染 -->
        <div v-if="document && renderMode === 'html'" class="html-tree-section">
          <HtmlTreeRenderer
            :key="`html-${tree.id}:${tree.version || 1}`"
            :model-value="document"
            :file-owner="tree.title"
            :current-tree-id="tree.uid || tree.id"
            class="html-renderer"
          />
        </div>
      </div>

      <!-- 参考文献区 -->
      <ContentSourcesDisplay
        v-if="tree"
        class="tree-sources"
        :citations="document?.citations || []"
        :references-text="tree.referencesText"
        :image-credits-text="tree.imageCreditsText"
        anchor-prefix="tree-citation"
      />

      <!-- 评论区（在画布下面） -->
      <section v-if="tree" class="comments-section">
        <div class="comments-header">
          <span>DISCUSSION</span>
        </div>
        <div class="comments-content">
          <ContentInteractions :content-id="tree.uid || tree.id" type="tree" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.tree-view-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-top: 64px;
  box-sizing: border-box;
  background: #f3f7f3;
}

/* 顶部固定区域 */
.top-fixed-area {
  flex-shrink: 0;
  background: #fff;
  border-bottom: 1px solid #d5dfd8;
  padding: 16px 20px;
  overflow: hidden;
}

.tree-view-heading {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  max-width: 1600px;
  margin: 0 auto 12px;
  color: #294236;
}

/* 标题旁的作者/管理员快捷操作 */
.heading-owner-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.owner-action {
  padding: 5px 13px;
  border: 1px solid #c6d3ca;
  border-radius: 999px;
  background: #fff;
  color: #2f6f5d;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
}

.owner-action:hover {
  border-color: #2f806a;
  color: #2f806a;
}

.owner-action.delete {
  border-color: #dcb9b6;
  color: #a33d37;
}

.owner-action.delete:hover {
  border-color: #a33d37;
}

.owner-action:disabled {
  opacity: 0.6;
  cursor: default;
}

.tree-view-heading span {
  color: #65806e;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.tree-view-heading .official-tree-badge {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 999px;
  background: #e5f0ff;
  color: #315f9c;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.tree-view-heading h1 {
  margin: 4px 0 8px;
  color: #153727;
  font-size: 20px;
}

.tree-view-heading p {
  max-width: 760px;
  margin: 0;
  color: #607068;
  font-size: 13px;
}

.tree-view-heading dl {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px 20px;
  margin: 0;
}

.tree-view-heading dl div {
  min-width: 90px;
}

.tree-view-heading dt {
  color: #75847b;
  font-size: 11px;
}

.tree-view-heading dd {
  margin: 2px 0 0;
  font-size: 13px;
}

.tree-actions-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  max-width: 1600px;
  margin: 0 auto;
}

.tree-edit-entry {
  align-self: center;
  padding: 6px 12px;
  border: 1px solid #2f806a;
  border-radius: 6px;
  background: #2f806a;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}

.tree-edit-entry:hover {
  background: #256b58;
  color: #fff;
  text-decoration: none;
}

.tree-art-entry {
  align-self: center;
  padding: 6px 12px;
  border: 1px solid #6670aa;
  border-radius: 6px;
  background: linear-gradient(135deg, #eff4e9, #eceafa);
  color: #4e578d;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}

.tree-art-entry:hover {
  border-color: #4e578d;
  color: #363e72;
  text-decoration: none;
}

.tree-collaboration-entry,
.tree-review-entry {
  align-self: center;
  padding: 6px 12px;
  border: 1px solid #6e5aa5;
  border-radius: 6px;
  background: #fff;
  color: #604b98;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}

.tree-collaboration-entry.contribution {
  border-color: #277a6a;
  color: #277a6a;
}

.tree-review-entry {
  border-color: #a6742b;
  color: #8b5b18;
}

.tree-delete-entry {
  align-self: center;
  padding: 6px 12px;
  border: 1px solid #d4aaa7;
  border-radius: 6px;
  background: #fff;
  color: #a13f39;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.tree-official-entry {
  align-self: center;
  padding: 6px 12px;
  border: 1px solid #315f9c;
  border-radius: 6px;
  background: #fff;
  color: #315f9c;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.tree-official-entry:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.official-request-status {
  display: grid;
  min-width: min(100%, 280px);
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid #ccd7e5;
  border-radius: 8px;
  background: #f7faff;
}

.official-request-status strong {
  color: #31557f;
  font-size: 12px;
}

.official-request-status small {
  color: #627184;
  line-height: 1.45;
}

.official-request-status > div {
  display: flex;
  gap: 7px;
}

.official-request-status button,
.official-request-status a {
  width: max-content;
  padding: 5px 9px;
  border: 1px solid #3f7565;
  border-radius: 6px;
  background: #fff;
  color: #2e6756;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
}

.official-request-status button.reject,
.official-request-status button.withdraw {
  border-color: #d5aaa7;
  color: #a13f39;
}

.tree-delete-entry:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* 主体布局 */
.main-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 20px;
  gap: 16px;
}

/* 评论区 */
.comments-section {
  max-width: 1480px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #d5dfd8;
  border-radius: 14px;
  overflow: hidden;
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #d5dfd8;
  background: #f9faf9;
}

.comments-header span {
  font-size: 12px;
  font-weight: 700;
  color: #607068;
  letter-spacing: 0.05em;
}

.comments-content {
  padding: 16px;
}

/* 渲染模式切换 */
.render-mode-switch {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 8px 14px;
  background: #fff;
  border: 1px solid #d5dfd8;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  max-width: 1480px;
  margin-left: auto;
  margin-right: auto;
}

.render-mode-label {
  font-size: 13px;
  font-weight: 600;
  color: #607068;
}

.render-mode-options {
  display: flex;
  gap: 8px;
}

.render-mode-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border: 1.5px solid #d5dfd8;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #607068;
  background: #fff;
  transition: all 0.2s;
}

.render-mode-option:hover {
  border-color: #2f806a;
  color: #2f806a;
}

.render-mode-option.active {
  border-color: #2f806a;
  background: #e8f3ee;
  color: #2b6b57;
}

.render-mode-option input {
  display: none;
}

.render-mode-option span {
  font-weight: 500;
}

/* 作品来源信息 */
.tree-provenance {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  max-width: 1480px;
  margin: 0 auto 14px;
  padding: 13px 16px;
  border: 1px solid #d7e1da;
  border-radius: 10px;
  background: #fff;
}

.tree-provenance > div {
  display: flex;
  align-items: center;
  gap: 9px;
}

.tree-provenance span {
  color: #738078;
  font-size: 0.72rem;
  font-weight: 750;
  text-transform: uppercase;
}

.tree-provenance p {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 0;
}

.tree-provenance a {
  color: #2f6f5d;
  text-decoration: none;
}

.tree-provenance i {
  padding: 3px 7px;
  border-radius: 99px;
  background: #e8f3ee;
  color: #2b6b57;
  font-size: 0.76rem;
  font-style: normal;
}

/* 树主体 */
.tree-main-content {
  max-width: 1480px;
  margin: 0 auto;
}

.tree-view-card {
  width: 100%;
  height: calc(100vh - 300px);
  min-height: 400px;
  overflow: hidden;
  border: 1px solid #d5dfd8;
  border-radius: 14px;
  background: #fff;
  position: relative;
}

/* HTML 树区域 */
.html-tree-section {
  width: 100%;
  min-height: 400px;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #d5dfd8;
  padding: 20px;
  box-sizing: border-box;
}

.html-renderer {
  width: 100%;
  height: auto;
  display: block;
}

/* 参考文献区 */
.tree-sources {
  max-width: 1480px;
  margin: 20px auto 0;
  padding: 20px;
  border: 1px solid #d7e1da;
  border-radius: 10px;
  background: #fff;
}

.tree-state {
  display: grid;
  height: 100%;
  place-items: center;
  color: #607068;
}

.tree-state.error {
  color: #b04840;
}

@media (max-width: 768px) {
  .tree-view-heading {
    flex-direction: column;
    gap: 12px;
  }

  .tree-view-heading dl {
    justify-content: flex-start;
  }

  .tree-view-card {
    height: 500px;
  }
}
</style>
