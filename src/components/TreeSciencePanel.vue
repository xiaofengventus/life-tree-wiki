<script setup>
import { computed, ref, watch } from "vue";
import { TREE_KINDS, normalizeTreeScience, normalizeNodeScience, validateScientificTree } from "../../shared/treeScience.js";
import { TAXONOMY_RANK_MAP } from "../../shared/taxonomyRanks.js";

const props = defineProps({
  modelValue: { type: Object, required: true },
  readOnly: { type: Boolean, default: false },
});
const emit = defineEmits(["update:scientific"]);
const science = computed(() => normalizeTreeScience(props.modelValue.scientific));
const kindLabel = computed(() => TREE_KINDS.find((kind) => kind.value === science.value.kind)?.label || "未指定");
const validation = computed(() => validateScientificTree(props.modelValue));
const search = ref("");
const page = ref(0);
const showRecords = ref(false);
const PAGE_SIZE = 50;
const records = computed(() => {
  if (!showRecords.value) return [];
  const rows = [];
  const pending = props.modelValue.root ? [props.modelValue.root] : [];
  while (pending.length) {
    const node = pending.pop();
    const data = normalizeNodeScience(node.data || {});
    rows.push({ ...data, uid: node.data?.uid || "", isRoot: node === props.modelValue.root });
    for (let index = (node.children?.length || 0) - 1; index >= 0; index--) pending.push(node.children[index]);
  }
  const query = search.value.trim().toLowerCase();
  return query ? rows.filter((row) => `${row.text} ${row.taxon.scientificName} ${row.uid}`.toLowerCase().includes(query)) : rows;
});
const pageCount = computed(() => Math.max(1, Math.ceil(records.value.length / PAGE_SIZE)));
const visibleRecords = computed(() => records.value.slice(page.value * PAGE_SIZE, (page.value + 1) * PAGE_SIZE));
watch(search, () => { page.value = 0; });
watch(pageCount, (count) => { page.value = Math.min(page.value, count - 1); });
function update(key, value) {
  emit("update:scientific", normalizeTreeScience({ ...science.value, [key]: value }));
}
function statusLabel(status) {
  return { unknown: "未知", extant: "现生", extinct: "已灭绝 †" }[status];
}
function citationText(numbers) {
  return numbers.map((number) => `[${number}] ${props.modelValue.citations?.find((item) => item.number === number)?.text || "缺失文献"}`).join("\n");
}
</script>

<template>
  <section class="tree-science-panel" aria-label="树的科学信息" @keydown.stop @mousedown.stop @click.stop>
    <h3>树的科学信息</h3>
    <p class="scale-note">当前画布仅展示拓扑与排版，横向距离不代表枝长或年代；叶端对齐也不表示同时存活。</p>
    <template v-if="readOnly">
      <p><strong>{{ kindLabel }}</strong><span v-if="science.branchLengthUnit"> · 枝长单位：{{ science.branchLengthUnit }}</span></p>
      <p v-if="science.description">{{ science.description }}</p>
    </template>
    <div v-else class="science-form">
      <label>树类型
        <select :value="science.kind" @change="update('kind', $event.target.value)">
          <option v-for="kind in TREE_KINDS" :key="kind.value" :value="kind.value">{{ kind.label }}</option>
        </select>
      </label>
      <label>枝长单位／含义
        <input :value="science.branchLengthUnit" maxlength="120" placeholder="例如：每位点替换数；无枝长时留空"
          @change="update('branchLengthUnit', $event.target.value)" />
      </label>
      <label class="wide">范围与依据说明
        <textarea :value="science.description" maxlength="2000" rows="3" placeholder="说明采用的分类体系、研究依据或尚未解析的关系"
          @change="update('description', $event.target.value)"></textarea>
      </label>
      <p class="wide">分类层级不等于系统发育关系。多分叉可以表示未解析关系，不必强制二叉化。</p>
    </div>
    <div v-if="validation.errors.length" class="validation-errors" role="alert">
      <strong>需要修正（{{ validation.errors.length }}）</strong>
      <ul><li v-for="(message, index) in validation.errors.slice(0, 20)" :key="index">{{ message }}</li></ul>
      <small v-if="validation.errors.length > 20">仅显示前 20 项。</small>
    </div>
    <details v-if="validation.warnings.length" class="science-warnings">
      <summary>资料完整性提示（{{ validation.warnings.length }}，不阻止发布）</summary>
      <ul><li v-for="(message, index) in validation.warnings.slice(0, 20)" :key="index">{{ message }}</li></ul>
      <small v-if="validation.warnings.length > 20">仅显示前 20 项。</small>
    </details>
    <details @toggle="showRecords = $event.target.open">
      <summary>查看分类群与分支数据</summary>
      <template v-if="showRecords">
        <label class="record-search">查找名称、学名或 UID<input v-model="search" type="search" placeholder="搜索分类群" /></label>
        <div class="records-scroll">
          <table>
            <thead><tr><th>分类群</th><th>节点信息</th><th>入边／分支依据</th></tr></thead>
            <tbody>
              <tr v-for="(row, index) in visibleRecords" :key="`${row.uid}-${index}`">
                <td><strong>{{ row.text || '未命名' }}</strong><small>{{ row.uid }}</small></td>
                <td>
                  <span v-if="row.taxon.scientificName" class="scientific-name">{{ row.taxon.scientificName }}</span>
                  <span>{{ TAXONOMY_RANK_MAP.get(row.taxon.rankKey)?.zh || '阶元未指定' }} · {{ statusLabel(row.taxon.status) }}</span>
                  <span v-if="row.taxon.ageMa !== null">距今 {{ row.taxon.ageMa }} Ma</span>
                </td>
                <td v-if="row.isRoot">根节点，无入边</td>
                <td v-else>
                  <span v-if="row.branch.length !== null">枝长 {{ row.branch.length }} {{ science.branchLengthUnit }}</span>
                  <span v-if="row.branch.support !== null">{{ row.branch.supportType === 'posterior' ? '后验概率' : 'Bootstrap' }} {{ row.branch.support }}{{ row.branch.supportType === 'bootstrap' ? '%' : '' }}</span>
                  <span v-if="row.branch.citationNumbers.length" :title="citationText(row.branch.citationNumbers)">文献 {{ row.branch.citationNumbers.map((number) => `[${number}]`).join(' ') }}</span>
                  <span v-if="row.branch.length === null && row.branch.support === null && !row.branch.citationNumbers.length">未填写</span>
                </td>
              </tr>
              <tr v-if="!visibleRecords.length"><td colspan="3">没有匹配的分类群。</td></tr>
            </tbody>
          </table>
        </div>
        <nav class="record-pagination" aria-label="科学数据分页">
          <button type="button" :disabled="page === 0" @click="page--">上一页</button>
          <span>{{ page + 1 }} / {{ pageCount }} · {{ records.length }} 个分类群</span>
          <button type="button" :disabled="page + 1 >= pageCount" @click="page++">下一页</button>
        </nav>
      </template>
    </details>
  </section>
</template>

<style scoped>
.tree-science-panel { padding: 18px; color: #243b31; font-size: 13px; line-height: 1.6; background: #fff; }
h3 { margin: 0 0 10px; font-size: 16px; }
p { margin: 8px 0; white-space: pre-wrap; }
.scale-note { padding: 10px 12px; border-left: 3px solid #9e7f31; background: #faf7ee; color: #66531e; }
.science-form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
label { display: grid; gap: 5px; min-width: 0; }
.wide { grid-column: 1 / -1; }
input, select, textarea { box-sizing: border-box; width: 100%; min-width: 0; padding: 8px; border: 1px solid #cbd7cf; border-radius: 5px; background: #fff; color: inherit; font: inherit; }
summary { cursor: pointer; font-weight: 600; }
details { margin-top: 12px; }
.validation-errors { margin-top: 12px; padding: 10px; color: #9b3028; background: #fff1ee; border-radius: 6px; }
.science-warnings { color: #745b20; }
ul { margin: 6px 0; padding-left: 20px; }
.record-search { margin: 12px 0; }
.records-scroll { overflow: auto; }
table { width: 100%; border-collapse: collapse; text-align: left; }
th, td { min-width: 120px; padding: 8px; border-bottom: 1px solid #e4ebe6; vertical-align: top; }
td span, td small { display: block; }
td small { color: #738176; overflow-wrap: anywhere; }
.record-pagination { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 12px; }
button { padding: 6px 10px; border: 1px solid #cbd7cf; border-radius: 5px; background: #fff; color: inherit; cursor: pointer; }
button:disabled { opacity: .5; cursor: default; }
@media (max-width: 600px) { .science-form { grid-template-columns: 1fr; } }
</style>
