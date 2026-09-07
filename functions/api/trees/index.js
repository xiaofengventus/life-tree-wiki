import { requireUser } from "../../../server/auth.js";
import { ApiError, json, readJson, withApi } from "../../../server/http.js";
import { enforceRateLimit } from "../../../server/rateLimit.js";
import { loadPublishedTree, sanitizeTreeDocument, treeSummary } from "../../../server/trees.js";
import { cleanText, validateLicense, validateTags } from "../../../server/validation.js";
import {
  managedMediaHashesFromTree,
  mediaReferenceStatements,
  validateManagedMedia,
} from "../../../server/media.js";
import { experienceEventStatement } from "../../../server/experience.js";
import {
  PRIVATE_VISIBILITY,
  normalizeVisibility,
  reservePrivateWorkSlotStatement,
  throwPrivateWorkDatabaseError,
} from "../../../server/privateWorks.js";

export const onRequestGet = withApi(async ({ request, env }) => {
  const url = new URL(request.url);
  const requestedKind = url.searchParams.get("kind")?.toLowerCase();
  const includeAllKinds = requestedKind === "all";
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 50)));
  const filter = includeAllKinds
    ? ""
    : requestedKind === "official"
      ? "published_trees.platform_recommended = 1 AND "
      : "published_trees.kind = 'USER' AND ";

  const cursor = decodeTreeCursor(url.searchParams.get("cursor"));
  if (url.searchParams.has("cursor") && !cursor) {
    throw new ApiError(400, "分页游标无效", "INVALID_CURSOR");
  }
  const cursorClause = cursor
    ? "AND (published_trees.updated_at < ? OR (published_trees.updated_at = ? AND published_trees.id < ?)) "
    : "";
  const statement = env.DB.prepare(
    `SELECT published_trees.*, users.display_name AS creator_name,
            users.public_id AS creator_public_id,
            users.role AS creator_role,
            users.avatar_media_hash AS creator_avatar_hash
       FROM published_trees JOIN users ON users.id = published_trees.creator_id
      WHERE ${filter}
            published_trees.deleted_at IS NULL
        AND published_trees.visibility = 'PUBLIC'
        ${cursorClause}
      ORDER BY published_trees.updated_at DESC, published_trees.id DESC LIMIT ?`,
  );
  const result = await statement
    .bind(
      ...(cursor
        ? [cursor.updatedAt, cursor.updatedAt, cursor.id]
        : []),
      limit + 1,
    )
    .all();
  const rows = result.results || [];
  const hasMore = rows.length > limit;
  const visibleRows = hasMore ? rows.slice(0, limit) : rows;
  return json(
    {
      success: true,
      trees: visibleRows.map(treeSummary),
      nextCursor: hasMore
        ? encodeTreeCursor(visibleRows[visibleRows.length - 1])
        : null,
    },
    { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } },
  );
});

function encodeTreeCursor(row) {
  return btoa(JSON.stringify([row.updated_at, row.id]));
}

function decodeTreeCursor(value) {
  if (!value) return null;
  try {
    const [updatedAt, id] = JSON.parse(atob(value));
    if (typeof updatedAt !== "string" || typeof id !== "string") return null;
    return { updatedAt, id };
  } catch {
    return null;
  }
}

export const onRequestPost = withApi(async ({ request, env }) => {
  const user = await requireUser(env.DB, request);
  await enforceRateLimit(env.DB, `tree-create:${user.id}`, 10, 24 * 60 * 60);
  const body = await readJson(request, 600 * 1024);
  const visibility = normalizeVisibility(body.visibility);
  const isPrivate = visibility === PRIVATE_VISIBILITY;
  const title = cleanText(body.title || (isPrivate ? "未命名进化树" : ""), "树名称", {
    minimum: 1,
    maximum: 120,
  });
  const description = cleanText(body.description, "树简介", { maximum: 1000 });
  const license = validateLicense(body.license);
  const tagsJson = JSON.stringify(validateTags(body.tags));
  const referencesText = cleanText(body.referencesText, "参考文献", { maximum: 100_000 });
  const imageCreditsText = cleanText(body.imageCreditsText, "图片版权来源", { maximum: 100_000 });
  const changeNote = isPrivate
    ? ""
    : cleanText(body.changeNote || "创建进化树", "提交说明", { maximum: 300 });
  const forkEnabled = body.forkEnabled ? 1 : 0;
  const contributionEnabled = body.contributionEnabled ? 1 : 0;
  const { document, nodeCount } = sanitizeTreeDocument(body.document);
  if (!isPrivate && nodeCount < 2) {
    throw new ApiError(400, "至少创建两个节点后才能提交", "TREE_TOO_SMALL");
  }

  let forkSession = null;
  if (body.forkId) {
    forkSession = await env.DB.prepare(
      `SELECT tree_forks.*
         FROM tree_forks
         JOIN published_trees ON published_trees.id = tree_forks.source_tree_id
        WHERE tree_forks.id = ? AND tree_forks.user_id = ?
          AND tree_forks.published_tree_id IS NULL
          AND published_trees.deleted_at IS NULL
          AND published_trees.visibility = 'PUBLIC'
          AND published_trees.fork_enabled = 1`,
    ).bind(String(body.forkId), user.id).first();
    if (!forkSession) {
      throw new ApiError(409, "Fork 会话已失效，请从原树重新 Fork", "FORK_SESSION_INVALID");
    }
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const documentJson = JSON.stringify(document);
  const mediaHashes = managedMediaHashesFromTree(document);
  await validateManagedMedia(env.DB, mediaHashes);
  const statements = [
    ...(isPrivate
      ? [reservePrivateWorkSlotStatement(env.DB, user.id, "TREE", id, now)]
      : []),
    env.DB.prepare(
      `INSERT INTO published_trees
        (id, creator_id, kind, title, description, document_json, node_count, license,
         tags_json, references_text, image_credits_text, change_note,
         fork_enabled, contribution_enabled, forked_from_tree_id,
         visibility, version, created_at, updated_at)
       VALUES (?, ?, 'USER', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    ).bind(
      id, user.id, title, description, documentJson, nodeCount, license, tagsJson,
      referencesText, imageCreditsText, changeNote, forkEnabled, contributionEnabled,
      forkSession?.source_tree_id || null, visibility, now, now,
    ),
    ...(!isPrivate && forkSession
      ? [env.DB.prepare(
          `UPDATE tree_forks SET published_tree_id = ?
            WHERE id = ? AND user_id = ? AND published_tree_id IS NULL`,
        ).bind(id, forkSession.id, user.id)]
      : []),
    ...mediaReferenceStatements(env.DB, "TREE", id, mediaHashes, now),
  ];
  if (!isPrivate) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO tree_revisions
          (tree_id, version, title, description, document_json, node_count, license,
           tags_json, references_text, image_credits_text, change_note,
           fork_enabled, contribution_enabled, created_at, created_by)
         VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        id, title, description, documentJson, nodeCount, license, tagsJson,
        referencesText, imageCreditsText, changeNote, forkEnabled, contributionEnabled,
        now, user.id,
      ),
      experienceEventStatement(env.DB, user.id, "TREE_CREATED", `tree:${id}`, now),
    );
  }
  try {
    await env.DB.batch(statements);
  } catch (error) {
    throwPrivateWorkDatabaseError(error);
  }
  return json(
    { success: true, tree: await loadPublishedTree(env.DB, id, { viewerId: user.id }) },
    { status: 201 },
  );
});
