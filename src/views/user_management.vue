<script setup>
import { onMounted, ref } from "vue";
import navBar from "@/components/navBar.vue";
import { useUserStore } from "@/stores/user";
import { fetchAdminUsers, updateAdminUser } from "@/services/users";
import { formatDateTime } from "@/utils/date";

const userStore = useUserStore();
const users = ref([]);
const query = ref("");
const page = ref(1);
const total = ref(0);
const totalPages = ref(1);
const loading = ref(false);
const pageMessage = ref("");
const rowMessages = ref({});
const savingUid = ref("");
const mediaUsage = ref({ usedBytes: 0, limitBytes: 0 });

async function loadUsers(targetPage = page.value) {
  loading.value = true;
  pageMessage.value = "";
  try {
    const payload = await fetchAdminUsers({ query: query.value, page: targetPage });
    users.value = (payload.users || []).map((user) => ({
      ...user,
      mediaQuotaMb: Number(user.mediaQuotaBytes || 0) / 1024 / 1024,
    }));
    page.value = payload.page;
    total.value = payload.total;
    totalPages.value = payload.totalPages;
    mediaUsage.value = payload.media || mediaUsage.value;
  } catch (error) {
    pageMessage.value = error.message || "用户列表加载失败";
  } finally {
    loading.value = false;
  }
}

async function saveUser(user) {
  savingUid.value = user.uid;
  rowMessages.value = { ...rowMessages.value, [user.uid]: "" };
  try {
    const updated = await updateAdminUser(user.uid, {
      role: user.role,
      status: user.status,
      mediaQuotaMb: Number(user.mediaQuotaMb),
    });
    Object.assign(user, updated);
    user.mediaQuotaMb = Number(user.mediaQuotaBytes || 0) / 1024 / 1024;
    rowMessages.value = { ...rowMessages.value, [user.uid]: "已保存" };
  } catch (error) {
    rowMessages.value = { ...rowMessages.value, [user.uid]: error.message || "保存失败" };
    await loadUsers(page.value);
  } finally {
    savingUid.value = "";
  }
}

function search() {
  loadUsers(1);
}

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes ? 1 : 0)}KB`;
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

onMounted(() => loadUsers(1));
</script>

<template>
  <navBar />
  <main class="admin-page">
    <header class="admin-heading">
      <div><span>ADMIN CONSOLE</span><h1>用户管理</h1><p>管理角色、账号状态和图片空间；等级由经验值自动计算。</p></div>
      <div class="admin-links"><RouterLink to="/user-space">我的空间</RouterLink><RouterLink to="/admin/official-trees">平台推荐管理</RouterLink><RouterLink to="/admin/deleted-posts">已删除文章</RouterLink></div>
    </header>

    <section class="toolbar">
      <form @submit.prevent="search">
        <input v-model.trim="query" type="search" maxlength="80" placeholder="搜索 UID、用户名或昵称" />
        <button type="submit" :disabled="loading">搜索</button>
      </form>
      <span>共 {{ total }} 名用户 · 全站图片 {{ formatBytes(mediaUsage.usedBytes) }} / {{ formatBytes(mediaUsage.limitBytes) }}</span>
    </section>

    <p v-if="pageMessage" class="page-message">{{ pageMessage }}</p>
    <section class="user-table-wrap" aria-label="用户管理表格">
      <table>
        <thead><tr><th>UID / 用户</th><th>角色</th><th>等级</th><th>状态</th><th>作品</th><th>图片空间</th><th>注册时间</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="user in users" :key="user.uid" :class="{ suspended: user.status === 'SUSPENDED' }">
            <td><RouterLink :to="`/users/${user.uid}`" class="uid">{{ user.uid }}</RouterLink><strong>{{ user.name }}</strong><small>@{{ user.username }}</small></td>
            <td><select v-model="user.role" :disabled="user.uid === userStore.user?.uid"><option value="USER">普通用户</option><option value="COOPERATOR">合作社团</option><option value="ADMIN">平台推荐管理员</option></select></td>
            <td><strong>Lv.{{ user.level }}</strong><small>{{ user.experience || 0 }} EXP</small></td>
            <td><select v-model="user.status" :disabled="user.uid === userStore.user?.uid"><option value="ACTIVE">正常</option><option value="SUSPENDED">已停用</option></select></td>
            <td><span>{{ user.postCount }} 篇文章</span><small>{{ user.treeCount }} 棵树</small></td>
            <td class="media-quota"><small>已用 {{ formatBytes(user.mediaUsedBytes) }}</small><label><input v-model.number="user.mediaQuotaMb" type="number" min="1" max="8192" step="1" /> MB</label></td>
            <td><time :datetime="user.signupAt">{{ formatDateTime(user.signupAt) }}</time></td>
            <td><button type="button" :disabled="savingUid === user.uid" @click="saveUser(user)">{{ savingUid === user.uid ? "保存中" : "保存" }}</button><small class="row-message">{{ rowMessages[user.uid] }}</small></td>
          </tr>
          <tr v-if="!loading && !users.length"><td colspan="8" class="empty">没有匹配的用户。</td></tr>
        </tbody>
      </table>
    </section>
    <div class="pagination"><button :disabled="loading || page <= 1" @click="loadUsers(page - 1)">上一页</button><span>第 {{ page }} / {{ totalPages }} 页</span><button :disabled="loading || page >= totalPages" @click="loadUsers(page + 1)">下一页</button></div>
  </main>
</template>

<style scoped>
.admin-page{min-height:100vh;padding:84px 20px 60px;background:#f4f7fa;color:#243244}.admin-heading,.toolbar,.user-table-wrap,.pagination,.page-message{width:min(100%,1380px);margin-left:auto;margin-right:auto}.admin-heading{display:flex;justify-content:space-between;gap:24px;margin-bottom:22px}.admin-heading span{color:#0f75b5;font-size:.75rem;font-weight:800;letter-spacing:.14em}.admin-heading h1{margin:3px 0 5px;font-size:2rem}.admin-heading p{margin:0;color:#64748b}.admin-links{display:flex;align-items:flex-start;gap:8px}.admin-links a{padding:8px 12px;border:1px solid #bfd1de;border-radius:7px;background:#fff;color:#0f5f91;text-decoration:none;white-space:nowrap}.toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:14px}.toolbar form{display:flex;width:min(100%,580px)}.toolbar input{flex:1;min-width:0;padding:10px 13px;border:1px solid #cbd5e1;border-radius:7px 0 0 7px;font:inherit}.toolbar button,.pagination button,tbody button{padding:9px 14px;border:0;border-radius:0 7px 7px 0;background:#0f75b5;color:#fff;cursor:pointer}.toolbar>span{color:#64748b}.page-message{margin-bottom:12px;color:#b45309}.user-table-wrap{overflow:auto;border:1px solid #d8e1e8;border-radius:10px;background:#fff;box-shadow:0 5px 20px rgba(15,23,42,.05)}table{width:100%;border-collapse:collapse;min-width:1200px}th,td{padding:13px 12px;border-bottom:1px solid #e8edf1;text-align:left;vertical-align:middle}th{background:#edf4f8;color:#415466;font-size:.78rem;letter-spacing:.03em}td:first-child,td:nth-child(5),td:last-child{display:grid;gap:2px}td strong{color:#1e293b}td small,td span,time{color:#718096;font-size:.78rem}.uid{color:#0f75b5;font:700 .8rem ui-monospace,monospace;text-decoration:none}select,.level-input,.media-quota input{max-width:145px;padding:7px 8px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;font:inherit}.level-input{width:78px}.media-quota{min-width:145px}.media-quota label{display:flex;align-items:center;gap:5px;color:#718096;font-size:.78rem}.media-quota input{width:82px}tbody button{border-radius:6px}.suspended{background:#fff7f7}.row-message{min-height:1em;color:#0f5f91!important}.empty{display:table-cell!important;padding:35px;text-align:center;color:#64748b}.pagination{display:flex;justify-content:center;align-items:center;gap:14px;margin-top:18px}.pagination button{border-radius:6px}.pagination button:disabled,button:disabled{opacity:.5;cursor:not-allowed}@media(max-width:720px){.admin-page{padding:76px 10px 40px}.admin-heading,.toolbar{display:block}.admin-links{margin-top:14px}.toolbar form{margin-bottom:8px}}
</style>
