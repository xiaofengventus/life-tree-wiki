/**
 * 实验页专用的 vite 配置。
 *
 * 为什么不直接用项目根的 vite.config.js：
 *   根配置的缓存目录是 node_modules/.vite，vite 重装依赖后会去清空它，
 *   而本机沙箱的 safe-delete 会在批量删除时拦截，dev server 直接起不来。
 *   这里把 root 和 cacheDir 都挪到实验目录内，互不打扰。
 *
 * 跑法（在项目根目录）：
 *   npx vite --config experiments/fractal-3d/vite.config.mjs
 */
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  cacheDir: fileURLToPath(new URL("../../.local-3d/vite-cache", import.meta.url)),
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("../../src", import.meta.url)),
    },
  },
  server: {
    port: 5199,
    strictPort: true,
  },
  optimizeDeps: {
    include: ["three"],
  },
});
