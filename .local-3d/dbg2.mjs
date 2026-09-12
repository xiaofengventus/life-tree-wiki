import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 820 } });
const errs = [];
page.on("pageerror", (e) => errs.push(String(e.message).slice(0, 300)));
page.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text().slice(0, 200)); });
await page.goto("http://localhost:5200/create-post", { waitUntil: "load", timeout: 60000 });
await page.waitForSelector(".w-e-toolbar .w-e-bar-item", { timeout: 30000 });
await page.waitForTimeout(900);

// 装一个自己的观察器，看看结构变化到底有没有发生
await page.evaluate(() => {
  window.__mut = [];
  const bar = document.querySelector(".editor-toolbar-fixed");
  new MutationObserver((records) => {
    for (const r of records) {
      window.__mut.push({
        type: r.type,
        target: (r.target.className || r.target.nodeName || "").toString().slice(0, 40),
        attr: r.attributeName || "",
        added: r.addedNodes.length,
      });
    }
    if (window.__mut.length > 40) window.__mut.splice(0, window.__mut.length - 40);
  }).observe(bar, { attributes: true, childList: true, subtree: true, attributeFilter: ["style", "class"] });
  window.__poll = [];
  window.__timer = setInterval(() => {
    const b = document.querySelector(".editor-toolbar-fixed");
    window.__poll.push(b.classList.contains("is-panel-open") ? 1 : 0);
    if (window.__poll.length > 60) window.__poll.shift();
  }, 50);
});

await page.evaluate(() => document.querySelector('.w-e-toolbar button[data-menu-key="lifeImportDoc"]')?.click());
await page.waitForTimeout(1500);

const out = await page.evaluate(() => {
  clearInterval(window.__timer);
  const bar = document.querySelector(".editor-toolbar-fixed");
  const panel = document.querySelector(".w-e-drop-panel");
  return {
    isPanelOpen: bar.classList.contains("is-panel-open"),
    overflowY: getComputedStyle(bar).overflowY,
    panelDisplay: panel ? getComputedStyle(panel).display : null,
    panelSize: panel ? Math.round(panel.getBoundingClientRect().width) + "x" + Math.round(panel.getBoundingClientRect().height) : null,
    mutations: window.__mut.slice(-14),
    pollTail: window.__poll.join(""),
  };
});
console.log(JSON.stringify(out, null, 1));
console.log("ERRORS:", JSON.stringify(errs));
await browser.close();
