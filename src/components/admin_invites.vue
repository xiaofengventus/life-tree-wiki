<script setup>
import { onMounted, ref } from "vue";
import { apiRequest } from "@/services/api";

const count = ref(1);
const expiresInDays = ref(30);
const codes = ref([]);
const message = ref("");
const loading = ref(false);
const sharedLinks = ref([]);
const sharedLabel = ref("专业交流群");
const sharedMaxUses = ref(100);
const sharedExpiresInDays = ref(365);
const sharedInviteUrl = ref("");
const sharedMessage = ref("");
const sharedLoading = ref(false);
const revokingId = ref("");

async function createInvites() {
  loading.value = true;
  message.value = "";
  codes.value = [];
  try {
    const payload = await apiRequest("/api/admin/invites", {
      method: "POST",
      body: { count: Number(count.value), expiresInDays: Number(expiresInDays.value) },
    });
    codes.value = payload.codes;
    message.value = "邀请码只在本次响应中显示，请立即安全保存。";
  } catch (error) {
    message.value = error.message;
  } finally {
    loading.value = false;
  }
}

async function copyCodes() {
  await navigator.clipboard.writeText(codes.value.join("\n"));
  message.value = "已复制到剪贴板。";
}

async function loadSharedLinks() {
  try {
    const payload = await apiRequest("/api/admin/invite-links");
    sharedLinks.value = payload.links || [];
  } catch (error) {
    sharedMessage.value = error.message;
  }
}

async function createSharedLink() {
  sharedLoading.value = true;
  sharedMessage.value = "";
  sharedInviteUrl.value = "";
  try {
    const payload = await apiRequest("/api/admin/invite-links", {
      method: "POST",
      body: {
        label: sharedLabel.value,
        maxUses: Number(sharedMaxUses.value),
        expiresInDays: Number(sharedExpiresInDays.value),
      },
    });
    sharedInviteUrl.value = `${window.location.origin}/login#invite=${encodeURIComponent(payload.token)}`;
    sharedMessage.value = "完整注册链接只显示这一次，请立即复制并安全保存。";
    await loadSharedLinks();
  } catch (error) {
    sharedMessage.value = error.message;
  } finally {
    sharedLoading.value = false;
  }
}

async function copySharedLink() {
  await navigator.clipboard.writeText(sharedInviteUrl.value);
  sharedMessage.value = "注册链接已复制到剪贴板。";
}

async function revokeSharedLink(link) {
  if (link.status !== "ACTIVE" || !window.confirm(`确定停用“${link.label}”吗？现有链接会立即失效。`)) return;
  revokingId.value = link.id;
  sharedMessage.value = "";
  try {
    await apiRequest(`/api/admin/invite-links/${encodeURIComponent(link.id)}`, { method: "DELETE" });
    sharedMessage.value = "注册链接已停用。";
    await loadSharedLinks();
  } catch (error) {
    sharedMessage.value = error.message;
  } finally {
    revokingId.value = "";
  }
}

function statusLabel(status) {
  return { ACTIVE: "有效", REVOKED: "已停用", EXPIRED: "已过期", FULL: "名额已满" }[status] || status;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString("zh-CN") : "—";
}

onMounted(loadSharedLinks);
</script>

<template>
  <section class="invite-panel">
    <h2>注册邀请码</h2>
    <p>每个邀请码只能成功注册一个账户。MAC 地址无法从互联网获取，因此邀请码是注册总量的最终控制。</p>
    <form @submit.prevent="createInvites">
      <label>数量 <input v-model.number="count" type="number" min="1" max="50" /></label>
      <label>有效天数 <input v-model.number="expiresInDays" type="number" min="1" max="365" /></label>
      <button type="submit" :disabled="loading">{{ loading ? "生成中……" : "生成一次性邀请码" }}</button>
    </form>
    <p v-if="message" class="message">{{ message }}</p>
    <div v-if="codes.length" class="codes">
      <code v-for="code in codes" :key="code">{{ code }}</code>
      <button type="button" @click="copyCodes">复制全部</button>
    </div>

    <div class="shared-divider"></div>
    <h2>多人注册链接</h2>
    <p>适合专业社群长期使用。链接有人数与有效期上限，可随时停用；注册仍受 Turnstile、设备限制和全站用户上限保护。</p>
    <form @submit.prevent="createSharedLink">
      <label class="wide-label">名称 <input v-model.trim="sharedLabel" maxlength="80" required /></label>
      <label>人数上限 <input v-model.number="sharedMaxUses" type="number" min="2" max="5000" required /></label>
      <label>有效天数 <input v-model.number="sharedExpiresInDays" type="number" min="1" max="3650" required /></label>
      <button type="submit" :disabled="sharedLoading">{{ sharedLoading ? "生成中……" : "生成多人注册链接" }}</button>
    </form>
    <p v-if="sharedMessage" class="message">{{ sharedMessage }}</p>
    <div v-if="sharedInviteUrl" class="shared-result">
      <code>{{ sharedInviteUrl }}</code>
      <button type="button" @click="copySharedLink">复制完整链接</button>
    </div>

    <div v-if="sharedLinks.length" class="shared-list">
      <article v-for="link in sharedLinks" :key="link.id">
        <div><strong>{{ link.label }}</strong><span :class="`status-${link.status.toLowerCase()}`">{{ statusLabel(link.status) }}</span></div>
        <p>已注册 {{ link.useCount }} / {{ link.maxUses }} 人 · 到期 {{ formatDate(link.expiresAt) }}</p>
        <button v-if="link.status === 'ACTIVE'" type="button" class="danger" :disabled="revokingId === link.id" @click="revokeSharedLink(link)">
          {{ revokingId === link.id ? "停用中……" : "立即停用" }}
        </button>
      </article>
    </div>
  </section>
</template>

<style scoped>
.invite-panel { width: min(100% - 40px,1280px); margin: 24px auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 10px; background: #fff; }
.invite-panel h2 { margin-top: 0; }
.invite-panel form { display: flex; flex-wrap: wrap; align-items: end; gap: 12px; }
.invite-panel label { display: grid; gap: 4px; }
.invite-panel input { width: 110px; padding: 8px; }
.invite-panel button { padding: 9px 14px; border: 0; border-radius: 6px; background: #0f75b5; color: #fff; cursor: pointer; }
.codes { display: grid; gap: 8px; margin-top: 12px; }
.codes code { overflow-wrap: anywhere; padding: 8px; background: #f1f5f9; }
.message { color: #92400e; }
.shared-divider { height: 1px; margin: 28px 0 22px; background: #e2e8f0; }
.invite-panel .wide-label input { width: 180px; }
.shared-result { display: grid; grid-template-columns: 1fr auto; gap: 10px; margin-top: 12px; }
.shared-result code { overflow-wrap: anywhere; padding: 10px; border-radius: 6px; background: #ecfdf5; color: #166534; }
.shared-list { display: grid; gap: 9px; margin-top: 18px; }
.shared-list article { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 4px 14px; padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 8px; }
.shared-list article>div { display: flex; align-items: center; gap: 9px; }
.shared-list article p { grid-column: 1; margin: 0; color: #64748b; font-size: .85rem; }
.shared-list article span { padding: 2px 7px; border-radius: 99px; background: #e2e8f0; font-size: .75rem; }
.shared-list article .status-active { background: #dcfce7; color: #166534; }
.shared-list .danger { grid-column: 2; grid-row: 1 / 3; background: #b91c1c; }
button:disabled { opacity: .55; cursor: not-allowed; }
@media(max-width:680px){.shared-result,.shared-list article{grid-template-columns:1fr}.shared-list .danger{grid-column:1;grid-row:auto}.shared-list article p{grid-column:1}}
</style>
