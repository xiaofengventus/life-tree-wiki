import { ApiError } from "./http.js";

export function cleanText(value, field, { minimum = 0, maximum = 200 } = {}) {
  const text = String(value ?? "").trim();
  const hasControlCharacter = Array.from(text).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127;
  });
  if (hasControlCharacter) {
    throw new ApiError(400, `${field}包含不允许的控制字符`, "INVALID_FIELD");
  }
  if (text.length < minimum || text.length > maximum) {
    throw new ApiError(
      400,
      `${field}长度必须在 ${minimum} 到 ${maximum} 个字符之间`,
      "INVALID_FIELD",
    );
  }
  return text;
}

export function validateUsername(value) {
  const username = cleanText(String(value ?? "").normalize("NFKC"), "用户名", {
    minimum: 3,
    maximum: 32,
  });
  if (!/^[\p{L}\p{N}_-]+$/u.test(username)) {
    throw new ApiError(400, "用户名只能包含文字、数字、下划线和短横线", "INVALID_USERNAME");
  }
  return username;
}

export function validatePassword(value) {
  const password = String(value ?? "");
  if (password.length < 12 || password.length > 128) {
    throw new ApiError(400, "密码长度必须在 12 到 128 个字符之间", "WEAK_PASSWORD");
  }
  if (!/[\p{L}]/u.test(password) || !/\p{N}/u.test(password)) {
    throw new ApiError(400, "密码至少需要包含一个字母和一个数字", "WEAK_PASSWORD");
  }
  return password;
}

export function validateTags(value) {
  if (!Array.isArray(value)) return [];
  const tags = value.slice(0, 10).map((tag) => cleanText(tag, "标签", { maximum: 30 }));
  return [...new Set(tags.filter(Boolean))];
}

export function validateLicense(value) {
  const allowed = new Set(["支持闭源", "CC BY-NC-SA 4.0", "CC BY 4.0"]);
  return allowed.has(value) ? value : "支持闭源";
}
