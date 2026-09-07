<script setup>
import { computed } from "vue";
import PostClassificationCard from "./PostClassificationCard.vue";
import ResearchTreeEmbed from "./ResearchTreeEmbed.vue";
import { richPreviewHtml } from "@/utils/uiPdf";
import { renderLatex } from "@/utils/formula";

const props = defineProps({
  block: { type: Object, required: true },
});

defineEmits(["media-loaded"]);

const paragraphHtml = computed(() => (
  props.block.type === "paragraph" ? richPreviewHtml(props.block.html) : ""
));

const formulaHtml = computed(() => (
  props.block.type === "formula"
    ? renderLatex(props.block.latex, props.block.displayMode)
    : ""
));

const cardModel = computed(() => {
  if (props.block.type !== "card") return null;
  return {
    title: props.block.title,
    color: props.block.color,
    imageUrl: props.block.imageUrl,
    imageCaption: props.block.imageCaption,
    rows: props.block.rows,
  };
});
</script>

<template>
  <div
    v-if="block.type === 'paragraph'"
    class="ui-pdf-rich"
    v-html="paragraphHtml"
  />

  <component
    :is="`h${block.level}`"
    v-else-if="block.type === 'heading'"
    :id="block.anchorId || undefined"
    class="ui-pdf-heading"
  >
    {{ block.text }}
  </component>

  <figure
    v-else-if="block.type === 'image' && block.src"
    class="ui-pdf-figure"
    :class="[block.align, block.frame]"
    :style="{ width: `${block.widthPercent}%` }"
  >
    <img
      :src="block.src"
      :alt="block.alt"
      :style="{ objectFit: block.objectFit }"
      @load="$emit('media-loaded')"
    />
    <figcaption v-if="block.caption" v-html="richPreviewHtml(block.caption)" />
    <small v-if="block.credit">{{ block.credit }}</small>
  </figure>

  <section
    v-else-if="block.type === 'gallery' && block.images.length"
    class="ui-pdf-gallery"
    :style="{ gap: `${block.gapMM}mm`, '--columns': block.columns, '--row-height': `${block.rowHeightMM}mm` }"
  >
    <figure
      v-for="(image, index) in block.images"
      :key="`${block.id}-${index}`"
      :class="block.objectFit"
    >
      <img
        :src="image.src"
        :alt="image.alt"
        @load="$emit('media-loaded')"
      />
      <figcaption v-if="image.caption">{{ image.caption }}</figcaption>
    </figure>
  </section>

  <div
    v-else-if="block.type === 'formula' && formulaHtml"
    class="ui-pdf-formula"
    :class="{ display: block.displayMode }"
    v-html="formulaHtml"
  />

  <section
    v-else-if="block.type === 'tree' && block.treeId"
    class="ui-pdf-tree"
    :style="{ height: `${block.heightMM}mm` }"
  >
    <ResearchTreeEmbed
      :tree-id="block.treeId"
      :fallback-title="block.title"
    />
  </section>

  <aside
    v-else-if="block.type === 'card'"
    class="ui-pdf-card"
    :style="{ '--card-accent': block.color, breakInside: block.breakable ? 'auto' : 'avoid' }"
  >
    <PostClassificationCard :card="cardModel" />
  </aside>

  <hr v-else-if="block.type === 'divider'">
</template>

<style scoped>
.ui-pdf-rich {
  color: var(--ui-pdf-ink);
}

.ui-pdf-rich :deep(p) {
  margin: 0 0 1em;
  line-height: var(--ui-pdf-line-height);
  overflow-wrap: anywhere;
}

.ui-pdf-rich :deep(p:last-child) {
  margin-bottom: 0;
}

.ui-pdf-rich :deep(ul),
.ui-pdf-rich :deep(ol) {
  padding-left: 1.4em;
  margin: 0 0 1em;
}

.ui-pdf-rich :deep(blockquote) {
  margin: 0 0 1em;
  padding: 0.2em 0 0.2em 1em;
  border-left: 2px solid var(--ui-pdf-accent);
  color: var(--ui-pdf-muted);
}

.ui-pdf-rich :deep(pre) {
  max-width: 100%;
  margin: 0 0 1em;
  padding: 10px;
  overflow: hidden;
  border-radius: 4px;
  background: #f6f8f6;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 8.5pt;
  line-height: 1.45;
}

.ui-pdf-rich :deep(code) {
  font-family: ui-monospace, "Cascadia Mono", monospace;
}

.ui-pdf-rich :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1em;
  table-layout: fixed;
}

.ui-pdf-rich :deep(th),
.ui-pdf-rich :deep(td) {
  padding: 5px 7px;
  border: 1px solid var(--ui-pdf-rule);
  vertical-align: top;
  font-size: 9pt;
  overflow-wrap: anywhere;
}

.ui-pdf-rich :deep(th) {
  background: #f3f7f3;
  font-weight: 750;
}

.ui-pdf-heading {
  margin: 0.2em 0 0.35em;
  color: var(--ui-pdf-ink);
  letter-spacing: 0;
  break-after: avoid-page;
}

h2.ui-pdf-heading {
  font-size: 17pt;
  line-height: 1.24;
}

h3.ui-pdf-heading {
  font-size: 13.5pt;
}

h4.ui-pdf-heading,
h5.ui-pdf-heading,
h6.ui-pdf-heading {
  color: #405146;
  font-size: 11.5pt;
}

.ui-pdf-figure {
  width: 100%;
  margin: 0 auto 12px;
}

.ui-pdf-figure.start {
  margin-left: 0;
  margin-right: auto;
}

.ui-pdf-figure.end {
  margin-left: auto;
  margin-right: 0;
}

.ui-pdf-figure.hairline img {
  border: 1px solid var(--ui-pdf-rule);
}

.ui-pdf-figure.boxed {
  padding: 4px;
  border: 1px solid var(--ui-pdf-rule);
  background: #fafcfb;
}

.ui-pdf-figure img {
  display: block;
  width: 100%;
  max-height: 175mm;
  object-position: center;
}

.ui-pdf-figure figcaption {
  margin-top: 5px;
  color: var(--ui-pdf-muted);
  font-size: 8pt;
  line-height: 1.4;
}

.ui-pdf-figure small {
  display: block;
  margin-top: 2px;
  color: #97a59c;
  font-size: 7pt;
}

.ui-pdf-gallery {
  display: grid;
  grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
  align-items: stretch;
  margin-bottom: 2mm;
}

.ui-pdf-gallery figure {
  display: grid;
  grid-template-rows: minmax(var(--row-height), auto) auto;
  margin: 0;
  overflow: hidden;
  background: #fff;
}

.ui-pdf-gallery.cover figure img {
  width: 100%;
  height: var(--row-height);
  object-fit: cover;
}

.ui-pdf-gallery.contain figure img {
  width: 100%;
  height: var(--row-height);
  object-fit: contain;
}

.ui-pdf-gallery figcaption {
  padding: 4px;
  color: var(--ui-pdf-muted);
  font-size: 7.4pt;
  line-height: 1.32;
  text-align: center;
}

.ui-pdf-formula {
  margin-bottom: 1em;
  overflow-wrap: anywhere;
}

.ui-pdf-formula.display {
  padding: 2mm 0;
  text-align: center;
}

.ui-pdf-tree {
  min-width: 0;
  height: 82mm;
  margin-bottom: 3mm;
  overflow: hidden;
  border: 1px solid var(--ui-pdf-rule);
  border-radius: 5px;
  background: #fbfdfb;
}

.ui-pdf-tree :deep(.research-tree-embed) {
  height: 100%;
  margin: 0;
  border-radius: 0;
}

.ui-pdf-tree :deep(.embed-canvas) {
  height: calc(100% - 46px);
}

.ui-pdf-card {
  min-width: 0;
}

.ui-pdf-card :deep(img) {
  max-height: 64mm;
}

hr {
  width: 100%;
  height: 1px;
  margin: 7mm 0;
  border: 0;
  background: var(--ui-pdf-rule);
}
</style>
