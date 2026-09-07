import { requireUser } from "../../../../server/auth.js";
import { ApiError, json, withApi } from "../../../../server/http.js";
import { enforceRateLimit } from "../../../../server/rateLimit.js";
import { loadPublishedTree } from "../../../../server/trees.js";
import { parsePublicId } from "../../../../server/publicIds.js";

export const onRequestPost = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  await enforceRateLimit(env.DB, `tree-fork:${user.id}`, 30, 24 * 60 * 60);
  const identifier = String(params.id);
  const publicId = parsePublicId("tree", identifier);
  const source = await env.DB.prepare(
    `SELECT id, creator_id, version, fork_enabled
       FROM published_trees
      WHERE ${publicId ? "public_id = ?" : "id = ?"}
        AND deleted_at IS NULL
        AND visibility = 'PUBLIC'`,
  ).bind(publicId || identifier).first();
  if (!source) throw new ApiError(404, "进化树不存在", "TREE_NOT_FOUND");
  if (!source.fork_enabled) {
    throw new ApiError(403, "创作者没有开放这棵树的 Fork", "FORK_DISABLED");
  }
  if (source.creator_id === user.id) {
    throw new ApiError(400, "自己的树可直接编辑或另存为新树", "SELF_FORK");
  }

  let fork = await env.DB.prepare(
    `SELECT * FROM tree_forks WHERE source_tree_id = ? AND user_id = ?`,
  ).bind(source.id, user.id).first();
  if (!fork) {
    fork = {
      id: crypto.randomUUID(),
      source_tree_id: source.id,
      user_id: user.id,
      source_version: Number(source.version),
      published_tree_id: null,
      created_at: new Date().toISOString(),
    };
    await env.DB.prepare(
      `INSERT INTO tree_forks
        (id, source_tree_id, user_id, source_version, published_tree_id, created_at)
       VALUES (?, ?, ?, ?, NULL, ?)`,
    ).bind(
      fork.id, fork.source_tree_id, fork.user_id, fork.source_version, fork.created_at,
    ).run();
  } else if (fork.published_tree_id) {
    throw new ApiError(409, "你已经发布过这棵树的 Fork", "FORK_ALREADY_PUBLISHED");
  }

  return json({
    success: true,
    fork: {
      id: fork.id,
      sourceVersion: Number(fork.source_version),
      createdAt: fork.created_at,
    },
    tree: await loadPublishedTree(env.DB, source.id),
  }, { status: 201 });
});
