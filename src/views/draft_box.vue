<script setup>
import { computed, onMounted, ref } from "vue";
import navBar from "@/components/navBar.vue";
import {
  clearDrafts as clearLocalDrafts,
  deleteDraft,
  draftEditorLocation,
  duplicateDraft,
  listDrafts,
  userDraftOwnerKey,
  visibleDraftOwnerKeys,
} from "@/services/drafts";
import { useUserStore } from "@/stores/user";
import { formatDateTime } from "@/utils/date";

const userStore = useUserStore();
const drafts = ref([]);
const loading = ref(true);
const message = ref("");
const searchQuery = ref("");
const typeFilter = ref("ALL");
const clearing = ref(false);

const visibleDrafts = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();
  return drafts.value
    .filter((draft) =>
      typeFilter.value === "ALL" || draft.contentType === typeFilter.value)
    .filter((draft) =>
      !keyword || [draft.title, draft.targetId, draft.mode]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword));
});

function typeLabel(draft) {
  return draft.contentType === "TREE" ? "进化树" : "文章";
}

function modeLabel(mode) {
  return {
    CREATE: "新建",
    EDIT: "编辑已发布内容",
    FORK: "Fork",
    CONTRIBUTION: "Contribution",
  }[mode] || "新建";
}

async function loadDrafts() {
  loading.value = true;
  message.value = "";
  try {
    await userStore.initialize();
    drafts.value = await listDrafts({
      ownerKeys: visibleDraftOwnerKeys(userStore.user),
    });
  } catch (error) {
    drafts.value = [];
    message.value = error.message || "草稿箱加载失败";
  } finally {
    loading.value = false;
  }
}

async function copyDraft(draft) {
  try {
    const copied = await duplicateDraft(
      draft.id,
      userDraftOwnerKey(userStore.user),
    );
    await loadDrafts();
    message.value = `已复制“${copied.title || "未命名草稿"}”`;
  } catch (error) {
    message.value = error.message || "复制草稿失败";
  }
}

async function removeDraft(draft) {
  if (!window.confirm(`确定删除草稿“${draft.title || "未命名草稿"}”吗？\n\n删除后无法恢复。`)) return;
  try {
    await deleteDraft(draft.id);
    drafts.value = drafts.value.filter((item) => item.id !== draft.id);
    message.value = "草稿已从此设备删除";
  } catch (error) {
    message.value = error.message || "删除草稿失败";
  }
}

async function removeAllDrafts() {
  const total = drafts.value.length;
  if (!total || clearing.value) return;
  const confirmed = window.confirm(
    `确定清空此设备上的全部 ${total} 份草稿吗？\n\n` +
    "包括未登录时保存的草稿。删除后无法恢复。",
  );
  if (!confirmed) return;
  clearing.value = true;
  try {
    const removed = await clearLocalDrafts({
      ownerKeys: visibleDraftOwnerKeys(userStore.user),
    });
    drafts.value = [];
    message.value = `已清空 ${removed} 份本地草稿`;
  } catch (error) {
    message.value = error.message || "清空草稿失败";
  } finally {
    clearing.value = false;
  }
}

onMounted(loadDrafts);
</script>

<template>
  <navBar />
  <main class="draft-page">
    <header class="draft-heading">
      <div>
        <span>LOCAL DRAFTS</span>
        <h1>草稿箱</h1>
        <p>草稿只保存在当前浏览器；发布成功后，对应草稿会自动清理。</p>
      </div>
      <div class="create-actions">
        <RouterLink to="/create-post">写文章</RouterLink>
        <RouterLink to="/evolution-tree">制作树相</RouterLink>
        <button
          class="clear-drafts"
          type="button"
          :disabled="!drafts.length || clearing"
          @click="removeAllDrafts"
        >
          {{ clearing ? "清空中…" : "清空草稿" }}
        </button>
      </div>
    </header>

    <section class="draft-toolbar">
      <input v-model.trim="searchQuery" type="search" placeholder="搜索草稿标题" />
      <div>
        <button
          v-for="option in [
            { value: 'ALL', label: '全部' },
            { value: 'ARTICLE', label: '文章' },
            { value: 'TREE', label: '进化树' },
          ]"
          :key="option.value"
          type="button"
          :class="{ active: typeFilter === option.value }"
          @click="typeFilter = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </section>

    <p v-if="message" class="draft-message" aria-live="polite">{{ message }}</p>
    <p v-if="loading" class="draft-state">正在读取此设备上的草稿……</p>

    <section v-else-if="visibleDrafts.length" class="draft-grid">
      <article v-for="draft in visibleDrafts" :key="draft.id">
        <header>
          <span>{{ typeLabel(draft) }}</span>
          <small>{{ modeLabel(draft.mode) }}</small>
        </header>
        <h2>{{ draft.title || "未命名草稿" }}</h2>
        <p>
          <span v-if="draft.ownerKey.startsWith('guest:')">未登录草稿</span>
          <span v-else>账号草稿</span>
          <span v-if="draft.targetId">关联 {{ draft.targetId }}</span>
          <span v-if="draft.baseVersion">基于 v{{ draft.baseVersion }}</span>
        </p>
        <time :datetime="draft.updatedAt">
          保存于 {{ formatDateTime(draft.updatedAt) }}
        </time>
        <footer>
          <RouterLink :to="draftEditorLocation(draft)">继续编辑</RouterLink>
          <button type="button" @click="copyDraft(draft)">复制</button>
          <button class="danger" type="button" @click="removeDraft(draft)">删除</button>
        </footer>
      </article>
    </section>

    <section v-else class="empty-drafts">
      <strong>还没有草稿</strong>
      <p>开始写作或制作树相后，可以将有修改的内容保存在这里。</p>
    </section>
  </main>
</template>

<style scoped>
.draft-page{min-height:100vh;padding:86px 20px 60px;background:#f5f8f6;color:#263d33}.draft-heading,.draft-toolbar,.draft-message,.draft-grid,.draft-state,.empty-drafts{box-sizing:border-box;width:min(100%,1120px);margin-right:auto;margin-left:auto}.draft-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px}.draft-heading>div:first-child>span{color:#2f806a;font-size:.72rem;font-weight:850;letter-spacing:.16em}.draft-heading h1{margin:4px 0;font-size:2rem}.draft-heading p{margin:0;color:#68786f}.create-actions{display:flex;gap:8px}.create-actions a{padding:10px 14px;border-radius:8px;background:#286b49;color:#fff;font-weight:750;text-decoration:none}.create-actions button.clear-drafts{padding:10px 14px;border:1px solid #e0beba;border-radius:8px;background:#fff;color:#a1433c;font:inherit;font-weight:750;white-space:nowrap;cursor:pointer}.create-actions button.clear-drafts:disabled{cursor:not-allowed;opacity:.45}.draft-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:22px;padding:14px;border:1px solid #d6e1da;border-radius:11px;background:#fff}.draft-toolbar input{width:min(100%,420px);padding:10px 12px;border:1px solid #cbd7cf;border-radius:7px;font:inherit}.draft-toolbar>div{display:flex;gap:6px}.draft-toolbar button{padding:8px 12px;border:1px solid #cad7cf;border-radius:999px;background:#fff;color:#68786f;font:inherit;font-size:.82rem;cursor:pointer}.draft-toolbar button.active{border-color:#2f806a;background:#eaf5ef;color:#25634f}.draft-message{margin-top:14px;color:#286b49}.draft-state,.empty-drafts{margin-top:36px;color:#718078;text-align:center}.draft-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin-top:18px}.draft-grid article{display:grid;gap:10px;padding:18px;border:1px solid #d6e0d9;border-radius:12px;background:#fff;box-shadow:0 7px 22px rgba(31,74,59,.05)}.draft-grid article>header{display:flex;align-items:center;justify-content:space-between}.draft-grid article>header span{padding:4px 8px;border-radius:999px;background:#e7f2ec;color:#25634f;font-size:.72rem;font-weight:800}.draft-grid article>header small{color:#7d8b84}.draft-grid h2{overflow:hidden;margin:0;color:#1e3d30;font-size:1.12rem;text-overflow:ellipsis;white-space:nowrap}.draft-grid article>p{display:flex;flex-wrap:wrap;gap:5px 12px;margin:0;color:#718078;font-size:.78rem}.draft-grid time{color:#8a9690;font-size:.76rem}.draft-grid footer{display:flex;align-items:center;gap:7px;padding-top:4px}.draft-grid footer a,.draft-grid footer button{padding:8px 10px;border:1px solid #cbd8d0;border-radius:7px;background:#fff;color:#356a57;font:inherit;font-size:.82rem;text-decoration:none;cursor:pointer}.draft-grid footer a{border-color:#286b49;background:#286b49;color:#fff}.draft-grid footer button.danger{margin-left:auto;border-color:#e0beba;color:#a1433c}.empty-drafts{padding:60px 20px;border:1px dashed #bdccc3;border-radius:13px;background:#fff}.empty-drafts strong{font-size:1.15rem}.empty-drafts p{margin-bottom:0}@media(max-width:680px){.draft-page{padding:76px 10px 36px}.draft-heading,.draft-toolbar{display:block}.create-actions{margin-top:16px}.create-actions a,.create-actions button.clear-drafts{flex:1;text-align:center}.draft-toolbar input{width:100%;box-sizing:border-box}.draft-toolbar>div{margin-top:10px;overflow-x:auto}.draft-grid{grid-template-columns:1fr}}
</style>
