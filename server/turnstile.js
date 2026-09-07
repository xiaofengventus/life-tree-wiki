import { ApiError } from "./http.js";

export async function verifyTurnstile(env, request, responseToken) {
  if (env.ALLOW_INSECURE_DEV === "true") return;
  if (!env.TURNSTILE_SECRET) {
    throw new ApiError(503, "人机验证尚未配置", "TURNSTILE_NOT_CONFIGURED");
  }
  if (!responseToken) {
    throw new ApiError(400, "请完成人机验证", "TURNSTILE_REQUIRED");
  }

  const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET,
      response: responseToken,
      remoteip: request.headers.get("cf-connecting-ip") || undefined,
      idempotency_key: crypto.randomUUID(),
    }),
  });
  const payload = await result.json();
  if (!payload.success) {
    throw new ApiError(403, "人机验证失败，请重试", "TURNSTILE_FAILED");
  }
}
