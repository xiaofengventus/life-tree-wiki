<template>
  <div ref="picker" class="taxonomy-rank-picker">
    <button
      type="button"
      class="taxonomy-rank-trigger"
      :class="{ empty: !selectedRank }"
      :aria-label="ariaLabel"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="toggle"
    >
      <span v-if="selectedRank">
        <strong>{{ selectedRank.zh }}</strong>
        <small>{{ selectedRank.en }}</small>
      </span>
      <span v-else>选择分类阶元</span>
      <span class="taxonomy-rank-caret" aria-hidden="true">⌄</span>
    </button>

    <div v-if="open" class="taxonomy-rank-menu">
      <nav class="taxonomy-family-list" aria-label="分类阶元类别">
        <button
          v-for="family in rankFamilies"
          :key="family.key"
          type="button"
          :class="{ active: family.key === activeFamilyKey }"
          @click="activeFamilyKey = family.key"
        >
          <span>{{ family.label }}</span>
          <small>{{ family.ranks.length }}</small>
          <span aria-hidden="true">›</span>
        </button>
      </nav>

      <section class="taxonomy-rank-options">
        <header>
          <strong>{{ activeFamily?.label || "分类阶元" }}</strong>
          <small>选择具体阶元</small>
        </header>
        <div role="menu">
          <button
            v-for="rank in activeFamily?.ranks || []"
            :key="rank.key"
            type="button"
            role="menuitem"
            :class="{ selected: rank.key === modelValue }"
            @click="selectRank(rank.key)"
          >
            <span>
              <strong>{{ rank.zh }}</strong>
              <small>{{ rank.en }}</small>
            </span>
            <em v-if="rank.note">{{ rank.note }}</em>
            <span v-if="rank.key === modelValue" class="taxonomy-selected-mark" aria-label="已选择">✓</span>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  TAXONOMY_RANK_FAMILIES,
  TAXONOMY_RANK_FAMILY_MAP,
  TAXONOMY_RANK_MAP,
} from "../../shared/taxonomyRanks.js";

const props = defineProps({
  modelValue: { type: String, default: "" },
  ariaLabel: { type: String, default: "选择分类阶元" },
});
const emit = defineEmits(["update:modelValue"]);

const picker = ref(null);
const open = ref(false);
const rankFamilies = TAXONOMY_RANK_FAMILIES;
const selectedRank = computed(() => TAXONOMY_RANK_MAP.get(props.modelValue));
const activeFamilyKey = ref(
  TAXONOMY_RANK_FAMILY_MAP.get(props.modelValue)?.key || rankFamilies[0]?.key || "",
);
const activeFamily = computed(
  () =>
    rankFamilies.find((family) => family.key === activeFamilyKey.value) ||
    rankFamilies[0],
);

watch(
  () => props.modelValue,
  (rankKey) => {
    const family = TAXONOMY_RANK_FAMILY_MAP.get(rankKey);
    if (family) activeFamilyKey.value = family.key;
  },
);

function toggle() {
  if (!open.value) {
    const family = TAXONOMY_RANK_FAMILY_MAP.get(props.modelValue);
    if (family) activeFamilyKey.value = family.key;
  }
  open.value = !open.value;
}

function selectRank(rankKey) {
  emit("update:modelValue", rankKey);
  open.value = false;
}

function handlePointerDown(event) {
  if (open.value && picker.value && !picker.value.contains(event.target)) {
    open.value = false;
  }
}

function handleKeyDown(event) {
  if (event.key === "Escape") open.value = false;
}

onMounted(() => {
  document.addEventListener("pointerdown", handlePointerDown);
  document.addEventListener("keydown", handleKeyDown);
});
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handlePointerDown);
  document.removeEventListener("keydown", handleKeyDown);
});
</script>

<style scoped>
.taxonomy-rank-picker{position:relative;min-width:0}.taxonomy-rank-trigger{display:flex;width:100%;min-height:42px;align-items:center;justify-content:space-between;gap:10px;padding:7px 10px;border:1px solid #cfd3bd;border-radius:7px;background:#fff;color:#30372f;text-align:left;cursor:pointer}.taxonomy-rank-trigger>span:first-child{display:flex;min-width:0;align-items:baseline;gap:7px}.taxonomy-rank-trigger strong{font-size:.92rem}.taxonomy-rank-trigger small{overflow:hidden;color:#72786d;font-size:.76rem;font-weight:500;text-overflow:ellipsis;white-space:nowrap}.taxonomy-rank-trigger.empty{color:#777d72}.taxonomy-rank-caret{flex:none;color:#697064;font-size:1rem}.taxonomy-rank-menu{position:absolute;z-index:30;top:calc(100% + 6px);left:0;display:grid;width:min(650px,calc(100vw - 48px));height:min(390px,calc(100vh - 96px));min-height:240px;grid-template-columns:155px minmax(330px,1fr);overflow:hidden;overscroll-behavior:contain;border:1px solid #cbd2c4;border-radius:10px;background:#fff;box-shadow:0 14px 36px rgba(39,56,46,.18)}.taxonomy-family-list{min-height:0;padding:7px;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable;border-right:1px solid #e1e5dc;background:#f5f7f3}.taxonomy-family-list button{display:grid;width:100%;grid-template-columns:1fr auto auto;align-items:center;gap:8px;padding:8px 9px;border:0;border-radius:6px;background:transparent;color:#3c463d;text-align:left;cursor:pointer}.taxonomy-family-list button:hover,.taxonomy-family-list button.active{background:#e2eee8;color:#176c56}.taxonomy-family-list button small{font-size:.7rem;font-weight:600;opacity:.62}.taxonomy-rank-options{min-width:0;min-height:0;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable}.taxonomy-rank-options>header{position:sticky;z-index:1;top:0;display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:12px 14px 9px;border-bottom:1px solid #ecefe9;background:#fff}.taxonomy-rank-options>header small{color:#888e86;font-size:.72rem}.taxonomy-rank-options>div{display:grid;padding:6px}.taxonomy-rank-options button{position:relative;display:grid;width:100%;grid-template-columns:minmax(150px,.75fr) minmax(120px,1fr) 22px;align-items:center;gap:10px;padding:9px;border:0;border-radius:6px;background:#fff;color:#30372f;text-align:left;cursor:pointer}.taxonomy-rank-options button:hover{background:#f3f8f5}.taxonomy-rank-options button.selected{background:#e7f3ed;color:#176c56}.taxonomy-rank-options button>span:first-child{display:grid;gap:2px}.taxonomy-rank-options button strong{font-size:.88rem}.taxonomy-rank-options button small{color:#687269;font-size:.73rem;font-weight:500}.taxonomy-rank-options button em{color:#7f857d;font-size:.72rem;font-style:normal;line-height:1.4}.taxonomy-selected-mark{color:#16825f;font-weight:800;text-align:center}
@media (max-width:720px){.taxonomy-rank-menu{right:0;left:auto;width:min(430px,calc(100vw - 32px));height:min(470px,calc(100vh - 64px));min-height:220px;grid-template-columns:112px minmax(0,1fr)}.taxonomy-family-list button{padding:8px 6px}.taxonomy-rank-options button{grid-template-columns:1fr 22px}.taxonomy-rank-options button em{display:none}}
</style>
