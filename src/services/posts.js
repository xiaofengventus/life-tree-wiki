import { ApiRequestError, apiRequest } from "./api";

export async function fetchPostList(cursor = null) {
  const parameters = new URLSearchParams({ limit: "50" });
  if (cursor) parameters.set("cursor", cursor);
  return apiRequest(`/api/posts?${parameters}`);
}

// 分页拉取专栏文章（每页默认 8 条；type: "news" 新闻 / "science" 科普 / "" 未分类）
export async function fetchPostPage({ limit = 8, cursor = null, type } = {}) {
  const parameters = new URLSearchParams({ limit: String(limit) });
  if (cursor) parameters.set("cursor", cursor);
  if (type !== undefined) parameters.set("type", type);
  const payload = await apiRequest(`/api/posts?${parameters}`);
  return { posts: payload.posts || [], nextCursor: payload.nextCursor || null };
}

export async function fetchPost(id) {
  const payload = await apiRequest(`/api/posts/${encodeURIComponent(id)}`);
  return payload.post;
}

export async function fetchPostByTitle(title) {
  const parameters = new URLSearchParams({ title: String(title || "") });
  const payload = await apiRequest(`/api/posts/by-title?${parameters}`);
  if (!payload?.post) {
    throw new ApiRequestError("文章服务暂不可用，请稍后重试");
  }
  return payload.post;
}

export async function createPost(post) {
  const payload = await apiRequest("/api/posts", { method: "POST", body: post });
  return payload.post;
}

export async function updatePost(id, post) {
  const payload = await apiRequest(`/api/posts/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: post,
  });
  return payload.post;
}

export async function deletePost(id) {
  const payload = await apiRequest(`/api/posts/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return payload.post;
}
