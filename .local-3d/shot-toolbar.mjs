/**
 * 工具栏特写截图（2 倍像素密度，只看 toolbar 那一条）
 * node .local-3d/shot-toolbar.mjs [width] [out]
 */
import { chromium } from "playwright";

const width = Number(process.argv[2] || 1520);
const out = process.argv[3] || ".local-3d/toolbar-closeup.png";

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width, height: 900 },
  deviceScaleFactor: 2,
});
await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
await page.waitForTimeout(1200);

await page.screenshot({
  path: out,
  clip: { x: 0, y: 56, width, height: 78 },
});
console.log("saved", out);
await browser.close();
