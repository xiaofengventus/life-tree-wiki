<script setup>
const referencesText = defineModel("referencesText", { type: String, default: "" });
const imageCreditsText = defineModel("imageCreditsText", { type: String, default: "" });
</script>

<template>
  <section class="content-sources-editor">
    <div>
      <label for="reference-paste">参考文献</label>
      <p>从期刊 Cite、Google Scholar、知网等复制后直接粘贴；多条之间空一行。</p>
      <textarea
        id="reference-paste"
        v-model="referencesText"
        rows="7"
        maxlength="100000"
        placeholder="Smith J, et al. Title of article. Journal, 2024. DOI: 10.xxxx/xxxxx"
      ></textarea>
    </div>

    <div>
      <label for="image-credit-paste">图片来源与授权</label>
      <p>直接粘贴图片名称、作者、来源地址和授权协议；多张图片之间空一行。</p>
      <textarea
        id="image-credit-paste"
        v-model="imageCreditsText"
        rows="5"
        maxlength="100000"
        placeholder="封面珊瑚照片，作者 Zhang San，来源 https://example.com，CC BY 4.0"
      ></textarea>
    </div>
  </section>
</template>

<style scoped>
.content-sources-editor{display:grid;gap:18px;padding:18px;border:1px solid #d7e2dc;border-radius:10px;background:#f8faf9}.content-sources-editor>div{display:grid;gap:7px}.content-sources-editor label{color:#314b40;font-size:.9rem;font-weight:800}.content-sources-editor p{margin:0;color:#6f8077;font-size:.78rem;line-height:1.55}.content-sources-editor textarea{width:100%;padding:11px 12px;border:1px solid #c7d5cd;border-radius:8px;background:#fff;color:#263c33;font:inherit;line-height:1.65;resize:vertical}.content-sources-editor textarea:focus{outline:2px solid rgba(47,128,106,.18);border-color:#2f806a}@media(max-width:720px){.content-sources-editor{padding:14px 10px}}
</style>
