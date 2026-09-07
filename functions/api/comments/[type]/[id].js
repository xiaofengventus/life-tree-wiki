import { canDeleteOwnedContent, getCurrentUser, requireUser } from "../../../../server/auth.js";
import { ApiError, json, readJson, withApi } from "../../../../server/http.js";
import { enforceRateLimit } from "../../../../server/rateLimit.js";
import { publicComment, resolveContentTarget } from "../../../../server/social.js";
import { cleanText } from "../../../../server/validation.js";

const ROOT_PAGE_SIZE = 10;
const REPLY_PAGE_SIZE = 10;
const REPLY_PREVIEW_SIZE = 3;

const COMMENT_FIELDS = `content_comments.*,
  users.display_name AS creator_name,
  users.public_id AS creator_public_id,
  users.level AS creator_level,
  users.avatar_media_hash,
  reply_users.display_name AS reply_to_name,
  reply_users.public_id AS reply_to_public_id`;

const COMMENT_FROM = `FROM content_comments
  JOIN users ON users.id = content_comments.creator_id
  LEFT JOIN content_comments AS reply_target
    ON reply_target.id = content_comments.reply_to_id
  LEFT JOIN users AS reply_users
    ON reply_users.id = reply_target.creator_id`;

const COMMENT_SELECT = `SELECT ${COMMENT_FIELDS} ${COMMENT_FROM}`;

function encodeCursor(row) {
  return btoa(JSON.stringify([row.created_at, row.id]));
}

function decodeCursor(value) {
  if (!value) return null;
  try {
    const [createdAt, id] = JSON.parse(atob(value));
    if (typeof createdAt !== "string" || typeof id !== "string") return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

function commentWithPermissions(row, viewer) {
  return {
    ...publicComment(row),
    canDelete: canDeleteOwnedContent(viewer, row.creator_id),
  };
}

async function loadRootComments(DB, target, viewer, cursor) {
  const statement = cursor
    ? DB.prepare(
        `${COMMENT_SELECT}
          WHERE content_comments.target_type = ?
            AND content_comments.target_id = ?
            AND content_comments.root_id IS NULL
            AND content_comments.deleted_at IS NULL
            AND (
              content_comments.created_at < ?
              OR (content_comments.created_at = ? AND content_comments.id < ?)
            )
          ORDER BY content_comments.created_at DESC, content_comments.id DESC
          LIMIT ?`,
      ).bind(
        target.type,
        target.id,
        cursor.createdAt,
        cursor.createdAt,
        cursor.id,
        ROOT_PAGE_SIZE + 1,
      )
    : DB.prepare(
        `${COMMENT_SELECT}
          WHERE content_comments.target_type = ?
            AND content_comments.target_id = ?
            AND content_comments.root_id IS NULL
            AND content_comments.deleted_at IS NULL
          ORDER BY content_comments.created_at DESC, content_comments.id DESC
          LIMIT ?`,
      ).bind(target.type, target.id, ROOT_PAGE_SIZE + 1);

  const result = await statement.all();
  const rows = result.results || [];
  const hasMore = rows.length > ROOT_PAGE_SIZE;
  const visibleRows = rows.slice(0, ROOT_PAGE_SIZE);
  if (!visibleRows.length) {
    return { comments: [], nextCursor: null };
  }

  const rootIds = visibleRows.map((row) => row.id);
  const placeholders = rootIds.map(() => "?").join(", ");
  const [countsResult, previewsResult] = await DB.batch([
    DB.prepare(
      `SELECT root_id, COUNT(*) AS reply_count
         FROM content_comments
        WHERE root_id IN (${placeholders}) AND deleted_at IS NULL
        GROUP BY root_id`,
    ).bind(...rootIds),
    DB.prepare(
      `WITH ranked_replies AS (
         SELECT ${COMMENT_FIELDS},
                ROW_NUMBER() OVER (
                  PARTITION BY content_comments.root_id
                  ORDER BY content_comments.created_at ASC, content_comments.id ASC
                ) AS reply_rank
           ${COMMENT_FROM}
          WHERE content_comments.root_id IN (${placeholders})
            AND content_comments.deleted_at IS NULL
       )
       SELECT * FROM ranked_replies
        WHERE reply_rank <= ?
        ORDER BY root_id, created_at ASC, id ASC`,
    ).bind(...rootIds, REPLY_PREVIEW_SIZE),
  ]);

  const replyCounts = new Map(
    (countsResult.results || []).map((row) => [row.root_id, Number(row.reply_count || 0)]),
  );
  const repliesByRoot = new Map();
  for (const reply of previewsResult.results || []) {
    if (!repliesByRoot.has(reply.root_id)) repliesByRoot.set(reply.root_id, []);
    repliesByRoot.get(reply.root_id).push(commentWithPermissions(reply, viewer));
  }

  return {
    comments: visibleRows.map((row) => {
      const replies = repliesByRoot.get(row.id) || [];
      const replyCount = replyCounts.get(row.id) || 0;
      return {
        ...commentWithPermissions(row, viewer),
        replyCount,
        replies,
        repliesNextCursor: replyCount > replies.length && replies.length
          ? encodeCursor({
              created_at: replies[replies.length - 1].createdAt,
              id: replies[replies.length - 1].id,
            })
          : null,
      };
    }),
    nextCursor: hasMore ? encodeCursor(visibleRows[visibleRows.length - 1]) : null,
  };
}

async function loadReplies(DB, target, viewer, rootId, cursor) {
  const root = await DB.prepare(
    `SELECT id FROM content_comments
      WHERE id = ? AND target_type = ? AND target_id = ?
        AND root_id IS NULL AND deleted_at IS NULL`,
  ).bind(rootId, target.type, target.id).first();
  if (!root) throw new ApiError(404, "主评论不存在", "COMMENT_NOT_FOUND");

  const statement = cursor
    ? DB.prepare(
        `${COMMENT_SELECT}
          WHERE content_comments.root_id = ?
            AND content_comments.deleted_at IS NULL
            AND (
              content_comments.created_at > ?
              OR (content_comments.created_at = ? AND content_comments.id > ?)
            )
          ORDER BY content_comments.created_at ASC, content_comments.id ASC
          LIMIT ?`,
      ).bind(
        rootId,
        cursor.createdAt,
        cursor.createdAt,
        cursor.id,
        REPLY_PAGE_SIZE + 1,
      )
    : DB.prepare(
        `${COMMENT_SELECT}
          WHERE content_comments.root_id = ?
            AND content_comments.deleted_at IS NULL
          ORDER BY content_comments.created_at ASC, content_comments.id ASC
          LIMIT ?`,
      ).bind(rootId, REPLY_PAGE_SIZE + 1);

  const result = await statement.all();
  const rows = result.results || [];
  const hasMore = rows.length > REPLY_PAGE_SIZE;
  const visibleRows = rows.slice(0, REPLY_PAGE_SIZE);
  return {
    comments: visibleRows.map((row) => commentWithPermissions(row, viewer)),
    nextCursor: hasMore && visibleRows.length
      ? encodeCursor(visibleRows[visibleRows.length - 1])
      : null,
  };
}

export const onRequestGet = withApi(async ({ request, params, env }) => {
  const target = await resolveContentTarget(env.DB, params.type, params.id);
  const viewer = await getCurrentUser(env.DB, request);
  const url = new URL(request.url);
  const cursorValue = url.searchParams.get("cursor") || "";
  const cursor = decodeCursor(cursorValue);
  if (cursorValue && !cursor) {
    throw new ApiError(400, "评论分页游标无效", "INVALID_CURSOR");
  }

  const rootId = String(url.searchParams.get("root") || "").trim();
  const payload = rootId
    ? await loadReplies(env.DB, target, viewer, rootId, cursor)
    : await loadRootComments(env.DB, target, viewer, cursor);
  return json({ success: true, ...payload });
});

export const onRequestPost = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  const target = await resolveContentTarget(env.DB, params.type, params.id);
  const body = await readJson(request, 4 * 1024);
  const content = cleanText(body.content, "评论", { minimum: 1, maximum: 500 });
  await enforceRateLimit(env.DB, `comment-create:${user.id}`, 30, 24 * 60 * 60);

  const parentId = String(body.parentId || "").trim();
  let parent = null;
  let rootId = null;
  let rootCreatorId = null;
  if (parentId) {
    parent = await env.DB.prepare(
      `SELECT id, creator_id, root_id
         FROM content_comments
        WHERE id = ? AND target_type = ? AND target_id = ? AND deleted_at IS NULL`,
    ).bind(parentId, target.type, target.id).first();
    if (!parent) throw new ApiError(404, "回复的评论不存在", "COMMENT_NOT_FOUND");

    rootId = parent.root_id || parent.id;
    const root = parent.root_id
      ? await env.DB.prepare(
          `SELECT creator_id FROM content_comments
            WHERE id = ? AND root_id IS NULL AND deleted_at IS NULL`,
        ).bind(rootId).first()
      : parent;
    if (!root) throw new ApiError(404, "主评论不存在", "COMMENT_NOT_FOUND");
    rootCreatorId = root.creator_id;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const notificationType = target.type === "POST" ? "COMMENT_POST" : "COMMENT_TREE";
  const targetLabel = target.type === "POST" ? "文章" : "进化树";
  const message = parent
    ? `有人回复了你在${targetLabel}“${target.title}”下的评论`
    : `有人在${targetLabel}“${target.title}”下发表了评论`;

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO content_comments
        (id, target_type, target_id, creator_id, content, created_at, root_id, reply_to_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id,
      target.type,
      target.id,
      user.id,
      content,
      now,
      rootId,
      parent?.id || null,
    ),
    env.DB.prepare(
      `INSERT OR IGNORE INTO notifications
        (id, recipient_id, actor_id, type, target_type, target_id, source_id, message, created_at)
       SELECT lower(hex(randomblob(16))), users.id, ?, ?, ?, ?, ?, ?, ?
         FROM users
        WHERE users.status = 'ACTIVE'
          AND (
            users.public_id = 1
            OR users.id IN (?, ?, ?)
          )
          AND users.id <> ?`,
    ).bind(
      user.id,
      notificationType,
      target.type,
      target.id,
      id,
      message,
      now,
      target.creatorId,
      parent?.creator_id || target.creatorId,
      rootCreatorId || target.creatorId,
      user.id,
    ),
  ]);

  const row = await env.DB.prepare(`${COMMENT_SELECT} WHERE content_comments.id = ?`)
    .bind(id).first();
  return json({
    success: true,
    comment: {
      ...commentWithPermissions(row, user),
      ...(rootId ? {} : { replyCount: 0, replies: [], repliesNextCursor: null }),
    },
  }, { status: 201 });
});
