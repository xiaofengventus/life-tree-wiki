import { apiRequest } from "./api";

export async function fetchUserSpace(uid) {
  return apiRequest(`/api/users/${encodeURIComponent(uid)}`);
}

export async function fetchAdminUsers({ query = "", page = 1 } = {}) {
  const parameters = new URLSearchParams({ page: String(page) });
  if (query.trim()) parameters.set("q", query.trim());
  return apiRequest(`/api/admin/users?${parameters}`);
}

export async function updateAdminUser(uid, changes) {
  const payload = await apiRequest(`/api/admin/users/${encodeURIComponent(uid)}`, {
    method: "PATCH",
    body: changes,
  });
  return payload.user;
}
