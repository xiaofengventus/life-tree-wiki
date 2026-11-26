// 把 wrangler d1 export 出来的 SQL 转成结构化 JSON 存档（一次性工具）。
//
// 用法：
//   npx wrangler d1 export life-tree --remote --output archive/d1-life-tree-full.sql
//   node scripts/d1-sql-to-json.mjs
//
// 产物：archive/d1-life-tree-full.json —— 每张表一个键，值是行对象数组。
// 私密文章/私密树都在里面（SQL 导出是整库，不区分可见性）。
import fs from "node:fs";
import path from "node:path";

const SQL_FILE = path.resolve(process.argv[2] || "archive/d1-life-tree-full.sql");
const OUT_FILE = path.resolve(
  process.argv[3] || SQL_FILE.replace(/\.sql$/i, "") + ".json",
);

// SQLite 字面量解析：只处理 D1 导出会出现的形态（单引号字符串、NULL、数字）。
// 字符串里的 '' 是转义的单引号。
function parseValueList(source) {
  const rows = [];
  let i = 0;
  const length = source.length;
  const readString = () => {
    let out = "";
    i++; // 跳过开头的 '
    while (i < length) {
      const ch = source[i];
      if (ch === "'") {
        if (source[i + 1] === "'") {
          out += "'";
          i += 2;
          continue;
        }
        i++;
        return out;
      }
      out += ch;
      i++;
    }
    throw new Error("字符串未闭合");
  };
  const readToken = () => {
    const ch = source[i];
    if (ch === "'") return readString();
    const start = i;
    while (i < length && source[i] !== "," && source[i] !== ")") i++;
    const raw = source.slice(start, i).trim();
    if (raw === "NULL") return null;
    if (/^-?\d+$/.test(raw)) return Number(raw);
    if (/^-?\d*\.\d+$/.test(raw)) return Number(raw);
    return raw;
  };
  while (i < length) {
    while (i < length && source[i] !== "(") i++;
    if (i >= length) break;
    i++; // 跳过 (
    const row = [];
    for (;;) {
      while (i < length && /\s/.test(source[i])) i++;
      if (source[i] === ")") {
        i++;
        break;
      }
      row.push(readToken());
      while (i < length && /\s/.test(source[i])) i++;
      if (source[i] === ",") i++;
    }
    rows.push(row);
  }
  return rows;
}

function splitTopLevel(source) {
  // 把 "VALUES (...),(...)" 后的内容按顶层逗号切成多段，避免大表一次解析全部内容。
  const parts = [];
  let depth = 0;
  let start = 0;
  let inString = false;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (inString) {
      if (ch === "'") {
        if (source[i + 1] === "'") i++;
        else inString = false;
      }
      continue;
    }
    if (ch === "'") inString = true;
    else if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 0) {
      parts.push(source.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(source.slice(start));
  return parts;
}

const sql = fs.readFileSync(SQL_FILE, "utf8");
const lines = sql.split(/\r?\n/);
const tables = {};

for (const line of lines) {
  const match = /^INSERT INTO "?([A-Za-z0-9_]+)"?\s*\(([^)]*)\)\s*VALUES(.*)$/s.exec(line.trim());
  if (!match) continue;
  const [, table, columnList, valuesPart] = match;
  const columns = columnList
    .split(",")
    .map((name) => name.trim().replace(/^"|"$/g, ""));
  const rows = tables[table] || (tables[table] = []);
  for (const chunk of splitTopLevel(valuesPart)) {
    const parsed = parseValueList(chunk);
    for (const values of parsed) {
      if (values.length !== columns.length) continue;
      const row = {};
      columns.forEach((column, index) => {
        row[column] = values[index];
      });
      rows.push(row);
    }
  }
}

const summary = Object.fromEntries(
  Object.entries(tables).map(([table, rows]) => [table, rows.length]),
);
const snapshot = {
  source: path.basename(SQL_FILE),
  convertedAt: new Date().toISOString(),
  counts: summary,
  tables,
};
fs.writeFileSync(OUT_FILE, JSON.stringify(snapshot, null, 2));

const posts = tables.posts || [];
const trees = tables.published_trees || [];
const isPrivate = (row) => (row.visibility || "PUBLIC") !== "PUBLIC";
console.log(`表 ${Object.keys(tables).length} 张，共 ${Object.values(summary).reduce((a, b) => a + b, 0)} 行`);
console.log(
  `文章 ${posts.length} 篇（私密 ${posts.filter(isPrivate).length}）｜` +
    `树 ${trees.length} 棵（私密 ${trees.filter(isPrivate).length}）｜` +
    `用户 ${(tables.users || []).length}`,
);
console.log(`存档：${OUT_FILE}（${(fs.statSync(OUT_FILE).size / 1048576).toFixed(1)} MB）`);
