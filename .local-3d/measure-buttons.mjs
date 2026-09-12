import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1520, height: 900 }, deviceScaleFactor: 2 });
await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
await page.waitForTimeout(1200);

const rows = await page.evaluate(() =>
  [...document.querySelectorAll(".w-e-toolbar .w-e-bar-item")].map((item, i) => {
    const btn = item.querySelector("button");
    const svg = item.querySelector("svg");
    const r = btn.getBoundingClientRect();
    const sr = svg ? svg.getBoundingClientRect() : null;
    return {
      i,
      key: btn.getAttribute("data-menu-key") || "(native)",
      title: (btn.getAttribute("data-tooltip") || "").split("\n")[0],
      btnW: Math.round(r.width),
      btnH: Math.round(r.height),
      svgW: sr ? Math.round(sr.width) : null,
      svgH: sr ? Math.round(sr.height) : null,
      active: btn.classList.contains("active"),
      bg: getComputedStyle(btn).backgroundColor,
      color: getComputedStyle(btn).color,
      hasDivider: item.classList.contains("w-e-bar-divider"),
    };
  }),
);
for (const r of rows) {
  console.log(
    String(r.i).padStart(2) +
      " " +
      r.key.padEnd(22) +
      " btn " + r.btnW + "x" + r.btnH +
      " svg " + r.svgW + "x" + r.svgH +
      (r.active ? " [ACTIVE " + r.bg + " / " + r.color + "]" : "") +
      " " + r.title,
  );
}
await browser.close();
