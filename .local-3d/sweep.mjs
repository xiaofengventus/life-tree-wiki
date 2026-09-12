import { chromium } from "playwright";

// 只扫"自相似度"这一个变量，其余固定，看它单独对形态的影响
const expos = ["1.00", "0.92", "0.84", "0.76"];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 840 } });
page.on("pageerror", (e) => console.log("[page-error]", e.message));
page.on("console", (m) => { if (m.text().includes("fractal-3d")) console.log("[page]", m.text()); });

await page.goto("http://localhost:5199/", { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(4000);

for (const expo of expos) {
  await page.evaluate((v) => {
    const el = document.getElementById("r-expo");
    el.value = v;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, expo);
  await page.waitForTimeout(2000);
  const radius = await page.textContent("#stat-radius");
  const fps = await page.textContent("#stat-fps");
  await page.screenshot({ path: `.local-3d/expo-${expo}.png` });
  console.log(`expo=${expo} -> 半径跨度=${radius} fps=${fps}`);
}

await browser.close();
