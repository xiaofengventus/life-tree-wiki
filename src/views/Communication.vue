<script setup>
import { computed, onMounted, ref } from "vue";
import navBar from "@/components/navBar.vue";
import EvolutionTreeViewer from "@/components/EvolutionTreeViewer.vue";
import {
  createInitialMindMapDocument,
  normalizeMindMapDocument,
} from "@/utils/evolutionMindMapModel";
import { fetchTree, fetchTreeList } from "@/services/trees";
import { useUserStore } from "@/stores/user";
import { formatDateTime } from "@/utils/date";
import { platformTreeLabel } from "@/utils/treeLabels";
import ContentInteractions from "@/components/ContentInteractions.vue";
import ContentSourcesDisplay from "@/components/ContentSourcesDisplay.vue";

const userStore = useUserStore();
const document = ref(createInitialMindMapDocument());
const activeTree = ref(null);
const loading = ref(true);
const errorMessage = ref("");
const treeOptions = ref([]);
const selectedTreeKey = ref("");
const treeBaseUrl = `${import.meta.env.BASE_URL}trees/`;
const selectedTree = computed(() =>
  treeOptions.value.find((tree) => tree.key === selectedTreeKey.value),
);
const editOfficialTreeLink = computed(() => {
  if (!selectedTree.value || selectedTree.value.source !== "database") return "";
  const isAuthor = selectedTree.value.creatorUid === userStore.user?.uid;
  const canEditLegacyTree = selectedTree.value.kind === "OFFICIAL" && userStore.isSiteOwner;
  return isAuthor || canEditLegacyTree
    ? `/evolution-tree?edit=${encodeURIComponent(selectedTree.value.id)}`
    : "";
});
const isCreator = computed(() => Boolean(
  userStore.user && activeTree.value?.creatorUid === userStore.user.uid,
));
const canFork = computed(() => Boolean(
  activeTree.value?.forkEnabled && userStore.user && !isCreator.value,
));
const canContribute = computed(() => Boolean(
  activeTree.value?.contributionEnabled && userStore.user && !isCreator.value,
));
const canReviewContributions = computed(() => Boolean(
  activeTree.value &&
  userStore.user &&
  isCreator.value,
));
const activeTreeId = computed(() =>
  activeTree.value?.uid || activeTree.value?.id || "",
);
const activePlatformLabel = computed(() => platformTreeLabel(activeTree.value));

function normalizeCatalogEntry(entry, index) {
  const file = typeof entry === "string" ? entry : entry?.file;
  if (!file) return null;
  try {
    const base = new URL(treeBaseUrl, window.location.origin);
    const url = new URL(file, base);
    if (
      url.origin !== base.origin ||
      !url.pathname.startsWith(base.pathname) ||
      !url.pathname.toLowerCase().endsWith(".xur")
    )
      return null;
    return {
      id: typeof entry === "object" && entry.id ? entry.id : `tree-${index}`,
      name:
        (typeof entry === "object" && entry.name) ||
        decodeURIComponent(
          url.pathname
            .split("/")
            .pop()
            .replace(/\.xur$/i, ""),
        ),
      url: url.href,
      key: url.href,
      source: "static",
    };
  } catch {
    return null;
  }
}

async function loadTreeCatalog() {
  const options = [];
  try {
    const officialTrees = await fetchTreeList("OFFICIAL");
    options.push(...officialTrees.map((tree) => ({
      ...tree,
      name: tree.title,
      key: `database:${tree.id}`,
      source: "database",
    })));
  } catch (error) {
    console.warn("D1 平台推荐树目录加载失败，将使用静态目录", error);
  }
  try {
    const response = await fetch(`${treeBaseUrl}index.json`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const entries = Array.isArray(payload) ? payload : payload.trees;
    options.push(...(Array.isArray(entries) ? entries : [])
      .map(normalizeCatalogEntry)
      .filter(Boolean));
  } catch (error) {
    console.error("进化树目录加载失败，将使用默认树", error);
  }

  if (!options.length) {
    const fallback = normalizeCatalogEntry({ name: "LUCA 生命之树", file: "LUCA.xur" }, 0);
    if (fallback) options.push(fallback);
  }
  treeOptions.value = options;
  selectedTreeKey.value = treeOptions.value[0]?.key || "";
  await loadSelectedTree();
}

async function loadSelectedTree() {
  if (!selectedTree.value) return;
  loading.value = true;
  errorMessage.value = "";
  activeTree.value = null;
  try {
    if (selectedTree.value.source === "database") {
      const tree = await fetchTree(selectedTree.value.id);
      activeTree.value = tree;
      document.value = normalizeMindMapDocument(tree.document);
    } else {
      const response = await fetch(selectedTree.value.url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      document.value = normalizeMindMapDocument(await response.json());
    }
  } catch (error) {
    console.error(error);
    errorMessage.value = "平台推荐树暂时无法加载";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await userStore.initialize();
  await loadTreeCatalog();
});
</script>

<template>
  <navBar />
  <main class="communication-page">
    <header class="page-heading">
      <div>
        <span>PLATFORM LIFE TREE</span>
        <h1>生命时序平台树</h1>
      </div>
      <div class="heading-actions">
        <p>拖动画布浏览，使用 Ctrl + 滚轮缩放，点击节点文字查看资料。</p>
        <RouterLink
          v-if="userStore.role === 'ADMIN' || userStore.isSiteOwner"
          class="official-admin-link"
          to="/admin/official-trees"
        >
          推荐审核
        </RouterLink>
        <RouterLink v-if="editOfficialTreeLink" class="official-admin-link" :to="editOfficialTreeLink">
          编辑当前原树
        </RouterLink>
        <label class="tree-picker">
          <span>选择进化树</span>
          <select
            v-model="selectedTreeKey"
            :disabled="loading || treeOptions.length < 2"
            @change="loadSelectedTree"
          >
            <option
              v-for="tree in treeOptions"
              :key="tree.id"
              :value="tree.key"
            >
              {{ tree.name }}
            </option>
          </select>
        </label>
      </div>
    </header>

    <section v-if="activeTree" class="official-tree-info">
      <div class="official-tree-summary">
        <div>
          <span>{{ activePlatformLabel }}</span>
          <h2>{{ activeTree.title }}</h2>
          <p>{{ activeTree.description || "暂无简介" }}</p>
        </div>
        <dl>
          <div><dt>UID</dt><dd>{{ activeTree.uid }}</dd></div>
          <div>
            <dt>作者</dt>
            <dd>
              <RouterLink :to="`/users/${activeTree.creatorUid}`">
                {{ activeTree.creator }}
              </RouterLink>
            </dd>
          </div>
          <div><dt>节点</dt><dd>{{ activeTree.nodeCount }}</dd></div>
          <div><dt>协议</dt><dd>{{ activeTree.license }}</dd></div>
          <div><dt>更新</dt><dd>{{ formatDateTime(activeTree.updatedAt) }}</dd></div>
          <div>
            <dt>Fork</dt>
            <dd>{{ activeTree.forkCount }} · {{ activeTree.forkEnabled ? "开放" : "关闭" }}</dd>
          </div>
          <div>
            <dt>Contribution</dt>
            <dd>{{ activeTree.contributionCount }} · {{ activeTree.contributionEnabled ? "开放" : "关闭" }}</dd>
          </div>
        </dl>
      </div>

      <div class="official-tree-actions">
        <RouterLink class="primary-action" :to="`/life-tree/${activeTreeId}`">
          打开完整详情
        </RouterLink>
        <RouterLink
          v-if="canFork"
          :to="{ path: '/evolution-tree', query: { fork: activeTreeId } }"
        >
          Fork 到工作台
        </RouterLink>
        <RouterLink
          v-if="canContribute"
          :to="{ path: '/evolution-tree', query: { contribute: activeTreeId } }"
        >
          参与完善
        </RouterLink>
        <RouterLink
          v-if="canReviewContributions"
          :to="{ path: '/tree-contributions', query: { tree: activeTreeId } }"
        >
          贡献审查
        </RouterLink>
      </div>

      <div
        v-if="
          activeTree.forkedFrom ||
          activeTree.contributors?.length ||
          activeTree.tags?.length ||
          activeTree.changeNote
        "
        class="official-tree-provenance"
      >
        <div v-if="activeTree.forkedFrom">
          <span>Forked from</span>
          <RouterLink :to="`/life-tree/${activeTree.forkedFrom.uid || activeTree.forkedFrom.id}`">
            {{ activeTree.forkedFrom.creator }} / {{ activeTree.forkedFrom.title }}
          </RouterLink>
        </div>
        <div v-if="activeTree.contributors?.length">
          <span>Contributors</span>
          <p>
            <RouterLink
              v-for="contributor in activeTree.contributors"
              :key="contributor.uid"
              :to="`/users/${contributor.uid}`"
            >
              {{ contributor.name }}
            </RouterLink>
          </p>
        </div>
        <div v-if="activeTree.tags?.length">
          <span>关键词 / 标签</span>
          <p><i v-for="tag in activeTree.tags" :key="tag">#{{ tag }}</i></p>
        </div>
        <div v-if="activeTree.changeNote">
          <span>最近提交说明</span>
          <p>{{ activeTree.changeNote }}</p>
        </div>
      </div>
    </section>

    <section
      v-else-if="!loading && !errorMessage && selectedTree?.source === 'static'"
      class="static-tree-notice"
    >
      当前为静态 .xur 展示树；发布为用户树并取得树 UID 后，才可申请平台推荐并使用
      Fork、Contribution、评论和收藏接口。
    </section>

    <section class="communication-tree-card">
      <div v-if="loading" class="tree-status">
        <i></i>
        <span>正在加载平台推荐树……</span>
      </div>
      <div v-else-if="errorMessage" class="tree-status error">
        {{ errorMessage }}
      </div>
      <EvolutionTreeViewer
        v-else
        :key="selectedTreeKey"
        :model-value="document"
        :file-owner="selectedTree?.name || '生命时序平台树'"
        :current-tree-id="activeTreeId"
      />
    </section>
    <ContentSourcesDisplay
      v-if="activeTree"
      class="official-tree-sources"
      :citations="document?.citations || []"
      :references-text="activeTree.referencesText"
      :image-credits-text="activeTree.imageCreditsText"
      anchor-prefix="tree-citation"
    />
    <ContentInteractions
      v-if="activeTree"
      class="official-tree-interactions"
      :content-id="activeTreeId"
      type="tree"
    />
  </main>
</template>

<style scoped>
.communication-page {
  min-height: 100vh;
  padding: 84px 22px 24px;
  background:
    radial-gradient(
      circle at 15% 10%,
      rgba(116, 162, 129, 0.16),
      transparent 30%
    ),
    #f3f7f3;
}

.page-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  width: min(100%, 1560px);
  margin: 0 auto 14px;
  color: #294236;
}

.page-heading span {
  color: #65806e;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.page-heading h1 {
  margin: 3px 0 0;
  color: #153727;
  font-size: clamp(22px, 3vw, 34px);
}

.heading-actions {
  display: flex;
  align-items: end;
  gap: 14px;
  margin-left: 24px;
}

.heading-actions p {
  margin: 0 0 8px;
  color: #6c7d72;
  font-size: 13px;
}

.official-admin-link {
  margin-bottom: 7px;
  color: #176b43;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.tree-picker {
  display: grid;
  gap: 4px;
  color: #65806e;
  font-size: 11px;
}

.tree-picker select {
  min-width: 210px;
  min-height: 36px;
  padding: 6px 32px 6px 10px;
  border: 1px solid #c7d5cb;
  border-radius: 8px;
  background: #ffffff;
  color: #294236;
  font: inherit;
  font-size: 13px;
}

.tree-picker select:disabled {
  cursor: default;
  opacity: 0.72;
}

.communication-tree-card {
  width: min(100%, 1560px);
  height: calc(100vh - 300px);
  min-height: 600px;
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid rgba(42, 91, 60, 0.16);
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(24, 53, 35, 0.11);
}

.official-tree-info,
.static-tree-notice,
.official-tree-interactions {
  width: min(100%, 1560px);
  margin-right: auto;
  margin-left: auto;
}
.official-tree-sources{width:min(100%,1480px);margin:20px auto 0;padding:20px;border:1px solid #d7e1da;border-radius:10px;background:#fff}

.official-tree-info {
  margin-bottom: 14px;
  padding: 16px 18px;
  border: 1px solid #d5dfd8;
  border-radius: 12px;
  background: #ffffff;
  color: #294236;
}

.official-tree-summary {
  display: flex;
  justify-content: space-between;
  gap: 24px;
}

.official-tree-summary > div:first-child {
  min-width: 240px;
}

.official-tree-summary span,
.official-tree-provenance span {
  color: #718078;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.official-tree-summary h2 {
  margin: 3px 0 5px;
  color: #153727;
}

.official-tree-summary p {
  margin: 0;
  color: #607068;
}

.official-tree-summary dl {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px 20px;
  margin: 0;
}

.official-tree-summary dl div {
  min-width: 86px;
}

.official-tree-summary dt {
  color: #75847b;
  font-size: 11px;
}

.official-tree-summary dd {
  margin: 2px 0 0;
  font-size: 13px;
}

.official-tree-summary a,
.official-tree-provenance a {
  color: #2f6f5d;
  text-decoration: none;
}

.official-tree-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 14px;
  padding-top: 13px;
  border-top: 1px solid #e5ece7;
}

.official-tree-actions a {
  padding: 8px 13px;
  border: 1px solid #6e5aa5;
  border-radius: 8px;
  background: #ffffff;
  color: #604b98;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.official-tree-actions .primary-action {
  border-color: #2f806a;
  background: #2f806a;
  color: #ffffff;
}

.official-tree-provenance {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 24px;
  margin-top: 13px;
}

.official-tree-provenance > div {
  display: flex;
  align-items: center;
  gap: 9px;
}

.official-tree-provenance p {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 0;
}

.official-tree-provenance i {
  padding: 3px 7px;
  border-radius: 99px;
  background: #e8f3ee;
  color: #2b6b57;
  font-size: 12px;
  font-style: normal;
}

.static-tree-notice {
  box-sizing: border-box;
  margin-bottom: 14px;
  padding: 12px 15px;
  border: 1px solid #e4d4a8;
  border-radius: 10px;
  background: #fffaf0;
  color: #785d20;
  font-size: 13px;
}

.official-tree-interactions {
  margin-top: 20px;
}

.tree-status {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #5d6d60;
}

.tree-status i {
  width: 22px;
  height: 22px;
  border: 2px solid #c9d7ce;
  border-top-color: #286b49;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.tree-status.error {
  color: #b04840;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 720px) {
  .communication-page {
    padding: 74px 8px 8px;
  }

  .page-heading {
    display: block;
    padding: 0 8px;
  }

  .heading-actions p {
    display: none;
  }

  .heading-actions {
    flex-wrap: wrap;
    margin-left: 12px;
    margin-top: 10px;
  }

  .tree-picker span {
    display: none;
  }

  .tree-picker select {
    min-width: 150px;
    max-width: 48vw;
  }

  .communication-tree-card {
    height: calc(100vh - 210px);
    min-height: 520px;
    border-radius: 12px;
  }

  .official-tree-info,
  .static-tree-notice {
    width: calc(100% - 16px);
  }

  .official-tree-summary {
    display: block;
  }

  .official-tree-summary dl {
    justify-content: flex-start;
    margin-top: 13px;
  }
}
</style>
