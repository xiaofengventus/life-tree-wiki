# Life PDF Layout API 1.0

> 状态：草案（Draft）  
> 源文件后缀：建议使用 `.lpdf.md`，纯文本编辑器也能直接阅读  
> 目标：沿用 Markdown 和富文本写作习惯；用少量块级组件描述页眉、页码、侧边目录、文字流和图片版面，最后渲染为 PDF。

本文是解析器和渲染器的对外约定。示例中的组件名、属性名和兼容标记是正式 API，不只是伪代码。

## 设计边界

Life PDF Layout 不是让用户输入任意 x/y 坐标的手工绘图语言。它提供“命名版面槽位 + 可自动流动的富文本内容”：

1. 页面尺寸、出血、安全区、栅格由模板定义。
2. 文字默认进入主内容流，空间不足时继续分页。
3. 图片、进化树、卡片是不可拆分的原子块。
4. 页眉、侧边列表、页码等重复元素绑定到页面模板或章节范围。
5. 源文件仍然是普通 Markdown：没有 PDF 组件时，可以按普通 GFM 文章渲染。

渲染管线推荐分成六步：

```text
读取源码
  -> 提取 YAML 清单
  -> 解析嵌套 PDF 组件树
  -> 每个文本片段走 micromark + GFM + 数学公式 + 安全过滤
  -> 计算分页和图片缩放
  -> 绘制/打印并写入 PDF 元数据
```

实现层可以继续复用项目里的 `markdownToSafeHtml()`。最终写文件可以用浏览器打印引擎，也可以把布局结果交给 `pdf-lib`。注意：`pdf-lib` 负责写出 PDF 结构，不负责高级 HTML 分页排版；文字测量和折行应在布局层完成。

## 兼容基线

无组件包装的正文必须支持：

- CommonMark 段落、标题、引用、链接、图片、行内代码、围栏代码块、水平线。
- GFM 表格、任务列表、删除线和自动链接。
- 行内数学公式 `$E = mc^2$` 与块级公式 `$$...$$`。
- 项目当前的安全规则：只保留白名单标签、HTTPS/站内相对地址、安全的 `color`、`background-color` 和 `font-weight` 行内样式。

因此下面这些写法全部有效：

```markdown
## 样地记录

**目的**：比较三个样地的冠层郁闭度；*天气*、土壤湿度和人为干扰也需要记录。

<span style="color:#B04840">异常值</span>要用
<span style="background-color:#FFF3C4">黄色背景</span>标出后再复核。

~~已废弃的计数~~ 已重新采样。

| 样地 | 郁闭度 | 备注 |
| --- | ---: | --- |
| A1 | 0.72 | 受溪流影响 |
| B2 | 0.58 | 次生林边缘 |

$$NDVI = \frac{NIR - Red}{NIR + Red}$$
```

## 词法规则

### 文档清单

文件最前面的 YAML 前置数据负责全局资源和版面默认值。它不是正文。

```yaml
---
pdf: life-pdf-layout/1
title: 生命时序野外手册
subject: 木本植物物候观测
author: 生命时序项目组
language: zh-CN

page:
  pageSize: A4
  orientation: portrait
  margin: [18mm, 16mm]
  bleed: 0mm
  background: "#FFFFFF"

theme:
  ink: "#202124"
  paper: "#FFFFFF"
  accent: "#33691E"
  rule: "#D8DFD8"
  fontFamily: ["Noto Sans SC", "Source Han Sans SC", sans-serif]
  baseSize: 10.5pt
  lineHeight: 1.68

classificationCards:
  - id: quercus-section
    type: taxonomy
    title: 栎属
    color: "#6D9773"
    placements: [outline]
    rows:
      - rankKey: family
        value: 壳斗科 Fagaceae

treeEmbeds:
  T000123:
    fallbackTitle: 温带木本类群系统发育概览
    render: vector-snapshot
    collapseDepth: 2
---
```

字段约定：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `pdf` | 是 | 规范版本，当前只接受 `life-pdf-layout/1`。 |
| `title` | 是 | 写入 PDF 元数据，也作为封面默认标题。 |
| `page.pageSize` | 否 | `A4`、`A5`、`Letter` 或 `[210mm,297mm]`。 |
| `page.margin` | 否 | 一个数、两个数或四个数，长度单位可为 `mm/cm/in/pt/px`。 |
| `theme.*` | 否 | 全局变量；组件可覆盖。 |
| `classificationCards` | 条件用 | 定义卡片数据，只有正文引用后才会占据正文位置。 |
| `treeEmbeds` | 否 | 给同一棵进化树的多个嵌入位置设置渲染参数。 |

YAML 里的颜色必须是 `#RGB`、`#RRGGBB`、`#RRGGBBAA` 或基础 CSS 命名色。解析器应拒绝任意 URL、表达式和外部样式表。

### 组件容器

块级组件使用三到八个冒号的围栏容器：

```md
::: component-name attribute=value #optional-id.class
配置或子内容
:::
```

嵌套时外层比内层多一个冒号：

```md
:::: pdf-page {template=sidebar-flow}
::: pdf-header
...
:::
::::
```

开栏最后一项若是花括号选择器，可包含 `#id`、`.class` 和布尔属性：

```md
:::: pdf-page {#chapter-2 .review-draft template=sidebar-flow}
...
::::
```

未识别的组件在宽松模式下降级为其内部 Markdown；严格模式必须报错 `LIFE_PDF_UNKNOWN_COMPONENT`。发布用的 PDF 建议使用严格模式。

行内扩展统一先转换成受安全过滤器允许的 HTML：

| 功能 | 输入 | 渲染结果 |
| --- | --- | --- |
| 高亮 | `==必须复核==` | `<span style="background-color:#FFF3C4">…</span>` |
| 下划线 | `<u>补充结论</u>` | `<u>补充结论</u>` |
| 着色 | `<span style="color:#B04840">警告</span>` | 保留安全颜色 |
| 底色 | `<span style="background-color:#F2F7EE">结果</span>` | 保留安全底色 |
| 加粗 | `**加粗**` | 标准 CommonMark |
| 斜体 | `*斜体*` | 标准 CommonMark |
| 删除线 | `~~删除~~` | GFM |

不要引入可执行脚本、远程字体自动下载或任意 CSS 属性。排版器需要保证过滤后的结果与 PDF 结果一致。

## 页面模型

每个页面有五个逻辑区域：

```text
+--------------------------------+---------------------+
| header                         |                     |
+----------------+---------------+     margin /        +
| aside          | main          |     safe area       |
|                |               |                     |
+----------------+---------------+---------------------+
| footer / running elements                            |
+------------------------------------------------------+
```

区域是否显示由模板决定。以下是 1.0 的内置模板：

| 模板 | 用途 |
| --- | --- |
| `flow` | 单栏长文；没有显式页面时也用它自动分页。 |
| `two-column` | 双栏学术摘要或对照说明。 |
| `sidebar-flow` | 左侧窄栏固定组件，右侧主文流动，对应本规范附图。 |
| `cover` | 封面；标题默认占满可视区，不显示页眉页脚。 |
| `gallery` | 图片优先网格，文字最多占底部三分之一。 |
| `grid` | 通过 `regions.grid-template` 自定义命名区域。 |

页面级声明：

```md
:::: pdf-page {#plant-overview template=sidebar-flow}
---
repeatWithFlow: false
pageNumberStart: 2
regions:
  sidebar: 38mm
  main: 1fr
  rowGap: 7mm
  columnGap: 7mm
  padding: 0
---
...
::::
```

`repeatWithFlow` 为 `true` 时，该页的页眉、侧栏外观会作为样板延续到同一个流生成的后续页面；页码和选中态仍由运行时计算。

显式翻页用：

```md
::: pdf-page-break
:::
```

双栏中换栏用：

```md
::: pdf-column-break
:::
```

## 正文与文字组件

不在任何组件里的 Markdown 属于隐式 `pdf-body`。它会跟随上一个可用文字槽位流动。小段落直接这样写即可：

```markdown
# 引言

物候序列回答的不是单个个体“什么时候开花”，而是种群在不同年份如何移动它们的季节窗口。
```

需要控制断句和分页时，使用 `pdf-text`。它的内容仍然是一个完整 Markdown 片段：

```md
::: pdf-text {keep-with-next=true}
---
columns: 2
columnGap: 8mm
justify: true
hyphens: auto
firstLineIndent: 2em
widows: 2
orphans: 2
dropCap: 2
overflow: paginate
---
这是第一栏的开头。布局器不得为了让内容塞进当前页而截断句子；
当剩余高度不足时，应整段移到下一栏或下一页。

这段 observations 表格之后有一个不可拆分的原子块，
渲染前要一起测量高度。
:::
```

关键属性：

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `columns` | `1 \| 2 \| 3` | `1` | 内容栏数，不是页面总栏数。 |
| `overflow` | 枚举 | `paginate` | 只接受 `paginate`、`shrink`、`clip`；不允许横向溢出。 |
| `minHeightBeforeBreak` | 长度 | `24mm` | 当前区域小于该值时不留孤行。 |
| `keepWithNext` | 布尔 | `false` | 与下一个块保持在同一页。 |

固定框不参与自动分页，适合说明图旁的短注释：

```md
::: pdf-text-box {region=main-annotation}
---
height: 42mm
overflow: clip
border: hairline
background: "#F7FAF5"
---
**读图提示**：圆点表示单株首花期；阴影带表示样地整体峰值的四分位距。
:::
```

如果固定框放不下内容，编译期必须发出警告而不是静默裁剪。

## 页眉、侧边列表和页脚

### `pdf-header`

页眉不是手放的绝对坐标；它填充模板的 `header` 槽位。

```md
::: pdf-header
---
logo: assets/logo.png
label: 生命时序
subtitle: 物候观测工作手册
badge: 内部评审稿 v0.8
align: between
style: band
rule: hairline
height: max-content
---
:::
```

| 属性 | 取值 | 说明 |
| --- | --- | --- |
| `label` | 文本 | 左侧主标识。 |
| `subtitle` | 文本 | 主标识后的次要文字。 |
| `logo` | 站内相对路径或资源 ID | 建议预转成 PNG/JPEG；SVG 作为印刷资产需确认无脚本。 |
| `align` | `start/center/end/between` | 横向排布。 |
| `style` | `bare/band/boxed` | 无框、色带或细线框。 |
| `rule` | `none/hairline/solid` | 页眉下方分隔线。 |
| `showOnPage` | `"all"` 或 `"first,even"` 等 | 控制出现页集合。 |

### `pdf-title-block`

只允许出现在 `cover` 模板的 `title` 槽位。它不重复 `document.title`；若省略字段，渲染器使用清单里的对应元数据。

```md
::: pdf-title-block
kicker: FIELD PROTOCOL
title: 北温带木本植物观测速查
subtitle: 从样线选择到发育背景
meta: 修订 v0.8 · 内部评审稿
align: center
:::
```

| 属性 | 说明 |
| --- | --- |
| `kicker` | 标题上方的小标签，通常全大写。 |
| `title` | 封面主标题，支持一行内联富文本。 |
| `subtitle` | 主标题下的短说明。 |
| `meta` | 版本、日期或作者行。 |
| `align` | `start/center/end`。 |
| `media` | 全幅底图资源；PDF 必须压平成位图或矢量背景，不接受视频。 |

标题块高度默认不超过可视区；超过时必须缩小字体层级并报溢出警告。

### `pdf-aside-list`

侧边列表绑定一组编号元素，用 `selectedElement` 表示当前高亮项。属性名接受驼峰、连字符和下划线三种形式，解析后归一化为驼峰。

最小写法：

```md
::: pdf-aside-list
items: [引言, 方法, 样地网络, 物候曲线, 结论]
bind-pages: 1-10
selected-element: 1
:::
```

推荐写法：

```md
::: pdf-aside-list
source: document.sections
selectedElement: methods
selectionMode: chapter
marker: bar
style: vertical-rail
dense: true
maxVisible: 9
mappings:
  - id: introduction
    label: 引言
    symbol: 01
    pages: 1-2
  - id: methods
    label: 方法
    symbol: 02
    pages: 2-5
  - id: sites
    label: 样地网络
    symbol: 03
    pages: 5-7
:::
```

语义如下：

1. `items` 是字面列表；`source` 引用清单中的对象数组，两者只能选一个。
2. 对象的 `id` 用于匹配 `selectedElement`；字符串项则按下标从 1 开始匹配数字。
3. `selectionMode: chapter` 表示所有该章节目标页共享同一高亮；`explicit` 只在使用点那一页高亮。
4. `pages` 是导航语义，用于生成 PDF 书签或交互链接，不等于本项物理上只出现在这些页。
5. 缺失目标在严格模式报 `LIFE_PDF_ASIDE_TARGET_MISSING`；宽松模式隐藏选中态并打印警告。

视觉参数：

| 参数 | 取值 |
| --- | --- |
| `marker` | `bar/dot/ring/number/check` |
| `style` | `vertical-rail/compact-list/outline/timeline` |
| `selectedColor` | 主题颜色或十六进制色 |
| `unselectedColor` | 主题颜色或十六进制色 |
| `wrap` | `true/false`，列表太长时是否换列 |

### `pdf-footer`

页脚承载版本、作者、声明和页码。模板内置页码可以直接配置：

```yaml
page:
  numbering:
    start: 1
    style: decimal
    pattern: "{page} / {total}"
    excludePages: [cover]
```

也可以放在具体页面里：

```md
::: pdf-footer
left: 生命时序 · CC BY 4.0
right: 第 {page} 页，共 {total} 页
center: "{section}"
rule: hairline
show: even
:::
```

可用变量：`{page}`、`{total}`、`{section}`、`{chapter}`、`{docTitle}`、`{revision}`。渲染器必须在知道总页数后二次填充页脚。

## 图片组件

### 单张图片

普通 Markdown 图片始终输出为带说明的 `figure`。这保持与现有文章一致：

```markdown
![海拔 1800 m 的落叶阔叶林样地](/media/site-a1800.jpg)
```

需要控制宽高、页内位置或截断策略时使用组件：

```md
::: pdf-figure {float=right}
src: /media/quercus-canopy.jpg
alt: 栎树冠层在雨后的透光状态
caption: **图 2.1** 冠层透光率在连续降雨后明显下降。
credit: 摄影：李明，CC BY 4.0
width: 52mm
aspectRatio: 4/3
objectFit: contain
overflow: break-before
frame: hairline
:::
```

规则：

1. `alt` 必须存在；它同时是无障碍替代文本和图像缺失时的错误信息。
2. `caption` 支持 Markdown，但不允许块级表格或代码块。
3. `contain` 保证完整显示，`cover` 会中心裁切；成品 PDF 不允许拉伸变形。
4. `overflow` 只能是 `paginate/shrink/break-before/clip`。默认对大图先尝试缩小，仍放不下则放到下一页。
5. 位图分辨率不低于有效输出的 150 DPI，理想值 300 DPI。

### 图片网格

网格基于 12 列虚拟栅格。子项总跨度不能超过所属行的剩余跨度。

```md
:::: pdf-image-grid {gap=6mm rowHeight=28mm}
---
areas:
  - "a a b"
  - "c c b"
responsiveOverflow: repaginate
---
::: pdf-image-cell {area=a}
src: /media/bud.png
alt: 春芽
caption: 新芽展开第 4 天
objectFit: cover
:::

::: pdf-image-cell {area=b}
src: /media/canopy.png
alt: 冠层
caption: 同一样地的冠层序列
spanRows: all
:::

::: pdf-image-cell {area=c}
src: /media/litter.png
alt: 凋落物
caption: 秋季凋落物收集袋
:::
::::
```

不想手写命名区域时，用简单卡片网格：

```md
::: pdf-image-grid {columns=2}
![幼苗 A](/media/a.jpg)
![幼苗 B](/media/b.jpg)
:::
```

网格整体是一个原子块；若预估高度超过剩余空间，整个网格移到下一页。`responsiveOverflow: repaginate` 表示行可以被拆到下一页，但一行内的单元不能拆散。

## 进化树兼容语法

项目已经把“独占一个段落的 `/view-tree/:id` 链接”解析成进化树块。PDF 必须继续支持这条旧语法：

```markdown
[🌳 进化树：温带木本类群概览](/view-tree/T000123)
```

命中条件与现有文章保持一致：

1. 该链接所在的段落不能包含其他可见文字。
2. 链接目标是同站的 `/view-tree/<ID>`；`<ID>` 由字母、数字、下划线和连字符组成。
3. 链接文字就是回退标题；`🌳 进化树：` 前缀可有可无。
4. 若同一段出现装饰词、换行后的说明或其他链接，只视为普通链接，不转换为树。

更明确的 PDF 嵌入可以使用 `pdf-tree`：

```md
::: pdf-tree {render=vector-snapshot}
id: T000123
fallbackTitle: 温带木本类群系统发育概览
mode: read-only
collapseDepth: 2
focusNode: node-quercus
viewport: fit-width
height: 82mm
annotations:
  - nodeId: node-fagus
    label: 壳斗科
    color: "#33691E"
legend: bottom-right
watermark: draft
:::
```

PDF 不运行交互事件。导出时先把树状态拍平成矢量快照或高清位图：

| 参数 | 取值 | 说明 |
| --- | --- | --- |
| `render` | `vector-snapshot/raster-snapshot` | 矢量优先；复杂节点退化成 300 DPI PNG。 |
| `collapseDepth` | 正整数或 `all` | 展开层级冻结到快照。 |
| `focusNode` | 节点 ID | 该节点置于可视中心；找不到时报错。 |
| `nodeLabels` | `always/hover-collapsed/off` | PDF 没有 hover，折叠节点标签会落入图注。 |
| `preserveCitations` | 布尔，默认 `true` | 节点引用变成带链接的文字标注。 |

树导出的文本必须可选择；位图中不允许再叠加未压缩到图层的真实节点名，否则无法检索。

## 卡片兼容语法

卡片数据写在 YAML 清单的 `classificationCards` 中。字段映射现有文章服务端校验：

```yaml
classificationCards:
  - id: quercus-section
    type: taxonomy           # taxonomy 或 custom
    placements: [outline]    # outline：文档轮廓；body：由正文锚点放置
    title: 栎属
    color: "#6D9773"         # 必须 #RRGGBB
    imageHash: media_01h2x   # 媒体库哈希；渲染前解析成 imageUrl
    imageCaption: 成熟叶与壳斗对比图
    rows:
      - rankKey: family      # taxonomy 类型必须映射到共享阶元表
        value: 壳斗科 Fagaceae
      - rankKey: genus
        value: 栎属 Quercus

  - id: sampling-fields
    type: custom
    placements: [outline, body]
    title: 样地采集字段
    color: "#94A187"
    rows:
      - label: 冠层郁闭度
        value: 球冠冠层分析仪，三次重复
      - label: 土壤湿度
        value: 0-20 cm，TDR 探头
```

正文中的锚点是既有标记，不需要新写法：

```markdown
[▦ 卡片：样地采集字段](#post-card-sampling-fields)
```

约束：

1. 锚点必须独占一个段落，格式固定为 `#post-card-<id>`；`<id>` 匹配 `^[A-Za-z0-9_-]{1,80}$`。
2. 同一张卡在一个正文流里最多放置一次。
3. 有正文锚点时自动追加 `body` placement；没有正文锚点的 `outline` 卡片进入文档轮廓区。
4. `taxonomy.rows[].rankKey` 必须能在项目的共享分类阶元表中找到。
5. 服务端上限保持一致：最多 8 张卡，每张最多 60 行，自定义字段名 60 字，行内容 240 字，图片说明 120 字。

PDF 可以给已有卡片附加呈现属性。包装器只是排版上下文，内部仍保留上面的兼容锚点：

```md
::: pdf-card-slot {float=right width=54mm}
[▦ 卡片：栎属](#post-card-quercus-section)
:::
```

`pdf-card-slot` 支持跨页断裂策略：

| 属性 | 取值 |
| --- | --- |
| `breakable` | `true/false`；默认 `true`。设为 `false` 时整体放置或整体后移。 |
| `sticky` | `sidebar/inline/footer-note`；仅 `sidebar-flow` 模板接受 `sidebar`。 |
| `repeatHeader` | 布尔；跨页时是否重复卡片标题条。 |

若被兼容解析器处理后一次产生多个卡片标记，编译失败，错误码为 `LIFE_PDF_CARD_DUPLICATED`。

## 表格、代码、书签和交叉引用

表格沿用 GFM。打印时超过内容宽度的表按以下策略处理：

```yaml
tables:
  wideMode: scale          # scale、rotate、split、footnote
  minFontSize: 7pt
  repeatHeaderRow: true
  zebra: subtle
```

围栏代码块支持现有语言别名。PDF 中的代码禁止横向滚动，超宽时按 `pre-wrap` 折行，并在右下角给出续行标记。

给章节声明稳定 ID：

```md
::: pdf-heading-anchor {id=method}
## 材料与方法
:::
```

然后引用页码：

```markdown
采样设计见 {{ref:method}}。
[返回方法](#method)
```

`{{ref:id}}` 在交互预览里显示“第 n 页”；若目标尚未确定则显示占位符，绝不能留下原始宏作为终稿。

## 错误码

解析器应返回结构化诊断，至少包含源码行列号：

| 错误码 | 含义 |
| --- | --- |
| `LIFE_PDF_SPEC_VERSION` | `pdf` 版本缺失或不支持。 |
| `LIFE_PDF_UNKNOWN_COMPONENT` | 严格模式下遇到未知组件。 |
| `LIFE_PDF_UNCLOSED_CONTAINER` | 开闭冒号数量不配对。 |
| `LIFE_PDF_REGION_CONFLICT` | 多个组件抢占同一个唯一槽位。 |
| `LIFE_PDF_MEDIA_NOT_FOUND` | 图片、Logo 或卡片图哈希无法解析。 |
| `LIFE_PDF_TREE_MISSING` | 进化树 ID 不能加载。 |
| `LIFE_PDF_CARD_MISSING` | 锚点引用了不存在的卡片。 |
| `LIFE_PDF_CARD_DUPLICATED` | 同一卡片被正文放置多次。 |
| `LIFE_PDF_OVERFLOW_FIXED_BOX` | 固定文本框溢出。 |
| `LIFE_PDF_REF_TARGET_MISSING` | 交叉引用或侧栏选中项不存在。 |

严重错误不应产出 PDF；警告允许产出但要把结果写入构建日志。

## 完整示例

下面的文件演示左栏目录、右侧文字流、图片拼版、进化和卡片兼容语法。

`````markdown
---
pdf: life-pdf-layout/1
title: 北温带木本植物观测速查
subject: 物候样线与系统发育背景
author: 生命时序项目组
language: zh-CN

page:
  pageSize: A4
  orientation: portrait
  margin: [17mm, 15mm]
  numbering:
    start: 1
    pattern: "{page} / {total}"
    excludePages: [cover]

theme:
  ink: "#22302A"
  accent: "#33691E"
  rule: "#D9E2DA"
  fontFamily: ["Noto Sans SC", sans-serif]
  baseSize: 10.5pt
  lineHeight: 1.62

classificationCards:
  - id: quercus-summary
    type: taxonomy
    title: 栎属速查
    color: "#6D9773"
    placements: [outline, body]
    rows:
      - rankKey: family
        value: 壳斗科 Fagaceae
      - rankKey: genus
        value: 栎属 Quercus

  - id: field-kit
    type: custom
    title: 最小装备
    color: "#94A187"
    placements: [body]
    rows:
      - label: 记录
        value: 离线表单、备用铅笔
      - label: 测量
        value: 冠层仪、30 m 卷尺

treeEmbeds:
  T000123:
    fallbackTitle: 北温带木本类群关系概览
    render: vector-snapshot
    collapseDepth: 2
---

:::: pdf-page {#cover template=cover}
::: pdf-title-block
kicker: FIELD PROTOCOL
title: 北温带木本植物观测速查
subtitle: 从样线选择到发育背景
meta: 修订 v0.8 · 内部评审稿
align: center
:::
::::

:::: pdf-page {#overview template=sidebar-flow repeatWithFlow=true}
::: pdf-header
logo: assets/logo.png
label: 生命时序
subtitle: Field Protocol
badge: Draft v0.8
align: between
style: band
rule: hairline
:::

::: pdf-aside-list
items: [引言, 样线, 系统发育背景, 采样字段, 结论]
bind-pages: 1-8
selected-element: 1
marker: bar
style: vertical-rail
dense: true
maxVisible: 8
:::

::: pdf-text
---
justify: true
---
# 引言 {.reading-intro}

本手册覆盖北温带常见木本类群的物候观察。**样线选择**先看地形梯度，
再看管理历史；两者共同决定开花窗口能否进行比较。

观察者记录的是单株事件，也记录样地比例。*这两层数据不能混在同一个汇总粒度里*。

$$GDD = \sum_{i=1}^{n}\max(0, T_i - 5^\circ C)$$

积温只用来说明趋势，不做单因子解释。
:::
::::

:::: pdf-page {#sites template=sidebar-flow}
::: pdf-header
label: 生命时序
subtitle: Sites & Canopy
align: between
style: band
rule: hairline
:::

::: pdf-aside-list
items: [引言, 样线, 系统发育背景, 采样字段, 结论]
bind-pages: 1-8
selected-element: 2
:::

::: pdf-text
# 样线

三条主样线的海拔间隔约 250 m。每条样线布设 20 个固定点；
相邻最近个体距离不足 3 m 时合并为一个聚群记录。

![海拔 1800 m 的落叶阔叶林样地](/media/site-a1800.jpg)
:::

:::: pdf-image-grid {gap=5mm rowHeight=26mm}
---
areas:
  - "bud bud canopy"
  - "soil soil canopy"
---
::: pdf-image-cell {area=bud}
src: /media/buds-series.jpg
alt: 连续五天的春芽展开序列
caption: 图 1 春芽展开序列
objectFit: cover
:::

::: pdf-image-cell {area=canopy}
src: /media/canopy-sequence.jpg
alt: 冠层季相变化
caption: 图 2 冠层季相
spanRows: all
:::

::: pdf-image-cell {area=soil}
src: /media/soil-probe.jpg
alt: 土壤湿度探头
caption: 图 3 0-20 cm 土壤湿度探头
:::
::::
::::

:::: pdf-page {#phylogeny template=sidebar-flow}
::: pdf-aside-list
items: [引言, 样线, 系统发育背景, 采样字段, 结论]
bind-pages: 1-8
selected-element: 3
:::

::: pdf-text
# 系统发育背景

以下树快照冻结两级展开，便于印刷检索；完整交互版放在线上文章中。
:::

[🌳 进化树：北温带木本类群关系概览](/view-tree/T000123)

[▦ 卡片：栎属速查](#post-card-quercus-summary)

::: pdf-text-box {region=main-annotation}
---
height: 34mm
overflow: clip
---
**读图提示**：壳斗特征在这里只作快速定位，不作属下组的诊断依据。
:::
::::

:::: pdf-page {#fields template=sidebar-flow}
::: pdf-aside-list
items: [引言, 样线, 系统发育背景, 采样字段, 结论]
bind-pages: 1-8
selected-element: 4
:::

::: pdf-text
# 采样字段

核心字段必须在离开样地前完成第一次复核。==数值型缺失值==要在原因列写明。
:::

::: pdf-card-slot {float=right width=58mm breakable=false}
[▦ 卡片：最小装备](#post-card-field-kit)
:::
::::
`````

这份源文件应该编译成五页左右的小册子。封面不计入正文页码；其余页共享左侧栏样式；图片块整体移动，不被行缝撕开。

## 实现顺序建议

1. 先写一个 AST：`Document / Page / Slot / Block / InlineRichText`。
2. 给官方示例建立 golden test，锁定解析结果而不是锁死打印像素。
3. 复用 `markdownToSafeHtml()` 生成预览 DOM，用来做高度测量和分页。
4. 先做“打印样式 + 浏览器另存 PDF”路径，验证排版质量。
5. 再把分页后的绘制命令接入 `pdf-lib`，用于确定性批量导出和元数据控制。
6. 最后补齐诊断、无障碍检查和大图告警。
