import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1520, height: 900 } });
await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
await page.waitForTimeout(1200);

const out = await page.evaluate(() => {
  const btn = document.querySelector(
    '.w-e-toolbar button[data-menu-key="lifeFloatingTools"]',
  );
  const svg = btn.querySelector("svg");
  const kids = [...svg.querySelectorAll("*")].map((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName,
      cls: el.getAttribute("class"),
      fillAttr: el.getAttribute("fill"),
      cssFill: cs.fill,
      display: cs.display,
      visibility: cs.visibility,
      w: Math.round(r.width),
      h: Math.round(r.height),
      outer: el.outerHTML.slice(0, 120),
    };
  });
  return {
    btnHtml: btn.outerHTML.slice(0, 400),
    svgAttrs: [...svg.attributes].map((a) => a.name + "=" + a.value),
    svgCssFill: getComputedStyle(svg).fill,
    svgViewBox: svg.getAttribute("viewBox"),
    kids,
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
