<script setup>
import { computed } from "vue";
import UiPdfBlockPreview from "./UiPdfBlockPreview.vue";
import { collectHeadings } from "@/utils/uiPdf";

const props = defineProps({
  documentModel: { type: Object, required: true },
  pages: { type: Array, required: true },
  metrics: { type: Object, required: true },
  activeHeadingId: { type: String, default: "" },
  focusedBlockId: { type: String, default: "" },
});

defineEmits(["block-selected", "media-loaded"]);

const asideItems = computed(() => {
  const configured = props.documentModel?.aside?.items || [];
  return configured.length ? configured : collectHeadings(props.documentModel);
});

const showAside = computed(() => (
  props.documentModel?.layout?.showAside !== false &&
  props.documentModel?.layout?.template === "sidebar-flow" &&
  asideItems.value.length > 0
));

function replaceVariables(value, index) {
  return String(value || "")
    .replaceAll("{page}", String(index + 1))
    .replaceAll("{total}", String(props.pages.length));
}
</script>

<template>
  <div
    class="ui-pdf-document"
    :class="{ 'two-column': documentModel.layout.template === 'two-column' }"
    :style="{ '--aside-width': `${documentModel.layout.asideWidthMM}mm`, '--column-gap': `${documentModel.layout.columnGapMM}mm` }"
  >
    <section
      v-for="(blocks, pageIndex) in pages"
      :key="`${documentModel.meta.revision || 'doc'}-${pageIndex}-${pages.length}`"
      class="ui-pdf-sheet"
      :style="{ '--paper-width': `${metrics.width}px`, '--paper-height': `${metrics.height}px`, '--paper-margin': `${metrics.margin}px` }"
      aria-label="PDF 页面"
    >
      <header
        v-if="documentModel.header.enabled"
        class="ui-pdf-page-header"
        :class="[documentModel.header.style]"
      >
        <div class="brand" :data-align="documentModel.header.align">
          <span>{{ documentModel.header.label || documentModel.meta.title }}</span>
          <strong v-if="documentModel.header.subtitle">{{ documentModel.header.subtitle }}</strong>
        </div>
        <small v-if="documentModel.header.badge">{{ documentModel.header.badge }}</small>
      </header>

      <div class="ui-pdf-page-body" :class="{ rail: showAside }">
        <nav v-if="showAside" class="ui-pdf-aside" aria-label="文档侧边目录">
          <ul :style="{ maxHeight: `${documentModel.aside.maxVisible * 7}mm`, '--marker-color': documentModel.theme.accent }">
            <li
              v-for="(item, itemIndex) in asideItems.slice(0, documentModel.aside.maxVisible)"
              :key="item.id || itemIndex"
              :class="{ selected: activeHeadingId === item.id }"
            >
              <i aria-hidden="true" />
              <span>{{ item.symbol }}</span>
              <strong>{{ item.label }}</strong>
              <small v-if="item.pages">{{ item.pages }}</small>
            </li>
          </ul>
        </nav>

        <main class="ui-pdf-flow">
          <article
            v-for="block in blocks"
            :key="block.id"
            :id="`ui-pdf-block-${block.id}`"
            class="ui-pdf-block"
            :class="{ focused: focusedBlockId === block.id }"
            @click="$emit('block-selected', block.id)"
          >
            <UiPdfBlockPreview
              :block="block"
              @media-loaded="$emit('media-loaded')"
            />
          </article>
        </main>
      </div>

      <footer v-if="!documentModel.footer.excludePages.includes('first') || pageIndex > 0" class="ui-pdf-page-footer">
        <span>{{ replaceVariables(documentModel.footer.left, pageIndex) }}</span>
        <span>{{ replaceVariables(documentModel.footer.center, pageIndex) }}</span>
        <span>{{ replaceVariables(documentModel.footer.right, pageIndex) }}</span>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.ui-pdf-document {
  display: grid;
  justify-items: center;
  gap: 22px;
}

.ui-pdf-sheet {
  --accent: var(--ui-pdf-accent);
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  box-sizing: border-box;
  width: var(--paper-width);
  min-width: var(--paper-width);
  height: var(--paper-height);
  padding: var(--paper-margin);
  overflow: hidden;
  background: var(--ui-pdf-paper);
  color: var(--ui-pdf-ink);
  font-family: var(--ui-pdf-font-family);
  break-inside: avoid;
}

.ui-pdf-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 42px;
  margin-bottom: 9px;
}

.ui-pdf-page-header.band {
  padding: 6px 10px;
  border-radius: 3px;
  background: #f4f8f4;
}

.ui-pdf-page-header.boxed {
  padding: 6px 10px;
  border: 1px solid var(--ui-pdf-rule);
}

.ui-pdf-page-header.hairline {
  border-bottom: 1px solid var(--ui-pdf-rule);
}

.ui-pdf-page-header .brand {
  display: flex;
  align-items: baseline;
  gap: 9px;
  min-width: 0;
}

.ui-pdf-page-header .brand[data-align="center"] { justify-content: center; }
.ui-pdf-page-header .brand[data-align="end"] { justify-content: end; }
.ui-pdf-page-header span {
  overflow: hidden;
  color: var(--accent);
  font-size: 8pt;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ui-pdf-page-header strong {
  overflow: hidden;
  font-size: 9pt;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ui-pdf-page-header small {
  flex: none;
  padding: 2px 6px;
  border-radius: 99px;
  color: #66746c;
  font-size: 6.8pt;
  font-weight: 750;
}

.ui-pdf-page-body {
  display: grid;
  align-items: start;
  min-height: 0;
}

.ui-pdf-page-body.rail {
  grid-template-columns: auto minmax(0, 1fr);
  gap: 7mm;
}

.ui-pdf-aside {
  box-sizing: border-box;
  width: var(--aside-width, 38mm);
  overflow: hidden;
}

.ui-pdf-aside ul {
  display: grid;
  gap: 3px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ui-pdf-aside li {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0 4px;
  align-items: center;
  padding: 4px 0 4px 9px;
  opacity: 0.54;
}

.ui-pdf-aside li i {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 0;
  width: 2px;
  background: transparent;
}

.ui-pdf-aside li.selected {
  opacity: 1;
  font-weight: 800;
}

.ui-pdf-aside li.selected i {
  background: var(--marker-color);
}

.ui-pdf-aside span {
  color: #87948d;
  font-size: 6.4pt;
  letter-spacing: 0.06em;
}

.ui-pdf-aside li.selected span {
  color: var(--marker-color);
}

.ui-pdf-aside strong,
.ui-pdf-aside small {
  overflow: hidden;
  font-size: 8pt;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ui-pdf-aside small {
  grid-column: 2;
  color: #8d9a92;
  font-size: 6.6pt;
}

.ui-pdf-flow {
  min-width: 0;
}

.ui-pdf-document.two-column .ui-pdf-flow {
  column-count: 2;
  column-gap: var(--column-gap, 7mm);
}

.ui-pdf-block {
  cursor: default;
}

.ui-pdf-block.focused::before {
  position: absolute;
  inset: -3px;
  pointer-events: none;
  content: "";
  outline: 1px dashed color-mix(in srgb, var(--ui-pdf-accent) 55%, transparent);
}

.ui-pdf-page-footer {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: center;
  min-height: 32px;
  padding-top: 7px;
  border-top: 1px solid var(--ui-pdf-rule);
  color: #75837b;
  font-size: 7.2pt;
}

.ui-pdf-page-footer span:last-child {
  text-align: right;
}

.ui-pdf-page-footer span:nth-child(2) {
  text-align: center;
}

@media print {
  .ui-pdf-document {
    gap: 0;
  }

  .ui-pdf-sheet {
    box-shadow: none !important;
    page-break-after: always;
  }
}
</style>
