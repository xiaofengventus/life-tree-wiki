// Laup 产物样式的单一来源。
//
// 四处必须**完全同一套规则**，否则就会「左边一个样、右边纸面一个样、PDF 又一个样」：
//   ① 格下预览（#notebook-page .output）
//   ② 实时渲染面板里的纸（.nb-sheet-body）
//   ③ 离屏量块高（paginate 注入的 .nb-measure-root）
//   ④ 导出 PDF 的打印 iframe（无作用域）
// 都从 DOC_CSS(scope) 生成，只换作用域前缀，规则本体只有一份。
//
// 版式口径：以格下预览（左）为准 —— 标题字号 / 间距 / 表格 / 代码块 / 卡片的
// 视觉一眼就来自那边；字体族用纸面的衬线体；正文每段缩进两个字符。
//
// 打印引擎不会带页面上的 CSS（Prism 的 token 配色也在页面里），所以高亮颜色
// 必须写进这份字符串；否则打印出来就是一片黑字。

/** A4 版心（96dpi）。高度必须与样式表里的 .nb-sheet-body 一致。 */
export const SHEET_WIDTH_PX = Math.round((210 - 32) * 96 / 25.4)
export const SHEET_HEIGHT_PX = Math.round((297 - 36) * 96 / 25.4)

const SERIF = `"Songti SC", "Source Han Serif SC", "SimSun", Georgia, serif`
const MONO = `Consolas, Menlo, monospace`

/**
 * 段落缩进规则 —— 全项目只在这一处定义，其它规则里不要再写 text-indent。
 *
 * 缩进（2 个字符）：
 *   · 所有正文段落 p —— 包括标题后紧跟的第一段（中文习惯「每段都缩进两字」，
 *     不采用英文 LaTeX 的 \@afterheading 顶格做法）。
 *
 * 不缩进：
 *   · 容器里的段落：列表项 / 引用 / 表格单元格 / 图注表注 / 分类卡 /
 *     目录 / 文献 / 脚注 / 待办 / 树 / 强调框 / 对照卡 / 公式编号 / 居中块；
 *   · 非段落块：代码、行号、KaTeX（含行内公式，避免继承段落缩进后错位）、原样块、报错块。
 */
function indentRules(scope) {
  const r = (sel) => `${scope} ${sel}`
  const boxes = [
    'li', 'blockquote', 'td', 'th', 'figcaption', 'caption',
    '.laup2-card', '.laup2-toc', '.laup2-references', '.laup2-footnotes',
    '.laup2-todo', '.laup2-tree', '.laup2-callout', '.laup2-sample', '.laup2-equation',
    '.laup-center', '.laup2-center',
  ].join(', ')
  const atoms = [
    'pre', 'code', '.nb-ln', '.katex', '.katex-display',
    '.laup2-math', '.laup2-math-display', '.laup-math', '.laup-math-display',
    '.laup2-raw', '.laup2-broken',
  ].join(', ')
  return `
${r('p')} { text-indent: 2em; }
${r(`:is(${boxes})`)}, ${r(`:is(${boxes}) p`)} { text-indent: 0; }
${r(`:is(${atoms})`)} { text-indent: 0; }
`
}

/** 文档正文规则（作用域 + 规则本体，一份）。 */
function docRules(scope) {
  const r = (sel) => `${scope} ${sel}`
  return `
${scope} {
  color: #16181c;
  font: 15px/1.6 ${SERIF};
  text-align: left;
  overflow-wrap: anywhere;
}
${r('p')}, ${r('ul')}, ${r('ol')}, ${r('li')}, ${r('figure')}, ${r('table')}, ${r('blockquote')}, ${r('pre')},
${r('h1')}, ${r('h2')}, ${r('h3')}, ${r('h4')}, ${r('h5')}, ${r('h6')} { margin: 0; }
${scope} > :where(* + *), ${scope} :where(.nb-flow) > :where(* + *) { margin-top: 6px; }

${r('h1')} { font-size: 26px; line-height: 1.4; margin: 14px 0 8px; }
${r('h2')} { font-size: 21px; line-height: 1.45; margin: 12px 0 7px; }
${r('h3')} { font-size: 17px; line-height: 1.5; margin: 10px 0 6px; }
${r('h4')}, ${r('h5')}, ${r('h6')} { font-size: 15px; line-height: 1.55; margin: 8px 0 5px; }
${r('p')} { margin: 6px 0; line-height: 1.6; }
${indentRules(scope)}

${r('ul')}, ${r('ol')} { margin: 6px 0; padding-left: 26px; }
${r('li')} { margin: 2px 0; line-height: 1.55; }

${r('table')} { border-collapse: collapse; margin: 8px 0; }
${r('caption')} { font-size: 12.5px; color: #777; margin-bottom: 4px; }
${r('th')}, ${r('td')} { border: 1px solid #d5d5d5; padding: 4px 12px; font-size: 13px; text-align: left; }
${r('th')} { background: #f2f2f2; }

${r('pre')} {
  background: #f7f7f7; border: 1px solid #e5e5e5; border-radius: 2px;
  padding: 8px 10px; margin: 6px 0; font-size: 12.8px; line-height: 1.6;
  font-family: ${MONO}; white-space: pre-wrap; overflow-wrap: anywhere;
}
${r('code')} { font-family: ${MONO}; background: #f4f4f4; padding: 1px 4px; border-radius: 2px; font-size: 92%; }
${r('pre code')} { background: none; padding: 0; font-size: 100%; white-space: inherit; }

${r('blockquote')} { border-left: 3px solid #ddd; color: #777; margin: 6px 0; padding: 2px 12px; }

${r('figure')} { margin: 10px 0; text-align: center; }
${r('figcaption')} { color: #777; font-size: 12.5px; margin-top: 4px; }
${r('img')}, ${r('svg')} { max-width: 100%; height: auto; }

${r('hr')} { border: 0; border-top: 1px solid #ddd; margin: 12px 0; }
${r('a')} { color: #0645ad; }

/* 高亮器逐行包成 .nb-ln：block 才能换行，也才能让分页断在行间 */
${r('.nb-ln')} { display: block; }

/* 公式：KaTeX 排完后统一行距，别让 display 公式自带的外边距把段落撑开 */
${r('.katex-display')} { margin: 6px 0; }

/* 只读产物里的控件（待办复选框）不上纸；预览保持同一版式 */
${r('button')}, ${r('input')} { display: none; }
`
}

/** Laup v2 复合块（对照卡 / 卡片 / 目录 / 公式编号 / 文献 / 脚注 / 待办 / 树）。 */
function laupBlockRules(scope) {
  const r = (sel) => `${scope} ${sel}`
  return `
${r('.laup2')} { color: #1f2328; line-height: 1.75; }
${r('.laup2-sample')} { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 10px; margin: 8px 0; }
${r('.laup2-sample-pane')} { overflow: hidden; border: 1px solid #d8dee4; border-radius: 6px; background: #fff; }
${r('.laup2-sample-pane > header')} { padding: 5px 10px; border-bottom: 1px solid #e5e9ef; background: #f6f8fa; color: #33475b; font-size: 12px; font-weight: 600; }
${r('.laup2-sample-pane > pre')} { margin: 0; padding: 9px 11px; border: 0; border-radius: 0; background: #fbfcfd; font-size: 12.8px; }
${r('.laup2-callout')} { margin: 8px 0; padding: 8px 12px; border-left: 4px solid #9aa4ad; background: #f7f9fb; }
${r('.laup2-callout-warning')} { border-left-color: #d98c00; background: #fff8e6; }
${r(':is(.laup-center, .laup2-center)')}, ${r(':is(.laup-center, .laup2-center) p')} { text-align: center; }
${r('.laup2-toc')} { margin: 8px 0; padding: 10px 14px; border: 1px solid #e6e8eb; border-radius: 6px; background: #fafbfc; }
${r('.laup2-toc ul')} { list-style: none; padding-left: 0; margin: 0; }
${r('.laup2-toc-l3')} { padding-left: 1.2em; }
${r('.laup2-toc-l4')}, ${r('.laup2-toc-l5')}, ${r('.laup2-toc-l6')} { padding-left: 2.4em; }
${r('.laup2-equation')} { display: flex; align-items: center; gap: 12px; margin: 10px 0; }
${r('.laup2-eqno')} { color: #8a919c; font-size: 13px; }
${r('.laup2-references')} { margin: 14px 0 4px; font-size: 13.5px; color: #444d56; }
${r('.laup2-references h2')} { font-size: 15px; margin: 0 0 6px; }
${r('.laup2-footnotes')} { margin-top: 18px; font-size: 13px; color: #444d56; }
${r('.laup2-raw')} { white-space: pre-wrap; overflow-wrap: anywhere; }
${r('.laup2-broken')} { padding: 8px 12px; border: 1px dashed #e0a0a0; background: #fff5f5; color: #a33; white-space: pre-wrap; }
${r('.laup2-todo')} { list-style: none; margin: 8px 0; padding-left: 0; }
${r('.laup2-todo li')} { display: flex; align-items: flex-start; gap: 7px; margin: 4px 0; }
${r('.laup2-todo li.is-done > span')} { color: #8a919c; text-decoration: line-through; }
${r('.laup2-card')} { margin: 10px 0; border: 1px solid #a2a9b1; border-top: 3px solid var(--laup2-card-color, #a2a9b1); background: #f8f9fa; border-radius: 4px; overflow: hidden; }
${r('.laup2-card > header')} { padding: 7px 11px; background: color-mix(in srgb, var(--laup2-card-color, #eaecf0) 14%, #ffffff); font-weight: 700; font-size: 13px; }
${r('.laup2-card table')} { width: 100%; border-collapse: collapse; margin: 0; }
${r('.laup2-card th')}, ${r('.laup2-card td')} { padding: 5px 11px; border: 0; border-top: 1px solid #e4e7eb; font-size: 12.8px; text-align: left; }
${r('.laup2-card th')} { width: 32%; background: #f2f4f7; font-weight: 600; }
${r('.laup2-card-note')} { margin-left: 6px; color: #8a919c; font-size: 12px; }
${r('.laup2-tree')} { margin: 8px 0; border: 1px solid #cfe0d5; border-radius: 8px; background: #f7fbf8; }
${r('.laup2-tree a')} { display: flex; align-items: center; gap: 8px; padding: 10px 12px; color: #27503a; text-decoration: none; }
${r('.laup2-tree-label')} { padding: 1px 7px; border: 1px solid #cfe0d5; border-radius: 999px; color: #6b8577; font-size: 11px; }
${r('.laup2-tree-id')} { margin-left: auto; color: #8a919c; font-size: 11.5px; }

@media (max-width: 720px) {
  ${r('.laup2-sample')} { grid-auto-flow: row; }
}
`
}

/** 代码高亮配色（GitHub Light 系，与 rich-content.css 同值）。 */
function tokenColors(scope) {
  const r = (sel) => `${scope} ${sel}`
  return `
${r('.token.comment')}, ${r('.token.prolog')}, ${r('.token.doctype')}, ${r('.token.cdata')} { color: #6e7781; }
${r('.token.punctuation')} { color: #57606a; }
${r('.token.property')}, ${r('.token.tag')}, ${r('.token.boolean')}, ${r('.token.number')}, ${r('.token.constant')}, ${r('.token.symbol')} { color: #0550ae; }
${r('.token.selector')}, ${r('.token.attr-name')}, ${r('.token.string')}, ${r('.token.char')}, ${r('.token.builtin')}, ${r('.token.inserted')} { color: #0a7b45; }
${r('.token.operator')}, ${r('.token.entity')}, ${r('.token.url')}, ${r('.language-css .token.string')}, ${r('.style .token.string')} { color: #953800; }
${r('.token.atrule')}, ${r('.token.attr-value')}, ${r('.token.keyword')} { color: #cf222e; }
${r('.token.function')}, ${r('.token.class-name')} { color: #8250df; }
${r('.token.regex')}, ${r('.token.important')}, ${r('.token.variable')} { color: #116329; }
`
}

/**
 * 本机内核的真实输出（代码格下方的 stdout / 结果 / 报错）。
 * 放进 DOC_CSS 是刻意的：格下预览、右侧纸面、PDF、导出的 HTML 必须同一个样子，
 * 否则「左边跑出来一个样，右边纸面又是一个样」。
 */
function runtimeRules(scope) {
  const r = (sel) => `${scope} ${sel}`
  return `
${r('.rt-out')} { margin: 10px 0 0; padding-top: 8px; border-top: 1px dashed #e2e6ea; }
${r('.rt-out-running')} { border-top: 0; padding-top: 0; }
${r('.rt-stream')}, ${r('.rt-text')} {
  margin: 4px 0; padding: 8px 12px; background: #f6f8fa;
  border: 1px solid #e4e8ee; border-radius: 4px;
  font-family: ${MONO}; font-size: 12.5px; line-height: 1.65;
  white-space: pre-wrap; overflow-wrap: anywhere; color: #1f2328;
}
${r('.rt-stream.is-stderr')} { color: #b42318; background: #fdf3f3; border-color: #eec7c7; }
${r('.rt-error')} {
  margin: 4px 0; padding: 8px 12px; border: 1px solid #eec7c7; border-radius: 4px;
  color: #c00; background: #fdf3f3;
  font-family: ${MONO}; font-size: 12.5px; line-height: 1.6;
  white-space: pre-wrap; overflow-wrap: anywhere;
}
${r('.rt-img')} { display: block; max-width: 100%; height: auto; margin: 6px 0; }
${r('.rt-html')} { margin: 6px 0; overflow-x: auto; }
${r('.rt-running')} { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #8a6d3b; }
${r('.rt-running')}::before {
  content: ''; width: 9px; height: 9px; border-radius: 50%;
  border: 2px solid #e0d3a8; border-top-color: #b26a00;
  animation: rt-spin .8s linear infinite;
}
@keyframes rt-spin { to { transform: rotate(360deg); } }
`
}

/**
 * 文档整段样式：规则本体只有一份，靠 scope 前缀落到不同载体上。
 * @param {string} scope 作用域前缀；'' 表示打印 iframe 里直接挂 body
 */
export function DOC_CSS(scope) {
  const prefix = scope || 'body'
  return `
${docRules(prefix)}
${laupBlockRules(prefix)}
${runtimeRules(prefix)}
${tokenColors(scope ? `${scope} ` : '')}
`
}

/** 格下预览（左）用的那一份。 */
export const PREVIEW_CSS = DOC_CSS('#notebook-page .output')

/** 实时渲染面板里的纸面，与预览同一套规则。 */
export const SHEET_CSS = DOC_CSS('.nb-sheet-body')

/** 离屏测量用的整段 CSS（注入 <style id="nb-measure-style">）。 */
export const MEASURE_CSS = `
  .nb-measure-root {
    width: ${SHEET_WIDTH_PX}px; box-sizing: border-box;
  }
${DOC_CSS('.nb-measure-root')}
`

/** 打印 iframe 的整段样式（@page + 每张纸 + 正文排版 + 高亮色）。 */
export const PRINT_CSS = `
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .nb-print-sheet { break-after: page; }
  .nb-print-sheet:last-child { break-after: auto; }
  .nb-print-sheet > * + * { margin-top: 0; }
  h1, h2, h3, caption, figcaption { break-after: avoid; }
  .nb-flow, .nb-flow * { break-inside: auto; }
${DOC_CSS('')}
`
