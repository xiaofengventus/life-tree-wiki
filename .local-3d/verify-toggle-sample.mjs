import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1520, height: 900 }, deviceScaleFactor: 4 });
const errs = [];
page.on("pageerror", (e) => errs.push(String(e.message).slice(0, 200)));
page.on("console", (m) => {
  if (m.type() === "error") errs.push("console: " + m.text().slice(0, 200));
});
await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
await page.waitForTimeout(1200);

const zoomClip = async (label, file) => {
  const box = await page.evaluate(() => {
    const btn = document.querySelector(
      '.w-e-toolbar button[data-menu-key="lifeFloatingTools"]',
    );
    const r = btn.getBoundingClientRect();
    return {
      x: Math.max(0, Math.round(r.left - 90)),
      y: Math.round(r.top - 4),
      width: 260,
      height: Math.round(r.height + 8),
    };
  });
  await page.screenshot({ path: file, clip: box });
  console.log(label + " 截图: " + file + " " + JSON.stringify(box));
};

// 开启态（默认开启）
await zoomClip("开启态", ".local-3d/toggle-on.png");

// 关掉 → 关闭态
await page.evaluate(() =>
  document.querySelector('.w-e-toolbar button[data-menu-key="lifeFloatingTools"]')?.click(),
);
await page.waitForTimeout(500);
await zoomClip("关闭态", ".local-3d/toggle-off.png");
const offState = await page.evaluate(() => {
  const btn = document.querySelector(
    '.w-e-toolbar button[data-menu-key="lifeFloatingTools"]',
  );
  const wrap = document.querySelector(".editor-wrapper");
  return {
    active: btn.classList.contains("active"),
    bg: getComputedStyle(btn).backgroundColor,
    wrapperDisabled: wrap?.classList.contains("floating-tools-disabled"),
  };
});
console.log("关闭态: " + JSON.stringify(offState));

// 再打开，恢复
await page.evaluate(() =>
  document.querySelector('.w-e-toolbar button[data-menu-key="lifeFloatingTools"]')?.click(),
);
await page.waitForTimeout(400);

// 代码块案例：插入后内容应为空
const sampleInfo = await page.evaluate(() => {
  const btn = document.querySelector('.w-e-toolbar button[data-menu-key="lifeCodeSample"]');
  if (!btn) return { ok: false, reason: "按钮不存在" };
  btn.click();
  return { ok: true };
});
await page.waitForTimeout(900);
const sampleText = await page.evaluate(() => {
  const codes = [...document.querySelectorAll(".w-e-text-container pre > code")];
  return codes.map((c) => ({
    cls: c.className,
    dataLang: c.getAttribute("data-language") || null,
    raw: JSON.stringify(c.textContent),
    len: (c.textContent || "").length,
    preHtml: c.parentElement.outerHTML.slice(0, 200),
  }));
});
console.log("点击代码块案例: " + JSON.stringify(sampleInfo));
console.log("编辑器里的代码块: " + JSON.stringify(sampleText));

// 顺便看阅读页渲染出来的卡片长什么样
const card = await page.evaluate(() => {
  const el = document.querySelector(".life-code-sample");
  if (!el) return null;
  return { panes: el.querySelectorAll(".life-code-sample-pane").length, text: el.textContent.trim().slice(0, 60) };
});
console.log("预览卡片: " + JSON.stringify(card));

console.log("报错: " + JSON.stringify(errs));
await browser.close();
