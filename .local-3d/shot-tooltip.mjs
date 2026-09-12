import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 900, height: 820 },
  deviceScaleFactor: 2,
});
await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
await page.waitForTimeout(1000);

await page.hover('.w-e-toolbar button[data-menu-key="bold"]');
await page.waitForTimeout(600);
await page.screenshot({
  path: ".local-3d/tooltip-hover.png",
  clip: { x: 0, y: 40, width: 520, height: 150 },
});
console.log("saved");
await browser.close();
