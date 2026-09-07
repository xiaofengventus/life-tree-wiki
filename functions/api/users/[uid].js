import { ApiError, json, withApi } from "../../../server/http.js";
import { parsePublicId } from "../../../server/publicIds.js";
import { postSummary } from "../../../server/posts.js";
import { treeSummary } from "../../../server/trees.js";
import { publicProfile } from "../../../server/users.js";
import { getCurrentUser } from "../../../server/auth.js";
import { PRIVATE_WORK_LIMIT } from "../../../server/privateWorks.js";

export const onRequestGet = withApi(async ({ request, params, env }) => {
  const publicId = parsePublicId("user", params.uid);
  if (!publicId) throw new ApiError(404, "用户不存在", "USER_NOT_FOUND");

  const user = await env.DB.prepare(
    `SELECT id, public_id, display_name, bio, role, level, experience,
            avatar_media_hash, created_at
       FROM users
      WHERE public_id = ? AND status = 'ACTIVE'`,
  ).bind(publicId).first();
  if (!user) throw new ApiError(404, "用户不存在", "USER_NOT_FOUND");
  const viewer = await getCurrentUser(env.DB, request);
  const isOwner = viewer?.id === user.id;

  const [postResult, treeResult, countResult, privatePostResult, privateTreeResult] =
    await env.DB.batch([
    env.DB.prepare(
      `SELECT posts.id, posts.public_id, posts.creator_id, posts.title, posts.author,
              posts.cover_media_hash,
              substr(posts.content_text, 1, 240) AS excerpt, posts.tags_json, posts.license,
              posts.revision_count, posts.change_note, posts.version, posts.created_at,
              posts.updated_at, users.display_name AS creator_name,
              users.public_id AS creator_public_id,
              users.avatar_media_hash AS creator_avatar_hash
         FROM posts JOIN users ON users.id = posts.creator_id
        WHERE users.public_id = ? AND posts.deleted_at IS NULL
          AND posts.visibility = 'PUBLIC'
        ORDER BY posts.public_id DESC LIMIT 100`,
    ).bind(publicId),
    env.DB.prepare(
      `SELECT published_trees.*, users.display_name AS creator_name,
              users.public_id AS creator_public_id,
              users.role AS creator_role,
              users.avatar_media_hash AS creator_avatar_hash
         FROM published_trees JOIN users ON users.id = published_trees.creator_id
        WHERE users.public_id = ? AND published_trees.deleted_at IS NULL
          AND published_trees.visibility = 'PUBLIC'
        ORDER BY published_trees.public_id DESC LIMIT 100`,
    ).bind(publicId),
    env.DB.prepare(
      `SELECT
         (SELECT COUNT(*) FROM posts
           WHERE creator_id = (SELECT id FROM users WHERE public_id = ?)
             AND deleted_at IS NULL AND visibility = 'PUBLIC') AS post_count,
         (SELECT COUNT(*) FROM published_trees
           WHERE creator_id = (SELECT id FROM users WHERE public_id = ?)
             AND deleted_at IS NULL AND visibility = 'PUBLIC') AS tree_count`,
    ).bind(publicId, publicId),
    env.DB.prepare(
      `SELECT posts.id, posts.public_id, posts.creator_id, posts.title, posts.author,
              posts.cover_media_hash,
              substr(posts.content_text, 1, 240) AS excerpt, posts.tags_json, posts.license,
              posts.revision_count, posts.change_note, posts.version, posts.visibility,
              posts.created_at, posts.updated_at, users.display_name AS creator_name,
              users.public_id AS creator_public_id,
              users.avatar_media_hash AS creator_avatar_hash
         FROM posts JOIN users ON users.id = posts.creator_id
        WHERE posts.creator_id = ? AND posts.visibility = 'PRIVATE'
          AND posts.deleted_at IS NULL
        ORDER BY posts.updated_at DESC, posts.id DESC LIMIT 5`,
    ).bind(isOwner ? user.id : ""),
    env.DB.prepare(
      `SELECT published_trees.*, users.display_name AS creator_name,
              users.public_id AS creator_public_id,
              users.role AS creator_role,
              users.avatar_media_hash AS creator_avatar_hash
         FROM published_trees JOIN users ON users.id = published_trees.creator_id
        WHERE published_trees.creator_id = ? AND published_trees.visibility = 'PRIVATE'
          AND published_trees.deleted_at IS NULL
        ORDER BY published_trees.updated_at DESC, published_trees.id DESC LIMIT 5`,
    ).bind(isOwner ? user.id : ""),
  ]);
  const [followResult, relationResult] = await Promise.all([
    env.DB.prepare(
      `SELECT
        (SELECT COUNT(*) FROM user_follows WHERE followed_id = ?) AS followers,
        (SELECT COUNT(*) FROM user_follows WHERE follower_id = ?) AS following`,
    ).bind(user.id, user.id).first(),
    viewer && viewer.id !== user.id
      ? env.DB.prepare(
          "SELECT 1 AS active FROM user_follows WHERE follower_id = ? AND followed_id = ?",
        ).bind(viewer.id, user.id).first()
      : null,
  ]);

  const posts = (postResult.results || []).map(postSummary);
  const trees = (treeResult.results || []).map(treeSummary);
  const privatePosts = isOwner ? (privatePostResult.results || []).map(postSummary) : [];
  const privateTrees = isOwner ? (privateTreeResult.results || []).map(treeSummary) : [];
  return json({
    success: true,
    user: {
      ...publicProfile(user),
      followers: Number(followResult?.followers || 0),
      following: Number(followResult?.following || 0),
      isFollowing: Boolean(relationResult),
    },
    posts,
    trees,
    privateWorks: isOwner
      ? {
          posts: privatePosts,
          trees: privateTrees,
          used: privatePosts.length + privateTrees.length,
          limit: PRIVATE_WORK_LIMIT,
        }
      : null,
    counts: {
      posts: Number(countResult.results?.[0]?.post_count || 0),
      trees: Number(countResult.results?.[0]?.tree_count || 0),
    },
  });
});
