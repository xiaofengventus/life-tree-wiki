import { getCurrentUser, requireRole, requireUser } from "../../../server/auth.js";
import { ApiError, json, readJson, withApi } from "../../../server/http.js";
import {
  ensurePublicPostTitleAvailable,
  loadPost,
  normalizeContentFormat,
  normalizePostType,
  postSummary,
} from "../../../server/posts.js";
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
import { experienceEventStatement } from "../../../server/experience.js";
import {
  classificationCardMediaHashes,
  reconcileClassificationCardPlacements,
} from "../../../server/classificationCards.js";
import { sanitizeCitations, validateCitationMarkers } from "../../../server/citations.js";
import {
  PRIVATE_VISIBILITY,
  normalizeVisibility,
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

  // folder=<id> 只看某文件夹；folder=none 只看未入夹的「未分类」散文章。
  // 与 type 筛选可以叠加（两者互不干涉：type 是文章自身属性，folder 是组织层）。
  const folderParam = url.searchParams.has("folder")
    ? String(url.searchParams.get("folder") || "")
    : null;
  if (folderParam === "") {
    throw new ApiError(400, "文件夹筛选参数无效", "INVALID_FOLDER_FILTER");
  }
  const folderClause = folderParam === null
    ? ""
    : folderParam === "none"
      ? "AND posts.folder_id IS NULL "
      : "AND posts.folder_id = ? ";

  // q= 标题模糊搜索（放文章进文件夹时的选文搜索用）。LIKE 通配符转义。
  const qFilter = String(url.searchParams.get("q") || "").trim().slice(0, 80);
  const qClause = qFilter ? "AND posts.title LIKE ? ESCAPE '\\' " : "";
  const qPattern = `%${qFilter.replace(/[\\%_]/g, (match) => `\\${match}`)}%`;

  const baseSelect = `SELECT posts.id, posts.creator_id, posts.title, posts.author,
    posts.cover_media_hash, posts.type,
    substr(posts.content_text, 1, 240) AS excerpt, posts.tags_json,
    posts.classification_card_json, posts.license,
    posts.revision_count, posts.change_note, posts.version, posts.created_at,
    posts.updated_at, posts.visibility,
    users.display_name AS creator_name,
    users.public_id AS creator_public_id,
    users.avatar_media_hash AS creator_avatar_hash
    FROM posts JOIN users ON users.id = posts.creator_id`;
  const typeClause = typeFilter === null ? "" : "AND posts.type = ? ";
  // 登录者能在专栏列表里看到自己的私密文章（带 isPrivate 标记）；访客视角不变。
  const viewer = await getCurrentUser(env.DB, request).catch(() => null);
  const viewerId = viewer?.id || "";
  const filterBinds = [
    ...(typeFilter === null ? [] : [typeFilter]),
    ...(qFilter ? [qPattern] : []),
    ...(folderParam !== null && folderParam !== "none" ? [folderParam] : []),
  ];
  const statement = cursor
    ? env.DB.prepare(
        `${baseSelect}
          WHERE posts.deleted_at IS NULL
            AND (posts.visibility = 'PUBLIC' OR posts.creator_id = ?)
            ${typeClause}${qClause}${folderClause}
            AND (posts.updated_at < ? OR (posts.updated_at = ? AND posts.id < ?))
          ORDER BY posts.updated_at DESC, posts.id DESC LIMIT ?`,
      ).bind(viewerId, ...filterBinds, cursor.updatedAt, cursor.updatedAt, cursor.id, limit + 1)
    : env.DB.prepare(
        `${baseSelect}
          WHERE posts.deleted_at IS NULL
            AND (posts.visibility = 'PUBLIC' OR posts.creator_id = ?)
            ${typeClause}${qClause}${folderClause}
          ORDER BY posts.updated_at DESC, posts.id DESC LIMIT ?`,
      ).bind(viewerId, ...filterBinds, limit + 1);

  const result = await statement.all();
  const rows = result.results || [];
  const hasMore = rows.length > limit;
  const visibleRows = rows.slice(0, limit);
  const nextCursor = hasMore ? encodeCursor(visibleRows[visibleRows.length - 1]) : null;
  return json(
    { success: true, posts: visibleRows.map(postSummary), nextCursor },
    {
      headers: {
        // 登录视角的列表混有私密文章，不能进公共缓存。
        "Cache-Control": viewer
          ? "private, no-store"
          : "public, max-age=30, stale-while-revalidate=120",
      },
    },
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
  // 正文体裁决定"谁负责把 content 变成 HTML"：
  //   laup —— 收的是 Laup 源码，由 Laup 自己的渲染器在服务端重渲（产物白名单也是它的）；
  //   html —— 收的是前端富文本，走站点自己的清洗白名单（既有链路，未改动）。
  const contentFormat = normalizeContentFormat(body.contentFormat);
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
    ...(isPrivate && !isPrivateWorkUnlimited(user)
      ? [reservePrivateWorkSlotStatement(env.DB, user.id, "POST", id, now)]
      : []),
    env.DB.prepare(
      `INSERT INTO posts
        (id, creator_id, title, author, cover_media_hash, content_html, content_text,
         content_laup,
         tags_json, type, classification_card_json, citations_json,
         license, revision_count, change_note, visibility,
         version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    ).bind(
      id, user.id, title, author, coverHash, contentHtml, contentText, contentSource,
      tagsJson, postType, classificationCardJson, citationsJson,
      license, isPrivate ? 0 : 1, changeNote, visibility, now, now,
    ),
    ...mediaReferenceStatements(env.DB, "POST", id, mediaHashes, now),
  ];
  if (!isPrivate) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO post_revisions
          (post_id, revision_number, title, content_html, content_laup,
           classification_card_json,
           citations_json, change_note, created_at, created_by)
         VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        id, title, contentHtml, contentSource, classificationCardJson, citationsJson,
        changeNote, now, user.id,
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
