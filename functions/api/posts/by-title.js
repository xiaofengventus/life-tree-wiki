import { getCurrentUser } from "../../../server/auth.js";
import { ApiError, json, withApi } from "../../../server/http.js";
import { loadPost } from "../../../server/posts.js";
import { PRIVATE_VISIBILITY } from "../../../server/privateWorks.js";

export const onRequestGet = withApi(async ({ request, env }) => {
  const title = new URL(request.url).searchParams.get("title")?.trim() || "";
  if (!title || title.length > 150) {
    throw new ApiError(400, "文章标题无效", "INVALID_POST_TITLE");
  }

  // 登录者对自己「仅自己可见」的文章也能按标题打开（wiki 阅读页走这里）。
  // 非拥有者的匹配集里只有公开文章，行为与原先一致。
  const viewer = await getCurrentUser(env.DB, request);
  const row = await env.DB.prepare(
    `SELECT id FROM posts
      WHERE title = ? AND deleted_at IS NULL
        AND (visibility = 'PUBLIC' OR creator_id = ?)
      ORDER BY updated_at DESC, id DESC LIMIT 1`,
  ).bind(title, viewer?.id || "").first();
  if (!row) throw new ApiError(404, "文章不存在", "POST_NOT_FOUND");

  const post = await loadPost(env.DB, row.id, { viewerId: viewer?.id || null });
  return json(
    { success: true, post },
    {
      headers: {
        "Cache-Control": post.visibility === PRIVATE_VISIBILITY
          ? "private, no-store"
          : "public, max-age=60, stale-while-revalidate=300",
      },
    },
  );
});
