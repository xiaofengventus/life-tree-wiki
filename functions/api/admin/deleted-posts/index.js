import { requireSiteOwner, requireUser } from "../../../../server/auth.js";
import { json, withApi } from "../../../../server/http.js";
import { postSummary } from "../../../../server/posts.js";

export const onRequestGet = withApi(async ({ request, env }) => {
  const administrator = await requireUser(env.DB, request);
  requireSiteOwner(administrator);

  const result = await env.DB.prepare(
    `SELECT posts.id, posts.public_id, posts.creator_id, posts.title, posts.author,
            posts.cover_media_hash,
            substr(posts.content_text, 1, 240) AS excerpt, posts.tags_json, posts.license,
            posts.revision_count, posts.change_note, posts.version, posts.created_at,
            posts.updated_at, posts.deleted_at, users.display_name AS creator_name,
            users.public_id AS creator_public_id,
            users.avatar_media_hash AS creator_avatar_hash
       FROM posts JOIN users ON users.id = posts.creator_id
      WHERE posts.deleted_at IS NOT NULL
        AND posts.visibility = 'PUBLIC'
      ORDER BY posts.deleted_at DESC, posts.id DESC
      LIMIT 200`,
  ).all();

  return json({
    success: true,
    posts: (result.results || []).map(postSummary),
  });
});
