import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 760, height: 820 } });
const logs = [];
page.on("console", (m) => { const t = m.text(); if (t.includes("[TB]")) logs.push(t); });
await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
await page.waitForTimeout(1000);
logs.push("--- 点导入 ---");
await page.evaluate(() => document.querySelector('.w-e-toolbar button[data-menu-key="lifeImportDoc"]')?.click());
await page.waitForTimeout(1200);
const state = await page.evaluate(() => {
  const bar = document.querySelector(".editor-toolbar-fixed");
  const panel = document.querySelector(".w-e-drop-panel");
  return {
    isPanelOpen: bar.classList.contains("is-panel-open"),
    overflowY: getComputedStyle(bar).overflowY,
    panelDisplay: panel ? getComputedStyle(panel).display : null,
    panelIsInsideBar: panel ? bar.contains(panel) : null,
  };
});
console.log(logs.join("\n"));
console.log("STATE", JSON.stringify(state));
await browser.close();
