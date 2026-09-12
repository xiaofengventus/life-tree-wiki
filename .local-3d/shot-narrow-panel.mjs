import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 760, height: 820 }, deviceScaleFactor: 2 });
await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
await page.waitForTimeout(1000);
// 先把工具栏滚到最右，露出导入按钮
await page.evaluate(() => {
  const bar = document.querySelector(".editor-toolbar-fixed");
  bar.scrollLeft = 99999;
});
await page.waitForTimeout(300);
await page.evaluate(() => document.querySelector('.w-e-toolbar button[data-menu-key="lifeImportDoc"]')?.click());
await page.waitForTimeout(800);
const info = await page.evaluate(() => {
  const bar = document.querySelector(".editor-toolbar-fixed");
  const panel = document.querySelector(".w-e-drop-panel");
  const pr = panel.getBoundingClientRect();
  const br = bar.getBoundingClientRect();
  return {
    overflowY: getComputedStyle(bar).overflowY,
    panel: { top: Math.round(pr.top), bottom: Math.round(pr.bottom), h: Math.round(pr.height) },
    bar: { top: Math.round(br.top), bottom: Math.round(br.bottom) },
    clippedByBar: pr.bottom > br.bottom,
    inViewport: pr.bottom <= window.innerHeight && pr.top >= 0,
  };
});
await page.screenshot({ path: ".local-3d/narrow-panel.png", clip: { x: 0, y: 56, width: 760, height: 340 } });
console.log(JSON.stringify(info));
await browser.close();
