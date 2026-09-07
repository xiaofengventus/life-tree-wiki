<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import navBar from "@/components/navBar.vue";
import { useUserStore } from "@/stores/user";
import { formatDateTime } from "@/utils/date";
import {
  listDrafts,
  deleteDraft,
  userDraftOwnerKey,
  visibleDraftOwnerKeys,
  draftEditorLocation,
} from "@/services/drafts";
import { fetchPostList } from "@/services/posts";
import { fetchTreeList } from "@/services/trees";

const router = useRouter();
const userStore = useUserStore();

const localDrafts = ref([]);
const publishedPosts = ref([]);
const publishedTrees = ref([]);
const loading = ref(true);
const errorMessage = ref("");

const cloudDrafts = computed(() => {
  return [];
});

const allPublished = computed(() => {
  const posts = publishedPosts.value.map((post) => ({
    type: "文章",
    id: post.id,
    title: post.title || "未命名文章",
    url: `/wiki/${encodeURIComponent(post.title)}`,
    updatedAt: post.updatedAt || post.submittedAt,
    creator: post.author || post.creator || "未知作者",
  }));
  const trees = publishedTrees.value.map((tree) => ({
    type: "进化树",
    id: tree.id,
    title: tree.title || "未命名进化树",
    url: `/life-tree/${tree.uid || tree.id}`,
    updatedAt: tree.updatedAt,
    creator: tree.creator,
  }));
  return [...posts, ...trees].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
  );
});

async function loadData() {
  loading.value = true;
  errorMessage.value = "";
  try {
    await userStore.initialize();

    const ownerKeys = visibleDraftOwnerKeys(userStore.user);
    localDrafts.value = await listDrafts({ ownerKeys });

    if (userStore.isLoggedIn) {
      const [posts, trees] = await Promise.all([
        fetchPostList(),
        fetchTreeList("USER"),
      ]);
      publishedPosts.value = (posts?.posts || []).filter(
        (post) => post.creatorUid === userStore.user?.uid,
      );
      publishedTrees.value = trees.filter(
        (tree) => tree.creatorUid === userStore.user?.uid,
      );
    } else {
      publishedPosts.value = [];
      publishedTrees.value = [];
    }
  } catch (error) {
    errorMessage.value = error.message || "加载数据失败";
  } finally {
    loading.value = false;
  }
}

function goToWrite() {
  router.push("/create-post");
}

function goToMakeTree() {
  router.push("/evolution-tree");
}

function continueEditDraft(draft) {
  const location = draftEditorLocation(draft);
  router.push(location);
}

function goToPublished(url) {
  router.push(url);
}

async function deleteLocalDraft(draft, event) {
  event.stopPropagation();
  if (!confirm(`确定删除草稿 "${draft.title || "未命名草稿"}" 吗？`)) return;
  try {
    await deleteDraft(draft.id);
    localDrafts.value = localDrafts.value.filter((d) => d.id !== draft.id);
  } catch (error) {
    alert("删除失败：" + error.message);
  }
}

onMounted(loadData);
</script>

<template>
  <navBar />
  <main class="creation-page">
    <section class="creation-layout">
      <!-- 左侧入口 -->
      <aside class="creation-sidebar">
        <div class="entry-card" @click="goToWrite">
          <div class="entry-icon">📝</div>
          <div class="entry-text">
            <h3>写专栏</h3>
            <p>撰写研究文章、笔记和科普内容</p>
          </div>
        </div>
        <div class="entry-card" @click="goToMakeTree">
          <div class="entry-icon">🌳</div>
          <div class="entry-text">
            <h3>制作树</h3>
            <p>绘制系统发育树、分类树和进化关系</p>
          </div>
        </div>
      </aside>

      <!-- 右侧内容 -->
      <section class="creation-content">
        <!-- 联网草稿区 -->
        <div class="content-section">
          <div class="section-header">
            <h2>联网草稿区</h2>
            <span class="section-count">{{ cloudDrafts.length }} 篇</span>
          </div>
          <div v-if="loading" class="section-loading">加载中...</div>
          <div v-else-if="!cloudDrafts.length" class="section-empty">
            <p>暂无联网草稿</p>
            <small>登录后可保存私密文章到服务器</small>
          </div>
          <div v-else class="item-list">
            <article
              v-for="item in cloudDrafts"
              :key="item.id"
              class="list-item"
            >
              <span class="item-type">{{ item.type }}</span>
              <h4>{{ item.title }}</h4>
              <div class="item-meta">
                <span>{{ formatDateTime(item.updatedAt) }}</span>
              </div>
              <button @click="continueEditDraft(item)">继续编辑</button>
            </article>
          </div>
        </div>

        <!-- 本地草稿区 -->
        <div class="content-section">
          <div class="section-header">
            <h2>本地草稿区</h2>
            <span class="section-count">{{ localDrafts.length }} 篇</span>
          </div>
          <div v-if="loading" class="section-loading">加载中...</div>
          <div v-else-if="!localDrafts.length" class="section-empty">
            <p>暂无本地草稿</p>
            <small>所有草稿保存在当前浏览器</small>
          </div>
          <div v-else class="item-list">
            <article
              v-for="draft in localDrafts"
              :key="draft.id"
              class="list-item"
            >
              <span class="item-type">{{
                draft.contentType === "TREE" ? "进化树" : "文章"
              }}</span>
              <h4>{{ draft.title || "未命名草稿" }}</h4>
              <div class="item-meta">
                <span>{{ formatDateTime(draft.updatedAt) }}</span>
                <span v-if="draft.mode"
                  >·
                  {{
                    {
                      CREATE: "新建",
                      EDIT: "编辑",
                      FORK: "Fork",
                      CONTRIBUTION: "Contribution",
                    }[draft.mode] || draft.mode
                  }}</span
                >
              </div>
              <div class="item-actions">
                <button @click="continueEditDraft(draft)">继续编辑</button>
                <button
                  type="button"
                  class="delete-btn"
                  @click="deleteLocalDraft(draft, $event)"
                >
                  删除
                </button>
              </div>
            </article>
          </div>
        </div>

        <!-- 已发表的 -->
        <div class="content-section">
          <div class="section-header">
            <h2>已发表的</h2>
            <span class="section-count">{{ allPublished.length }} 篇</span>
          </div>
          <div v-if="loading" class="section-loading">加载中...</div>
          <div v-else-if="!allPublished.length" class="section-empty">
            <p>还没有发表任何内容</p>
            <small>发表后，文章和进化树将显示在这里</small>
          </div>
          <div v-else class="item-list">
            <article
              v-for="item in allPublished"
              :key="item.type + '-' + item.id"
              class="list-item published"
            >
              <span class="item-type">{{ item.type }}</span>
              <h4>{{ item.title }}</h4>
              <div class="item-meta">
                <span>{{ item.creator }}</span>
                <span>· {{ formatDateTime(item.updatedAt) }}</span>
              </div>
              <button @click="goToPublished(item.url)">查看</button>
            </article>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
.creation-page {
  min-height: 100vh;
  padding: 84px 24px 40px;
  background: #f5f8f6;
}

.creation-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.creation-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.entry-card {
  display: flex;
  gap: 14px;
  padding: 20px;
  border: 2px solid #d4e1d8;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  align-items: center;
}

.entry-card:hover {
  border-color: #2f806a;
  background: #f0f7f3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(31, 74, 59, 0.1);
}

.entry-icon {
  font-size: 2rem;
  line-height: 1;
}

.entry-text h3 {
  margin: 0 0 4px;
  color: #1e3d30;
  font-size: 1.1rem;
}

.entry-text p {
  margin: 0;
  color: #6b7c74;
  font-size: 0.82rem;
  line-height: 1.4;
}

.creation-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content-section {
  border: 1px solid #d4e1d8;
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5ece7;
  background: #fafcfb;
}

.section-header h2 {
  margin: 0;
  color: #1e3d30;
  font-size: 1rem;
}

.section-count {
  padding: 3px 10px;
  border-radius: 999px;
  background: #e5f0eb;
  color: #2f806a;
  font-size: 0.8rem;
  font-weight: 600;
}

.section-loading,
.section-empty {
  padding: 24px;
  text-align: center;
  color: #718078;
  font-size: 0.88rem;
}

.section-empty p {
  margin: 0 0 6px;
  color: #52675e;
}

.section-empty small {
  color: #98a9a0;
}

.item-list {
  display: flex;
  flex-direction: column;
}

.list-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #edf1ef;
  transition: background-color 0.15s;
}

.list-item:last-child {
  border-bottom: none;
}

.list-item:hover {
  background: #f8fbf9;
}

.item-type {
  padding: 3px 8px;
  border-radius: 4px;
  background: #e7f2ec;
  color: #25634f;
  font-size: 0.72rem;
  font-weight: 600;
}

.list-item.published .item-type {
  background: #e3f0e9;
  color: #176b43;
}

.list-item h4 {
  margin: 0;
  color: #263c33;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

.item-meta {
  display: flex;
  gap: 6px;
  color: #8a9d95;
  font-size: 0.78rem;
  white-space: nowrap;
}

.list-item button {
  padding: 6px 12px;
  border: 1px solid #c5d6ce;
  border-radius: 6px;
  background: #fff;
  color: #356a57;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.15s;
}

.list-item button:hover {
  border-color: #2f806a;
  background: #f0f7f3;
  color: #2f806a;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.delete-btn {
  padding: 6px 12px;
  border: 1px solid #e5c5c5 !important;
  border-radius: 6px;
  background: #fff !important;
  color: #b42318 !important;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.15s;
}

.delete-btn:hover {
  border-color: #b42318 !important;
  background: #fef2f2 !important;
  color: #b42318 !important;
}

@media (max-width: 768px) {
  .creation-layout {
    grid-template-columns: 1fr;
  }

  .creation-sidebar {
    flex-direction: row;
  }

  .entry-card {
    flex: 1;
  }

  .list-item {
    grid-template-columns: auto 1fr auto;
  }

  .item-meta {
    grid-column: 1 / -1;
  }
}
</style>
