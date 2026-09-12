# 分形漫游树（OneZoom 式）设计方案 · 双版本

> 状态：**方案，未实现**。本文只描述形态与细节，代码一行未动。
> 参照物：[OneZoom Tree of Life Explorer](https://www.onezoom.org)（onezoom.org）。它的核心是
> 「分形布局 + 深度缩放」：整棵树按几何规则一次性算出坐标，浏览器只改一个 `transform` 就能
> 无限缩放，不需要重新布局，也不需要下载切片图。

## 0. 两个版本

| | **版本 A · DOM 版**（第 1–10 节） | **版本 B · 3D 版**（第 11 节） |
|---|---|---|
| 交互 | 缩放进出、飞入、折叠展开 | 同上，**外加绕树旋转** |
| 场景 | 伪 3D（CSS `perspective` + 分层视差） | 真 3D（three.js：真光照、真海面、真阴影） |
| 渲染 | 纯 DOM，**不含 `<svg>` / `<canvas>`** | 允许 canvas / WebGL |
| 定位 | 默认视图，也是降级目标 | 想"转一圈看结构"时切过去 |

两版**共用**同一份 `document_json`、同一套"按叶子数加权"的分配规则、同一套交互语义
（单击飞入 / 手柄折叠 / 面包屑 / 内容卡片）、同一个页面入口 —— 只是布局输出的维度和渲染器不同。
所以先做版本 A 把数据、算法、交互都验证掉，版本 B 主要是换渲染层。

---

## 1. 目标形态

参考图给定的四个视觉图元，全部用 **HTML DOM 元素** 绘制（不用 canvas，不用 SVG）：

| 图元 | 外观 | 含义 |
|---|---|---|
| 地面 | 蓝色交叉线（X 形） | 树的起点，画面底部 |
| 树 | 竖直细线 | 主干，从地面长出来的那段 |
| 图片 and 节点 | 空心大圆环 | 有配图的节点 |
| 没有图片，纯节点 | 空心小圆环 | 无配图的节点 |

枝干是**斜线**（从父节点射向子节点），这个斜线在实现上就是一个 `width=枝长; height=1px` 的
`div` 旋转而成 —— 与参考图里红色斜线的画法完全一致。

与现有两种渲染器的关系：

| 渲染器 | 文件 | 布局 | 技术 | 定位 |
|---|---|---|---|---|
| 分类树（现状主力） | `LifeTreeDom.vue` | 正交（横竖枝） | DOM | 像读维基百科那样**扫读全树** |
| 艺术树 | `ArtTreeVisualization.vue` | 植物/晶体/谱系 | **SVG** | 好看的静态**作品封面** |
| **分形漫游树（新增）** | `FractalTreeDom.vue` | 扇形分形 | **DOM** | 像地图一样**缩放进出、逐步展开** |

**不替换任何一个**，它是 `/life-tree/:id` 页面上的第二种显示方式（「分类树 / 分形树」切换）。
理由：任务分工不同 —— 分类树一眼看全、适合查；分形树沉浸、适合逛。两者共用同一份数据、
同一套节点内容卡片。

---

## 2. 视觉图元规范（DOM + CSS 实现细节）

### 2.1 枝（斜线）

关键是**把每条枝当成一个独立的绝对定位矩形**，左端锚在父节点上，旋转指向子节点。
注意定位用的是 transform 而不是 `left / top / width`（原因见 5.2：折叠重排与缩放都要能吃到 transition）：

```html
<div class="ft-branch" style="transform: translate(120px, 300px) rotate(-37.2deg) scaleX(96.4);"></div>
```

```css
.ft-branch {
  position: absolute;
  left: 0;
  top: 0;
  width: 1px;                  /* 基础长度，实际长度由 scaleX 拉伸 */
  height: 1px;                 /* 线宽 */
  background: #c0392b;         /* 参考图的红 */
  transform-origin: 0 50%;     /* 以左端为轴心旋转 */
  will-change: transform;
  transition: transform 260ms ease;
}
```

枝长、角度由布局函数算好，渲染层只负责贴样式 —— 渲染层**零计算**。

### 2.2 节点（圆环）

```html
<!-- 纯节点：小圆环 -->
<div class="ft-node is-plain" style="transform: translate(240px, 180px) translate(-50%, -50%);"></div>
<!-- 图片节点：大圆环 + 圆形裁图 -->
<div class="ft-node has-image" style="transform: translate(240px, 180px) translate(-50%, -50%);">
  <img class="ft-node-image" src="..." loading="lazy" alt="" />
</div>
```

```css
.ft-node {
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 50%;
  border: 1px solid #c0392b;
  background: #fff;
  box-sizing: border-box;
  transition: transform 260ms ease;   /* 折叠重排时跟着枝一起平滑移动 */
}
.ft-node.is-plain      { width: 9px;  height: 9px; }
.ft-node.has-image     { width: 46px; height: 46px; overflow: hidden; border-width: 2px; }
.ft-node-image         { width: 100%; height: 100%; object-fit: cover; }
```

注意位置写在 `transform` 里（`translate(x, y)` 定位 + `translate(-50%, -50%)` 自身居中），
不用 `left / top` —— 这样折叠重排时节点能和枝一起走同一条 transition，不会一个动一个跳。

图片是**圆形裁剪**（`border-radius` + `overflow: hidden`），横向图会裁掉两侧 —— 这是圆形节点的
固有代价，换取的是参考图那种「一圈节点串成枝干」的整体感。

### 2.3 地面

参考图里「地面」是三条交叉的蓝线（一个 X 加一条正中竖线）。用**同一个枝图元**实现，只是颜色不同：

```html
<div class="ft-ground">
  <div class="ft-ground-line" style="transform: rotate(-33deg);"></div>
  <div class="ft-ground-line" style="transform: rotate(33deg);"></div>
  <div class="ft-ground-line is-stem"></div>   <!-- 竖线：主干从地面长出来 -->
</div>
```

**地面线不参与布局计算**，是装饰元素：它只跟着视口一起缩放平移，位置固定在根节点下方。
它是**符号**（标记"根从这里长出来"），与 2.4 的场景层是两回事：符号始终可见，场景会随缩放淡出。

### 2.4 场景层（伪 3D 氛围）

要的是"像 Blender 搭了个场景"的感觉：脚下是地，四周是海，头顶是天，还有鸟飞过。
技术底座是 **CSS 3D transform（`perspective` + `rotateX`）**，**不是 WebGL**：
树本身仍然是一张"立起来的画"，场景就是围着它的几层平面和一些配角元素。

| 层 | 元素 | 手法 |
|---|---|---|
| L0 天空 | 1 个铺满的层 | `linear-gradient` 黄昏渐变；夜里叠星星（若干 1-2px 圆点 `div`，`opacity` 缓慢闪烁） |
| L1 日 / 月 | 1 个圆 | `border-radius: 50%`；柔光用**多层同心半透明圆**，不用 `filter: blur`（贵） |
| L2 云 | 4–8 团 | 若干 `border-radius: 50%` 的白色椭圆叠成团，横向缓慢漂移 |
| L3 远景山脊 | 2–3 条长带 | `clip-path: polygon(...)` 折线剪影，颜色偏灰蓝（大气透视） |
| L4 海洋 | 1 个大平面 | `transform: rotateX(74deg)` 铺开；波纹用重复线性渐变 + `background-position` 缓慢平移 |
| L4.5 海面反光 | 1 条带 | 海平线处的半透明白色渐变，模拟波光 |
| L5 岛 / 地面 | 1 个不规则平面 | 树脚所在，略高于海面；树的落影画在这一层 |
| L6 树 | 现有的枝 + 节点 + 地面符号 | 不变，见第 2.1–2.3 |
| L7 前景 | 3–5 只鸟 + 飘落叶片 | 见下 |

**鸟怎么用 DOM 画**：一个 `div` 就是一只鸟 —— 两片翅膀用
`border-radius: 50% 50% 0 0 / 100% 100% 0 0` 做成弧形，扇翅是 `rotate` + `scaleY` 的关键帧动画；
飞行路径用 CSS `offset-path`（运动路径），整只鸟只动 `transform` 与 `opacity`。
叶片是 8px 的小椭圆，同样用关键帧飘落。

**这些层是固定数量的 DOM（总共约 20–30 个），与树有多少节点无关。**

### 2.5 纵深感从哪来

1. **视差**：场景各层吃一个比树更小的位移系数 —— 天空 `0.03`、云 `0.1`、海 `0.6`、前景 `1.3`。
   拖拽平移时，层次感立刻就出来了。
2. **大气透视**：枝的颜色按**节点深度**从近处的实色过渡到远处的灰蓝（往地平线色靠）。
   成本极低（布局函数顺手算一个颜色），但这是最像 3D 的一招。
3. **落影**：用同一套枝坐标乘一个 `scaleY(0.25) rotate(...)` 压扁旋转矩阵再画一遍，
   `opacity: 0.12` —— 树就有了"站在地上"的重量。

### 2.6 镜头与缩放的关系（这里有个坑）

本方案的"缩放"不是把摄像机推近，而是**把树的某个局部放大**。场景层如果直接跟着 `scale` 走，
放大 10 倍后海面就跑到天上去了。处理办法：

- 场景由**虚拟镜头距离**驱动，而不是直接吃 `scale`：`sceneShift = f(log(scale))`。
- 设一个阈值 `SCENE_FADE_SCALE`（初值 4×）：**超过它就线性淡出天空与海洋**，把画面让给树。
- 这既是性能优化，也是叙事设计：一开始是「海天之间的一棵树」，缩进去就是「走进枝条里」，
  场景自然退场；顺带避免了伪 3D 在极限缩放下的穿帮。
- 超过阈值后把场景层 `display: none` 掉（不只是 `opacity: 0`），彻底释放渲染成本。

**能做的"3D"与做不到的**：

| 能做到 | 怎么做 |
|---|---|
| 场景纵深、视差、海面、天空、鸟 | 上面这套 CSS 3D 分层 |
| 轻微视角摆动（像手微微晃一下相机） | 鼠标位置映射到场景 `rotateY ±6°` / `rotateX ±3°`（`perspective` 挂在舞台元素上） |
| 日夜循环（天空与海面配色随时间变化） | 换一组 CSS 变量 + 关键帧，后置可选 |
| **绕树转一圈看背面** | **做不到**，需要真正的 3D 引擎（three.js / WebGL），与"全是 DOM 元素"冲突 |

性能红线：场景层元素固定 ≤ 30 个；所有动画只用 CSS 关键帧（只动 `transform` / `opacity`）；
`prefers-reduced-motion` 下停掉鸟、波纹与星星闪烁。

---

## 3. 布局算法（`src/utils/fractalTreeLayout.js`，纯函数）

与 `lifeTreeLayout.js` / `artTreeLayout.js` 同构：**输入 document，输出一堆数值坐标，不含任何 DOM**。
所以它可以被 `node --test` 直接覆盖，不需要浏览器。

### 3.1 两条核心规则

**规则一：角度按"叶子数"分配，不是按子节点个数平均分。**

这是 OneZoom 的关键，也是现有 `artTreeLayout.js` 的 `assignAngularSpan` 与它的差别所在 ——
现有实现是 `step = span / children.length`（每个子节点平分角度）。分形树必须改成：

```
span(child) = span(parent) × leafCount(child) / leafCount(parent)
```

否则一个「下面有 300 个物种的分支」和一个「只有 1 个物种的分支」会拿到一样宽的角度，
缩进去看就全变形了。

**规则二：半径按深度单调递增，且能容纳该层最挤的地方。**

```
r(depth) = R0 + Σ step(k)     k = 1..depth
step(k)  = max(MIN_STEP, 该层节点数 × NODE_ARC / (2π) × 角度占比)
```

极坐标转直角坐标：`x = cx + r·cos(θ)`，`y = cy + r·sin(θ)`。

**扇形向上**：参考图里树是从地面**向上**散开的扇形，所以根的角度范围默认取 `[-170°, -10°]`
（数学坐标系里 -90° 是正上方，往两侧张开），而不是整圆。留出 `sweep` 参数可配置，
将来想做「全圆辐射」只要改一个数。

### 3.2 输出结构

```js
{
  nodes: [{
    id, uid, path,
    x, y,                 // 圆心坐标
    depth,
    angle,                // 弧度，供调试与飞入计算
    angleSpan,            // 该节点占据的角度区间 [from, to]，点击飞入要用
    hasImage, imageUrl,
    isLeaf,
    label,                // 已切好段的「中文 拉丁名」
    contentLinks, citationNumbers,
  }],
  branches: [{
    id, x, y,             // 起点（父节点圆心）
    length,               // 枝长（px）
    angleDeg,             // 旋转角
    depth, width,         // 线宽随深度细一点
  }],
  ground: { x, y, width },// 地面装饰的位置
  width, height,          // 世界坐标尺寸
  truncated,              // 是否因为超限被截断
}
```

### 3.3 上限

沿用现有约定：节点超过 `FRACTAL_NODE_LIMIT = 600` 时按深度优先截断，`truncated = true`，
页面提示「本树过大，只展开前 N 个节点」。现有 `ART_TREE_NODE_LIMIT` 是 420，分形树可以略高，
因为渲染层有 LOD（见第 6 节）。

---

## 4. 交互（缩放是本方案的灵魂）

### 4.1 单一真相：一个 transform

整个舞台只有一份视口状态：

```
viewport = { scale, tx, ty }
```

渲染成 `stage.style.transform = translate(tx, ty) scale(scale)`，**所有子元素零改动**。
缩放平移都不触发重排（reflow），这是 DOM 方案能跑满帧的前提。

### 4.2 以指针为锚点缩放

```
// 让 (px, py) 这个屏幕点下面的世界坐标保持不动
tx' = px - (px - tx) × (s' / s)
ty' = py - (py - ty) × (s' / s)
```

滚轮、双指捏合（`touch-action: none` + PointerEvent 自实现）走同一套。

### 4.3 点击飞入

点一个节点 → 把这棵子树的角度区间铺满视口：

```
targetScale = (视口角度跨度) / (node.angleSpan)
```

用 `requestAnimationFrame` 缓动（easeInOutCubic，约 600ms）插值 `viewport`。
**过程中不做任何布局计算**，只改 transform —— 这是"飞入"能顺滑的原因。

### 4.4 导航

- 面包屑：`地面 / 根 / … / 当前节点`，点任意一级飞回去
- 双击空白：回到全局视角
- 键盘：`+` `-` 缩放，`0` 复位，方向键平移，`Esc` 退回父节点
- 深度提示：右下角显示「当前：某某节点 · 含 N 个节点」

### 4.5 点击的语义分工（避免和"打开文章"打架）

| 操作 | 行为 |
|---|---|
| 单击节点 | 飞入展开这棵子树 |
| 单击节点名（标签） | 打开该节点的内容卡片（复用 `NodeContentReader`） |
| 有图片节点在放大到一定程度后单击 | 先飞入；标签出现后可点名字看内容 |

与 `LifeTreeDom.vue` 一致：通过 `emit("content-links")` 把内容交给页面，
由 `LifeTree.vue` 挂载阅读器侧栏 —— **不新写一套阅读器**。

---

## 5. 收起 / 展开

先分清两件事，它们经常被混为一谈：

- **视角的进出** —— 点节点飞入、`Esc` / 面包屑退回。树的结构没变，只是看得更近。已在 4.3 / 4.4 覆盖。
- **结构的收起 / 展开** —— 某个节点底下的整棵子树不再画出来，省下的角度自动分给兄弟。本节说的是这个。

### 5.1 算法上几乎是免费的

因为角度是按叶子数分配的（3.1 规则一），折叠一个节点等价于**把它当成叶子**：

```
leafCount(node) = collapsed ? 1 : (是叶子 ? 1 : Σ leafCount(子节点))
布局遍历：if (collapsed) 不再进入 children
```

角度会按新权重自动重新分给兄弟，半径也顺势回收。布局函数只多一个入参
`collapsedIds: Set<string>`，**不需要任何额外分支逻辑** —— 这是「按叶子数加权」
这条规则的额外红利。

重排的波及范围只有「被折叠节点 → 根」这条路径及其兄弟子树。可见节点 ≤ 600 时，一次重排是毫秒级。

### 5.2 渲染层要补的东西

- **折叠标记**：折叠节点要知道自己"藏了多少"，布局函数顺带给 `childCount`。视觉上在圆环里加一个实心点或一段小扇面（参考图那种圆环正好塞得下），暗示里面还有东西。
- **枝改成 transform 定位**（重要的一处调整）：
  原来计划写 `left / top / width + rotate`，改为
  `transform: translate(x, y) rotate(θ) scaleX(L)`，元素本身固定成 1px 的基础线。
  这样「折叠重排」和「缩放」两类变化**都只改 transform** → 可以吃到 CSS transition，
  也能稳定待在合成层。
  已知代价：线宽会跟着父级缩放一起变粗（放大镜效果）。首期接受；将来如果要恒定线宽，
  在舞台元素上挂一个 `--inv-scale` 变量，枝用 `calc(1px * var(--inv-scale))` 抵消即可。

### 5.3 交互映射（必须避开"飞入"）

单击节点已经是飞入，折叠得换一个手势。三个候选：

| 方案 | 单击 | 折叠 / 展开 | 取舍 |
|---|---|---|---|
| **A（推荐）** | 飞入 | 点节点旁出现的小手柄（有子节点、且放大到一定层级才显示） | 两个动作完全分开，和文件树的习惯一致；缺点是手柄在小尺寸节点上不好点 |
| B | 折叠 / 展开 | 双击飞入 | 手势最省，但双击在触屏上不可靠 |
| C | 飞入 | 双击节点 | 触屏不友好，还容易和「双击空白复位」混 |

无论选哪个，都建议再加上：键盘 `Space`（对当前选中节点折叠 / 展开）、`Shift + 点击`（连同子节点一起收）、
面板上的「全部收起 / 全部展开」两个按钮。

### 5.4 状态与持久化

- 折叠状态就是一个 `Set<nodeId>`，**作为布局函数的入参**而不是缓存在布局内部 ——
  所以撤销 / 重做只是换一个 Set 而已。
- 偏好记忆：按树 id 存一份到 `localStorage`，下次进来保持上次的收起状态。
- 可选分享：`?collapsed=uid1,uid2`；条目超过 20 个就不写进 URL，避免链接过长。

### 5.5 动画怎么做才不掉帧

折叠 / 展开本质是「重排 + 一大片位置变化」，可以做过渡，但要点在于**让它变成一帧的样式变更**：

- 枝：`transition: transform 260ms ease` → 平滑张开 / 收缩
- 节点圆：位置同样走 transform，用同一条 `260ms ease` 同步移动
- 被折叠的子树：先 `opacity: 0` 淡出（约 120ms）再重排；展开时顺序相反
- 全程**不逐帧计算**，只触发一次 transition —— 帧率有保障
- 尊重 `prefers-reduced-motion`：该媒体查询下关掉过渡，直接切换

---

## 6. 层级细节（LOD）与性能预算

DOM 方案唯一的风险就是元素数量，所以必须有 LOD：

1. **只渲染看得见的那几层**。`visibleDepth` 由 `scale` 决定：初始只画到第 3 层，
   每放大一档多展开一层。更深的子树用一根**代表枝**收尾（末端一个稍大的半透明圆，暗示「里面还有」）。
2. **标签按需出现**。缩放超过阈值才切 class 淡入，不逐帧改样式。
3. **图片按需挂载**。`scale` 不到阈值时节点就是空圆环，到了才插 `<img loading="lazy">`，
   并用 `IntersectionObserver` 只加载视口内的。
4. **元素预算**：`枝 + 节点 + 标签 ≤ 1200`，超过就降 LOD 而不是硬渲。

60fps 的依据：全部动画只改一个 `transform`（合成层），布局坐标一次性算完且缓存。

---

## 7. 接入点（改动范围）

| 文件 | 动作 |
|---|---|
| `src/utils/fractalTreeLayout.js` | **新增**：版本 A 的 2D 纯布局函数 + 参数常量 |
| `src/utils/fractalTreeShared.js` | **新增**：两版共用的纯函数（折叠判定、飞入目标、面包屑路径），避免行为漂移 |
| `src/components/FractalTreeDom.vue` | **新增**：纯 DOM 渲染器（枝/节点/地面/标签） |
| `src/components/FractalTreeViewer.vue` | **新增**：视口与交互外壳（缩放、飞入、面包屑、LOD） |
| `src/utils/fractalTreeSpace.js` | **新增**（版本 B）：3D 球面布局纯函数 |
| `src/components/FractalTree3D.vue` | **新增**（版本 B）：three 场景与树，动态引入、不进首屏包 |
| `src/views/LifeTree.vue` | 加「分类树 / 分形树（2D） / 分形树（3D）」三段切换；分形模式下隐藏原有的滚动容器与 `zoom` 控件 |
| `src/router/index.js` | 不加新路由；深链走查询参数 `?view=fractal\|space&node=:uid` |
| `tests/fractalTreeLayout.test.mjs` | **新增**：2D 布局纯函数单测 |
| `tests/fractalTreeSpace.test.mjs` | **新增**（版本 B）：3D 球面布局单测 |
| `package.json` | 版本 B 需要新增依赖 `three`（**仅动态引入**） |

**不动的部分**：数据库、`server/*`、`functions/api/*`、清洗逻辑、`LifeTreeDom.vue`、
`ArtTreeVisualization.vue`、`NodeContentReader.vue`。数据源仍是 `document_json`
（`data.text` / `data.image` / `data.contentLinks` / `data.citationNumbers`），
图片地址规则沿用 `lifeTreeLayout.js` 里 `nodeImage()` 的既有约定。

---

## 8. 分期实施（每期独立可验收）

- **P0** 布局函数 + 单测。产出：能算出一棵 100 节点树的所有坐标，测试通过。
- **P1** 静态渲染。地面 + 主干 + 斜枝 + 圆环节点，无任何交互。产出：截图对得上参考图。
- **P2** 视口交互。滚轮/拖拽/双指 + 指针锚定缩放 + 键盘。
- **P3** 点击飞入 + 面包屑 + 返回。
- **P4** 收起 / 展开。折叠状态入参、折叠标记、枝的 transform 化与过渡动画。
- **P5** 图片节点 + LOD + 标签淡入 + 性能压测（600 节点）。
- **P6** 接入 `LifeTree.vue`（切换按钮 + 深链 + 搜索高亮节点自动飞入）+ 内容卡片联动。
- **P7** 场景层（伪 3D 氛围）：天空 / 海面 / 岛 / 鸟 / 视差 / 大气透视 / 落影 / 缩放淡出。
  放在最后做，因为它是"氛围"，不承载信息 —— 树本身不好看的时候，加场景只是给难看的东西打光。

> 版本 B（3D 版）的分期独立编号 Q0–Q4，见第 17 节。建议 A 做完再开 B。

---

## 9. 风险与取舍

| 风险 | 处理 |
|---|---|
| DOM 元素太多导致掉帧 | 全部走 transform；坐标一次算好缓存；LOD 限流到 ≤1200 元素 |
| 深度极深但很"窄"的树（某分支 30 层只有 1 个后代） | 半径按深度分配（不按角度），配「点击飞入」补偿；必要时对单链做视觉压缩 |
| 折叠后兄弟变宽导致的跳变 | 枝与节点统一走 transform + `transition`，一次样式变更完成重排；`prefers-reduced-motion` 下直接切换 |
| 圆形裁图会切掉横图的左右 | 接受（换整体感）；悬停时给节点放大 + 显示完整缩略图的 tooltip |
| 移动端手势 | PointerEvent 自实现，`touch-action: none`，不做 pinch 兼容 hack |
| 与 OneZoom 的差距 | 明确不做百万节点级的数据编码/瓦片/异步 API；目标是**单棵树（≤600 节点）的沉浸浏览** |

---

## 10. 验收标准（版本 A · DOM 版）

1. 渲染产物里**不含** `<svg>` / `<canvas>`（可用 Playwright 断言）——这是"都是 DOM 元素"的硬指标。
2. 600 节点的树，拖拽与缩放稳定 ≥ 50fps；飞入任意叶节点 ≤ 1s 且不卡顿。
3. 布局单测：子节点角度区间之和 = 父节点区间；角度按叶子数加权；半径随深度单调递增；
   超限时按深度优先截断且 `truncated = true`；**折叠某节点后它被当作叶子，兄弟角度按新权重重分**。
4. 窄屏 375px 可用；最深节点不重叠。
5. 搜索跳转 `?node=:uid` 在分形视图里能自动飞入并高亮。
6. 折叠 / 展开：600 节点下一次重排 ≤ 16ms；收起状态刷新后仍保持。
7. 场景层：DOM 元素数 ≤ 30 且**与树的节点数无关**；缩放超过 `SCENE_FADE_SCALE` 后场景层
   完全移出渲染（不只透明）；`prefers-reduced-motion` 下鸟、波纹、星星闪烁全部停止。

---

# 版本 B · 3D 版（允许 WebGL）

## 11. 目标与边界

唯一新增的能力：**绕树转一圈看结构**。这需要真正的三维坐标与真光照，所以这一版**允许 canvas / WebGL**，
不再受"全是 DOM 元素"的约束。其余目标与版本 A 完全一致（飞入、折叠、面包屑、点节点看内容）。

不做的事：不追求 PBR 级画质、不做动画播放、不做导出模型。**"能转、好看、不卡"就是达标线。**

## 12. 技术栈与加载策略

- `three` + `OrbitControls`（绕树旋转 / 滚轮缩放 / 右键平移）。
- **动态引入**：`defineAsyncComponent(() => import("@/components/FractalTree3D.vue"))`，
  不进首屏包 —— **不切到 3D 就不下载**。这是对现有页面体积的硬约束。
- 按模块 import（`three` + `examples/jsm/controls/OrbitControls`），交给 Vite tree-shake。
- **降级**：WebGL 不可用（老设备、被禁用、上下文创建失败）→ 自动回落到版本 A 并提示一句。

## 13. 3D 布局：把"角度加权"推广到球面

版本 A 的做法是把父节点的**角度区间**按叶子数切给子节点。到了三维，区间变成**圆锥**：

```
# 以父方向 dir 为中心轴，建正交基 (u, v, dir)
θ_k = 2π × k × 0.618                    # 黄金角，让子节点在锥内螺旋铺开、不重叠
α_k = CONE × sqrt(w_k / W)              # 锥角按权重开平方分配；w_k = 该子树叶子数
dir_k = normalize(dir·cos α_k + (u·cos θ_k + v·sin θ_k)·sin α_k)
```

- 权重分配的逻辑与版本 A 同源（`w_k / W`），只是「区间宽度」换成了「锥角」，
  所以视觉上依然"大分支张得开、小分支收得紧"。
- 开平方是为了让**面积**正比于权重（锥面投影面积 ∝ sin²α），否则大分支会显得不够宽。
- 半径仍按深度：`r = R0 + depth × STEP`；根朝上生长。
- 输出：`{ nodes: [{x, y, z, dir, childCount, ...}], branches: [{from, to}], ... }`，
  与版本 A 的 `fractalTreeLayout.js` 同构（多了 `z` 与 `dir`）。

**为什么不能直接用版本 A 的 2D 坐标**：把 2D 布局放进 3D 场景，相机一转就露馅 ——
那只是一张立在空间里的纸。要转得住，每条枝必须在三维里各有朝向。

## 14. 场景（这次是真光照）

| 元素 | 做法 |
|---|---|
| 天空 | `Sky` shader（`examples/jsm/objects/Sky`）或反面大球 + 渐变 |
| 海面 | 高分段平面 + 顶点正弦位移；或静态平面 + 环境反射 |
| 岛 / 地面 | 低模圆盘 |
| 光照 | `DirectionalLight`（太阳）+ `HemisphereLight`（天光与地面反光） |
| 树的枝 | **`InstancedMesh`**：一个单位圆柱几何体，靠矩阵缩放旋转成每根枝 |
| 树的节点 | 实例化小球；有图片的节点用朝向相机的圆片（billboard） |
| 落影 | 真的 shadow map（`DirectionalLight.castShadow`），不再是版本 A 那个压扁的假副本 |

有一项刻意保留：**标签仍然用 DOM**（`CSS2DRenderer` 或自己叠一层 div 覆盖在 canvas 上）。
这样文字可选中、可点击，`NodeContentReader` 也能原样复用 —— 两版的内容联动完全一致。

## 15. 相机与交互

- `OrbitControls` 负责旋转 / 缩放 / 平移（这就是要的"3D 旋转"）。
- 单击节点 = 相机沿弧线飞入：rAF 缓动 `camera.position` 与 `controls.target`，
  语义与版本 A 的"飞入"一致（把该子树放进视野中心）。
- 折叠 / 展开：**复用同一个 `collapsedIds`**；重排后实例矩阵在 260ms 内插值过渡。
- 手柄折叠：节点旁的 DOM 手柄通过 `CSS2D` 或屏幕坐标投影定位，交互与版本 A 同款。
- 移动端：单指旋转、双指缩放。

## 16. 3D 版的性能预算

- 600 节点 = 600 个枝实例 + 600 个节点实例，`InstancedMesh` 各自**一批绘制**，60fps 无压力。
- 只在折叠 / 飞入 / 相机变化时更新矩阵；静止帧 CPU 零计算。
- 场景元素（天空 / 海 / 岛 / 鸟）固定约 10 个 mesh，与节点数无关。
- 首帧要给加载态：3D 版首次进入需下载 three（gzip 约 150KB）并建场景。

## 17. 版本 B 的分期（独立于版本 A 的 P0–P7）

- **Q0** 3D 布局纯函数 + 单测：球面加权、方向归一化、半径单调、折叠等效判据。
- **Q1** three 场景骨架：天空 + 海 + 岛 + 光照 + `OrbitControls` 能转起来。
- **Q2** 树：实例化枝与节点、图片节点 billboard。
- **Q3** 交互对齐：飞入 / 折叠 / DOM 标签 / 内容卡片。
- **Q4** 打磨：真阴影、鸟、日夜、性能压测与降级回落。

## 18. 验收标准（版本 B）

1. 600 节点下，绕树旋转稳定 ≥ 50fps。
2. 3D 布局单测：子方向落在父锥内；锥角按叶子权重开平方；半径随深度单调递增。
3. 单击节点飞入 ≤ 1s；折叠重排 ≤ 16ms；标签（DOM）文字可选中、可点击并弹出内容卡片。
4. 未切到 3D 视图时，**首页不加载 three**（用构建产物或网络面板断言）。
5. WebGL 不可用时自动回落到版本 A，页面不报错。

## 19. 双版本的风险与取舍

| 风险 | 处理 |
|---|---|
| 两版的实现与维护成本 ×2 | 先做版本 A（P0–P7）：数据、加权规则、交互语义全都在 A 上验证完，B 只换渲染层 |
| three 体积 | 只做动态引入；不切 3D 不下载；并用构建产物断言守住这条线 |
| 老设备 WebGL 不可用 | 回落版本 A，并提示"已切换到 2D 视图" |
| 与"全是 DOM"初衷冲突 | 约束只对版本 A 生效并写成验收项；版本 B 明确放宽，不再自欺 |
| 两版行为漂移（同一节点在两版里位置/交互不一致） | 抽共享纯函数：折叠判定、飞入目标计算、面包屑路径；两版都调它，各自单测 |
