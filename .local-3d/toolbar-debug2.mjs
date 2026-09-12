/**
 * 每个菜单单独用一个新页面测试，并输出按钮状态 class。
 */
import { chromium } from "playwright";

const browser = await chromium.launch();
const keys = ["lifeInsertCard", "lifeInsertTree", "lifeImportMarkdown"];

for (const key of keys) {
  const page = await browser.newPage({ viewport: { width: 1520, height: 900 } });
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message).slice(0, 160)));
  await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
  await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    window.__ev = [];
    window.addEventListener("life-open-tool-section", (e) => window.__ev.push(e?.detail?.section));
  });

  const before = await page.evaluate((k) => {
    const b = document.querySelector(`[data-menu-key="${k}"]`);
    return b ? { cls: b.className, disabled: b.classList.contains("disabled") } : null;
  }, key);

  await page.locator(`[data-menu-key="${key}"]`).first().click();
  await page.waitForTimeout(700);

  const after = await page.evaluate(() => ({
    ev: [...(window.__ev || [])],
    backdrop: Boolean(document.querySelector(".insert-tools-backdrop")),
    title: document.querySelector("#insert-tools-title")?.textContent || null,
  }));

  console.log(key, "| before:", JSON.stringify(before), "| after:", JSON.stringify(after), "| errs:", errs.join(";"));
  await page.close();
}

await browser.close();
