// HTML 页面外壳：把渲染结果包成一份可直接打开的文档。
//
// 数学渲染走 KaTeX，从 CDN 加载；**加载失败时原始 TeX 仍然可见**（不是空白），
// 这是有意为之——"静默失败"正是现有网站 KaTeX 那层的问题，不在这里重犯。

const CSS = `
:root { color-scheme: light; }
* { box-sizing: border-box; }
body {
  margin: 0;
  background: #ffffff;
  color: #1f2328;
  font: 16px/1.75 -apple-system, "Segoe UI", "Microsoft YaHei", "PingFang SC", sans-serif;
}
.laup-doc { max-width: 780px; margin: 0 auto; padding: 48px 24px 96px; }
.laup-doc > :first-child { margin-top: 0; }
h1, h2, h3, h4, h5, h6 { line-height: 1.35; margin: 1.8em 0 .6em; font-weight: 600; }
h1 { font-size: 28px; }
h2 { font-size: 23px; padding-bottom: .3em; border-bottom: 1px solid #e6e8eb; }
h3 { font-size: 19px; }
h4 { font-size: 17px; }
p { margin: .9em 0; }
a { color: #185fa5; }
hr { border: 0; border-top: 1px solid #e6e8eb; margin: 2em 0; }
blockquote {
  margin: 1.2em 0; padding: .2em 1.1em;
  border-left: 3px solid #cfd6dd; background: #fafbfc; color: #444d56;
}
blockquote > :first-child { margin-top: .6em; }
blockquote > :last-child { margin-bottom: .6em; }
ul, ol { padding-left: 1.6em; margin: .9em 0; }
li { margin: .3em 0; }
li.laup-task { list-style: none; margin-left: -1.4em; }
li.laup-task input { margin-right: .5em; }
code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: .88em; background: #f2f4f6; padding: .15em .4em; border-radius: 4px;
}
pre {
  background: #f6f8fa; border: 1px solid #e6e8eb; border-radius: 8px;
  padding: 14px 16px; overflow-x: auto; margin: 1.2em 0;
}
pre code { background: none; padding: 0; font-size: .86em; line-height: 1.6; }
table {
  border-collapse: collapse; width: 100%; margin: 1.4em 0; font-size: .95em;
}
th, td { border: 1px solid #d8dee4; padding: 8px 12px; text-align: left; vertical-align: top; }
th { background: #f6f8fa; font-weight: 600; }
caption { caption-side: top; text-align: left; color: #57606a; font-size: .9em; padding-bottom: .5em; }
figure { margin: 1.6em 0; text-align: center; }
figure img { max-width: 100%; border: 1px solid #e6e8eb; border-radius: 8px; }
figcaption { margin-top: .6em; color: #57606a; font-size: .88em; text-align: center; }
.laup-center { text-align: center; }
.laup-toc {
  border: 1px solid #e6e8eb; border-radius: 8px; padding: 14px 18px;
  background: #fafbfc; margin: 1.6em 0; font-size: .94em;
}
.laup-toc-title { font-weight: 600; margin-bottom: .4em; color: #57606a; }
.laup-toc ul { list-style: none; padding-left: 0; margin: 0; }
.laup-toc a { text-decoration: none; }
.laup-toc-l2 { padding-left: 0; }
.laup-toc-l3 { padding-left: 1.2em; }
.laup-toc-l4, .laup-toc-l5, .laup-toc-l6 { padding-left: 2.4em; }
.laup-math, .laup-math-display { font-family: Consolas, "SFMono-Regular", monospace; }
.laup-math { background: #f2f4f6; border-radius: 4px; padding: .1em .35em; font-size: .9em; }
.laup-math-display {
  display: block; text-align: center; margin: 1.2em 0; font-size: .95em;
  background: #f6f8fa; border: 1px dashed #d8dee4; border-radius: 8px; padding: 12px;
}
.laup-tex-ok { background: none; border: 0; padding: 0; }
.laup-equation { display: flex; align-items: center; gap: 12px; margin: 1.4em 0; }
.laup-equation .laup-math-display { flex: 1; margin: 0; }
.laup-eq-no { color: #57606a; font-size: .9em; white-space: nowrap; }
.laup-eqref { text-decoration: none; }
.laup-eqref-bad { color: #a32d2d; }
.laup-fn-ref {
  font-size: .72em; color: #185fa5; cursor: default;
  vertical-align: super; margin: 0 .1em;
}
.laup-footnotes { margin-top: 3em; font-size: .9em; color: #444d56; }
.laup-footnotes ol { padding-left: 1.4em; }
.laup-meta {
  max-width: 780px; margin: 0 auto; padding: 0 24px 64px;
  color: #8c959f; font-size: 12px;
}
`;

const KATEX = '0.16.9';

export function renderPage({ title, body, meta = '' }) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeAttr(title || 'Laup 文档')}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@${KATEX}/dist/katex.min.css">
<style>${CSS}</style>
</head>
<body>
<article class="laup-doc">
${body}
</article>
${meta ? `<div class="laup-meta">${meta}</div>` : ''}
<script defer src="https://cdn.jsdelivr.net/npm/katex@${KATEX}/dist/katex.min.js"></script>
<script>
(function () {
  var tries = 0;
  function run() {
    if (!window.katex) {
      if (tries++ < 20) setTimeout(run, 150);
      return;
    }
    document.querySelectorAll('[data-tex]').forEach(function (el) {
      try {
        katex.render(el.getAttribute('data-tex'), el, {
          displayMode: el.classList.contains('laup-math-display'),
          throwOnError: false
        });
        el.classList.add('laup-tex-ok');
      } catch (e) {
        el.setAttribute('title', 'KaTeX 渲染失败，已保留原始 TeX');
      }
    });
  }
  window.addEventListener('load', run);
})();
</script>
</body>
</html>`;
}

function escapeAttr(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
