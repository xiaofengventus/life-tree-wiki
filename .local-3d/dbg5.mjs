import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 760, height: 820 } });
await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
await page.waitForTimeout(1000);

// 装一个 scroll 监听，记录每次 scrollLeft 变化 + 调用栈
await page.evaluate(() => {
  window.__scrollLog = [];
  const bar = document.querySelector(".editor-toolbar-fixed");
  bar.addEventListener("scroll", () => {
    window.__scrollLog.push({ t: Date.now(), v: bar.scrollLeft });
  });
  // 抓 DOM 重建：监听子节点增删
  window.__mutLog = [];
  new MutationObserver((rs) => {
    for (const r of rs) {
      if (r.addedNodes.length || r.removedNodes.length) {
        window.__mutLog.push({ add: r.addedNodes.length, rm: r.removedNodes.length, target: (r.target.className||"").toString().slice(0,30) });
      }
    }
  }).observe(bar, { childList: true, subtree: true });
});

const set = await page.evaluate(() => { const b = document.querySelector(".editor-toolbar-fixed"); b.scrollLeft = 99999; return b.scrollLeft; });
await page.waitForTimeout(600);
const before = await page.evaluate(() => document.querySelector(".editor-toolbar-fixed").scrollLeft);
console.log("setScroll:", set, "| 600ms 后:", before);

await page.evaluate(() => document.querySelector('.w-e-toolbar button[data-menu-key="lifeImportDoc"]')?.click());
await page.waitForTimeout(900);
const after = await page.evaluate(() => ({
  scrollLeft: document.querySelector(".editor-toolbar-fixed").scrollLeft,
  scrollLog: window.__scrollLog.slice(-8),
  mutCount: window.__mutLog.length,
  mutTail: window.__mutLog.slice(-6),
}));
console.log("点击后:", JSON.stringify(after));
await browser.close();
