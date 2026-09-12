import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 760, height: 820 } });
const errs = [];
page.on("pageerror", (e) => errs.push(String(e.message).slice(0, 200)));
await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
await page.waitForTimeout(1200);

const report = async (label) => {
  const r = await page.evaluate(() => {
    const bar = document.querySelector(".editor-toolbar-fixed");
    const panel = document.querySelector(".w-e-drop-panel");
    const pr = panel ? panel.getBoundingClientRect() : null;
    return {
      scrollLeft: bar.scrollLeft,
      overflowY: getComputedStyle(bar).overflowY,
      isPanelOpen: bar.classList.contains("is-panel-open"),
      transformVar: bar.style.getPropertyValue("--life-toolbar-scroll-x") || "(none)",
      panel: pr
        ? {
            l: Math.round(pr.left),
            r: Math.round(pr.right),
            t: Math.round(pr.top),
            b: Math.round(pr.bottom),
          }
        : null,
      panelOnScreen: pr
        ? pr.left >= 0 && pr.right <= window.innerWidth && pr.top >= 0 && pr.bottom <= window.innerHeight
        : null,
    };
  });
  console.log("[" + label + "] " + JSON.stringify(r));
  return r;
};

// 1) 滚到最右，再点「导入」
await page.evaluate(() => {
  document.querySelector(".editor-toolbar-fixed").scrollLeft = 99999;
});
await page.waitForTimeout(300);
await report("滚动后(未开面板)");
await page.evaluate(() =>
  document.querySelector('.w-e-toolbar button[data-menu-key="lifeImportDoc"]')?.click(),
);
await page.waitForTimeout(800);
const opened = await report("点导入·面板打开");

// 2) 点空白关面板，看滚动量是否还原
await page.mouse.click(380, 780);
await page.waitForTimeout(600);
const closed = await report("关面板后");

// 3) 再开一次，确认可重复
await page.evaluate(() =>
  document.querySelector('.w-e-toolbar button[data-menu-key="lifeImportDoc"]')?.click(),
);
await page.waitForTimeout(800);
await report("二次打开");

// 4) 真实鼠标点击（模拟用户右键滚动后点按钮）
await page.mouse.click(380, 780);
await page.waitForTimeout(500);
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
await page.mouse.click(box.x, box.y);
await page.waitForTimeout(800);
await report("真实鼠标点击导入");
await page.screenshot({
  path: ".local-3d/narrow-panel-fixed.png",
  clip: { x: 0, y: 60, width: 760, height: 240 },
});

console.log("判定 打开时面板在视口内: " + opened.panelOnScreen);
console.log("判定 关闭后滚动还原到 416: " + closed.scrollLeft);
console.log("报错: " + JSON.stringify(errs));
await browser.close();
