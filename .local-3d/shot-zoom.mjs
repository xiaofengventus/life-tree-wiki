import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1520, height: 900 }, deviceScaleFactor: 3 });
await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
await page.waitForTimeout(1200);
// 打开导入下拉，顺便看面板
await page.evaluate(() => document.querySelector('.w-e-toolbar button[data-menu-key="lifeImportDoc"]')?.click());
await page.waitForTimeout(700);
const box = await page.evaluate(() => {
  const bar = document.querySelector(".editor-toolbar-fixed");
  const btn = document.querySelector('.w-e-toolbar button[data-menu-key="lifeFloatingTools"]');
  const r = btn.getBoundingClientRect();
  return { x: Math.round(r.left - 300), y: 56, width: 560, height: 200 };
});
await page.screenshot({ path: ".local-3d/final-right.png", clip: box });
console.log("saved", JSON.stringify(box));
await browser.close();
