import { isSiteOwner, requireUser } from "../../../../server/auth.js";
import { ApiError, json, readJson, withApi } from "../../../../server/http.js";
import { enforceRateLimit } from "../../../../server/rateLimit.js";
import { formatPublicId, parsePublicId } from "../../../../server/publicIds.js";
import { loadPublishedTree } from "../../../../server/trees.js";
import { cleanText } from "../../../../server/validation.js";

const REQUEST_SELECT = `
  SELECT tree_official_requests.*,
         source.public_id AS tree_public_id,
         source.title AS tree_title,
         source.kind AS tree_kind,
         source.version AS tree_version,
         source.platform_recommended AS tree_platform_recommended,
         source.creator_id AS tree_creator_id,
         source.deleted_at AS tree_deleted_at,
         applicant.display_name AS applicant_name,
         applicant.public_id AS applicant_public_id,
         applicant.role AS applicant_role,
         applicant.status AS applicant_status,
         author.display_name AS author_name,
         author.public_id AS author_public_id
    FROM tree_official_requests
    JOIN published_trees AS source ON source.id = tree_official_requests.tree_id
    JOIN users AS applicant ON applicant.id = tree_official_requests.applicant_id
    JOIN users AS author ON author.id = tree_official_requests.author_id`;

function canAdministerRecommendations(user) {
  return user.role === "ADMIN" || isSiteOwner(user);
}

function isSelfRecommendation(row) {
  return row.applicant_id === row.author_id;
}

async function loadTarget(DB, identifier) {
  const publicId = parsePublicId("tree", String(identifier));
  return DB.prepare(
    `SELECT published_trees.*, users.display_name AS creator_name,
            users.public_id AS creator_public_id
       FROM published_trees
       JOIN users ON users.id = published_trees.creator_id
      WHERE ${publicId ? "published_trees.public_id = ?" : "published_trees.id = ?"}
        AND published_trees.deleted_at IS NULL
        AND published_trees.visibility = 'PUBLIC'`,
  ).bind(publicId || String(identifier)).first();
}

async function loadRequest(DB, id) {
  return DB.prepare(`${REQUEST_SELECT} WHERE tree_official_requests.id = ?`)
    .bind(String(id)).first();
}

function publicRequest(row, user) {
  if (!row) return null;
  const selfRecommendation = isSelfRecommendation(row);
  const pending = row.status === "PENDING";
  const canReview = pending && (
    selfRecommendation
      ? canAdministerRecommendations(user)
      : row.author_id === user.id
  );
  return {
    id: row.id,
    treeUid: formatPublicId("tree", row.tree_public_id),
    treeTitle: row.tree_title,
    treeVersion: Number(row.tree_version || 1),
    platformRecommended: Boolean(row.tree_platform_recommended),
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
    responseNote: row.response_note || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    respondedAt: row.responded_at || "",
    canReview,
    canWithdraw: row.applicant_id === user.id && pending,
  };
}

export const onRequestGet = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  const target = await loadTarget(env.DB, params.id);
  if (!target) throw new ApiError(404, "进化树不存在", "TREE_NOT_FOUND");

  const filters = ["tree_official_requests.tree_id = ?"];
  const bindings = [target.id];
  if (!canAdministerRecommendations(user)) {
    filters.push(
      "(tree_official_requests.author_id = ? OR tree_official_requests.applicant_id = ?)",
    );
    bindings.push(user.id, user.id);
  }
  const row = await env.DB.prepare(
    `${REQUEST_SELECT}
      WHERE ${filters.join(" AND ")}
      ORDER BY tree_official_requests.status = 'PENDING' DESC,
               tree_official_requests.updated_at DESC
      LIMIT 1`,
  ).bind(...bindings).first();
  return json({ success: true, request: publicRequest(row, user) });
});

export const onRequestPost = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  await enforceRateLimit(env.DB, `platform-tree-request:${user.id}`, 20, 24 * 60 * 60);
  const target = await loadTarget(env.DB, params.id);
  if (!target) throw new ApiError(404, "进化树不存在", "TREE_NOT_FOUND");
  if (target.kind !== "USER") {
    throw new ApiError(400, "只有用户进化树可以申请平台推荐", "INVALID_TREE_KIND");
  }

  const isAuthor = target.creator_id === user.id;
  const isAdmin = canAdministerRecommendations(user);
  if (!isAuthor && !isAdmin) {
    throw new ApiError(403, "只有原作者可以自荐，管理员可以提名其他作者的树", "FORBIDDEN");
  }
  if (target.platform_recommended) {
    throw new ApiError(409, "这棵树已经通过平台推荐审核", "ALREADY_RECOMMENDED");
  }

  const existing = await env.DB.prepare(
    `SELECT status FROM tree_official_requests
      WHERE tree_id = ? AND status = 'PENDING'
      ORDER BY updated_at DESC LIMIT 1`,
  ).bind(target.id).first();
  if (existing) {
    throw new ApiError(409, "这棵树已有待处理的推荐申请", "REQUEST_PENDING");
  }

  const body = await readJson(request, 4 * 1024);
  const message = cleanText(body.message, "申请说明", { maximum: 300 });
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const statements = [
    env.DB.prepare(
      `INSERT INTO tree_official_requests
        (id, tree_id, applicant_id, author_id, message, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?)`,
    ).bind(id, target.id, user.id, target.creator_id, message, now, now),
  ];

  if (isAuthor) {
    const admins = await env.DB.prepare(
      `SELECT id FROM users
        WHERE role = 'ADMIN' AND status = 'ACTIVE' AND id <> ?`,
    ).bind(user.id).all();
    for (const admin of admins.results || []) {
      statements.push(
        env.DB.prepare(
          `INSERT OR IGNORE INTO notifications
            (id, recipient_id, actor_id, type, target_type, target_id, source_id, message, created_at)
           VALUES (?, ?, ?, 'OFFICIAL_TREE_REQUESTED', 'TREE', ?, ?, ?, ?)`,
        ).bind(
          crypto.randomUUID(), admin.id, user.id, target.id, id,
          `“${target.title}”的作者已提交平台推荐申请，请进行审核`, now,
        ),
      );
    }
  } else {
    statements.push(
      env.DB.prepare(
        `INSERT OR IGNORE INTO notifications
          (id, recipient_id, actor_id, type, target_type, target_id, source_id, message, created_at)
         VALUES (?, ?, ?, 'OFFICIAL_TREE_REQUESTED', 'TREE', ?, ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(), target.creator_id, user.id, target.id, id,
        `管理员提名“${target.title}”为平台推荐树，请由你决定是否同意`, now,
      ),
    );
  }

  await env.DB.batch(statements);
  return json(
    { success: true, request: publicRequest(await loadRequest(env.DB, id), user) },
    { status: 201 },
  );
});

export const onRequestPut = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  const body = await readJson(request, 4 * 1024);
  const requestId = String(body.requestId || "");
  const action = String(body.action || "").toUpperCase();
  if (!requestId || !new Set(["APPROVE", "REJECT"]).has(action)) {
    throw new ApiError(400, "申请处理参数无效", "INVALID_ACTION");
  }
  const target = await loadTarget(env.DB, params.id);
  if (!target) throw new ApiError(404, "进化树不存在", "TREE_NOT_FOUND");
  const row = await loadRequest(env.DB, requestId);
  if (!row || row.tree_id !== target.id) {
    throw new ApiError(404, "申请不存在", "REQUEST_NOT_FOUND");
  }
  const selfRecommendation = isSelfRecommendation(row);
  const mayReview = selfRecommendation
    ? canAdministerRecommendations(user)
    : row.author_id === user.id;
  if (!mayReview) {
    throw new ApiError(
      403,
      selfRecommendation ? "作者自荐必须由管理员审核" : "管理员提名必须由原作者确认",
      "REVIEW_PERMISSION_REQUIRED",
    );
  }
  if (row.status !== "PENDING") {
    throw new ApiError(409, "这项申请已经处理", "REQUEST_REVIEWED");
  }
  if (row.tree_deleted_at || row.tree_kind !== "USER") {
    throw new ApiError(409, "原树已删除或状态已经改变", "TREE_UNAVAILABLE");
  }

  const responseNote = cleanText(body.responseNote, "审核说明", { maximum: 300 });
  const now = new Date().toISOString();
  if (action === "REJECT") {
    await env.DB.batch([
      env.DB.prepare(
        `UPDATE tree_official_requests
            SET status = 'REJECTED', response_note = ?, responded_at = ?, updated_at = ?
          WHERE id = ? AND status = 'PENDING'`,
      ).bind(responseNote, now, now, row.id),
      env.DB.prepare(
        `INSERT OR IGNORE INTO notifications
          (id, recipient_id, actor_id, type, target_type, target_id, source_id, message, created_at)
         VALUES (?, ?, ?, 'OFFICIAL_TREE_REJECTED', 'TREE', ?, ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(), row.applicant_id, user.id, row.tree_id, row.id,
        `“${row.tree_title}”的平台推荐申请未通过`, now,
      ),
    ]);
    return json({
      success: true,
      request: publicRequest(await loadRequest(env.DB, row.id), user),
    });
  }

  const results = await env.DB.batch([
    env.DB.prepare(
      `UPDATE published_trees
          SET platform_recommended = 1, platform_reviewed_at = ?,
              platform_reviewed_by = ?
        WHERE id = ? AND kind = 'USER' AND deleted_at IS NULL
          AND visibility = 'PUBLIC'
          AND EXISTS (
            SELECT 1 FROM tree_official_requests
             WHERE id = ? AND status = 'PENDING'
          )`,
    ).bind(now, user.id, row.tree_id, row.id),
    env.DB.prepare(
      `UPDATE tree_official_requests
          SET status = 'APPROVED', response_note = ?, official_tree_id = NULL,
              responded_at = ?, updated_at = ?
        WHERE id = ? AND status = 'PENDING'`,
    ).bind(responseNote, now, now, row.id),
    env.DB.prepare(
      `INSERT OR IGNORE INTO notifications
        (id, recipient_id, actor_id, type, target_type, target_id, source_id, message, created_at)
       VALUES (?, ?, ?, 'OFFICIAL_TREE_APPROVED', 'TREE', ?, ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(), row.applicant_id, user.id, row.tree_id, row.id,
      `“${row.tree_title}”已通过平台推荐审核，仍由原作者维护`, now,
    ),
  ]);
  if (Number(results[0]?.meta?.changes || 0) !== 1) {
    throw new ApiError(409, "原树已删除或状态已经改变", "TREE_UNAVAILABLE");
  }
  return json({
    success: true,
    request: publicRequest(await loadRequest(env.DB, row.id), user),
    tree: await loadPublishedTree(env.DB, row.tree_id),
  });
});

export const onRequestDelete = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  const target = await loadTarget(env.DB, params.id);
  if (!target) throw new ApiError(404, "进化树不存在", "TREE_NOT_FOUND");
  const url = new URL(request.url);
  const requestId = String(url.searchParams.get("requestId") || "");
  const row = requestId ? await loadRequest(env.DB, requestId) : null;
  if (!row || row.tree_id !== target.id) {
    throw new ApiError(404, "申请不存在", "REQUEST_NOT_FOUND");
  }
  if (row.applicant_id !== user.id) {
    throw new ApiError(403, "只能撤回自己提交的申请", "FORBIDDEN");
  }
  if (row.status !== "PENDING") {
    throw new ApiError(409, "已经处理的申请不能撤回", "REQUEST_REVIEWED");
  }
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE tree_official_requests
          SET status = 'WITHDRAWN', responded_at = ?, updated_at = ?
        WHERE id = ? AND applicant_id = ? AND status = 'PENDING'`,
    ).bind(now, now, row.id, user.id),
    env.DB.prepare(
      "DELETE FROM notifications WHERE source_id = ? AND type = 'OFFICIAL_TREE_REQUESTED'",
    ).bind(row.id),
  ]);
  return json({ success: true, withdrawnId: row.id });
});
