import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 760, height: 820 }, deviceScaleFactor: 2 });
await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
await page.waitForTimeout(1000);

const setScroll = () => page.evaluate(() => {
  const bar = document.querySelector(".editor-toolbar-fixed");
  bar.scrollLeft = 99999;
  return bar.scrollLeft;
});

// A. 只滚动，不点：看整条工具栏最右端
console.log("scrollA =", await setScroll());
await page.waitForTimeout(400);
await page.screenshot({ path: ".local-3d/narrow-right.png", clip: { x: 0, y: 60, width: 760, height: 70 } });

// B. 再开面板（滚动后再点，看面板是否完整显示）
await page.evaluate(() => document.querySelector('.w-e-toolbar button[data-menu-key="lifeImportDoc"]')?.click());
await page.waitForTimeout(800);
const info = await page.evaluate(() => {
  const bar = document.querySelector(".editor-toolbar-fixed");
  const panel = document.querySelector(".w-e-drop-panel");
  const pr = panel.getBoundingClientRect();
  return {
    scrollLeft: bar.scrollLeft,
    overflowY: getComputedStyle(bar).overflowY,
    panelRect: { l: Math.round(pr.left), r: Math.round(pr.right), t: Math.round(pr.top), b: Math.round(pr.bottom) },
    fullyInViewport: pr.left >= 0 && pr.right <= window.innerWidth && pr.top >= 0 && pr.bottom <= window.innerHeight,
  };
});
console.log(JSON.stringify(info));
await page.screenshot({ path: ".local-3d/narrow-panel2.png", clip: { x: 0, y: 60, width: 760, height: 230 } });
await browser.close();
