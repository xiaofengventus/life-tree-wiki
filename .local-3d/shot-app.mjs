/**
 * 通用应用页截图：node .local-3d/shot-app.mjs <url> <out.png> [scrollY] [width]
 */
import { chromium } from "playwright";

const url = process.argv[2];
const out = process.argv[3] || ".local-3d/shot-app.png";
const scrollY = Number(process.argv[4] || 0);
const width = Number(process.argv[5] || 1440);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 900 } });
page.on("pageerror", (e) => console.log("[page-error]", e.message));

await page.goto(url, { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(2500);

if (scrollY) {
  await page.evaluate((y) => window.scrollTo(0, y), scrollY);
  await page.waitForTimeout(600);
}

await page.screenshot({ path: out });
console.log("saved", out);
await browser.close();
