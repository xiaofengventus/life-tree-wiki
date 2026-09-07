<script setup>
import { computed } from "vue";

const props = defineProps({
  citations: { type: Array, default: () => [] },
  referencesText: { type: String, default: "" },
  imageCreditsText: { type: String, default: "" },
  anchorPrefix: { type: String, default: "post-citation" },
});

function entries(value) {
  return String(value || "")
    .split(/\r?\n\s*\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const references = computed(() => entries(props.referencesText));
const imageCredits = computed(() => entries(props.imageCreditsText));
const inlineCitations = computed(() =>
  (Array.isArray(props.citations) ? props.citations : [])
    .map((citation) => ({
      number: Number(citation?.number),
      text: String(citation?.text || "").trim(),
    }))
    .filter((citation) =>
      Number.isSafeInteger(citation.number) &&
      citation.number > 0 &&
      citation.text,
    )
    .sort((first, second) => first.number - second.number),
);
const safeAnchorPrefix = computed(() =>
  /^[a-z][a-z0-9_-]{0,40}$/i.test(props.anchorPrefix)
    ? props.anchorPrefix
    : "post-citation",
);
</script>

<template>
  <section v-if="inlineCitations.length || references.length || imageCredits.length" class="content-sources">
    <div v-if="inlineCitations.length || references.length">
      <h2 id="post-references">参考文献</h2>
      <ol v-if="inlineCitations.length" class="inline-reference-list">
        <li
          v-for="citation in inlineCitations"
          :id="`${safeAnchorPrefix}-${citation.number}`"
          :key="citation.number"
          tabindex="-1"
        >
          <span class="reference-number">[{{ citation.number }}]</span>
          <span>{{ citation.text }}</span>
        </li>
      </ol>
      <template v-if="references.length">
        <h3 v-if="inlineCitations.length">补充参考资料</h3>
        <ol class="supplementary-reference-list">
          <li v-for="(citation, index) in references" :key="index">{{ citation }}</li>
        </ol>
      </template>
    </div>
    <div v-if="imageCredits.length">
      <h2>图片来源与授权</h2>
      <ul>
        <li v-for="(credit, index) in imageCredits" :key="index">{{ credit }}</li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.content-sources{display:grid;gap:22px;margin-top:28px;padding-top:22px;border-top:1px solid #dce5df;color:#33473e}.content-sources h2{margin:0 0 12px;font-size:1.1rem}.content-sources h3{margin:18px 0 9px;color:#63776e;font-size:.88rem}.content-sources ol,.content-sources ul{display:grid;gap:10px;margin:0;padding-left:24px}.content-sources ul{list-style:none;padding-left:0}.content-sources li{padding:11px 13px;border-left:3px solid #82aa99;background:#f7faf8;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere}.inline-reference-list{padding:0!important;list-style:none}.inline-reference-list li{display:grid;grid-template-columns:auto minmax(0,1fr);gap:9px;scroll-margin-top:96px;border-left-color:#4e9bd2;background:#f5faff}.inline-reference-list li:target{outline:2px solid rgba(22,131,216,.28);background:#eaf6ff}.reference-number{color:#1683d8;font-weight:800}.supplementary-reference-list{margin-top:0}
</style>
