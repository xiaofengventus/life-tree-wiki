import { requireUser } from "../../../../server/auth.js";
import { contributionDetail, CONTRIBUTION_SELECT } from "../../../../server/contributions.js";
import { ApiError, json, readJson, withApi } from "../../../../server/http.js";
import { enforceRateLimit } from "../../../../server/rateLimit.js";
import { managedMediaHashesFromTree, mediaReferenceStatements, validateManagedMedia } from "../../../../server/media.js";
import { parsePublicId } from "../../../../server/publicIds.js";
import { sanitizeTreeDocument } from "../../../../server/trees.js";
import { cleanText, validateLicense, validateTags } from "../../../../server/validation.js";

export const onRequestPost = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  await enforceRateLimit(env.DB, `tree-contribution:${user.id}`, 20, 24 * 60 * 60);
  const identifier = String(params.id);
  const publicId = parsePublicId("tree", identifier);
  const target = await env.DB.prepare(
    `SELECT * FROM published_trees
      WHERE ${publicId ? "public_id = ?" : "id = ?"}
        AND deleted_at IS NULL
        AND visibility = 'PUBLIC'`,
  ).bind(publicId || identifier).first();
  if (!target) throw new ApiError(404, "进化树不存在", "TREE_NOT_FOUND");
  if (!target.contribution_enabled) {
    throw new ApiError(403, "创作者没有开放这棵树的 Contribution", "CONTRIBUTION_DISABLED");
  }
  if (target.creator_id === user.id) {
    throw new ApiError(400, "创作者可以直接编辑自己的进化树", "SELF_CONTRIBUTION");
  }

  const body = await readJson(request, 600 * 1024);
  const baseVersion = Number(body.baseVersion);
  if (!Number.isSafeInteger(baseVersion) || baseVersion !== Number(target.version)) {
    throw new ApiError(409, "原树已有新版本，请重新载入后再提交贡献", "VERSION_CONFLICT");
  }
  const title = cleanText(body.title, "树名称", { minimum: 1, maximum: 120 });
  const description = cleanText(body.description, "树简介", { maximum: 1000 });
  const license = validateLicense(body.license);
  const tagsJson = JSON.stringify(validateTags(body.tags));
  const referencesText = cleanText(body.referencesText, "参考文献", { maximum: 100_000 });
  const imageCreditsText = cleanText(body.imageCreditsText, "图片版权来源", { maximum: 100_000 });
  const changeNote = cleanText(body.changeNote, "贡献说明", { minimum: 3, maximum: 300 });
  const forkEnabled = body.forkEnabled ? 1 : 0;
  const contributionEnabled = body.contributionEnabled ? 1 : 0;
  const { document, nodeCount } = sanitizeTreeDocument(body.document);
  if (nodeCount < 2) throw new ApiError(400, "至少保留两个节点", "TREE_TOO_SMALL");

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const documentJson = JSON.stringify(document);
  const mediaHashes = managedMediaHashesFromTree(document);
  await validateManagedMedia(env.DB, mediaHashes);
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO tree_contributions
        (id, target_tree_id, contributor_id, base_version, title, description,
         document_json, node_count, license, tags_json, references_text,
         image_credits_text, change_note,
         fork_enabled, contribution_enabled, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)`,
    ).bind(
      id, target.id, user.id, baseVersion, title, description, documentJson, nodeCount,
      license, tagsJson, referencesText, imageCreditsText, changeNote,
      forkEnabled, contributionEnabled, now, now,
    ),
    ...mediaReferenceStatements(env.DB, "TREE", `contribution:${id}`, mediaHashes, now),
    env.DB.prepare(
      `INSERT OR IGNORE INTO notifications
        (id, recipient_id, actor_id, type, target_type, target_id, source_id, message, created_at)
       VALUES (?, ?, ?, 'CONTRIBUTION_SUBMITTED', 'CONTRIBUTION', ?, ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(), target.creator_id, user.id, id, id,
      `有人向“${target.title}”提交了进化树贡献`, now,
    ),
  ]);
  const row = await env.DB.prepare(`${CONTRIBUTION_SELECT} WHERE tree_contributions.id = ?`)
    .bind(id).first();
  const baseRevision = await env.DB.prepare(
    `SELECT title, description, document_json, license, tags_json,
            references_text, image_credits_text, fork_enabled, contribution_enabled
       FROM tree_revisions
      WHERE tree_id = ? AND version = ?`,
  ).bind(target.id, baseVersion).first();
  return json(
    {
      success: true,
      contribution: {
        ...contributionDetail(row, baseRevision),
        canReview: false,
        canWithdraw: true,
      },
    },
    { status: 201 },
  );
});
