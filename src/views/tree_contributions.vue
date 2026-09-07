<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import navBar from "@/components/navBar.vue";
import EvolutionTreeViewer from "@/components/EvolutionTreeViewer.vue";
import ContentSourcesDisplay from "@/components/ContentSourcesDisplay.vue";
import { normalizeMindMapDocument } from "@/utils/evolutionMindMapModel";
import {
  fetchTreeContribution,
  fetchTreeContributions,
  reviewTreeContribution,
  withdrawTreeContribution,
} from "@/services/trees";
import { formatDateTime } from "@/utils/date";

const route = useRoute();
const router = useRouter();
const contributions = ref([]);
const selected = ref(null);
const loading = ref(false);
const message = ref("");
const reviewNote = ref("");
const statusFilter = ref("ALL");
const document = computed(() => selected.value?.document
  ? normalizeMindMapDocument(selected.value.document)
  : null);
const filteredContributions = computed(() =>
  statusFilter.value === "ALL"
    ? contributions.value
    : contributions.value.filter((item) => item.status === statusFilter.value),
);
const statusCounts = computed(() => ({
  ALL: contributions.value.length,
  PENDING: contributions.value.filter((item) => item.status === "PENDING").length,
  APPROVED: contributions.value.filter((item) => item.status === "APPROVED").length,
  REJECTED: contributions.value.filter((item) => item.status === "REJECTED").length,
}));
const changeGroups = computed(() => {
  const changes = selected.value?.changes;
  if (!changes) return [];
  return [
    { key: "added", label: "新增节点", tone: "added", items: changes.added || [] },
    { key: "removed", label: "删除节点", tone: "removed", items: changes.removed || [] },
    { key: "renamed", label: "节点改名", tone: "renamed", items: changes.renamed || [] },
    { key: "moved", label: "移动节点", tone: "moved", items: changes.moved || [] },
    { key: "updated", label: "资料变化", tone: "updated", items: changes.updated || [] },
  ].filter((group) => group.items.length);
});
const metadataChanges = computed(() => {
  const changes = selected.value?.metadataChanges;
  if (!changes) return [];
  const labels = {
    title: "树名称",
    description: "简介",
    license: "发布协议",
    tags: "关键词 / 标签",
    references: "参考文献",
    imageCredits: "图片来源与授权",
    collaboration: "Fork / Contribution 设置",
  };
  return Object.entries(changes)
    .filter(([, changed]) => changed)
    .map(([key]) => labels[key]);
});

function changeText(group, item) {
  if (group.key === "moved") return `${item.text}：${item.fromParent} → ${item.toParent}`;
  if (group.key === "updated") return `${item.text}：${item.fields.join("、")}`;
  return item.parentText ? `${item.text}（位于 ${item.parentText}）` : item.text;
}

function diffLines(group) {
  if (group.key === "renamed") {
    return group.items.flatMap((item) => [
      { uid: `${item.uid}-before`, tone: "removed", sign: "-", text: item.before },
      { uid: `${item.uid}-after`, tone: "added", sign: "+", text: item.after },
    ]);
  }
  const sign = group.key === "added" ? "+" : group.key === "removed" ? "-" : "~";
  return group.items.map((item) => ({ uid: item.uid, tone: group.tone, sign, text: changeText(group, item) }));
}

const statusLabels = {
  PENDING: "待审查",
  APPROVED: "已合并",
  REJECTED: "未采用",
};

async function loadList() {
  contributions.value = await fetchTreeContributions({
    tree: String(route.query.tree || ""),
  });
}

async function selectContribution(id, { navigate = true } = {}) {
  loading.value = true;
  message.value = "";
  try {
    selected.value = await fetchTreeContribution(id);
    reviewNote.value = selected.value.reviewNote || "";
    if (navigate) {
      await router.replace({
        path: `/tree-contributions/${id}`,
        query: route.query.tree ? { tree: route.query.tree } : {},
      });
    }
  } catch (error) {
    message.value = error.message || "贡献详情加载失败";
  } finally {
    loading.value = false;
  }
}

async function review(action) {
  if (!selected.value?.canReview || selected.value.status !== "PENDING") return;
  if (action === "APPROVE" && selected.value.hasVersionConflict) {
    message.value = "原树已有新版本，不能直接合并；请让贡献者基于最新版重新提交";
    return;
  }
  if (action === "REJECT" && reviewNote.value.trim().length < 3) {
    message.value = "退回贡献时请填写至少 3 个字的原因";
    return;
  }
  const label = action === "APPROVE" ? "合并" : "拒绝";
  if (!window.confirm(`确定${label}这项 Contribution 吗？`)) return;
  loading.value = true;
  message.value = "";
  try {
    const payload = await reviewTreeContribution(selected.value.id, action, reviewNote.value);
    selected.value = payload.contribution;
    await loadList();
    message.value = action === "APPROVE"
      ? "贡献已合并，原树已生成新版本"
      : "贡献已标记为未采用";
  } catch (error) {
    message.value = error.message || "审查失败";
  } finally {
    loading.value = false;
  }
}

async function withdrawContribution() {
  if (!selected.value?.canWithdraw || loading.value) return;
  if (!window.confirm("确定撤回这项 Contribution 吗？撤回后原作者将不能再审查它。")) return;
  loading.value = true;
  message.value = "";
  try {
    await withdrawTreeContribution(selected.value.id);
    selected.value = null;
    await loadList();
    if (contributions.value[0]) {
      await selectContribution(contributions.value[0].id);
    } else {
      await router.replace("/tree-contributions");
    }
    message.value = "Contribution 已撤回";
  } catch (error) {
    message.value = error.message || "撤回失败";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    await loadList();
    const id = String(route.params.id || "");
    if (id) await selectContribution(id, { navigate: false });
    else if (contributions.value[0]) await selectContribution(contributions.value[0].id);
  } catch (error) {
    message.value = error.message || "贡献列表加载失败";
  } finally {
    loading.value = false;
  }
});

watch(() => route.params.id, (id) => {
  if (id && id !== selected.value?.id) selectContribution(String(id), { navigate: false });
});
</script>

<template>
  <navBar />
  <main class="contribution-page">
    <header>
      <div><span>TREE COLLABORATION</span><h1>Contribution 审查</h1><p>Creator 审查 Contributor 提交的树相修改，合并后形成原树的新版本。</p></div>
      <RouterLink to="/user-space">返回个人空间</RouterLink>
    </header>
    <p v-if="message" class="page-message">{{ message }}</p>

    <div class="contribution-layout">
      <aside>
        <div class="status-filters" aria-label="筛选贡献">
          <button
            v-for="filter in ['ALL', 'PENDING', 'APPROVED', 'REJECTED']"
            :key="filter"
            type="button"
            :class="{ active: statusFilter === filter }"
            @click="statusFilter = filter"
          >
            {{ filter === "ALL" ? "全部" : statusLabels[filter] }}
            <span>{{ statusCounts[filter] }}</span>
          </button>
        </div>
        <RouterLink
          v-for="item in filteredContributions"
          :key="item.id"
          :to="{ path: `/tree-contributions/${item.id}`, query: route.query.tree ? { tree: route.query.tree } : {} }"
          :class="{ active: selected?.id === item.id }"
        >
          <div><strong>{{ item.targetTitle }}</strong><span :class="item.status.toLowerCase()">{{ statusLabels[item.status] }}</span></div>
          <p>{{ item.changeNote }}</p>
          <small>{{ item.canReview ? "待我审核" : "我的提交" }} · {{ item.contributor.name }} · 基于 v{{ item.baseVersion }}</small>
          <time :datetime="item.updatedAt">{{ formatDateTime(item.updatedAt) }}</time>
        </RouterLink>
        <p v-if="!filteredContributions.length">当前筛选下暂无 Contribution。</p>
      </aside>

      <section v-if="selected" class="detail">
        <header>
          <div>
            <span :class="['status', selected.status.toLowerCase()]">{{ statusLabels[selected.status] }}</span>
            <h2>{{ selected.title }}</h2>
            <p>
              <RouterLink :to="`/users/${selected.contributor.uid}`">{{ selected.contributor.name }}</RouterLink>
              提交给
              <RouterLink :to="`/life-tree/${selected.targetTreeUid || selected.targetTreeId}`">{{ selected.targetTitle }}</RouterLink>
              · 基于 v{{ selected.baseVersion }}
            </p>
          </div>
          <dl>
            <div><dt>节点</dt><dd>{{ selected.nodeCount }}</dd></div>
            <div><dt>协议</dt><dd>{{ selected.license }}</dd></div>
            <div><dt>提交时间</dt><dd>{{ formatDateTime(selected.createdAt) }}</dd></div>
          </dl>
        </header>
        <div v-if="selected.hasVersionConflict" class="conflict-warning" role="alert">
          <strong>基准版本已过期</strong>
          <p>
            这项贡献基于 v{{ selected.baseVersion }}，原树当前已是
            v{{ selected.currentTargetVersion }}。为防止覆盖他人的新修改，不能直接合并。
          </p>
        </div>
        <div class="change-note"><strong>贡献说明</strong><p>{{ selected.changeNote }}</p></div>
        <div v-if="selected.tags?.length" class="tags"><span v-for="tag in selected.tags" :key="tag">#{{ tag }}</span></div>
        <section v-if="selected.changes" class="diff-summary">
          <header>
            <div><span>CHANGE SUMMARY</span><h3>相对 v{{ selected.baseVersion }} 的变更</h3></div>
            <small v-if="!changeGroups.length && !metadataChanges.length">没有检测到内容变化</small>
          </header>
          <div class="diff-counts">
            <div class="added"><strong>{{ selected.changes.counts.added }}</strong><span>新增</span></div>
            <div class="removed"><strong>{{ selected.changes.counts.removed }}</strong><span>删除</span></div>
            <div class="renamed"><strong>{{ selected.changes.counts.renamed }}</strong><span>改名</span></div>
            <div class="moved"><strong>{{ selected.changes.counts.moved }}</strong><span>移动</span></div>
            <div class="updated"><strong>{{ selected.changes.counts.updated }}</strong><span>资料</span></div>
          </div>
          <div v-if="metadataChanges.length" class="metadata-changes">
            <strong>发布信息变化</strong>
            <span v-for="item in metadataChanges" :key="item">{{ item }}</span>
          </div>
          <details v-for="group in changeGroups" :key="group.key" class="diff-group">
            <summary><span :class="group.tone">{{ group.label }}</span><strong>{{ group.items.length }}</strong></summary>
            <div class="diff-lines">
              <p v-for="line in diffLines(group)" :key="`${group.key}-${line.uid}`" :class="['line', line.tone]">
                <span class="sign">{{ line.sign }}</span><span>{{ line.text }}</span>
              </p>
            </div>
          </details>
          <p v-if="selected.changes.truncated" class="diff-truncated">变更数量较多，此处每类最多显示 200 项。</p>
        </section>
        <div v-if="document" class="preview">
          <EvolutionTreeViewer
            :model-value="document"
            :file-owner="selected.title"
            :current-tree-id="selected.targetTreeUid || selected.targetTreeId"
          />
        </div>
        <ContentSourcesDisplay
          :citations="document?.citations || []"
          :references-text="selected.referencesText"
          :image-credits-text="selected.imageCreditsText"
          anchor-prefix="tree-citation"
        />
        <div v-if="selected.status !== 'PENDING' && selected.reviewNote" class="review-result">
          <strong>审查说明</strong><p>{{ selected.reviewNote }}</p>
        </div>
        <div v-if="selected.canReview && selected.status === 'PENDING'" class="review-box">
          <label>审查说明 <textarea v-model.trim="reviewNote" maxlength="300" rows="3" placeholder="合并时可选；退回时必须说明原因"></textarea></label>
          <div>
            <button type="button" class="reject" :disabled="loading" @click="review('REJECT')">退回并说明原因</button>
            <button
              type="button"
              :disabled="loading || selected.hasVersionConflict"
              :title="selected.hasVersionConflict ? '原树已有新版本，不能直接合并' : ''"
              @click="review('APPROVE')"
            >
              审查通过并合并
            </button>
          </div>
        </div>
        <div v-else-if="selected.canWithdraw" class="contributor-actions">
          <p>原作者审查前，你可以撤回这项贡献。</p>
          <button type="button" :disabled="loading" @click="withdrawContribution">撤回 Contribution</button>
        </div>
        <div v-else-if="selected.status === 'REJECTED' && !selected.canReview" class="contributor-actions rejected">
          <p>你可以根据审查说明，基于原树的最新版本重新完善。</p>
          <RouterLink :to="{ path: '/evolution-tree', query: { contribute: selected.targetTreeUid || selected.targetTreeId } }">
            基于最新版重新完善
          </RouterLink>
        </div>
      </section>
      <section v-else class="empty-detail">选择一项 Contribution 查看。</section>
    </div>
  </main>
</template>

<style scoped>
.contribution-page{min-height:100vh;padding:84px 18px 52px;background:#f4f7f5;color:#293c34}.contribution-page>header,.page-message,.contribution-layout{width:min(100%,1480px);margin-right:auto;margin-left:auto}.contribution-page>header{display:flex;justify-content:space-between;gap:20px;margin-bottom:18px}.contribution-page>header span{color:#6e5aa5;font-size:.72rem;font-weight:850;letter-spacing:.14em}.contribution-page h1{margin:4px 0}.contribution-page>header p{margin:0;color:#68786f}.contribution-page>header>a{height:max-content;padding:8px 12px;border:1px solid #cbd7cf;border-radius:7px;background:#fff;color:#315d4e;text-decoration:none}.page-message{margin-bottom:12px;color:#825c19}.contribution-layout{display:grid;grid-template-columns:350px minmax(0,1fr);min-height:720px;overflow:hidden;border:1px solid #d5dfd8;border-radius:13px;background:#fff}.contribution-layout>aside{overflow-y:auto;border-right:1px solid #dde5df;background:#f8faf9}.contribution-layout>aside>a{display:grid;gap:5px;padding:15px;border-bottom:1px solid #e5ebe7;color:#33473e;text-decoration:none}.contribution-layout>aside>a:hover,.contribution-layout>aside>a.active{background:#eef6f2}.contribution-layout>aside>a>div{display:flex;justify-content:space-between;gap:8px}.contribution-layout>aside span,.status{padding:3px 7px;border-radius:99px;background:#fef3c7;color:#8a5a13;font-size:.68rem;font-weight:800}.contribution-layout>aside span.approved,.status.approved{background:#dcfce7;color:#17643b}.contribution-layout>aside span.rejected,.status.rejected{background:#fee2e2;color:#9f2f2f}.contribution-layout>aside p{margin:0;color:#596b62;font-size:.83rem}.contribution-layout>aside small,.contribution-layout>aside time{color:#819088;font-size:.74rem}.detail{min-width:0;padding:28px}.detail>header{display:flex;justify-content:space-between;gap:24px}.detail h2{margin:7px 0}.detail header p{margin:0;color:#6c7a73}.detail header a{color:#2f6f5d}.detail dl{display:flex;gap:18px;margin:0}.detail dt{color:#829087;font-size:.7rem}.detail dd{margin:3px 0 0;font-size:.82rem}.change-note,.review-result{margin-top:18px;padding:14px;border-left:4px solid #806bb3;background:#f8f6fc}.change-note p,.review-result p{margin:5px 0 0;white-space:pre-wrap}.tags{display:flex;gap:7px;margin:12px 0}.tags span{padding:4px 8px;border-radius:99px;background:#e8f3ee;color:#2b6b57;font-size:.76rem}.preview{height:620px;margin-top:18px;overflow:hidden;border:1px solid #d6e0da;border-radius:10px}.review-box{display:grid;gap:12px;margin-top:18px;padding:16px;border:1px solid #d9d1e9;border-radius:9px;background:#fbfaff}.review-box label{display:grid;gap:7px;font-weight:700}.review-box textarea{padding:10px;border:1px solid #cfc5df;border-radius:7px;font:inherit;resize:vertical}.review-box>div{display:flex;justify-content:flex-end;gap:9px}.review-box button{padding:9px 14px;border:1px solid #286b49;border-radius:7px;background:#286b49;color:#fff;cursor:pointer}.review-box button:disabled{opacity:.5;cursor:not-allowed}.review-box button.reject{border-color:#d4aaa7;background:#fff;color:#a13f39}.empty-detail{display:grid;place-items:center;color:#839189}
.status-filters{position:sticky;top:0;z-index:2;display:grid;grid-template-columns:repeat(2,1fr);gap:6px;padding:10px;border-bottom:1px solid #dce5df;background:rgba(248,250,249,.96);backdrop-filter:blur(8px)}.status-filters button{display:flex;align-items:center;justify-content:space-between;padding:7px 9px;border:1px solid #d5dfd9;border-radius:7px;background:#fff;color:#53665d;font:inherit;font-size:.74rem;cursor:pointer}.status-filters button.active{border-color:#6e5aa5;background:#f3effb;color:#59438d;font-weight:750}.status-filters button span{padding:0;border-radius:0;background:none;color:inherit;font-size:inherit}
.conflict-warning{margin-top:18px;padding:14px 16px;border:1px solid #e5b7a2;border-left:4px solid #c75b32;border-radius:8px;background:#fff7f2;color:#813b25}.conflict-warning p{margin:5px 0 0;line-height:1.6}
.diff-summary{display:grid;gap:12px;margin-top:18px;padding:16px;border:1px solid #d8e1dc;border-radius:10px;background:#fafcfb}.diff-summary>header{display:flex;align-items:flex-end;justify-content:space-between;gap:16px}.diff-summary>header span{color:#6e5aa5;font-size:.65rem;font-weight:850;letter-spacing:.13em}.diff-summary h3{margin:3px 0 0}.diff-summary>header small{color:#718078}.diff-counts{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.diff-counts div{display:grid;place-items:center;padding:10px;border-radius:8px;background:#fff;border:1px solid #dfe6e2}.diff-counts strong{font-size:1.25rem}.diff-counts span{font-size:.72rem;color:#6c7b73}.diff-counts .added strong{color:#197044}.diff-counts .removed strong{color:#ad3f39}.diff-counts .renamed strong{color:#74579e}.diff-counts .moved strong{color:#9a681d}.diff-counts .updated strong{color:#276e83}.metadata-changes{display:flex;flex-wrap:wrap;align-items:center;gap:7px}.metadata-changes strong{margin-right:4px;font-size:.8rem}.metadata-changes span{padding:4px 8px;border-radius:99px;background:#ebe6f5;color:#5e498b;font-size:.72rem}.diff-group{border:1px solid #e0e6e2;border-radius:8px;background:#fff}.diff-group summary{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;cursor:pointer}.diff-group summary span{font-weight:750}.diff-group summary span.added{color:#197044}.diff-group summary span.removed{color:#ad3f39}.diff-group summary span.renamed{color:#74579e}.diff-group summary span.moved{color:#9a681d}.diff-group summary span.updated{color:#276e83}.diff-group summary strong{min-width:24px;padding:2px 7px;border-radius:99px;background:#eef2ef;text-align:center;font-size:.72rem}.diff-lines{display:grid;gap:3px;padding:2px 12px 12px}.diff-lines .line{display:flex;gap:9px;align-items:baseline;margin:0;padding:5px 10px;border-radius:6px;font-size:.8rem;line-height:1.55;word-break:break-word}.diff-lines .sign{flex:none;min-width:12px;font-family:ui-monospace,Consolas,monospace;font-weight:850}.diff-lines .line.added{background:#e6f5ec;color:#197044}.diff-lines .line.removed{background:#fdecea;color:#ad3f39}.diff-lines .line.moved{background:#fdf3e3;color:#9a681d}.diff-lines .line.updated{background:#e8f4f6;color:#276e83}.diff-truncated{margin:0;color:#8a651e;font-size:.78rem}
.contributor-actions{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:18px;padding:14px 16px;border:1px solid #d9e1dc;border-radius:9px;background:#f8faf9}.contributor-actions p{margin:0;color:#617168;font-size:.84rem}.contributor-actions button,.contributor-actions a{padding:8px 12px;border:1px solid #c7924c;border-radius:7px;background:#fff;color:#875b20;font:inherit;font-size:.8rem;font-weight:750;text-decoration:none;cursor:pointer}.contributor-actions.rejected{border-color:#e2cecc;background:#fff9f8}.contributor-actions.rejected a{border-color:#6e5aa5;color:#604b98}
@media(max-width:780px){.contribution-page{padding:76px 7px 28px}.contribution-page>header{display:block;padding:0 8px}.contribution-page>header>a{display:inline-block;margin-top:12px}.contribution-layout{display:block}.contribution-layout>aside{max-height:340px;border-right:0;border-bottom:1px solid #dde5df}.detail{padding:20px 12px}.detail>header{display:block}.detail dl{margin-top:12px}.preview{height:520px}.diff-counts{grid-template-columns:repeat(5,1fr);gap:4px}.diff-counts div{padding:8px 2px}.diff-counts strong{font-size:1rem}.diff-summary{padding:12px}.diff-summary>header{display:block}.review-box>div{display:grid;grid-template-columns:1fr 1fr}.review-box button{width:100%}}
</style>
