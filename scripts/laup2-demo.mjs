#!/usr/bin/env node
/**
 * Laup v2 的实际渲染演示。
 *
 * 用法：node scripts/laup2-demo.mjs [输出路径]
 * 产物是一份静态 HTML：内核默认样式（defaultCss）+ 站内阅读页的 Wiki 排版，
 * 与 WikiPostDetail 的 .article-content 同一套口径，不再套用额外的主题包。
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { typeset, typesetCells, defaultCss } from "../src/laup2/index.js";

const ARTICLE = [
  "# 生命时序的排版实验",
  "",
  "这是一段用来检验主题的正文，包含 **粗体**、*斜体*、~~删除线~~、`行内代码`，",
  "以及行内公式 $E=mc^2$ 和颜色 \\textcolor{red}{线粒体}。",
  "",
  "## 为什么重新做内核",
  "",
  "旧内核把版本信息写进了内容，导致同一篇文章无法同时出网页、公众号与 PDF。",
  "新的分层是：源码 → Lexer → Parser → 类型化 AST → 语义 → 渲染。",
  "",
  "### 三条约束",
  "",
  "- 文档只描述语义，不描述版式",
  "- 数学区不解析命令",
  "- 所有节点形状统一",
  "",
  "> 引用：任何需要看全篇才能决定的事情，都放在语义阶段。",
  "",
  "```python",
  "def layout(doc):",
  "    for block in doc.blocks:",
  "        yield block",
  "```",
  "",
  "| 能力 | v1 | v2 |",
  "| :--- | :--- | :--- |",
  "| 嵌套环境 | 不支持 | 深度配对 |",
  "| 参考文献 | 数据块 | `[references]` 格 |",
  "",
  "\\begin{equation}{eq:main}",
  "\\int_0^1 x^2\\,dx = \\frac{1}{3}",
  "\\end{equation}",
  "",
  "见式 \\eqref{eq:main}。",
  "",
  "\\begin{note}",
  "提示块由主题控制外观，内核只负责语义。",
  "\\end{note}",
  "",
  "\\begin{stay}",
  "原样块：",
  "  **不解析** $x$",
  "\\end{stay}",
  "",
  "\\tableofcontents",
].join("\n");

const NOTEBOOK = [
  'var title = "输入输出案例"',
  "\\cellbreak",
  "# {{title}}",
  "\\cellbreak",
  "相邻的输入/输出格会合并成一张卡，栏内不声明语言。",
  "\\cellbreak",
  "[input]\n1",
  "5",
  "0 5 0 7 15",
  "\\cellbreak",
  "[output]",
  "0-1-5---[0 1]",
  "0-2-9---[0 3 2]",
  "\\cellbreak",
  "[cpp]",
  "#include <vector>",
  "int main() { return 0; }",
  "\\cellbreak",
  "[references]",
  "达尔文. 物种起源. 1859.",
  "迈尔. 生物学思想的发展. 1982.",
  "\\cellbreak",
  "正文也可以引用文献 \\cite{1-2}。",
].join("\n");

function page(body) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Laup v2 渲染演示</title>
<link rel="stylesheet" href="/node_modules/katex/dist/katex.min.css">
<link rel="stylesheet" href="/src/assets/rich-content.css">
<style>
${defaultCss}
/* ── 演示页外壳 ───────────────────────────────────────────── */
html, body { margin: 0; background: #fff; }
.demo-wrap { max-width: 860px; margin: 0 auto; padding: 32px 24px 80px; }
.demo-head { font-family: -apple-system, "Microsoft YaHei", sans-serif; }
.demo-head h1 { font-size: 13px; letter-spacing: .14em; color: #72777d; text-transform: uppercase; margin: 0 0 6px; }
.demo-head p { margin: 0; color: #72777d; font-size: 13px; }
.demo-split { margin: 40px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #eaecf0; font: 600 13px/1.4 -apple-system, "Microsoft YaHei", sans-serif; letter-spacing: .1em; color: #54595d; }

/* ── 站内阅读页口径（WikiPostDetail 的 .article-content）────────
   衬线正文、细线章节标题、蓝色链接、1px 表格框线、绿色引用条。 */
.article-content { padding-top: 20px; font-family: Georgia, "Noto Serif SC", "Songti SC", serif; font-size: 16px; line-height: 1.9; overflow-wrap: anywhere; }
.article-content .laup2 { color: #202122; line-height: 1.9; }
.article-content .laup2 h1,
.article-content .laup2 h2,
.article-content .laup2 h3 { margin: 1.8em 0 .7em; padding-bottom: .25em; border-bottom: 1px solid #eaecf0; color: #202122; font-family: Georgia, "Noto Serif SC", serif; font-weight: 400; line-height: 1.35; }
.article-content .laup2 h1 { font-size: 30px; }
.article-content .laup2 h2 { font-size: 28px; }
.article-content .laup2 h3 { font-size: 22px; }
.article-content .laup2 p,
.article-content .laup2 ul,
.article-content .laup2 ol { margin: 0 0 1.2em; }
.article-content .laup2 a { color: #3366cc; text-decoration: none; }
.article-content .laup2 a:hover { text-decoration: underline; }
.article-content .laup2 blockquote { margin: 1.7em 0; padding: 13px 18px; border-left: 4px solid #75aa99; border-radius: 0 9px 9px 0; background: #f4f8f6; color: #597068; }
.article-content .laup2 table { width: 100%; border-collapse: collapse; font-size: 15px; }
.article-content .laup2 th,
.article-content .laup2 td { padding: 8px; border: 1px solid #a2a9b1; }
.article-content .laup2 th { background: #f8f9fa; }
.article-content .laup2 pre.laup2-code { position: relative; margin: 1.6em 0; padding: 2.5rem 1rem 1rem; border: 1px solid #d8e1e8; border-radius: 9px; background: #f6f8fa; color: #24292f; font: .9em/1.65 ui-monospace, SFMono-Regular, Consolas, monospace; }
.article-content .laup2 pre.laup2-code::before { position: absolute; top: .6rem; left: 1rem; content: attr(data-lang); color: #7b8794; font: 700 .68rem/1.2 Inter, -apple-system, "Segoe UI", sans-serif; letter-spacing: .04em; text-transform: uppercase; }
.article-content .laup2 pre.laup2-code code { padding: 0; border: 0; background: none; font: inherit; }
</style>
</head>
<body>
<main class="demo-wrap">
<div class="demo-head">
  <h1>Laup v2 · 站内阅读风格</h1>
  <p>内核默认样式 defaultCss + 站点 WikiPostDetail 的 .article-content 排版。</p>
</div>
<div class="article-content">
${body}
</div>
</main>
<script src="/node_modules/katex/dist/katex.min.js"></script>
<script>
  for (const el of document.querySelectorAll('[data-tex]')) {
    try {
      katex.render(el.getAttribute('data-tex'), el, {
        displayMode: el.classList.contains('laup2-math-display'),
        throwOnError: false,
      });
    } catch (error) {}
  }
</script>
</body>
</html>`;
}

const article = typeset(ARTICLE);
const notebook = typesetCells(NOTEBOOK);

const body = [
  '<div class="demo-split"><h2>文章（typeset）</h2></div>',
  article.html,
  '<div class="demo-split"><h2>Notebook（typesetCells）</h2></div>',
  notebook.html,
].join("\n");

const output = path.resolve(process.argv[2] || ".tmp-demo/laup2.html");
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, page(body), "utf8");

console.log(`已生成 ${output}`);
console.log(`诊断：文章 ${article.diagnostics.length} 条，Notebook ${notebook.diagnostics.length} 条`);
for (const item of [...article.diagnostics, ...notebook.diagnostics]) {
  console.log("  - " + item.toString());
}
