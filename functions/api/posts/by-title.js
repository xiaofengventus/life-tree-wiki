import { ApiError, json, withApi } from "../../../server/http.js";
import { loadPost } from "../../../server/posts.js";

export const onRequestGet = withApi(async ({ request, env }) => {
  const title = new URL(request.url).searchParams.get("title")?.trim() || "";
  if (!title || title.length > 150) {
    throw new ApiError(400, "文章标题无效", "INVALID_POST_TITLE");
  }

  const row = await env.DB.prepare(
    `SELECT id FROM posts
      WHERE title = ? AND deleted_at IS NULL AND visibility = 'PUBLIC'
      ORDER BY updated_at DESC, id DESC LIMIT 1`,
  ).bind(title).first();
  if (!row) throw new ApiError(404, "文章不存在", "POST_NOT_FOUND");

  const post = await loadPost(env.DB, row.id);
  return json(
    { success: true, post },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
});
