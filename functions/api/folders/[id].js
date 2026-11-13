import { requireRole, requireUser } from "../../../server/auth.js";
import { ApiError, json, readJson, withApi } from "../../../server/http.js";
import { enforceRateLimit } from "../../../server/rateLimit.js";
import {
  canManageFolder,
  cleanFolderName,
  normalizeFolderSection,
} from "../../../server/folders.js";

async function loadFolder(DB, id) {
  const row = await DB.prepare("SELECT * FROM folders WHERE id = ?")
    .bind(String(id || ""))
    .first();
  if (!row) throw new ApiError(404, "文件夹不存在", "FOLDER_NOT_FOUND");
  return row;
}

// PATCH /api/folders/:id —— 改名 / 换区（创建者、ADMIN、站点所有者）。
export const onRequestPatch = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  requireRole(user, ["USER", "ADMIN", "COOPERATOR"]);
  await enforceRateLimit(env.DB, `folder-update:${user.id}`, 30, 60);
  const folder = await loadFolder(env.DB, params.id);
  if (!canManageFolder(user, folder)) {
    throw new ApiError(403, "只有文件夹创建者或管理员可以修改文件夹", "FORBIDDEN");
  }
  const body = await readJson(request);
  const name = Object.hasOwn(body, "name")
    ? cleanFolderName(body.name)
    : folder.name;
  const section = Object.hasOwn(body, "section")
    ? normalizeFolderSection(body.section, folder.section)
    : folder.section;
  const now = new Date().toISOString();
  await env.DB.prepare(
    "UPDATE folders SET name = ?, section = ?, updated_at = ? WHERE id = ?",
  ).bind(name, section, now, folder.id).run();
  return json({ success: true, folder: { id: folder.id, name, section } });
});

// DELETE /api/folders/:id —— 删文件夹（创建者、ADMIN、站点所有者）。
// 里面的文章不删：folder_id 置 NULL，全部回到「未分类」散文章。
export const onRequestDelete = withApi(async ({ request, params, env }) => {
  const user = await requireUser(env.DB, request);
  requireRole(user, ["USER", "ADMIN", "COOPERATOR"]);
  await enforceRateLimit(env.DB, `folder-delete:${user.id}`, 20, 60 * 60);
  const folder = await loadFolder(env.DB, params.id);
  if (!canManageFolder(user, folder)) {
    throw new ApiError(403, "只有文件夹创建者或管理员可以删除文件夹", "FORBIDDEN");
  }
  await env.DB.batch([
    // 先放文章再删夹子；即使外键 ON DELETE SET NULL 因会话设置失效，这里也兜底。
    env.DB.prepare(
      "UPDATE posts SET folder_id = NULL WHERE folder_id = ?",
    ).bind(folder.id),
    env.DB.prepare("DELETE FROM folders WHERE id = ?").bind(folder.id),
  ]);
  return json({ success: true, folder: { id: folder.id } });
});
