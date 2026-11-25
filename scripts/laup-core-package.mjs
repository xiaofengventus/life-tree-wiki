/**
 * Laup v2 内核的「发布壳」工具。
 *
 * 仓库里只有一份源码：src/laup2。发布包不做常驻副本 ——
 * 只有 `npm pack` / `npm publish` 的 prepack 阶段才复制到 packages/laup2/src，
 * 避免两份代码漂移。
 *
 * 用法：
 *   node scripts/laup-core-package.mjs check    只做守卫检查（CI 用）
 *   node scripts/laup-core-package.mjs prepare  检查 + 复制到 packages/laup2/src
 */
import { existsSync, readdirSync, readFileSync, rmSync, cpSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const CORE = join(root, "src", "laup2");
const TARGET = join(root, "packages", "laup2", "src");

const FORBIDDEN = [
  { pattern: /\b(?:document|window|navigator|localStorage|sessionStorage)\b/, message: "出现浏览器全局对象" },
  { pattern: /from\s+["']@\//, message: "出现应用别名 @/（内核必须自包含）" },
  { pattern: /from\s+["'](?!\.\.?\/)[^"']+["']/, message: "出现非相对路径 import（内核必须零依赖）" },
];

/** 注释里的示例代码不算违规（例如文档注释里写 `from '@/laup2'`） */
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !/^\s*(?:\/\/|\*)/.test(line))
    .join("\n");
}

function listFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full));
    else if (/\.(?:js|mjs|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function check() {
  if (!existsSync(CORE)) {
    console.error(`找不到内核目录：${CORE}`);
    process.exit(1);
  }
  const problems = [];
  for (const file of listFiles(CORE)) {
    if (!file.endsWith(".js")) continue;
    const text = stripComments(readFileSync(file, "utf8"));
    for (const rule of FORBIDDEN) {
      if (rule.pattern.test(text)) {
        problems.push(`${relative(root, file)}：${rule.message}`);
      }
    }
  }
  if (problems.length) {
    console.error("Laup core 守卫失败：");
    for (const line of problems) console.error("  - " + line);
    process.exit(1);
  }
  const files = listFiles(CORE);
  console.log(`Laup core 守卫通过（${files.filter((f) => f.endsWith(".js")).length} 个 JS / ${files.length} 个文件）`);
}

function prepare() {
  check();
  rmSync(TARGET, { recursive: true, force: true });
  cpSync(CORE, TARGET, { recursive: true });
  console.log(`已复制内核到发布壳：${relative(root, TARGET)}`);
}

const mode = process.argv[2] || "check";
if (mode === "prepare") prepare();
else check();
