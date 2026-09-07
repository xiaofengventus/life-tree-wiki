# 可视化 PDF / 长文章排版编辑器 · 新手使用指南

> 版本：v2.0（架构升级）  
> 适用场景：微信公众号文章、学术报告、产品说明书、电子杂志、课程讲义等  
> 技术栈：Vue 3 + Node.js + Playwright + Chromium

---

## 一、快速认识：这是什么？

这不是一个单纯的「PDF 组件库」，而是一套完整的**可视化排版编辑器**。

你可以把它想象成一个「所见即所得的 Word / InDesign 简化版」：

- 在编辑器里直接输入文字、插入图片、拖拽组件
- 调整每一个元素的样式（字体、颜色、间距、边框……）
- 按照「一页一页」的方式编辑，不需要操心自动分页
- 点击「导出」即可生成 PDF，效果和编辑器里看到的**完全一致**

---

## 二、核心概念：五层架构

系统由五层组成，从大到小依次是：

```
Document（文档）
  └── Page（页面）
       └── Layout / Region（布局 / 区域）
            └── Component（组件）
                 └── Style + Content（样式 + 内容）
```

### 2.1 Document（文档）

文档是最大的单位，对应最终导出的一份 PDF 文件。

- 包含多页 Page
- 有自己的元信息（标题、作者、语言……）
- 可以选择一个全局 **Theme（主题）**

### 2.2 Page（页面）

每一页 PDF 就是一个 Page。用户**按页编辑**，不用操心内容溢出自动分页。

页面类型有 8 种：

| 页面类型        | 用途举例                         |
| --------------- | -------------------------------- |
| 首页（Home）    | 文章总览页                       |
| 封面（Cover）   | 带大标题的封面，通常没有页眉页脚 |
| 目录（TOC）     | 自动生成目录页                   |
| 正文（Content） | 最常用，写文字的普通页           |
| 图文页（Media） | 图片为主，文字为辅               |
| 数据页（Data）  | 表格/图表为主                    |
| 引用页（Quote） | 大段引用/鸣谢                    |
| 空白页（Blank） | 占位、插页                       |

每个页面还可以独立设置：

- **尺寸**：A4（默认）、A5、Letter、自定义宽高
- **方向**：纵向（Portrait）、横向（Landscape）
- **边距**：上、下、左、右分别设置
- **背景**：纯色、图片、渐变
- **页眉 / 页脚 / 页码**：是否显示，显示什么内容

### 2.3 Layout / Region（布局 / 区域）

每一页内部可以划分区域，就像报纸的版面一样。内置 7 种布局模板：

| 布局          | 示意            | 适合场景             |
| ------------- | --------------- | -------------------- |
| 单栏          | [ 文字 ]        | 普通文章、小说       |
| 双栏          | [ 文 ] [ 文 ]   | 学术论文、对照说明   |
| 左侧栏 + 主栏 | [目录] [ 正文 ] | 带侧边导航的手册     |
| 主栏 + 右侧栏 | [ 正文 ] [侧栏] | 图文杂志（图在侧栏） |
| 三栏          | [文][文][文]    | 数据对照、产品目录   |
| 全宽          | [ 占满整页 ]    | 封面、大图页         |
| 自定义        | 自由拖拽        | 特殊排版             |

### 2.4 Component（组件）

组件是放到布局某个区域里的「原子元素」。

**所有组件都支持：选中后直接在编辑器里编辑内容、调整样式。**

组件分为 6 大类，共约 30 种：

#### ① 基础组件

| 组件              | 说明           |
| ----------------- | -------------- |
| Text（文本）      | 任意一行纯文字 |
| Heading（标题）   | H1~H6 标题     |
| Image（图片）     | 单张图片       |
| Divider（分割线） | 水平分割线     |
| Spacer（空白）    | 上下留白       |

#### ② 内容组件

| 组件              | 说明                   |
| ----------------- | ---------------------- |
| Paragraph（段落） | 一段 Markdown / 富文本 |
| Quote（引用）     | 块级引用框             |
| List（列表）      | 有序 / 无序列表        |
| Table（表格）     | 数据表格               |
| Code（代码块）    | 带语法高亮的代码       |
| Link（链接）      | 超链接                 |

#### ③ 文章组件

| 组件                       | 说明                           |
| -------------------------- | ------------------------------ |
| ArticleTitle（文章大标题） | 封面或开头用的超大标题         |
| Subtitle（副标题）         | 标题下的小字                   |
| Author（作者）             | 作者署名                       |
| Date（日期）               | 发布日期                       |
| TOC（目录）                | 自动根据标题生成目录           |
| Footnote（脚注）           | 页脚注释                       |
| PageNumber（页码）         | 页码占位符（{page} / {total}） |

#### ④ 信息组件

| 组件              | 说明             |
| ----------------- | ---------------- |
| Callout（提示框） | 通用提示块       |
| Warning（警告）   | 黄色 ⚠️ 警告块   |
| Tip（小贴士）     | 绿色 💡 提示块   |
| Info（信息）      | 蓝色 ℹ️ 信息块   |
| Notice（公告）    | 红色 ❗ 重要公告 |

#### ⑤ 布局组件

| 组件              | 说明                     |
| ----------------- | ------------------------ |
| Container（容器） | 包一组元素，设置统一样式 |
| Columns（多栏）   | 在某个区域内再分栏       |
| Sidebar（侧栏）   | 侧边信息块               |
| Card（卡片）      | 带边框/阴影的卡片        |
| Grid（栅格）      | N×M 网格布局             |

#### ⑥ 图片组件

| 组件              | 说明                     |
| ----------------- | ------------------------ |
| Picture（图片块） | 完整的图片 + 图注 + 版权 |

图片还可以细调：

- **尺寸**：宽度 / 高度
- **裁剪方式**：contain（完整显示）、cover（居中裁切）、crop（手动裁切）
- **圆角**：0 ~ 任意值
- **阴影**：无 / 小 / 中 / 大
- **边框**：类型 / 宽度 / 颜色
- **对齐**：左 / 中 / 右

### 2.5 Style（样式系统）

> **最重要的一条设计原则：组件不直接绑定样式。**

比如「Heading（标题）」组件，它内部不是写死「大标题」「小标题」「红色标题」……

而是：

```
Heading
├── content: "这是一段标题文字"
└── style:
    ├── typography:   { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, textAlign }
    ├── color:        { textColor, backgroundColor, accentColor }
    ├── border:       { type, width, color, borderRadius }
    ├── shadow:       { ... }
    ├── spacing:      { marginTop, marginBottom, paddingLeft, paddingRight, ... }
    ├── shape:        { rectangle / rounded / circle / custom }
    └── position:     { x, y, width, height }
```

这样**一个 Heading 组件可以产生无限种样式**：改 style 里任意字段，就变成了「大标题」「红色左对齐标题」「带边框小标题」……

每一类组件都有一套默认 style；你选中后再覆盖个别字段即可。

---

## 三、Theme（主题）系统

主题让整个文档的样式一键切换，不用逐个组件改。

内置 7 套主题：

| 主题             | 风格                         | 适合                 |
| ---------------- | ---------------------------- | -------------------- |
| 微信公众号       | 大字号、宽行高、清爽白       | 公众号图文搬运       |
| 极简（Minimal）  | 大量留白、细线、衬线/无衬线  | 说明书、公告         |
| 学术（Academic） | 衬线正文、清晰层级、双栏友好 | 论文、研究笔记       |
| 科技（Tech）     | 等宽字体、深色强调、代码高亮 | 技术文档、产品白皮书 |
| 杂志（Magazine） | 现代字距、紧凑标题、图文混排 | 电子杂志             |
| 商务（Business） | 稳重配色、正规排版           | 商务报告、提案       |
| 自定义（Custom） | 全部自己配                   | 个性化               |

一个主题统一定义以下默认值：

```
Theme
├── Primary Color        主色
├── Secondary Color      辅色
├── Font                 正文字体
├── Heading Font         标题字体
├── Body Font            正文字体（同 Font，单独存在方便单独覆盖）
├── H1                   一级标题默认 style
├── H2                   二级标题默认 style
├── H3                   三级标题默认 style
├── Paragraph            段落默认 style
├── Quote                引用块默认 style
├── Table                表格默认 style
├── Sidebar              侧栏默认 style
└── Code                 代码块默认 style
```

切换主题后，**所有没有被单独覆盖 style 的组件都会自动套用新主题**。
如果某个组件你手动改过 style（比如把某段文字改成红色），切换主题时它会保留你的手动修改，不会被覆盖。

---

## 四、Style JSON → CSS 生成器：为什么编辑器和 PDF 效果一致？

这是本系统最关键的设计：**编辑器和 PDF 导出使用同一套 HTML/CSS。**

```
            Component（组件对象）
                 ↓
            Style JSON（样式对象）
                 ↓
         CSS Generator（纯函数，无副作用）
           ↙️            ↘️
    编辑器渲染        Playwright 渲染
   （实时所见）    （Chromium 无头浏览器 → PDF）
```

- 编辑器里看到的，是 Vue 组件把 Style JSON 转成 inline CSS 后渲染出来的。
- 导出 PDF 时，用 **Playwright** 启动一个无头 Chromium，加载完全相同的 HTML+CSS，然后调用 `page.pdf()` 生成 PDF。

因为两边的 HTML/CSS 是同一份，所以**排版、字体、颜色、分页完全一致**。

分页策略：**用户按页编辑，不需要自动分页。**  
每一页是一个固定尺寸（A4 等）的「画布」，内容超出画布时给出警告但不会偷偷移到下一页——用户要自己决定哪里插入新页。

---

## 五、导出格式

| 格式 | 说明                             | 用什么渲染                   |
| ---- | -------------------------------- | ---------------------------- |
| PDF  | 最终成品，A4/自定义尺寸          | Playwright + Chromium        |
| PNG  | 每页一张高清图（300 DPI）        | Playwright + page.screenshot |
| HTML | 独立 HTML 文件，可直接浏览器打开 | 同一套 CSS Generator         |

> 注：Playwright 导出链路是：**Vue 3 页面 → 序列化 HTML → Node.js 脚本 → Playwright(Chromium) → PDF**。

---

## 六、新手 5 步上手

### 第 1 步：创建文档

打开编辑器 → 选择「空白页」或从模板开始。

### 第 2 步：选择主题

顶部工具栏 → 主题下拉 → 选择「学术」或「极简」或「微信公众号」。

### 第 3 步：插入组件

左侧组件面板 → 拖一个「Heading」到页面 → 直接在编辑器里打字改内容。

### 第 4 步：调整样式

选中刚才的标题 → 右侧属性面板出现：

- 字体、字号、粗细
- 颜色、对齐
- 上下左右间距
- 边框、圆角、阴影
  ……随意修改，实时看到效果。

### 第 5 步：导出 PDF

右上角「导出」→ 选择「PDF」→ 等几秒 → 下载文件。  
打开 PDF，确认效果和编辑器里一模一样 ✅

---

## 七、常见问题（FAQ）

**Q1：为什么不让内容自动换页？**  
A：PDF 排版最容易出问题的就是自动分页（一个标题刚好卡在页面底部、表格被切成两半、图片被拆到两页……）。  
我们选择「用户明确按页编辑」的方案，虽然多了一步手动插入分页，但排版 100% 可控，导出不会有惊喜。

**Q2：主题和组件 style 冲突怎么办？**  
A：优先级是：**组件手动 style > 主题默认 style**。  
你对某一个组件单独改过的样式会被保留，没改过的部分会跟随主题切换。

**Q3：可以导出长图 PNG 吗？**  
A：可以。选择「PNG 导出」，会把每一页分别导出为 300 DPI 的 PNG 文件，打包下载。

**Q4：PDF 里中文字体乱码？**  
A：确保系统（或服务器）安装了对应字体（Noto Sans SC / Source Han Sans SC）。导出脚本会把字体作为 web font 嵌入 HTML，Playwright 会正确加载。

**Q5：我想写一个自定义组件，怎么加？**  
A：在 `src/components/ui-pdf/components/` 下新建一个 Vue 文件，遵循「Props: content + style；Emit: update」的约定即可，无需改核心代码。详见「开发者指南」（docs/ui-pdf-developer-guide.md）。

---

## 八、开发目录结构（开发者参考）

```
src/
├── components/
│   ├── UiPdfDocumentEditor.vue       # 主编辑器（旧的 create_post 里的 PDF 模式，未来会独立出来）
│   ├── UiPdfDocumentRenderer.vue     # 页面 + 布局渲染器（编辑器和 PDF 导出公用）
│   ├── UiPdfBlockPreview.vue         # 单个 block 预览（旧版）
│   └── ui-pdf/                       # 新版组件目录
│       ├── UiPdfEditor.vue           # 新版编辑器入口（Page + 属性面板）
│       ├── UiPdfPageCanvas.vue       # 单页画布（固定尺寸，所见即所得）
│       ├── UiPdfComponentPalette.vue # 左侧组件面板
│       ├── UiPdfStylePanel.vue       # 右侧样式属性面板
│       ├── UiPdfThemeSelector.vue    # 主题选择器
│       ├── renderer/
│       │   └── SharedRenderer.vue    # 编辑器 / PDF 共用的渲染组件
│       ├── components/               # 30+ 种组件
│       │   ├── basic/                # Text, Heading, Image, Divider, Spacer
│       │   ├── content/              # Paragraph, Quote, List, Table, Code, Link
│       │   ├── article/              # ArticleTitle, Subtitle, Author, Date, TOC, Footnote, PageNumber
│       │   ├── info/                 # Callout, Warning, Tip, Info, Notice
│       │   ├── layout/               # Container, Columns, Sidebar, Card, Grid
│       │   └── picture/              # Picture（图片增强版）
│       └── composables/
│           ├── useStyleGenerator.js  # Style JSON → CSS String 纯函数
│           ├── useTheme.js           # Theme 系统（预设 + 合并优先级）
│           └── usePageLayout.js      # Page + Layout 管理
├── utils/
│   └── uiPdf.js                      # Document 数据模型 normalize / serialize / parse
└── services/
    └── pdfExport.js                  # 调用 Playwright 的导出服务（Node 端）

scripts/
└── export-pdf.mjs                    # 命令行 PDF 导出脚本（Playwright）
```

---

## 九、导出链路完整流程（开发者参考）

```
用户点击「导出 PDF」
    ↓
前端：把当前 Document 对象序列化为 JSON（含 pages + components + styles）
    ↓
前端：把 JSON POST 到 /api/export-pdf（或本地直接跑脚本）
    ↓
Node.js：
  1. 接收 Document JSON
  2. 启动 Playwright 无头 Chromium
  3. 构造临时 HTML：
     - 引入同一套 CSS Generator 输出的 <style>
     - SharedRenderer 渲染出的 DOM
     - @page { size: A4; margin: 0 } 分页 CSS
  4. page.goto(`data:text/html,...`) 或本地 HTTP 服务
  5. page.waitForLoadState("networkidle")
  6. page.pdf({
       format: "A4",            // 或 document.page.pageSize
       preferCSSPageSize: true, // 关键：用 CSS @page 控制分页
       printBackground: true,
       margin: { top: 0, right: 0, bottom: 0, left: 0 },
     })
  7. 返回 Buffer 给前端，触发下载
    ↓
用户拿到 PDF，效果与编辑器一致
```

---

## 十、与旧版（v1）的主要区别

| 维度                | v1（旧版）                                                                  | v2（新版）                                             |
| ------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------ |
| 数据结构            | Document → Blocks 一维数组                                                  | Document → Pages → Layout/Regions → Components（五层） |
| 样式方式            | 硬编码在 Vue 的 `<style scoped>` 里                                         | 每个组件带 style JSON，统一由 CSS Generator 生成       |
| 主题                | 只有 3 种（academic/minimal/magazine），是 CSS class                        | 7 套预设 + 自定义，主题是可序列化的 JSON 对象          |
| 组件                | paragraph/heading/image/gallery/formula/tree/card/divider/pageBreak（9 种） | 6 大类约 30 种                                         |
| 分页                | 自动分页（靠 `page-break-after`）                                           | 用户按页显式编辑，每页是固定画布                       |
| 导出                | `window.print()` 浏览器打印弹窗                                             | Playwright 无头 Chromium → 静默生成 PDF                |
| 编辑器与 PDF 一致性 | 两套 CSS + 打印样式 class 切换                                              | 同一套 CSS Generator，100% 一致                        |
| create-post.vue     | PDF 模式嵌在里面                                                            | 独立编辑器，不影响 create-post                         |

---

> **提示**：如果在使用中遇到问题，先看「开发者指南 / 架构升级清单」（docs/ui-pdf-developer-guide.md）；若仍无法解决，提 Issue 时附上：Document JSON + 导出的 PDF 截图 + 编辑器截图。
