<script setup>
/**
 * LifetreeChronoView - [lifetree] 格的全局预览（新窗口全页打开）。
 * 数据通过 localStorage 传递（CellToolbar 的"全局预览"按钮写入）：
 *   key = 'lifetree-preview-source'，值 = JSON { source, ts }
 * 只认 code 格声明后的正文；渲染走 /life-tree 同源布局的时序图变体
 * （utils/lifeTreeChrono.js：地质年代带 + 时间标定分支）。
 */
import { computed } from 'vue'
import { parseCodeDecl } from '@/utils/codeLang.js'
import { parseLifetree } from '@/laup/extensions/lifetree.js'
import { renderChrono } from '@/utils/lifeTreeChrono.js'
import { chronoStyleOptions } from '@/utils/lifeTreeChronoStyle.js'
import NavBar from '@/components/navBar.vue'

const KEY = 'lifetree-preview-source'

const payload = (() => {
  try {
    const raw = sessionStorage.getItem(KEY) ?? localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
})()

const body = computed(() => {
  const source = String(payload?.source ?? '')
  const decl = parseCodeDecl(source)
  return decl.raw === 'lifetree' ? decl.body : source
})

const result = computed(() => {
  try {
    const parsed = parseLifetree(body.value)
    if (!parsed.tree) return { svg: '', diags: parsed.diags, empty: true }
    // 全局配置行（[lifetree 时序 …] 那行）里的样式令牌全部生效；图宽按窗口自适应。
    const cfg = { ...(parsed.cfg || {}), 图宽: Math.max(960, window.innerWidth - 48) }
    const r = renderChrono(parsed.tree, chronoStyleOptions(cfg))
    return { ...r, diags: [...parsed.diags, ...r.diags], empty: false }
  } catch (e) {
    return { svg: '', diags: [{ level: 'error', message: e?.message || String(e) }], empty: true }
  }
})
</script>

<template>
  <div class="lifetree-chrono-shell">
    <NavBar />
    <div class="lifetree-chrono-page">
    <header class="lc-head">
      <strong>生命时序 · 全局预览</strong>
      <span class="lc-sub">地质年代轴 / 时间标定分支 —— 与 [lifetree] 格同源渲染</span>
    </header>
    <div v-if="result.empty && !result.diags.length" class="lc-empty">
      没有预览数据：回到 Notebook，在 [lifetree] 格的工具栏点「全局预览」打开这一页。
    </div>
    <div v-else class="lc-body" v-html="result.svg" />
    <div v-for="(d, i) in result.diags" :key="i" class="laup-warn lc-warn">⚠ {{ d.message }}</div>
    </div>
  </div>
</template>

<style scoped>
.lifetree-chrono-shell { min-height: 100vh; display: flex; flex-direction: column; }
.lifetree-chrono-page {
  flex: 1;
  min-height: 0;
  padding: 20px 24px;
  background: #fff;
}
.lc-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 14px;
}
.lc-head strong {
  font-size: 17px;
  color: #1f2328;
}
.lc-sub {
  font-size: 12px;
  color: #8a919c;
}
.lc-body :deep(svg) {
  max-width: 100%;
  display: block;
}
.lc-empty {
  padding: 40px;
  color: #8a919c;
  font-size: 14px;
}
.lc-warn {
  max-width: 960px;
  margin: 6px 0;
  padding: 4px 10px;
  background: #fdf6e3;
  border: 1px solid #e7d9b0;
  border-radius: 6px;
  color: #9a6b1f;
  font-size: 12px;
}
</style>
