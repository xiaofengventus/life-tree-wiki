/**
 * 本地验证用的 vite 配置（照抄项目根 vite.config.js，只挪走 cacheDir）。
 *
 * 为什么不用根配置：根配置的缓存目录是 node_modules/.vite，
 * 依赖变动时 vite 会批量清空它，本机沙箱的 safe-delete 会拦截，dev server 起不来。
 *
 * 跑法（在项目根目录）：
 *   npx vite --config .local-3d/dev.config.mjs
 */
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  root: fileURLToPath(new URL("../", import.meta.url)),
  cacheDir: fileURLToPath(new URL("./vite-cache", import.meta.url)),
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("../src", import.meta.url)),
    },
  },
  server: {
    port: 5200,
    strictPort: true,
  },
});
