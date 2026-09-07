import { clearAuthHintCookie, getCurrentUser, publicUser } from "../../../server/auth.js";
import { json, withApi } from "../../../server/http.js";
import { dailyLoginExperienceStatement } from "../../../server/experience.js";

export const onRequestGet = withApi(async ({ request, env }) => {
  const user = await getCurrentUser(env.DB, request);
  if (!user) {
    return json(
      { success: true, user: null },
      { headers: { "Set-Cookie": clearAuthHintCookie(env.ALLOW_INSECURE_DEV !== "true") } },
    );
  }
  const now = new Date().toISOString();
  await dailyLoginExperienceStatement(env.DB, user.id, now).run();
  const updated = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(user.id).first();
  return json({ success: true, user: publicUser(updated) });
});
