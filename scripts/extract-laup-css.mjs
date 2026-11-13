// 从 Laup 仓库的 editor/index.html 抽出样式，改造成站点可用的 laup.css。
//
// 为什么要脚本而不是手抄：那份样式是 Laup 的"编辑面与阅读面同一视角"的载体，
// 手抄一遍必然会漂。以后 Laup 上游改了样式，重跑这个脚本即可。
//
// 用法：node scripts/extract-laup-css.mjs
//
// 改造点（都是"嵌进宿主页面"必须做的，与样式本身无关）：
//   · `:root`  → `.laup-app, .laup-doc`  —— 站点的全局变量名（--bg/--line/--soft…）
//     多半已被占用，把 Laup 的变量关进自己的两个容器里就不打架。
//   · `body`   → `.laup-app`（编辑器根）—— 组件里不该改宿主的 body。
//   · `html, body { min-height }` 删掉 —— 高度由宿主页面管。
//   · `body[data-*]` → `.laup-app[data-*]` —— 调参面板写在这两个属性上。
//   · `*`      → 限定在两个容器内，避免污染整站。
//   · `.chrome` 的 sticky 起点从 0 改成 64px —— 站点的 navBar 就占着最上面 64px。

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const srcPath = resolve(here, "../../Laup/editor/index.html");
const outPath = resolve(here, "../src/laup/laup.css");

const html = readFileSync(srcPath, "utf8");
const match = html.match(/<style>([\s\S]*?)<\/style>/);
if (!match) throw new Error(`没在 ${srcPath} 里找到 <style> 段`);

let css = match[1];

const replacements = [
  ["* { box-sizing: border-box; }",
   ".laup-app, .laup-app *, .laup-doc, .laup-doc * { box-sizing: border-box; }"],
  [":root {", ".laup-app, .laup-doc {"],
  ["html, body { min-height: 100%; }\n", ""],
  ["body {\n  margin: 0;", ".laup-app {\n  margin: 0;"],
  ["body[data-hover-mark=", ".laup-app[data-hover-mark="],
  ["body[data-gutter=", ".laup-app[data-gutter="],
  [".chrome {\n  position: sticky; top: 0;", ".chrome {\n  position: sticky; top: 64px;"],
];

const missed = [];
for (const [from, to] of replacements) {
  if (!css.includes(from)) {
    missed.push(from.slice(0, 44).replace(/\n/g, "\\n"));
    continue;
  }
  css = css.split(from).join(to);
}

// 阅读端只用到内容排版那一半：给它一份等价的字体与底色（原本由 body 提供，
// 而站点上这块内容不是 body）。
const readerTail = `
/* ── 阅读端的内容容器（Laup 正文在站内阅读页里就住在这儿）
   字体/底色原本是 index.html 的 body 给的，站点的阅读页没有那个 body，
   所以在这里补齐；只补这两条，其余排版全部复用上面同一份规则。 */
.laup-doc {
  margin: 0; background: var(--bg); color: var(--fg);
  font: 15px/1.75 -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
}
`;

const header = `/* 生成物 —— 别手改这个文件。
 *
 * 来源：Laup 仓库 editor/index.html 的 <style>，由 scripts/extract-laup-css.mjs 抽出并改造。
 * 重跑：node scripts/extract-laup-css.mjs
 *
 * 这份样式同时供**编辑器**（.laup-app 内）与**阅读端**（.laup-doc 内）使用 ——
 * 「编辑面与阅读面同一视角」靠的就是这同一份规则，不是两边各写一套。
 */
`;

writeFileSync(outPath, header + css.trimEnd() + "\n" + readerTail, "utf8");

console.log(`已写出 ${outPath}`);
console.log(`  原始样式 ${match[1].split("\n").length} 行 → 产出 ${(header + css + readerTail).split("\n").length} 行`);
if (missed.length) {
  console.warn(`⚠️ 有 ${missed.length} 条替换没命中（Laup 上游可能改过这几处，需人工核对）：`);
  for (const m of missed) console.warn(`   ${m}`);
} else {
  console.log("  7 条替换全部命中");
}
