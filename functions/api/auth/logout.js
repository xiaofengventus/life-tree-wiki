import {
  clearAuthHintCookie,
  clearSessionCookie,
  revokeSession,
} from "../../../server/auth.js";
import { json, withApi } from "../../../server/http.js";

export const onRequestPost = withApi(async ({ request, env }) => {
  await revokeSession(env.DB, request);
  const secure = env.ALLOW_INSECURE_DEV !== "true";
  const headers = new Headers();
  headers.append("Set-Cookie", clearSessionCookie(secure));
  headers.append("Set-Cookie", clearAuthHintCookie(secure));
  return json({ success: true }, { headers });
});
