import { requireUser } from "../../../server/auth.js";
import { contributionDetail, CONTRIBUTION_SELECT } from "../../../server/contributions.js";
import { ApiError, json, readJson, withApi } from "../../../server/http.js";
import { managedMediaHashesFromTree, mediaReferenceStatements } from "../../../server/media.js";
import { loadPublishedTree } from "../../../server/trees.js";
import { cleanText } from "../../../server/validation.js";

async function loadContribution(DB, id) {
  return DB.prepare(`${CONTRIBUTION_SELECT} WHERE tree_contributions.id = ?`)
    .bind(String(id)).first();
}

async function loadBaseRevision(DB, row) {
  return DB.prepare(
    `SELECT title, description, document_json, license, tags_json,
            references_text, image_credits_text, fork_enabled, contribution_enabled
       FROM tree_revisions
      WHERE tree_id = ? AND version = ?`,
  ).bind(row.target_tree_id, row.base_version).first();
}

function canView(user, row) {
  return row.target_creator_id === user.id ||
    row.contributor_id === user.id;
}

export const onRequestGet = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  const row = await loadContribution(env.DB, params.id);
  if (!row) throw new ApiError(404, "贡献不存在", "CONTRIBUTION_NOT_FOUND");
  if (!canView(user, row)) throw new ApiError(403, "没有查看这项贡献的权限", "FORBIDDEN");
  const baseRevision = await loadBaseRevision(env.DB, row);
  return json({
    success: true,
    contribution: {
      ...contributionDetail(row, baseRevision),
      canReview: row.target_creator_id === user.id,
      canWithdraw: row.contributor_id === user.id && row.status === "PENDING",
    },
  });
});

export const onRequestPut = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  const row = await loadContribution(env.DB, params.id);
  if (!row) throw new ApiError(404, "贡献不存在", "CONTRIBUTION_NOT_FOUND");
  if (row.target_creator_id !== user.id) {
    throw new ApiError(403, "只有原树创作者可以审查贡献", "FORBIDDEN");
  }
  if (row.status !== "PENDING") {
    throw new ApiError(409, "这项贡献已经完成审查", "CONTRIBUTION_REVIEWED");
  }
  const body = await readJson(request, 4 * 1024);
  const action = String(body.action || "").toUpperCase();
  if (!new Set(["APPROVE", "REJECT"]).has(action)) {
    throw new ApiError(400, "审查操作无效", "INVALID_ACTION");
  }
  const reviewNote = cleanText(body.reviewNote, "审查说明", { maximum: 300 });
  if (action === "REJECT" && reviewNote.length < 3) {
    throw new ApiError(400, "退回贡献时请填写至少 3 个字的原因", "REVIEW_NOTE_REQUIRED");
  }
  const now = new Date().toISOString();
  if (action === "REJECT") {
    await env.DB.batch([
      env.DB.prepare(
        `UPDATE tree_contributions
            SET status = 'REJECTED', review_note = ?, reviewed_at = ?,
                reviewed_by = ?, updated_at = ?
          WHERE id = ? AND status = 'PENDING'`,
      ).bind(reviewNote, now, user.id, now, row.id),
      env.DB.prepare(
        `DELETE FROM media_references
          WHERE entity_type = 'TREE' AND entity_id = ?`,
      ).bind(`contribution:${row.id}`),
      env.DB.prepare(
        `INSERT OR IGNORE INTO notifications
          (id, recipient_id, actor_id, type, target_type, target_id, source_id, message, created_at)
         VALUES (?, ?, ?, 'CONTRIBUTION_REJECTED', 'CONTRIBUTION', ?, ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(), row.contributor_id, user.id, row.id, row.id,
        `你对“${row.target_title}”提交的贡献未被采用`, now,
      ),
    ]);
  } else {
    const target = await env.DB.prepare(
      `SELECT * FROM published_trees
        WHERE id = ? AND deleted_at IS NULL AND visibility = 'PUBLIC'`,
    ).bind(row.target_tree_id).first();
    if (!target) throw new ApiError(404, "原树已被删除", "TREE_NOT_FOUND");
    if (Number(target.version) !== Number(row.base_version)) {
      throw new ApiError(
        409,
        "原树在贡献提交后已有新版本，不能直接覆盖；请让贡献者基于最新版重新提交",
        "VERSION_CONFLICT",
      );
    }
    const nextVersion = Number(target.version) + 1;
    // Merging a contribution creates a new version but intentionally keeps an
    // existing platform recommendation approved by default.
    const results = await env.DB.batch([
      env.DB.prepare(
        `UPDATE published_trees
            SET title = ?, description = ?, document_json = ?, node_count = ?, license = ?,
                tags_json = ?, references_text = ?, image_credits_text = ?,
                change_note = ?, fork_enabled = ?, contribution_enabled = ?,
                version = ?, updated_at = ?
          WHERE id = ? AND version = ? AND deleted_at IS NULL`,
      ).bind(
        row.title, row.description, row.document_json, row.node_count, row.license,
        row.tags_json, row.references_text, row.image_credits_text, row.change_note,
        row.fork_enabled, row.contribution_enabled, nextVersion, now,
        row.target_tree_id, row.base_version,
      ),
      env.DB.prepare(
        `INSERT INTO tree_revisions
          (tree_id, version, title, description, document_json, node_count, license,
           tags_json, references_text, image_credits_text, change_note,
           fork_enabled, contribution_enabled, created_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        row.target_tree_id, nextVersion, row.title, row.description, row.document_json,
        row.node_count, row.license, row.tags_json, row.references_text,
        row.image_credits_text, row.change_note, row.fork_enabled,
        row.contribution_enabled, now, row.contributor_id,
      ),
      env.DB.prepare(
        `UPDATE tree_contributions
            SET status = 'APPROVED', review_note = ?, reviewed_at = ?,
                reviewed_by = ?, updated_at = ?
          WHERE id = ? AND status = 'PENDING'`,
      ).bind(reviewNote, now, user.id, now, row.id),
      env.DB.prepare(
        `INSERT OR IGNORE INTO notifications
          (id, recipient_id, actor_id, type, target_type, target_id, source_id, message, created_at)
         VALUES (?, ?, ?, 'CONTRIBUTION_APPROVED', 'CONTRIBUTION', ?, ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(), row.contributor_id, user.id, row.id, row.id,
        `你对“${row.target_title}”提交的贡献已合并`, now,
      ),
    ]);
    if (Number(results[0]?.meta?.changes || 0) !== 1) {
      throw new ApiError(409, "原树刚刚被更新，请重新审查", "VERSION_CONFLICT");
    }

    let contributionDocument = {};
    try {
      contributionDocument = JSON.parse(row.document_json);
    } catch {
      contributionDocument = {};
    }
    const hashes = managedMediaHashesFromTree(contributionDocument);
    await env.DB.batch([
      ...mediaReferenceStatements(env.DB, "TREE", row.target_tree_id, hashes, now, { replace: true }),
      env.DB.prepare(
        `DELETE FROM media_references
          WHERE entity_type = 'TREE' AND entity_id = ?`,
      ).bind(`contribution:${row.id}`),
    ]);
  }

  const updated = await loadContribution(env.DB, row.id);
  const baseRevision = await loadBaseRevision(env.DB, updated);
  return json({
    success: true,
    contribution: {
      ...contributionDetail(updated, baseRevision),
      canReview: updated.target_creator_id === user.id,
      canWithdraw: updated.contributor_id === user.id && updated.status === "PENDING",
    },
    tree: action === "APPROVE"
      ? await loadPublishedTree(env.DB, row.target_tree_id)
      : undefined,
  });
});

export const onRequestDelete = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  const row = await loadContribution(env.DB, params.id);
  if (!row) throw new ApiError(404, "贡献不存在", "CONTRIBUTION_NOT_FOUND");
  if (row.contributor_id !== user.id) {
    throw new ApiError(403, "只能撤回自己提交的贡献", "FORBIDDEN");
  }
  if (row.status !== "PENDING") {
    throw new ApiError(409, "已完成审查的贡献不能撤回", "CONTRIBUTION_REVIEWED");
  }
  const results = await env.DB.batch([
    env.DB.prepare(
      "DELETE FROM tree_contributions WHERE id = ? AND contributor_id = ? AND status = 'PENDING'",
    ).bind(row.id, user.id),
    env.DB.prepare(
      `DELETE FROM media_references
        WHERE entity_type = 'TREE' AND entity_id = ?`,
    ).bind(`contribution:${row.id}`),
    env.DB.prepare(
      `DELETE FROM notifications
        WHERE target_type = 'CONTRIBUTION' AND target_id = ?`,
    ).bind(row.id),
  ]);
  if (Number(results[0]?.meta?.changes || 0) !== 1) {
    throw new ApiError(409, "贡献状态刚刚发生变化", "CONTRIBUTION_REVIEWED");
  }
  return json({ success: true, withdrawnId: row.id });
});
