/**
 * 量测编辑器工具栏的真实布局：宽度、是否折行、各块占位。
 * node .local-3d/toolbar-measure.mjs [width]
 */
import { chromium } from "playwright";

const width = Number(process.argv[2] || 1520);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 900 } });
await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
await page.waitForSelector(".editor-toolbar-fixed", { timeout: 30000 });
await page.waitForSelector(".w-e-toolbar", { timeout: 30000 });
await page.waitForTimeout(1500);

const data = await page.evaluate(() => {
  const r = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: Math.round(b.x), w: Math.round(b.width), h: Math.round(b.height), right: Math.round(b.right) };
  };
  const bar = document.querySelector(".editor-toolbar-fixed");
  const wbar = bar.querySelector(".w-e-toolbar");
  const cs = getComputedStyle(wbar);
  const items = [...wbar.querySelectorAll(".w-e-bar-item")].map((el) => {
    const b = el.getBoundingClientRect();
    const label = (el.getAttribute("data-menu-key") || el.textContent || "").trim().slice(0, 12);
    return { label, x: Math.round(b.x), top: Math.round(b.top), w: Math.round(b.width) };
  });
  const tops = [...new Set(items.map((i) => i.top))].sort((a, b) => a - b);
  return {
    viewport: window.innerWidth,
    fixedBar: r(bar),
    citationBtn: r(document.querySelector(".citation-panel-toggle-btn")),
    wToolbar: r(wbar),
    wToolbarFlexWrap: cs.flexWrap,
    wToolbarFlex: cs.flex,
    wToolbarFlexGrow: cs.flexGrow,
    parentDisplay: getComputedStyle(bar).display,
    barChildren: [...bar.children].map((el) => ({
      tag: el.tagName,
      cls: (el.className || "").toString().slice(0, 60),
      w: Math.round(el.getBoundingClientRect().width),
      flexGrow: getComputedStyle(el).flexGrow,
    })),
    wToolbarPadding: cs.padding,
    wToolbarDisplay: cs.display,
    extras: r(document.querySelector(".editor-toolbar-extras")),
    extrasChildren: [...document.querySelector(".editor-toolbar-extras").children].map((el) => ({
      tag: el.className || el.tagName,
      ...r(el),
    })),
    itemCount: items.length,
    itemRows: tops.length,
    itemRowTops: tops,
    itemsTotalWidth:
      Math.round(items.reduce((s, i) => s + i.w, 0)) +
      " (+ " + (items.length - 1) + " gaps)",
    firstRowItems: items.filter((i) => i.top === tops[0]).length,
    lastItemRight: items.length ? items[items.length - 1].right ?? items[items.length - 1].x + items[items.length - 1].w : null,
    items,
  };
});

console.log(JSON.stringify(data, null, 1));
await browser.close();
