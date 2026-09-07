import { requireUser } from "../../../server/auth.js";
import { ApiError, json, readJson, withApi } from "../../../server/http.js";
import { mediaUrl } from "../../../server/media.js";
import { formatPublicId } from "../../../server/publicIds.js";

const NOTIFICATION_SELECT = `
  SELECT notifications.*,
         actor.display_name AS actor_name,
         actor.public_id AS actor_public_id,
         actor.avatar_media_hash AS actor_avatar_hash,
         posts.public_id AS post_public_id,
         posts.title AS post_title,
         trees.public_id AS tree_public_id,
         trees.title AS tree_title,
         contributions.target_tree_id AS contribution_tree_id
    FROM notifications
    LEFT JOIN users AS actor ON actor.id = notifications.actor_id
    LEFT JOIN posts
      ON notifications.target_type = 'POST' AND posts.id = notifications.target_id
    LEFT JOIN published_trees AS trees
      ON notifications.target_type = 'TREE' AND trees.id = notifications.target_id
    LEFT JOIN tree_contributions AS contributions
      ON notifications.target_type = 'CONTRIBUTION'
     AND contributions.id = notifications.target_id`;

function publicNotification(row) {
  let href = "/notifications";
  if (row.target_type === "POST") {
    href = `/view-post/${formatPublicId("post", row.post_public_id) || row.target_id}`;
  } else if (row.target_type === "TREE") {
    href = `/view-tree/${formatPublicId("tree", row.tree_public_id) || row.target_id}`;
  } else if (row.target_type === "CONTRIBUTION") {
    href = `/tree-contributions/${row.target_id}`;
  }
  return {
    id: row.id,
    type: row.type,
    message: row.message,
    href,
    read: Boolean(row.read_at),
    readAt: row.read_at || "",
    createdAt: row.created_at,
    actor: row.actor_id
      ? {
          uid: formatPublicId("user", row.actor_public_id),
          name: row.actor_name || "",
          avatarUrl: row.actor_avatar_hash ? mediaUrl(row.actor_avatar_hash) : "",
        }
      : null,
  };
}

export const onRequestGet = withApi(async ({ request, env }) => {
  const user = await requireUser(env.DB, request);
  const [result, unread] = await Promise.all([
    env.DB.prepare(
      `${NOTIFICATION_SELECT}
        WHERE notifications.recipient_id = ?
        ORDER BY notifications.created_at DESC
        LIMIT 100`,
    ).bind(user.id).all(),
    env.DB.prepare(
      "SELECT COUNT(*) AS count FROM notifications WHERE recipient_id = ? AND read_at IS NULL",
    ).bind(user.id).first(),
  ]);
  return json({
    success: true,
    unreadCount: Number(unread?.count || 0),
    notifications: (result.results || []).map(publicNotification),
  });
});

export const onRequestPut = withApi(async ({ request, env }) => {
  const user = await requireUser(env.DB, request);
  const body = await readJson(request, 2 * 1024);
  const now = new Date().toISOString();
  if (body.all === true) {
    await env.DB.prepare(
      "UPDATE notifications SET read_at = ? WHERE recipient_id = ? AND read_at IS NULL",
    ).bind(now, user.id).run();
  } else {
    const id = String(body.id || "");
    if (!id) throw new ApiError(400, "缺少通知 ID", "INVALID_NOTIFICATION");
    await env.DB.prepare(
      `UPDATE notifications SET read_at = COALESCE(read_at, ?)
        WHERE id = ? AND recipient_id = ?`,
    ).bind(now, id, user.id).run();
  }
  const unread = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM notifications WHERE recipient_id = ? AND read_at IS NULL",
  ).bind(user.id).first();
  return json({ success: true, unreadCount: Number(unread?.count || 0) });
});
