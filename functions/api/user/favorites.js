import { requireUser } from "../../../server/auth.js";
import { json, withApi } from "../../../server/http.js";
import { postSummary } from "../../../server/posts.js";
import { treeSummary } from "../../../server/trees.js";

export const onRequestGet = withApi(async ({ request, env }) => {
  const user = await requireUser(env.DB, request);
  const [postResult, treeResult] = await env.DB.batch([
    env.DB.prepare(
      `SELECT posts.id, posts.public_id, posts.creator_id, posts.title, posts.author,
              posts.cover_media_hash,
              substr(posts.content_text, 1, 240) AS excerpt, posts.tags_json, posts.license,
              posts.revision_count, posts.change_note, posts.version, posts.created_at,
              posts.updated_at, users.display_name AS creator_name,
              users.public_id AS creator_public_id,
              users.avatar_media_hash AS creator_avatar_hash
         FROM content_favorites
         JOIN posts ON posts.id = content_favorites.target_id
         JOIN users ON users.id = posts.creator_id
        WHERE content_favorites.user_id = ? AND content_favorites.target_type = 'POST'
          AND posts.deleted_at IS NULL
          AND posts.visibility = 'PUBLIC'
        ORDER BY content_favorites.created_at DESC LIMIT 100`,
    ).bind(user.id),
    env.DB.prepare(
      `SELECT published_trees.*, users.display_name AS creator_name,
              users.public_id AS creator_public_id,
              users.role AS creator_role,
              users.avatar_media_hash AS creator_avatar_hash
         FROM content_favorites
         JOIN published_trees ON published_trees.id = content_favorites.target_id
         JOIN users ON users.id = published_trees.creator_id
        WHERE content_favorites.user_id = ? AND content_favorites.target_type = 'TREE'
          AND published_trees.deleted_at IS NULL
          AND published_trees.visibility = 'PUBLIC'
        ORDER BY content_favorites.created_at DESC LIMIT 100`,
    ).bind(user.id),
  ]);
  return json({
    success: true,
    posts: (postResult.results || []).map(postSummary),
    trees: (treeResult.results || []).map(treeSummary),
  });
});
