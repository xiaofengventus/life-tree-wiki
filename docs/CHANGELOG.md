# 变更记录

本文件记录本项目的 **bug 修复** 与 **功能新增**。新条目写在最上面，按日期倒序。

每条尽量写清三件事：**现象**、**根因**、**改了哪里**，方便以后回溯。

---

## 2026-09-12

### 优化

#### 工具栏：参考文献 / 浮动开关 / 导入 / 导出 也注册成 wangEditor 菜单（工具栏独立成组件）

**现象**：上一版把横向滚动条放到整条工具栏容器上，窄屏时"看起来"是一起滚了，但**代码与 DOM 上
依旧是分开的元素** —— 所以只要外侧还有独立按钮，就还是"三块拼接"。用户要求：这些功能**完全**
在 wangEditor 工具栏里实现，并进一步要求工具栏单独放一个文件。

**根因**：参考文献开关、浮动工具栏开关、导入、导出原本是 `.editor-toolbar-fixed` 里
`<Toolbar>` 之外的独立 DOM（自带描边圆角），与 wangEditor 原生按钮不是同一套渲染。

**改了哪里**：

- `src/utils/wangEditorToolbarMenus.js`：菜单从 3 个扩到 **7 个**。
  - 新增状态型菜单 `lifeCitationPanel` / `lifeFloatingTools`：`isActive()` 读
    `setToolbarMenuState()` 注入的状态，`exec` 只派发 `toggle-citation` / `toggle-floating-tools` 事件。
  - 新增下拉型菜单 `lifeImportDoc` / `lifeExportDoc`：用 wangEditor 官方的
    **`showDropPanel = true` + `getPanelContentElem(editor)`**（`@wangeditor/core` 里的
    `MenuButton.handleDropPanel`/`DropPanel`）渲染面板 —— 和「正文」「字号」那些原生下拉
    共用同一套容器与左右对齐定位逻辑，不是自己写的一套 absolute 下拉。
- `src/components/EditorToolbar.vue`（**新增**）：整个工具栏搬进独立组件。
  含 `toolbarConfig`、tooltip 词典、下拉面板裁切处理、开关按钮 `active` 同步。
  props：`editor` / `citationPanelOpen` / `floatingToolsEnabled`；动作一律派发
  `TOOLBAR_MENU_EVENT` 回父组件，组件本身不碰业务状态。
- `src/components/create_post.vue`：模板里只剩一个 `<EditorToolbar>`；删掉工具栏外那两组
  按钮 DOM（`citation-panel-toggle-btn` / `editor-toolbar-extras` / `io-dropdown`）与对应 CSS；
  事件处理按 `action` 分发（`toggle-citation` / `toggle-floating-tools` / `import` / `export` / `open-section`）。
- `src/utils/toolbarTooltips.js`（**新增**）：`formatToolbarShortcut` 提到这里，
  工具栏组件与插入悬浮条共用。

**踩到的两个坑**：

1. **观察器挂错了节点**：下拉面板的显隐观察原本挂在 `.w-e-toolbar` 上，而它是 wangEditor
   渲染**之后**才出现的 —— 一旦在它出现前挂载就永久失效，表现为「面板打开时没放开
   `overflow`，窄屏被滚动容器裁掉」。改挂工具栏根元素（我们自己渲染、一定存在）。
2. **requestAnimationFrame 饥饿**：把「面板可见 → 放开 overflow」的同步放在 `rAF` 里，
   在**没有新帧**的场景（无头浏览器、页面静止）会迟迟不触发，同样是面板被裁。
   改成在 `MutationObserver` 回调里**直接同步**（观察器本身就是微任务批量回调，开销足够低）。

**验证（`.local-3d/toolbar-menus.mjs`，760 / 1024 / 1280 / 1520 四档）**：

- `.editor-toolbar-fixed` **只剩 1 个子元素**（wangEditor 的 `<Toolbar>` wrapper）；
  `.editor-toolbar-extras` / `.citation-panel-toggle-btn` / `.io-dropdown` 均已不存在。
- 同一条工具栏里 **28 个菜单**；四档 `rows = 1` 全部不折行。
- 760px `scrollWidth 1176 > clientWidth 760` 可横向滚动，滚动后「参考文献」按钮
  `x: 15 → -401` —— 整条一起位移。
- 点「参考文献」→ 面板 `display: none → flex`，按钮点亮；点「浮动工具栏」→
  `.editor-wrapper` 加 `floating-tools-disabled`，按钮取消点亮。
- 导入 / 导出下拉面板正常展开（3 个条目），打开期间 `overflowY: visible`、面板整体在视口内
  且 `elementFromPoint` 命中面板本身 —— 没被滚动容器裁掉。

#### 修复：工具栏按钮的悬停提示气泡（快捷键说明）被滚动容器裁掉

**现象**：工具栏改为横向滚动容器（`overflow-y: hidden`）后，鼠标悬停在按钮上时
「加粗 Ctrl + B」这类提示气泡只剩一条边，其余部分被容器剪掉看不见。

**根因**：提示气泡是按钮的 `::after` 伪元素（`w-e-menu-tooltip-v5`），画在按钮**外面**
（工具栏下方），天然会被 `overflow: hidden` 的祖先裁剪 —— 和下拉面板被裁是同一个容器，
但**伪元素不进 DOM，MutationObserver 抓不到它的显隐**。

**改了哪里**（`src/components/EditorToolbar.vue`）：

- 新增 `handleBarOver` / `handleBarLeave`（模板上挂在工具栏根元素的
  `@mouseover` / `@mouseleave`）：悬停在带 `data-tooltip` 的按钮上时置 `tooltipHover = true`。
- `syncToolbarPanelOverflow` 的释放条件从「有面板开着」扩成「有面板开着 **或** 正悬停在
  带提示的按钮上」—— 气泡与面板共用同一套「放开 overflow + `scrollLeft` 位移补偿」逻辑，
  所以窄屏滚动后悬停也不会把工具栏跳回原位。

**验证**（`.local-3d/verify-tooltip.mjs`，900px、先滚到 `scrollLeft=120`）：
悬停加粗 → `is-panel-open`、`overflowY: visible`、位移 `-120px`（视觉位置不变）；
移开 → 类移除、`scrollLeft` 还原 `120`；悬停中点导入面板共存正常；四档回归 + 80 单测 + 构建通过。

#### 调整：浮动开关恢复原尺寸与蓝色；「代码块案例」不再自带长模板

**现象**（用户反馈两点）：
1. 并入工具栏后，「浮动工具栏」开关缩成了一个小图标，而且开启时不是原来的蓝色。
2. 点工具栏「代码块案例」会插入一段内置的示例数字（`11 22 33 44 55 …`），内容长的案例根本用不上，
   还得手动删。

**改了哪里**：

- `src/utils/wangEditorToolbarMenus.js`：`lifeFloatingTools` 的图标改成细长条
  （`viewBox="0 0 26 14"`，`<path>` 实心轨道 + `<circle>` 拨钮），并把
  `CODE_SAMPLE_TEMPLATE` 从那段示例数字改成**空字符串**（插入后只有一个 BOM 占位符，
  作者直接填自己的输入输出）。
- `src/components/EditorToolbar.vue`：给 `lifeFloatingTools` 单独写样式 ——
  svg 显式 `26×14`（按钮宽度回到 26 + 左右各 8px 内边距 = 42px，与原来那个独立开关一致）；
  颜色直接命中子元素（`svg path` = 轨道、`svg circle` = 拨钮）：关 = 灰轨道 + 白钮，
  开 = `#2486ce` 蓝轨道 + 白钮 + `scaleX(-1)` 把拨钮翻到右边，底色 `#eff8fe`。
  ⚠️ 不用 `class` / `fill` 属性写颜色：wangEditor 会**递归剥掉按钮图标 svg 上的
  `width`/`height`/`fill`/`class`**（core 的 `pd()` 清洗函数），只有按标签命中的 CSS 规则盖得住。

**验证**：开启/关闭两态截图与并入前的独立开关一致；点「代码块案例」插入的代码块内容仅含
BOM 占位符（`len: 1`）；28 菜单、四档不折行、下拉面板在视口内、80 个单测全过、构建通过。

#### 修复：窄屏点开下拉菜单时整条工具栏跳回未滚动状态（面板开到视口外）

**现象**：760px 窄屏下把工具栏横向滚到最右、点「导入」，面板不是开在按钮下方，而是开在
视口右侧外面（实测 `left: 827` > 视口 760），看起来像"点了没反应"。宽屏（≥1280）无此问题。

**根因**：放开 overflow 的解法本身有个**自伤副作用** —— `overflow` 从 `auto` 变成 `visible` 后，
这个元素就**不再是滚动容器**了，浏览器会把 `scrollLeft` 丢掉（实测 `416 → 0`）。
于是整条工具栏瞬间跳回未滚动的样子，按钮被推到视口右侧之外，紧随其后面板也跟着开在视口外。
也解释了为什么只有下拉类菜单（导入/导出/正文/字号）会这样，而加粗、引用开关这些不弹面板的按钮
`scrollLeft` 一直保持 `416`。

**改了哪里**（`src/components/EditorToolbar.vue`）：

- `syncToolbarPanelOverflow()` 不再只 `classList.toggle`：开面板时先记下 `scrollLeft`，
  写入自定义属性 `--life-toolbar-scroll-x: -<scrollLeft>px`；关面板时移掉它并把 `scrollLeft` 放回去。
- CSS 补一条 `.editor-toolbar-fixed.is-panel-open > div { transform: translateX(var(--life-toolbar-scroll-x, 0px)) }`
  —— overflow 期间用位移做等价替换，**视觉位置完全不变**；面板绝对定位在按钮内部，会跟着一起走。
- 顺带加了「状态没变就直接 return」的短路：本函数挂在 MutationObserver 上，改 `class` / `style`
  会再触发一次回调，短路避免无谓抖动。

**验证**：

- `.local-3d/dbg7.mjs` 直接证实根因：`scrollLeft 416 →（设 overflow:visible）→ 0 →（还原 auto）→ 416`。
- `.local-3d/dbg-scroll-fix.mjs`（760px，含真实鼠标点击）：面板打开时 `位移=-416px`、
  面板矩形 `l:411 / r:611` 完全落在视口内；关闭后 `scrollLeft` 还原为 `416`；可重复开关。
- `.local-3d/toolbar-menus.mjs` 四档复跑：导入面板 `在视口内=true`、`hit=true`，全程零报错。
  （顺带修正该脚本：原先在面板已打开、不可滚动之后才去设 `scrollLeft`，导致 760px 误报 `hit=false`。）

#### 编辑器工具栏：三块拼接 → 一条完整工具栏

**现象**：顶部工具栏看起来像三块拼在一起 —— 左边一个白底描边的「📚 参考文献」胶囊、
中间一条 wangEditor 工具栏、右边一组描边按钮；中间那块还明显更高、往外冒。

**根因（两个叠在一起）**：

1. 三组元素各写各的样式：左边是 `1px` 描边 + 白底的胶囊，右边是描边按钮 + 胶囊开关，
   中间 wangEditor 是透明按钮 —— 风格不统一，自然看着是三块。
2. **中间「突出」的真相**：wangEditor 工具栏 21 个按钮需要约 1130px，但 1520px 视口下只分到
   842px，`.w-e-toolbar { flex-wrap: wrap }` 直接折成两行（实测高 80px），撑破 56px 的
   `.editor-toolbar-fixed`，三组元素的垂直居中基准因此错位。

**改了哪里**：

- `src/utils/wangEditorToolbarMenus.js`（**新增**）：把原先挂在工具栏**外**的
  「▦ 配置文章卡片 / 🌳 进化树块 / M↓ Markdown 导入」三个入口，按项目既有的
  `Boot.registerMenu` 模式（同 `wangEditorCitation.js`）注册成 wangEditor 菜单，
  由 `toolbarKeys` 决定位置 —— 于是它们**真正成为同一条工具栏里的按钮**，
  尺寸、圆角、hover、tooltip 全部自动与其它按钮一致。菜单只派发
  `life-open-tool-section` 事件，面板开关仍复用原来的 `openInsertToolSection`。
- `src/components/create_post.vue`：`toolbarKeys` 补三个 key；监听新事件；删掉工具栏外那三个
  图标按钮；压缩 wangEditor 按钮内边距（`.w-e-bar-item` padding 4→0、button padding 0 6px、
  `.w-e-bar-divider` 高 40→20），使它一行放得下。
- 视觉统一：`.editor-toolbar-fixed` 统一 `padding: 0 14px` + `gap: 4px`；「参考文献」改为
  **纯图标按钮**（30×30，内联书本 SVG）；「浮动工具栏」**去掉文字只留开关**（开启状态进
  `title`）；「导入 / 导出」去掉描边。现在所有控件统一 30px 高、6px 圆角、同一套 hover 底色。

**验证**：1280 / 1366 / 1440 / 1520 四档宽度实测均**单行不折行**（`itemRows = 1`）；
三个新菜单的面板均能打开且落到正确分区（`sidebar` / `tree` / `markdown`）。

**窄屏（补充：整条共用一条滚动条）**

原先窄屏会折成两行：`.w-e-toolbar` 是 `flex-wrap: wrap`，而 `.editor-toolbar-fixed` 高度写死
`56px`，折行后内容溢出错位（实测 1024px 下主工具栏高 64px）。

第一版把横向滚动加在**中间那条 wangEditor 工具栏**上，结果窄屏时只有中间在动，
左右两侧的「参考文献」「浮动工具栏」「导入 / 导出」纹丝不动 —— 仍然像三块拼接。
改为**整条工具栏共用一条滚动条**：滚动容器上移到 `.editor-toolbar-fixed` 本身
（`flex-wrap: nowrap` + `overflow-x: auto`，隐藏滚动条），中间工具栏用
`min-width: fit-content` 按内容撑开，而不是被压扁后折行。

- ⚠️ **下拉面板会被滚动容器裁掉**：wangEditor 的下拉（「正文」「字号」「颜色」…）**绝对定位在
  按钮内部**，实测面板高 262px、滚动容器底边 108px，**溢出 269px 全部被裁**。
  解法：`MutationObserver` 监听面板显隐，可见期间给 `.editor-toolbar-fixed` 加
  `.is-panel-open` 临时 `overflow: visible`，关闭后恢复。
- 按钮间距从 `padding: 0 6px` 回调到 `0 8px`（原先为塞进一行的过度压缩显得挤）。
- 「参考文献」图标换成更醒目的实心双页书（17px）。

**验证**：760 / 1024 / 1280 / 1520 四档实测 **`rows = 1`，全部不折行**；760px 下
`scrollWidth 1172 > clientWidth 760` 可横向滚动，滚动后左侧引用按钮 `x: 14 → -398`、
右侧工具组 `right: 1158 → 746` —— **两侧与中间同步移动**；四档下打开下拉面板
`elementFromPoint` 反查 `bottomPointHitsPanel: true`（未被裁剪）。

### 部署

#### 现象：`life-tree-wiki.pages.dev` 上看不到刚做完的功能

- 草稿箱的「清空草稿」按钮在本地、在预览域都能看到，唯独 `life-tree-wiki.pages.dev` 上没有。
  **代码和构建产物都没问题**，是部署打偏了。

#### 根因（两层，都要记住）

1. **`wrangler.jsonc` 的 `name` 写的是 `"life-tree"` —— 那是另一个 Pages 项目的名字，不是本站。**
   凡是没带 `--project-name` 的 wrangler 命令都会被推到项目 `life-tree`，落点
   `production.life-tree.pages.dev`。（实测踩过一次。）
2. **`--branch` 决定落「生产」还是落「预览」。** 不带 `--branch` 时 wrangler 取**当前 git 分支**
   （本仓库是 `main`），于是部署进的是 **Preview 环境**，只更新 `main.life-tree-wiki.pages.dev`。
   `wrangler pages deployment list --project-name life-tree-wiki` 实证：在 2026-09-12 22:20 之前，
   该项目 **Production 环境只有过一次部署**（源码 `d4821d6`，一天前），
   近期部署**全部**是 `Preview / main` —— 所以生产域一直停在旧构建上。

#### 改了哪里

- `wrangler.jsonc`：`"name": "life-tree"` → **`"name": "life-tree-wiki"`**（仅此一行）。
  改后 `wrangler pages deployment list`（不带 `--project-name`）已能正确列出 `life-tree-wiki` 的部署。
- 2026-09-12 22:20 生产环境重新部署（源码 `f77ec67`），
  `life-tree-wiki.pages.dev` 主包由 `index-vHGLtWg-.js` 变为 `index-BQ1_yuk0.js`，
  分块 `draft_box-BYKxNUNo.js`（4403 B，含 `清空草稿`）—— 按钮已在目标域名生效。

#### 两个 Pages 项目必须分清

| 项目 | 分支 / 环境 | 域名 | 说明 |
|---|---|---|---|
| `life-tree-wiki` | `production` / **Production** | `life-tree-wiki.pages.dev` | ✅ **唯一要用的正式域名** |
| `life-tree-wiki` | `main` / Preview | `main.life-tree-wiki.pages.dev` | 本站的预览，只有日常自看用 |
| `life-tree` | 生产 | `life-tree.pages.dev` | ❌ **另一个项目**，跑的是本站旧产物 |
| `life-tree` | `production` / Preview | `production.life-tree.pages.dev` | ❌ 另一个项目，误推命令的落点 |

- **两个项目的生产分支刚好是反的**（这是所有混淆的源头）：
  - `life-tree-wiki` → 生产分支是 **`production`**，`main` 是预览分支；
  - `life-tree` → 生产分支是 **`main`**，`production` 反而是预览分支
    （所以「往 `life-tree` 推 `--branch production`」只会得到 `production.life-tree.pages.dev` 这个预览域）。

- `<分支名>.<项目名>.pages.dev` 是 Cloudflare **自动生成的分支预览别名**，面板里**没有单独删除的入口**。
- 想让某个分支域名消失只有两条路：删掉该分支名下的部署
  （`wrangler pages deployment delete <deployment-id>`，会变成 404，但下次再往该分支部署又会冒出来），
  或**整个项目删掉**（`wrangler pages project delete <project-name>`）。
- 部署记录里 `Deployment` 列的 `https://<uuid>.life-tree-wiki.pages.dev` 是**每次部署独有的地址**，
  和分支别名不是一回事，别看错。
- **注意**：`life-tree.pages.dev` 是这个仓库早期用过的落点，删项目 `life-tree` 会同时让它和
  `production.life-tree.pages.dev` 一起消失；D1（`DB`）与 R2（`MEDIA`）是独立资源，
  删 Pages 项目**不会**删掉数据库和桶。

#### 前端和后端分别怎么部署

- **后端没有单独的部署命令。** 本项目的后端是 Cloudflare **Pages Functions** —— 也就是 `functions/`
  目录（`functions/api/**` 共 45 个文件，业务逻辑在 `server/*.js`）。它和静态产物**属于同一个项目**，
  一次 `wrangler pages deploy dist` 就一起上传编译，**不需要第二条命令**。
  仓库里也**没有独立 Worker**：`wrangler.jsonc` 没有 `main` 字段，也没有 `.toml` 配置。
  - 实证：两个域名 `GET /api/auth/config` 均返回 `200 application/json`；
    `GET /api/trees` 均返回同一条记录（`fba21424-…` / `T000022`）→ 函数在线、数据在线。
- **前端**：`vite build` 产出 `dist/`，交给同一条 `wrangler pages deploy`。没有单独的构建服务。
- **数据（D1 / R2）不是「部署」，是绑定**：写在 `wrangler.jsonc` ——
  `d1_databases`（`DB` → `life-tree`）+ `r2_buckets`（`MEDIA` → `life-tree-media`），
  部署时应用到项目；面板 Settings → Bindings 里也能核对。
- **⚠️ 两个项目共用同一套数据**：`life-tree` 与 `life-tree-wiki` 是**同一份配置**的两次部署，
  绑的是**同一个 D1 库、同一个 R2 桶**（实测两边 `/api/trees` 返回同一条记录）。
  所以删掉 `life-tree` 项目**不会丢数据**，但只要两个域名都在线，它们就在读写同一份内容。
- **数据库结构变更**要单独跑，且**只需跑一次**（与部署到哪个项目无关）：
  ```bash
  npm run db:migrate:remote     # = wrangler d1 migrations apply DB --remote
  ```
  迁移文件在 `migrations/`（当前 24 个，最新 `0024_collections.sql`）。

#### 标准部署流程（以后只走这条）

```bash
npm run trees:index
npx vite build --outDir dist --emptyOutDir false
npx wrangler pages deploy dist --branch production
```

- 第二条要显式写 `--outDir dist --emptyOutDir false`：本机 safe-delete 会拦截 vite 清空
  `dist/assets`（133 个文件），构建直接失败；旧 hash 文件留在 `dist` 里无害。
- 只想更新预览、不动生产域：把 `--branch production` 换成 `--branch main`（或省略 `--branch`）。
- `package.json` 的 `cf:deploy` 是 `npm run build && wrangler pages deploy dist`，
  **不带 `--branch`** → 只会更新 `main` 预览，**不会更新正式域名**。

#### 怎么验证线上到底是哪个版本

```bash
curl -s https://life-tree-wiki.pages.dev/ | grep -o 'assets/index-[^"]*\.js'   # 正式域名
curl -s https://main.life-tree-wiki.pages.dev/ | grep -o 'assets/index-[^"]*\.js' # 预览域名
grep -o 'assets/index-[^"]*\.js' dist/index.html                                # 本地构建
```

⚠️ 两个坑：
- 不存在的 `/assets/xxx.js` 会被 SPA 回退成 `200 + text/html`，**别拿状态码判断资源是否存在**。
- **懒加载分块（如 `draft_box-*.js`）在 `dist/index.html` 里查不到**，要去 `dist/assets/index-*.js` 里
  `grep -o '<页名>-[A-Za-z0-9_-]*\.js'` 拿分块名，再分别 curl 两个域名比字节数 / grep 关键词。

### 新增

#### 分形漫游树 · 3D 版实验（方案版本 B 的 Q0 + Q1）

- **做了什么**：把「分形漫游树」的 3D 版落地成一个**纯本地实验页**，用线上真实数据
  （`T000021`，2363 节点 / 1457 叶 / 最深 107 层）跑通了布局 + 渲染 + 交互。
  **不接入正式页面、不加路由、未碰 `server/*`、`functions/api/*`、数据库与清洗逻辑。**
- **位置**：`experiments/fractal-3d/`（`layout3d.js` 算法内核 / `main.js` three 渲染 /
  `index.html` / `data/` 真实数据 / `layout3d.test.mjs`）
- **跑法**：`npx vite --config experiments/fractal-3d/vite.config.mjs` → <http://localhost:5199/>
  - 之所以单开一份 vite 配置：根配置的 `cacheDir` 是 `node_modules/.vite`，装完新依赖后
    vite 会清空它，而本机沙箱的 safe-delete 会在批量删除时拦截，dev server 直接起不来。
    这份配置把 `root` 与 `cacheDir` 都挪进实验目录，绕开该问题。
- **算法**（三条规则 + 一条约束，详见 `experiments/fractal-3d/README.md` 与
  `docs/fractal-tree-plan.md` 第 11 节）：
  1. 半径几何增长 `r(d) = base × K^d` —— 自相似的充要条件；
  2. 方向在锥内按**球冠面积**均匀铺开，方位角用黄金角错开；
  3. 锥角按**等立体角**分配 `cos αᵢ = 1 − wᵢ(1 − cos αp)`，Σ 子立体角 = 父立体角；
  4. 用**根锥余量**约束子锥，保证半球模式下永不长到海面以下。
- **踩过的两个坑**（都写进 README 了，避免以后重走）：
  - 先用**父锥**约束（`β ≤ spread − α`）：权重极不均的树里最大分支能吃掉父锥绝大部分
    （这棵树真核占 83%、锥角 80°），其余分支被压到轴上 → 表现为「树上部一大坨堆在顶上」。
  - 放松成「铺满父锥 + 事后投影回锥面」：又制造了**锥面吸引子**，枝条被投影到锥面后
    沿着它滑行，深层节点全贴着海面走。
  - 最终方案：每个节点能偏多远，取决于「当前方向离根锥边界还剩多少」再扣掉自己的锥半径 ——
    空间永远够用，两个毛病同时消失。
- **`depthExponent`（面板「自相似度」）**：`r(d) = base × K^(d^p)`。
  `p=1` 是严格几何，这棵 107 层的树最外层半径是根部的 **3770 倍**，看全树时内部糊成一团；
  默认 **0.85** 把跨度压到 ~49 倍，层次一眼看得清。越深的树越需要这个旋钮。
- **泛化**（刻意不为某一棵树调参）：`normalizeTree()` 统一任意输入形状 ——
  兼容 `{data:{uid,text}}` / `{label}` / `{name}` / 裸节点 / 缺 uid（按路径补，结果可复现）/
  `children` 非数组 / 重复引用成环（WeakSet 切断）/ 超大输入（nodeLimit 兜底）。
  页面支持下拉切换 **16 棵真实树**，也支持**直接拖一个 json 进来**。
- **验证**：`node --test experiments/fractal-3d/layout3d.test.mjs` 26 个用例全过
  （规范化 / 边界树 / 几何不变量 / 折叠 / 截断 / 用 `data/` 下全部 16 棵真实树做泛化冒烟）。
  规模跨度 3 → 2363 节点。性能：2363 节点 = 2 个 draw call（`InstancedMesh` + `LineSegments`），
  布局 ~10ms。
- **已知未做**：节点常显标签（现仅有悬停 tooltip）、折叠 UI（算法层已支持且有单测）、
  点击飞入 + 面包屑、图片节点、与内容卡片联动。场景层（海 / 天 / 星）是氛围，约 10 个元素、与节点数无关。

### 规划（未实现）

#### 分形漫游树：OneZoom 式的「缩放进出」演化树（**双版本**）

- **诉求**：参考 [OneZoom](https://www.onezoom.org)，做一个可以像地图一样缩放进出、逐步展开的演化树；
  **图形必须是 HTML DOM 元素**（不用 canvas、不用 SVG）。视觉图元按用户给的参考图：
  地面（蓝交叉线）、树（竖直主干）、图片节点（大圆环）、纯节点（小圆环），枝干是斜线。
- **两个版本**（用户确认）：
  - **版本 A · DOM 版**：纯 DOM，渲染产物不含 `<svg>` / `<canvas>`，伪 3D 氛围（CSS `perspective` + 分层视差）。
    作为默认视图**兼降级目标**。
  - **版本 B · 3D 版**：**允许 canvas / WebGL**（three.js），唯一新增能力是**绕树旋转一圈看结构**，
    场景为真光照、真海面、真阴影。3D 版**动态引入**，不切到 3D 就不下载（约 150KB gzip）。
  - 两版共用同一份 `document_json`、同一套"按叶子数加权"的分配规则、同一套交互语义
    （单击飞入 / 手柄折叠 / 面包屑 / 内容卡片）与同一个页面入口；只是布局维度与渲染器不同。
- **与现有两套渲染器的分工**（都不替换）：
  - `LifeTreeDom.vue`（正交分类树，DOM）—— 一眼看全，适合**查**；
  - `ArtTreeVisualization.vue`（艺术树，**SVG**）—— 静态封面，适合**看**；
  - 新增分形漫游树（DOM）—— 缩放展开，适合**逛**。放在 `/life-tree/:id` 上做第二种显示方式。
- **技术选择**：
  - **枝 = 一个 `width=枝长; height=1px` 的 div 旋转而成**（`transform-origin: 0 50%`），
    与参考图里斜线的画法一一对应；**节点 = `border-radius: 50%` 的 div**，有图时 `overflow: hidden`
    套圆形裁图；**地面 = 三条装饰性斜线**，不参与布局。
  - **布局与渲染彻底分离**：`fractalTreeLayout.js` 是纯函数，只吐坐标（`nodes / branches / ground /
    width / height`），可在 `node --test` 里直接覆盖，不需要浏览器 —— 沿用 `lifeTreeLayout.js` 的既有约定。
  - **角度按「叶子数」加权分配**（`span(child) = span(parent) × leafCount(child) / leafCount(parent)`），
    这是 OneZoom 的精髓，也是现有 `artTreeLayout.js` 平均分配角度所不具备的；半径按深度递增。
    根部默认向上张开扇形（`sweep` 可配）。
  - **缩放只改一个 `transform`**：视口状态是 `{ scale, tx, ty }`，缩放平移飞入全程不动子元素、
    不触发重排；滚轮以指针为锚点（`tx' = px - (px - tx) × s'/s`）；点节点「飞入」= 把它的角度区间
    铺满视口，rAF 缓动 600ms。
  - **LOD 限流**：只渲染可见的少数几层，更深子树用一根「代表枝 + 半透明圆」收尾；标签与图片
    在缩放超过阈值后才出现。元素预算 ≤ 1200，节点上限 `FRACTAL_NODE_LIMIT = 600`。
  - **收起 / 展开**：因为角度按叶子数加权，折叠一个节点等价于**把它当成叶子**（`leafCount = 1`
    且不遍历其子节点），省下的角度自动分给兄弟 —— 布局函数只多一个 `collapsedIds` 入参，
    不需要额外分支逻辑，这是该布局规则的额外红利。折叠状态用 `Set<nodeId>` 管理（可存
    `localStorage`，可 `?collapsed=` 分享）；渲染层要给折叠节点加「里面还有 N 个」的标记。
    交互上「单击 = 飞入」已占用，折叠改用节点旁的手柄（放大到一定层级才出现，**已定为方案 A**），
    另配 `Space` / `Shift+点击` / 「全部收起 / 全部展开」。
  - **一处实现调整**：枝与节点的位置**统一用 `transform` 定位**（枝 `translate + rotate + scaleX`，
    节点 `translate(x,y) translate(-50%,-50%)`），不用 `left / top / width`。这样折叠重排和缩放
    都只改 transform，能吃 CSS transition → 重排动画一次样式变更完成，不掉帧。
    代价是线宽会随缩放变粗（放大镜效果），首期接受。
  - **场景层（伪 3D 氛围）**：要"像 Blender 搭了个场景"的观感 —— 脚下是岛、四周是海、头顶是天，
    还有鸟飞过。底座是 **CSS 3D transform（`perspective` + `rotateX`）而不是 WebGL**：树仍是
    一张立起来的画，场景是围着它的几层平面。分层 L0 天空 → L1 日/月 → L2 云 → L3 远山 →
    L4 海洋（`rotateX(74deg)` + 波纹） → L5 岛/地面（承接树的落影） → L6 树 → L7 前景鸟与落叶。
    鸟用两片 `border-radius` 弧形 div 做翅膀 + `offset-path` 飞行。纵深感靠三件事：**视差**
    （各层位移系数 0.03 / 0.1 / 0.6 / 1.3）、**大气透视**（枝色按节点深度渐变到地平线色）、
    **落影**（枝坐标乘 `scaleY(0.25)` 再画一遍）。场景层元素固定约 20–30 个，
    **与树有多少节点无关**。
  - **镜头与缩放的坑**：本方案的缩放是"把树的局部放大"，不是摄像机推近 —— 场景若直接吃
    `scale`，放大 10 倍后海面会跑到天上。改为由虚拟镜头距离驱动（`f(log(scale))`），并设阈值
    `SCENE_FADE_SCALE`（初值 4×）**线性淡出天空与海洋**；超过阈值后场景层 `display: none`，
    彻底释放成本。顺带成了叙事：一开始"海天之间一棵树"，缩进去就是"走进枝条里"。
  - **边界**：支持轻微视角摆动（鼠标映射到 `rotateY ±6°` / `rotateX ±3°`）与可选日夜循环；
    **不支持绕树转一圈看背面** —— 那需要 three.js / WebGL，与"全是 DOM 元素"冲突 → **改由版本 B 承担**。
  - **3D 版（版本 B）要点**：栈为 `three` + `OrbitControls`。布局把"角度按叶子数加权"推广到球面：
    子节点方向落在父方向的圆锥内，**锥角按叶子权重开平方分配**（`α = CONE × √(w/W)`，让锥面面积正比于权重），
    锥内用黄金角螺旋铺开避免重叠；半径仍按深度。枝与节点用 `InstancedMesh` 实例化（600 节点一批绘制）。
    **标签刻意保留 DOM**（`CSS2DRenderer`），文字可选中可点击，`NodeContentReader` 原样复用，两版内容联动一致。
    `collapsedIds` 折叠状态两版共用。WebGL 不可用时自动回落到版本 A。
- **改动范围（预计）**：新增 `src/utils/fractalTreeLayout.js`、`src/components/FractalTreeDom.vue`、
  `src/components/FractalTreeViewer.vue`、`tests/fractalTreeLayout.test.mjs`；改 `src/views/LifeTree.vue`
  加显示方式切换。**不动**数据库、`server/*`、`functions/api/*`、清洗逻辑与另外两个渲染器；
  深链走查询参数 `?view=fractal&node=:uid`，不新增路由。
- **分期**：版本 A —— P0 布局+单测 → P1 静态渲染 → P2 视口交互 → P3 飞入+面包屑 → P4 收起/展开
  → P5 图片节点+LOD+压测 → P6 接入页面与内容卡片联动 → P7 场景层（伪 3D 氛围）；
  版本 B —— Q0 3D 布局+单测 → Q1 场景骨架+OrbitControls → Q2 实例化枝与节点 → Q3 交互对齐
  → Q4 真阴影/鸟/性能与降级。**建议 A 做完再开 B**。
- **验收硬指标**：版本 A —— 渲染产物里不含 `<svg>` / `<canvas>`；600 节点 ≥ 50fps；飞入任意叶节点 ≤ 1s；
  600 节点下一次折叠重排 ≤ 16ms 且收起状态刷新后保持；场景层 DOM ≤ 30 个且与节点数无关。
  版本 B —— 绕树旋转 ≥ 50fps；**未切到 3D 视图时首页不加载 three**；WebGL 不可用自动回落 A 且不报错。
- **完整方案（图元 CSS、坐标公式、风险与取舍）**：`docs/fractal-tree-plan.md`

### 优化

#### 编辑器工具栏：左右两处工具合成一条

- **诉求（对照截图）**：① 左侧那栏「＋ 添加引用」和顶部工具栏看着是两套，应该合成一条；
  ② 删掉打叉的「＋ 生物卡片」「＋ 自定义卡片」；③ 把「参考文献」开关挪到工具栏最左端；
  ④ 浮动工具栏有、固定工具栏没有的图标要补齐。
- **改动**（只动 `src/components/create_post.vue`）：
  - 顶部工具栏**最左端**新增「📚 参考文献」按钮，点击展开 / 收起引用面板；
    原按钮从右侧 extras 组移出，配套 CSS 选择器由 `.editor-toolbar-extras .citation-panel-toggle-btn`
    改为 `.citation-panel-toggle-btn`（并加 `margin-left`、`flex-shrink: 0`）。
  - 左侧引用面板**默认收起**：`citationPanelCollapsed` 初值 `false → true`。
    面板本身本来就是 `position: fixed` 浮层（`left: 20px; top: 140px`，在工具栏下方），
    不占编辑器宽度，所以"并进工具栏"的实际效果是：不再一进页面就杵在左边，改为按需展开。
  - 删除「＋ 生物卡片」「＋ 自定义卡片」两个按钮及其 CSS（`.insert-card-actions` / `.insert-card-btn`），
    **`insertCardIntoEditor` 等函数一行未动** —— 卡片入口保留在浮动工具栏的 ▦。
  - 右侧 extras 补齐 `▦ 卡片` / `🌳 进化树` / `M↓ Markdown` 三个图标按钮，与浮动工具栏对齐，
    行为复用 `openInsertToolSection('sidebar' | 'tree' | 'markdown')`；新增 `.toolbar-icon-btn`
    与 `.toolbar-extras-divider` 两个样式类。
- **未同步**：`src/components/UiPdfDocumentEditor.vue` 里有结构几乎相同的工具栏与引用面板，
  这次没动（用户只提了创建页）。

#### 草稿箱：一键清空本地草稿

- **诉求**：编辑器会把「文章内容为 null」「树内容为 null」这类空壳也落成一条本地草稿，
  久了草稿箱里堆一片没用的条目；原先只能一条条删。
- **改法**：`src/services/drafts.js` 新增 `clearDrafts({ ownerKeys })` —— 先只读取出全部草稿，
  再在**一个读写事务**里批量 `delete`。**只删命中归属的条目**：同一浏览器里其他账号的草稿
  不受影响；只有 `ownerKeys` 传空数组时才是清空整库。
  （不做「读一条删一条」的跨 `await` 写法，避免事务中途提交。）
- **入口**：草稿箱页面（`/drafts`）标题右侧新增「清空草稿」按钮。执行前 `confirm` 并告知份数，
  执行中禁用并显示「清空中…」，没有草稿时置灰；完成后提示实际清掉的条数。
- **未改**：除草稿箱外的草稿行为一律没动（自动保存策略、单条删除、复制、发布后自动清理）。

#### 代码块案例：空的一侧不再占位

- **现象**：作者只用 `---` 写了一个「输入 → 输出」中的一半时，空的那侧仍会渲染出来，里面写着「（空）」，白白占掉一半宽度。
- **改动**：`src/utils/codeSample.js` 的 `codeSampleHtml` 改为**按内容决定渲染几栏**。
  - 只有输入有内容（含没有分隔符的写法）→ 单栏「输入」。
  - 只有输出有内容（`---` 写在最前面）→ 单栏「输出」，标签、配色都按输出那套走。
  - 两侧都有 → 双栏对照，与之前一致。
  - 两侧都空（只敲了一个 `---`）→ 保留「输入」占位栏，避免卡片只剩标题。（空）占位符只在最后一档才出现。
- **没动**：分隔符解析（`parseCodeSampleText` 返回值保持不变）、CSS（`.life-code-sample-grid.is-single` 早就存在）、清洗白名单、编辑器插入模板（模板两侧都有内容，仍是双栏）。
- **影响入口**：`src/utils/codeSample.js`、`tests/codeSample.test.mjs`（新增 2 个用例，改写 1 个；全量 80 个通过）

---

### 修复

#### 页面上滑后，顶部导航栏被"带走"

- **现象**：`/create-post` 这类内容超过一屏的页面，向下滚动一段后顶部导航栏
  （生命时序 / 专栏 / 生命树…）不见了。
- **根因**：`src/assets/base.css` 的 `body { height: 100vh }` 加上 `src/assets/main.css` 的
  `#app { height: 100% }`，让 `#app` 只有**一屏高**；而 `navBar` 用的是 `position: sticky`，
  sticky 元素只在自己的包含块（`#app`）范围内生效 —— 滚过 `100vh − 64px` 后就被 `#app`
  的底边带走了。实测 1280×800 下滚 900px，导航栏 `top` 从 `0` 变成 `-165`。
- **改了哪里**：`body` 去掉 `height: 100vh`（保留 `min-height: 100vh`）；
  `#app` 的 `height: 100%` 改为 `min-height: 100%`。`#app` 高度随内容增长，sticky 全程有效。
- **验证**：Playwright 实测 `/create-post`（可滚动 1622px）滚 900px 后导航栏 `top` 仍为 `0`。

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
