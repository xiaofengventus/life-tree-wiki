import { readFile, readdir, writeFile } from "node:fs/promises";

const treeDirectory = new URL("../public/trees/", import.meta.url);
const indexFile = new URL("index.json", treeDirectory);

function getTreeName(payload, filename) {
  const document =
    payload?.format === "life-tree.xur" ? payload.document : payload;
  const rootName = String(document?.root?.data?.text || "")
    .split("\n")[0]
    .trim();
  return rootName || filename.replace(/\.xur$/i, "");
}

const files = (await readdir(treeDirectory, { withFileTypes: true }))
  .filter(
    (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".xur"),
  )
  .map((entry) => entry.name)
  .sort((left, right) => {
    if (left.toLowerCase() === "luca.xur") return -1;
    if (right.toLowerCase() === "luca.xur") return 1;
    return left.localeCompare(right, "zh-CN");
  });

const trees = [];
for (const file of files) {
  try {
    const payload = JSON.parse(
      await readFile(new URL(file, treeDirectory), "utf8"),
    );
    trees.push({
      id: file.replace(/\.xur$/i, "").replace(/[^a-zA-Z0-9_-]+/g, "-") || file,
      name: getTreeName(payload, file),
      file,
    });
  } catch (error) {
    console.warn(`跳过无法解析的进化树 ${file}: ${error.message}`);
  }
}

const output = `${JSON.stringify({ trees }, null, 2)}\n`;
let previous = "";
try {
  previous = await readFile(indexFile, "utf8");
} catch {
  // The index is created when no prior file exists.
}
if (previous !== output) await writeFile(indexFile, output, "utf8");
console.log(`已索引 ${trees.length} 个 .xur 文件`);
