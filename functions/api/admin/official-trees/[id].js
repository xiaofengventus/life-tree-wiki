import { requireRole, requireUser } from "../../../../server/auth.js";
import { ApiError, json, readJson, withApi } from "../../../../server/http.js";
import { loadPublishedTree } from "../../../../server/trees.js";
import { parsePublicId } from "../../../../server/publicIds.js";

export const onRequestPost = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  requireRole(user, ["ADMIN"]);
  const body = await readJson(request, 2 * 1024);
  if (body.action !== "REVOKE") {
    throw new ApiError(400, "不支持的平台推荐管理操作", "INVALID_ACTION");
  }

  const identifier = String(params.id);
  const publicId = parsePublicId("tree", identifier);
  const existing = await env.DB.prepare(
    `SELECT id, platform_recommended, deleted_at FROM published_trees
      WHERE ${publicId ? "public_id = ?" : "id = ?"}
        AND visibility = 'PUBLIC'`,
  ).bind(publicId || identifier).first();
  if (!existing || existing.deleted_at) {
    throw new ApiError(404, "进化树不存在", "TREE_NOT_FOUND");
  }
  if (!existing.platform_recommended) {
    return json({ success: true, tree: await loadPublishedTree(env.DB, existing.id) });
  }

  await env.DB.prepare(
    `UPDATE published_trees
        SET platform_recommended = 0, platform_reviewed_at = NULL,
            platform_reviewed_by = NULL
      WHERE id = ? AND platform_recommended = 1`,
  ).bind(existing.id).run();
  return json({ success: true, tree: await loadPublishedTree(env.DB, existing.id) });
});
