import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 760, height: 820 } });
await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
await page.waitForTimeout(900);
await page.evaluate(() => document.querySelector('.w-e-toolbar button[data-menu-key="lifeImportDoc"]')?.click());
await page.waitForTimeout(900);
const out = await page.evaluate(() => {
  const bar = document.querySelector(".editor-toolbar-fixed");
  const panel = document.querySelector(".w-e-drop-panel");
  const r = panel.getBoundingClientRect();
  const br = bar.getBoundingClientRect();
  const sample = (x, y) => {
    const el = document.elementFromPoint(x, y);
    return el ? (panel.contains(el) ? "panel" : el.className || el.tagName) : "null";
  };
  const cx = Math.round(r.left + r.width / 2);
  return {
    overflowY: getComputedStyle(bar).overflowY,
    bar: { top: br.top, bottom: br.bottom },
    panel: { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom) },
    hits: {
      centerBottom: sample(cx, Math.round(r.bottom - 8)),
      centerMid: sample(cx, Math.round(r.top + r.height / 2)),
      leftMid: sample(Math.max(2, Math.round(r.left + 12)), Math.round(r.top + r.height / 2)),
    },
    hoverBar: Boolean(document.querySelector(".w-e-hover-bar")),
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
