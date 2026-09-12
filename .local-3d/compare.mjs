import { chromium } from "playwright";

// 枝长/节点半径比 = (K-1)/nodeBase，固定成 ~6 才是同一套"疏密"，否则比的是疏密不是尺度
const cases = [
  { k: "1.04", node: "0.0067", tag: "compact" },
  { k: "1.06", node: "0.0100", tag: "mid" },
  { k: "1.08", node: "0.0133", tag: "loose" },
];

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=d3d11", "--enable-unsafe-webgpu"],
});
const page = await browser.newPage({ viewport: { width: 1360, height: 860 } });
page.on("pageerror", (e) => console.log("[page-error]", e.message));
page.on("console", (m) => {
  if (m.type() === "error" || m.text().includes("fractal-3d")) console.log("[page]", m.text());
});

await page.goto("http://localhost:5199/", { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(4500);

for (const c of cases) {
  await page.evaluate(([k, n]) => {
    const set = (id, v) => {
      const el = document.getElementById(id);
      el.value = v;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    };
    set("r-growth", k);
    set("r-node", n);
  }, [c.k, c.node]);
  await page.waitForTimeout(2200);
  const fps = await page.textContent("#stat-fps");
  const radius = await page.textContent("#stat-radius");
  await page.screenshot({ path: `.local-3d/cmp-${c.tag}-k${c.k}.png` });
  console.log(`k=${c.k} node=${c.node} -> radius=${radius} fps=${fps} saved cmp-${c.tag}-k${c.k}.png`);
}

await browser.close();
