import {
  canDeleteOwnedContent,
  getCurrentUser,
  isSiteOwner,
  requireRole,
  requireUser,
} from "../../../server/auth.js";
import { ApiError, json, readJson, withApi } from "../../../server/http.js";
import { enforceRateLimit } from "../../../server/rateLimit.js";
import { loadPublishedTree, sanitizeTreeDocument } from "../../../server/trees.js";
import { formatPublicId, parsePublicId } from "../../../server/publicIds.js";
import { cleanText, validateLicense, validateTags } from "../../../server/validation.js";
import {
  managedMediaHashesFromTree,
  mediaReferenceStatements,
  validateManagedMedia,
} from "../../../server/media.js";
import { experienceEventStatement } from "../../../server/experience.js";
import {
  PRIVATE_VISIBILITY,
  PUBLIC_VISIBILITY,
  normalizeVisibility,
  releasePrivateWorkSlotStatement,
  throwPrivateWorkDatabaseError,
} from "../../../server/privateWorks.js";

export const onRequestGet = withApi(async ({ request, params, env }) => {
  const viewer = await getCurrentUser(env.DB, request);
  const tree = await loadPublishedTree(env.DB, String(params.id), { viewerId: viewer?.id });
  if (!tree) throw new ApiError(404, "进化树不存在", "TREE_NOT_FOUND");
  return json(
    { success: true, tree },
    {
      headers: {
        "Cache-Control": tree.visibility === PRIVATE_VISIBILITY
          ? "private, no-store"
          : "public, max-age=60, stale-while-revalidate=300",
      },
    },
  );
});

export const onRequestPut = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  await enforceRateLimit(env.DB, `tree-update:${user.id}`, 30, 60 * 60);
  const identifier = String(params.id);
  const publicId = parsePublicId("tree", identifier);
  const existing = await env.DB.prepare(
    `SELECT * FROM published_trees WHERE ${publicId ? "public_id = ?" : "id = ?"} AND deleted_at IS NULL`,
  ).bind(publicId || identifier).first();
  if (!existing) throw new ApiError(404, "进化树不存在", "TREE_NOT_FOUND");
  if (existing.kind === "OFFICIAL") requireRole(user, ["ADMIN"]);
  const id = existing.id;
  const canEdit = existing.creator_id === user.id ||
    (existing.kind === "OFFICIAL" && isSiteOwner(user));
  if (!canEdit) throw new ApiError(403, "没有修改这棵树的权限", "FORBIDDEN");

  const body = await readJson(request, 600 * 1024);
  const visibility = normalizeVisibility(body.visibility, existing.visibility || PUBLIC_VISIBILITY);
  if (existing.visibility === PUBLIC_VISIBILITY && visibility === PRIVATE_VISIBILITY) {
    throw new ApiError(
      409,
      "已经公开的进化树不能改回仅自己可见",
      "PUBLIC_WORK_CANNOT_BECOME_PRIVATE",
    );
  }
  const isPrivateSave = visibility === PRIVATE_VISIBILITY;
  const publishingPrivate = existing.visibility === PRIVATE_VISIBILITY &&
    visibility === PUBLIC_VISIBILITY;
  const expectedVersion = Number(body.version);
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion !== Number(existing.version)) {
    throw new ApiError(409, "进化树已被更新，请重新加载后再提交", "VERSION_CONFLICT");
  }
  const title = cleanText(body.title || (isPrivateSave ? "未命名进化树" : ""), "树名称", {
    minimum: 1,
    maximum: 120,
  });
  const description = cleanText(body.description, "树简介", { maximum: 1000 });
  const license = validateLicense(body.license);
  const tagsJson = JSON.stringify(validateTags(body.tags));
  const referencesText = cleanText(body.referencesText, "参考文献", { maximum: 100_000 });
  const imageCreditsText = cleanText(body.imageCreditsText, "图片版权来源", { maximum: 100_000 });
  const changeNote = isPrivateSave
    ? ""
    : cleanText(
        body.changeNote || (publishingPrivate ? "发布进化树" : "更新进化树"),
        "提交说明",
        { maximum: 300 },
      );
  const forkEnabled = body.forkEnabled ? 1 : 0;
  const contributionEnabled = body.contributionEnabled ? 1 : 0;
  const { document, nodeCount } = sanitizeTreeDocument(body.document);
  if (!isPrivateSave && nodeCount < 2) {
    throw new ApiError(400, "至少保留两个节点", "TREE_TOO_SMALL");
  }
  const nextVersion = publishingPrivate ? 1 : expectedVersion + 1;
  const now = new Date().toISOString();
  const documentJson = JSON.stringify(document);
  const mediaHashes = managedMediaHashesFromTree(document);
  await validateManagedMedia(env.DB, mediaHashes);
  // Platform recommendation belongs to the original tree and stays approved
  // across author-published versions unless an administrator revokes it.
  const statements = [
    env.DB.prepare(
      `UPDATE published_trees
          SET title = ?, description = ?, document_json = ?, node_count = ?, license = ?,
              tags_json = ?, references_text = ?, image_credits_text = ?,
              change_note = ?, fork_enabled = ?, contribution_enabled = ?,
              visibility = ?, version = ?, updated_at = ?
        WHERE id = ? AND version = ? AND deleted_at IS NULL`,
    ).bind(
      title, description, documentJson, nodeCount, license, tagsJson, referencesText,
      imageCreditsText, changeNote, forkEnabled, contributionEnabled, visibility,
      nextVersion, now, id, expectedVersion,
    ),
  ];
  if (!isPrivateSave) {
    statements.push(env.DB.prepare(
      `INSERT INTO tree_revisions
        (tree_id, version, title, description, document_json, node_count, license,
         tags_json, references_text, image_credits_text, change_note,
         fork_enabled, contribution_enabled, created_at, created_by)
       SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        WHERE EXISTS (SELECT 1 FROM published_trees WHERE id = ? AND version = ?)`,
    ).bind(
      id, nextVersion, title, description, documentJson, nodeCount, license, tagsJson,
      referencesText, imageCreditsText, changeNote, forkEnabled, contributionEnabled,
      now, user.id, id, nextVersion,
    ));
    if (publishingPrivate) {
      if (existing.forked_from_tree_id) {
        statements.push(
          env.DB.prepare(
            `UPDATE tree_forks SET published_tree_id = ?
              WHERE source_tree_id = ? AND user_id = ? AND published_tree_id IS NULL`,
          ).bind(id, existing.forked_from_tree_id, user.id),
        );
      }
      statements.push(
        experienceEventStatement(env.DB, user.id, "TREE_CREATED", `tree:${id}`, now),
        releasePrivateWorkSlotStatement(env.DB, "TREE", id),
      );
    }
  }
  let results;
  try {
    results = await env.DB.batch(statements);
  } catch (error) {
    throwPrivateWorkDatabaseError(error);
  }
  if (Number(results[0]?.meta?.changes || 0) !== 1) {
    throw new ApiError(409, "进化树刚刚被其他人更新", "VERSION_CONFLICT");
  }
  await env.DB.batch(
    mediaReferenceStatements(env.DB, "TREE", id, mediaHashes, now, { replace: true }),
  );
  return json({
    success: true,
    tree: await loadPublishedTree(env.DB, id, { viewerId: user.id }),
  });
});

export const onRequestDelete = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  await enforceRateLimit(env.DB, `tree-delete:${user.id}`, 20, 60 * 60);
  const identifier = String(params.id);
  const publicId = parsePublicId("tree", identifier);
  const existing = await env.DB.prepare(
    `SELECT * FROM published_trees
      WHERE ${publicId ? "public_id = ?" : "id = ?"} AND deleted_at IS NULL`,
  ).bind(publicId || identifier).first();
  if (!existing) throw new ApiError(404, "进化树不存在", "TREE_NOT_FOUND");
  const canDelete = existing.visibility === PRIVATE_VISIBILITY
    ? existing.creator_id === user.id
    : canDeleteOwnedContent(user, existing.creator_id);
  if (!canDelete) throw new ApiError(403, "没有删除这棵树的权限", "FORBIDDEN");

  const now = new Date().toISOString();
  const nextVersion = Number(existing.version || 1) + 1;
  const statements = [
    env.DB.prepare(
      `UPDATE published_trees
          SET deleted_at = ?, updated_at = ?, version = ?
        WHERE id = ? AND deleted_at IS NULL`,
    ).bind(now, now, nextVersion, existing.id),
    ...(existing.visibility === PRIVATE_VISIBILITY
      ? [releasePrivateWorkSlotStatement(env.DB, "TREE", existing.id)]
      : []),
  ];
  const results = await env.DB.batch(statements);
  if (Number(results[0]?.meta?.changes || 0) !== 1) {
    throw new ApiError(409, "进化树删除状态已发生变化", "DELETE_CONFLICT");
  }
  return json({
    success: true,
    tree: {
      id: existing.id,
      uid: formatPublicId("tree", existing.public_id),
      deletedAt: now,
    },
  });
});
