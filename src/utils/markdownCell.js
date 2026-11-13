/**
 * 「Markdown 单元格」——把一段 Markdown 源码当作正文内容来写，随时预览。
 *
 * 设计取舍：**载体是普通代码块**，语言标记 `md`（序列化成 `<pre><code class="language-md">`），
 * 和「代码块案例」（utils/codeSample.js）走同一条路数。好处是：
 *
 * 1. 不新增 wangEditor 节点类型 —— 编辑、撤销、重做、粘贴、导入导出全部复用现成逻辑；
 * 2. 清洗白名单零改动 —— `pre` / `code` / `language-*` 早就允许了
 *    （见 utils/sanitizeHtml.js 的 CODE 分支）；
 * 3. **源码永远留在文档里** —— 作者随时改得回 Markdown，不像旧的「从 Markdown 导入」
 *    转成 HTML 之后源码就丢了。
 *
 * 编辑态 / 预览态的切换是**纯显示层**的事（见 utils/markdownCellView.js），不进文档数据，
 * 所以刷新后一律回到编辑态。
 *
 * ⚠️ 本模块**刻意不 import 任何东西**。渲染函数在 utils/markdownCellRender.js（它要吃
 * markdown.js 和 formula.js，而 formula.js 带着 katex 的 CSS，Node 原生 ESM 跑不了）。
 * 拆开之后，richHtml.js 可以安全地 import 这里的常量与判断函数而不牵连任何依赖 ——
 * 否则 tests/markdownGfm.test.mjs（经由 richHtml.js）会直接崩在 CSS 上。
 */

/** 写进 code 节点的语言标记（序列化后是 `class="language-md"`） */
export const MARKDOWN_CELL_LANGUAGE = "md";

/**
 * 认作 Markdown 单元格的语言标记。
 *
 * 带上 `markdown` 是因为 wangEditor 代码块的语言下拉里两个写法都有，
 * 作者选哪个都应该得到同一个效果。
 */
export const MARKDOWN_CELL_LANGUAGES = Object.freeze(["md", "markdown"]);

/** 阅读页 / 预览层用来标记「这块是 md 单元格」的属性名 */
export const MARKDOWN_CELL_ATTR = "data-life-md-cell";

/**
 * 渲染结果容器的 class。
 *
 * 刻意带上 `post-content`：阅读页那套正文样式（assets/rich-content.css）就挂在
 * `.post-content` / `.markdown-preview` / `.article-content` 三个作用域 class 上，
 * 复用之后单元格里的标题、列表、表格、代码块、任务列表、引用全都天然与阅读页一致，
 * 不必为一个新容器把几百行三元组选择器再抄一遍。
 * （已确认 `.post-content` 自身不带任何样式，只是作用域标记。）
 */
export const MARKDOWN_CELL_BODY_CLASS = "life-md-cell-body post-content";

/** 单个单元格的源码上限，与 utils/markdown.js 的 MAX_MARKDOWN_LENGTH 保持一致 */
export const MAX_MARKDOWN_CELL_LENGTH = 500_000;

/** 判断某个语言标记是否属于 Markdown 单元格 */
export function isMarkdownCellLanguage(value) {
  return MARKDOWN_CELL_LANGUAGES.includes(String(value ?? "").trim().toLowerCase());
}

/**
 * 构造 wangEditor 的代码块节点。
 *
 * 形状与 wangEditor 内置解析器的输出一致（`pre` 包一个 `code`，语言写在 code 上），
 * 这样插进去的节点和作者自己手敲的代码块没有任何区别。
 */
export function createMarkdownCellNode(source = "") {
  return {
    type: "pre",
    children: [
      {
        type: "code",
        language: MARKDOWN_CELL_LANGUAGE,
        children: [{ text: String(source ?? "") }],
      },
    ],
  };
}

/**
 * 纯文本摘要：取第一行非空文本，剥掉标题 / 引用 / 列表前缀，压到 limit 个字符。
 * 给预览 tab 条的无障碍标签和空状态提示用。
 */
export function markdownCellSummary(source, limit = 60) {
  const firstLine = String(source ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^[#>\-*\s`]+/, "").trim())
    .find((line) => line.length > 0);
  if (!firstLine) return "空单元格";
  return firstLine.length > limit ? `${firstLine.slice(0, limit)}…` : firstLine;
}
