import { requireUser } from "../../../../server/auth.js";
import { json, requireSameOrigin, withApi } from "../../../../server/http.js";
import { createProject, listProjects } from "../../../../server/papilotProjects.js";

export const onRequestGet = withApi(async ({ request, env }) => {
  const user = await requireUser(env.DB, request);
  return json(await listProjects(env.DB, user.id));
});

export const onRequestPost = withApi(async ({ request, env }) => {
  requireSameOrigin(request);
  const user = await requireUser(env.DB, request);
  return json({ project: await createProject(env, user.id, request) }, { status: 201 });
});
