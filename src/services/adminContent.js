import { apiRequest } from "./api";

export async function fetchDeletedPosts() {
  const payload = await apiRequest("/api/admin/deleted-posts");
  return payload.posts || [];
}

export async function fetchDeletedPost(id) {
  const payload = await apiRequest(
    `/api/admin/deleted-posts/${encodeURIComponent(id)}`,
  );
  return payload.post;
}
