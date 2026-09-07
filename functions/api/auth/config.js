import { getOrCreateDevice } from "../../../server/auth.js";
import { json, withApi } from "../../../server/http.js";

export const onRequestGet = withApi(async ({ request, env }) => {
  const device = getOrCreateDevice(request, { secure: env.ALLOW_INSECURE_DEV !== "true" });
  const headers = new Headers();
  if (device.setCookie) headers.append("Set-Cookie", device.setCookie);

  return json(
    {
      success: true,
      registrationMode: "invite-only",
      turnstileSiteKey: env.TURNSTILE_SITE_KEY || null,
      insecureDevelopmentMode: env.ALLOW_INSECURE_DEV === "true",
      minimumPasswordLength: 12,
    },
    { headers },
  );
});
