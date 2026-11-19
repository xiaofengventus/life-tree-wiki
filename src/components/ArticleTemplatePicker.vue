<script setup>
import { computed, ref } from "vue";
import {
  ARTICLE_TEMPLATES,
  articleTemplateLabel,
  articleTemplateSections,
  validateArticleDraft,
} from "../../shared/articleTemplates.js";

const props = defineProps({
  modelValue: { type: Object, default: null },
  automaticReferences: { type: Boolean, default: true },
  title: { type: String, default: "" },
  content: { type: String, default: "" },
  citations: { type: Array, default: () => [] },
  tags: { type: Array, default: () => [] },
});
const emit = defineEmits(["apply", "clear"]);
const selected = ref(ARTICLE_TEMPLATES[0].id);
const showCheck = ref(false);
const definition = computed(() => ARTICLE_TEMPLATES.find((item) => item.id === selected.value));
const preview = computed(() => articleTemplateSections(selected.value, { automaticReferences: props.automaticReferences }));
const draftCheck = computed(() => validateArticleDraft({
  title: props.title,
  content: props.content,
  citations: props.citations,
  tags: props.tags,
  templateId: selected.value,
}));
</script>

<template>
  <section class="article-template-picker" aria-label="文章模板">
    <div class="template-actions">
      <label>文章模板
        <select v-model="selected">
          <option v-for="item in ARTICLE_TEMPLATES" :key="item.id" :value="item.id">{{ item.name }}</option>
        </select>
      </label>
      <button type="button" @click="emit('apply', selected)">追加模板章节</button>
      <button type="button" :aria-expanded="showCheck" @click="showCheck = !showCheck">
        规范自检（{{ draftCheck.warnings.length }}）
      </button>
      <button v-if="modelValue" type="button" @click="emit('clear')">改为自由写作</button>
    </div>
    <p>当前：{{ articleTemplateLabel(modelValue) }}。模板仅提供可编辑的二级标题和写作提示，章节可以删除；应用时追加到文末，不覆盖已有正文。自由写作不改变正文。</p>
    <div v-if="showCheck" class="draft-check" aria-live="polite">
      <ul class="checklist">
        <li v-for="item in draftCheck.checklist" :key="item.id">
          <strong>{{ item.ok ? "✓" : "!" }} {{ item.label }}</strong>：{{ item.detail }}
        </li>
      </ul>
      <ul v-if="draftCheck.warnings.length" class="warnings">
        <li v-for="(warning, index) in draftCheck.warnings" :key="index">{{ warning }}</li>
      </ul>
      <p v-else class="passed">未发现明显的规范问题；仍请人工核对分类与引用。</p>
    </div>
    <details>
      <summary>模板示范与使用说明</summary>
      <p>{{ definition?.summary }}</p>
      <ol><li v-for="section in preview" :key="section.heading"><strong>{{ section.heading }}</strong>：{{ section.text }}</li></ol>
      <p v-if="automaticReferences">参考文献：请使用已有引用工具，阅读页统一显示引用列表，不重复插入手写参考文献列表。基本信息卡和关联树也使用已有插入工具。</p>
      <p v-else>正文使用同一套二级标题及正文样式。参考文献在末节维护，同一来源只列一次。</p>
    </details>
  </section>
</template>

<style scoped>
.article-template-picker { margin: 16px 0; padding: 14px; border: 1px solid #d5dfd8; border-radius: 10px; background: #f8faf7; color: #435b4d; }
.template-actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.template-actions label { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.template-actions select, .template-actions button { padding: 7px 10px; border: 1px solid #b9cbbf; border-radius: 6px; background: white; color: #153727; }
p { margin: 10px 0 0; line-height: 1.65; }
summary { margin-top: 10px; cursor: pointer; }
li { margin: 8px 0; line-height: 1.65; }
.draft-check { margin-top: 10px; padding: 10px 12px; border: 1px solid #d5dfd8; border-radius: 8px; background: #fff; }
.checklist, .warnings { margin: 0; padding-left: 20px; font-size: 13px; }
.warnings { margin-top: 6px; color: #8a5a17; }
.passed { color: #2f6b45; }
</style>
