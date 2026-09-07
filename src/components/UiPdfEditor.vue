<script setup>
/**
 * UI-PDF 编辑器入口（项目已有的中间包装层）
 * ------------------------------------------------------------------
 * 用户明确要求不改 create_post.vue。因此 v1→v2 的切换只在这个文件。
 * 目前这里直接指向 v2 新版壳子 UiPdfEditorV2（五层架构 + Theme + Playwright 导出链路）。
 *
 * 如果将来需要回退到旧版 v1（wangEditor + blocks 数组 + window.print），
 * 只要把下面 import 切回 @/components/UiPdfDocumentEditor.vue 即可，不需要改任何路由或 create_post。
 */
import UiPdfEditorV2 from "@/components/ui-pdf/UiPdfEditorV2.vue";
</script>

<template>
  <UiPdfEditorV2 />
</template>
