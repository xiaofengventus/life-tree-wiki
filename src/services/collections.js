import { apiRequest } from "./api";

export async function fetchCollections(uid = "") {
  const query = uid ? `?uid=${encodeURIComponent(uid)}` : "";
  return apiRequest(`/api/collections${query}`);
}

export async function createCollection({ title, description = "", visibility = "PUBLIC" }) {
  return apiRequest("/api/collections", {
    method: "POST",
    body: { title, description, visibility },
  });
}

export async function fetchCollection(id) {
  return apiRequest(`/api/collections/${encodeURIComponent(id)}`);
}

export async function updateCollection(id, changes) {
  return apiRequest(`/api/collections/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: changes,
  });
}

export async function deleteCollection(id) {
  return apiRequest(`/api/collections/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function addCollectionItems(id, items) {
  return apiRequest(`/api/collections/${encodeURIComponent(id)}/items`, {
    method: "POST",
    body: { items },
  });
}

export async function reorderCollectionItems(id, order) {
  return apiRequest(`/api/collections/${encodeURIComponent(id)}/items`, {
    method: "PATCH",
    body: { order },
  });
}

export async function removeCollectionItem(id, { targetType, targetId }) {
  const query = new URLSearchParams({ type: targetType, id: targetId });
  return apiRequest(`/api/collections/${encodeURIComponent(id)}/items?${query}`, {
    method: "DELETE",
  });
}
