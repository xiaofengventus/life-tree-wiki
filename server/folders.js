import { ApiError } from "./http.js";
import { isSiteOwner } from "./auth.js";
import { formatPublicId } from "./publicIds.js";
import { cleanText } from "./validation.js";

// 文件夹的一级分区：science 科普 / news 新闻 / none 未分类。
// 这是「文件夹挂在哪个区」，与文章自身的 posts.type 完全无关。
export const FOLDER_SECTIONS = new Set(["science", "news", "none"]);
export const FOLDER_SECTION_LABELS = {
  science: "科普",
  news: "新闻",
  none: "未分类",
};

export function normalizeFolderSection(value, fallback = "none") {
  const candidate = String(value || "").trim().toLowerCase();
  return FOLDER_SECTIONS.has(candidate) ? candidate : fallback;
}

export function cleanFolderName(value) {
  return cleanText(value, "文件夹名称", { minimum: 1, maximum: 60 });
}

// 谁能改名 / 换区 / 删除文件夹：创建者本人、站点所有者，或 ADMIN 角色。
// 「往里放文章」不受这条管——公开文章任何登录用户都能放。
export function canManageFolder(user, folder) {
  return Boolean(
    user && folder && (
      user.id === folder.creator_id ||
      user.role === "ADMIN" ||
      isSiteOwner(user)
    ),
  );
}

// 谁能看到一个文件夹：公开夹人人可见；
// 私密夹（is_private=1）只对创建者 / ADMIN / 站点所有者返回。
export function canViewFolder(user, folder) {
  if (!folder?.is_private) return true;
  return canManageFolder(user, folder);
}

// 谁能把一篇文章从文件夹里拿出来：文章作者、夹主、站点所有者或 ADMIN。
export function canRemovePostFromFolder(user, folder, postCreatorId) {
  if (!user) return false;
  return (
    user.id === postCreatorId ||
    canManageFolder(user, folder)
  );
}

// folders 列表行 → 前端对象。postCount 由调用方 SQL 子查询给出。
export function folderSummary(row, viewer = null) {
  return {
    id: row.id,
    name: row.name,
    section: row.section,
    isPrivate: Boolean(row.is_private),
    creatorId: row.creator_id,
    creatorName: row.creator_name || "",
    creatorUid: formatPublicId("user", row.creator_public_id) || "",
    postCount: Number(row.post_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    canManage: canManageFolder(viewer, row),
  };
}
