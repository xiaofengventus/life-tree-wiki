# 变更记录

本文件记录本项目的 **bug 修复** 与 **功能新增**。新条目写在最上面，按日期倒序。

每条尽量写清三件事：**现象**、**根因**、**改了哪里**，方便以后回溯。

---

## 2026-09-11

### 新增

#### 专栏合集：把同一主题的作品归到一起

- **需求**：用户可以创建「合集」，把相似的文章归到一起；合集默认公开，也可单独设为仅自己可见。
- **形态**：合集只收录**作者自己的作品**，文章和进化树可以放在同一个合集里（和别人内容的收藏由「收藏」承担，两者不重叠）。合集名称 + 简介 + 可见范围，条目可手动排序。
- **改动**：
  - **新增** `migrations/0024_collections.sql`：`collections`（合集，含 `visibility`）+ `collection_items`（文章/树共用条目表，带 `sort_order`）。**没有改 `posts` 和 `content_favorites`**。
  - **新增** `server/collections.js`：摘要、加载、`requireCollectionOwner`、`requireOwnedTargets`（校验作品确实属于该用户）、条目排序语句。
  - **新增** `functions/api/collections/index.js`（列表 / 创建）、`[id].js`（详情 / 修改 / 删除）、`[id]/items.js`（添加 / 排序 / 移除）。路由形态与仓库既有的 `trees/[id].js` + `trees/[id]/contributions.js` 一致。
  - **新增** `src/services/collections.js`（前端调用）与 `src/utils/collectionItems.js`（纯逻辑：条目转展示行、上下移动、候选作品过滤）。
  - **新增** `src/views/collection_detail.vue` + 路由 `/collections/:id`；`src/views/user_space.vue` 加「合集」折叠区（本人可内联新建）。
- **可见性规则**：私密合集对外返回 404（不泄露存在性）；公开合集里的**私密作品对访客自动过滤掉**，只有作者本人能看到完整条目；条目计数也按访客身份区分。
- **边界**：作品被删除或转为私密后**条目本身保留**，只是展示时被过滤 —— 不会因为改可见性就丢条目。合集删除是软删（`deleted_at`），不影响作品本身。
- **验证**：`tests/collectionItems.test.mjs` 新增 12 个用例（链接形态、可见性、排序移动、越界夹取、候选过滤），全量测试 78 个通过；构建通过。
- **影响入口**：`migrations/0024_collections.sql`、`server/collections.js`、`functions/api/collections/*`、`src/services/collections.js`、`src/utils/collectionItems.js`、`src/views/collection_detail.vue`、`src/views/user_space.vue`、`src/router/index.js`

### 修复

#### 进化树编辑器「布局」「…」下拉菜单点了没反应

- **现象**：在进化树编辑页点顶部工具栏的「▤ 布局 ▾」或「… ▾」，按钮状态有变化，但菜单不出现（最多只露出菜单被裁掉后的一小条边）。
- **根因**：两个原因叠加。
  1. 工具栏 `.command-bar.floating` 是 `overflow: auto` 的滚动容器，**会裁剪绝对定位的子浮层**；而 `.io-dropdown-menu` 被写成了向上弹出（`bottom: calc(100% + 8px)`），整块落到工具栏顶边之外 → 被裁掉。
  2. 工具栏本身 `top: 8px` 贴在工作区最顶部，向上根本没有空间，菜单因此跑到**视口之外**（实测菜单 `top ≈ -124px`，`…` 菜单 `top ≈ -291px`），所以肉眼看不到任何东西。
- **改动**：`src/components/evolution_mind_map.vue` 三处小改。
  - 菜单改为**向下**弹出：`.io-dropdown-menu` 用 `top: calc(100% + 8px)` 取代 `bottom: calc(100% + 8px)`，阴影方向与入场动画同步调整；另加 `max-height: min(60vh, 420px)` + `overflow-y: auto`，窗口很矮时菜单自身可滚，不会被工作区底部裁掉。
  - 工具栏加 `menu-open` class（`:class="{ 'menu-open': layoutMenuOpen || moreMenuOpen }"`），配 CSS `.command-bar.floating.menu-open { overflow: visible; }`：**只在菜单展开期间**解除裁剪，其他时候工具栏的滚动行为不变。
- **验证**：用 Playwright + Chromium 加载该组件真实 CSS 做过断言 —— 修复前菜单 `top=-124 / -291`、中心点 `elementFromPoint` 命中 `null`（点不到任何东西）；修复后 1280×800 与 1024×620 两种视口下，两个菜单都完整落在工作区与视口内，9/9 采样点可点中，菜单内 3/3 与 7/7 个条目全部可点。
- **影响入口**：`src/components/evolution_mind_map.vue`

---

## 2026-09-10

### 修复

#### 代码块语言在提交后丢失

- **现象**：编辑器里给代码块选了语言，编辑器内能看到语言标记；提交后语言消失，阅读页代码也没有高亮。
- **根因**：服务端清洗 `server/sanitize.js` 会先清空元素的所有属性，再按白名单回填；但白名单里没有 `code` 的分支，`class="language-xxx"` 被整体抹掉。客户端 `src/utils/sanitizeHtml.js` 本来有这条规则，两端不一致。
- **改动**：`server/sanitize.js` 增加 `code` 分支，按客户端相同的规则保留 `language-xxx` class 与 `data-code-language`。
- **影响入口**：`server/sanitize.js`

### 改进

#### 编辑器内代码块底色与正文背景分不清

- **现象**：编辑器里的代码框背景接近纯白，和正文背景区分不开。
- **改动**：`src/components/create_post.vue` 里编辑器内容区 `pre` 的样式补上底色 `#edf1f7`、边框 `#ccd8e4`、圆角与内边距；同时把 `pre code` 的背景改成透明，避免两层背景叠加。
- **影响入口**：`src/components/create_post.vue`

#### 粘贴文字统一为正文大小

- **现象**：从网页 / Word / 公众号复制文字粘进正文，会带上来源的字号、字体、行高、缩进，导致正文大小不一。
- **改动**：新增 `src/utils/pasteClean.js`，粘贴时剥掉尺寸类样式（`font`、`font-size`、`font-family`、`line-height`、`letter-spacing`、`word-spacing`、`text-indent`、`mso-*` 等）；**标题 `h1`–`h6` 保留标签**，只剥掉它们带来的字号声明，字号由编辑器样式决定，之后也能手动设置标题级别；加粗、斜体、列表、引用、代码、表格、链接与颜色一并保留。通过 `editorConfig.customPaste` 接入。
- **保守取舍**：编辑器内部复制的内容（含公式、卡片等自定义节点）以及含图片的粘贴，保持默认行为不介入。
- **影响入口**：`src/utils/pasteClean.js`（新增）、`src/components/create_post.vue`

### 新增

#### 代码块「复制」按钮

- **需求**：代码块上提供一个一键复制代码的入口。
- **改动**：`src/utils/richHtml.js` 在渲染出口 `decorateRichHtml` 中给每个 `<pre><code>` 追加「复制」按钮，`src/main.js` 调用 `installCodeCopyHandler()` 安装一次全局点击委托；点击后文案变「已复制」，1.6 秒后复原。`navigator.clipboard` 不可用（如 http 环境）时降级为临时 textarea + `execCommand("copy")`。样式在 `src/assets/rich-content.css`，同时把代码语言标签从右上移到左上，右上留给按钮。
- **边界**：按钮只存在于渲染结果里，不进入编辑器正文、不入库；打印 / 导出用的 `uiPdfPrintHtml` 传 `{ codeCopy: false }` 关闭按钮。
- **影响入口**：`src/utils/richHtml.js`、`src/main.js`、`src/assets/rich-content.css`、`src/components/UiPdfDocumentEditor.vue`

#### 「代码块案例」——输入 / 输出对照卡片

- **需求**：像 OJ 题解那样，把一组样例的「输入」「输出」左右并排展示，各自带复制按钮。
- **做法**：**复用普通代码块**做载体，不新增元素类型。作者点工具栏的「代码块案例」插入一个代码块，在块里用单独一行 `---`（或 `===`）分隔输入与输出；阅读时语言标记为 `sample` 的代码块会被升级成并排卡片，两侧各自有「复制」按钮，编号按块在文中出现的顺序自动从 `#0` 递增。
- **为什么这么做**：代码块的 `class="language-xxx"` / `data-code-language` 本来就会被两端清洗保留，所以**两个清洗白名单一个字都不用改**；编辑、撤销、粘贴、导入导出也全部复用已有代码块能力。
- **实现**：新增 `src/utils/codeSample.js`（纯函数：切分文本 + 生成卡片 HTML，可单测）、`src/utils/wangEditorCodeSample.js`（工具栏菜单 + 插入代码块节点）；`src/utils/richHtml.js` 在渲染出口增加 `upgradeCodeSamples` 步骤（必须跑在挂复制按钮之前，卡片两栏本身是 `<pre><code>`，按钮自动复用）；样式在 `src/assets/rich-content.css`。
- **注意**：编辑器里它看起来就是普通代码块（所见即所得只在阅读页生效）；如果之后希望编辑器内也渲染成卡片，需要改成自定义元素类型，那就要动两端的清洗白名单。
- **影响入口**：`src/utils/codeSample.js`（新增）、`src/utils/wangEditorCodeSample.js`（新增）、`src/utils/richHtml.js`、`src/assets/rich-content.css`、`src/components/create_post.vue`（注册菜单 + 工具栏按钮）、`tests/codeSample.test.mjs`（新增）
