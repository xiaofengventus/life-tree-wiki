import { formatPublicId } from "./publicIds.js";
import { experienceProgress } from "./experience.js";
import { mediaUrl } from "./media.js";

export function publicProfile(row) {
  return {
    uid: formatPublicId("user", row.public_id),
    name: row.display_name,
    introduce: row.bio || "",
    role: row.role,
    ...experienceProgress(row.experience),
    avatarUrl: row.avatar_media_hash ? mediaUrl(row.avatar_media_hash) : "",
    signup_data: row.created_at,
  };
}

export function adminUser(row) {
  return {
    uid: formatPublicId("user", row.public_id),
    username: row.username,
    name: row.display_name,
    introduce: row.bio || "",
    role: row.role,
    ...experienceProgress(row.experience),
    avatarUrl: row.avatar_media_hash ? mediaUrl(row.avatar_media_hash) : "",
    status: row.status,
    signupAt: row.created_at,
    updatedAt: row.updated_at,
    postCount: Number(row.post_count || 0),
    treeCount: Number(row.tree_count || 0),
    mediaUsedBytes: Number(row.media_used_bytes || 0),
    mediaQuotaBytes: Number(row.media_quota_bytes || 0),
  };
}
