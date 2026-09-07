import { json, requireSameOrigin, withApi } from "../../server/http.js";

export const onRequest = withApi(async (context) => {
  if (!context.env.DB) {
    return json(
      { success: false, error: "D1 数据库尚未绑定", code: "DB_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  requireSameOrigin(context.request);
  const response = await context.next();
  const secured = new Response(response.body, response);
  secured.headers.set("Cache-Control", secured.headers.get("Cache-Control") || "no-store");
  secured.headers.set("X-Content-Type-Options", "nosniff");
  secured.headers.set("X-Frame-Options", "DENY");
  secured.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return secured;
});
