import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
await page.waitForTimeout(1200);

await page.evaluate(() => {
  const area = document.querySelector(".w-e-text-container [contenteditable]");
  area?.focus();
});
await page.waitForTimeout(250);
await page.evaluate(() =>
  document.querySelector('.w-e-toolbar button[data-menu-key="lifeCodeSample"]')?.click(),
);
await page.waitForTimeout(900);

// 关掉浮动工具栏，免得挡住
await page.evaluate(() =>
  document.querySelector('.w-e-toolbar button[data-menu-key="lifeFloatingTools"]')?.click(),
);
await page.waitForTimeout(400);

const box = await page.evaluate(() => {
  const pre = document.querySelector(".w-e-text-container pre");
  if (!pre) return null;
  pre.scrollIntoView({ block: "center" });
  const r = pre.getBoundingClientRect();
  return {
    x: Math.max(0, Math.round(r.left - 40)),
    y: Math.max(0, Math.round(r.top - 70)),
    width: Math.min(900, Math.round(r.width + 80)),
    height: Math.round(r.height + 110),
    text: JSON.stringify(pre.textContent),
  };
});
console.log("代码块: " + JSON.stringify(box));
if (box) {
  await page.screenshot({ path: ".local-3d/sample-empty.png", clip: box });
  console.log("已截图");
}
await browser.close();
