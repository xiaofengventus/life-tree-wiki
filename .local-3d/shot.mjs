import { chromium } from "playwright";

const out = process.argv[2] || ".local-3d/shot.png";
const wait = Number(process.argv[3] || 5000);
const actions = process.argv[4] || "";

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
page.on("console", (m) => console.log("[page:" + m.type() + "]", m.text()));
page.on("pageerror", (e) => console.log("[page-error]", e.message));
page.on("requestfailed", (r) => console.log("[req-fail]", r.url(), r.failure()?.errorText));

await page.goto("http://localhost:5199/", { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(wait);

if (actions) {
  for (const act of actions.split(",")) {
    const [kind, sel, val] = act.split(":");
    if (kind === "click") await page.click(sel);
    else if (kind === "fill") await page.fill(sel, val);
    else if (kind === "eval") await page.evaluate(val);
    await page.waitForTimeout(1200);
  }
}

const stats = await page.evaluate(() => {
  const t = (id) => (document.getElementById(id) || {}).textContent;
  return {
    title: t("tree-title"), nodes: t("stat-nodes"), leaves: t("stat-leaves"),
    segments: t("stat-segments"), radius: t("stat-radius"), fps: t("stat-fps"),
  };
});
console.log("HUD:", JSON.stringify(stats));

await page.screenshot({ path: out });
console.log("saved", out);
await browser.close();
