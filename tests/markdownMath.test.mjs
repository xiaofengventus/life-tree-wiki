import assert from "node:assert/strict";
import test from "node:test";
import { micromark } from "micromark";
import { math } from "micromark-extension-math";
import { mathSourceHtml } from "../src/utils/micromarkMathSourceHtml.js";

function markdownMath(source) {
  return micromark(source, {
    extensions: [math()],
    htmlExtensions: [mathSourceHtml()],
  });
}

test("Markdown math keeps inline LaTeX as a controlled source node", () => {
  assert.equal(
    markdownMath("Energy $E=mc^2$."),
    '<p>Energy <span data-life-math="inline" data-latex="E=mc^2">E=mc^2</span>.</p>',
  );
});

test("Markdown math recognizes fenced and same-line double-dollar blocks", () => {
  assert.equal(
    markdownMath("$$\n\\int_0^1 x^2 dx\n$$"),
    '<div data-life-math="block" data-latex="\\int_0^1 x^2 dx">\\int_0^1 x^2 dx</div>',
  );
  assert.match(
    markdownMath("Before $$x^2+y^2$$ after"),
    /<div data-life-math="block" data-latex="x\^2\+y\^2">x\^2\+y\^2<\/div>/,
  );
});

test("Markdown math ignores code and escaped dollar signs", () => {
  assert.equal(
    markdownMath("`$not_math$` and \\$money"),
    "<p><code>$not_math$</code> and $money</p>",
  );
});

test("Markdown math escapes formula source attributes and text", () => {
  const html = markdownMath("$x<y$");
  assert.match(html, /data-latex="x&lt;y"/);
  assert.match(html, />x&lt;y<\/span>/);
});
