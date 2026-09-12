/**
 * 工具栏交互回归：新菜单能否打开面板、下拉面板有没有被裁掉、开关是否可用。
 */
import { chromium } from "playwright";

const width = Number(process.argv[2] || 1520);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 200)));
await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
await page.waitForTimeout(1200);

const results = [];
const item = (i) => page.locator(".w-e-toolbar .w-e-bar-item").nth(i);

// 1) 正文下拉（headerSelect, index 0）
await item(0).locator("button").click();
await page.waitForTimeout(400);
results.push({
  test: "正文下拉面板",
  visible: await page.locator(".w-e-select-list").first().isVisible().catch(() => false),
  clipped: await page.evaluate(() => {
    const el = document.querySelector(".w-e-select-list");
    if (!el) return "no-panel";
    const b = el.getBoundingClientRect();
    const bar = document.querySelector(".editor-toolbar-fixed").getBoundingClientRect();
    return { panelTop: Math.round(b.top), barBottom: Math.round(bar.bottom), belowBar: b.top >= bar.top };
  }),
});
await page.keyboard.press("Escape");
await page.waitForTimeout(250);

// 2) 颜色分组（index 6）hover 菜单
await item(6).hover();
await page.waitForTimeout(400);
results.push({
  test: "颜色分组菜单",
  visible: await page.locator(".w-e-bar-item-menus-container").first().isVisible().catch(() => false),
});
await page.mouse.move(5, 400);
await page.waitForTimeout(250);

// 3) 三个新菜单 → 应弹出 insert-tools-dialog，且落到对应分区
const closePanel = async () => {
  for (let i = 0; i < 4; i += 1) {
    if (!(await page.locator(".insert-tools-backdrop").count())) break;
    await page.locator(".insert-tools-backdrop").click({ position: { x: 8, y: 8 }, force: true });
    await page.waitForTimeout(450);
  }
};
const newMenus = [
  { key: "lifeInsertCard", label: "卡片" },
  { key: "lifeInsertTree", label: "进化树" },
  { key: "lifeImportMarkdown", label: "Markdown" },
];
for (const m of newMenus) {
  const btn = page.locator(`[data-menu-key="${m.key}"]`);
  const count = await btn.count();
  await btn.first().click();
  await page.waitForTimeout(600);
  const dialog = await page
    .locator(".insert-tools-dialog")
    .isVisible()
    .catch(() => false);
  const text = dialog ? (await page.locator(".insert-tools-dialog").innerText()).slice(0, 90) : "";
  results.push({
    test: `新菜单 ${m.label}`,
    found: count,
    dialogOpen: dialog,
    text: text.replace(/\n+/g, " / "),
  });
  await closePanel();
}

// 4) 参考文献图标
await page.locator(".citation-panel-toggle-btn").click();
await page.waitForTimeout(500);
results.push({
  test: "参考文献面板",
  visible: await page.locator(".citation-panel").first().isVisible().catch(() => false),
});
await page.locator(".citation-panel-toggle-btn").click();
await page.waitForTimeout(300);

// 5) 浮动工具栏开关
const before = await page.locator(".floating-tools-toggle").getAttribute("aria-pressed");
await page.locator(".floating-tools-toggle").click();
await page.waitForTimeout(300);
const after = await page.locator(".floating-tools-toggle").getAttribute("aria-pressed");
results.push({ test: "浮动工具栏开关", before, after, changed: before !== after });
// 还原
await page.locator(".floating-tools-toggle").click();
await page.waitForTimeout(200);

// 6) 导入/导出下拉
await page.locator(".io-dropdown-btn").first().click();
await page.waitForTimeout(350);
results.push({
  test: "导入下拉",
  visible: await page.locator(".io-dropdown-menu").first().isVisible().catch(() => false),
});

console.log(JSON.stringify({ width, results, errors }, null, 1));
await browser.close();
