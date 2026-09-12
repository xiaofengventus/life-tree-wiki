# Markdown 与 LaTeX 解析能力说明

本文档说明「从 Markdown 导入正文」面板目前能解析哪些语法，以及安全边界。
解析入口：[`src/utils/markdown.js`](../src/utils/markdown.js) 的 `markdownToSafeHtml`。

## 解析流程

```
原始 Markdown
   │
   ▼
normalizeLatexDelimiters()   ← 把裸 LaTeX / \( \) \[ \] 归一化为 $...$ / $$...$$
   │
   ▼
micromark + gfm + math       ← 语法解析为 HTML
   │
   ▼
sanitizeHtml()               ← 白名单标签 + 属性消毒，危险 HTML 全部移除
   │
   ▼
decorateRichHtml()           ← 代码高亮（Prism）+ 表格横向滚动
   │
   ▼
renderFormulaNodes()         ← 用 KaTeX 渲染 data-life-math 节点
```

## 支持的 Markdown 语法（GFM）

| 类别        | 语法                     | 说明                          |
| ----------- | ------------------------ | ----------------------------- |
| 标题        | `#` ~ `######`           | 一到六级标题                  |
| 段落 / 换行 | 空行分段；行尾两空格换行 |                               |
| 粗体        | `**文字**` 或 `__文字__` |                               |
| 斜体        | `*文字*` 或 `_文字_`     |                               |
| 删除线      | `~~文字~~`               | GFM                           |
| 行内代码    | `` `代码` ``             |                               |
| 代码块      | ` ```lang ` 围栏         | 支持语言见下文                |
| 引用        | `> 引用文本`             |                               |
| 无序列表    | `-` / `*` / `+`          |                               |
| 有序列表    | `1.`                     |                               |
| 任务列表    | `- [x]` / `- [ ]`        | GFM                           |
| 表格        | `\| 列 \| 列 \|` 分隔行  | GFM，自动横向滚动             |
| 链接        | `[文本](url)`            | 仅允许 http/https/mailto/站内 |
| 图片        | `![alt](url)`            | 自动包裹 figure+figcaption    |
| 分隔线      | `---`                    |                               |
| 自动链接    | 直接写 URL               | GFM                           |

## 数学公式（LaTeX / KaTeX）

支持以下四种写法，最终都由 KaTeX 渲染：

### 1. 行内公式

```markdown
行内公式 $x^2 + y^2 = r^2$ 也可以用 \(x^2 + y^2 = r^2\)。
```

### 2. 独立（块级）公式

```markdown
$$
\int_0^\infty e^{-x^2}\,dx = \frac{\sqrt{\pi}}{2}
$$

\[
\sum\_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
\]
```

### 3. 中文语境下的裸 LaTeX（自动识别）

为了方便直接粘贴教材/论文内容，**不带 `$` 的裸 LaTeX** 也会被自动识别并包裹成行内公式，例如：

```markdown
位置矢量：\vec{r}(t) = x(t)\vec{i} + y(t)\vec{j} + z(t)\vec{k}
位移：\Delta\vec{r} = \vec{r}(t + \Delta t) - \vec{r}(t)
路程 s = \int \vert{}\mathrm{d}\vec{r}\vert{}
```

自动识别的安全规则：

- 片段必须含 `\命令`（反斜杠 + 字母），且含数学运算符（`= + - * / ^ _ { } ( ) [ ] |`）或常见数学命令（希腊字母、`\vec`、`\frac`、`\int` 等）。
- 以中文 / 全角标点 / 空白 / `` ` `` / `<` `>` / `$` 作为片段边界。
- **跳过**：代码块、行内代码、HTML 标签、已用 `$` 包裹的内容。
- **跳过**：`\newcommand`、`\def`、`\begin`、`\end` 等控制命令开头的片段（避免把宏定义误当公式）。
- 英文长句中混入的 `\command` 可能不会被自动包裹，请手动加 `$`。

## 代码高亮语言（Prism）

代码块围栏后可指定语言，目前已加载：

`bash` `c` `cpp` `csharp` `go` `java` `javascript` `json` `kotlin` `lua`
`markdown` `markup`（html/xml） `php` `python` `r` `ruby` `rust` `sql`
`swift` `typescript` `visual-basic` `yaml` `groovy` `jsx`

别名会被归一化：`js→javascript`、`ts→typescript`、`py→python`、`sh/shell→bash`、
`cs→csharp`、`c++→cpp`、`md→markdown`、`yml→yaml`、`html/xml→markup`、`txt/text→plain`。

未在列表中的语言会按纯文本显示（不高亮）。

## 安全限制

- **不执行原始 HTML**：`allowDangerousHtml: false`，所有 `<script>`、`<iframe>`、事件属性等被移除。
- **协议白名单**：链接只允许 `http:`、`https:`、`mailto:`、站内相对路径；图片只允许 `https:` 和站内。
- **标签白名单**：见 `sanitizeHtml.js` 的 `ALLOWED_TAGS`，其余标签会被解包（保留内容）或丢弃。
- **公式长度上限**：单个公式 ≤ 4000 字符，超出报错；整篇 Markdown ≤ 50 万字符。
- **KaTeX 安全选项**：`trust: false`，禁止 `\href`、`\includegraphics` 等需要信任的命令；
  `throwOnError: false`，公式出错时显示红色错误文本而非抛出异常。

## 编辑器面板

编辑器工具栏提供 **富文本 / Markdown** 模式切换：

- **富文本模式**：使用 wangEditor 可视化编辑（原有方式）。
- **Markdown 模式**：直接在文本框编写 Markdown + LaTeX，带「代码 / 预览」标签页。
  - 点击工具栏的 **Markdown** 按钮切换；切换时会把当前富文本 HTML 自动转回 Markdown 源码。
  - **代码** 标签：编写 Markdown / LaTeX 源码。
  - **预览** 标签：实时渲染（输入即更新），所见即所得。
  - 编写过程中 Markdown 自动同步为 HTML 存入正文（防抖 300ms），提交/存草稿时内容始终最新。
  - 切回 **富文本** 模式时，Markdown 会转回 HTML 并载入富文本编辑器。

此外，「从 Markdown 导入正文」面板仍可作为快速插入工具使用：

- **代码**：在文本框编写 Markdown / LaTeX。
- **预览**：实时渲染（输入后约 200ms 防抖），所见即所得。

点击「插入到光标处」会把渲染后的安全 HTML 插入到富文本编辑器当前光标位置。
