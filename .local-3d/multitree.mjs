import { chromium } from "playwright";

const uids = ["T000022", "T000011", "T000013", "T000001", "T000010"];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1180, height: 760 } });
page.on("pageerror", (e) => console.log("[page-error]", e.message));
page.on("console", (m) => {
  const t = m.text();
  if (t.includes("fractal-3d") || m.type() === "error") console.log("[page]", t);
});

await page.goto("http://localhost:5199/", { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(4500);

for (const uid of uids) {
  await page.selectOption("#tree-select", uid);
  await page.waitForTimeout(2500);
  const stats = await page.evaluate(() => ({
    title: document.getElementById("tree-title").textContent,
    nodes: document.getElementById("stat-nodes").textContent,
    leaves: document.getElementById("stat-leaves").textContent,
    radius: document.getElementById("stat-radius").textContent,
  }));
  await page.screenshot({ path: `.local-3d/tree-${uid}.png` });
  console.log(`${uid} 「${stats.title}」 节点=${stats.nodes} 叶/深=${stats.leaves} 半径=${stats.radius}`);
}

await browser.close();
