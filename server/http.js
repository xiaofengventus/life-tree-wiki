export class ApiError extends Error {
  constructor(status, message, code = "REQUEST_FAILED") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", headers.get("Cache-Control") || "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export async function readJson(request, maximumBytes = 128 * 1024) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new ApiError(415, "请求必须使用 application/json", "INVALID_CONTENT_TYPE");
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > maximumBytes) {
    throw new ApiError(413, "请求内容过大", "PAYLOAD_TOO_LARGE");
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maximumBytes) {
    throw new ApiError(413, "请求内容过大", "PAYLOAD_TOO_LARGE");
  }

  try {
    return JSON.parse(text || "{}");
  } catch {
    throw new ApiError(400, "JSON 格式无效", "INVALID_JSON");
  }
}

export function withApi(handler) {
  return async (context) => {
    try {
      return await handler(context);
    } catch (error) {
      if (error instanceof ApiError) {
        return json(
          { success: false, error: error.message, code: error.code },
          { status: error.status },
        );
      }

      console.error("Unhandled API error", error);
      return json(
        { success: false, error: "服务器暂时无法处理请求", code: "INTERNAL_ERROR" },
        { status: 500 },
      );
    }
  };
}

export function requireSameOrigin(request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;

  const origin = request.headers.get("origin");
  const expectedOrigin = new URL(request.url).origin;
  if (origin === expectedOrigin) return;

  const path = new URL(request.url).pathname;
  const nativeClient = request.headers.get("x-life-client") === "life-sequence-android";
  const bearerToken = request.headers.get("authorization") || "";
  const nativeLogin = path === "/api/auth/mobile-exchange";
  if (nativeClient && (nativeLogin || /^Bearer [A-Za-z0-9_-]{20,100}$/.test(bearerToken))) {
    return;
  }

  throw new ApiError(403, "请求来源无效", "INVALID_ORIGIN");
}
