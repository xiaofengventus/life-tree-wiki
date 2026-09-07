import { requireRole, requireUser } from "../../../server/auth.js";
import { ApiError, json, withApi } from "../../../server/http.js";
import { formatPublicId } from "../../../server/publicIds.js";
import { treeSummary } from "../../../server/trees.js";

export const onRequestGet = withApi(async ({ request, env }) => {
  const user = await requireUser(env.DB, request);
  requireRole(user, ["ADMIN"]);

  const [treeResult, requestResult] = await Promise.all([
    env.DB.prepare(
      `SELECT published_trees.*, users.display_name AS creator_name,
              users.public_id AS creator_public_id,
              users.role AS creator_role,
              users.avatar_media_hash AS creator_avatar_hash
         FROM published_trees
         JOIN users ON users.id = published_trees.creator_id
        WHERE published_trees.platform_recommended = 1
          AND published_trees.deleted_at IS NULL
          AND published_trees.visibility = 'PUBLIC'
        ORDER BY published_trees.updated_at DESC, published_trees.id DESC
        LIMIT 200`,
    ).all(),
    env.DB.prepare(
      `SELECT tree_official_requests.*,
              source.public_id AS tree_public_id,
              source.title AS tree_title,
              source.version AS tree_version,
              applicant.display_name AS applicant_name,
              applicant.public_id AS applicant_public_id,
              author.display_name AS author_name,
              author.public_id AS author_public_id
         FROM tree_official_requests
         JOIN published_trees AS source ON source.id = tree_official_requests.tree_id
         JOIN users AS applicant ON applicant.id = tree_official_requests.applicant_id
         JOIN users AS author ON author.id = tree_official_requests.author_id
        WHERE tree_official_requests.status = 'PENDING'
          AND source.deleted_at IS NULL
          AND source.visibility = 'PUBLIC'
        ORDER BY tree_official_requests.created_at ASC
        LIMIT 200`,
    ).all(),
  ]);

  const requests = (requestResult.results || []).map((row) => {
    const selfRecommendation = row.applicant_id === row.author_id;
    return {
      id: row.id,
      treeUid: formatPublicId("tree", row.tree_public_id),
      treeTitle: row.tree_title,
      treeVersion: Number(row.tree_version || 1),
      requestType: selfRecommendation ? "SELF_RECOMMENDATION" : "ADMIN_NOMINATION",
      applicant: {
        uid: formatPublicId("user", row.applicant_public_id),
        name: row.applicant_name,
      },
      author: {
        uid: formatPublicId("user", row.author_public_id),
        name: row.author_name,
      },
      message: row.message || "",
      status: row.status,
      createdAt: row.created_at,
      canReview: selfRecommendation,
    };
  });

  return json({
    success: true,
    trees: (treeResult.results || []).map(treeSummary),
    requests,
  });
});

export const onRequestPost = withApi(async ({ request, env }) => {
  const user = await requireUser(env.DB, request);
  requireRole(user, ["ADMIN"]);
  throw new ApiError(
    409,
    "平台推荐不再创建树副本；请先发布用户树，再由作者自荐或管理员提名",
    "PLATFORM_TREE_COPY_DISABLED",
  );
});
