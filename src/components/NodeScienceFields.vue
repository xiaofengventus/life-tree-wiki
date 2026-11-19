<script setup>
import { TAXONOMY_RANK_GROUPS } from "../../shared/taxonomyRanks.js";

const props = defineProps({
  modelValue: { type: Object, required: true },
  isRoot: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  citations: { type: Array, default: () => [] },
});
const emit = defineEmits(["update:modelValue"]);

function update(section, key, value) {
  emit("update:modelValue", {
    ...props.modelValue,
    [section]: { ...props.modelValue[section], [key]: value },
  });
}
function numberValue(event) {
  return event.target.value === "" ? null : Number(event.target.value);
}
function toggleCitation(number, checked) {
  const numbers = new Set(props.modelValue.branch.citationNumbers);
  if (checked) numbers.add(number);
  else numbers.delete(number);
  update("branch", "citationNumbers", [...numbers].sort((a, b) => a - b));
}
</script>

<template>
  <fieldset class="node-science" :disabled="disabled" @keydown.stop>
    <legend>分类群信息</legend>
    <label>学名
      <input :value="modelValue.taxon.scientificName" maxlength="240" placeholder="例如：Homo sapiens"
        @change="update('taxon', 'scientificName', $event.target.value)" />
    </label>
    <label>分类阶元
      <select :value="modelValue.taxon.rankKey" @change="update('taxon', 'rankKey', $event.target.value)">
        <option value="">未指定／不适用</option>
        <optgroup v-for="group in TAXONOMY_RANK_GROUPS" :key="group.label" :label="group.label">
          <option v-for="rank in group.ranks" :key="rank[0]" :value="rank[0]">{{ rank[1] }} · {{ rank[2] }}</option>
        </optgroup>
      </select>
    </label>
    <label>生存状态
      <select :value="modelValue.taxon.status" @change="update('taxon', 'status', $event.target.value)">
        <option value="unknown">未知／未填写</option>
        <option value="extant">现生</option>
        <option value="extinct">已灭绝 †</option>
      </select>
    </label>
    <label>节点年代（Ma，距今百万年）
      <input type="number" min="0" step="any" :value="modelValue.taxon.ageMa" placeholder="无依据时留空"
        @change="update('taxon', 'ageMa', numberValue($event))" />
    </label>
    <p>灭绝符号由生存状态自动生成；不确定的信息请留空。</p>
  </fieldset>
  <fieldset v-if="!isRoot" class="node-science" :disabled="disabled" @keydown.stop>
    <legend>入边／分支依据</legend>
    <label>枝长
      <input type="number" min="0" step="any" :value="modelValue.branch.length" placeholder="单位在全树科学信息中填写"
        @change="update('branch', 'length', numberValue($event))" />
    </label>
    <label>支持度类型
      <select :value="modelValue.branch.supportType" @change="update('branch', 'supportType', $event.target.value)">
        <option value="">未指定</option>
        <option value="bootstrap">Bootstrap（0–100%）</option>
        <option value="posterior">后验概率（0–1）</option>
      </select>
    </label>
    <label>支持度数值
      <input type="number" min="0" :max="modelValue.branch.supportType === 'posterior' ? 1 : 100" step="any"
        :value="modelValue.branch.support" placeholder="无依据时留空"
        @change="update('branch', 'support', numberValue($event))" />
    </label>
    <span>支持此分支的文献</span>
    <label v-for="citation in citations" :key="citation.number" class="citation-choice" :title="citation.text">
      <input type="checkbox" :checked="modelValue.branch.citationNumbers.includes(citation.number)"
        @change="toggleCitation(citation.number, $event.target.checked)" />
      <span>[{{ citation.number }}] {{ citation.text }}</span>
    </label>
    <p v-if="!citations.length">先在下方“引用”中新建参考文献，再绑定分支依据。</p>
    <p>此处描述父节点到当前节点的分支，不改变图上的显示距离。</p>
  </fieldset>
  <p v-else class="root-note">根节点没有入边；分支数据请在子节点上填写。</p>
</template>

<style scoped>
.node-science { display: grid; gap: 10px; min-width: 0; margin: 16px; padding: 12px; border: 1px solid #d5dfd8; border-radius: 8px; }
legend { padding: 0 5px; color: #244f38; font-size: 13px; font-weight: 700; }
label { display: grid; gap: 5px; min-width: 0; color: #52675e; font-size: 12px; }
input, select { box-sizing: border-box; min-width: 0; width: 100%; padding: 7px; border: 1px solid #cbd7cf; border-radius: 5px; background: #fff; color: #243b31; font: inherit; }
p, .root-note { margin: 0; color: #68786e; font-size: 11px; line-height: 1.6; }
.root-note { margin: 12px 16px; }
.citation-choice { display: flex; align-items: baseline; }
.citation-choice input { width: auto; }
.citation-choice span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
