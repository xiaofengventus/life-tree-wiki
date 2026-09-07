export class ApiRequestError extends Error {
  constructor(message, status = 0, code = "NETWORK_ERROR") {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || 15000);
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(path, {
      ...options,
      headers,
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
      body:
        options.body === undefined || typeof options.body === "string"
          ? options.body
          : JSON.stringify(options.body),
    });
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    if (!response.ok) {
      throw new ApiRequestError(
        payload?.error || `请求失败（${response.status}）`,
        response.status,
        payload?.code || "REQUEST_FAILED",
      );
    }
    return payload;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    if (error?.name === "AbortError") {
      throw new ApiRequestError("请求超时，请检查网络后重试", 0, "TIMEOUT");
    }
    throw new ApiRequestError("网络连接失败，请稍后重试");
  } finally {
    clearTimeout(timeout);
  }
}
