import { json, requireSameOrigin, withApi } from "../../server/http.js";

// CORS：安卓 App 的 WebView 运行在 https://localhost，访问 API 属于跨域，
// 且带 x-life-client / Authorization 自定义头会先发 OPTIONS 预检。
// 没有这些头的话 App 里所有请求都会在浏览器内核被拦（用户看到"网络请求失败"）。
// App 认证走 Bearer 头而非 cookie，使用通配符 origin 即可；
// 写操作安全仍由 requireSameOrigin 的原生白名单 + 限流兜底。
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-life-client, X-Image-Width, X-Image-Height, If-Match",
  "Access-Control-Expose-Headers": "ETag",
  "Access-Control-Max-Age": "86400",
};

export const onRequest = withApi(async (context) => {
  const { request } = context;

  if (!context.env.DB) {
    return json(
      { success: false, error: "D1 数据库尚未绑定", code: "DB_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  // 预检请求：不进业务逻辑，直接放行
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  requireSameOrigin(context.request);
  const response = await context.next();
  const secured = new Response(response.body, response);
  secured.headers.set("Cache-Control", secured.headers.get("Cache-Control") || "no-store");
  secured.headers.set("X-Content-Type-Options", "nosniff");
  secured.headers.set("X-Frame-Options", "DENY");
  secured.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  for (const [name, value] of Object.entries(CORS_HEADERS)) {
    secured.headers.set(name, value);
  }
  return secured;
});
