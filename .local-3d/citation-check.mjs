/**
 * 点开「参考文献」按钮后的截图，验证引用面板能正常弹出。
 * node .local-3d/citation-check.mjs <out.png> [width]
 */
import { chromium } from "playwright";

const out = process.argv[2] || ".local-3d/citation.png";
const width = Number(process.argv[3] || 1520);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 900 } });
page.on("pageerror", (e) => console.log("[page-error]", e.message));

await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(2500);

const before = await page.evaluate(() => {
  const panel = document.querySelector(".citation-panel");
  if (!panel) return "面板元素不存在";
  return `收起状态: 面板可见=${panel.offsetParent !== null}`;
});
console.log("点击前 →", before);

await page.click(".citation-panel-toggle-btn");
await page.waitForTimeout(900);

const after = await page.evaluate(() => {
  const panel = document.querySelector(".citation-panel");
  const rect = panel.getBoundingClientRect();
  const toolbar = document.querySelector(".editor-toolbar-fixed").getBoundingClientRect();
  return {
    visible: panel.offsetParent !== null,
    panel: `left=${Math.round(rect.left)} top=${Math.round(rect.top)} w=${Math.round(rect.width)}`,
    toolbarBottom: Math.round(toolbar.bottom),
    hasAddBtn: !!document.querySelector(".citation-add-btn"),
    addBtnText: document.querySelector(".citation-add-btn")?.textContent.trim(),
  };
});
console.log("点击后 →", JSON.stringify(after, null, 1));

await page.screenshot({ path: out });
console.log("saved", out);
await browser.close();
