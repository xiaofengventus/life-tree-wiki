# 生命时序 wiki — 长期项目约定

## 协作方式（用户明确要求过）
- **不要代为执行部署 / 上传等外部动作**。用户要「命令」，自己在终端跑。给命令，别动手。
- **改动前先确认形态再动手**，不要一次性铺开改一大摊。用户要求「一次只做一条」。
- 工作区长期有大量未提交改动（用户自己的在改内容）。**绝不要 `git checkout .` / `git stash` 全量回退**，只回退自己动过的文件。
- 仓库只有 1 个提交 `d4821d6 基于life-tree修改`，没有可用的细分历史。

## 构建 / 部署
- 触发方式：**手动上传到 Cloudflare Pages**，项目 `life-tree-wiki`。
- ⚠️ 只跑 `wrangler pages deploy dist` 不带 build，传上去的就是旧产物 → 表现为「改了代码线上没变化」。
- 必须顺序：`npm run trees:index` → `vite build` → `wrangler pages deploy dist`。
- 本机在本工具沙箱里跑 `npm run build` 会被 safe-delete 拦截（vite 清空 `dist/assets`，133 个文件）。
  绕法：`npx vite build --outDir dist --emptyOutDir false`（旧 hash 文件留着无害）。
- 分支：生产分支是 `production`（域名 `life-tree-wiki.pages.dev`）；`main` 是预览分支（`main.life-tree-wiki.pages.dev`，用户日常看的这条）。
- 验证线上版本：比对 `curl -s https://main.life-tree-wiki.pages.dev/ | grep -o 'assets/index-[^"]*\.js'` 与本地 `dist/index.html` 的 hash。
  坑：不存在的 `/assets/xxx.js` 会 SPA 回退返回 200 + text/html，别拿状态码判断。

## 代码结构速查
- `src/components/create_post.vue`（约 6000 行）= 编辑器主体；`editorConfig` 在其中，`customPaste` 已接入 `src/utils/pasteClean.js`。
- 显示用正文 HTML 的统一出口 = `src/utils/richHtml.js` 的 `decorateRichHtml(rawHtml, { codeCopy })`：覆盖阅读页 + 编辑器 Markdown 预览面板（Prism 高亮、表格包裹、代码复制按钮、「代码块案例」卡片都在这里）。`NodeContentReader.vue` **不走**它。
  处理顺序很重要：`highlightCodeElements` → `upgradeCodeSamples` → `attachCodeCopyButtons` → `wrapTables`。后一步依赖前一步产出的 `<pre><code>`。
- 公式：`src/utils/formula.js`（渲染）、`src/utils/markdown.js`（含 LaTeX 归一化）。
- **服务端与客户端清洗是两套，必须同步改**：`server/sanitize.js` vs `src/utils/sanitizeHtml.js`。历史上的 code 语言丢失 bug 就是服务端白名单缺 `code` 规则导致的。

## 「代码块案例」（输入/输出对照卡片）
- **载体是普通代码块**，语言标记 `sample`，内容里单独一行 `---` / `===` 分隔输入输出。
- 好处：不新增元素类型 → **清洗白名单不用动**；编辑/撤销/粘贴/导入导出全部复用。
- wangEditor 代码块节点形状：`{type:"pre", children:[{type:"code", language:"sample", children:[{text}]}]}`，序列化成 `<pre><code class="language-sample">`。
- 代码：`src/utils/codeSample.js`（纯函数）+ `src/utils/wangEditorCodeSample.js`（菜单）、`richHtml.js` 的 `upgradeCodeSamples`、`rich-content.css` 的 `.life-code-sample*`。

## 验证套件
- 单元测试：`node --test "tests/*.test.mjs"`（当前 66 个）。
- 真实 DOM：vite lib 模式（`formats:["iife"]`）把 `src/utils/richHtml.js` 打成单文件，用本机已装的 Playwright Chromium `page.addScriptTag` 注入后断言。改渲染链路时值得跑一遍。

## 文档
- `docs/CHANGELOG.md`：所有 bug 修复与功能新增都记在这里，格式「现象 / 根因 / 改了哪里」。
