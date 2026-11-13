<script setup>
/**
 * Columns 专栏页 - 导航栏 "专栏" 入口。
 * 2026-10-12 重构为「三区文件夹」形态：
 *   - 一级分区固定三个：科普区 / 新闻区 / 未分类区（与文章自身 type 徽标无关）；
 *   - 每个分区可收起（默认全部收起），分区头有一个 V 展开/收起；
 *   - 区内每行一个文件夹（整行），行内可展开文章列表；
 *   - 未分类区额外列出未入任何文件夹的散文章；
 *   - 任何登录用户可建文件夹 / 往文件夹放公开文章；
 *     只有夹主 / ADMIN / 站点所有者能改名、换区、删除文件夹；
 *     删除文件夹后里面的文章自动回「未分类」。
 * 文章的讨论区在阅读页（/wiki/:title）内以悬浮按钮 + 侧栏卡片打开。
 */
import { computed, onMounted, reactive, ref } from "vue";
import navBar from "@/components/navBar.vue";
import { fetchPostPage } from "@/services/posts";
import {
  addPostToFolder,
  createFolder,
  deleteFolder,
  fetchFolders,
  removePostFromFolder,
  updateFolder,
} from "@/services/folders";
import { formatDateTime } from "@/utils/date";
import { useUserStore } from "@/stores/user";

const SECTIONS = [
  { value: "science", label: "科普" },
  { value: "news", label: "新闻" },
  { value: "none", label: "未分类" },
];
const TYPE_LABELS = { news: "新闻", science: "科普" };

const userStore = useUserStore();
const isLoggedIn = computed(() => userStore.isLoggedIn);

const folders = ref({ science: [], news: [], none: [] });
const foldersLoading = ref(true);
const foldersError = ref("");
const openSections = ref(new Set());
const openFolders = ref(new Set());
// folderId -> { posts, nextCursor, loading, error }
const folderPosts = reactive({});
// 未分类区的散文章（不在任何文件夹里）
const loose = reactive({ posts: [], nextCursor: null, loading: false, loaded: false });
const createForm = reactive({ open: false, section: "none", name: "", isPrivate: false, busy: false });
const editForm = reactive({ open: false, id: "", name: "", section: "none", busy: false });
// folderId -> { open, q, searching, results, error }
const addForms = reactive({});

async function loadFolders() {
  foldersError.value = "";
  try {
    folders.value = await fetchFolders();
  } catch (error) {
    foldersError.value = error.message || "文件夹加载失败";
  } finally {
    foldersLoading.value = false;
  }
}

function sectionPostCount(value) {
  const list = folders.value[value] || [];
  return list.reduce((sum, folder) => sum + (folder.postCount || 0), 0);
}

function toggleSection(value) {
  const next = new Set(openSections.value);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
    if (value === "none" && !loose.loaded && !loose.loading) loadLoose();
  }
  openSections.value = next;
}

function toggleFolder(folder) {
  const next = new Set(openFolders.value);
  if (next.has(folder.id)) {
    next.delete(folder.id);
  } else {
    next.add(folder.id);
    if (!folderPosts[folder.id]) loadFolderPosts(folder);
  }
  openFolders.value = next;
}

async function loadFolderPosts(folder, cursor = null) {
  const state = folderPosts[folder.id] || { posts: [], nextCursor: null };
  folderPosts[folder.id] = { ...state, loading: true, error: "" };
  try {
    const payload = await fetchPostPage({
      limit: 20,
      cursor,
      folder: folder.id,
    });
    folderPosts[folder.id] = {
      posts: cursor ? [...state.posts, ...payload.posts] : payload.posts,
      nextCursor: payload.nextCursor,
      loading: false,
      error: "",
    };
  } catch (error) {
    folderPosts[folder.id] = {
      ...state,
      loading: false,
      error: error.message || "文章加载失败",
    };
  }
}

async function loadLoose(cursor = null) {
  loose.loading = true;
  try {
    const payload = await fetchPostPage({ limit: 8, cursor, folder: "none" });
    loose.posts = cursor ? [...loose.posts, ...payload.posts] : payload.posts;
    loose.nextCursor = payload.nextCursor;
    loose.loaded = true;
  } catch (error) {
    loose.error = error.message || "文章加载失败";
  } finally {
    loose.loading = false;
  }
}

function openCreate(section) {
  editForm.open = false;
  createForm.open = true;
  createForm.section = section;
  createForm.name = "";
  createForm.isPrivate = false;
}

async function submitCreate() {
  if (createForm.busy) return;
  const name = createForm.name.trim();
  if (!name) return;
  createForm.busy = true;
  try {
    await createFolder({ name, section: createForm.section, isPrivate: createForm.isPrivate });
    createForm.open = false;
    createForm.name = "";
    createForm.isPrivate = false;
    await loadFolders();
    openSections.value = new Set([...openSections.value, createForm.section]);
  } catch (error) {
    window.alert(`创建文件夹失败：${error.message || "未知错误"}`);
  } finally {
    createForm.busy = false;
  }
}

function openEdit(folder) {
  createForm.open = false;
  editForm.open = true;
  editForm.id = folder.id;
  editForm.name = folder.name;
  editForm.section = folder.section;
}

async function submitEdit() {
  if (editForm.busy) return;
  const name = editForm.name.trim();
  if (!name) return;
  editForm.busy = true;
  try {
    await updateFolder(editForm.id, { name, section: editForm.section });
    editForm.open = false;
    await loadFolders();
  } catch (error) {
    window.alert(`修改文件夹失败：${error.message || "未知错误"}`);
  } finally {
    editForm.busy = false;
  }
}

async function removeFolder(folder) {
  const confirmed = window.confirm(
    `确定删除文件夹「${folder.name}」吗？\n\n里面的 ${folder.postCount} 篇文章不会删除，会全部回到「未分类」。`,
  );
  if (!confirmed) return;
  try {
    await deleteFolder(folder.id);
    const next = new Set(openFolders.value);
    next.delete(folder.id);
    openFolders.value = next;
    delete folderPosts[folder.id];
    if (loose.loaded) loadLoose();
    await loadFolders();
  } catch (error) {
    window.alert(`删除文件夹失败：${error.message || "未知错误"}`);
  }
}

function addForm(folderId) {
  if (!addForms[folderId]) {
    addForms[folderId] = { open: false, q: "", searching: false, results: [], error: "", cursor: null, exhausted: false };
  }
  return addForms[folderId];
}

// 打开面板即拉一份公开文章列表索引（可翻页），搜索框只做过滤。
async function loadAddList(folderId, { reset = false } = {}) {
  const state = addForm(folderId);
  if (state.searching) return;
  state.searching = true;
  state.error = "";
  try {
    const q = state.q.trim();
    const payload = await fetchPostPage({
      limit: 15,
      q: q || undefined,
      cursor: reset ? null : state.cursor,
    });
    state.results = reset ? payload.posts : state.results.concat(payload.posts);
    state.cursor = payload.nextCursor;
    state.exhausted = !payload.nextCursor;
  } catch (error) {
    state.error = error.message || "加载文章列表失败";
  } finally {
    state.searching = false;
  }
}

function toggleAdd(folderId) {
  const state = addForm(folderId);
  state.open = !state.open;
  if (state.open) {
    // 每次打开都重置到第一页，保证列表是最新的
    state.q = "";
    state.error = "";
    loadAddList(folderId, { reset: true });
  }
}

async function addToFolder(folder, post) {
  const state = addForm(folder.id);
  try {
    await addPostToFolder(folder.id, post.id);
    state.open = false;
    await loadFolderPosts(folder);
    await loadFolders();
  } catch (error) {
    window.alert(`放入文件夹失败：${error.message || "未知错误"}`);
  }
}

function canRemovePost(folder, post) {
  if (!isLoggedIn.value) return false;
  return folder.canManage || (post.creatorUid && post.creatorUid === userStore.user?.uid);
}

async function removeFromFolder(folder, post) {
  const confirmed = window.confirm(
    `把「${post.title || "未命名文章"}」从文件夹移出吗？\n\n文章会回到「未分类」，不会被删除。`,
  );
  if (!confirmed) return;
  try {
    await removePostFromFolder(folder.id, post.id);
    await loadFolderPosts(folder);
    await loadFolders();
    if (loose.loaded) loadLoose();
  } catch (error) {
    window.alert(`移出失败：${error.message || "未知错误"}`);
  }
}

onMounted(() => {
  loadFolders();
});
</script>

<template>
  <navBar />
  <main class="columns-page">
    <header class="columns-heading">
      <h1>专栏</h1>
      <p class="columns-hint">按文件夹浏览专栏。文件夹与文章自身的「科普 / 新闻」类型无关。</p>
    </header>

    <p v-if="foldersLoading" class="state">正在加载专栏...</p>
    <p v-else-if="foldersError" class="state error">{{ foldersError }}</p>
    <template v-else>
      <section v-for="sec in SECTIONS" :key="sec.value" class="folder-section">
        <div class="section-head">
          <button
            type="button"
            class="section-toggle"
            :aria-expanded="openSections.has(sec.value)"
            @click="toggleSection(sec.value)"
          >
            <span class="chevron" :class="{ open: openSections.has(sec.value) }" aria-hidden="true"></span>
            <span class="section-name">{{ sec.label }}区</span>
            <span class="section-count">{{ folders[sec.value]?.length || 0 }} 个文件夹 · {{ sectionPostCount(sec.value) }} 篇</span>
          </button>
        </div>

        <div v-if="openSections.has(sec.value)" class="section-body">
          <div v-for="folder in folders[sec.value]" :key="folder.id" class="folder-block">
            <div class="folder-line">
              <button
                type="button"
                class="folder-main"
                :aria-expanded="openFolders.has(folder.id)"
                @click="toggleFolder(folder)"
              >
                <span class="chevron small" :class="{ open: openFolders.has(folder.id) }" aria-hidden="true"></span>
                <span class="folder-icon" aria-hidden="true"></span>
                <span class="folder-name">{{ folder.name }}<span v-if="folder.isPrivate" class="folder-lock" title="私密文件夹，仅你可见">🔒</span></span>
                <span class="folder-meta">{{ folder.postCount }} 篇 · 由 {{ folder.creatorName || "匿名" }} 创建</span>
              </button>
              <span v-if="folder.canManage" class="folder-actions">
                <button type="button" class="mini-btn" @click="openEdit(folder)">改名 / 换区</button>
                <button type="button" class="mini-btn danger" @click="removeFolder(folder)">删除</button>
              </span>
            </div>

            <div v-if="editForm.open && editForm.id === folder.id" class="folder-form">
              <input
                v-model="editForm.name"
                maxlength="60"
                placeholder="文件夹名称"
                @keyup.enter="submitEdit"
              />
              <select v-model="editForm.section" aria-label="所在分区">
                <option v-for="s in SECTIONS" :key="s.value" :value="s.value">{{ s.label }}区</option>
              </select>
              <button type="button" class="mini-btn primary" :disabled="editForm.busy" @click="submitEdit">
                {{ editForm.busy ? "保存中…" : "保存" }}
              </button>
              <button type="button" class="mini-btn" @click="editForm.open = false">取消</button>
            </div>

            <div v-if="openFolders.has(folder.id)" class="folder-posts">
              <div v-if="isLoggedIn" class="folder-toolbar">
                <button type="button" class="mini-btn primary" @click="toggleAdd(folder.id)">
                  {{ addForm(folder.id).open ? "收起添加" : "＋ 添加文章" }}
                </button>
              </div>

              <div v-if="addForm(folder.id).open" class="add-panel">
                <div class="add-search">
                  <input
                    v-model="addForm(folder.id).q"
                    maxlength="80"
                    placeholder="按标题过滤，清空后回车看全部"
                    @keyup.enter="loadAddList(folder.id, { reset: true })"
                  />
                  <button type="button" class="mini-btn primary" :disabled="addForm(folder.id).searching" @click="loadAddList(folder.id, { reset: true })">
                    {{ addForm(folder.id).searching ? "加载中…" : "过滤" }}
                  </button>
                </div>
                <p v-if="addForm(folder.id).error" class="state-inline error">{{ addForm(folder.id).error }}</p>
                <p v-else-if="addForm(folder.id).searching && !addForm(folder.id).results.length" class="state-inline">正在加载文章列表…</p>
                <ul v-if="addForm(folder.id).results.length" class="add-results">
                  <li v-for="result in addForm(folder.id).results" :key="result.id">
                    <span class="add-title">{{ result.title || "未命名文章" }}</span>
                    <small>{{ result.author || result.creator || "未署名" }}<template v-if="result.isPrivate"> · 仅自己可见</template><template v-else-if="result.updatedAt"> · {{ formatDateTime(result.updatedAt) }}</template></small>
                    <button
                      type="button"
                      class="mini-btn primary"
                      :disabled="result.isPrivate && !folder.isPrivate"
                      :title="result.isPrivate && !folder.isPrivate ? '私密文章只能放进私密文件夹' : ''"
                      @click="addToFolder(folder, result)"
                    >
                      放入
                    </button>
                  </li>
                </ul>
                <div v-if="addForm(folder.id).results.length" class="add-more">
                  <button
                    v-if="!addForm(folder.id).exhausted"
                    type="button"
                    class="mini-btn"
                    :disabled="addForm(folder.id).searching"
                    @click="loadAddList(folder.id)"
                  >{{ addForm(folder.id).searching ? "加载中…" : "加载更多" }}</button>
                  <span v-else class="state-inline">已经到底了</span>
                </div>
                <p v-if="!addForm(folder.id).searching && !addForm(folder.id).results.length" class="state-inline">没有找到公开文章；同一篇文章同时只属于一个文件夹。</p>
              </div>

              <p v-if="folderPosts[folder.id]?.error" class="state error">{{ folderPosts[folder.id].error }}</p>
              <p v-else-if="folderPosts[folder.id]?.loading && !folderPosts[folder.id]?.posts.length" class="state-inline">正在加载文件夹文章...</p>
              <p v-else-if="!folderPosts[folder.id]?.posts.length" class="state-inline">这个文件夹还没有文章，点「添加文章」放几篇进来。</p>
              <template v-else>
                <article v-for="post in folderPosts[folder.id].posts" :key="post.id" class="post-row">
                  <img
                    v-if="post.coverUrl"
                    class="post-cover"
                    :src="post.coverUrl"
                    :alt="`${post.title}封面`"
                    loading="lazy"
                  />
                  <div class="post-body">
                    <div class="post-title-line">
                      <span v-if="post.type" class="post-type" :class="`is-${post.type}`">
                        {{ TYPE_LABELS[post.type] || "专栏" }}
                      </span>
                      <span v-if="post.isPrivate" class="badge private small">仅自己可见</span>
                      <RouterLink
                        class="post-title"
                        :to="{ name: 'wiki-post', params: { title: post.title } }"
                      >
                        {{ post.title || "未命名文章" }}
                      </RouterLink>
                    </div>
                    <p>{{ post.excerpt || "暂无摘要" }}</p>
                    <small>
                      {{ post.author || post.creator || "未署名" }}
                      · {{ formatDateTime(post.updatedAt || post.submittedAt) }}
                    </small>
                  </div>
                  <button
                    v-if="canRemovePost(folder, post)"
                    type="button"
                    class="mini-btn danger remove-btn"
                    @click="removeFromFolder(folder, post)"
                  >
                    移出
                  </button>
                </article>
                <div v-if="folderPosts[folder.id].nextCursor" class="load-more small">
                  <button
                    type="button"
                    :disabled="folderPosts[folder.id].loading"
                    @click="loadFolderPosts(folder, folderPosts[folder.id].nextCursor)"
                  >
                    {{ folderPosts[folder.id].loading ? "正在加载..." : "加载更多" }}
                  </button>
                </div>
              </template>
            </div>
          </div>

          <div v-if="createForm.open && createForm.section === sec.value" class="folder-form">
            <input
              v-model="createForm.name"
              maxlength="60"
              placeholder="新文件夹名称"
              @keyup.enter="submitCreate"
            />
            <label class="private-toggle" title="私密文件夹只对你自己（和管理员）可见">
              <input v-model="createForm.isPrivate" type="checkbox" />
              仅自己可见
            </label>
            <button type="button" class="mini-btn primary" :disabled="createForm.busy" @click="submitCreate">
              {{ createForm.busy ? "创建中…" : "创建" }}
            </button>
            <button type="button" class="mini-btn" @click="createForm.open = false">取消</button>
          </div>

          <button
            v-if="isLoggedIn && !createForm.open"
            type="button"
            class="create-folder"
            @click="openCreate(sec.value)"
          >
            ＋ 在{{ sec.label }}区新建文件夹
          </button>

          <template v-if="sec.value === 'none'">
            <h2 class="loose-heading">未入文件夹的文章</h2>
            <p v-if="loose.error" class="state error">{{ loose.error }}</p>
            <p v-else-if="loose.loading && !loose.posts.length" class="state-inline">正在加载...</p>
            <p v-else-if="!loose.posts.length" class="state-inline">所有文章都在文件夹里。</p>
            <template v-else>
              <article v-for="post in loose.posts" :key="post.id" class="post-row">
                <img
                  v-if="post.coverUrl"
                  class="post-cover"
                  :src="post.coverUrl"
                  :alt="`${post.title}封面`"
                  loading="lazy"
                />
                <div class="post-body">
                  <div class="post-title-line">
                    <span v-if="post.type" class="post-type" :class="`is-${post.type}`">
                      {{ TYPE_LABELS[post.type] || "专栏" }}
                    </span>
                    <span v-if="post.isPrivate" class="badge private small">仅自己可见</span>
                    <RouterLink
                      class="post-title"
                      :to="{ name: 'wiki-post', params: { title: post.title } }"
                    >
                      {{ post.title || "未命名文章" }}
                    </RouterLink>
                  </div>
                  <p>{{ post.excerpt || "暂无摘要" }}</p>
                  <small>
                    {{ post.author || post.creator || "未署名" }}
                    · {{ formatDateTime(post.updatedAt || post.submittedAt) }}
                  </small>
                </div>
              </article>
              <div v-if="loose.nextCursor" class="load-more small">
                <button type="button" :disabled="loose.loading" @click="loadLoose(loose.nextCursor)">
                  {{ loose.loading ? "正在加载..." : "加载更多" }}
                </button>
              </div>
            </template>
          </template>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.badge.private { flex: none; align-self: center; border-radius: 999px; padding: 2px 7px; font-size: 10px; font-weight: 700; background: #fdeaea; color: #a13f39; }
.columns-page { width: min(100% - 48px, 980px); min-height: calc(100vh - 65px); margin: 0 auto; padding: 42px 0 80px; background: #fff; }
.columns-heading { display: flex; flex-direction: column; gap: 8px; margin-bottom: 22px; border-bottom: 1px solid #a2a9b1; padding-bottom: 14px; }
.columns-heading h1 { margin: 0; color: #202122; font-family: Georgia, "Noto Serif SC", serif; font-size: 30px; font-weight: 400; }
.columns-hint { margin: 0; color: #9ca3af; font-size: 13px; }

.folder-section { margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
.section-head { background: #f8f9fa; }
.section-toggle { display: flex; width: 100%; align-items: center; gap: 10px; padding: 14px 16px; border: 0; background: transparent; font: inherit; cursor: pointer; text-align: left; }
.section-toggle:hover { background: #eef1f4; }
.section-name { color: #202122; font-size: 16px; font-weight: 700; }
.section-count { color: #9ca3af; font-size: 12px; }

.chevron { flex: none; width: 8px; height: 8px; border-right: 2px solid #54595d; border-bottom: 2px solid #54595d; transform: rotate(-45deg); transition: transform 0.15s ease; }
.chevron.open { transform: rotate(45deg); }
.chevron.small { width: 6px; height: 6px; }

.section-body { padding: 10px 16px 18px; }
.folder-block { border-bottom: 1px solid #f0f1f3; }
.folder-block:last-of-type { border-bottom: 0; }
.folder-line { display: flex; align-items: center; gap: 8px; }
.folder-main { display: flex; flex: 1; min-width: 0; align-items: center; gap: 10px; padding: 12px 4px; border: 0; background: transparent; font: inherit; cursor: pointer; text-align: left; }
.folder-main:hover .folder-name { color: #3366cc; text-decoration: underline; }
.folder-icon { flex: none; width: 16px; height: 12px; border: 1.5px solid #b8860b; border-radius: 2px 3px 3px 3px; background: #fdf3d7; position: relative; }
.folder-icon::before { content: ""; position: absolute; top: -5px; left: -1.5px; width: 7px; height: 4px; border: 1.5px solid #b8860b; border-bottom: 0; border-radius: 2px 2px 0 0; }
.folder-name { color: #111827; font-size: 15px; font-weight: 700; }
.folder-meta { color: #9ca3af; font-size: 12px; }
.folder-actions { display: flex; flex: none; gap: 6px; }

.mini-btn { padding: 4px 10px; border: 1px solid #c8ccd1; border-radius: 999px; background: #fff; color: #54595d; font: inherit; font-size: 12px; cursor: pointer; white-space: nowrap; }
.mini-btn:hover { border-color: #3366cc; color: #3366cc; }
.mini-btn.primary { border-color: #3366cc; background: #eaf3ff; color: #3366cc; font-weight: 700; }
.mini-btn.danger:hover { border-color: #b42318; color: #b42318; background: #fdeaea; }
.mini-btn:disabled { opacity: 0.6; cursor: default; }

.folder-form { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px 4px 14px; }
.private-toggle { display: flex; align-items: center; gap: 4px; font-size: 12.5px; color: #555; cursor: pointer; white-space: nowrap; }
.folder-lock { margin-left: 4px; font-size: 12px; }
.folder-form input { flex: 1; min-width: 180px; padding: 7px 10px; border: 1px solid #c8ccd1; border-radius: 8px; font: inherit; font-size: 13px; }
.folder-form select { padding: 7px 8px; border: 1px solid #c8ccd1; border-radius: 8px; font: inherit; font-size: 13px; }

.folder-posts { margin: 0 4px 14px; padding: 12px; border: 1px solid #eef0f2; border-radius: 10px; background: #fcfcfd; }
.folder-toolbar { margin-bottom: 8px; }
.add-panel { margin-bottom: 12px; padding: 10px; border: 1px dashed #c8ccd1; border-radius: 8px; background: #fff; }
.add-search { display: flex; gap: 8px; }
.add-search input { flex: 1; min-width: 160px; padding: 6px 10px; border: 1px solid #c8ccd1; border-radius: 8px; font: inherit; font-size: 13px; }
.add-results { margin: 10px 0 0; padding: 0; list-style: none; }
.add-more { margin-top: 8px; text-align: center; }
.add-results li { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px solid #f0f1f3; }
.add-results li:last-child { border-bottom: 0; }
.add-title { flex: 1; min-width: 0; overflow: hidden; color: #111827; font-size: 13px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.add-results small { flex: none; color: #9ca3af; font-size: 11px; }

.post-row { display: flex; gap: 14px; padding: 14px 0; border-bottom: 1px solid #e5e7eb; align-items: flex-start; }
.post-cover { flex: none; width: 120px; height: 80px; border-radius: 8px; object-fit: cover; border: 1px solid #e5e7eb; }
.post-body { min-width: 0; flex: 1; }
.post-title-line { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.post-type { flex: none; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; }
.post-type.is-news { background: #fdeaea; color: #a13f39; }
.post-type.is-science { background: #e7f2ec; color: #2b6b57; }
.post-title { color: #111827; font-family: Georgia, "Noto Serif SC", serif; font-size: 17px; font-weight: 700; text-decoration: none; }
.post-title:hover { text-decoration: underline; }
.post-body p { margin: 6px 0; color: #6b7280; font-size: 13px; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.post-body small { color: #9ca3af; font-size: 12px; }
.remove-btn { flex: none; align-self: center; }

.create-folder { margin: 12px 0 4px; padding: 9px 18px; border: 1px dashed #c8ccd1; border-radius: 999px; background: #fff; color: #3366cc; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
.create-folder:hover { border-color: #3366cc; background: #f5f9ff; }

.loose-heading { margin: 22px 0 0; padding-top: 14px; border-top: 1px solid #e5e7eb; color: #54595d; font-size: 14px; font-weight: 700; }

.load-more { display: grid; place-items: center; padding: 22px 0 0; }
.load-more.small { padding: 12px 0 0; }
.load-more button { padding: 8px 22px; border: 1px solid #c8ccd1; border-radius: 999px; background: #fff; color: #3366cc; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
.load-more button:hover { border-color: #3366cc; }
.load-more button:disabled { opacity: 0.6; cursor: default; }
.state { padding: 40px 0; color: #9ca3af; text-align: center; }
.state.error { color: #b42318; }
.state-inline { margin: 8px 0; color: #9ca3af; font-size: 13px; }
.state-inline.error { color: #b42318; }
@media (max-width: 640px) { .columns-page { width: min(100% - 32px, 980px); padding-top: 26px; } .post-row { gap: 10px; } .post-cover { width: 88px; height: 62px; } .folder-actions { flex-direction: column; } }
</style>
