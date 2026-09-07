import { apiRequest } from "./api";

/**
 * 统一知识搜索：文章（标题）/ 树（标题）/ 生命树节点（节点文字）。
 * 节点结果可直接跳转 /life-tree/:treeUid?node=:nodeId 定位高亮。
 */
export async function searchKnowledge(keyword, limit = 8) {
  const query = new URLSearchParams({ q: String(keyword || "").trim() });
  if (limit) query.set("limit", String(limit));
  const payload = await apiRequest(`/api/search?${query}`);
  return {
    keyword: payload.keyword || "",
    posts: payload.posts || [],
    trees: payload.trees || [],
    nodes: payload.nodes || [],
  };
}
