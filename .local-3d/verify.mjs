import fs from "node:fs";
import { layoutFractalTree3D } from "../experiments/fractal-3d/layout3d.js";

const payload = JSON.parse(fs.readFileSync("experiments/fractal-3d/data/T000021.json", "utf8"));
const root = payload.document.root;
const maxD = (() => {
  let b = 0; const st = [[root, 0]];
  while (st.length) { const [n, d] = st.pop(); if (d > b) b = d; for (const c of (n.children || [])) st.push([c, d + 1]); }
  return b;
})();

const t0 = performance.now();
const r = layoutFractalTree3D(root, {
  radiusGrowth: 1.08, nodeSizeGrowth: 1.08, nodeBase: 0.02,
  rootSpread: Math.PI / 2, maxDepth: Infinity,
});
const ms = performance.now() - t0;

console.log("布局耗时:", ms.toFixed(1), "ms");
console.log("节点:", r.nodes.length, "| 段:", r.segments.length, "| 最深:", r.meta.maxDepth, "(预期 " + maxD + ")");
console.log("总叶数:", r.meta.totalLeaves, "| truncated:", r.meta.truncated);

const radii = r.nodes.map((n) => Math.hypot(n.x, n.y, n.z));
const maxR = Math.max(...radii);
console.log("半径范围:", Math.min(...radii).toFixed(4), "->", maxR.toFixed(1), "| 理论 K^107 =", Math.pow(1.08, 107).toFixed(1));

let worstLen = 0;
for (const n of r.nodes) worstLen = Math.max(worstLen, Math.abs(Math.hypot(n.dir[0], n.dir[1], n.dir[2]) - 1));
console.log("方向向量最大偏差:", worstLen.toExponential(2));

const minY = Math.min(...r.nodes.map((n) => n.y));
console.log("最小 y:", minY.toFixed(4), "(半球应 >= -1e-9)");

const byDepth = new Map();
for (const n of r.nodes) if (!byDepth.has(n.depth)) byDepth.set(n.depth, Math.hypot(n.x, n.y, n.z));
const samples = [];
for (const d of [0, 1, 2, 10, 50, 100, 107]) if (byDepth.has(d)) samples.push("d" + d + "=" + byDepth.get(d).toFixed(3));
console.log("每层半径:", samples.join("  "));

const leafR = r.nodes.filter((n) => n.isLeaf).map((n) => Math.hypot(n.x, n.y, n.z));
console.log("叶子半径范围:", Math.min(...leafR).toFixed(2), "->", Math.max(...leafR).toFixed(2));

console.log("--- 抽样 ---");
for (const i of [0, 1, 2, 3, 4, 100, 1000, 2362]) {
  const n = r.nodes[i];
  if (!n) continue;
  console.log("  #" + i + " d=" + n.depth + ' "' + n.text + '" r=' + Math.hypot(n.x, n.y, n.z).toFixed(2) + " size=" + n.size.toFixed(3) + " leaf=" + n.leafCount);
}

// 一级分支分布（parentIndex === 0）
console.log("--- 一级分支方向 ---");
for (const n of r.nodes) {
  if (n.parentIndex !== 0) continue;
  const el = Math.asin(n.dir[1]) * 180 / Math.PI;
  const az = Math.atan2(n.dir[2], n.dir[0]) * 180 / Math.PI;
  console.log(
    "  " + n.text.slice(0, 24) +
    " 仰角=" + el.toFixed(1) + "° 方位=" + az.toFixed(1) + "°" +
    " spread=" + (n.spread * 180 / Math.PI).toFixed(1) + "°" +
    " r=" + Math.hypot(n.x, n.y, n.z).toFixed(2),
  );
}

// 最深的一批节点的仰角，确认没有退化
const deep = r.nodes.filter((n) => n.depth >= 100);
console.log("--- 深度 >= 100 的 " + deep.length + " 个节点 ---");
let elMin = 90, elMax = -90, rMin = 1e9, rMax = 0;
for (const n of deep) {
  const el = Math.asin(n.dir[1]) * 180 / Math.PI;
  elMin = Math.min(elMin, el); elMax = Math.max(elMax, el);
  const rr = Math.hypot(n.x, n.y, n.z);
  rMin = Math.min(rMin, rr); rMax = Math.max(rMax, rr);
}
console.log("  仰角 " + elMin.toFixed(1) + "° ~ " + elMax.toFixed(1) + "° | 半径 " + rMin.toFixed(0) + " ~ " + rMax.toFixed(0));
console.log("  例: " + deep.slice(0, 5).map((n) => n.text.slice(0, 18) || "(无名)").join(" | "));
