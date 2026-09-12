import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
const errs = [];
page.on("pageerror", (e) => errs.push(String(e.message).slice(0, 200)));
page.on("console", (m) => {
  if (m.type() === "error") errs.push("console: " + m.text().slice(0, 150));
});
await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
await page.waitForTimeout(1200);

// 先点正文中间，确保光标在编辑器里
await page.click(".w-e-text-container [data-slate-editor]");
await page.waitForTimeout(300);

// 点工具栏「卡片」菜单 → 应该打开插入面板
await page.evaluate(() =>
  document.querySelector('.w-e-toolbar button[data-menu-key="lifeInsertCard"]')?.click(),
);
await page.waitForTimeout(600);

const panel = await page.evaluate(() => {
  const btns = [...document.querySelectorAll("button")].filter((b) =>
    /生物卡片/.test(b.textContent || ""),
  );
  return { candidates: btns.map((b) => b.textContent.trim().slice(0, 20)) };
});
console.log("面板里有生物卡片的按钮:", JSON.stringify(panel));

if (panel.candidates.length) {
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) =>
      /＋?\s*生物卡片/.test(x.textContent || ""),
    );
    b?.click();
  });
  await page.waitForTimeout(900);
}

const dom = await page.evaluate(() => {
  const cards = [...document.querySelectorAll(".w-e-text-container figure.life-post-card")];
  return {
    count: cards.length,
    inputs: cards[0] ? cards[0].querySelectorAll("input").length : 0,
    firstInputs: cards[0]
      ? [...cards[0].querySelectorAll("input")].slice(0, 4).map((i) => ({
          ph: i.placeholder,
          val: i.value,
        }))
      : [],
  };
});
console.log("编辑器里的卡片块:", JSON.stringify(dom));

// 在第一个输入框里打字，看模型有没有跟着变（data-life-card 是否更新）
if (dom.inputs) {
  const first = await page.$(".w-e-text-container figure.life-post-card input");
  await first.click();
  await first.type("脊索动物门");
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => {
    const card = document.querySelector(".w-e-text-container figure.life-post-card");
    const data = card?.getAttribute("data-life-card") || "";
    return {
      dataChanged: decodeURIComponent(data).includes("脊索动物门"),
      inputValue: card?.querySelector("input")?.value,
    };
  });
  console.log("输入后:", JSON.stringify(after));

  const box = await page.evaluate(() => {
    const c = document.querySelector(".w-e-text-container figure.life-post-card");
    const r = c.getBoundingClientRect();
    return { x: Math.max(0, Math.round(r.left) - 10), y: Math.max(0, Math.round(r.top) - 10), width: Math.min(700, Math.round(r.width) + 20), height: Math.min(420, Math.round(r.height) + 40) };
  });
  await page.screenshot({ path: ".local-3d/card-inline.png", clip: box });
  console.log("截图框:", JSON.stringify(box));
}
console.log("报错:", JSON.stringify(errs));
await browser.close();
