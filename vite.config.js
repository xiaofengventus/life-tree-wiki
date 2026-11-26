import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// 让 dev 与线上（Cloudflare Pages）的**静态目录索引**行为一致。
//
// 为什么需要：`public/laup/index.html` 想要 `/laup/` 这个地址（导航栏那条
// 「Laup 写作」就指它，见 src/components/navBar.vue）。线上没错 —— Pages 原生就会把
// `/about/index.html` 规整成 `/about/`，再由 `/about/` 回落到那个文件。
// 但 Vite 的 publicDir 中间件**不认目录索引**（内部 sirv 配的是 extensions: []），
// 请求 `/laup/` 会穿过去、被 SPA 回落兜成 Vue 应用自己的 index.html ——
// 于是"本地看是个 Vue 页、线上才是 Laup"。这种 dev/prod 不一致最难查，必须补平。
//
// 只在 serve 阶段生效，构建产物一个字节都不受影响。
// 判据是"目标文件真的存在"，所以碰不到 Vite 自己的虚拟路径（如 /__devtools__/）。
function publicDirIndex() {
  let publicDir = ''
  return {
    name: 'public-dir-index',
    apply: 'serve',
    configResolved(config) {
      publicDir = config.publicDir
    },
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (!req.url || !publicDir) return next()
        const q = req.url.indexOf('?')
        const pathname = q < 0 ? req.url : req.url.slice(0, q)
        const search = q < 0 ? '' : req.url.slice(q)
        if (!pathname.endsWith('/') || pathname.includes('..')) return next()
        const file = resolve(publicDir, `.${decodeURIComponent(pathname)}`, 'index.html')
        if (existsSync(file)) req.url = `${pathname}index.html${search}`
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: '/',
  plugins: [
    vue(),
    command === 'serve' ? vueDevTools({ inspect: false }) : null,
    publicDirIndex(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))
