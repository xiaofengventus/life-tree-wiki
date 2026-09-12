/**
 * 窄屏体检：工具栏折行情况、参考文献按钮可见性、以及
 * 「横向滚动」方案会不会裁掉 wangEditor 下拉面板（用注入样式实验，不改源文件）。
 * node .local-3d/toolbar-narrow.mjs
 */
import { chromium } from "playwright";

const browser = await chromium.launch();

const probe = async (width) => {
  const page = await browser.newPage({ viewport: { width, height: 800 } });
  await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
  await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
  await page.waitForTimeout(900);

  const base = await page.evaluate(() => {
    const bar = document.querySelector(".editor-toolbar-fixed");
    const wt = document.querySelector(".w-e-toolbar");
    const cit = document.querySelector(".citation-panel-toggle-btn");
    const citR = cit.getBoundingClientRect();
    const barR = bar.getBoundingClientRect();
    const items = [...wt.querySelectorAll(".w-e-bar-item")].map((el) => el.getBoundingClientRect());
    const tops = [...new Set(items.map((b) => Math.round(b.top)))].sort((a, b) => a - b);
    return {
      barH: Math.round(barR.height),
      barBottom: Math.round(barR.bottom),
      wToolbarH: Math.round(wt.getBoundingClientRect().height),
      rows: tops.length,
      citation: {
        x: Math.round(citR.x),
        y: Math.round(citR.y),
        w: Math.round(citR.width),
        visible: citR.width > 0 && citR.height > 0,
        insideBar: citR.top >= barR.top - 1 && citR.bottom <= barR.bottom + 1,
      },
      extrasRight: Math.round(document.querySelector(".editor-toolbar-extras").getBoundingClientRect().right),
    };
  });

  // 实验：注入横向滚动样式，看下拉面板会不会被裁
  await page.addStyleTag({
    content: `.editor-toolbar-fixed .w-e-toolbar{flex-wrap:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important}`,
  });
  await page.waitForTimeout(300);
  await page.locator(".w-e-toolbar .w-e-bar-item").first().locator("button").click();
  await page.waitForTimeout(500);
  const scrollTest = await page.evaluate(() => {
    const list = document.querySelector(".w-e-select-list");
    if (!list) return { panel: "none" };
    const r = list.getBoundingClientRect();
    const wt = document.querySelector(".w-e-toolbar").getBoundingClientRect();
    return {
      panel: "found",
      panelTop: Math.round(r.top),
      panelBottom: Math.round(r.bottom),
      panelH: Math.round(r.height),
      wToolbarBottom: Math.round(wt.bottom),
      /* 面板竖直方向是否超出滚动容器（超出即被裁） */
      clippedByContainer: r.bottom > wt.bottom + 1 && r.height > 0,
    };
  });

  await page.close();
  return { width, base, scrollTest };
};

for (const w of [900, 1024, 1180, 1280]) {
  const r = await probe(w);
  console.log(JSON.stringify(r));
}

await browser.close();
