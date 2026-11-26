// 线上数据全量存档脚本（一次性工具，不参与站点构建）。
//
// 用途：把 life-tree-wiki.pages.dev 上公开的文章与进化树完整拉下来，
// 存成一份可回灌的 JSON，后面无论怎么改代码都不再依赖线上。
//
// 用法：node scripts/archive-site-data.mjs
// 产物：archive/site-data-<时间戳>.json
//
// 只读 GET，不写线上任何数据。
import fs from "node:fs";
import path from "node:path";

const ORIGIN = process.env.ARCHIVE_ORIGIN || "https://life-tree-wiki.pages.dev";
const OUT_DIR = path.resolve("archive");

async function getJson(url, cookie = "") {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const headers = { accept: "application/json" };
      // 私密文章/树只对作者可见，需要带上登录会话。
      if (cookie) headers.cookie = cookie;
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
      return await response.json();
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
    }
  }
}

// 列表接口都是「limit + nextCursor」形式：一直翻到 nextCursor 为空。
async function collectAll(pathname, key, limit, cookie = "") {
  const items = [];
  let cursor = "";
  for (;;) {
    const url = `${ORIGIN}${pathname}?limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const body = await getJson(url, cookie);
    const page = body[key] || [];
    items.push(...page);
    process.stdout.write(`\r${pathname} 已拉取 ${items.length} 条   `);
    if (!body.nextCursor || page.length === 0) break;
    cursor = body.nextCursor;
  }
  process.stdout.write("\n");
  return items;
}

// 列表项只是摘要，正文与完整树文档要逐条取详情。
async function collectDetails(pathname, list, key, cookie = "") {
  const details = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    try {
      const body = await getJson(`${ORIGIN}${pathname}/${item.id}`, cookie);
      details.push(body[key] || body);
    } catch (error) {
      details.push({ ...item, __error: String(error?.message || error) });
    }
    if ((i + 1) % 10 === 0 || i + 1 === list.length) {
      process.stdout.write(`\r${pathname}/:id 详情 ${i + 1}/${list.length}   `);
    }
  }
  process.stdout.write("\n");
  return details;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  // ARCHIVE_COOKIE：登录后的 Cookie，带上它才能拉到私密文章/树。
  const cookie = process.env.ARCHIVE_COOKIE || "";
  console.log(`存档来源：${ORIGIN}`);
  console.log(cookie ? "已带登录会话：会包含私密内容" : "未带登录会话：仅公开内容");

  const postList = await collectAll("/api/posts", "posts", 50, cookie);
  const posts = await collectDetails("/api/posts", postList, "post", cookie);

  // kind=all：官方树与用户树都要，历史包袱清掉前先全量留底。
  const treeList = await collectAll("/api/trees", "trees", 100, cookie);
  const trees = await collectDetails("/api/trees", treeList, "tree", cookie);

  const snapshot = {
    origin: ORIGIN,
    archivedAt: new Date().toISOString(),
    includesPrivate: Boolean(cookie),
    counts: {
      posts: posts.length,
      trees: trees.length,
      privatePosts: posts.filter((post) => post.isPrivate || post.visibility !== "PUBLIC").length,
      privateTrees: trees.filter((tree) => tree.isPrivate || tree.visibility !== "PUBLIC").length,
    },
    posts,
    trees,
  };
  const stamp = snapshot.archivedAt.replace(/[:.]/g, "-");
  const file = path.join(OUT_DIR, `site-data-${cookie ? "private-" : ""}${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(snapshot, null, 2));
  console.log(
    `完成：${posts.length} 篇文章（私密 ${snapshot.counts.privatePosts}）、` +
      `${trees.length} 棵树（私密 ${snapshot.counts.privateTrees}）`,
  );
  console.log(`存档：${file}（${(fs.statSync(file).size / 1048576).toFixed(1)} MB）`);
}

main().catch((error) => {
  console.error("存档失败：", error);
  process.exit(1);
});
