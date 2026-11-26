// A4 印刷体样式 —— 单一来源。
//
// 三个地方必须**长得一模一样**，否则分页算出来的页数就对不上纸上的实际内容：
//   ① 实时渲染面板里的纸（.nb-sheet-body）
//   ② 离屏量块高（paginate 注入的 .nb-measure-root）
//   ③ 导出 PDF 的打印 iframe
// 以前三份各写一遍，改一处就漂一处；现在都从这里取。
//
// 打印引擎不会带页面上的 CSS（Prism 的 token 配色也在页面里），所以高亮颜色
// 必须写进这份字符串；否则打印出来就是一片黑字。

/** A4 版心（96dpi）。高度必须与样式表里的 .nb-sheet-body 一致。 */
export const SHEET_WIDTH_PX = Math.round((210 - 32) * 96 / 25.4)
export const SHEET_HEIGHT_PX = Math.round((297 - 36) * 96 / 25.4)

/** 印刷体排版规则，作用域用 `root` 前缀（'' 或 '.nb-measure-root '）。 */
function typography(root) {
  const s = (rule) => rule.split('\n').map((line) => line.trim()).filter(Boolean)
    .map((line) => root + line).join('\n')
  return s(`
  body, p, h1, h2, h3, h4, ul, ol, li, figure, table, blockquote { margin: 0; }
  p { text-align: justify; text-indent: 2em; hyphens: auto; }
  h1 { font-size: 1.85em; line-height: 1.35; margin: 0 0 .7em; text-align: center; }
  h2 { font-size: 1.35em; margin: 1.1em 0 .5em; }
  h3 { font-size: 1.12em; margin: 1em 0 .4em; }
  h4 { font-size: 1em; margin: .9em 0 .4em; }
  h1 + p, h2 + p, h3 + p, h4 + p, ul + p, ol + p, table + p, figure + p, blockquote + p, pre + p { text-indent: 0; }
  ul, ol { padding-left: 2.2em; }
  li > p { text-indent: 0; }
  figure { margin: .8em 0; text-align: center; }
  figcaption { font-size: .86em; color: #4b5563; margin-top: .35em; text-indent: 0; }
  table { border-collapse: collapse; width: 100%; font-size: .9em; }
  caption { font-size: .86em; color: #4b5563; margin-bottom: .3em; text-indent: 0; }
  th, td { border: 1px solid #c7ccd1; padding: 3px 6px; text-align: left; }
  thead th { background: #f2f4f6; }
  pre { background: #f6f8fa; border: 1px solid #e5e8eb; border-radius: 4px; padding: 8px 10px; font: 9.5pt/1.55 Consolas, Menlo, monospace; white-space: pre-wrap; overflow-wrap: anywhere; text-indent: 0; }
  code { font-family: Consolas, Menlo, monospace; font-size: .92em; }
  img, svg { max-width: 100%; height: auto; }
  blockquote { padding-left: 1em; border-left: 3px solid #d0d7de; color: #4b5563; }
  blockquote p { text-indent: 0; }
  hr { border: 0; border-top: 1px solid #d0d7de; }
  `)
}

/** 代码高亮配色（GitHub Light 系，与 notebook.css / rich-content.css 同值）。 */
function tokenColors(root) {
  const s = (rule) => rule.split('\n').map((line) => line.trim()).filter(Boolean)
    .map((line) => root + line).join('\n')
  return s(`
  .token.comment, .token.prolog, .token.doctype, .token.cdata { color: #6e7781; }
  .token.punctuation { color: #57606a; }
  .token.property, .token.tag, .token.boolean, .token.number, .token.constant, .token.symbol { color: #0550ae; }
  .token.selector, .token.attr-name, .token.string, .token.char, .token.builtin, .token.inserted { color: #0a7b45; }
  .token.operator, .token.entity, .token.url, .language-css .token.string, .style .token.string { color: #953800; }
  .token.atrule, .token.attr-value, .token.keyword { color: #cf222e; }
  .token.function, .token.class-name { color: #8250df; }
  .token.regex, .token.important, .token.variable { color: #116329; }
  `)
}

/** 离屏测量用的整段 CSS（注入 <style id="nb-measure-style">）。 */
export const MEASURE_CSS = `
  .nb-measure-root {
    width: ${SHEET_WIDTH_PX}px; box-sizing: border-box;
    font: 11.5pt/1.75 "Songti SC", "Source Han Serif SC", "SimSun", Georgia, serif;
    color: #16181c;
  }
  .nb-measure-root .nb-flow > * + * { margin-top: .6em; }
  .nb-measure-root button, .nb-measure-root input { display: none; }
${typography('.nb-measure-root ')}
${tokenColors('.nb-measure-root ')}
`

/** 打印 iframe 的整段样式（@page + 每张纸 + 正文排版 + 高亮色）。 */
export const PRINT_CSS = `
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0; color: #16181c;
    font: 11.5pt/1.75 "Songti SC", "Source Han Serif SC", "SimSun", Georgia, serif;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .nb-print-sheet { break-after: page; }
  .nb-print-sheet:last-child { break-after: auto; }
  .nb-flow > * + * { margin-top: .6em; }
  .nb-flow, .nb-flow * { break-inside: auto; }
  h1, h2, h3, caption, figcaption { break-after: avoid; }
  .nb-ln { display: block; }
  button, input { display: none; }
${typography('')}
${tokenColors('')}
`
