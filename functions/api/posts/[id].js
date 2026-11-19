import {
  canDeleteOwnedContent,
  getCurrentUser,
  requireUser,
} from "../../../server/auth.js";
import { ApiError, json, readJson, withApi } from "../../../server/http.js";
import {
  ensurePublicPostTitleAvailable,
  loadPost,
  normalizeContentFormat,
  normalizePostType,
} from "../../../server/posts.js";
import { formatPublicId, parsePublicId } from "../../../server/publicIds.js";
import { enforceRateLimit } from "../../../server/rateLimit.js";
import { htmlToPlainText, sanitizePostHtml } from "../../../server/sanitize.js";
import { renderLaupPost } from "../../../server/laup.js";
import { cleanText, validateLicense, validateTags } from "../../../server/validation.js";
import {
  managedMediaHashesFromHtml,
  validMediaHash,
  mediaReferenceStatements,
  validateManagedMedia,
} from "../../../server/media.js";
import {
  classificationCardMediaHashes,
  parseClassificationCards,
  reconcileClassificationCardPlacements,
} from "../../../server/classificationCards.js";
import { parseCitations, sanitizeCitations, validateCitationMarkers } from "../../../server/citations.js";
import { experienceEventStatement } from "../../../server/experience.js";
import {
  PRIVATE_VISIBILITY,
  PUBLIC_VISIBILITY,
  normalizeVisibility,
  releasePrivateWorkSlotStatement,
  throwPrivateWorkDatabaseError,
} from "../../../server/privateWorks.js";
import { normalizeArticleTemplate, parseArticleTemplate } from "../../../shared/articleTemplates.js";

export const onRequestGet = withApi(async ({ request, params, env }) => {
  const viewer = await getCurrentUser(env.DB, request);
  const url = new URL(request.url);
  const revisionParam = url.searchParams.get("revision");
  const post = await loadPost(env.DB, String(params.id), { viewerId: viewer?.id });
  if (!post) throw new ApiError(404, "文章不存在", "POST_NOT_FOUND");

  // ?revision=N —— 取某一版的内容快照（历史对比 / 回滚用）。
  // 源码（content_laup）随快照一起返回：diff 和回滚都在源码层面做。
  if (revisionParam !== null) {
    const revisionNumber = Number(revisionParam);
    if (!Number.isInteger(revisionNumber) || revisionNumber < 1) {
      throw new ApiError(400, "版本号无效", "INVALID_REVISION");
    }
    const revision = await env.DB.prepare(
      `SELECT r.revision_number, r.title, r.content_html, r.content_laup,
              r.change_note, r.created_at, r.article_template_json,
              r.citations_json, r.classification_card_json,
              u.display_name AS editor_name, u.public_id AS editor_public_id
         FROM post_revisions r LEFT JOIN users u ON u.id = r.created_by
        WHERE r.post_id = ? AND r.revision_number = ?`,
    ).bind(post.id, revisionNumber).first();
    if (!revision) throw new ApiError(404, "历史版本不存在", "REVISION_NOT_FOUND");
    return json(
      {
        success: true,
        revision: {
          revisionCount: revision.revision_number,
          title: revision.title,
          changeNote: revision.change_note,
          submittedAt: revision.created_at,
          editor: revision.editor_name || "",
          editorUid: revision.editor_public_id
            ? formatPublicId("user", revision.editor_public_id)
            : "",
          contentType: revision.content_laup ? "laup" : "html",
          // laup 文章给源码（diff/回滚的真相）；html 文章给清洗后的 HTML
          contentSource: revision.content_laup || "",
          content: revision.content_html,
          articleTemplate: parseArticleTemplate(revision.article_template_json),
          citations: parseCitations(revision.citations_json),
          classificationCards: parseClassificationCards(revision.classification_card_json),
        },
      },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=1800" } },
    );
  }

  return json(
    { success: true, post },
    {
      headers: {
        "Cache-Control": post.visibility === PRIVATE_VISIBILITY
          ? "private, no-store"
          : "public, max-age=60, stale-while-revalidate=300",
      },
    },
  );
});

export const onRequestPut = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  await enforceRateLimit(env.DB, `post-update:${user.id}`, 30, 60);
  const identifier = String(params.id);
  const publicId = parsePublicId("post", identifier);
  const existing = await env.DB.prepare(
    `SELECT * FROM posts WHERE ${publicId ? "public_id = ?" : "id = ?"} AND deleted_at IS NULL`,
  )
    .bind(publicId || identifier)
    .first();
  if (!existing) throw new ApiError(404, "文章不存在", "POST_NOT_FOUND");
  const id = existing.id;
  if (existing.creator_id !== user.id) {
    throw new ApiError(403, "只能修改自己的文章", "FORBIDDEN");
  }

  const body = await readJson(request, 420 * 1024);
  const visibility = normalizeVisibility(body.visibility, existing.visibility || PUBLIC_VISIBILITY);
  // 公开 ⇄ 私密都允许改（2026-10-12 起）：私密作品已不设槽位上限，
  // 转私有没有容量问题；编辑表单里也能直接切（作者本人权限不变）。
  const isPrivateSave = visibility === PRIVATE_VISIBILITY;
  const publishingPrivate = existing.visibility === PRIVATE_VISIBILITY &&
    visibility === PUBLIC_VISIBILITY;
  const expectedVersion = Number(body.version);
  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
    throw new ApiError(400, "缺少有效的文章版本号", "VERSION_REQUIRED");
  }
  const title = cleanText(body.title || (isPrivateSave ? "未命名文章" : ""), "标题", {
    minimum: 1,
    maximum: 150,
  });
  if (!isPrivateSave) {
    try {
      await ensurePublicPostTitleAvailable(env.DB, title, id);
    } catch (error) {
      if (error.message === "PUBLIC_POST_TITLE_EXISTS") {
        throw new ApiError(409, "公开文章标题已存在，请使用不同标题", "PUBLIC_POST_TITLE_EXISTS");
      }
      throw error;
    }
  }
  const author = cleanText(body.author || existing.author, "作者", { minimum: 1, maximum: 120 });
  // 体裁不写就沿用这篇原来的 —— 只传 content 的老调用方不会把 Laup 正文降级成富文本。
  const contentFormat = Object.hasOwn(body, "contentFormat")
    ? normalizeContentFormat(body.contentFormat)
    : (existing.content_laup ? "laup" : "html");
  let contentHtml;
  let contentText;
  let contentSource = null;
  if (contentFormat === "laup") {
    const rendered = renderLaupPost(body.content);
    contentHtml = rendered.html;
    contentText = rendered.text;
    contentSource = String(body.content ?? "");
  } else {
    contentHtml = await sanitizePostHtml(body.content);
    contentText = htmlToPlainText(contentHtml);
  }
  const citations = sanitizeCitations(body.citations);
  validateCitationMarkers(contentHtml, citations);
  const citationsJson = JSON.stringify(citations);
  if (!isPrivateSave && !contentText) {
    throw new ApiError(400, "文章正文不能为空", "EMPTY_CONTENT");
  }
  const tagsJson = JSON.stringify(validateTags(body.tags));
  const classificationCards = reconcileClassificationCardPlacements(
    body.classificationCards || body.classificationCard,
    contentHtml,
  );
  const classificationCardJson = JSON.stringify({ cards: classificationCards });
  const cardImageHashes = classificationCardMediaHashes(classificationCards);
  const existingCardImageHashes = new Set(
    classificationCardMediaHashes(parseClassificationCards(existing.classification_card_json)),
  );
  for (const hash of cardImageHashes) {
    if (existingCardImageHashes.has(hash)) continue;
    const owned = await env.DB.prepare(
      "SELECT 1 AS owned FROM media_owners WHERE content_hash = ? AND user_id = ?",
    ).bind(hash, user.id).first();
    if (!owned) throw new ApiError(403, "只能使用自己上传的卡片图片", "CARD_IMAGE_NOT_OWNED");
  }
  const license = validateLicense(body.license);
  const postType = Object.hasOwn(body, "type")
    ? normalizePostType(body.type)
    : normalizePostType(existing.type);
  const articleTemplateJson = JSON.stringify(Object.hasOwn(body, "articleTemplate")
    ? normalizeArticleTemplate(body.articleTemplate)
    : parseArticleTemplate(existing.article_template_json));
  let coverHash = existing.cover_media_hash || null;
  if (Object.hasOwn(body, "coverHash")) {
    coverHash = body.coverHash ? validMediaHash(body.coverHash) : null;
    if (body.coverHash && !coverHash) {
      throw new ApiError(400, "文章封面标识无效", "INVALID_COVER_IMAGE");
    }
    if (coverHash) {
      const owned = await env.DB.prepare(
        "SELECT 1 AS owned FROM media_owners WHERE content_hash = ? AND user_id = ?",
      ).bind(coverHash, user.id).first();
      if (!owned && coverHash !== existing.cover_media_hash) {
        throw new ApiError(403, "只能使用自己上传的封面", "COVER_NOT_OWNED");
      }
    }
  }
  const isMinorChange = !isPrivateSave && !publishingPrivate && body.isMinorChange === true;
  const nextRevision = isPrivateSave
    ? 0
    : publishingPrivate
      ? 1
      : isMinorChange
        ? existing.revision_count
        : existing.revision_count + 1;
  const changeNote = isPrivateSave
    ? ""
    : isMinorChange
      ? existing.change_note
      : cleanText(
          body.changeNote || (publishingPrivate ? "发布文章" : "更新文章"),
          "提交说明",
          { maximum: 300 },
        );
  const nextVersion = publishingPrivate ? 1 : expectedVersion + 1;
  const now = new Date().toISOString();
  const mediaHashes = [...new Set([
    ...managedMediaHashesFromHtml(contentHtml),
    ...(coverHash ? [coverHash] : []),
    ...cardImageHashes,
  ])];
  await validateManagedMedia(env.DB, mediaHashes);
  const statements = [
    env.DB.prepare(
      `UPDATE posts SET title = ?, author = ?, cover_media_hash = ?, content_html = ?, content_text = ?,
        content_laup = ?, article_template_json = ?,
        tags_json = ?, type = ?, classification_card_json = ?, citations_json = ?,
        license = ?, revision_count = ?,
        change_note = ?, visibility = ?, version = ?, updated_at = ?
       WHERE id = ? AND version = ? AND deleted_at IS NULL`,
    ).bind(
      title, author, coverHash, contentHtml, contentText, contentSource, articleTemplateJson, tagsJson, postType,
      classificationCardJson, citationsJson,
      license, nextRevision, changeNote, visibility, nextVersion,
      now, id, expectedVersion,
    ),
  ];
  if (!isPrivateSave && !isMinorChange) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO post_revisions
          (post_id, revision_number, title, content_html, content_laup,
           classification_card_json, article_template_json,
           citations_json, change_note, created_at, created_by)
         SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          WHERE EXISTS (SELECT 1 FROM posts WHERE id = ? AND version = ?)`,
      ).bind(
        id, nextRevision, title, contentHtml, contentSource, classificationCardJson, articleTemplateJson,
        citationsJson, changeNote, now, user.id, id, nextVersion,
      ),
    );
  }
  if (!isPrivateSave) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO sync_events (entity_type, entity_id, operation, version, occurred_at)
         SELECT 'post', ?, 'UPSERT', ?, ?
          WHERE EXISTS (SELECT 1 FROM posts WHERE id = ? AND version = ?)`,
      ).bind(id, nextVersion, now, id, nextVersion),
    );
    if (publishingPrivate) {
      statements.push(
        experienceEventStatement(env.DB, user.id, "POST_CREATED", `post:${id}`, now),
        releasePrivateWorkSlotStatement(env.DB, "POST", id),
      );
    }
  } else if (existing.visibility === PUBLIC_VISIBILITY) {
    // 公开 → 私密：公开镜像里撤下（同步事件发 DELETE）。
    statements.push(
      env.DB.prepare(
        `INSERT INTO sync_events (entity_type, entity_id, operation, version, occurred_at)
         SELECT 'post', ?, 'DELETE', ?, ?
          WHERE EXISTS (SELECT 1 FROM posts WHERE id = ? AND version = ?)`,
      ).bind(id, nextVersion, now, id, nextVersion),
    );
  }
  let results;
  try {
    results = await env.DB.batch(statements);
  } catch (error) {
    throwPrivateWorkDatabaseError(error);
  }
  if (Number(results[0]?.meta?.changes || 0) !== 1) {
    throw new ApiError(409, "文章已被其他设备更新，请刷新后重试", "VERSION_CONFLICT");
  }
  await env.DB.batch(
    mediaReferenceStatements(env.DB, "POST", id, mediaHashes, now, { replace: true }),
  );

  return json({
    success: true,
    post: await loadPost(env.DB, id, { viewerId: user.id }),
  });
});

export const onRequestDelete = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  await enforceRateLimit(env.DB, `post-delete:${user.id}`, 20, 60 * 60);
  const identifier = String(params.id);
  const publicId = parsePublicId("post", identifier);
  const existing = await env.DB.prepare(
    `SELECT * FROM posts WHERE ${publicId ? "public_id = ?" : "id = ?"} AND deleted_at IS NULL`,
  )
    .bind(publicId || identifier)
    .first();
  if (!existing) throw new ApiError(404, "文章不存在", "POST_NOT_FOUND");
  const canDelete = existing.visibility === PRIVATE_VISIBILITY
    ? existing.creator_id === user.id
    : canDeleteOwnedContent(user, existing.creator_id);
  if (!canDelete) {
    throw new ApiError(403, "只能删除自己的文章", "FORBIDDEN");
  }

  const now = new Date().toISOString();
  const nextVersion = Number(existing.version || 1) + 1;
  const statements = [
    env.DB.prepare(
      `UPDATE posts
          SET deleted_at = ?, updated_at = ?, version = ?
        WHERE id = ? AND deleted_at IS NULL`,
    ).bind(now, now, nextVersion, existing.id),
  ];
  if (existing.visibility !== PRIVATE_VISIBILITY) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO sync_events (entity_type, entity_id, operation, version, occurred_at)
         SELECT 'post', ?, 'DELETE', ?, ?
          WHERE EXISTS (SELECT 1 FROM posts WHERE id = ? AND deleted_at = ?)`,
      ).bind(existing.id, nextVersion, now, existing.id, now),
    );
  } else {
    statements.push(
      releasePrivateWorkSlotStatement(env.DB, "POST", existing.id),
    );
  }
  const results = await env.DB.batch(statements);
  if (Number(results[0]?.meta?.changes || 0) !== 1) {
    throw new ApiError(409, "文章删除状态已发生变化", "DELETE_CONFLICT");
  }
  return json({
    success: true,
    post: {
      id: existing.id,
      uid: formatPublicId("post", existing.public_id),
      deletedAt: now,
    },
  });
});
