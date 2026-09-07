import assert from "node:assert/strict";
import test from "node:test";
import { micromark } from "micromark";
import { gfm, gfmHtml } from "micromark-extension-gfm";
import { math } from "micromark-extension-math";
import { mathSourceHtml } from "../src/utils/micromarkMathSourceHtml.js";
import {
  highlightCodeText,
  normalizeCodeLanguage,
  safeCodeLanguage,
} from "../src/utils/richHtml.js";

function markdownGfm(source) {
  return micromark(source, {
    allowDangerousHtml: false,
    allowDangerousProtocol: false,
    extensions: [gfm(), math()],
    htmlExtensions: [gfmHtml(), mathSourceHtml()],
  });
}

test("GFM tables keep alignment metadata for the sanitizer", () => {
  const html = markdownGfm("| left | right |\n| :--- | ---: |\n| A | B |");
  assert.match(html, /<table>/);
  assert.match(html, /<th align="left">left<\/th>/);
  assert.match(html, /<th align="right">right<\/th>/);
});

test("GFM supports strikethrough, task lists, and automatic links", () => {
  const html = markdownGfm("- [x] done\n- [ ] todo\n\n~~old~~ www.example.com");
  assert.match(html, /<input type="checkbox" disabled="" checked="" \/>/);
  assert.match(html, /<input type="checkbox" disabled="" \/>/);
  assert.match(html, /<del>old<\/del>/);
  assert.match(html, /href="http:\/\/www\.example\.com"/);
});

test("fenced code keeps its language name", () => {
  const html = markdownGfm("```typescript\nconst answer: number = 42\n```");
  assert.match(html, /<code class="language-typescript">/);
});

test("static syntax highlighting escapes source and accepts safe aliases only", () => {
  const html = highlightCodeText('const value = "<script>";', "js");
  assert.match(html, /token keyword/);
  assert.match(html, /&lt;script>/);
  assert.doesNotMatch(html, /<script>/);
  assert.equal(normalizeCodeLanguage("TS"), "typescript");
  assert.equal(safeCodeLanguage('js" onclick="alert(1)'), "");
});
