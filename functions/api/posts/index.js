import { requireRole, requireUser } from "../../../server/auth.js";
import { ApiError, json, readJson, withApi } from "../../../server/http.js";
import { ensurePublicPostTitleAvailable, loadPost, normalizePostType, postSummary } from "../../../server/posts.js";
import { enforceRateLimit } from "../../../server/rateLimit.js";
import { htmlToPlainText, sanitizePostHtml } from "../../../server/sanitize.js";
import { cleanText, validateLicense, validateTags } from "../../../server/validation.js";
import {
  managedMediaHashesFromHtml,
  validMediaHash,
  mediaReferenceStatements,
  validateManagedMedia,
} from "../../../server/media.js";
import { experienceEventStatement } from "../../../server/experience.js";
import {
  classificationCardMediaHashes,
  reconcileClassificationCardPlacements,
} from "../../../server/classificationCards.js";
import { sanitizeCitations, validateCitationMarkers } from "../../../server/citations.js";
import {
  PRIVATE_VISIBILITY,
  normalizeVisibility,
  reservePrivateWorkSlotStatement,
  throwPrivateWorkDatabaseError,
} from "../../../server/privateWorks.js";

function encodeCursor(row) {
  return btoa(JSON.stringify([row.updated_at, row.id]));
}

function decodeCursor(value) {
  if (!value) return null;
  try {
    const [updatedAt, id] = JSON.parse(atob(value));
    if (typeof updatedAt !== "string" || typeof id !== "string") return null;
    return { updatedAt, id };
  } catch {
    return null;
  }
}

export const onRequestGet = withApi(async ({ request, env }) => {
  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit") || 20);
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(50, Math.max(1, requestedLimit))
    : 20;
  const cursor = decodeCursor(url.searchParams.get("cursor"));
  if (url.searchParams.has("cursor") && !cursor) {
    throw new ApiError(400, "分页游标无效", "INVALID_CURSOR");
  }
  const typeFilter = url.searchParams.has("type")
    ? normalizePostType(url.searchParams.get("type"))
    : null;

  const baseSelect = `SELECT posts.id, posts.creator_id, posts.title, posts.author,
    posts.cover_media_hash, posts.type,
    substr(posts.content_text, 1, 240) AS excerpt, posts.tags_json,
    posts.classification_card_json, posts.license,
    posts.revision_count, posts.change_note, posts.version, posts.created_at,
    posts.updated_at, users.display_name AS creator_name,
    users.public_id AS creator_public_id,
    users.avatar_media_hash AS creator_avatar_hash
    FROM posts JOIN users ON users.id = posts.creator_id`;
  const typeClause = typeFilter === null ? "" : "AND posts.type = ? ";
  const statement = cursor
    ? env.DB.prepare(
        `${baseSelect}
          WHERE posts.deleted_at IS NULL AND posts.visibility = 'PUBLIC'
            ${typeClause}
            AND (posts.updated_at < ? OR (posts.updated_at = ? AND posts.id < ?))
          ORDER BY posts.updated_at DESC, posts.id DESC LIMIT ?`,
      ).bind(...(typeFilter === null ? [] : [typeFilter]), cursor.updatedAt, cursor.updatedAt, cursor.id, limit + 1)
    : env.DB.prepare(
        `${baseSelect}
          WHERE posts.deleted_at IS NULL AND posts.visibility = 'PUBLIC'
          ${typeClause}
          ORDER BY posts.updated_at DESC, posts.id DESC LIMIT ?`,
      ).bind(...(typeFilter === null ? [] : [typeFilter]), limit + 1);

  const result = await statement.all();
  const rows = result.results || [];
  const hasMore = rows.length > limit;
  const visibleRows = rows.slice(0, limit);
  const nextCursor = hasMore ? encodeCursor(visibleRows[visibleRows.length - 1]) : null;
  return json(
    { success: true, posts: visibleRows.map(postSummary), nextCursor },
    { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } },
  );
});

export const onRequestPost = withApi(async ({ request, env }) => {
  const user = await requireUser(env.DB, request);
  requireRole(user, ["USER", "ADMIN", "COOPERATOR"]);
  await enforceRateLimit(env.DB, `post-create:${user.id}`, 20, 60);
  const body = await readJson(request, 420 * 1024);
  const visibility = normalizeVisibility(body.visibility);
  const isPrivate = visibility === PRIVATE_VISIBILITY;
  const title = cleanText(body.title || (isPrivate ? "未命名文章" : ""), "标题", {
    minimum: 1,
    maximum: 150,
  });
  const author = cleanText(body.author || user.display_name, "作者", {
    minimum: 1,
    maximum: 120,
  });
  if (!isPrivate) {
    try {
      await ensurePublicPostTitleAvailable(env.DB, title);
    } catch (error) {
      if (error.message === "PUBLIC_POST_TITLE_EXISTS") {
        throw new ApiError(409, "公开文章标题已存在，请使用不同标题", "PUBLIC_POST_TITLE_EXISTS");
      }
      throw error;
    }
  }
  const contentHtml = await sanitizePostHtml(body.content);
  const citations = sanitizeCitations(body.citations);
  validateCitationMarkers(contentHtml, citations);
  const citationsJson = JSON.stringify(citations);
  const contentText = htmlToPlainText(contentHtml);
  if (!isPrivate && !contentText) {
    throw new ApiError(400, "文章正文不能为空", "EMPTY_CONTENT");
  }
  const tagsJson = JSON.stringify(validateTags(body.tags));
  const postType = normalizePostType(body.type);
  const classificationCards = reconcileClassificationCardPlacements(
    body.classificationCards || body.classificationCard,
    contentHtml,
  );
  const classificationCardJson = JSON.stringify({ cards: classificationCards });
  const cardImageHashes = classificationCardMediaHashes(classificationCards);
  const license = validateLicense(body.license);
  const changeNote = isPrivate
    ? ""
    : cleanText(body.changeNote || "创建文章", "提交说明", { maximum: 300 });
  const coverHash = body.coverHash ? validMediaHash(body.coverHash) : null;
  if (body.coverHash && !coverHash) {
    throw new ApiError(400, "文章封面标识无效", "INVALID_COVER_IMAGE");
  }
  if (coverHash) {
    const owned = await env.DB.prepare(
      "SELECT 1 AS owned FROM media_owners WHERE content_hash = ? AND user_id = ?",
    ).bind(coverHash, user.id).first();
    if (!owned) throw new ApiError(403, "只能使用自己上传的封面", "COVER_NOT_OWNED");
  }
  for (const hash of cardImageHashes) {
    const owned = await env.DB.prepare(
      "SELECT 1 AS owned FROM media_owners WHERE content_hash = ? AND user_id = ?",
    ).bind(hash, user.id).first();
    if (!owned) throw new ApiError(403, "只能使用自己上传的卡片图片", "CARD_IMAGE_NOT_OWNED");
  }
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const mediaHashes = [...new Set([
    ...managedMediaHashesFromHtml(contentHtml),
    ...(coverHash ? [coverHash] : []),
    ...cardImageHashes,
  ])];
  await validateManagedMedia(env.DB, mediaHashes);

  const statements = [
    ...(isPrivate
      ? [reservePrivateWorkSlotStatement(env.DB, user.id, "POST", id, now)]
      : []),
    env.DB.prepare(
      `INSERT INTO posts
        (id, creator_id, title, author, cover_media_hash, content_html, content_text,
         tags_json, type, classification_card_json, citations_json,
         license, revision_count, change_note, visibility,
         version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    ).bind(
      id, user.id, title, author, coverHash, contentHtml, contentText, tagsJson,
      postType, classificationCardJson, citationsJson,
      license, isPrivate ? 0 : 1, changeNote, visibility, now, now,
    ),
    ...mediaReferenceStatements(env.DB, "POST", id, mediaHashes, now),
  ];
  if (!isPrivate) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO post_revisions
          (post_id, revision_number, title, content_html, classification_card_json,
           citations_json, change_note, created_at, created_by)
         VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        id, title, contentHtml, classificationCardJson, citationsJson, changeNote, now, user.id,
      ),
      env.DB.prepare(
        `INSERT INTO sync_events (entity_type, entity_id, operation, version, occurred_at)
         VALUES ('post', ?, 'UPSERT', 1, ?)`,
      ).bind(id, now),
      experienceEventStatement(env.DB, user.id, "POST_CREATED", `post:${id}`, now),
    );
  }
  try {
    await env.DB.batch(statements);
  } catch (error) {
    throwPrivateWorkDatabaseError(error);
  }

  return json(
    { success: true, post: await loadPost(env.DB, id, { viewerId: user.id }) },
    { status: 201 },
  );
});
