import { json, withApi } from "../../../server/http.js";
import { formatPublicId } from "../../../server/publicIds.js";

function parseTags(value) {
  try {
    const tags = JSON.parse(value || "[]");
    return Array.isArray(tags) ? tags : [];
  } catch {
    return [];
  }
}

// 转义 LIKE 通配符，防止 % _ \ 干扰匹配
function escapeLike(value) {
  return String(value).replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

function walkTreeNodes(node, keyword, matches, depth = 0, path = []) {
  if (!node || matches.length >= 12) return;
  const text = String(node.data?.text || "").trim();
  const nextPath = text ? [...path, text] : path;
  if (
    text &&
    text.length <= 200 &&
    text.toLowerCase().includes(keyword.toLowerCase())
  ) {
    matches.push({ nodeId: node.data?.uid || "", nodeText: text, path: nextPath.slice(0, -1) });
  }
  for (const child of node.children || []) {
    walkTreeNodes(child, keyword, matches, depth + 1, nextPath);
    if (matches.length >= 12) return;
  }
}

export const onRequestGet = withApi(async ({ request, env }) => {
  const url = new URL(request.url);
  const keyword = (url.searchParams.get("q") || "").trim().slice(0, 80);
  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get("limit") || 8)));
  if (!keyword) {
    return json({ success: true, keyword, posts: [], trees: [], nodes: [] });
  }
  const pattern = `%${escapeLike(keyword)}%`;

  // 各类查询互不拖累：单类失败时返回空列表而不是整个搜索报错
  const safeQuery = async (statement, ...bindings) => {
    try {
      const result = await statement.bind(...bindings).all();
      return result.results || [];
    } catch (error) {
      console.warn("search query failed", error);
      return [];
    }
  };

  const postResult = await safeQuery(
    env.DB.prepare(
      `SELECT posts.id, posts.public_id, posts.title, posts.type, posts.tags_json,
            substr(posts.content_text, 1, 160) AS excerpt,
            users.display_name AS creator_name
       FROM posts JOIN users ON users.id = posts.creator_id
      WHERE posts.deleted_at IS NULL AND posts.visibility = 'PUBLIC'
        AND (posts.title LIKE ? ESCAPE '\\' OR posts.tags_json LIKE ? ESCAPE '\\')
      ORDER BY posts.updated_at DESC, posts.id DESC LIMIT ?`,
    ),
    pattern,
    pattern,
    limit,
  );

  const treeResult = await safeQuery(
    env.DB.prepare(
      `SELECT published_trees.id, published_trees.public_id, published_trees.title,
            published_trees.description, published_trees.node_count,
            published_trees.tags_json, users.display_name AS creator_name
       FROM published_trees JOIN users ON users.id = published_trees.creator_id
      WHERE published_trees.deleted_at IS NULL
        AND published_trees.visibility = 'PUBLIC'
        AND (published_trees.title LIKE ? ESCAPE '\\' OR published_trees.tags_json LIKE ? ESCAPE '\\')
      ORDER BY published_trees.updated_at DESC, published_trees.id DESC LIMIT ?`,
    ),
    pattern,
    pattern,
    limit,
  );

  // 生命树节点：在公开树的文档 JSON 里做初步筛选，再解析文档逐节点匹配文字
  const nodeMatches = [];
  const candidateTrees = await safeQuery(
    env.DB.prepare(
      `SELECT published_trees.id, published_trees.public_id, published_trees.title,
            published_trees.document_json
       FROM published_trees
      WHERE published_trees.deleted_at IS NULL
        AND published_trees.visibility = 'PUBLIC'
        AND published_trees.document_json LIKE ? ESCAPE '\\'
      ORDER BY published_trees.updated_at DESC, published_trees.id DESC LIMIT 24`,
    ),
    pattern,
  );

  for (const tree of candidateTrees || []) {
    if (nodeMatches.length >= limit) break;
    let root = null;
    try {
      const document = JSON.parse(tree.document_json);
      root = document?.root || document?.document?.root || null;
    } catch {
      continue;
    }
    const matches = [];
    walkTreeNodes(root, keyword, matches);
    for (const match of matches) {
      if (nodeMatches.length >= limit) break;
      if (!match.nodeId) continue;
      nodeMatches.push({
        treeId: tree.id,
        treeUid: formatPublicId("tree", tree.public_id),
        treeTitle: tree.title,
        nodeId: match.nodeId,
        nodeText: match.nodeText,
        path: match.path,
      });
    }
  }

  return json(
    {
      success: true,
      keyword,
      posts: (postResult || []).map((row) => ({
        id: row.id,
        uid: formatPublicId("post", row.public_id),
        title: row.title,
        type: row.type || "",
        excerpt: row.excerpt || "",
        tags: parseTags(row.tags_json),
        creator: row.creator_name,
      })),
      trees: (treeResult || []).map((row) => ({
        id: row.id,
        uid: formatPublicId("tree", row.public_id),
        title: row.title,
        description: row.description || "",
        nodeCount: Number(row.node_count || 0),
        tags: parseTags(row.tags_json),
        creator: row.creator_name,
      })),
      nodes: nodeMatches,
    },
    { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" } },
  );
});
