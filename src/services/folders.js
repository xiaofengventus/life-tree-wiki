import { apiRequest } from "./api";

// 专栏文件夹（2026-10-12）：与文章 type 无关的组织层。
// 一级分区固定 科普(science) / 新闻(news) / 未分类(none)；文章放进文件夹 = folder_id。
export async function fetchFolders() {
  const payload = await apiRequest("/api/folders");
  return payload.sections || { science: [], news: [], none: [] };
}

export async function createFolder({ name, section, isPrivate = false }) {
  const payload = await apiRequest("/api/folders", {
    method: "POST",
    body: { name, section, isPrivate },
  });
  return payload.folder;
}

// 改名 / 换区（换区 = 把文件夹挪到另一个分区，不影响里面的文章）
export async function updateFolder(id, { name, section } = {}) {
  const payload = await apiRequest(`/api/folders/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { ...(name !== undefined ? { name } : {}), ...(section !== undefined ? { section } : {}) },
  });
  return payload.folder;
}

// 删文件夹：里面文章自动回「未分类」（后端把 folder_id 置 NULL）
export async function deleteFolder(id) {
  const payload = await apiRequest(`/api/folders/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return payload.folder;
}

// 放进文件夹（任何登录用户都能放；同一篇文章同时只在一个文件夹里）
export async function addPostToFolder(folderId, postId) {
  return apiRequest(`/api/folders/${encodeURIComponent(folderId)}/posts`, {
    method: "POST",
    body: { postId },
  });
}

// 移出文件夹（文章作者 / 夹主 / 管理员）；移出 = 回「未分类」，不是删文章
export async function removePostFromFolder(folderId, postId) {
  return apiRequest(`/api/folders/${encodeURIComponent(folderId)}/posts`, {
    method: "DELETE",
    body: { postId },
  });
}
