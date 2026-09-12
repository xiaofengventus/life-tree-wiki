import assert from "node:assert/strict";
import test from "node:test";
import { codeSampleHtml, parseCodeSampleText } from "../src/utils/codeSample.js";

test("有分隔符时切成输入与输出两段", () => {
  const parsed = parseCodeSampleText("5\n11 22 33\n---\n99\n88");
  assert.equal(parsed.hasSeparator, true);
  assert.equal(parsed.input, "5\n11 22 33");
  assert.equal(parsed.output, "99\n88");
});

test("=== 也作为分隔符", () => {
  const parsed = parseCodeSampleText("a\n===\nb");
  assert.equal(parsed.hasSeparator, true);
  assert.equal(parsed.input, "a");
  assert.equal(parsed.output, "b");
});

test("没有分隔符时整段都算输入", () => {
  const parsed = parseCodeSampleText("a\nb");
  assert.equal(parsed.hasSeparator, false);
  assert.equal(parsed.input, "a\nb");
  assert.equal(parsed.output, "");
});

test("首尾空行被裁掉", () => {
  const parsed = parseCodeSampleText("\n\n 5 \n\n---\n\n 9 \n\n");
  assert.equal(parsed.input, " 5 ");
  assert.equal(parsed.output, " 9 ");
});

test("渲染两栏时带上同一个序号", () => {
  const html = codeSampleHtml("1\n---\n2", 3);
  assert.match(html, /life-code-sample-pane is-input/);
  assert.match(html, /life-code-sample-pane is-output/);
  assert.match(html, /输入<em>#3<\/em>/);
  assert.match(html, /输出<em>#3<\/em>/);
});

test("没有分隔符时只渲染输入一栏", () => {
  const html = codeSampleHtml("only", 0);
  assert.match(html, /is-single/);
  assert.ok(!html.includes("is-output"));
  assert.ok(!html.includes("输出"));
});

test("两侧内容都用 pre code 承载，好让复制按钮复用", () => {
  const html = codeSampleHtml("a\n---\nb", 0);
  assert.equal((html.match(/<pre class="life-code-sample-body"><code>/g) || []).length, 2);
});

test("内容里的 HTML 会被转义", () => {
  const html = codeSampleHtml('<img src=x onerror="alert(1)">\n---\n<b>', 0);
  assert.ok(!html.includes("<img"));
  assert.match(html, /&lt;img/);
  assert.ok(!html.includes("<b>"));
});

test("输出为空时只渲染输入一栏", () => {
  const html = codeSampleHtml("a\n---\n", 0);
  assert.match(html, /is-single/);
  assert.match(html, /life-code-sample-pane is-input/);
  assert.ok(!html.includes("is-output"));
  assert.ok(!html.includes("（空）"));
});

test("输入为空时只渲染输出一栏", () => {
  const html = codeSampleHtml("\n---\nb", 0);
  assert.match(html, /is-single/);
  assert.match(html, /life-code-sample-pane is-output/);
  assert.match(html, /输出<em>#0<\/em>/);
  assert.ok(!html.includes("is-input"));
  assert.ok(!html.includes("（空）"));
});

test("两侧都为空时保留输入占位栏", () => {
  const html = codeSampleHtml("---", 0);
  assert.match(html, /is-single/);
  assert.match(html, /life-code-sample-pane is-input/);
  assert.ok(!html.includes("is-output"));
  assert.match(html, /（空）/);
});

test("序号非法时退回 0", () => {
  assert.match(codeSampleHtml("a", -1), /输入<em>#0<\/em>/);
  assert.match(codeSampleHtml("a", 1.5), /输入<em>#0<\/em>/);
});
