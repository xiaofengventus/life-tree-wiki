/**
 * 验证「整条工具栏共用一条横向滚动条」：
 * 1) 不折行  2) 能横向滚动  3) 滚动时左侧引用按钮 / 右侧开关是否一起移动
 * 4) 打开下拉时面板有没有被裁
 * node .local-3d/toolbar-unified.mjs
 */
import { chromium } from "playwright";

const browser = await chromium.launch();

const probe = async (width) => {
  const page = await browser.newPage({ viewport: { width, height: 800 } });
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message).slice(0, 160)));
  await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
  await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
  await page.waitForTimeout(900);

  const base = await page.evaluate(() => {
    const bar = document.querySelector(".editor-toolbar-fixed");
    const wt = document.querySelector(".w-e-toolbar");
    const items = [...wt.querySelectorAll(".w-e-bar-item")].map((el) => el.getBoundingClientRect());
    const tops = [...new Set(items.map((b) => Math.round(b.top)))];
    const cit = document.querySelector(".citation-panel-toggle-btn").getBoundingClientRect();
    const extras = document.querySelector(".editor-toolbar-extras").getBoundingClientRect();
    return {
      rows: tops.length,
      wToolbarH: Math.round(wt.getBoundingClientRect().height),
      barScrollW: bar.scrollWidth,
      barClientW: bar.clientWidth,
      canScroll: bar.scrollWidth > bar.clientWidth + 1,
      citationX: Math.round(cit.x),
      citationVisible: cit.width > 0 && cit.height > 0,
      extrasRight: Math.round(extras.right),
      extrasVisible: extras.width > 0,
    };
  });

  // 滚动到底，看两侧元素是否跟随移动
  const afterScroll = await page.evaluate(() => {
    const bar = document.querySelector(".editor-toolbar-fixed");
    bar.scrollLeft = 99999;
    const cit = document.querySelector(".citation-panel-toggle-btn").getBoundingClientRect();
    const extras = document.querySelector(".editor-toolbar-extras").getBoundingClientRect();
    return {
      scrollLeft: bar.scrollLeft,
      citationX: Math.round(cit.x),
      extrasRight: Math.round(extras.right),
    };
  });

  // 复位并打开「正文」下拉，检查是否被裁
  await page.evaluate(() => {
    document.querySelector(".editor-toolbar-fixed").scrollLeft = 0;
  });
  await page.locator('.w-e-toolbar [data-menu-key="headerSelect"]').first().click();
  await page.waitForTimeout(600);
  const panel = await page.evaluate(() => {
    const list = document.querySelector(".w-e-select-list");
    if (!list) return { found: false };
    const r = list.getBoundingClientRect();
    const hit = document.elementFromPoint(
      Math.round(r.left + r.width / 2),
      Math.round(r.bottom - 12),
    );
    const bar = document.querySelector(".editor-toolbar-fixed");
    return {
      found: true,
      panelH: Math.round(r.height),
      hasPanelOpenClass: bar.classList.contains("is-panel-open"),
      barOverflowY: getComputedStyle(bar).overflowY,
      bottomPointHitsPanel: Boolean(hit && list.contains(hit)),
    };
  });

  await page.close();
  return { width, base, afterScroll, panel, errs };
};

for (const w of [760, 1024, 1280, 1520]) {
  const r = await probe(w);
  console.log(JSON.stringify(r));
}

await browser.close();
