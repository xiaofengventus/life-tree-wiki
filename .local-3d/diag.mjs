/**
 * 诊断：打开页面，抓 console 错误与编译错误浮层。
 */
import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1520, height: 900 } });
const logs = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") logs.push(`[${m.type()}] ${m.text().slice(0, 400)}`);
});
page.on("pageerror", (e) => logs.push(`[pageerror] ${String(e.message).slice(0, 400)}`));
await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(4000);

const info = await page.evaluate(() => {
  const overlay = document.querySelector("vite-error-overlay");
  return {
    hasOverlay: Boolean(overlay),
    overlayText: overlay ? (overlay.shadowRoot?.textContent || "").slice(0, 900) : "",
    appHtmlLen: document.querySelector("#app")?.innerHTML.length ?? -1,
    hasToolbar: Boolean(document.querySelector(".editor-toolbar-fixed")),
    hasWEditor: Boolean(document.querySelector(".w-e-toolbar")),
    bodyText: document.body.innerText.slice(0, 300),
  };
});
console.log(JSON.stringify(info, null, 1));
console.log("--- console ---");
console.log(logs.slice(0, 12).join("\n"));
await browser.close();
