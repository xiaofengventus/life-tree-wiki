import { requireRole, requireUser } from "../../../../server/auth.js";
import { ApiError, json, readJson, withApi } from "../../../../server/http.js";
import { enforceRateLimit } from "../../../../server/rateLimit.js";
import { canRemovePostFromFolder } from "../../../../server/folders.js";

async function loadFolder(DB, id) {
  const row = await DB.prepare("SELECT * FROM folders WHERE id = ?")
    .bind(String(id || ""))
    .first();
  if (!row) throw new ApiError(404, "文件夹不存在", "FOLDER_NOT_FOUND");
  return row;
}

async function loadPostRow(DB, postId) {
  const row = await DB.prepare(
    "SELECT id, creator_id, visibility, deleted_at FROM posts WHERE id = ?",
  ).bind(String(postId || "")).first();
  if (!row || row.deleted_at) {
    throw new ApiError(404, "文章不存在", "POST_NOT_FOUND");
  }
  return row;
}

// POST /api/folders/:id/posts —— 把文章放进文件夹（任何登录用户都能放）。
// 公开文章任何人可放；私密文章只有作者本人能放，且只能放进私密文件夹
// （否则等于把自己的私密文章挂进公共夹子给访客点名）。
// 同一篇文章同时只属于一个文件夹，放进新夹子 = 从旧夹子移过来。
export const onRequestPost = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  requireRole(user, ["USER", "ADMIN", "COOPERATOR"]);
  await enforceRateLimit(env.DB, `folder-add:${user.id}`, 60, 60);
  const folder = await loadFolder(env.DB, params.id);
  const body = await readJson(request);
  const post = await loadPostRow(env.DB, body.postId);
  if (post.visibility !== "PUBLIC") {
    if (post.creator_id !== user.id) {
      throw new ApiError(403, "别人的私密文章对你不可见", "FORBIDDEN");
    }
    if (!folder.is_private) {
      throw new ApiError(400, "私密文章只能放进私密文件夹", "POST_NOT_PUBLIC");
    }
  }
  if (post.id === folder.id) return json({ success: true });
  const now = new Date().toISOString();
  await env.DB.prepare(
    "UPDATE posts SET folder_id = ?, updated_at = ? WHERE id = ?",
  ).bind(folder.id, now, post.id).run();
  return json({ success: true, folderId: folder.id, postId: post.id });
});

// DELETE /api/folders/:id/posts —— 把文章从文件夹里拿出来（文章作者 / 夹主 / ADMIN / 站点所有者）。
// 拿出来 = 回到「未分类」散文章，不是删文章。
export const onRequestDelete = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  requireRole(user, ["USER", "ADMIN", "COOPERATOR"]);
  await enforceRateLimit(env.DB, `folder-remove:${user.id}`, 60, 60);
  const folder = await loadFolder(env.DB, params.id);
  const body = await readJson(request);
  const post = await loadPostRow(env.DB, body.postId);
  if (!canRemovePostFromFolder(user, folder, post.creator_id)) {
    throw new ApiError(
      403,
      "只有文章作者或文件夹创建者可以移出文章",
      "FORBIDDEN",
    );
  }
  await env.DB.prepare(
    "UPDATE posts SET folder_id = NULL WHERE id = ? AND folder_id = ?",
  ).bind(post.id, folder.id).run();
  return json({ success: true, postId: post.id });
});
