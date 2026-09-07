<script setup>
import { onMounted, ref } from "vue";
import navBar from "@/components/navBar.vue";
import {
  fetchAdminOfficialTrees,
  reviewOfficialTreeRequest,
  revokePlatformRecommendation,
} from "@/services/trees";
import { formatDateTime } from "@/utils/date";
import { platformTreeLabel } from "@/utils/treeLabels";

const recommendedTrees = ref([]);
const pendingRequests = ref([]);
const loading = ref(false);
const message = ref("");

async function loadRecommendationManagement() {
  const payload = await fetchAdminOfficialTrees();
  recommendedTrees.value = payload.trees;
  pendingRequests.value = payload.requests;
}

async function reviewRequest(item, action) {
  if (!item.canReview || loading.value) return;
  const rejected = action === "REJECT";
  const note = window.prompt(
    rejected ? "填写不通过原因（可留空）：" : "填写审核说明（可留空）：",
    "",
  );
  if (note === null) return;
  if (!rejected && !window.confirm(`通过“${item.treeTitle}”的平台推荐申请吗？\n\n审核通过后直接推荐原树，不会创建副本。`)) return;

  loading.value = true;
  message.value = "";
  try {
    await reviewOfficialTreeRequest(item.treeUid, item.id, action, note);
    await loadRecommendationManagement();
    message.value = rejected ? "申请已标记为未通过" : "原树已加入平台推荐";
  } catch (error) {
    message.value = error.message || "审核失败";
  } finally {
    loading.value = false;
  }
}

async function revokeRecommendation(tree) {
  if (!window.confirm(`确定取消“${tree.title}”的平台推荐吗？\n\n只会移除推荐标识，不会删除原树。`)) return;
  loading.value = true;
  message.value = "";
  try {
    await revokePlatformRecommendation(tree.uid || tree.id);
    await loadRecommendationManagement();
    message.value = "已取消平台推荐，原树和作者内容保持不变";
  } catch (error) {
    message.value = error.message || "取消推荐失败";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    await loadRecommendationManagement();
  } catch (error) {
    message.value = error.message || "平台推荐管理加载失败";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <navBar />
  <main class="official-manager-page">
    <header class="page-heading">
      <div>
        <span>PLATFORM RECOMMENDATIONS</span>
        <h1>平台推荐管理</h1>
        <p>平台推荐是原树上的审核标识，不复制内容，也不改变作者与维护权。</p>
      </div>
      <RouterLink :to="{ path: '/research', query: { type: 'tree' } }">
        浏览并提名
      </RouterLink>
    </header>

    <p v-if="message" class="page-message" aria-live="polite">{{ message }}</p>

    <section class="official-manager">
      <header>
        <div><span>REVIEW QUEUE</span><h2>待处理申请</h2></div>
        <small>作者自荐由管理员审核；管理员提名则等待原作者确认。</small>
      </header>
      <div class="request-list">
        <article v-for="item in pendingRequests" :key="item.id">
          <div>
            <strong>{{ item.treeTitle }}</strong>
            <span>{{ item.requestType === "SELF_RECOMMENDATION" ? "作者自荐" : "管理员提名" }}</span>
            <small>{{ item.treeUid }} · v{{ item.treeVersion }}</small>
          </div>
          <p v-if="item.message">{{ item.message }}</p>
          <p v-else class="muted">未填写申请说明</p>
          <small>作者：{{ item.author.name }} · 申请人：{{ item.applicant.name }}</small>
          <time :datetime="item.createdAt">{{ formatDateTime(item.createdAt) }}</time>
          <footer>
            <RouterLink :to="`/life-tree/${item.treeUid}`">查看原树</RouterLink>
            <template v-if="item.canReview">
              <button type="button" :disabled="loading" @click="reviewRequest(item, 'APPROVE')">
                通过
              </button>
              <button class="reject" type="button" :disabled="loading" @click="reviewRequest(item, 'REJECT')">
                不通过
              </button>
            </template>
            <span v-else>等待原作者确认</span>
          </footer>
        </article>
        <p v-if="!loading && !pendingRequests.length" class="empty">当前没有待处理申请。</p>
        <p v-if="loading && !pendingRequests.length" class="empty">正在加载……</p>
      </div>
    </section>

    <section class="official-manager">
      <header>
        <div><span>RECOMMENDED TREES</span><h2>已推荐原树</h2></div>
        <small>作者发布新版本后默认继续通过，不需要重新审核。</small>
      </header>
      <div class="tree-list">
        <article v-for="tree in recommendedTrees" :key="tree.id">
          <div>
            <strong>{{ tree.title }}</strong>
            <span>{{ platformTreeLabel(tree) }}</span>
            <small>{{ tree.uid }} · v{{ tree.version }} · 作者：{{ tree.creator }}</small>
          </div>
          <p>{{ tree.description || "暂无简介" }}</p>
          <time :datetime="tree.updatedAt">{{ formatDateTime(tree.updatedAt) }}</time>
          <footer>
            <RouterLink :to="`/life-tree/${tree.uid || tree.id}`">查看原树</RouterLink>
            <button
              class="danger"
              type="button"
              :disabled="loading"
              @click="revokeRecommendation(tree)"
            >
              取消推荐
            </button>
          </footer>
        </article>
        <p v-if="!loading && !recommendedTrees.length" class="empty">还没有通过审核的平台推荐树。</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.official-manager-page{min-height:100vh;padding:82px 18px 56px;background:#f5f7f5;color:#263d33}.page-heading,.official-manager,.page-message{width:min(100%,1180px);margin-right:auto;margin-left:auto}.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:18px}.page-heading span,.official-manager>header span{color:#2f806a;font-size:.7rem;font-weight:850;letter-spacing:.14em}.page-heading h1{margin:3px 0;font-size:1.7rem}.page-heading p{margin:0;color:#65756d}.page-heading>a{padding:10px 14px;border-radius:8px;background:#286b49;color:#fff;font-weight:750;text-decoration:none}.page-message{margin-top:-4px;margin-bottom:12px;color:#286b49;font-weight:650}.official-manager{box-sizing:border-box;margin-bottom:18px;padding:24px;border:1px solid #d6e0d9;border-radius:13px;background:#fff}.official-manager>header{display:flex;align-items:flex-end;justify-content:space-between;padding-bottom:15px;border-bottom:1px solid #e5ebe7}.official-manager h2{margin:2px 0 0}.official-manager small{color:#718078}.tree-list,.request-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:12px;margin-top:18px}.tree-list article,.request-list article{display:grid;gap:9px;padding:15px;border:1px solid #dce4df;border-radius:9px;background:#fafcfb}.tree-list article>div,.request-list article>div{display:grid;grid-template-columns:1fr auto;gap:4px}.tree-list article>div strong,.request-list article>div strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tree-list article>div span,.request-list article>div span{padding:2px 7px;border-radius:99px;background:#e5f0ff;color:#315f9c;font-size:.68rem;font-weight:800}.tree-list article>div small,.request-list article>div small{grid-column:1/-1}.tree-list article p,.request-list article p{margin:0;color:#617168;font-size:.84rem}.request-list article p.muted{color:#929c97}.tree-list article time,.request-list article time{color:#87928c;font-size:.74rem}.tree-list footer,.request-list footer{display:flex;align-items:center;gap:8px}.tree-list footer a,.tree-list footer button,.request-list footer a,.request-list footer button{padding:8px 11px;border:1px solid transparent;border-radius:7px;background:transparent;color:#0969da;font:inherit;font-size:.85rem;text-decoration:none;cursor:pointer}.request-list footer button{border-color:#286b49;background:#286b49;color:#fff}.request-list footer button.reject,.tree-list footer button.danger{margin-left:auto;border-color:#d5aaa6;background:#fff;color:#a43b35}.request-list footer>span{margin-left:auto;color:#8b6b34;font-size:.8rem}.tree-list footer button:disabled,.request-list footer button:disabled{opacity:.5;cursor:not-allowed}.empty{color:#718078}@media(max-width:720px){.official-manager-page{padding:74px 8px 30px}.page-heading{display:block;padding:0 6px}.page-heading>a{display:inline-block;margin-top:14px}.official-manager{padding:17px 13px}.official-manager>header{display:block}}
</style>
