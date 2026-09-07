import { requireUser } from "../../../server/auth.js";
import { contributionSummary, CONTRIBUTION_SELECT } from "../../../server/contributions.js";
import { json, withApi } from "../../../server/http.js";
import { parsePublicId } from "../../../server/publicIds.js";

export const onRequestGet = withApi(async ({ request, env }) => {
  const user = await requireUser(env.DB, request);
  const url = new URL(request.url);
  const status = String(url.searchParams.get("status") || "").toUpperCase();
  const treeIdentifier = String(url.searchParams.get("tree") || "");
  const filters = [];
  const bindings = [];

  filters.push("(target.creator_id = ? OR tree_contributions.contributor_id = ?)");
  bindings.push(user.id, user.id);
  if (new Set(["PENDING", "APPROVED", "REJECTED"]).has(status)) {
    filters.push("tree_contributions.status = ?");
    bindings.push(status);
  }
  if (treeIdentifier) {
    const publicId = parsePublicId("tree", treeIdentifier);
    filters.push(publicId ? "target.public_id = ?" : "target.id = ?");
    bindings.push(publicId || treeIdentifier);
  }

  const result = await env.DB.prepare(
    `${CONTRIBUTION_SELECT}
      ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
      ORDER BY tree_contributions.status = 'PENDING' DESC,
               tree_contributions.updated_at DESC
      LIMIT 200`,
  ).bind(...bindings).all();
  return json({
    success: true,
    contributions: (result.results || []).map((row) => ({
      ...contributionSummary(row),
      canReview: row.target_creator_id === user.id,
      canWithdraw: row.contributor_id === user.id && row.status === "PENDING",
    })),
  });
});
