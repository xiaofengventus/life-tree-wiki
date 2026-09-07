import { ApiError } from "./http.js";

export const PRIVATE_WORK_LIMIT = 5;
export const PUBLIC_VISIBILITY = "PUBLIC";
export const PRIVATE_VISIBILITY = "PRIVATE";

export function normalizeVisibility(value, fallback = PUBLIC_VISIBILITY) {
  const visibility = String(value || fallback).toUpperCase();
  if (![PUBLIC_VISIBILITY, PRIVATE_VISIBILITY].includes(visibility)) {
    throw new ApiError(400, "可见范围无效", "INVALID_VISIBILITY");
  }
  return visibility;
}

export function reservePrivateWorkSlotStatement(
  DB,
  ownerId,
  entityType,
  entityId,
  createdAt,
) {
  return DB.prepare(
    `INSERT INTO private_work_slots
      (owner_id, slot_number, entity_type, entity_id, created_at)
     VALUES (
       ?,
       (
         SELECT candidate.slot_number
           FROM (
             SELECT 1 AS slot_number
             UNION ALL SELECT 2
             UNION ALL SELECT 3
             UNION ALL SELECT 4
             UNION ALL SELECT 5
           ) AS candidate
          WHERE NOT EXISTS (
            SELECT 1 FROM private_work_slots
             WHERE owner_id = ? AND slot_number = candidate.slot_number
          )
          ORDER BY candidate.slot_number
          LIMIT 1
       ),
       ?, ?, ?
     )`,
  ).bind(ownerId, ownerId, entityType, entityId, createdAt);
}

export function releasePrivateWorkSlotStatement(DB, entityType, entityId) {
  const table = entityType === "TREE" ? "published_trees" : "posts";
  return DB.prepare(
    `DELETE FROM private_work_slots
      WHERE entity_type = ? AND entity_id = ?
        AND EXISTS (
          SELECT 1 FROM ${table}
           WHERE id = ?
             AND (visibility = 'PUBLIC' OR deleted_at IS NOT NULL)
        )`,
  ).bind(entityType, entityId, entityId);
}

export function throwPrivateWorkDatabaseError(error) {
  const message = String(error?.message || error || "");
  if (
    message.includes("PRIVATE_WORK_LIMIT") ||
    (
      message.includes("NOT NULL constraint failed") &&
      message.includes("private_work_slots.slot_number")
    )
  ) {
    throw new ApiError(
      409,
      `仅自己可见的文章和进化树合计最多 ${PRIVATE_WORK_LIMIT} 个`,
      "PRIVATE_WORK_LIMIT",
    );
  }
  if (message.includes("PUBLIC_WORK_CANNOT_BECOME_PRIVATE")) {
    throw new ApiError(
      409,
      "已经公开的作品不能改回仅自己可见",
      "PUBLIC_WORK_CANNOT_BECOME_PRIVATE",
    );
  }
  throw error;
}
