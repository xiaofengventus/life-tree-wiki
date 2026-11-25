# @xiaoxueria/jupyterlab-laup

JupyterLab **4.x** 的 Markdown 渲染器替换插件：把 Markdown 单元格交给 Laup v2 渲染。

- 普通 Markdown：走 Laup 的 CommonMark 内核（标题 / 列表 / 表格 / 链接 / 强调 / 引用式链接 / 自动链接…）；
- Laup 扩展：`\textcolor{red}{…}`、`\begin{todo}`、`\begin{card}`、`\cite`、`\footnote` 等；
- 数学：由 JupyterLab 自己抽出（`$…$`、`$$…$$`、`\(…\)`、`\[…\]`），渲染后交给 KaTeX；
- 附件：`attachment:name` 由 JupyterLab 的 `AttachmentsResolver` 换成 dataURL；
- 标题锚点、sanitize 都由 JupyterLab 现有管线处理，插件只产出 HTML 片段。

## 为什么不是 Python 包

替换的是 JupyterLab **前端**的 Markdown 渲染管线（`text/markdown` 渲染器工厂），与 Python 内核无关，所以单元格里 `import` 不会有任何效果，必须作为 LabExtension 安装。

## 为什么替换渲染器，而不是只换 IMarkdownParser

JupyterLab 的 `renderMarkdown` 在调用解析器**之前**会跑 `removeMath()`，它把任何 `\begin{…}` 都当成 LaTeX 环境抽走：

- `\begin{todo}` / `\begin{card}` 会被当成数学，解析器根本看不到；
- 只替换 `IMarkdownParser` 的话，这些块会渲染成原始 TeX。

所以本扩展接管的是整个 `text/markdown` 渲染器：

1. 源码整体交给 Laup；
2. 数学用 `mathOutput: 'source'` 输出 `$…$` 文本；
3. 交给 JupyterLab 的 `latexTypesetter`（KaTeX）统一排版；
4. 复用 JupyterLab 的 sanitize、`attachment:` 解析与标题锚点。

## 开发安装

前置：JupyterLab 4.x、Node 18+、`jlpm`（JupyterLab 自带）。

```bash
# 1) 准备 Laup 内核源码（发布壳是生成物，仓库里只有一份 src/laup2）
node ../../scripts/laup-core-package.mjs prepare

# 2) 安装依赖并构建
cd packages/jupyterlab
jlpm install
jlpm build

# 3) 链接进当前 JupyterLab
jupyter labextension develop . --overwrite
jupyter labextension list   # 应该能看到 @xiaoxueria/jupyterlab-laup

# 4) 重启 / 刷新 JupyterLab
```

说明：依赖写的是 `portal:../laup2`（yarn 软链），避免 `file:` 安装时触发内核的
`prepack`。如果改用 npm 安装，把它换成 `file:../laup2`，并先执行第 1 步。

改代码时用 `jlpm watch`，刷新页面即可。

## 验证

新建 Markdown 单元格：

```markdown
## \textcolor{red}{测试标题}

\begin{todo}
- [ ] 写文档
- [x] 修 bug
\end{todo}

行内公式 $x^2$，块级：

$$
a = b
$$
```

预期：标题变红、出现只读待办清单、公式正常排版。

## 已知边界

- Laup 不解析原始 HTML（安全策略），`<div>` 会以文本显示；
- MyST 指令（` ```{note} `、`{ref}`）不属于 Jupyter Notebook 标准 Markdown，不支持；
- 代码块只做转义，不调用 JupyterLab 的语法高亮；
- `@xiaoxueria/laup2` 正式版发布前，依赖用 `file:../laup2`。
