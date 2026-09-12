import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 760, height: 820 } });
await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
await page.waitForTimeout(1000);

const out = await page.evaluate(() => {
  const bar = document.querySelector(".editor-toolbar-fixed");
  const log = [];
  bar.scrollLeft = 99999;
  log.push("设滚动后 scrollLeft=" + bar.scrollLeft);
  bar.style.overflow = "visible";
  void bar.offsetWidth;
  log.push("overflow=visible 后 scrollLeft=" + bar.scrollLeft);
  bar.style.overflow = "";
  void bar.offsetWidth;
  log.push("overflow 还原后 scrollLeft=" + bar.scrollLeft);
  bar.scrollLeft = 99999;
  log.push("重新滚动 scrollLeft=" + bar.scrollLeft);
  return log;
});
console.log(out.join("\n"));
await browser.close();
