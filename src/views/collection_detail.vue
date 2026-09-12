<script setup>
/**
 * 合集详情页 - /collections/:id
 * 公开合集任何人都能看；作者本人额外可以改名、改可见性、增删条目、调整顺序。
 * 条目只收录作者自己的作品（文章 / 进化树），私密作品对访客自动隐藏。
 */
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import navBar from "@/components/navBar.vue";
import { useUserStore } from "@/stores/user";
import { fetchUserSpace } from "@/services/users";
import {
  addCollectionItems,
  deleteCollection,
  fetchCollection,
  removeCollectionItem,
  reorderCollectionItems,
  updateCollection,
} from "@/services/collections";
import { candidateWorks, displayEntries, moveEntry, orderPayload } from "@/utils/collectionItems";
import { formatDateTime } from "@/utils/date";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const collection = ref(null);
const entries = ref([]);
const loading = ref(true);
const errorMessage = ref("");
const actionMessage = ref("");
const busy = ref(false);

const editOpen = ref(false);
const editForm = reactive({ title: "", description: "", visibility: "PUBLIC" });

const pickerOpen = ref(false);
const pickerLoading = ref(false);
const pickerError = ref("");
const candidates = ref([]);
const selectedKeys = ref([]);

const rows = computed(() => displayEntries(entries.value));
const isOwner = computed(() => Boolean(collection.value?.isOwner));
const ownerPath = computed(() =>
  collection.value?.ownerUid ? `/users/${collection.value.ownerUid}` : "/",
);

function targetOf(row) {
  return { targetType: row.targetType, targetId: row.targetId };
}

async function load() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const payload = await fetchCollection(route.params.id);
    collection.value = payload.collection;
    entries.value = payload.items || [];
    editForm.title = payload.collection.title;
    editForm.description = payload.collection.description;
    editForm.visibility = payload.collection.visibility;
  } catch (error) {
    collection.value = null;
    errorMessage.value = error.message || "合集加载失败";
  } finally {
    loading.value = false;
  }
}

watch(
  () => route.params.id,
  () => {
    if (route.name === "collection-detail") load();
  },
  { immediate: true },
);

async function runAction(action, successMessage = "") {
  if (busy.value) return;
  busy.value = true;
  actionMessage.value = "";
  try {
    const result = await action();
    if (result?.items) entries.value = result.items;
    if (successMessage) actionMessage.value = successMessage;
    return result;
  } catch (error) {
    actionMessage.value = error.message || "操作失败";
    return null;
  } finally {
    busy.value = false;
  }
}

async function saveEdit() {
  const result = await runAction(
    () =>
      updateCollection(collection.value.id, {
        title: editForm.title,
        description: editForm.description,
        visibility: editForm.visibility,
      }),
    "合集已更新",
  );
  if (result?.collection) {
    collection.value = { ...result.collection, isOwner: true };
    editOpen.value = false;
  }
}

async function removeCollection() {
  if (!window.confirm(`确定删除合集「${collection.value.title}」吗？合集中的作品不会被删除。`)) {
    return;
  }
  const result = await runAction(() => deleteCollection(collection.value.id));
  if (result) router.replace(ownerPath.value);
}

async function move(index, delta) {
  const next = moveEntry(rows.value, index, index + delta);
  // 顺序没变就不用发请求（移动到自己身上、或者已经到顶/到底）
  if (next.map((row) => row.key).join("|") === rows.value.map((row) => row.key).join("|")) {
    return;
  }
  const byKey = new Map(
    entries.value.map((entry) => [`${entry.targetType}:${entry.targetId}`, entry]),
  );
  entries.value = next.map((row) => byKey.get(row.key)).filter(Boolean);
  await runAction(() => reorderCollectionItems(collection.value.id, orderPayload(next)));
}

async function removeItem(row) {
  if (!window.confirm(`把「${row.title}」从合集中移除？作品本身不会被删除。`)) return;
  await runAction(
    () => removeCollectionItem(collection.value.id, targetOf(row)),
    "已移出合集",
  );
}

async function openPicker() {
  pickerOpen.value = true;
  pickerError.value = "";
  selectedKeys.value = [];
  if (candidates.value.length || pickerLoading.value) return;
  pickerLoading.value = true;
  try {
    const uid = userStore.user?.uid || collection.value.ownerUid;
    const payload = await fetchUserSpace(uid);
    const posts = [...(payload.posts || []), ...(payload.privateWorks?.posts || [])];
    const trees = [...(payload.trees || []), ...(payload.privateWorks?.trees || [])];
    candidates.value = candidateWorks(entries.value, posts, trees);
  } catch (error) {
    pickerError.value = error.message || "作品列表加载失败";
  } finally {
    pickerLoading.value = false;
  }
}

function toggleCandidate(option) {
  const keys = selectedKeys.value;
  selectedKeys.value = keys.includes(option.key)
    ? keys.filter((key) => key !== option.key)
    : [...keys, option.key];
}

async function confirmPicker() {
  const chosen = candidates.value.filter((option) => selectedKeys.value.includes(option.key));
  if (!chosen.length) {
    pickerOpen.value = false;
    return;
  }
  const result = await runAction(
    () =>
      addCollectionItems(
        collection.value.id,
        chosen.map((option) => ({ targetType: option.targetType, targetId: option.targetId })),
      ),
    `已加入 ${chosen.length} 个作品`,
  );
  if (result) {
    pickerOpen.value = false;
    candidates.value = candidates.value.filter((option) => !selectedKeys.value.includes(option.key));
    selectedKeys.value = [];
  }
}
</script>

<template>
  <navBar />
  <main class="collection-page">
    <p v-if="loading" class="state">正在加载合集...</p>
    <p v-else-if="errorMessage" class="state error">{{ errorMessage }}</p>

    <template v-else-if="collection">
      <header class="collection-heading">
        <p class="crumb">
          <RouterLink :to="ownerPath">{{ collection.ownerName || "作者" }}</RouterLink>
          <span aria-hidden="true">·</span>
          <span>合集</span>
        </p>
        <div class="heading-line">
          <h1>{{ collection.title }}</h1>
          <span v-if="collection.isPrivate" class="badge private">仅自己可见</span>
        </div>
        <p v-if="collection.description" class="description">{{ collection.description }}</p>
        <small class="meta">
          {{ collection.itemCount }} 个作品
          · 更新于 {{ formatDateTime(collection.updatedAt) }}
        </small>

        <div v-if="isOwner" class="owner-actions">
          <button type="button" :disabled="busy" @click="editOpen = !editOpen">
            {{ editOpen ? "收起设置" : "编辑合集" }}
          </button>
          <button type="button" :disabled="busy" @click="openPicker">添加作品</button>
          <button type="button" class="danger" :disabled="busy" @click="removeCollection">
            删除合集
          </button>
        </div>

        <form v-if="isOwner && editOpen" class="edit-panel" @submit.prevent="saveEdit">
          <label>
            <span>合集名称</span>
            <input v-model="editForm.title" type="text" maxlength="80" required />
          </label>
          <label>
            <span>合集简介</span>
            <textarea v-model="editForm.description" rows="3" maxlength="500"></textarea>
          </label>
          <label>
            <span>可见范围</span>
            <select v-model="editForm.visibility">
              <option value="PUBLIC">公开：别人可以浏览这个合集</option>
              <option value="PRIVATE">仅自己可见</option>
            </select>
          </label>
          <div class="edit-actions">
            <button type="submit" :disabled="busy">保存</button>
          </div>
        </form>
      </header>

      <p v-if="actionMessage" class="action-message">{{ actionMessage }}</p>

      <p v-if="!rows.length" class="state">
        这个合集还没有内容。<template v-if="isOwner">点上面的「添加作品」把你自己的文章或进化树放进来。</template>
      </p>

      <ol v-else class="item-list">
        <li v-for="(row, index) in rows" :key="row.key" class="item-row">
          <span class="item-index">{{ index + 1 }}</span>
          <img v-if="row.coverUrl" class="item-cover" :src="row.coverUrl" :alt="`${row.title}封面`" loading="lazy" />
          <div class="item-body">
            <div class="item-title-line">
              <span class="item-kind" :class="`is-${row.targetType.toLowerCase()}`">{{ row.kindLabel }}</span>
              <RouterLink v-if="!row.isPrivate" class="item-title" :to="row.href">{{ row.title }}</RouterLink>
              <strong v-else class="item-title plain">{{ row.title }}</strong>
              <span v-if="row.isPrivate" class="badge private small">仅自己可见</span>
            </div>
            <p v-if="row.summary">{{ row.summary }}</p>
            <small v-if="row.updatedAt">{{ formatDateTime(row.updatedAt) }}</small>
          </div>
          <div v-if="isOwner" class="item-actions">
            <button type="button" :disabled="busy || index === 0" @click="move(index, -1)">上移</button>
            <button type="button" :disabled="busy || index === rows.length - 1" @click="move(index, 1)">下移</button>
            <button type="button" class="danger" :disabled="busy" @click="removeItem(row)">移出</button>
          </div>
        </li>
      </ol>
    </template>

    <Teleport to="body">
      <div v-if="pickerOpen" class="picker-backdrop" @click.self="pickerOpen = false">
        <section class="picker" role="dialog" aria-label="添加作品到合集">
          <header>
            <h2>添加作品</h2>
            <button type="button" class="close" @click="pickerOpen = false">关闭</button>
          </header>
          <p v-if="pickerLoading" class="picker-state">正在加载你的作品...</p>
          <p v-else-if="pickerError" class="picker-state error">{{ pickerError }}</p>
          <p v-else-if="!candidates.length" class="picker-state">
            没有可添加的作品了 —— 你创建的文章和进化树都已经在这个合集里。
          </p>
          <ul v-else class="picker-list">
            <li v-for="option in candidates" :key="option.key">
              <label>
                <input
                  type="checkbox"
                  :checked="selectedKeys.includes(option.key)"
                  @change="toggleCandidate(option)"
                />
                <span class="picker-kind">{{ option.kindLabel }}</span>
                <span class="picker-title">{{ option.title }}</span>
                <span v-if="option.isPrivate" class="badge private small">仅自己可见</span>
              </label>
            </li>
          </ul>
          <footer>
            <button type="button" :disabled="busy" @click="confirmPicker">
              加入合集（{{ selectedKeys.length }}）
            </button>
          </footer>
        </section>
      </div>
    </Teleport>
  </main>
</template>

<style scoped>
.collection-page { width: min(100% - 48px, 980px); min-height: calc(100vh - 65px); margin: 0 auto; padding: 42px 0 80px; background: #fff; }
.collection-heading { border-bottom: 1px solid #a2a9b1; padding-bottom: 16px; }
.crumb { margin: 0 0 8px; color: #72777d; font-size: 13px; display: flex; gap: 6px; }
.crumb a { color: #3366cc; text-decoration: none; }
.crumb a:hover { text-decoration: underline; }
.heading-line { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.collection-heading h1 { margin: 0; color: #202122; font-family: Georgia, "Noto Serif SC", serif; font-size: 30px; font-weight: 400; }
.description { margin: 10px 0 0; color: #54595d; font-size: 15px; line-height: 1.7; }
.meta { display: block; margin-top: 8px; color: #9ca3af; font-size: 12px; }
.badge { flex: none; border-radius: 999px; font-size: 11px; font-weight: 700; }
.badge.private { padding: 3px 9px; background: #fdeaea; color: #a13f39; }
.badge.private.small { padding: 2px 7px; font-size: 10px; }
.owner-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
.owner-actions button { padding: 7px 15px; border: 1px solid #c8ccd1; border-radius: 999px; background: #fff; color: #3366cc; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
.owner-actions button:hover { border-color: #3366cc; }
.owner-actions button.danger { border-color: #dcb9b6; color: #a33d37; }
.owner-actions button:disabled { opacity: 0.55; cursor: default; }
.edit-panel { display: grid; gap: 14px; margin-top: 18px; padding: 18px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fafbfc; }
.edit-panel label { display: grid; gap: 6px; }
.edit-panel label > span { color: #54595d; font-size: 13px; }
.edit-panel input, .edit-panel textarea, .edit-panel select { width: 100%; box-sizing: border-box; padding: 9px 11px; border: 1px solid #c8ccd1; border-radius: 7px; background: #fff; color: #202122; font: inherit; font-size: 14px; }
.edit-actions { display: flex; justify-content: flex-end; }
.edit-actions button { padding: 8px 20px; border: 1px solid #3366cc; border-radius: 999px; background: #3366cc; color: #fff; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
.action-message { margin: 14px 0 0; padding: 9px 14px; border-radius: 7px; background: #eaf3ff; color: #2b4d84; font-size: 13px; }
.item-list { margin: 8px 0 0; padding: 0; list-style: none; }
.item-row { display: flex; gap: 14px; align-items: flex-start; padding: 18px 0; border-bottom: 1px solid #e5e7eb; }
.item-index { flex: none; width: 22px; padding-top: 2px; color: #9ca3af; font-size: 13px; font-variant-numeric: tabular-nums; }
.item-cover { flex: none; width: 104px; height: 70px; border: 1px solid #e5e7eb; border-radius: 8px; object-fit: cover; }
.item-body { min-width: 0; flex: 1; }
.item-title-line { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
.item-kind { flex: none; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; }
.item-kind.is-post { background: #eaf3ff; color: #2b4d84; }
.item-kind.is-tree { background: #e7f2ec; color: #2b6b57; }
.item-title { color: #111827; font-family: Georgia, "Noto Serif SC", serif; font-size: 19px; font-weight: 700; text-decoration: none; }
.item-title:hover { text-decoration: underline; }
.item-title.plain { cursor: default; }
.item-body p { margin: 7px 0 4px; color: #6b7280; font-size: 14px; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.item-body small { color: #9ca3af; font-size: 12px; }
.item-actions { display: flex; flex: none; gap: 8px; }
.item-actions button { padding: 5px 11px; border: 1px solid #c8ccd1; border-radius: 999px; background: #fff; color: #54595d; font: inherit; font-size: 12px; cursor: pointer; }
.item-actions button:hover { border-color: #3366cc; color: #3366cc; }
.item-actions button.danger { border-color: #dcb9b6; color: #a33d37; }
.item-actions button:disabled { opacity: 0.45; cursor: default; }
.picker-backdrop { position: fixed; inset: 0; z-index: 70; display: grid; place-items: center; padding: 24px; background: rgba(20, 26, 24, 0.45); }
.picker { width: min(100%, 560px); max-height: min(80vh, 620px); display: flex; flex-direction: column; border-radius: 12px; background: #fff; overflow: hidden; }
.picker header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
.picker header h2 { margin: 0; color: #202122; font-size: 16px; font-weight: 700; }
.picker .close { border: 0; background: none; color: #54595d; font: inherit; font-size: 13px; cursor: pointer; }
.picker-state { padding: 32px 20px; color: #9ca3af; font-size: 14px; text-align: center; }
.picker-state.error { color: #b42318; }
.picker-list { flex: 1; margin: 0; padding: 8px 12px; overflow-y: auto; list-style: none; }
.picker-list label { display: flex; align-items: center; gap: 10px; padding: 9px 8px; border-radius: 7px; cursor: pointer; }
.picker-list label:hover { background: #f4f6f8; }
.picker-kind { flex: none; color: #9ca3af; font-size: 12px; }
.picker-title { min-width: 0; flex: 1; overflow: hidden; color: #202122; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
.picker footer { display: flex; justify-content: flex-end; padding: 14px 20px; border-top: 1px solid #e5e7eb; }
.picker footer button { padding: 8px 20px; border: 1px solid #3366cc; border-radius: 999px; background: #3366cc; color: #fff; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
.picker footer button:disabled { opacity: 0.55; cursor: default; }
.state { padding: 60px 0; color: #9ca3af; text-align: center; }
.state.error { color: #b42318; }
@media (max-width: 640px) {
  .collection-page { width: min(100% - 32px, 980px); padding-top: 26px; }
  .item-row { gap: 10px; }
  .item-cover { display: none; }
  .item-actions { flex-direction: column; gap: 6px; }
}
</style>
