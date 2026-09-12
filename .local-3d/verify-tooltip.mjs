import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 820 } });
const errs = [];
page.on("pageerror", (e) => errs.push(String(e.message).slice(0, 200)));
page.on("console", (m) => {
  if (m.type() === "error") errs.push("console: " + m.text().slice(0, 150));
});
await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
await page.waitForTimeout(1000);

const state = () =>
  page.evaluate(() => {
    const bar = document.querySelector(".editor-toolbar-fixed");
    return {
      open: bar.classList.contains("is-panel-open"),
      overflowY: getComputedStyle(bar).overflowY,
      scrollLeft: Math.round(bar.scrollLeft),
      var: bar.style.getPropertyValue("--life-toolbar-scroll-x") || "(无)",
      transform: getComputedStyle(bar.querySelector(":scope > div")).transform,
    };
  });

// 初始态
console.log("初始:", JSON.stringify(await state()));

// 记录滚动量后再悬停（900px 下工具栏可滚吗？先滚一点，若不可滚 scrollLeft 停 0）
await page.evaluate(() => {
  document.querySelector(".editor-toolbar-fixed").scrollLeft = 120;
});
await page.waitForTimeout(200);
console.log("滚动后:", JSON.stringify(await state()));

// 悬停加粗按钮（带 data-tooltip）
await page.hover('.w-e-toolbar button[data-menu-key="bold"]');
await page.waitForTimeout(400);
const hoverState = await state();
// 伪元素内容是否可见（overflow 放开后必然可见）
const tooltipShown = await page.evaluate(() => {
  const btn = document.querySelector('.w-e-toolbar button[data-menu-key="bold"]');
  const cs = getComputedStyle(btn, "::after");
  return { content: cs.content.slice(0, 40), display: cs.display, position: cs.position };
});
console.log("悬停加粗:", JSON.stringify(hoverState), "伪元素:", JSON.stringify(tooltipShown));

// 移开（悬停到页面正文空白处）
await page.mouse.move(450, 600);
await page.waitForTimeout(400);
console.log("移开后:", JSON.stringify(await state()));

// 悬停时点开的下拉面板不受影响
await page.hover('.w-e-toolbar button[data-menu-key="bold"]');
await page.waitForTimeout(200);
await page.evaluate(() =>
  document.querySelector('.w-e-toolbar button[data-menu-key="lifeImportDoc"]')?.click(),
);
await page.waitForTimeout(500);
const panelOpen = await page.evaluate(() => {
  const bar = document.querySelector(".editor-toolbar-fixed");
  const panel = document.querySelector(".w-e-drop-panel");
  return { open: bar.classList.contains("is-panel-open"), panel: Boolean(panel) };
});
console.log("悬停中点导入:", JSON.stringify(panelOpen));
await page.mouse.click(450, 600);
await page.waitForTimeout(300);
console.log("收尾:", JSON.stringify(await state()));
console.log("报错:", JSON.stringify(errs));
await browser.close();
