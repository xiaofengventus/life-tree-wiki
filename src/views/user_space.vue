<script setup>
/**
 * 用户空间 - 单列平铺布局（白色简洁主题）。
 * 每个区块 = 功能图标 + 标题 + 计数 + 折叠箭头「﹀」，默认收起；
 * 首次点开时才从服务器加载对应数据（懒加载），加载结果缓存。
 * 区块内容为「标题 + 摘要」行式列表（树相 / 文章 / 功能入口），
 * 避免大块文字堆叠，也不使用花哨的卡片网格。
 */
import { computed, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import navBar from "@/components/navBar.vue";
import admin_invites from "@/components/admin_invites.vue";
import ImageCropperDialog from "@/components/ImageCropperDialog.vue";
import { useUserStore } from "@/stores/user";
import { fetchUserSpace } from "@/services/users";
import { fetchConnections, fetchFavorites, setFollowing } from "@/services/social";
import { deletePost } from "@/services/posts";
import { deleteTree } from "@/services/trees";
import { uploadPreparedImage } from "@/utils/mediaImages";
import { formatDateTime } from "@/utils/date";
import { platformTreeLabel } from "@/utils/treeLabels";

const route = useRoute();
const userStore = useUserStore();
const profile = ref(null);
const loading = ref(true);
const errorMessage = ref("");
const editMessage = ref("");
const saving = ref(false);
const followingBusy = ref(false);
const avatarBusy = ref(false);
const avatarInput = ref(null);
const avatarCropper = ref(null);
const showEditor = ref(false);
const edit = reactive({ name: "", introduce: "" });

// ---- 折叠 + 懒加载 ----
// 各区块独立状态：open（展开）、loaded（已从服务器取回）、loading、data
const sections = reactive({
  trees: { open: false, loaded: false, loading: false, items: [], count: 0 },
  posts: { open: false, loaded: false, loading: false, items: [], count: 0 },
  timeline: { open: false, loaded: false, loading: false, items: [] },
  privateWorks: { open: false, loaded: false, loading: false, items: [], used: 0, limit: 5 },
  favorites: { open: false, loaded: false, loading: false, posts: [], trees: [] },
  connections: { open: false, loaded: false, loading: false, followers: [], following: [], count: 0 },
});

const requestedUid = computed(() => String(route.params.uid || userStore.user?.uid || ""));
const isOwner = computed(() => Boolean(profile.value?.uid && profile.value.uid === userStore.user?.uid));
const totalWorks = computed(() => sections.trees.count + sections.posts.count);
const roleLabel = computed(() => {
  if (profile.value?.uid === "U000001") return "站点所有者";
  return ({
    USER: "时序创作者",
    ADMIN: "平台推荐管理员",
    COOPERATOR: "合作社团",
  })[profile.value?.role] || "时序创作者";
});

// 功能入口（本人可见；图标 + 文字行）
const creatorLinks = computed(() => [
  { icon: "＋", label: "制作树相", note: "梳理一次成长或研究", to: "/evolution-tree" },
  { icon: "文", label: "发布文章", note: "记录一段完整思考", to: "/create-post" },
  { icon: "稿", label: "草稿箱", note: "继续此设备上的创作", to: "/drafts" },
  { icon: "协", label: "Contribution", note: "查看提交与审查任务", to: "/tree-contributions" },
  { icon: "铃", label: "通知中心", note: "评论与协作动态", to: "/notifications" },
  { icon: "图", label: "图片素材", note: "管理创作中的图片", to: "/media-library" },
]);

function itemTime(item) {
  const value = Date.parse(item.updatedAt || item.submittedAt || item.createdAt || "");
  return Number.isFinite(value) ? value : 0;
}

function publicPostPath(post) {
  return `/wiki/${encodeURIComponent(post.title || post.uid || post.id)}`;
}

function compactDate(value) {
  if (!value) return "时间未记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间未记录";
  return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}

function joinedDate(value) {
  if (!value) return "未知";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未知";
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

// 首屏：只加载 profile（基本信息 + 计数 + 私密作品摘要），内容列表等点开再取
async function loadProfile() {
  await userStore.initialize();
  const uid = requestedUid.value;
  if (!uid) return;
  loading.value = true;
  errorMessage.value = "";
  profile.value = null;
  try {
    const payload = await fetchUserSpace(uid);
    profile.value = payload.user;
    sections.trees.count = payload.counts?.trees || 0;
    sections.posts.count = payload.counts?.posts || 0;
    sections.connections.count = (payload.user?.followers || 0) + (payload.user?.following || 0);
    // 私密作品与收藏只带摘要计数，点开时再刷新
    const privateWorks = payload.privateWorks;
    if (privateWorks) {
      sections.privateWorks.used = privateWorks.used || 0;
      sections.privateWorks.limit = privateWorks.limit || 5;
    }
    edit.name = profile.value.name || "";
    edit.introduce = profile.value.introduce || "";
    // 重置懒加载缓存（切换用户时）
    for (const key of Object.keys(sections)) {
      sections[key].open = false;
      sections[key].loaded = false;
      sections[key].loading = false;
    }
  } catch (error) {
    profile.value = null;
    errorMessage.value = error.message || "用户空间加载失败";
  } finally {
    loading.value = false;
  }
}

// 点开区块：首次展开时才请求服务器，之后用缓存
async function toggleSection(name) {
  const section = sections[name];
  if (!section) return;
  section.open = !section.open;
  if (section.open && !section.loaded && !section.loading) {
    await loadSection(name);
  }
}

async function loadSection(name) {
  const section = sections[name];
  const uid = requestedUid.value;
  if (!uid || !section || section.loading) return;
  section.loading = true;
  try {
    if (name === "trees" || name === "posts" || name === "privateWorks" || name === "timeline") {
      // 这四类都来自用户空间接口
      const payload = await fetchUserSpace(uid);
      section.loaded = true;
      if (name === "trees") {
        section.items = payload.trees || [];
        section.count = payload.counts?.trees || section.items.length;
      } else if (name === "posts") {
        section.items = payload.posts || [];
        section.count = payload.counts?.posts || section.items.length;
      } else if (name === "privateWorks") {
        const works = payload.privateWorks || { posts: [], trees: [], used: 0, limit: 5 };
        section.items = [
          ...works.trees.map((item) => ({ ...item, contentType: "tree" })),
          ...works.posts.map((item) => ({ ...item, contentType: "post" })),
        ].sort((first, second) => itemTime(second) - itemTime(first));
        section.used = works.used || section.items.length;
        section.limit = works.limit || 5;
      } else if (name === "timeline") {
        section.items = [
          ...(payload.trees || []).map((item) => ({ ...item, contentType: "tree" })),
          ...(payload.posts || []).map((item) => ({ ...item, contentType: "post" })),
        ].sort((first, second) => itemTime(second) - itemTime(first)).slice(0, 6);
      }
    } else if (name === "favorites") {
      if (isOwner.value) {
        const payload = await fetchFavorites().catch(() => ({ posts: [], trees: [] }));
        section.posts = payload.posts || [];
        section.trees = payload.trees || [];
      }
      section.loaded = true;
    } else if (name === "connections") {
      const payload = await fetchConnections(uid).catch(() => ({ followers: [], following: [] }));
      section.followers = payload.followers || [];
      section.following = payload.following || [];
      section.count = section.followers.length + section.following.length;
      section.loaded = true;
    }
  } catch (error) {
    editMessage.value = error.message || "内容加载失败";
  } finally {
    section.loading = false;
  }
}

async function removePrivateWork(item) {
  if (!isOwner.value) return;
  const label = item.contentType === "tree" ? "进化树" : "文章";
  if (!window.confirm(`确定删除仅自己可见的${label}“${item.title || "未命名作品"}”吗？`)) {
    return;
  }
  editMessage.value = "";
  try {
    if (item.contentType === "tree") {
      await deleteTree(item.uid || item.id);
    } else {
      await deletePost(item.uid || item.id);
    }
    await loadSection("privateWorks");
    editMessage.value = "私密作品已删除，名额已经释放。";
  } catch (error) {
    editMessage.value = error.message || "删除失败";
  }
}

async function saveProfile() {
  if (!isOwner.value) return;
  saving.value = true;
  editMessage.value = "";
  const success = await userStore.updateProfile({ name: edit.name, introduce: edit.introduce });
  if (success) {
    profile.value = { ...profile.value, ...userStore.user };
    editMessage.value = "个人资料已保存。";
  } else {
    editMessage.value = userStore.lastError || "保存失败";
  }
  saving.value = false;
}

async function toggleFollowing() {
  if (isOwner.value || !profile.value) return;
  if (!userStore.isLoggedIn) {
    editMessage.value = "请先登录后再关注用户。";
    return;
  }
  followingBusy.value = true;
  editMessage.value = "";
  try {
    const state = await setFollowing(profile.value.uid, !profile.value.isFollowing);
    Object.assign(profile.value, state);
  } catch (error) {
    editMessage.value = error.message || "关注操作失败";
  } finally {
    followingBusy.value = false;
  }
}

async function changeAvatar(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file || !isOwner.value) return;
  try {
    await avatarCropper.value?.open(file);
  } catch (error) {
    editMessage.value = error.message || "无法打开头像图片";
  }
}

async function applyAvatarCrop(prepared) {
  avatarBusy.value = true;
  editMessage.value = "正在上传裁剪后的头像……";
  try {
    const image = await uploadPreparedImage(prepared);
    const success = await userStore.updateProfile({
      name: edit.name,
      introduce: edit.introduce,
      avatarHash: image.hash,
    });
    if (!success) throw new Error(userStore.lastError || "头像保存失败");
    profile.value = { ...profile.value, ...userStore.user };
    editMessage.value = "头像已更新。";
  } catch (error) {
    editMessage.value = error.message || "头像上传失败";
  } finally {
    avatarBusy.value = false;
  }
}

async function removeAvatar() {
  if (!isOwner.value || !profile.value?.avatarUrl) return;
  avatarBusy.value = true;
  const success = await userStore.updateProfile({
    name: edit.name,
    introduce: edit.introduce,
    avatarHash: "",
  });
  if (success) {
    profile.value = { ...profile.value, ...userStore.user };
    editMessage.value = "头像已恢复为默认图片。";
  } else {
    editMessage.value = userStore.lastError || "头像移除失败";
  }
  avatarBusy.value = false;
}

function openEditor() {
  showEditor.value = true;
}

watch(requestedUid, loadProfile, { immediate: true });
</script>

<template>
  <navBar />
  <main class="space-page">
    <p v-if="loading" class="state">
      <span class="state-mark"></span>
      正在展开这段生命时序……
    </p>

    <section v-else-if="errorMessage" class="state error">
      <h1>无法打开用户空间</h1>
      <p>{{ errorMessage }}</p>
      <RouterLink to="/">返回首页</RouterLink>
    </section>

    <div v-else-if="profile" class="space-container">
      <!-- 顶部：头像 + 名称 + 数据行（单行平铺，不占大面积） -->
      <header class="space-head">
        <span class="head-avatar">
          <img v-if="profile.avatarUrl" :src="profile.avatarUrl" :alt="profile.name" />
          <i v-else>{{ profile.name?.slice(0, 1) || "时" }}</i>
        </span>
        <div class="head-copy">
          <h1>
            {{ profile.name || "这位创作者" }}
            <span class="level-chip">Lv.{{ profile.level ?? 0 }}</span>
            <span class="role-chip">{{ roleLabel }}</span>
          </h1>
          <p class="head-intro">{{ profile.introduce || "这位创作者还没有留下简介。" }}</p>
          <div class="head-meta">
            <span>UID {{ profile.uid || "-" }}</span>
            <span>加入于 {{ joinedDate(profile.signup_data) }}</span>
            <span>{{ totalWorks }} 项公开创作</span>
            <span>{{ profile.followers || 0 }} 粉丝 · {{ profile.following || 0 }} 关注</span>
          </div>
        </div>
        <div class="head-actions">
          <button
            v-if="!isOwner"
            class="follow-button"
            :class="{ following: profile.isFollowing }"
            :disabled="followingBusy"
            @click="toggleFollowing"
          >
            {{ followingBusy ? "处理中…" : profile.isFollowing ? "已关注" : "+ 关注" }}
          </button>
          <button v-else type="button" class="plain-button" @click="openEditor">编辑资料</button>
        </div>
      </header>

      <p v-if="editMessage && !showEditor" class="page-message">{{ editMessage }}</p>

      <!-- 创作功能入口（本人可见）：图标 + 文字，行式平铺 -->
      <section v-if="isOwner" class="flat-section">
        <div class="entry-row-list">
          <RouterLink v-for="link in creatorLinks" :key="link.to" class="entry-row" :to="link.to">
            <span class="entry-icon" aria-hidden="true">{{ link.icon }}</span>
            <span class="entry-copy">
              <strong>{{ link.label }}</strong>
              <small>{{ link.note }}</small>
            </span>
          </RouterLink>
          <button type="button" class="entry-row" @click="openEditor">
            <span class="entry-icon" aria-hidden="true">设</span>
            <span class="entry-copy">
              <strong>编辑资料</strong>
              <small>更新头像、昵称与简介</small>
            </span>
          </button>
        </div>
      </section>

      <!-- 编辑资料（本人，可展开） -->
      <section v-if="isOwner && showEditor" class="flat-section editor-panel">
        <form @submit.prevent="saveProfile">
          <div class="avatar-editor">
            <input ref="avatarInput" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="changeAvatar" />
            <button type="button" :disabled="avatarBusy" @click="avatarInput?.click()">{{ avatarBusy ? "处理中…" : "更换头像" }}</button>
            <button v-if="profile.avatarUrl" type="button" class="remove-avatar" :disabled="avatarBusy" @click="removeAvatar">恢复默认头像</button>
          </div>
          <label>昵称<input v-model.trim="edit.name" maxlength="40" required /></label>
          <label class="bio-field">个人简介<textarea v-model.trim="edit.introduce" maxlength="500" rows="4"></textarea></label>
          <div class="form-actions">
            <button class="save-button" :disabled="saving">{{ saving ? "保存中…" : "保存资料" }}</button>
            <button type="button" class="close-editor" @click="showEditor = false">收起</button>
            <span v-if="editMessage">{{ editMessage }}</span>
          </div>
        </form>
      </section>

      <!-- 树相：折叠 + 懒加载 -->
      <section class="fold-section">
        <button type="button" class="fold-head" @click="toggleSection('trees')">
          <svg class="fold-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M12 2.7 14.2 7l4.8.7-3.5 3.4.8 4.8L12 13.6l-4.3 2.3.8-4.8L5 7.7 9.8 7 12 2.7Z" fill="currentColor" />
          </svg>
          <strong>树相</strong>
          <small>{{ sections.trees.count }} 棵公开树相</small>
          <i class="fold-arrow" :class="{ open: sections.trees.open }" aria-hidden="true">﹀</i>
        </button>
        <div v-if="sections.trees.open" class="fold-body">
          <p v-if="sections.trees.loading" class="fold-state">正在从服务器加载树相……</p>
          <template v-else-if="sections.trees.items.length">
            <article v-for="tree in sections.trees.items" :key="tree.id" class="line-item">
              <div class="line-copy">
                <RouterLink class="line-title" :to="`/life-tree/${tree.uid || tree.id}`">
                  {{ tree.title || "未命名树相" }}
                </RouterLink>
                <p>{{ tree.description || "等待作者写下这棵树的来处与方向。" }}</p>
                <small>
                  {{ tree.nodeCount || 0 }} 节点
                  <template v-if="platformTreeLabel(tree)"> · {{ platformTreeLabel(tree) }}</template>
                  · {{ formatDateTime(tree.updatedAt) }}
                </small>
              </div>
            </article>
          </template>
          <p v-else class="fold-state">
            还没有公开树相。<RouterLink v-if="isOwner" to="/evolution-tree">制作第一棵树相 →</RouterLink>
          </p>
        </div>
      </section>

      <!-- 文章：折叠 + 懒加载 -->
      <section class="fold-section">
        <button type="button" class="fold-head" @click="toggleSection('posts')">
          <svg class="fold-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M5 3h11l3 3v15H5V3Zm2 2v14h10V7h-3V5H7Zm2 4h6v2H9V9Zm0 4h6v2H9v-2Z" fill="currentColor" />
          </svg>
          <strong>文章</strong>
          <small>{{ sections.posts.count }} 篇公开文章</small>
          <i class="fold-arrow" :class="{ open: sections.posts.open }" aria-hidden="true">﹀</i>
        </button>
        <div v-if="sections.posts.open" class="fold-body">
          <p v-if="sections.posts.loading" class="fold-state">正在从服务器加载文章……</p>
          <template v-else-if="sections.posts.items.length">
            <article v-for="post in sections.posts.items" :key="post.id" class="line-item">
              <div class="line-copy">
                <RouterLink class="line-title" :to="publicPostPath(post)">
                  {{ post.title || "未命名文章" }}
                </RouterLink>
                <p>{{ post.excerpt || "作者还没有为这篇文章补充摘要。" }}</p>
                <small>{{ formatDateTime(post.updatedAt || post.submittedAt) }}</small>
              </div>
            </article>
          </template>
          <p v-else class="fold-state">
            还没有公开文章。<RouterLink v-if="isOwner" to="/create-post">开始写作 →</RouterLink>
          </p>
        </div>
      </section>

      <!-- 最近进化：折叠 + 懒加载 -->
      <section class="fold-section">
        <button type="button" class="fold-head" @click="toggleSection('timeline')">
          <svg class="fold-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M3.5 12h4l2-6 4 12 2-6h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <strong>最近进化</strong>
          <small>最新的树相与文章动态</small>
          <i class="fold-arrow" :class="{ open: sections.timeline.open }" aria-hidden="true">﹀</i>
        </button>
        <div v-if="sections.timeline.open" class="fold-body">
          <p v-if="sections.timeline.loading" class="fold-state">正在从服务器加载动态……</p>
          <template v-else-if="sections.timeline.items.length">
            <article v-for="item in sections.timeline.items" :key="`${item.contentType}-${item.id}`" class="line-item">
              <div class="line-copy">
                <small class="line-kind">{{ item.contentType === "tree" ? "树相更新" : "文章发布" }}</small>
                <RouterLink class="line-title" :to="item.contentType === 'tree' ? `/life-tree/${item.uid || item.id}` : publicPostPath(item)">
                  {{ item.title || "未命名记录" }}
                </RouterLink>
                <small>{{ compactDate(item.updatedAt || item.submittedAt) }}</small>
              </div>
            </article>
          </template>
          <p v-else class="fold-state">进化刚刚开始：第一棵树相或第一篇文章会出现在这里。</p>
        </div>
      </section>

      <!-- 仅自己可见：折叠 + 懒加载（本人） -->
      <section v-if="isOwner" class="fold-section">
        <button type="button" class="fold-head" @click="toggleSection('privateWorks')">
          <svg class="fold-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M6 10V8a6 6 0 1 1 12 0v2h1v11H5V10h1Zm2 0h8V8a4 4 0 1 0-8 0v2Z" fill="currentColor" />
          </svg>
          <strong>仅自己可见</strong>
          <small>{{ sections.privateWorks.used }}/{{ sections.privateWorks.limit }} 个名额</small>
          <i class="fold-arrow" :class="{ open: sections.privateWorks.open }" aria-hidden="true">﹀</i>
        </button>
        <div v-if="sections.privateWorks.open" class="fold-body">
          <p v-if="sections.privateWorks.loading" class="fold-state">正在从服务器加载私密作品……</p>
          <template v-else-if="sections.privateWorks.items.length">
            <article v-for="item in sections.privateWorks.items" :key="`private-${item.contentType}-${item.id}`" class="line-item">
              <div class="line-copy">
                <small class="line-kind">{{ item.contentType === "tree" ? "进化树" : "文章" }}</small>
                <strong class="line-title plain">{{ item.title || "未命名作品" }}</strong>
                <small>{{ formatDateTime(item.updatedAt) }}</small>
              </div>
              <div class="line-actions">
                <RouterLink
                  :to="item.contentType === 'tree'
                    ? `/evolution-tree?edit=${encodeURIComponent(item.uid || item.id)}`
                    : `/create-post?edit=${encodeURIComponent(item.uid || item.id)}`"
                >
                  继续编辑
                </RouterLink>
                <button type="button" @click="removePrivateWork(item)">删除</button>
              </div>
            </article>
          </template>
          <p v-else class="fold-state">还没有私密作品：在文章或进化树编辑器中选择“保存为仅自己可见”。</p>
        </div>
      </section>

      <!-- 我的收藏：折叠 + 懒加载（本人） -->
      <section v-if="isOwner" class="fold-section">
        <button type="button" class="fold-head" @click="toggleSection('favorites')">
          <svg class="fold-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M12 4.6C9.9 2.6 6.4 2.8 4.6 5a5 5 0 0 0 .3 7L12 18.8l7.1-6.8a5 5 0 0 0 .3-7c-1.8-2.2-5.3-2.4-7.4-.4Z" fill="currentColor" />
          </svg>
          <strong>我的收藏</strong>
          <small>仅自己可见</small>
          <i class="fold-arrow" :class="{ open: sections.favorites.open }" aria-hidden="true">﹀</i>
        </button>
        <div v-if="sections.favorites.open" class="fold-body">
          <p v-if="sections.favorites.loading" class="fold-state">正在从服务器加载收藏……</p>
          <template v-else-if="sections.favorites.trees.length || sections.favorites.posts.length">
            <article v-for="tree in sections.favorites.trees" :key="`fav-tree-${tree.id}`" class="line-item">
              <div class="line-copy">
                <small class="line-kind">树相</small>
                <RouterLink class="line-title" :to="`/life-tree/${tree.uid || tree.id}`">{{ tree.title }}</RouterLink>
              </div>
            </article>
            <article v-for="post in sections.favorites.posts" :key="`fav-post-${post.id}`" class="line-item">
              <div class="line-copy">
                <small class="line-kind">文章</small>
                <RouterLink class="line-title" :to="publicPostPath(post)">{{ post.title }}</RouterLink>
              </div>
            </article>
          </template>
          <p v-else class="fold-state">还没有收藏：在阅读树相或文章时点击收藏即可。</p>
        </div>
      </section>

      <!-- 粉丝与关注：折叠 + 懒加载 -->
      <section class="fold-section">
        <button type="button" class="fold-head" @click="toggleSection('connections')">
          <svg class="fold-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.3 0-7 1.7-7 4v3h14v-3c0-2.3-3.7-4-7-4Zm8.5-2.2a3.2 3.2 0 1 0-2.2-5.5 5.9 5.9 0 0 1 0 4.7c.6.5 1.4.8 2.2.8ZM19 13.4c-.8 0-1.6.1-2.3.4 1.4.9 2.3 2.1 2.3 3.5v3h4v-3c0-2-2.2-3.6-4-3.9Z" fill="currentColor" />
          </svg>
          <strong>粉丝与关注</strong>
          <small>{{ profile.followers || 0 }} 粉丝 · {{ profile.following || 0 }} 关注</small>
          <i class="fold-arrow" :class="{ open: sections.connections.open }" aria-hidden="true">﹀</i>
        </button>
        <div v-if="sections.connections.open" class="fold-body">
          <p v-if="sections.connections.loading" class="fold-state">正在从服务器加载关系列表……</p>
          <template v-else-if="sections.connections.followers.length || sections.connections.following.length">
            <article v-for="person in sections.connections.followers" :key="`follower-${person.uid}`" class="line-item">
              <div class="line-copy">
                <small class="line-kind">粉丝</small>
                <RouterLink class="line-title" :to="`/users/${person.uid}`">{{ person.name }}</RouterLink>
              </div>
            </article>
            <article v-for="person in sections.connections.following" :key="`following-${person.uid}`" class="line-item">
              <div class="line-copy">
                <small class="line-kind">关注中</small>
                <RouterLink class="line-title" :to="`/users/${person.uid}`">{{ person.name }}</RouterLink>
              </div>
            </article>
          </template>
          <p v-else class="fold-state">新的连接，会从一次共同的兴趣开始。</p>
        </div>
      </section>

      <!-- 管理入口（管理员） -->
      <section v-if="isOwner && (userStore.role === 'ADMIN' || userStore.isSiteOwner)" class="fold-section">
        <div class="admin-links">
          <RouterLink v-if="userStore.isSiteOwner" to="/admin/users">用户管理</RouterLink>
          <RouterLink v-if="userStore.role === 'ADMIN'" to="/admin/official-trees">平台推荐管理</RouterLink>
          <RouterLink v-if="userStore.isSiteOwner" to="/admin/deleted-posts">已删除文章</RouterLink>
        </div>
      </section>

      <admin_invites v-if="isOwner && userStore.isSiteOwner" />

      <ImageCropperDialog
        ref="avatarCropper"
        title="调整头像"
        :aspect-ratio="1"
        :output-width="512"
        :output-height="512"
        round-preview
        @confirm="applyAvatarCrop"
      />
    </div>

    <p v-else class="state">用户不存在。</p>
  </main>
</template>

<style scoped>
/* 单列平铺 · 白色简洁 */
.space-page {
  min-height: 100vh;
  padding: 84px 18px 64px;
  background: #fff;
  color: #243b34;
}

.space-container {
  width: min(100%, 880px);
  margin-right: auto;
  margin-left: auto;
}

.state {
  display: grid;
  min-height: 60vh;
  place-content: center;
  justify-items: center;
  gap: 14px;
  color: #70827c;
  text-align: center;
}

.state-mark {
  width: 42px;
  height: 42px;
  border: 3px solid #d5e5df;
  border-top-color: #2f8870;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.state.error h1 { margin: 0; color: #963a36; }
.state.error p { margin: 0; }
.state.error a { color: #256b58; font-weight: 700; }

@keyframes spin { to { transform: rotate(360deg); } }

.page-message { margin: 0 0 14px; color: #2f8870; font-size: 0.86rem; }

/* 顶部信息行 */
.space-head {
  display: flex;
  align-items: center;
  gap: 18px;
  padding-bottom: 18px;
  border-bottom: 1px solid #e7ece9;
}

.head-avatar {
  display: grid;
  width: 74px;
  height: 74px;
  flex: none;
  overflow: hidden;
  place-items: center;
  border: 2px solid #e4efe9;
  border-radius: 50%;
  background: #f0f7f3;
}

.head-avatar img { width: 100%; height: 100%; object-fit: cover; }
.head-avatar i { color: #2f8870; font-size: 1.6rem; font-style: normal; font-weight: 800; }

.head-copy { min-width: 0; flex: 1; }

.head-copy h1 {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #223b33;
  font-size: 1.3rem;
  letter-spacing: -0.02em;
}

.level-chip {
  padding: 2px 9px;
  border-radius: 99px;
  background: #eaf5f0;
  color: #2f8870;
  font-size: 0.68rem;
  font-weight: 800;
}

.role-chip {
  padding: 2px 9px;
  border-radius: 99px;
  border: 1px solid #dce7e2;
  color: #71817c;
  font-size: 0.68rem;
  font-weight: 700;
}

.head-intro {
  margin: 7px 0 0;
  color: #71817c;
  font-size: 0.88rem;
  line-height: 1.6;
}

.head-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin-top: 9px;
  color: #8a9a93;
  font-size: 0.74rem;
}

.head-actions { flex: none; }

.follow-button {
  min-width: 96px;
  padding: 8px 16px;
  border: 1px solid #2f8870;
  border-radius: 999px;
  background: #2f8870;
  color: #fff;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.follow-button.following {
  border-color: #cfdfd8;
  background: #fff;
  color: #54595d;
}

.plain-button {
  padding: 8px 16px;
  border: 1px solid #c8ddd2;
  border-radius: 999px;
  background: #fff;
  color: #2f8870;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

/* 功能入口：图标 + 文字行 */
.entry-row-list { display: grid; }

.entry-row {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  padding: 13px 4px;
  border-bottom: 1px solid #eef2f0;
  color: inherit;
  text-align: left;
  text-decoration: none;
}

.entry-row:hover .entry-copy strong { color: #2f8870; }

.entry-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 1px solid #dce7e2;
  border-radius: 12px;
  background: #f6faf8;
  color: #2f8870;
  font-size: 0.92rem;
  font-weight: 800;
}

.entry-copy { display: grid; gap: 2px; min-width: 0; }
.entry-copy strong { color: #29473d; font-size: 0.9rem; }
.entry-copy small { color: #8a9a93; font-size: 0.74rem; }

/* 折叠区块 */
.fold-section { border-bottom: 1px solid #e7ece9; }

.fold-head {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 11px;
  padding: 15px 4px;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.fold-head:hover strong { color: #2f8870; }

.fold-icon { flex: none; color: #2f8870; }

.fold-head strong { color: #29473d; font-size: 0.98rem; }

.fold-head small { color: #8a9a93; font-size: 0.74rem; }

.fold-arrow {
  margin-left: auto;
  color: #9aaba3;
  font-style: normal;
  font-size: 0.8rem;
  transition: transform 0.18s ease;
}

.fold-arrow.open { transform: rotate(180deg); }

.fold-body { padding: 2px 4px 16px 33px; }

.fold-state { margin: 4px 0 10px; color: #8a9a93; font-size: 0.84rem; }

/* 行式内容条目 */
.line-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 0;
  border-bottom: 1px solid #eef2f0;
}

.line-item:last-child { border-bottom: 0; }

.line-copy { display: grid; min-width: 0; gap: 3px; }

.line-kind {
  width: fit-content;
  padding: 1px 8px;
  border-radius: 99px;
  background: #f1f6f3;
  color: #5f7a70;
  font-size: 0.66rem;
  font-weight: 700;
}

.line-title {
  overflow: hidden;
  color: #223b33;
  font-size: 0.94rem;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-decoration: none;
}

.line-title:hover { color: #2f8870; }
.line-title.plain { cursor: default; }

.line-copy p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: #71817c;
  font-size: 0.8rem;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.line-copy > small { color: #8a9a93; font-size: 0.72rem; }

.line-actions { display: flex; flex: none; gap: 10px; }

.line-actions a,
.line-actions button {
  padding: 5px 12px;
  border: 1px solid #c8ddd2;
  border-radius: 999px;
  background: #fff;
  color: #2f8870;
  font: inherit;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
}

.line-actions button { border-color: #dcb9b6; color: #a33d37; }

/* 编辑资料表单 */
.editor-panel { padding: 16px 4px 20px; }

.editor-panel form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 14px 18px;
}

.editor-panel label { display: grid; gap: 6px; color: #5f7a70; font-size: 0.8rem; }

.editor-panel input,
.editor-panel textarea {
  padding: 9px 12px;
  border: 1px solid #c8ddd2;
  border-radius: 9px;
  background: #fff;
  color: #223b33;
  font: inherit;
  font-size: 0.88rem;
}

.bio-field { grid-column: 1 / -1; }

.avatar-editor { display: flex; align-content: center; gap: 10px; align-items: center; }

.avatar-editor button,
.form-actions button {
  padding: 8px 14px;
  border: 1px solid #c8ddd2;
  border-radius: 9px;
  background: #fff;
  color: #2f8870;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.avatar-editor .remove-avatar { color: #a33d37; }

.form-actions { grid-column: 1 / -1; display: flex; align-items: center; gap: 12px; }

.save-button { border-color: #2f8870 !important; background: #2f8870 !important; color: #fff !important; }

.form-actions span { color: #2f8870; font-size: 0.8rem; }

/* 管理入口 */
.admin-links { display: flex; flex-wrap: wrap; gap: 10px; padding: 15px 4px; }

.admin-links a {
  padding: 7px 14px;
  border: 1px solid #c8ddd2;
  border-radius: 999px;
  color: #2f8870;
  font-size: 0.8rem;
  font-weight: 700;
  text-decoration: none;
}

@media (max-width: 640px) {
  .space-page { padding: 72px 12px 40px; }
  .space-head { flex-direction: column; align-items: flex-start; gap: 14px; }
  .fold-body { padding-left: 4px; }
  .editor-panel form { grid-template-columns: 1fr; }
  .line-item { flex-direction: column; align-items: flex-start; gap: 8px; }
}
</style>
