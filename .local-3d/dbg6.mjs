import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 760, height: 820 } });
await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
await page.waitForTimeout(1000);

const scrollNow = () =>
  page.evaluate(() => document.querySelector(".editor-toolbar-fixed").scrollLeft);

const test = async (label, fn) => {
  await page.evaluate(() => {
    document.querySelector(".editor-toolbar-fixed").scrollLeft = 99999;
  });
  await page.waitForTimeout(300);
  const s0 = await scrollNow();
  await fn();
  await page.waitForTimeout(700);
  const s1 = await scrollNow();
  const verdict = s1 === 0 ? "重置" : "保持";
  console.log("[" + verdict + "] " + label + ": " + s0 + " -> " + s1);
  await page.mouse.click(380, 780);
  await page.waitForTimeout(400);
};

await test("加粗（无面板）", () =>
  page.evaluate(() =>
    document.querySelector('.w-e-toolbar button[data-menu-key="bold"]')?.click(),
  ),
);
await test("引用开关（无面板）", () =>
  page.evaluate(() =>
    document.querySelector('.w-e-toolbar button[data-menu-key="lifeCitationPanel"]')?.click(),
  ),
);
await test("导入（有面板）", () =>
  page.evaluate(() =>
    document.querySelector('.w-e-toolbar button[data-menu-key="lifeImportDoc"]')?.click(),
  ),
);

// 真实鼠标点击
await page.evaluate(() => {
  document.querySelector(".editor-toolbar-fixed").scrollLeft = 99999;
});
await page.waitForTimeout(300);
const box = await page.evaluate(() => {
  const b = document.querySelector('.w-e-toolbar button[data-menu-key="lifeImportDoc"]');
  const r = b.getBoundingClientRect();
  return {
    x: Math.round(r.left + r.width / 2),
    y: Math.round(r.top + r.height / 2),
    inView: r.left >= 0 && r.right <= window.innerWidth,
  };
});
console.log("导入按钮位置: " + JSON.stringify(box));
await page.mouse.click(box.x, box.y);
await page.waitForTimeout(700);
const real = await page.evaluate(() => {
  const bar = document.querySelector(".editor-toolbar-fixed");
  const p = document.querySelector(".w-e-drop-panel");
  const r = p ? p.getBoundingClientRect() : null;
  return {
    scrollLeft: bar.scrollLeft,
    panel: r ? { l: Math.round(r.left), r: Math.round(r.right) } : null,
  };
});
console.log("真实点击后: " + JSON.stringify(real));
await browser.close();
