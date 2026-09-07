import { apiRequest } from "./api";

export async function fetchTreeList(kind = "USER") {
  const queryKind = kind === "ALL" ? "all" : kind === "OFFICIAL" ? "official" : "user";
  const limit = kind === "ALL" ? 100 : 50;
  const payload = await apiRequest(`/api/trees?kind=${queryKind}&limit=${limit}`);
  return payload.trees;
}

// 分页拉取树列表（每页默认 8 条，返回 nextCursor 供加载更多）
export async function fetchTreePage(kind = "ALL", { limit = 8, cursor = null } = {}) {
  const queryKind = kind === "ALL" ? "all" : kind === "OFFICIAL" ? "official" : "user";
  const query = new URLSearchParams({ kind: queryKind, limit: String(limit) });
  if (cursor) query.set("cursor", cursor);
  const payload = await apiRequest(`/api/trees?${query}`);
  return { trees: payload.trees || [], nextCursor: payload.nextCursor || null };
}

export async function fetchTree(id) {
  const payload = await apiRequest(`/api/trees/${encodeURIComponent(id)}`);
  return payload.tree;
}

export async function createUserTree(tree) {
  const payload = await apiRequest("/api/trees", { method: "POST", body: tree, timeout: 30000 });
  return payload.tree;
}

export async function updateTree(id, tree) {
  const payload = await apiRequest(`/api/trees/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: tree,
    timeout: 30000,
  });
  return payload.tree;
}

export async function deleteTree(id) {
  const payload = await apiRequest(`/api/trees/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return payload.tree;
}

export async function forkTree(id) {
  const payload = await apiRequest(`/api/trees/${encodeURIComponent(id)}/fork`, {
    method: "POST",
  });
  return payload;
}

export async function submitTreeContribution(id, contribution) {
  const payload = await apiRequest(
    `/api/trees/${encodeURIComponent(id)}/contributions`,
    { method: "POST", body: contribution, timeout: 30000 },
  );
  return payload.contribution;
}

export async function fetchTreeContributions({ tree = "", status = "" } = {}) {
  const query = new URLSearchParams();
  if (tree) query.set("tree", tree);
  if (status) query.set("status", status);
  const payload = await apiRequest(`/api/contributions?${query}`);
  return payload.contributions || [];
}

export async function fetchTreeContribution(id) {
  const payload = await apiRequest(`/api/contributions/${encodeURIComponent(id)}`);
  return payload.contribution;
}

export async function reviewTreeContribution(id, action, reviewNote = "") {
  const payload = await apiRequest(`/api/contributions/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: { action, reviewNote },
    timeout: 30000,
  });
  return payload;
}

export async function withdrawTreeContribution(id) {
  return apiRequest(`/api/contributions/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function fetchAdminOfficialTrees() {
  const payload = await apiRequest("/api/admin/official-trees");
  return {
    trees: payload.trees || [],
    requests: payload.requests || [],
  };
}

export async function revokePlatformRecommendation(id) {
  const payload = await apiRequest(`/api/admin/official-trees/${encodeURIComponent(id)}`, {
    method: "POST",
    body: { action: "REVOKE" },
  });
  return payload.tree;
}

export async function fetchOfficialTreeRequest(id) {
  const payload = await apiRequest(`/api/trees/${encodeURIComponent(id)}/official-request`);
  return payload.request || null;
}

export async function createOfficialTreeRequest(id, message = "") {
  const payload = await apiRequest(`/api/trees/${encodeURIComponent(id)}/official-request`, {
    method: "POST",
    body: { message },
  });
  return payload.request;
}

export async function reviewOfficialTreeRequest(
  treeId,
  requestId,
  action,
  responseNote = "",
) {
  return apiRequest(`/api/trees/${encodeURIComponent(treeId)}/official-request`, {
    method: "PUT",
    body: { requestId, action, responseNote },
    timeout: 30000,
  });
}

export async function withdrawOfficialTreeRequest(treeId, requestId) {
  return apiRequest(
    `/api/trees/${encodeURIComponent(treeId)}/official-request?requestId=${encodeURIComponent(requestId)}`,
    { method: "DELETE" },
  );
}
