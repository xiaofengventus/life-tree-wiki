/**
 * 把线上公开的进化树拉成本地 json，供 3D 实验页离线加载。
 * 目的是用一批"规模、深度、主题各不相同"的真实树来验证布局的泛化能力，
 * 而不是只调好 T000021 一棵。
 */
import fs from "node:fs";

const API = "https://life-tree-wiki.pages.dev/api/trees";
const OUT = "experiments/fractal-3d/data";
fs.mkdirSync(OUT, { recursive: true });

const listRes = await fetch(`${API}?limit=100&kind=all`);
const { trees } = await listRes.json();
console.log("线上共", trees.length, "棵树");

const index = [];
for (const t of trees) {
  try {
    const res = await fetch(`${API}/${t.uid}`);
    if (!res.ok) { console.log("  跳过", t.uid, "HTTP", res.status); continue; }
    const payload = await res.json();
    const tree = payload.tree || {};
    const doc = tree.document;
    if (!doc || !doc.root) { console.log("  跳过", t.uid, "(没有 document.root)"); continue; }
    const out = {
      uid: tree.uid || t.uid,
      title: tree.title || "",
      nodeCount: tree.nodeCount || 0,
      document: doc,
    };
    const file = `${out.uid}.json`;
    fs.writeFileSync(`${OUT}/${file}`, JSON.stringify(out));
    const size = (fs.statSync(`${OUT}/${file}`).size / 1024).toFixed(0);
    index.push({ uid: out.uid, title: out.title, nodeCount: out.nodeCount, file });
    console.log("  ok", out.uid, String(out.nodeCount).padStart(5), size + "KB", out.title.slice(0, 26));
  } catch (error) {
    console.log("  失败", t.uid, error.message);
  }
}

index.sort((a, b) => a.nodeCount - b.nodeCount);
fs.writeFileSync(`${OUT}/index.json`, JSON.stringify({ trees: index }, null, 1));
console.log("完成，索引", index.length, "棵 ->", `${OUT}/index.json`);
