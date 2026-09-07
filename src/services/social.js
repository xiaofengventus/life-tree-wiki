import { apiRequest } from "./api";

function targetPath(type, id) {
  return `${encodeURIComponent(String(type).toLowerCase())}/${encodeURIComponent(id)}`;
}

export async function fetchInteractions(type, id) {
  const payload = await apiRequest(`/api/interactions/${targetPath(type, id)}`);
  return payload.state;
}

export async function updateInteraction(type, id, action, active) {
  const payload = await apiRequest(`/api/interactions/${targetPath(type, id)}`, {
    method: "POST",
    body: { action, active },
  });
  return payload.state;
}

export async function recordView(type, id) {
  const payload = await apiRequest(`/api/interactions/${targetPath(type, id)}`, {
    method: "POST",
    body: { action: "VIEW" },
  });
  return payload.state;
}

export async function fetchComments(type, id, { cursor = "" } = {}) {
  const parameters = new URLSearchParams();
  if (cursor) parameters.set("cursor", cursor);
  const query = parameters.size ? `?${parameters}` : "";
  const payload = await apiRequest(`/api/comments/${targetPath(type, id)}${query}`);
  return {
    comments: payload.comments || [],
    nextCursor: payload.nextCursor || "",
  };
}

export async function fetchCommentReplies(type, id, rootId, { cursor = "" } = {}) {
  const parameters = new URLSearchParams({ root: rootId });
  if (cursor) parameters.set("cursor", cursor);
  const payload = await apiRequest(
    `/api/comments/${targetPath(type, id)}?${parameters}`,
  );
  return {
    comments: payload.comments || [],
    nextCursor: payload.nextCursor || "",
  };
}

export async function createComment(type, id, content, parentId = "") {
  const payload = await apiRequest(`/api/comments/${targetPath(type, id)}`, {
    method: "POST",
    body: { content, ...(parentId ? { parentId } : {}) },
  });
  return payload.comment;
}

export function deleteComment(id) {
  return apiRequest(`/api/comments/item/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function setFollowing(uid, following) {
  const payload = await apiRequest(`/api/social/follow/${encodeURIComponent(uid)}`, {
    method: "POST",
    body: { following },
  });
  return payload.state;
}

export function fetchConnections(uid) {
  return apiRequest(`/api/users/${encodeURIComponent(uid)}/connections`);
}

export function fetchFavorites() {
  return apiRequest("/api/user/favorites");
}
