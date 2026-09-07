<script setup>
import { computed } from "vue";
import { TAXONOMY_RANK_MAP } from "../../shared/taxonomyRanks.js";

const props = defineProps({
  card: { type: Object, default: null },
});

function tintColor(color, strength = 0.84) {
  const match = /^#([0-9a-f]{6})$/i.exec(color || "");
  if (!match) return "#f7f5df";
  const value = Number.parseInt(match[1], 16);
  const channels = [value >> 16, (value >> 8) & 255, value & 255];
  return `#${channels
    .map((channel) => Math.round(channel + (255 - channel) * strength).toString(16).padStart(2, "0"))
    .join("")}`;
}

function contrastColor(color) {
  const match = /^#([0-9a-f]{6})$/i.exec(color || "");
  if (!match) return "#202122";
  const value = Number.parseInt(match[1], 16);
  const red = value >> 16;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return red * 0.299 + green * 0.587 + blue * 0.114 > 160 ? "#202122" : "#ffffff";
}

const styles = computed(() => {
  const color = props.card?.color || "#eadf77";
  return {
    "--taxobox-color": color,
    "--taxobox-tint": tintColor(color),
    "--taxobox-title": contrastColor(color),
  };
});

function rankLabel(row, field) {
  if (row?.[field]) return row[field];
  return TAXONOMY_RANK_MAP.get(row?.rankKey)?.[field] || "";
}
</script>

<template>
  <section v-if="card" class="post-taxobox" :style="styles" :aria-label="card.type === 'taxonomy' ? '生物卡片' : '自定义卡片'">
    <h2>{{ card.title || (card.type === "taxonomy" ? "科学分类" : "自定义卡片") }}</h2>
    <figure v-if="card.imageUrl || card.imageSrc">
      <img :src="card.imageUrl || card.imageSrc" :alt="card.imageCaption || card.title || '卡片图片'" loading="lazy" decoding="async" />
      <figcaption v-if="card.imageCaption">{{ card.imageCaption }}</figcaption>
    </figure>
    <table>
      <tbody>
        <tr v-for="(row, index) in card.rows || []" :key="`${row.rankKey || row.label}-${index}`">
          <th scope="row">
            <template v-if="card.type === 'taxonomy'">
              <span>{{ rankLabel(row, "zh") }}</span>
              <small>{{ rankLabel(row, "en") }}</small>
            </template>
            <span v-else>{{ row.label }}</span>
          </th>
          <td>{{ row.value }}</td>
        </tr>
      </tbody>
    </table>
    <p v-if="!card.rows?.length">尚未填写分类阶元</p>
  </section>
</template>

<style scoped>
.post-taxobox{overflow:hidden;border:1px solid #a2a9b1;border-radius:3px;background:#f8f9fa;color:#202122;font-family:Arial,\"Noto Sans SC\",sans-serif;box-shadow:0 10px 28px rgba(49,70,61,.1)}.post-taxobox h2{margin:0;padding:8px 9px;background:var(--taxobox-color);color:var(--taxobox-title);font-size:.94rem;font-weight:800;line-height:1.35;text-align:center}.post-taxobox figure{margin:0;border-bottom:1px solid rgba(162,169,177,.45);background:#fff}.post-taxobox figure img{display:block;width:100%;max-height:280px;object-fit:contain}.post-taxobox figcaption{padding:5px 7px;color:#54595d;font-size:.68rem;line-height:1.4;text-align:center}.post-taxobox table{width:100%;border-collapse:collapse;font-size:.76rem;line-height:1.35}.post-taxobox th,.post-taxobox td{padding:6px 7px;border-top:1px solid rgba(162,169,177,.45);text-align:left;vertical-align:top;overflow-wrap:anywhere}.post-taxobox th{width:46%;background:var(--taxobox-tint);font-weight:700}.post-taxobox th span,.post-taxobox th small{display:block}.post-taxobox th small{margin-top:1px;color:#54595d;font-size:.65rem;font-weight:500}.post-taxobox td{background:#fff}.post-taxobox>p{margin:0;padding:14px;color:#72777d;font-size:.74rem;text-align:center}
</style>
