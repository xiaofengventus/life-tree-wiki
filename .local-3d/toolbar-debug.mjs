/**
 * 调试：三个工具栏菜单的事件与面板状态。
 */
import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1520, height: 900 } });
page.on("pageerror", (e) => console.log("[pageerror]", String(e.message).slice(0, 200)));
await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
await page.waitForTimeout(1200);

await page.evaluate(() => {
  window.__menuEvents = [];
  window.addEventListener("life-open-tool-section", (e) => {
    window.__menuEvents.push(e?.detail?.section);
  });
});

const snap = async (tag) => {
  const s = await page.evaluate(() => ({
    events: [...(window.__menuEvents || [])],
    backdrop: Boolean(document.querySelector(".insert-tools-backdrop")),
    dialogTitle: document.querySelector("#insert-tools-title")?.textContent || null,
  }));
  console.log(tag, JSON.stringify(s));
};

const closeAll = async () => {
  for (let i = 0; i < 4; i += 1) {
    if (!(await page.locator(".insert-tools-backdrop").count())) break;
    await page.locator(".insert-tools-backdrop").click({ position: { x: 8, y: 8 }, force: true });
    await page.waitForTimeout(400);
  }
};

for (const key of ["lifeInsertCard", "lifeInsertTree", "lifeImportMarkdown"]) {
  const btn = page.locator(`[data-menu-key="${key}"]`).first();
  const box = await btn.boundingBox();
  console.log(`--- ${key} box=${JSON.stringify(box)}`);
  await btn.click();
  await page.waitForTimeout(300);
  await snap(`${key} @300ms`);
  await page.waitForTimeout(900);
  await snap(`${key} @1200ms`);
  await closeAll();
  await page.waitForTimeout(200);
}

// 颜色分组
await page.locator('[data-menu-key="color"]').first().hover();
await page.waitForTimeout(500);
const colorState = await page.evaluate(() => {
  const group = document.querySelector('[data-menu-key="color"]')?.closest(".w-e-bar-item-group");
  const menu = group?.querySelector(".w-e-bar-item-menus-container");
  if (!menu) return { found: false };
  const cs = getComputedStyle(menu);
  const b = menu.getBoundingClientRect();
  return { found: true, display: cs.display, top: Math.round(b.top), height: Math.round(b.height) };
});
console.log("color group:", JSON.stringify(colorState));

await browser.close();
