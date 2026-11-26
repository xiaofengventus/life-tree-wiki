// 下载 R2 里存档引用的全部图片对象（一次性工具）。
//
// 先跑 scripts/d1-sql-to-json.mjs 得到 archive/d1-life-tree-full.json，
// 再执行：node scripts/archive-media.mjs
// 图片落在 archive/media/images/，文件名就是 object_key。
import fs from "node:fs";
import path from "node:path";

const JSON_FILE = path.resolve(process.argv[2] || "archive/d1-life-tree-full.json");
const OUT_DIR = path.resolve("archive/r2");

const snapshot = JSON.parse(fs.readFileSync(JSON_FILE, "utf8"));
const objects = (snapshot.tables.media_assets || [])
  .map((row) => row.object_key)
  .filter(Boolean);

if (!objects.length) {
  console.log("media_assets 里没有对象，跳过");
  process.exit(0);
}

const listFile = path.join(OUT_DIR, "..", "r2-objects.txt");
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(listFile, objects.join("\n"));

const total = (snapshot.tables.media_assets || []).reduce(
  (sum, row) => sum + (row.byte_size || 0),
  0,
);
console.log(`对象 ${objects.length} 个，共 ${(total / 1048576).toFixed(1)} MB`);
console.log(`对象清单：${listFile}`);
console.log("下载命令：npx wrangler r2 object get life-tree-media --file <本地路径> <object_key>");
