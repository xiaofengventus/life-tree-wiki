# @xiaoxueria/laup2

Laup v2 语言内核：**CommonMark + Laup 扩展**，源码 → 类型化 AST → HTML。

纯 ESM、零第三方依赖、无 DOM，Node 与浏览器通用；同一份内核同时用于编辑器预览、服务端渲染与静态导出。

## 安装

```bash
npm i @xiaoxueria/laup2
```

## 使用

```js
import { typeset } from "@xiaoxueria/laup2";

const { html, diagnostics } = typeset("# 标题\n\n正文 **粗体**，行内公式 $x^2$。");
```

按「格」（Notebook 单元格）渲染：

```js
import { typesetCells } from "@xiaoxueria/laup2";

typesetCells("[cpp]\nint main() {}\n\\cellbreak\n正文").html;
```

### 选项

| 选项 | 说明 |
|---|---|
| `variables` | 变量插值，`{{name}}` 使用 |
| `mathDelimiters: 'jupyter'` | 额外接受 `\(…\)` / `\[…\]`（默认只认 `$…$` / `$$…$$`） |
| `mathOutput: 'source'` | 数学输出 `$…$` 文本，交给宿主排版（JupyterLab 用） |
| `allowAttachment: true` | 放行 `attachment:` 图片地址，交给宿主解析成 dataURL |
| `mode: 'edit' \| 'strict'` | 编辑态保留更多兜底；严格态更早报错 |

### 子路径

| 入口 | 内容 |
|---|---|
| `@xiaoxueria/laup2` | `typeset` / `typesetCells` / `parse` / `exportSource` / `defineCommand` / `defineEnvironment` … |
| `@xiaoxueria/laup2/cells` | `parseCells` / `readVarCell` / `readReferenceCell` / `evaluate` |
| `@xiaoxueria/laup2/completions` | 编辑器补全清单（命令 / 环境 / 格声明） |
| `@xiaoxueria/laup2/css` | 默认样式（`laup2.css`） |

## 语法

- **CommonMark**：ATX / Setext 标题、段落、引用、列表、围栏代码块、代码段、强调、链接 / 图片（含 title）、引用式链接、自动链接、硬换行、HTML 实体、HTML 注释。
- **GFM**：管道表、删除线。
- **Laup 扩展**：`\textcolor{red}{文字}`、`\fontsize{18}{文字}`、`\begin{todo}`、`\begin{card}`、`\begin{tree}`、`\cite{1,3}`、`\footnote{…}`、`\eqref{…}`、`[references]` 格、`{{变量}}`。

## 宿主需要提供

内核只产出结构与占位，不绑定具体渲染库：

- **数学**：产物是带 `data-tex` 的节点，由宿主交给 KaTeX / MathJax。
- **代码高亮**：产物是带 `data-lang` 的代码块，由宿主交给 Prism / Shiki。
- **样式**：可选用 `@xiaoxueria/laup2/css`，或自行覆盖。

## 安全边界

- 原始 HTML **一律转义**（`<div>` 只显示字面量）；
- `\raw` **不解析**（直通 HTML 的通道被禁用）；
- 链接 / 图片地址经过协议白名单。

入库 HTML 保证 100% 由 Laup 产出。

## License

[MIT](./LICENSE)
