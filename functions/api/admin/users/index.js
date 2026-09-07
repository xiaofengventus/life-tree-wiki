import { requireSiteOwner, requireUser } from "../../../../server/auth.js";
import { ApiError, json, withApi } from "../../../../server/http.js";
import { globalMediaLimit } from "../../../../server/media.js";
import { adminUser } from "../../../../server/users.js";

export const onRequestGet = withApi(async ({ request, env }) => {
  const administrator = await requireUser(env.DB, request);
  requireSiteOwner(administrator);

  const url = new URL(request.url);
  const query = String(url.searchParams.get("q") || "").trim();
  if (query.length > 80) throw new ApiError(400, "搜索内容过长", "INVALID_SEARCH");
  const requestedPage = Number(url.searchParams.get("page") || 1);
  const page = Number.isInteger(requestedPage) ? Math.max(1, requestedPage) : 1;
  const limit = 30;
  const offset = (page - 1) * limit;
  const like = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
  const where = query
    ? `WHERE users.username LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR users.display_name LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR printf('U%06d', users.public_id) LIKE ? ESCAPE '\\' COLLATE NOCASE`
    : "";
  const bindings = query ? [like, like, like] : [];

  const [rowsResult, countResult, mediaResult] = await env.DB.batch([
    env.DB.prepare(
      `SELECT users.*,
              (SELECT COUNT(*) FROM posts
                WHERE posts.creator_id = users.id AND posts.deleted_at IS NULL
                  AND posts.visibility = 'PUBLIC') AS post_count,
              (SELECT COUNT(*) FROM published_trees
                WHERE published_trees.creator_id = users.id
                  AND published_trees.deleted_at IS NULL
                  AND published_trees.visibility = 'PUBLIC') AS tree_count,
              COALESCE((SELECT used_bytes FROM media_user_usage
                WHERE media_user_usage.user_id = users.id), 0) AS media_used_bytes
         FROM users ${where}
        ORDER BY users.public_id ASC LIMIT ? OFFSET ?`,
    ).bind(...bindings, limit, offset),
    env.DB.prepare(`SELECT COUNT(*) AS count FROM users ${where}`).bind(...bindings),
    env.DB.prepare("SELECT used_bytes FROM media_global_usage WHERE id = 1"),
  ]);

  const total = Number(countResult.results?.[0]?.count || 0);
  return json({
    success: true,
    users: (rowsResult.results || []).map(adminUser),
    page,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    media: {
      usedBytes: Number(mediaResult.results?.[0]?.used_bytes || 0),
      limitBytes: globalMediaLimit(env),
    },
  });
});
