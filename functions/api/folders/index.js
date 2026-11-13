import { getCurrentUser, requireRole, requireUser } from "../../../server/auth.js";
import { json, readJson, withApi } from "../../../server/http.js";
import { enforceRateLimit } from "../../../server/rateLimit.js";
import {
  canViewFolder,
  cleanFolderName,
  folderSummary,
  normalizeFolderSection,
} from "../../../server/folders.js";

// GET /api/folders —— 文件夹列表（含可见文章计数），按分区分组返回。
// 公开夹人人可见；私密夹只对创建者 / ADMIN / 站点所有者返回。
export const onRequestGet = withApi(async ({ request, env }) => {
  const viewer = await getCurrentUser(env.DB, request).catch(() => null);
  const result = await env.DB.prepare(
    `SELECT folders.*, users.display_name AS creator_name,
            users.public_id AS creator_public_id,
            (
              SELECT COUNT(*) FROM posts p
               WHERE p.folder_id = folders.id
                 AND p.deleted_at IS NULL
                 AND (p.visibility = 'PUBLIC'
                      OR (folders.is_private = 1
                          AND p.visibility = 'PRIVATE'
                          AND p.creator_id = folders.creator_id))
            ) AS post_count
       FROM folders JOIN users ON users.id = folders.creator_id
      ORDER BY folders.section ASC, folders.created_at ASC, folders.id ASC`,
  ).all();
  const rows = result.results || [];
  const sections = { science: [], news: [], none: [] };
  for (const row of rows) {
    if (!canViewFolder(viewer, row)) continue;
    const summary = folderSummary(row, viewer);
    (sections[summary.section] || sections.none).push(summary);
  }
  return json(
    { success: true, sections },
    // 登录视角带 canManage，不进公共缓存；未登录结果基本不变，仍按 no-store 处理最简单。
    { headers: { "Cache-Control": "no-store" } },
  );
});

// POST /api/folders —— 建文件夹（任何登录用户）。
export const onRequestPost = withApi(async ({ request, env }) => {
  const user = await requireUser(env.DB, request);
  requireRole(user, ["USER", "ADMIN", "COOPERATOR"]);
  await enforceRateLimit(env.DB, `folder-create:${user.id}`, 20, 60 * 60);
  const body = await readJson(request);
  const name = cleanFolderName(body.name);
  const section = normalizeFolderSection(body.section);
  const isPrivate = body.isPrivate ? 1 : 0;
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO folders (id, name, section, is_private, creator_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).bind(id, name, section, isPrivate, user.id, now, now).run();
  return json({ success: true, folder: { id, name, section, isPrivate: Boolean(isPrivate) } }, { status: 201 });
});

// _middleware.js 已做来源校验，这里只为可读性占位；保持与其它路由一致的调用形态。
function requireSameOriginGuard() {}
