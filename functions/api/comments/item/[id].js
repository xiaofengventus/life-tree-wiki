import { canDeleteOwnedContent, requireUser } from "../../../../server/auth.js";
import { ApiError, json, withApi } from "../../../../server/http.js";

export const onRequestDelete = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  const comment = await env.DB.prepare(
    "SELECT id, creator_id, root_id FROM content_comments WHERE id = ? AND deleted_at IS NULL",
  ).bind(String(params.id)).first();
  if (!comment) throw new ApiError(404, "评论不存在", "COMMENT_NOT_FOUND");
  if (!canDeleteOwnedContent(user, comment.creator_id)) {
    throw new ApiError(403, "只能删除自己的评论", "FORBIDDEN");
  }
  const now = new Date().toISOString();
  const result = comment.root_id
    ? await env.DB.prepare(
        "UPDATE content_comments SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL",
      ).bind(now, comment.id).run()
    : await env.DB.prepare(
        `UPDATE content_comments SET deleted_at = ?
          WHERE (id = ? OR root_id = ?) AND deleted_at IS NULL`,
      ).bind(now, comment.id, comment.id).run();
  return json({
    success: true,
    deletedCount: Number(result.meta?.changes || 0),
    rootDeleted: !comment.root_id,
  });
});
