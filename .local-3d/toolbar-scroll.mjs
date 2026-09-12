/**
 * 窄屏横向滚动方案验证：
 * 1) 是否还折行   2) 能否横向滚动   3) 打开下拉时面板有没有被裁
 * node .local-3d/toolbar-scroll.mjs
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
    return {
      barH: Math.round(bar.getBoundingClientRect().height),
      wToolbarH: Math.round(wt.getBoundingClientRect().height),
      rows: tops.length,
      scrollW: wt.scrollWidth,
      clientW: wt.clientWidth,
      canScroll: wt.scrollWidth > wt.clientWidth + 1,
      citationVisible: cit.width > 0 && cit.height > 0,
      citationX: Math.round(cit.x),
      extrasRight: Math.round(document.querySelector(".editor-toolbar-extras").getBoundingClientRect().right),
    };
  });

  // 横向滚动是否真的生效
  const scrolled = await page.evaluate(() => {
    const wt = document.querySelector(".w-e-toolbar");
    wt.scrollLeft = 9999;
    return wt.scrollLeft;
  });

  // 打开「正文」下拉，检查面板是否完整可见（用 elementFromPoint 反查命中）
  await page.evaluate(() => {
    document.querySelector(".w-e-toolbar").scrollLeft = 0;
  });
  await page.locator('.w-e-toolbar [data-menu-key="headerSelect"]').first().click();
  await page.waitForTimeout(600);
  const panel = await page.evaluate(() => {
    const wt = document.querySelector(".w-e-toolbar");
    const list = document.querySelector(".w-e-select-list");
    if (!list) return { found: false };
    const r = list.getBoundingClientRect();
    // 面板底部往下 20px 处取一点，看命中的是不是面板内部元素
    const px = Math.round(r.left + r.width / 2);
    const py = Math.round(r.bottom - 12);
    const hit = document.elementFromPoint(px, py);
    const inside = Boolean(hit && list.contains(hit));
    return {
      found: true,
      panelH: Math.round(r.height),
      panelTop: Math.round(r.top),
      panelBottom: Math.round(r.bottom),
      wToolbarBottom: Math.round(wt.getBoundingClientRect().bottom),
      toolbarOverflowY: getComputedStyle(wt).overflowY,
      hasPanelOpenClass: wt.classList.contains("is-panel-open"),
      bottomPointHitsPanel: inside,
    };
  });

  await page.close();
  return { width, base, scrolled, panel, errs };
};

for (const w of [760, 900, 1024, 1280, 1520]) {
  const r = await probe(w);
  console.log(JSON.stringify(r));
}

await browser.close();
