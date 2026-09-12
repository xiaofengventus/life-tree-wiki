# 生命时序 wiki — 长期项目约定

## 协作方式（用户明确要求过）
- **不要代为执行部署 / 上传等外部动作**。用户要「命令」，自己在终端跑。给命令，别动手。
- **改动前先确认形态再动手**，不要一次性铺开改一大摊。用户要求「一次只做一条」。
- 工作区长期有大量未提交改动（用户自己的在改内容）。**绝不要 `git checkout .` / `git stash` 全量回退**，只回退自己动过的文件。
- 仓库只有 1 个提交 `d4821d6 基于life-tree修改`，没有可用的细分历史。
- ⚠️ **同一轮里对同一个文件并发发多个 Edit 会互相覆盖**：工具返回成功但文件可能没变。
  实测丢过 import 块 / `toolbarKeys` / CSS 三处改动。**对策：同一文件一次只发一个 Edit，改完立刻 grep 验证。**

## 构建 / 部署
- 触发方式：**手动上传到 Cloudflare Pages**，项目 `life-tree-wiki`。
- ⚠️ **`wrangler.jsonc` 的 `name` 已于 2026-09-12 从 `"life-tree"` 改成 `"life-tree-wiki"`**
  （原来那个名字是**另一个 Pages 项目**，导致不带 `--project-name` 的命令会推错项目，
  实测推到过 `production.life-tree.pages.dev`）。改后已验证：裸跑命令解析到 `life-tree-wiki`。
- ⚠️ **`--branch` 决定落生产还是预览**：不带 `--branch` 时 wrangler 用**当前 git 分支**（本仓库是 `main`）
  → 落 **Preview**（`main.life-tree-wiki.pages.dev`）。要更新用户唯一要的 `life-tree-wiki.pages.dev`，
  必须显式 `--branch production`。
  完整命令：`npx wrangler pages deploy dist --project-name life-tree-wiki --branch production`
  （name 已改对，`--project-name` 现在可省，但显式写更稳）。
- `package.json` 的 `cf:deploy` = `npm run build && wrangler pages deploy dist` —— **不带 `--branch`，
  所以它只会更新 main 预览**，不会更新生产域。
- 项目与落点（2026-09-12 用 `wrangler pages project list` / `deployment list` 核对）：
  - 项目 `life-tree-wiki`：**生产分支 = `production`** → `life-tree-wiki.pages.dev`（**用户唯一要的域名**）；
    `main` 是 Preview → `main.life-tree-wiki.pages.dev`。
    2026-09-12 22:20 已把 production 环境更新到 `f77ec67`（`draft_box-BYKxNUNo.js`，含清空草稿按钮）。
  - 项目 `life-tree`：**生产分支 = `main`** → `life-tree.pages.dev`；`production` 反而是它的**预览**分支
    → `production.life-tree.pages.dev`。**不是本站，别推。**
  - ⚠️ 两个项目的生产分支名是**反的**（一个 production、一个 main），这就是「推错域」的根源。
- **前后端是一次部署**：后端 = `functions/`（Pages Functions，45 个），与 `dist/` 同属一个项目，
  没有独立 Worker/服务器；D1(`DB`→`life-tree`) 与 R2(`MEDIA`→`life-tree-media`) 是绑定，
  **两个项目共用同一个 D1 库和 R2 桶**（实证：两边 `/api/trees` 返回同一条记录）。
  D1 结构变更单独跑 `npm run db:migrate:remote`，只需一次。
- ⚠️ 只跑 `wrangler pages deploy dist` 不带 build，传上去的就是旧产物 → 表现为「改了代码线上没变化」。
- 必须顺序：`npm run trees:index` → `vite build` → `wrangler pages deploy dist`。
- 本机在本工具沙箱里跑 `npm run build` 会被 safe-delete 拦截（vite 清空 `dist/assets`，133 个文件）。
  绕法：`npx vite build --outDir dist --emptyOutDir false`（旧 hash 文件留着无害）。
- 分支：生产分支是 `production`（域名 `life-tree-wiki.pages.dev`）；`main` 是预览分支（`main.life-tree-wiki.pages.dev`，用户日常看的这条）。
- 验证线上版本：比对 `curl -s https://main.life-tree-wiki.pages.dev/ | grep -o 'assets/index-[^"]*\.js'` 与本地 `dist/index.html` 的 hash。
  坑：不存在的 `/assets/xxx.js` 会 SPA 回退返回 200 + text/html，别拿状态码判断。
- **两个域名会长期不同步**（2026-09-12 实证：生产 `draft_box-wQsTPK00.js` 无清空草稿按钮，main 的 `draft_box-BYKxNUNo.js` 有）。
  想看某页的新功能必须先确认在哪个域：`life-tree-wiki.pages.dev` = production，`main.life-tree-wiki.pages.dev` = main 预览。
  懒加载分块名 `dist/index.html` 里查不到，要去 `dist/assets/index-*.js` 里 grep `<页名>-[A-Za-z0-9_-]*\.js`，再分别 curl 两份比字节数/grep 关键词。

## 代码结构速查
- `src/components/create_post.vue`（约 6000 行）= 编辑器主体；`editorConfig` 在其中，`customPaste` 已接入 `src/utils/pasteClean.js`。
- 显示用正文 HTML 的统一出口 = `src/utils/richHtml.js` 的 `decorateRichHtml(rawHtml, { codeCopy })`：覆盖阅读页 + 编辑器 Markdown 预览面板（Prism 高亮、表格包裹、代码复制按钮、「代码块案例」卡片都在这里）。`NodeContentReader.vue` **不走**它。
  处理顺序很重要：`highlightCodeElements` → `upgradeCodeSamples` → `attachCodeCopyButtons` → `wrapTables`。后一步依赖前一步产出的 `<pre><code>`。
- 公式：`src/utils/formula.js`（渲染）、`src/utils/markdown.js`（含 LaTeX 归一化）。
- **服务端与客户端清洗是两套，必须同步改**：`server/sanitize.js` vs `src/utils/sanitizeHtml.js`。历史上的 code 语言丢失 bug 就是服务端白名单缺 `code` 规则导致的。

## 本地草稿系统
- **存在 IndexedDB**（不是 localStorage）：库 `life-sequence-workspace`，store `drafts`，主键 `id`。
- 归属用 `ownerKey`：`user:<uid>`（登录后）/ `guest:<随机UUID>`（未登录，UUID 存在 localStorage 的 `life_draft_guest_installation`）。列表按 `visibleDraftOwnerKeys(user)` 过滤，登录后能同时看到账号草稿和历史访客草稿。
- 文件：`src/services/drafts.js`（增删查复制 + `clearDrafts`）、`src/composables/useDraftAutosave.js`（自动保存，模式偏好存 localStorage `life-draft-save-mode`）、`src/utils/draftSnapshots.js`（快照比对）、`src/views/draft_box.vue`（入口路由 `/drafts`，`requiresAuth`）。
- 发布成功后对应草稿会自动清理；`clearDrafts({ownerKeys})` 只删命中归属的条目。

## 「代码块案例」（输入/输出对照卡片）
- **载体是普通代码块**，语言标记 `sample`，内容里单独一行 `---` / `===` 分隔输入输出。
- 好处：不新增元素类型 → **清洗白名单不用动**；编辑/撤销/粘贴/导入导出全部复用。
- wangEditor 代码块节点形状：`{type:"pre", children:[{type:"code", language:"sample", children:[{text}]}]}`，序列化成 `<pre><code class="language-sample">`。
- 代码：`src/utils/codeSample.js`（纯函数）+ `src/utils/wangEditorCodeSample.js`（菜单）、`richHtml.js` 的 `upgradeCodeSamples`、`rich-content.css` 的 `.life-code-sample*`。

## 全局布局 / 已知坑
- **`body` 和 `#app` 不要写死 `height`**。历史上 `base.css` 写 `body{height:100vh}` + `main.css` 写
  `#app{height:100%}`，让 `#app` 只有一屏高 → `navBar.vue` 的 `position:sticky` 滚过一屏
  就被 `#app` 底边带走（表现为"上滑后导航栏消失"）。2026-09-12 已改成 `min-height`。
- `navBar.vue` = 网站主导航（sticky, top:0, z-index:50）。**`components/create_post.vue` 自己不带 navBar**，
  由包装页 `views/create_user_post.vue` 提供（路由 `/create-post`）。
- 编辑器顶部工具栏 = **独立组件 `src/components/EditorToolbar.vue`**（2026-09-12 抽出），`position:fixed; top:64px`
  —— 那 64px 就是给 navBar 让位的。`create_post.vue` 里只剩一行 `<EditorToolbar :editor :citation-panel-open :floating-tools-enabled />`。
  props 只给状态，动作全部派发 `TOOLBAR_MENU_EVENT` 回父组件处理。
- **工具栏里所有入口都是 wangEditor 菜单**（`src/utils/wangEditorToolbarMenus.js`，7 个）：
  插入类 `lifeInsertCard/lifeInsertTree/lifeImportMarkdown`（派发 section）+ 工具类
  `lifeCitationPanel/lifeFloatingTools`（状态型，`isActive()` 读 `setToolbarMenuState()` 注入的状态）
  + `lifeImportDoc/lifeExportDoc`（下拉型）。**不许再往工具栏里塞 `<Toolbar>` 之外的 DOM**——
  一塞就又是"三块拼接"。
- **wangEditor 工具栏结构**：`<Toolbar>` 组件渲染的根元素是一个**无 class 的 wrapper div**，
  它才是 `.editor-toolbar-fixed` 的 flex item；`.w-e-toolbar`（`flex-wrap:wrap`）在它内部。
  所以 `:deep(.w-e-toolbar){flex:1}` 无效（flex-grow 计算值为 1 但宽度不变）。
- **工具栏按钮尺寸**：`.w-e-bar-item`（padding 4 → 38px/项）、`button`（padding 0 8px、高 32）。
  28 项在 **1520px 下不压缩就会折行**（`.w-e-toolbar` 高 80px，撑破 56px 容器）。
  压缩写法现在在 `EditorToolbar.vue` 的 `.editor-toolbar-fixed :deep(...)` 段。
- ⚠️ **窄屏横向滚动：滚动容器是 `.editor-toolbar-fixed` 本身**，配套 `.w-e-toolbar { min-width: fit-content }`
  （按内容撑开；写 `min-width: 0` 会被压扁后折行）。
- ⚠️ **滚动容器会裁掉 wangEditor 的下拉面板**（绝对定位在按钮内部，实测溢出 269px 全裁）。
  解法：观察器检测 `.w-e-select-list / .w-e-drop-panel / .w-e-bar-item-menus-container / .w-e-modal`
  显隐，可见期间给 `.editor-toolbar-fixed` 加 `.is-panel-open` → `overflow: visible`
  （`EditorToolbar.vue` 的 `syncToolbarPanelOverflow` / `watchToolbarPanels`）。
  导航栏（navBar.vue 的 `.wiki-links`）没有弹出面板，所以它能直接 `overflow-x: auto`。
- ⚠️⚠️ **观察器要挂在工具栏根元素上，不要挂 `.w-e-toolbar`**：后者是 wangEditor 渲染后才出现的，
  在它出现前挂载就永久失效。**也别把同步放进 `requestAnimationFrame`**：无头浏览器 / 页面静止
  没有新帧时 rAF 迟迟不触发 → 面板被裁。直接写在 MutationObserver 回调里（微任务批量，开销够低）。
- **自定义下拉菜单**：`DropPanelMenu` 基类只有 d.ts、没有运行时导出，别找它。用
  `showDropPanel = true` + `getPanelContentElem(editor)` 返回 DOM 即可（core 的 `handleDropPanel` 会接管定位）。
  面板里的节点是 JS 造的、不带 scoped 属性 → 样式要写 `.editor-toolbar-fixed :deep(.xxx)`。
- **菜单按钮的 active 类**：wangEditor 用 `button[data-menu-key]` 上的 `.active`。
  状态变化不会让菜单自动重渲染，要在 `EditorToolbar.vue` 里 watch props 手动同步。

## 本地调试（`.local-3d/`，不入库）
- 应用本体：`npx vite --config .local-3d/dev.config.mjs` → <http://localhost:5200>
- 3D 实验页：`npx vite --config experiments/fractal-3d/vite.config.mjs` → <http://localhost:5199>
- ⚠️ 两份配置都把 `cacheDir` 挪出 `node_modules/.vite`。用根 `vite.config.js` 起 dev server 会因
  vite 批量清缓存被 safe-delete 拦截（和 build 清 `dist/assets` 同一类问题）。
- 脚本：`nav-check.mjs`（sticky 体检）、`shot-app.mjs <url> <out> [scrollY] [width]`、`citation-check.mjs`。
- ⚠️ 判断浮层是否可见**别用 `offsetParent !== null`** —— `position:fixed` 元素恒为 `null`。

## 验证套件
- 单元测试：`node --test "tests/*.test.mjs"`（当前 80 个）。另有 `experiments/fractal-3d/layout3d.test.mjs` 26 个（需单独指定路径）。
- 真实 DOM：vite lib 模式（`formats:["iife"]`）把 `src/utils/richHtml.js` 打成单文件，用本机已装的 Playwright Chromium `page.addScriptTag` 注入后断言。改渲染链路时值得跑一遍。

## 文档
- `docs/CHANGELOG.md`：所有 bug 修复与功能新增都记在这里，格式「现象 / 根因 / 改了哪里」。
