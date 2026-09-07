import { requireSiteOwner, requireUser } from "../../../../server/auth.js";
import { ApiError, json, withApi } from "../../../../server/http.js";
import { loadPost } from "../../../../server/posts.js";

export const onRequestGet = withApi(async ({ request, params, env }) => {
  const administrator = await requireUser(env.DB, request);
  requireSiteOwner(administrator);

  const post = await loadPost(env.DB, String(params.id), { includeDeleted: true });
  if (!post?.deletedAt || post.visibility === "PRIVATE") {
    throw new ApiError(404, "已删除文章不存在", "DELETED_POST_NOT_FOUND");
  }
  return json({ success: true, post });
});
