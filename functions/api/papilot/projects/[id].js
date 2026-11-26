import { requireUser } from "../../../../server/auth.js";
import { json, requireSameOrigin, withApi } from "../../../../server/http.js";
import { archiveProject, getProject, saveProject } from "../../../../server/papilotProjects.js";

export const onRequestGet = withApi(async ({ request, env, params }) => {
  const user = await requireUser(env.DB, request);
  return json({ project: await getProject(env, user.id, params.id) });
});

export const onRequestPut = withApi(async ({ request, env, params }) => {
  requireSameOrigin(request);
  const user = await requireUser(env.DB, request);
  return json({ project: await saveProject(env, user.id, params.id, request) });
});

export const onRequestDelete = withApi(async ({ request, env, params }) => {
  requireSameOrigin(request);
  const user = await requireUser(env.DB, request);
  return json({ project: await archiveProject(env, user.id, params.id, request) });
});
