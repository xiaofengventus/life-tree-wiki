import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 820 } });
await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
await page.waitForTimeout(900);

const dump = (label) =>
  page.evaluate((lb) => {
    const bar = document.querySelector(".editor-toolbar-fixed");
    const sel = ".w-e-select-list,.w-e-drop-panel,.w-e-bar-item-menus-container,.w-e-modal";
    const rows = [...bar.querySelectorAll(sel)].map((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        cls: el.className,
        display: cs.display,
        vis: cs.visibility,
        op: cs.opacity,
        w: Math.round(r.width),
        h: Math.round(r.height),
        inlineStyle: el.getAttribute("style") || "",
      };
    });
    return { lb, isPanelOpen: bar.classList.contains("is-panel-open"), overflowY: getComputedStyle(bar).overflowY, rows };
  }, label);

console.log(JSON.stringify(await dump("初始")));

await page.evaluate(() => document.querySelector('.w-e-toolbar button[data-menu-key="lifeImportDoc"]')?.click());
await page.waitForTimeout(500);
console.log(JSON.stringify(await dump("打开导入")));

await page.mouse.click(400, 700);
await page.waitForTimeout(500);
console.log(JSON.stringify(await dump("按 Escape 后")));

await page.mouse.click(500, 500);
await page.waitForTimeout(500);
console.log(JSON.stringify(await dump("点空白后")));

await browser.close();
