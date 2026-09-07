<script setup>
import { ref } from "vue";

defineProps({
  modelValue: { type: String, default: "#000000" },
  label: { type: String, default: "颜色" },
});
const emit = defineEmits(["update:modelValue", "change"]);
const details = ref(null);

const colors = [
  "#000000", "#262626", "#595959", "#8c8c8c", "#bfbfbf", "#d9d9d9", "#e8e8e8", "#f5f5f5", "#fafafa", "#ffffff",
  "#f5222d", "#fa541c", "#fa8c16", "#fadb14", "#52c41a", "#13c2c2", "#1677ff", "#2f54eb", "#722ed1", "#eb2f96",
  "#fff1f0", "#fff2e8", "#fff7e6", "#feffe6", "#f6ffed", "#e6fffb", "#e6f4ff", "#f0f5ff", "#f9f0ff", "#fff0f6",
  "#ffccc7", "#ffd8bf", "#ffe7ba", "#ffffb8", "#d9f7be", "#b5f5ec", "#bae0ff", "#d6e4ff", "#efdbff", "#ffd6e7",
  "#ff4d4f", "#ff7a45", "#ffa940", "#ffec3d", "#73d13d", "#36cfc9", "#4096ff", "#597ef7", "#9254de", "#f759ab",
  "#cf1322", "#d4380d", "#d46b08", "#d4b106", "#389e0d", "#08979c", "#0958d9", "#1d39c4", "#531dab", "#c41d7f",
  "#820014", "#871400", "#873800", "#614700", "#135200", "#00474f", "#003eb3", "#061178", "#22075e", "#780650",
];

function choose(color, close = true) {
  emit("update:modelValue", color);
  emit("change", color);
  if (close && details.value) details.value.open = false;
}
</script>

<template>
  <details ref="details" class="palette-control">
    <summary :title="`选择${label}`">
      <i :style="{ backgroundColor: modelValue }"></i>
      <span>{{ label }}</span>
      <b>{{ modelValue.toUpperCase() }}</b>
    </summary>
    <div class="palette-popover">
      <div class="palette-title"><span>{{ label }}</span><small>预设色盘</small></div>
      <div class="swatch-grid">
        <button
          v-for="color in colors"
          :key="color"
          type="button"
          :class="{ selected: color.toLowerCase() === modelValue.toLowerCase() }"
          :style="{ backgroundColor: color }"
          :title="color"
          :aria-label="`${label} ${color}`"
          @click="choose(color)"
        ></button>
      </div>
      <label class="custom-color">
        <span>自定义颜色</span>
        <input :value="modelValue" type="color" @input="choose($event.target.value, false)" />
      </label>
    </div>
  </details>
</template>

<style scoped>
.palette-control {
  min-width: 0;
}

.palette-control summary {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 7px 9px;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  background: #fff;
  cursor: pointer;
  list-style: none;
}

.palette-control summary::-webkit-details-marker {
  display: none;
}

.palette-control summary i {
  width: 24px;
  height: 24px;
  border: 1px solid #94a3b8;
  border-radius: 5px;
}

.palette-control summary span {
  color: #334155;
  font-size: 0.8rem;
  white-space: nowrap;
}

.palette-control summary b {
  color: #64748b;
  font: 600 0.7rem ui-monospace, monospace;
  white-space: nowrap;
}

.palette-popover {
  box-sizing: border-box;
  width: 100%;
  margin-top: 6px;
  padding: 12px;
  border: 1px solid #d7dee7;
  border-radius: 8px;
  background: #fff;
}

.palette-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #334155;
}

.palette-title small {
  color: #94a3b8;
}

.swatch-grid {
  display: grid;
  grid-template-columns: repeat(8, 22px);
  justify-content: space-between;
  gap: 7px 0;
}

.swatch-grid button {
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 4px;
  cursor: pointer;
}

.swatch-grid button.selected {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.custom-color {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
  color: #475569;
  font-size: 0.8rem;
}

.custom-color input {
  width: 42px;
  height: 28px;
  padding: 1px;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  background: #fff;
  cursor: pointer;
}
</style>
