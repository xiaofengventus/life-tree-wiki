import { ApiError, json, withApi } from "../../server/http.js";
import { postDetail } from "../../server/posts.js";

export const onRequestGet = withApi(async ({ request, env }) => {
  const url = new URL(request.url);
  const since = Number(url.searchParams.get("since") || 0);
  if (!Number.isSafeInteger(since) || since < 0) {
    throw new ApiError(400, "同步游标无效", "INVALID_SYNC_CURSOR");
  }

  const eventsResult = await env.DB.prepare(
    `SELECT sequence, entity_id, operation, version, occurred_at
       FROM sync_events
      WHERE entity_type = 'post' AND sequence > ?
      ORDER BY sequence ASC LIMIT 50`,
  )
    .bind(since)
    .all();
  const events = eventsResult.results || [];
  const ids = [...new Set(events.filter((event) => event.operation === "UPSERT").map((event) => event.entity_id))];
  let posts = [];
  if (ids.length) {
    const placeholders = ids.map(() => "?").join(",");
    const result = await env.DB.prepare(
      `SELECT posts.*, users.display_name AS creator_name,
              users.public_id AS creator_public_id,
              users.avatar_media_hash AS creator_avatar_hash
         FROM posts JOIN users ON users.id = posts.creator_id
        WHERE posts.deleted_at IS NULL
          AND posts.visibility = 'PUBLIC'
          AND posts.id IN (${placeholders})`,
    )
      .bind(...ids)
      .all();
    posts = (result.results || []).map((row) => postDetail(row));
  }

  return json({
    success: true,
    posts,
    deletedIds: events.filter((event) => event.operation === "DELETE").map((event) => event.entity_id),
    cursor: events.length ? events[events.length - 1].sequence : since,
    hasMore: events.length === 50,
  });
});
