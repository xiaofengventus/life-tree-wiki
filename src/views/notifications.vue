<script setup>
/**
 * 通知页 - 信封图标 + 分类筛选 + 一键已读。
 * 后端 8 种 type 归并为 4 个分类：评论（COMMENT_*）、协作（CONTRIBUTION_*）、
 * 平台推荐（OFFICIAL_TREE_*）、全部。
 * 点击单条通知：标记已读并跳转；「全部已读」调 PUT { all: true }。
 */
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import navBar from "@/components/navBar.vue";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications";
import { formatDateTime } from "@/utils/date";

// type → 分类键；未匹配的归入其它
const TYPE_GROUPS = {
  COMMENT_POST: "comment",
  COMMENT_TREE: "comment",
  CONTRIBUTION_SUBMITTED: "collaboration",
  CONTRIBUTION_APPROVED: "collaboration",
  CONTRIBUTION_REJECTED: "collaboration",
  OFFICIAL_TREE_REQUESTED: "official",
  OFFICIAL_TREE_APPROVED: "official",
  OFFICIAL_TREE_REJECTED: "official",
};

const GROUP_TABS = [
  { value: "", label: "全部", envelope: "all" },
  { value: "comment", label: "评论", envelope: "comment" },
  { value: "collaboration", label: "协作", envelope: "collaboration" },
  { value: "official", label: "平台推荐", envelope: "official" },
];

// 分类键 → 信封 SVG path（区分已读/未读由 CSS 着色）
const ENVELOPE_PATHS = {
  all: "M3 5.5A1.5 1.5 0 0 1 4.5 4h15A1.5 1.5 0 0 1 21 5.5v13A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5v-13Zm1.8.5 7.2 5.6L19.2 6H4.8Zm15.7 1.2-7.9 6.2a1.1 1.1 0 0 1-1.2 0L3.5 7.2v11h17v-11Z",
  comment: "M3 5.5A1.5 1.5 0 0 1 4.5 4h15A1.5 1.5 0 0 1 21 5.5v8A1.5 1.5 0 0 1 19.5 15H10l-4.4 3.6A.9.9 0 0 1 4 17.9V15h.5A1.5 1.5 0 0 1 3 13.5v-8Zm4.2 2a1 1 0 0 0 0 2h9.6a1 1 0 0 0 0-2H7.2Zm0 3.4a1 1 0 0 0 0 2h6.4a1 1 0 0 0 0-2H7.2Z",
  collaboration: "M12 3a4 4 0 0 0-2.2 7.3L7 13.1a2.6 2.6 0 1 0 1.4 1.4l2.8-2.8a4.1 4.1 0 0 0 1.6 0l2.8 2.8a2.6 2.6 0 1 0 1.4-1.4l-2.8-2.8A4 4 0 0 0 12 3Zm0 2.2a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6Z",
  official: "M12 2.6l2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8L12 2.6Z",
};

const router = useRouter();
const notifications = ref([]);
const unreadCount = ref(0);
const loading = ref(false);
const message = ref("");
const activeGroup = ref("");
const markingAll = ref(false);

function groupOf(item) {
  return TYPE_GROUPS[item.type] || "other";
}

const groupCounts = computed(() => {
  const counts = { "": notifications.value.length };
  for (const item of notifications.value) {
    const key = groupOf(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
});

const visibleNotifications = computed(() =>
  activeGroup.value === ""
    ? notifications.value
    : notifications.value.filter((item) => groupOf(item) === activeGroup.value),
);

const visibleUnreadCount = computed(() =>
  visibleNotifications.value.filter((item) => !item.read).length,
);

function envelopePath(group) {
  return ENVELOPE_PATHS[group] || ENVELOPE_PATHS.all;
}

function chooseGroup(value) {
  activeGroup.value = value;
}

async function load() {
  loading.value = true;
  try {
    const payload = await fetchNotifications();
    notifications.value = payload.notifications || [];
    unreadCount.value = Number(payload.unreadCount || 0);
  } catch (error) {
    message.value = error.message || "通知加载失败";
  } finally {
    loading.value = false;
  }
}

function broadcastUnread() {
  window.dispatchEvent(new CustomEvent("life-notifications-updated", {
    detail: { unreadCount: unreadCount.value },
  }));
}

async function openNotification(item) {
  try {
    if (!item.read) {
      const payload = await markNotificationRead(item.id);
      item.read = true;
      unreadCount.value = Number(payload.unreadCount || 0);
      broadcastUnread();
    }
  } finally {
    await router.push(item.href);
  }
}

async function markAll() {
  if (markingAll.value) return;
  markingAll.value = true;
  try {
    const payload = await markAllNotificationsRead();
    unreadCount.value = Number(payload.unreadCount || 0);
    notifications.value = notifications.value.map((item) => ({ ...item, read: true }));
    broadcastUnread();
  } catch (error) {
    message.value = error.message || "操作失败";
  } finally {
    markingAll.value = false;
  }
}

onMounted(load);
</script>

<template>
  <navBar />
  <main class="notifications-page">
    <header class="inbox-header">
      <!-- 信封图标 -->
      <span class="envelope-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="30" height="30">
          <path :d="envelopePath('all')" fill="currentColor" />
        </svg>
        <i v-if="unreadCount" class="envelope-badge">{{ unreadCount > 99 ? "99+" : unreadCount }}</i>
      </span>
      <div>
        <span>INBOX</span>
        <h1>通知</h1>
        <p>评论提醒与进化树协作审查动态。</p>
      </div>
      <button
        v-if="unreadCount"
        type="button"
        :disabled="markingAll"
        @click="markAll"
      >
        {{ markingAll ? "处理中…" : "一键全部已读" }}
      </button>
    </header>

    <!-- 分类筛选 -->
    <nav class="group-tabs" aria-label="通知分类">
      <button
        v-for="tab in GROUP_TABS"
        :key="tab.value || 'all'"
        type="button"
        :class="{ active: activeGroup === tab.value }"
        @click="chooseGroup(tab.value)"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path :d="envelopePath(tab.envelope)" fill="currentColor" />
        </svg>
        {{ tab.label }}
        <small v-if="groupCounts[tab.value]">{{ groupCounts[tab.value] }}</small>
      </button>
    </nav>

    <p v-if="message" class="page-message">{{ message }}</p>
    <section class="notification-list">
      <button
        v-for="item in visibleNotifications"
        :key="item.id"
        type="button"
        :class="{ unread: !item.read }"
        @click="openNotification(item)"
      >
        <span class="avatar">
          <img v-if="item.actor?.avatarUrl" :src="item.actor.avatarUrl" alt="" />
          <i v-else>{{ item.actor?.name?.slice(0, 1) || "系" }}</i>
        </span>
        <span class="content">
          <strong>{{ item.message }}</strong>
          <small>{{ item.actor?.name || "系统" }} · {{ formatDateTime(item.createdAt) }}</small>
        </span>
        <i v-if="!item.read" class="dot" aria-label="未读"></i>
      </button>
      <p v-if="!loading && !visibleNotifications.length">这个分类下还没有通知。</p>
      <p v-if="loading">正在加载通知……</p>
    </section>

    <!-- 当前分类的一键已读 -->
    <div v-if="visibleUnreadCount && activeGroup" class="group-mark-all">
      <button type="button" :disabled="markingAll" @click="markAll">
        {{ markingAll ? "处理中…" : `将 ${unreadCount} 条未读全部标为已读` }}
      </button>
    </div>
  </main>
</template>

<style scoped>
.notifications-page { min-height: 100vh; padding: 86px 18px 54px; background: #f4f7f5; color: #2b3e35; }
.notifications-page > header, .group-tabs, .notification-list, .page-message { width: min(100%, 980px); margin-right: auto; margin-left: auto; }

/* 头部：信封图标 + 标题 + 一键已读 */
.inbox-header { display: flex; align-items: center; gap: 16px; margin-bottom: 18px; }
.inbox-header > div { min-width: 0; }
.inbox-header span:not(.envelope-icon):not(.envelope-badge) { color: #2f806a; font-size: .72rem; font-weight: 850; letter-spacing: .16em; }
.inbox-header h1 { margin: 4px 0; }
.inbox-header p { margin: 0; color: #68786f; }
.inbox-header > button { margin-left: auto; flex: none; padding: 9px 16px; border: 1px solid #2f806a; border-radius: 999px; background: #fff; color: #2f806a; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.inbox-header > button:hover { background: #2f806a; color: #fff; }
.inbox-header > button:disabled { opacity: 0.6; cursor: default; }

/* 信封图标 + 未读角标 */
.envelope-icon { position: relative; display: grid; width: 58px; height: 58px; flex: none; place-items: center; border: 1px solid #cfe4da; border-radius: 16px; background: #fff; color: #2f806a; box-shadow: 0 6px 18px rgba(31, 106, 80, 0.12); }
.envelope-badge { position: absolute; top: -7px; right: -7px; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 99px; background: #d83b3b; color: #fff; font-size: .68rem; font-weight: 800; font-style: normal; line-height: 20px; text-align: center; }

/* 分类 tab */
.group-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.group-tabs button { display: inline-flex; align-items: center; gap: 7px; padding: 7px 14px; border: 1px solid #c8ddd2; border-radius: 999px; background: #fff; color: #54595d; font: inherit; font-size: 13px; cursor: pointer; }
.group-tabs button:hover { border-color: #2f806a; color: #2f806a; }
.group-tabs button.active { border-color: #2f806a; background: #eaf5f0; color: #2f806a; font-weight: 700; }
.group-tabs small { padding: 1px 7px; border-radius: 99px; background: #e5efe9; color: #2f806a; font-size: .68rem; font-weight: 700; }
.group-tabs button.active small { background: #2f806a; color: #fff; }

.page-message { color: #a13f39; }
.notification-list { overflow: hidden; border: 1px solid #d8e2dc; border-radius: 12px; background: #fff; }
.notification-list > button { display: grid; width: 100%; grid-template-columns: 44px minmax(0, 1fr) auto; align-items: center; gap: 13px; padding: 17px 18px; border: 0; border-bottom: 1px solid #e7ece9; background: #fff; color: inherit; text-align: left; cursor: pointer; }
.notification-list > button:hover { background: #f6faf8; }
.notification-list > button.unread { background: #eef7f3; }
.avatar, .avatar img, .avatar i { display: grid; width: 44px; height: 44px; overflow: hidden; place-items: center; border-radius: 50%; }
.avatar { background: #dff0e9; }
.avatar img { object-fit: cover; }
.avatar i { color: #24634f; font-style: normal; font-weight: 800; }
.content { display: grid; gap: 5px; }
.content strong { font-size: .92rem; }
.content small { color: #7b8982; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: #2f806a; }
.notification-list > p { padding: 28px; text-align: center; color: #7c8a83; }

/* 分类内一键已读 */
.group-mark-all { display: grid; place-items: center; width: min(100%, 980px); margin: 18px auto 0; }
.group-mark-all button { padding: 9px 20px; border: 1px solid #c8ddd2; border-radius: 999px; background: #fff; color: #2f806a; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.group-mark-all button:hover { border-color: #2f806a; }

@media (max-width: 640px) {
  .notifications-page { padding: 76px 8px 28px; }
  .inbox-header { flex-wrap: wrap; gap: 12px; }
  .inbox-header > button { margin-left: 0; }
  .notification-list > button { grid-template-columns: 38px minmax(0, 1fr) auto; padding: 14px 12px; }
  .avatar, .avatar img, .avatar i { width: 38px; height: 38px; }
}
</style>
